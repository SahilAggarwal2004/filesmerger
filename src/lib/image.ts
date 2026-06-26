import type { Dimensions, DrawOperation, Grid, GridGroup, GridMergeOptions, ImageElement, ImageSelections, LoadedImage, ProcessedImage, Transform } from "@/types";
import { generateId, sum } from "@/lib/utils";

const createGrid = (rows: number, cols: number): Grid => Array.from({ length: rows }, () => Array(cols).fill(null));

export function getDimensionsAfterTransform(width: number, height: number, transform: Transform): Dimensions {
  switch (transform.type) {
    case "resize":
      const scale = transform.scaleFactor ?? 1;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      break;
    case "stretch":
      width = transform.targetWidth ?? width;
      height = transform.targetHeight ?? height;
      break;
    case "crop":
      width = transform.cropWidth ?? width - (transform.cropX ?? 0);
      height = transform.cropHeight ?? height - (transform.cropY ?? 0);
      break;
  }
  return { width: Math.max(1, width), height: Math.max(1, height) };
}

export const isVerticalRotation = (rotation: number) => rotation === 90 || rotation === 270;

function loadImage(file: File) {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);

  return new Promise<LoadedImage>((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const image = new Image();
      const src = e.target?.result as string;

      image.onload = () => {
        resolve({
          id: generateId(),
          element: image,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      };

      image.src = src;
    };

    reader.readAsDataURL(file);
  });
}

export function loadImages(files: FileList) {
  return Promise.all(Array.from(files).map(loadImage));
}

/**
 * Gapless scaling fill (minimum/maximum): groups images along the primary
 * axis, scales each group's secondary dimension to a shared size, then
 * scales all groups again so they share a common primary-axis size.
 */
function layoutScaledGroups(grid: Grid, numRows: number, numCols: number, isVertical: boolean, isMinimum: boolean) {
  const primaryCount = isVertical ? numCols : numRows;
  const secondaryCount = isVertical ? numRows : numCols;
  const pick = isMinimum ? Math.min : Math.max;

  const groups: GridGroup[] = [];
  for (let p = 0; p < primaryCount; p++) {
    const items: ProcessedImage[] = [];
    for (let s = 0; s < secondaryCount; s++) {
      const image = isVertical ? grid[s]![p] : grid[p]![s];
      if (image) items.push(image);
    }

    // "Shared size" = the common width (vertical) or height (horizontal) all images in this group are scaled to.
    const sharedSize = pick(...items.map((image) => (isVertical ? image.width : image.height)));
    const secondarySizes = items.map((image) => (isVertical ? image.height * (sharedSize / image.width) : image.width * (sharedSize / image.height)));
    groups.push({ items, sharedSize, secondarySizes, totalSecondary: sum(secondarySizes) });
  }

  const canvasSecondary = pick(...groups.map((group) => group.totalSecondary));

  const ops: DrawOperation[] = [];
  let primaryOffset = 0;

  groups.forEach((group) => {
    const scale = canvasSecondary / group.totalSecondary;
    const finalPrimarySize = group.sharedSize * scale;
    let secondaryOffset = 0;

    group.items.forEach((image, i) => {
      const finalSecondarySize = group.secondarySizes[i]! * scale;
      const x = isVertical ? primaryOffset : secondaryOffset;
      const y = isVertical ? secondaryOffset : primaryOffset;
      const width = isVertical ? finalPrimarySize : finalSecondarySize;
      const height = isVertical ? finalSecondarySize : finalPrimarySize;
      ops.push({ image: image.element, x, y, width, height });
      secondaryOffset += finalSecondarySize;
    });

    primaryOffset += finalPrimarySize;
  });

  return { ops, canvasWidth: isVertical ? primaryOffset : canvasSecondary, canvasHeight: isVertical ? canvasSecondary : primaryOffset };
}

/** Masonry fill: distributes items as evenly as possible across primary slots, filling each slot's secondary axis before moving to the next. */
function masonryFillGrid(images: ProcessedImage[], numRows: number, numCols: number, isVertical: boolean) {
  const grid = createGrid(numRows, numCols);
  const primaryCount = isVertical ? numCols : numRows;
  const itemsPerSlot = Math.floor(images.length / primaryCount);
  const extraItems = images.length % primaryCount;
  let i = 0;

  for (let p = 0; p < primaryCount; p++) {
    const slotSize = itemsPerSlot + (p < extraItems ? 1 : 0);
    for (let s = 0; s < slotSize; s++) {
      if (i >= images.length) break;
      const row = isVertical ? s : p;
      const col = isVertical ? p : s;
      grid[row]![col] = images[i]!;
      i++;
    }
  }

  return grid;
}

