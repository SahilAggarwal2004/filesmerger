import type { ImageFormat, DimensionStrategy, AudioFormat, Constraints, TransformOption, RotationOption, Color, Tool, ToolsInfo } from "./types";

// General
export const constraints = {
  gridCountConstraints: { min: 1, step: 1 },
  scaleConstraints: { min: 0.001, max: 10, step: 0.001 },
  targetWidthConstraints: { min: 1, step: 1 },
  targetHeightConstraints: { min: 1, step: 1 },
  cropXConstraints: { step: 1 },
  cropYConstraints: { step: 1 },
  cropWidthConstraints: { min: 1, step: 1 },
  cropHeightConstraints: { min: 1, step: 1 },
  qualityConstraints: { min: 0.1, max: 1, step: 0.1 },
  volumeConstraints: { min: 0, max: 2, step: 0.1 },
  rateConstraints: { min: 0.25, max: 3, step: 0.05 },
  startAtConstraints: { min: 0, step: 0.1 },
  bitrateConstraints: { min: 64, max: 320, step: 32 },
} satisfies Constraints;

export const modes = ["simple", "advanced"] as const;

export const sizes = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 }; // In bytes

const time = { millisecond: 1, second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

export const toolsInfo: ToolsInfo = {
  image: {
    title: "Image Merger",
    label: "Image Files",
    description: "Merge multiple images into a single output seamlessly.",
    href: "/image",
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif"],
  },
  pdf: {
    title: "PDF Merger",
    label: "PDF Files",
    description: "Combine PDFs with full control over page selection and order.",
    href: "/pdf",
    extensions: [".pdf"],
  },
  audio: {
    title: "Audio Merger",
    label: "Audio Files",
    description: "Merge multiple audio files into a single output seamlessly.",
    href: "/audio",
    extensions: [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".opus"],
  },
  zip: {
    title: "ZIP Merger",
    label: "Files",
    description: "Merge ZIP and other files into a single .zip archive.",
    href: "/zip",
    extensions: [],
  },
};

export const tools = Object.keys(toolsInfo) as Tool[];

// Share Target
export const shareTargetCacheName = "filesmerger-shares";

export const shareTargetMaxWaitMs = 1 * time.minute;

export const shareTargetPollIntervalMs = 400 * time.millisecond;

export const shareTargetStaleEntryMaxAgeMs = 5 * time.minute;

// Image
export const colorDescriptions = {
  transparent: "Transparent",
  color: "Color",
};

export const colors = Object.keys(colorDescriptions) as Color[];

export const dimensionStrategyDescriptions = {
  minimum: "Minimum dimensions",
  maximum: "Maximum dimensions",
  original: "Original dimensions with background fill",
  uniform: "Uniform cells with background fill",
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
