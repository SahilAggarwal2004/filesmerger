import type { ImageFormat, DimensionStrategy, AudioFormat } from "./types";

// General
export const modes = ["simple", "advanced"] as const;

export const sizes = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 }; // In bytes

export const tools = {
  image: {
    title: "Image Merger",
    label: "Image",
    description: "Merge multiple images into a single output seamlessly.",
    href: "/image",
    mimetype: "image/*",
  },
  pdf: {
    title: "PDF Merger",
    label: "PDF",
    description: "Combine PDFs with full control over page selection and order.",
    href: "/pdf",
    mimetype: "application/pdf",
  },
  audio: {
    title: "Audio Merger",
    label: "Audio",
    description: "Merge multiple audio files into a single output seamlessly.",
    href: "/audio",
    mimetype: ".mp3,.wav,.m4a,.aac,.ogg",
  },
};

// Image
export const dimensionStrategyDescriptions = {
  minimum: "Minimum dimensions",
  maximum: "Maximum dimensions",
  original: "Original dimensions with background",
};

export const dimensionStrategies = Object.keys(dimensionStrategyDescriptions) as DimensionStrategy[];

export const imageFormatDescriptions = {
  jpeg: "JPEG (smaller size, lossy)",
  png: "PNG (larger size, lossless)",
  webp: "WebP (best compression, modern browsers)",
};

export const imageFormats = Object.keys(imageFormatDescriptions) as ImageFormat[];

export const mergeDirections = ["vertical", "horizontal"] as const;

// Audio
export const audioFormatDescriptions = {
  wav: "WAV (Uncompressed)",
  mp3: "MP3 (Compressed)",
};

export const audioFormats = Object.keys(audioFormatDescriptions) as AudioFormat[];
