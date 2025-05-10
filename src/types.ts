import { imageFormatDescriptions, mergeDirections, sizes, dimensionStrategyDescriptions, modes } from "./constants";

// pages/image.tsx
export type ImageFormat = keyof typeof imageFormatDescriptions;

export type LoadedImage = {
  element: HTMLImageElement;
  size: number;
  type: string;
  name: string;
};

export type MergeDirection = (typeof mergeDirections)[number];

export type MergedImage = { url: string; size: number } | null;

export type Unit = keyof typeof sizes;

export type DimensionStrategy = keyof typeof dimensionStrategyDescriptions;

// pages/pdf.tsx
export type Mode = (typeof modes)[number];

export type Selections = { [key in Mode]: key extends "simple" ? { [key: string]: string } : { id: string; pdfIndex: number; range: string }[] };
