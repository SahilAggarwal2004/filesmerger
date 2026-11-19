import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  aspectRatioDescriptions,
  aspectRatios,
  constraints,
  minImageDimension,
} from "@/constants";
import {
  fitCropRectToRatio,
  getAspectRatioValue,
  moveCropRect,
  resizeCropRect,
  roundCropRect,
} from "@/lib/image";
import { clamp } from "@/lib/utils";
import type {
  AspectRatio,
  Constraint,
  CropHandle,
  CropRect,
  ImageElement,
} from "@/types";

const {
  cropXConstraints,
  cropYConstraints,
  cropWidthConstraints,
  cropHeightConstraints,
} = constraints;

type DragState = {
  mode: "move" | CropHandle;
  start: CropRect;
  pointerX: number;
  pointerY: number;
};

const handles: {
  handle: CropHandle;
  style: React.CSSProperties;
  cursor: string;
}[] = [
  { handle: "nw", style: { left: 0, top: 0 }, cursor: "nwse-resize" },
  { handle: "n", style: { left: "50%", top: 0 }, cursor: "ns-resize" },
  { handle: "ne", style: { left: "100%", top: 0 }, cursor: "nesw-resize" },
  { handle: "e", style: { left: "100%", top: "50%" }, cursor: "ew-resize" },
  { handle: "se", style: { left: "100%", top: "100%" }, cursor: "nwse-resize" },
  { handle: "s", style: { left: "50%", top: "100%" }, cursor: "ns-resize" },
  { handle: "sw", style: { left: 0, top: "100%" }, cursor: "nesw-resize" },
  { handle: "w", style: { left: 0, top: "50%" }, cursor: "ew-resize" },
];

const inputClass =
  "w-full h-8 px-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white";

function NumberField({
  label,
  value,
  constraint,
  onCommit,
}: {
  label: string;
  value: number;
  constraint: Constraint;
  onCommit: (value: number) => number;
}) {
  const [draft, setDraft] = useState<{ text: string; value: number } | null>(null);
  const displayed =
    draft && draft.value === value ? draft.text : String(Math.round(value));

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        type="number"
        {...constraint}
        value={displayed}
        onChange={(e) => {
          const text = e.target.value;
          if (text === "") {
            setDraft({ text, value });
            return;
          }
          const parsed = +text;
          if (!Number.isFinite(parsed)) return;
          const applied = onCommit(parsed);
          // Show the clamped result whenever typing was adjusted, so the field can
          // never display a value the crop rect doesn't actually have.
          setDraft({
            text: applied === parsed ? text : String(applied),
            value: applied,
          });
        }}
        onBlur={() => setDraft(null)}
        className={inputClass}
      />
    </div>
  );
}

