import { ImageSelections, LoadedImage, ProcessedImage } from "@/types";
import { generateId } from "./utils";

export function processAdvancedImage(image: HTMLImageElement, selection: AdvancedSelection<ImageSelections>): ProcessedImage {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create canvas context");

  switch (selection.transformOption) {
    case "resize": {
      const scale = selection.scaleFactor ?? 1;
      const newWidth = Math.round(image.width * scale);
      const newHeight = Math.round(image.height * scale);
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(image, 0, 0, newWidth, newHeight);
      break;
    }
    case "stretch": {
      const newWidth = selection.targetWidth ?? image.width;
      const newHeight = selection.targetHeight ?? image.height;
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(image, 0, 0, newWidth, newHeight);
      break;
    }
    case "crop": {
      const cropX = Math.max(0, Math.min(selection.cropX ?? 0, image.width));
      const cropY = Math.max(0, Math.min(selection.cropY ?? 0, image.height));
      const cropWidth = Math.max(1, selection.cropWidth ?? image.width - cropX);
      const cropHeight = Math.max(1, selection.cropHeight ?? image.height - cropY);

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      if (selection.fillColor) {
        ctx.fillStyle = selection.fillColor;
        ctx.fillRect(0, 0, cropWidth, cropHeight);
      }

      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      break;
    }
  }

  return { element: canvas, width: canvas.width, height: canvas.height };
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
