import { imageFormatDescriptions, sizes } from "./constants";

// pages/image-merger.tsx
export type ImageFormat = keyof typeof imageFormatDescriptions;

export type LoadedImage = {
  element: HTMLImageElement;
  size: number;
  type: string;
  name: string;
};

export type MergeDirection = "horizontal" | "vertical";

export type MergedImage = { url: string; size: number } | null;

export type Unit = keyof typeof sizes;
