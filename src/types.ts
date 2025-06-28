/* eslint-disable @typescript-eslint/no-namespace */
import {
  imageFormatDescriptions,
  mergeDirections,
  sizes,
  dimensionStrategyDescriptions,
  modes,
  tools,
  audioFormatDescriptions,
  transformOptionDescriptions,
  rotationOptionDescriptions,
} from "./constants";

declare global {
  type Mode = (typeof modes)[number];
  type FileSelections<S = unknown, A = unknown> = { [key in Mode]: key extends "simple" ? Record<string, S> : Array<A> };
  type SimpleSelection<T extends FileSelections> = T["simple"][string];
  type AdvancedSelection<T extends FileSelections> = T["advanced"][number];

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
  tool: (typeof tools)[number];
  Icon: React.ElementType;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalSize: number;
};

// constants.ts
export type Constraint = { min: number; max?: number; step: number };

export type Constraints = { [key: string]: Constraint };

export type Tools = {
  [key: string]: { title: string; label: string; description: string; href: string; mimetype: string };
};

// pages/audio.tsx
export type AudioFormat = keyof typeof audioFormatDescriptions;

export type AudioSegment = { buffer: AudioBuffer; startTime: number; volume?: number };

export type AudioSelections = FileSelections<
  { range?: string; volume?: number; rate?: number },
  {
    id: string;
    audioIndex: number;
    range?: string;
    startAt?: number;
    volume?: number;
    rate?: number;
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
export type DimensionStrategy = keyof typeof dimensionStrategyDescriptions;

export type ImageFormat = keyof typeof imageFormatDescriptions;

export type ImageSelections = FileSelections<
  unknown,
  {
    id: string;
    imageIndex: number;
    transformOption: TransformOption;
    scaleFactor?: number;
    targetWidth?: number;
    targetHeight?: number;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    fillColor?: string;
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

export type TransformOption = keyof typeof transformOptionDescriptions;

export type Unit = keyof typeof sizes;

// pages/pdf.tsx
export type PDFFile = { id: string; file: File };

export type PDFSelections = FileSelections<{ range?: string; rotation: number }, { id: string; pdfIndex: number; range?: string; rotation: number }>;

export type RotationOption = keyof typeof rotationOptionDescriptions;

// pages/zip.tsx
export type FileToProcess = {
  file: File;
  isZip: boolean;
  extractTo?: string;
  include?: string;
};

export type ZipEntry = {
  name: string;
  input: ReadableStream<Uint8Array> | Uint8Array | Blob;
  lastModified?: Date;
};

export type ZipFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  isZip: boolean;
};

export type ZipSelections = FileSelections<
  string,
  {
    id: string;
    fileIndex: number;
    extractTo?: string;
    include?: string;
  }
>;
