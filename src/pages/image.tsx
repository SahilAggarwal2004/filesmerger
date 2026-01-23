/* eslint-disable no-var */
/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { useState, useEffect, useMemo, isValidElement } from "react";
import { BsImages } from "react-icons/bs";
import ReorderList, { ReorderIcon } from "react-reorder-list";

import {
  imageFormatDescriptions,
  imageFormats,
  mergeDirections,
  dimensionStrategies,
  dimensionStrategyDescriptions,
  modes,
  transformOptions,
  transformOptionDescriptions,
  constraints,
  rotationOptions,
  rotationOptionDescriptions,
  colors,
  colorDescriptions,
} from "@/constants";
import { getDimensionsAfterTransform, isVerticalRotation, loadImages, processAdvancedImage } from "@/lib/image";
import { calcSize, download, formatFileSize, minmax, sum, generateId, normalize } from "@/lib/utils";
import { ImageFormat, LoadedImage, MergedImage, MergeDirection, DimensionStrategy, ImageSelections, ProcessedImage, TransformOption, Transform, Dimensions } from "@/types";
import FileDropZone from "@/components/FileDropZone";

const { scaleConstraints, targetWidthConstraints, targetHeightConstraints, cropXConstraints, cropYConstraints, cropWidthConstraints, cropHeightConstraints, qualityConstraints } =
  constraints;

function TransformStep({
  transform,
  transformIndex,
  dimensions,
  onUpdate,
  onRemove,
}: {
  transform: Transform;
  transformIndex: number;
  dimensions: Dimensions;
  onUpdate: (update: Partial<Transform>) => void;
  onRemove: () => void;
}) {
  const { width, height } = dimensions;

  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-2 gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Step {transformIndex + 1}: {transformOptionDescriptions[transform.type]}
        </span>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-xs shrink-0" aria-label="Remove transform">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {transform.type === "resize" ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Scale Factor</label>
            <input
              type="number"
              {...scaleConstraints}
              placeholder={`1 (${scaleConstraints.min} - ${scaleConstraints.max})`}
              defaultValue={transform.scaleFactor}
              onChange={(e) => onUpdate({ scaleFactor: normalize(e.target.value, scaleConstraints, 1) })}
              className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        ) : transform.type === "stretch" ? (
          <div className="grid grid-cols-1 2xs:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Width (px)</label>
              <input
                type="number"
                {...targetWidthConstraints}
                placeholder={width.toString()}
                defaultValue={transform.targetWidth}
                onChange={(e) => onUpdate({ targetWidth: normalize(e.target.value, targetWidthConstraints) })}
                className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Height (px)</label>
              <input
                type="number"
                {...targetHeightConstraints}
                placeholder={height.toString()}
                defaultValue={transform.targetHeight}
                onChange={(e) => onUpdate({ targetHeight: normalize(e.target.value, targetHeightConstraints) })}
                className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 2xs:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start X (px)</label>
                <input
                  type="number"
                  {...cropXConstraints}
                  placeholder="0"
                  defaultValue={transform.cropX}
                  onChange={(e) => onUpdate({ cropX: normalize(e.target.value, cropXConstraints) })}
                  className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Y (px)</label>
                <input
                  type="number"
                  {...cropYConstraints}
                  placeholder="0"
                  defaultValue={transform.cropY}
                  onChange={(e) => onUpdate({ cropY: normalize(e.target.value, cropYConstraints) })}
                  className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  {...cropWidthConstraints}
                  placeholder={width.toString()}
                  defaultValue={transform.cropWidth}
                  onChange={(e) => onUpdate({ cropWidth: normalize(e.target.value, cropWidthConstraints) })}
                  className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Height (px)</label>
                <input
                  type="number"
                  {...cropHeightConstraints}
                  placeholder={height.toString()}
                  defaultValue={transform.cropHeight}
                  onChange={(e) => onUpdate({ cropHeight: normalize(e.target.value, cropHeightConstraints) })}
                  className="w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Fill Color</label>
              <select
                value={transform.fillColor === "transparent" ? "transparent" : "color"}
                onChange={(e) => onUpdate({ fillColor: e.target.value === "transparent" ? "transparent" : "#ffffff" })}
                className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {colors.map((color) => (
                  <option key={color} value={color}>
                    {colorDescriptions[color]}
                  </option>
                ))}
              </select>
              {transform.fillColor !== "transparent" && (
                <input
                  type="color"
                  value={transform.fillColor}
                  onChange={(e) => onUpdate({ fillColor: e.target.value })}
                  className="h-7 w-12 rounded border border-slate-300 dark:border-slate-600"
                />
              )}
            </div>
          </>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Current: {width}×{height}px
        </p>
      </div>
    </div>
  );
}

