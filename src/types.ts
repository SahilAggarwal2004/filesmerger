/* eslint-disable @typescript-eslint/no-namespace */
import { imageFormatDescriptions, mergeDirections, sizes, dimensionStrategyDescriptions, modes, tools, audioFormatDescriptions } from "./constants";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
  namespace lamejs {
    class Mp3Encoder {
      constructor(channels: number, sampleRate: number, kbps: number);
      encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
      flush(): Uint8Array;
    }
  }
}

// components/FileDropZone.tsx
export type FileDropZoneProps = {
  tool: keyof typeof tools;
  Icon: React.ElementType;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalSize: number;
};

// pages/audio.tsx
export type LoadedAudio = {
  id: string;
  file: File;
  name: string;
  url: string;
  size: number;
  duration: number;
};

export type AudioFormat = keyof typeof audioFormatDescriptions;

export type AudioSelections = {
  simple: Record<string, string>;
  advanced: Array<{
    id: string;
    audioIndex: number;
    range: string;
    startAt?: number;
  }>;
};

// pages/image.tsx
export type ImageFormat = keyof typeof imageFormatDescriptions;

export type LoadedImage = {
  id: string;
  element: HTMLImageElement;
  name: string;
  type: string;
  size: number;
};

export type MergeDirection = (typeof mergeDirections)[number];

export type MergedImage = { url: string; size: number } | null;

export type Unit = keyof typeof sizes;

export type DimensionStrategy = keyof typeof dimensionStrategyDescriptions;

// pages/pdf.tsx
export type Mode = (typeof modes)[number];

export type PDFFile = { id: string; file: File };

export type Selections = { [key in Mode]: key extends "simple" ? { [key: string]: string } : { id: string; pdfIndex: number; range: string }[] };
