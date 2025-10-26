import { ImageElement, ImageSelections, LoadedImage, ProcessedImage, Transform } from "@/types";
import { generateId } from "./utils";

export function getDimensionsAfterTransform(width: number, height: number, transform: Transform) {
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

export function processAdvancedImage(image: ImageElement, selection: AdvancedSelection<ImageSelections>): ProcessedImage {
  const { rotation, transforms } = selection;

  if (rotation !== 0) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
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
    const ctx = canvas.getContext("2d")!;

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
        const cropWidth = canvas.width - offsetX;
        const cropHeight = canvas.height - offsetY;

        if (transform.fillColor && transform.fillColor !== "transparent") {
          ctx.fillStyle = transform.fillColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, offsetX, offsetY, cropWidth, cropHeight);
        break;
      }
    }

    image = canvas;
  }

  return { element: image, width: image.width, height: image.height };
}

function loadImage(file: File) {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise<LoadedImage>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => resolve({ id: generateId(), element: img, name: file.name, type: file.type, size: file.size });
    };
    reader.readAsDataURL(file);
  });
}

export function loadImages(files: FileList) {
  const imagePromises = Array.from(files).map(loadImage);
  return Promise.all(imagePromises);
}
