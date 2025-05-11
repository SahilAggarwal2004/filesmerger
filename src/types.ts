import { imageFormatDescriptions, mergeDirections, sizes, dimensionStrategyDescriptions, modes, tools } from "./constants";

// components/FileDropZone.tsx
export type FileDropZoneProps = {
  tool: keyof typeof tools;
  Icon: React.ElementType;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalSize: number;
};

// pages/image.tsx
export type ImageFormat = keyof typeof imageFormatDescriptions;

export type LoadedImage = {
  id: string;
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

export type PDFFile = { id: string; file: File };

export type Selections = { [key in Mode]: key extends "simple" ? { [key: string]: string } : { id: string; pdfIndex: number; range: string }[] };