function AdvancedImageSelection({
  selection,
  loadedImages,
  onUpdate,
  onRemove,
}: {
  selection: AdvancedSelection<ImageSelections>;
  loadedImages: LoadedImage[];
  onUpdate: (update: Partial<AdvancedSelection<ImageSelections>>) => void;
  onRemove: () => void;
}) {
  const { id, imageIndex, rotation, transforms } = selection;
  const { element } = loadedImages[imageIndex];
  const { width, height } = getDimensionsAfterStep(transforms.length - 1);

  function getDimensionsAfterStep(stepIndex: number) {
    let width = element.width;
    let height = element.height;

    if (isVerticalRotation(rotation)) [width, height] = [height, width];

    for (let i = 0; i <= stepIndex; i++) {
      const transform = transforms[i];
      if (!transform) break;

      const dimensions = getDimensionsAfterTransform(width, height, transform);
      width = dimensions.width;
      height = dimensions.height;
    }

    return { width, height };
  }

  function addTransform(type: TransformOption) {
    const newTransform: Transform = { type };
    if (newTransform.type === "crop") newTransform.fillColor = "transparent";
    onUpdate({ transforms: [...transforms, newTransform] });
  }

  function updateTransform(index: number, update: Partial<Transform>) {
    const newTransforms = [...transforms];
    newTransforms[index] = { ...newTransforms[index], ...update };
    onUpdate({ transforms: newTransforms });
  }

  function removeTransform(index: number) {
    onUpdate({ transforms: transforms.filter((_, i) => i !== index) });
  }

  return (
    <>
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Image</label>
          <select
            value={imageIndex}
            onChange={(e) => onUpdate({ imageIndex: +e.target.value })}
            className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
          >
            {loadedImages.map(({ name }, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Original: {element.width}×{element.height}px
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rotation</label>
          <select
            value={rotation}
            onChange={(e) => onUpdate({ rotation: +e.target.value })}
            className="w-full h-9 p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
          >
            {rotationOptions.map((option) => (
              <option key={option} value={option}>
                {rotationOptionDescriptions[option]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Transform Pipeline</label>
            <span className="text-xs text-slate-500 dark:text-slate-400 text-right">
              {transforms.length} step{transforms.length !== 1 ? "s" : ""}
            </span>
          </div>

          {transforms.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic py-2">No transforms applied. Add a transform below.</p>
          ) : (
            <ReorderList
              useOnlyIconToDrag
              watchChildrenUpdates
              animationDuration={200}
              props={{ className: "space-y-2" }}
              onPositionChange={({ newItems }) => {
                const reorderedTransforms = newItems.flatMap((item) => (isValidElement(item) ? transforms[+item.key!] : []));
                onUpdate({ transforms: reorderedTransforms });
              }}
            >
              {transforms.map((transform, index) => (
                <div key={index} className="flex items-start gap-1">
                  <ReorderIcon className="w-4 mt-2 shrink-0" />
                  <div className="flex-1">
                    <TransformStep
                      transform={transform}
                      transformIndex={index}
                      dimensions={getDimensionsAfterStep(index - 1)}
                      onUpdate={(update) => updateTransform(index, update)}
                      onRemove={() => removeTransform(index)}
                    />
                  </div>
                </div>
              ))}
            </ReorderList>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {transformOptions.map((option) => (
              <button
                key={option}
                onClick={() => addTransform(option)}
                className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700"
              >
                + {transformOptionDescriptions[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
          <p className="text-xs font-medium text-green-700 dark:text-green-300">
            Final Output: {width}×{height}px
          </p>
        </div>
      </div>

      <button onClick={onRemove} className="text-red-500 hover:text-red-700 w-5 mt-2 mx-0.5 2xs:mx-1.5 shrink-0" aria-label="Remove selection">
        ✕
      </button>
    </>
  );
}

export default function ImageMerger() {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
  const [selectedMode, setSelectedMode] = useState<Mode>("simple");
  const [advancedSelections, setAdvancedSelections] = useState<ImageSelections["advanced"]>([]);
  const [mergedImage, setMergedImage] = useState<MergedImage>(null);
  const [mergeDirection, setMergeDirection] = useState<MergeDirection>("vertical");
  const [dimensionStrategy, setDimensionStrategy] = useState<DimensionStrategy>("minimum");
  const [outputFormat, setOutputFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(0.8);
  const [backgroundColor, setBackgroundColor] = useState("transparent");

  const totalSize = useMemo(() => calcSize(loadedImages), [loadedImages]);
  const isOriginal = dimensionStrategy === "original";

  const handleAdvancedUpdate = (id: string, update: Partial<AdvancedSelection<ImageSelections>>) =>
    setAdvancedSelections((prev) => prev.map((sel) => (sel.id === id ? { ...sel, ...update } : sel)));

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files?.length) {
      setMergedImage(null);
      loadImages(files).then((images) => setLoadedImages((prev) => prev.concat(images.filter((img) => img !== null))));
    }
    event.target.value = "";
  }

  function removeFile(id: string) {
    setLoadedImages((prev) => prev.filter((file) => file.id !== id));
    setAdvancedSelections([]);
  }

  function mergeImages() {
    const canvas = document.createElement("canvas");
    const isHorizontal = mergeDirection === "horizontal";
    const isMinimum = dimensionStrategy === "minimum";

    let processedImages: ProcessedImage[];

    if (selectedMode === "simple") processedImages = loadedImages.map(({ element }) => ({ element, width: element.width, height: element.height }));
    else processedImages = advancedSelections.map((selection) => processAdvancedImage(loadedImages[selection.imageIndex].element, selection)).filter((image) => image !== null);

    if (!processedImages.length) return;

    if (isHorizontal) {
      var canvasHeight = isMinimum ? Infinity : 0;
      processedImages.forEach(({ height }) => (canvasHeight = minmax(canvasHeight, height, isMinimum)));
      var widths = processedImages.map(({ width, height }) => (isOriginal ? width : (width * canvasHeight) / height));
      var canvasWidth = sum(widths);
    } else {
      canvasWidth = isMinimum ? Infinity : 0;
      processedImages.forEach(({ width }) => (canvasWidth = minmax(canvasWidth, width, isMinimum)));
      var heights = processedImages.map(({ width, height }) => (isOriginal ? height : (height * canvasWidth) / width));
      canvasHeight = sum(heights);
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return alert("Unable to create canvas context. Please try a different browser.");

    if (isOriginal && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (isHorizontal) {
      let offset = 0;
      processedImages.forEach(({ element, height }, index) => {
        if (isOriginal) ctx.drawImage(element, offset, (canvasHeight - height) / 2, widths[index], height);
        else ctx.drawImage(element, offset, 0, widths[index], canvasHeight);
        offset += widths[index];
      });
    } else {
      let offset = 0;
      processedImages.forEach(({ element, width }, index) => {
        if (isOriginal) ctx.drawImage(element, (canvasWidth - width) / 2, offset, width, heights[index]);
        else ctx.drawImage(element, 0, offset, canvasWidth, heights[index]);
        offset += heights[index];
      });
    }

    canvas.toBlob(
      (blob) => {
        if (blob) setMergedImage({ url: URL.createObjectURL(blob), size: blob.size });
        else alert("Failed to create image. Please try again with different images or format.");
      },
      `image/${outputFormat}`,
      outputFormat === "png" ? undefined : quality,
    );
  }

  function clearAll() {
    setLoadedImages([]);
    setAdvancedSelections([]);
    setMergedImage(null);
  }

  useEffect(() => {
    return () => {
      if (mergedImage) URL.revokeObjectURL(mergedImage.url);
    };
  }, [mergedImage]);

  return (
    <>
      <Head>
        <title>Image Merger | FilesMerger</title>
      </Head>

      <main className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-5">
              <h1 className="text-3xl font-bold text-white">Image Merger</h1>
            </div>

            <div className="p-5 space-y-8">
              <FileDropZone tool="image" Icon={BsImages} handleFileChange={handleFileChange} totalSize={totalSize} />

              {loadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {modes.map((mode) => (
                      <button
                        key={mode}
                        className={`px-4 py-2 rounded-lg text-sm font-medium shadow capitalize ${
                          mode === selectedMode ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 dark:text-white"
                        }`}
                        onClick={() => setSelectedMode(mode)}
                      >
                        {mode} Mode
                      </button>
                    ))}
                  </div>

                  {selectedMode === "simple" ? (
                    <div className="space-y-2">
                      <ReorderList
                        useOnlyIconToDrag
                        watchChildrenUpdates
                        animationDuration={200}
                        props={{ className: "grid grid-cols-1 2xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" }}
                        onPositionChange={({ newItems }) => {
                          const reorderedImages = newItems.flatMap((item) => (isValidElement(item) ? loadedImages.find(({ id }) => item.key === id)! : []));
                          setLoadedImages(reorderedImages);
                        }}
                      >
                        {loadedImages.map(({ id, element, name, size }, index) => (
                          <div key={id} className="relative group">
                            <ReorderIcon className="absolute top-1 left-1 z-10 cursor-grab rounded-full scale-90 p-1 shadow bg-white/50 dark:bg-slate-900/50" />
                            <button
                              onClick={() => removeFile(id)}
                              className="absolute top-1.5 right-1 z-10 text-red-500 hover:text-red-700 rounded-full w-6 h-6 flex items-center justify-center shadow bg-white/50 dark:bg-slate-900/50"
                              aria-label="Remove image"
                            >
                              ✕
                            </button>
                            <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                              <img src={element.src} alt={`Preview ${index}`} className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <p className="truncate">{name}</p>
                              <p>
                                {element.width}×{element.height} • {formatFileSize(size)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </ReorderList>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ReorderList
                        useOnlyIconToDrag
                        watchChildrenUpdates
                        animationDuration={200}
                        props={{ className: "space-y-2" }}
                        onPositionChange={({ newItems }) => {
                          const reorderedSelections = newItems.flatMap((item) => (isValidElement(item) ? advancedSelections.find(({ id }) => item.key === id)! : []));
                          setAdvancedSelections(reorderedSelections);
                        }}
                      >
                        {advancedSelections.map((selection) => (
                          <div key={selection.id} className="flex items-start py-2 border rounded-xl shadow-sm text-sm bg-white dark:bg-slate-800">
                            <ReorderIcon className="w-5 mt-2 mx-0.5 2xs:mx-1.5 shrink-0" />
                            <AdvancedImageSelection
                              selection={selection}
                              loadedImages={loadedImages}
                              onUpdate={(update) => handleAdvancedUpdate(selection.id, update)}
                              onRemove={() => setAdvancedSelections((prev) => prev.filter((sel) => sel.id !== selection.id))}
                            />
                          </div>
                        ))}
                      </ReorderList>
                      <button
                        onClick={() => setAdvancedSelections((prev) => [...prev, { id: generateId(), imageIndex: 0, rotation: 0, transforms: [] }])}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg shadow text-sm"
                      >
                        + Add Image Selection
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Merge Direction</label>
                    <div className="flex space-x-4">
                      {mergeDirections.map((direction) => (
                        <label key={direction} className="flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600 focus:ring-blue-500"
                            value={direction}
                            checked={mergeDirection === direction}
                            onChange={() => setMergeDirection(direction)}
                          />
                          <span className="ml-2 text-slate-700 dark:text-slate-300 capitalize">{direction}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dimension Handling</label>
                    <div className="space-y-2">
                      {dimensionStrategies.map((strategy) => (
                        <label key={strategy} className="flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600 focus:ring-blue-500"
                            value={strategy}
                            checked={dimensionStrategy === strategy}
                            onChange={() => setDimensionStrategy(strategy)}
                          />
                          <span className="ml-2 text-slate-700 dark:text-slate-300">{dimensionStrategyDescriptions[strategy]}</span>
                        </label>
                      ))}

                      {isOriginal && (
                        <div className="ml-6 mt-2 flex flex-col space-y-2 xs:space-x-3 xs:space-y-0 xs:flex-row xs:items-center">
                          <label className="block text-sm text-slate-600 dark:text-slate-400">Background Color</label>
                          <div className="flex items-center space-x-3">
                            <select
                              value={backgroundColor === "transparent" ? "transparent" : "color"}
                              onChange={(e) => setBackgroundColor(e.target.value === "transparent" ? "transparent" : "#ffffff")}
                              className="h-7 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                              {colors.map((color) => (
                                <option key={color} value={color}>
                                  {colorDescriptions[color]}
                                </option>
                              ))}
                            </select>
                            {backgroundColor !== "transparent" && (
                              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-7 w-12 p-0 rounded" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Output Format</label>
                    <select
                      className="mt-1 block w-full h-9 pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-white"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as ImageFormat)}
                    >
                      {imageFormats.map((format) => (
                        <option key={format} value={format}>
                          {imageFormatDescriptions[format]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {outputFormat !== "png" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quality: {quality}</label>
                      <input
                        type="range"
                        {...qualityConstraints}
                        value={quality}
                        onChange={(e) => setQuality(normalize(e.target.value, qualityConstraints)!)}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  disabled={selectedMode === "simple" ? !loadedImages.length : !advancedSelections.length}
                  onClick={mergeImages}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Merge Images
                </button>
                <button
                  disabled={!mergedImage}
                  onClick={() => download(mergedImage!.url, `merged.${outputFormat}`)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Download Result
                </button>
                <button
                  disabled={!loadedImages.length}
                  onClick={clearAll}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:text-slate-400 dark:disabled:text-slate-600 rounded-lg shadow-sm transition-colors disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>

              {mergedImage && (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">File Size Analysis</h3>
                    <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                      <p>Original images: {formatFileSize(totalSize)}</p>
                      <p>
                        Merged image: {formatFileSize(mergedImage.size)} ({Math.round((mergedImage.size / totalSize) * 100)}%)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Merged Result</h3>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 p-4">
                      <img src={mergedImage.url} alt="Merged result" className="max-w-full h-auto mx-auto" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
