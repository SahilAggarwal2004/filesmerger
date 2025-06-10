import { ImageSelections, LoadedImage, ProcessedImage } from "@/types";
import { generateId } from "./utils";

export function cropImage(image: HTMLImageElement, { x, y, width, height }: PartialAdvancedSelection<ImageSelections>): ProcessedImage {
  if (x ?? y ?? width ?? height) {
    const canvas = document.createElement("canvas");
    const cropX = Math.max(0, Math.min(x ?? 0, image.width));
    const cropY = Math.max(0, Math.min(y ?? 0, image.height));
    const cropWidth = Math.max(1, Math.min(width ?? image.width, image.width - cropX));
    const cropHeight = Math.max(1, Math.min(height ?? image.height, image.height - cropY));

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    return { element: canvas, width: canvas.width, height: canvas.height };
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