export async function mergeToCanvas(options: GridMergeOptions) {
  const { processedImages, mergeDirection, gridCount, dimensionStrategy, backgroundColor, outputFormat, quality } = options;

  const isVertical = mergeDirection === "vertical";
  const isOriginal = dimensionStrategy === "original";
  const isMinimum = dimensionStrategy === "minimum";
  const isUniform = dimensionStrategy === "uniform";

  // If vertical, gridCount defines columns. If horizontal, gridCount defines rows.
  const numCols = isVertical ? gridCount : Math.ceil(processedImages.length / gridCount);
  const numRows = isVertical ? Math.ceil(processedImages.length / gridCount) : gridCount;

  // Distribute items using Masonry layout for ALL strategies
  const grid = masonryFillGrid(processedImages, numRows, numCols, isVertical);

  const ops: DrawOperation[] = [];
  let canvasWidth = 0;
  let canvasHeight = 0;

  // UNIFORM (Exact grid, stretches to fill max dimensions)
  if (isUniform) {
    let cellWidth = 0;
    let cellHeight = 0;
    processedImages.forEach((image) => {
      cellWidth = Math.max(cellWidth, image.width);
      cellHeight = Math.max(cellHeight, image.height);
    });

    canvasWidth = cellWidth * numCols;
    canvasHeight = cellHeight * numRows;

    // Iterate through the balanced masonry grid positions
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const image = grid[row]![col];
        if (image) ops.push({ image: image.element, x: col * cellWidth, y: row * cellHeight, width: cellWidth, height: cellHeight });
      }
    }
  }
  // ORIGINAL (Cell-based, centers image & maintains aspect ratio)
  else if (isOriginal) {
    const colWidths = Array(numCols).fill(0);
    const rowHeights = Array(numRows).fill(0);

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const image = grid[row]![col];
        if (image) {
          colWidths[col] = Math.max(colWidths[col], image.width);
          rowHeights[row] = Math.max(rowHeights[row], image.height);
        }
      }
    }

    canvasWidth = sum(colWidths);
    canvasHeight = sum(rowHeights);

    let currentY = 0;
    for (let row = 0; row < numRows; row++) {
      let currentX = 0;
      for (let col = 0; col < numCols; col++) {
        const image = grid[row]![col];
        if (image) {
          // Center the image within its masonry allocated cell
          const cx = currentX + (colWidths[col] - image.width) / 2;
          const cy = currentY + (rowHeights[row] - image.height) / 2;
          ops.push({ image: image.element, x: cx, y: cy, width: image.width, height: image.height });
        }
        currentX += colWidths[col];
      }
      currentY += rowHeights[row];
    }
  }
  // MINIMUM & MAXIMUM (Gapless, scales to fit axes)
  else {
    const result = layoutScaledGroups(grid, numRows, numCols, isVertical, isMinimum);
    ops.push(...result.ops);
    canvasWidth = result.canvasWidth;
    canvasHeight = result.canvasHeight;
  }

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = Math.max(1, Math.round(canvasWidth));
  finalCanvas.height = Math.max(1, Math.round(canvasHeight));
  const ctx = finalCanvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create canvas context.");

  if ((isOriginal || isUniform) && backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  }

  // Draw offset eliminates any edge anti-aliasing gaps that might peek through in gapless modes
  const gapOffset = isOriginal || isUniform ? 0 : 0.5;

  ops.forEach((op) => {
    ctx.drawImage(op.image, op.x, op.y, op.width + gapOffset, op.height + gapOffset);
  });

  return new Promise<Blob>((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image blob."));
      },
      `image/${outputFormat}`,
      outputFormat === "png" ? undefined : quality,
    );
  });
}

export function processAdvancedImage(image: ImageElement, selection: AdvancedSelection<ImageSelections>): ProcessedImage {
  const { rotation, transforms } = selection;

  if (rotation !== 0) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to create canvas context.");

    const verticalRotation = isVerticalRotation(rotation);
    canvas.width = verticalRotation ? image.height : image.width;
    canvas.height = verticalRotation ? image.width : image.height;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    image = canvas;
  }

  for (const transform of transforms) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to create canvas context.");

    const { width, height } = getDimensionsAfterTransform(image.width, image.height, transform);
    canvas.width = width;
    canvas.height = height;

    switch (transform.type) {
      case "resize":
      case "stretch": {
        ctx.drawImage(image, 0, 0, width, height);
        break;
      }
      case "crop": {
        const rawCropX = transform.cropX ?? 0;
        const rawCropY = transform.cropY ?? 0;
        const cropX = Math.max(0, rawCropX);
        const cropY = Math.max(0, rawCropY);
        const offsetX = Math.max(0, -rawCropX);
        const offsetY = Math.max(0, -rawCropY);
        const cropWidth = Math.min(image.width - cropX, canvas.width - offsetX);
        const cropHeight = Math.min(image.height - cropY, canvas.height - offsetY);

        if (transform.fillColor && transform.fillColor !== "transparent") {
          ctx.fillStyle = transform.fillColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (cropWidth > 0 && cropHeight > 0) {
          ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, offsetX, offsetY, cropWidth, cropHeight);
        }

        break;
      }
    }

    image = canvas;
  }

  return { element: image, width: image.width, height: image.height };
}
