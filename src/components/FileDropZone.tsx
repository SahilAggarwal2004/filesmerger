import { tools } from "@/constants";
import { formatFileSize } from "@/modules/utils";
import { FileDropZoneProps } from "@/types";

export default function FileDropZone({ tool, Icon, handleFileChange, totalSize }: FileDropZoneProps) {
  const { label, mimetype } = tools[tool];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select {label}s</label>
      <div className="flex items-center justify-center w-full">
        <label
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files.length) handleFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Icon className="w-8 h-8 text-slate-500 dark:text-slate-400 mb-3 scale-90" />
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select multiple {tool} files</p>
          </div>
          <input type="file" className="hidden" accept={mimetype} multiple onChange={handleFileChange} />
        </label>
      </div>
      {totalSize > 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Total size: {formatFileSize(totalSize)}</p>}
    </div>
  );
}
