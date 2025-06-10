/* eslint-disable @typescript-eslint/no-namespace */
import { imageFormatDescriptions, mergeDirections, sizes, dimensionStrategyDescriptions, modes, tools, audioFormatDescriptions } from "./constants";

declare global {
  type Mode = (typeof modes)[number];
  type FileSelections<S = unknown, A = unknown> = { [key in Mode]: key extends "simple" ? Record<string, S> : Array<A> };
  type PartialSimpleSelection<T extends FileSelections> = Partial<T["simple"][string]>;
  type PartialAdvancedSelection<T extends FileSelections> = Partial<T["advanced"][number]>;

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
export type AudioFormat = keyof typeof audioFormatDescriptions;

export type AudioSegment = { buffer: AudioBuffer; startTime: number; volume: number };

export type AudioSelections = FileSelections<
  { range: string; volume: number },
  {
    id: string;
    audioIndex: number;
    range: string;
    startAt?: number;
    volume?: number;
  }
>;

export type LoadedAudio = {
  id: string;
  file: File;
  name: string;
  url: string;
  size: number;
  duration: number;
};

// pages/image.tsx
export type ImageFormat = keyof typeof imageFormatDescriptions;

export type ImageSelections = FileSelections<
  unknown,
  {
    id: string;
    imageIndex: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
>;

export type LoadedImage = {
  id: string;
  element: HTMLImageElement;
  name: string;
  type: string;
  size: number;
};

export type MergeDirection = (typeof mergeDirections)[number];

export type MergedImage = { url: string; size: number } | null;

export type ProcessedImage = {
  element: HTMLCanvasElement | HTMLImageElement;
  width: number;
  height: number;
};

export type Unit = keyof typeof sizes;

export type DimensionStrategy = keyof typeof dimensionStrategyDescriptions;

// pages/pdf.tsx
export type PDFFile = { id: string; file: File };

export type PDFSelections = FileSelections<string, { id: string; pdfIndex: number; range: string }>;
