import { LoadedImage } from "@/types";
import { generateId } from "./utils";

function loadImage(file: File) {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise<LoadedImage>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => resolve({ id: generateId(), element: img, size: file.size, type: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  });
}

export function loadImages(files: FileList) {
  const imagePromises = Array.from(files).map(loadImage);
  return Promise.all(imagePromises);
}