export default function ImageEditor({
  image,
  initialCrop,
  onApply,
  onCancel,
}: {
  image: ImageElement;
  initialCrop: CropRect;
  onApply: (crop: CropRect) => void;
  onCancel: () => void;
}) {
  const { width, height } = image;
  const bounds = { width, height };

  const [rect, setRect] = useState<CropRect>(initialCrop);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [scale, setScale] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const ratio = getAspectRatioValue(aspectRatio, bounds);
  const output = roundCropRect(rect, bounds);

  useEffect(() => {
    canvasRef.current?.getContext("2d")?.drawImage(image, 0, 0);
  }, [image]);

  useLayoutEffect(() => {
    function updateScale() {
      const area = areaRef.current;
      if (!area) return;
      const maxWidth = Math.max(120, area.clientWidth);
      const maxHeight = Math.max(120, window.innerHeight * 0.5);
      setScale(Math.min(4, maxWidth / width, maxHeight / height));
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width, height]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function toImagePoint(e: React.PointerEvent) {
    const box = stageRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * width,
      y: ((e.clientY - box.top) / box.height) * height,
    };
  }

  function startDrag(
    e: React.PointerEvent<HTMLElement>,
    mode: DragState["mode"],
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toImagePoint(e);
    dragRef.current = { mode, start: rect, pointerX: x, pointerY: y };
  }

  function onDrag(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;

    const { x, y } = toImagePoint(e);
    if (drag.mode === "move")
      setRect(
        moveCropRect(drag.start, x - drag.pointerX, y - drag.pointerY, bounds),
      );
    else setRect(resizeCropRect(drag.start, drag.mode, x, y, bounds, ratio));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function changeAspectRatio(next: AspectRatio) {
    setAspectRatio(next);
    const nextRatio = getAspectRatioValue(next, bounds);
    if (nextRatio) setRect((prev) => fitCropRectToRatio(prev, nextRatio));
  }

  // Typing exact numbers is always free-form, so it releases any aspect ratio lock.
  // Returns the clamped value applied to `field`, so the input can display it.
  function setField(field: keyof CropRect, value: number): number {
    setAspectRatio("free");
    const next = { ...rect, [field]: Math.round(value) };
    const x = clamp(next.x, 0, width - minImageDimension);
    const y = clamp(next.y, 0, height - minImageDimension);
    const clamped: CropRect = {
      x,
      y,
      width: clamp(next.width, minImageDimension, width - x),
      height: clamp(next.height, minImageDimension, height - y),
    };
    setRect(clamped);
    return clamped[field];
  }

  const percent = (value: number, total: number) => `${(value / total) * 100}%`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image editor"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-3xl max-h-full overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Crop Image
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag the box to move it, drag the handles to resize, or type exact
              values below.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white px-1"
            aria-label="Close editor"
          >
            ✕
          </button>
        </div>

        <div
          ref={areaRef}
          className="flex justify-center rounded-lg bg-slate-100 dark:bg-slate-900 p-2"
        >
          <div
            ref={stageRef}
            className="relative overflow-visible select-none touch-none"
            style={{
              width: width * scale,
              height: height * scale,
              backgroundImage:
                "repeating-conic-gradient(#cbd5e1 0% 25%, #f8fafc 0% 50%)",
              backgroundSize: "16px 16px",
            }}
          >
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="absolute inset-0 w-full h-full block"
            />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute border-2 border-white pointer-events-auto cursor-move"
                style={{
                  left: percent(rect.x, width),
                  top: percent(rect.y, height),
                  width: percent(rect.width, width),
                  height: percent(rect.height, height),
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  outline: "1px solid rgba(0,0,0,0.6)",
                }}
                onPointerDown={(e) => startDrag(e, "move")}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <div className="absolute inset-y-0 left-1/3 border-l border-white/50 pointer-events-none" />
                <div className="absolute inset-y-0 left-2/3 border-l border-white/50 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/3 border-t border-white/50 pointer-events-none" />
                <div className="absolute inset-x-0 top-2/3 border-t border-white/50 pointer-events-none" />
              </div>
            </div>

            {/* Handles live outside the clipping layer so they stay grabbable on the image edges. */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: percent(rect.x, width),
                top: percent(rect.y, height),
                width: percent(rect.width, width),
                height: percent(rect.height, height),
              }}
            >
              {handles.map(({ handle, style, cursor }) => (
                <div
                  key={handle}
                  className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-blue-600 shadow pointer-events-auto"
                  style={{ ...style, cursor }}
                  onPointerDown={(e) => startDrag(e, handle)}
                  onPointerMove={onDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
          {/* The editor keeps the box inside the image, so X/Y start at 0 (unlike the step's number fields, which allow cropping outwards). */}
          <NumberField
            label="Start X (px)"
            value={rect.x}
            constraint={{
              ...cropXConstraints,
              min: 0,
              max: width - minImageDimension,
            }}
            onCommit={(v) => setField("x", v)}
          />
          <NumberField
            label="Start Y (px)"
            value={rect.y}
            constraint={{
              ...cropYConstraints,
              min: 0,
              max: height - minImageDimension,
            }}
            onCommit={(v) => setField("y", v)}
          />
          <NumberField
            label="Width (px)"
            value={rect.width}
            constraint={{ ...cropWidthConstraints, max: width }}
            onCommit={(v) => setField("width", v)}
          />
          <NumberField
            label="Height (px)"
            value={rect.height}
            constraint={{ ...cropHeightConstraints, max: height }}
            onCommit={(v) => setField("height", v)}
          />
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => changeAspectRatio(e.target.value as AspectRatio)}
              className={inputClass}
            >
              {aspectRatios.map((option) => (
                <option key={option} value={option}>
                  {aspectRatioDescriptions[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Image: {width}×{height}px • Result: {output.width}×{output.height}px
        </p>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => {
              setAspectRatio("free");
              setRect({ x: 0, y: 0, width, height });
            }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm text-sm"
          >
            Reset
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(output)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
