import { minImageDimension, toolsInfo } from "@/constants";
import { clamp, generateId, hasExtension, sum } from "@/lib/utils";
import type { AspectRatio, CropHandle, CropRect, Dimensions, DrawOperation, Grid, GridGroup, GridMergeOptions, ImageElement, ImageSelections, LoadedImage, ProcessedImage, Transform } from "@/types";

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
  return { width: Math.max(minImageDimension, width), height: Math.max(minImageDimension, height) };
}

/** Numeric width/height ratio of an aspect ratio option, or undefined when free. */
export function getAspectRatioValue(aspectRatio: AspectRatio, { width, height }: Dimensions) {
  if (aspectRatio === "free") return undefined;
  if (aspectRatio === "original") return width / height;
  const [w, h] = aspectRatio.split(":").map(Number);
  return w! / h!;
}

/** Builds the starting crop rectangle for the visual editor from an existing crop step (or the full image), clamped inside the image bounds. */
export function getInitialCropRect(transform: Extract<Transform, { type: "crop" }> | undefined, width: number, height: number): CropRect {
  const full = { x: 0, y: 0, width, height };
  if (!transform) return full;

  const x = clamp(transform.cropX ?? 0, 0, width - minImageDimension);
  const y = clamp(transform.cropY ?? 0, 0, height - minImageDimension);
  const rectWidth = clamp(transform.cropWidth ?? width - x, minImageDimension, width - x);
  const rectHeight = clamp(transform.cropHeight ?? height - y, minImageDimension, height - y);
  return { x, y, width: rectWidth, height: rectHeight };
}

export function moveCropRect(start: CropRect, dx: number, dy: number, bounds: Dimensions): CropRect {
  return {
    ...start,
    x: clamp(start.x + dx, 0, bounds.width - start.width),
    y: clamp(start.y + dy, 0, bounds.height - start.height),
  };
}

/** Shrinks (never grows) a rectangle around its center so that it matches the aspect ratio. */
export function fitCropRectToRatio(rect: CropRect, ratio: number): CropRect {
  const width = Math.min(rect.width, rect.height * ratio);
  const height = width / ratio;
  return { x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height };
}

/** Resizes a rectangle by dragging one of its handles to (px, py), staying inside the bounds and optionally keeping an aspect ratio. */
export function resizeCropRect(start: CropRect, handle: CropHandle, px: number, py: number, bounds: Dimensions, ratio?: number): CropRect {
  const { width: maxW, height: maxH } = bounds;
  const left = handle.includes("w");
  const right = handle.includes("e");
  const top = handle.includes("n");
  const bottom = handle.includes("s");
  const endX = start.x + start.width;
  const endY = start.y + start.height;
  const pointerX = clamp(px, 0, maxW);
  const pointerY = clamp(py, 0, maxH);

  let { x, y, width, height } = start;
  if (left) {
    x = Math.min(pointerX, endX - minImageDimension);
    width = endX - x;
  }
  if (right) width = Math.max(pointerX - start.x, minImageDimension);
  if (top) {
    y = Math.min(pointerY, endY - minImageDimension);
    height = endY - y;
  }
  if (bottom) height = Math.max(pointerY - start.y, minImageDimension);

  if (!ratio) return { x, y, width, height };

  const minWidth = Math.max(minImageDimension, minImageDimension * ratio);

  if ((left || right) && (top || bottom)) {
    // Corner: the opposite corner stays fixed.
    const anchorX = left ? endX : start.x;
    const anchorY = top ? endY : start.y;
    const availableWidth = left ? anchorX : maxW - anchorX;
    const availableHeight = top ? anchorY : maxH - anchorY;
    const newWidth = Math.max(Math.min(Math.max(width, height * ratio), availableWidth, availableHeight * ratio), Math.min(minWidth, availableWidth));
    const newHeight = newWidth / ratio;
    return { x: left ? anchorX - newWidth : anchorX, y: top ? anchorY - newHeight : anchorY, width: newWidth, height: newHeight };
  }

  if (left || right) {
    // Horizontal edge: the opposite edge stays fixed, height follows width around the vertical center.
    const centerY = start.y + start.height / 2;
    const limit = Math.min(left ? endX : maxW - start.x, 2 * Math.min(centerY, maxH - centerY) * ratio);
    const newWidth = Math.min(Math.max(width, minWidth), limit);
    const newHeight = newWidth / ratio;
    return { x: left ? endX - newWidth : start.x, y: centerY - newHeight / 2, width: newWidth, height: newHeight };
  }

  // Vertical edge: the opposite edge stays fixed, width follows height around the horizontal center.
  const centerX = start.x + start.width / 2;
  const limit = Math.min(top ? endY : maxH - start.y, (2 * Math.min(centerX, maxW - centerX)) / ratio);
  const newHeight = Math.min(Math.max(height, minWidth / ratio), limit);
  const newWidth = newHeight * ratio;
  return { x: centerX - newWidth / 2, y: top ? endY - newHeight : start.y, width: newWidth, height: newHeight };
}

/** Rounds a rectangle to whole pixels while keeping it inside the bounds. */
export function roundCropRect(rect: CropRect, bounds: Dimensions): CropRect {
  const x = clamp(Math.round(rect.x), 0, bounds.width - minImageDimension);
  const y = clamp(Math.round(rect.y), 0, bounds.height - minImageDimension);
  return {
    x,
    y,
    width: clamp(Math.round(rect.width), minImageDimension, bounds.width - x),
    height: clamp(Math.round(rect.height), minImageDimension, bounds.height - y),
  };
}

export const isVerticalRotation = (rotation: number) => rotation === 90 || rotation === 270;

function loadImage(file: File) {
  if (!hasExtension(file, toolsInfo.image.extensions)) return Promise.resolve(null);

  return new Promise<LoadedImage | null>((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => resolve(null);

    reader.onload = (e) => {
      const image = new Image();
      const src = e.target?.result as string;

      image.onerror = () => resolve(null);

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

export function loadImages(files: FileList | File[]) {
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
  finalCanvas.width = Math.max(minImageDimension, Math.round(canvasWidth));
  finalCanvas.height = Math.max(minImageDimension, Math.round(canvasHeight));
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
