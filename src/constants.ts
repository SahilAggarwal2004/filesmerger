import type { ImageFormat, DimensionStrategy, AudioFormat, Tools, Constraints, TransformOption, RotationOption } from "./types";

// General
export const constraints: Constraints = {
  scaleConstraints: { min: 0.1, max: 10, step: 0.1 },
  targetWidthConstraints: { min: 1, step: 1 },
  targetHeightConstraints: { min: 1, step: 1 },
  cropXConstraints: { min: 0, step: 1 },
  cropYConstraints: { min: 0, step: 1 },
  cropWidthConstraints: { min: 1, step: 1 },
  cropHeightConstraints: { min: 1, step: 1 },
  qualityConstraints: { min: 0.1, max: 1, step: 0.1 },
  volumeConstraints: { min: 0, max: 2, step: 0.1 },
  rateConstraints: { min: 0.25, max: 3, step: 0.05 },
  startAtConstraints: { min: 0, step: 0.1 },
  bitrateConstraints: { min: 64, max: 320, step: 32 },
};

export const modes = ["simple", "advanced"] as const;

export const sizes = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 }; // In bytes

export const toolsInfo: Tools = {
  image: {
    title: "Image Merger",
    label: "Image Files",
    description: "Merge multiple images into a single output seamlessly.",
    href: "/image",
    mimetype: "image/*",
  },
  pdf: {
    title: "PDF Merger",
    label: "PDF Files",
    description: "Combine PDFs with full control over page selection and order.",
    href: "/pdf",
    mimetype: "application/pdf",
  },
  audio: {
    title: "Audio Merger",
    label: "Audio Files",
    description: "Merge multiple audio files into a single output seamlessly.",
    href: "/audio",
    mimetype: ".mp3,.wav,.m4a,.aac,.ogg",
  },
  zip: {
    title: "ZIP Merger",
    label: "Files",
    description: "Merge ZIP and other files into a single .zip archive.",
    href: "/zip",
    mimetype: "*/*",
  },
};

export const tools = Object.keys(toolsInfo);

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

export const transformOptionDescriptions = {
  resize: "Resize (Scale)",
  stretch: "Stretch/Shrink",
  crop: "Crop/Fill",
};

export const transformOptions = Object.keys(transformOptionDescriptions) as TransformOption[];

// PDF
export const rotationOptionDescriptions = {
  0: "No Rotation",
  90: "90° Clockwise",
  180: "180°",
  270: "270° Clockwise (90° Counter-clockwise)",
};

export const rotationOptions = Object.keys(rotationOptionDescriptions).map(Number) as RotationOption[];

// Audio
export const audioFormatDescriptions = {
  wav: "WAV (Uncompressed)",
  mp3: "MP3 (Compressed)",
};

export const audioFormats = Object.keys(audioFormatDescriptions) as AudioFormat[];
