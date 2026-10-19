import type { DragEvent } from "react";
import Input from "./Input";

type FileUploadProps = {
  accept: string;
  fileName?: string;
  hint: string;
  id: string;
  onFileSelect: (file: File | null) => void;
  title: string;
};

function UploadIcon({ selected = false }: { selected?: boolean }) {
  return <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {selected ? <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h5M9 14l2 2 4-4" /></> : <><path d="M12 16V3M7 8l5-5 5 5M4 21h16" /></>}
  </svg>;
}

export default function FileUpload({ accept, fileName, hint, id, onFileSelect, title }: FileUploadProps) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0] ?? null;
    if (file) onFileSelect(file);
  };

  return <label
    htmlFor={id}
    className="file-upload-zone group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition"
    onDragOver={(event) => event.preventDefault()}
    onDrop={handleDrop}
  >
    <Input id={id} type="file" accept={accept} className="sr-only" onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)} />
    <span className={`grid size-12 place-items-center rounded-2xl transition group-hover:-translate-y-0.5 ${fileName ? "file-upload-selected" : "file-upload-icon"}`}>
      <UploadIcon selected={Boolean(fileName)} />
    </span>
    <span className="mt-3 font-display text-sm font-bold text-slate-900">{fileName || title}</span>
    <span className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{fileName ? "File selected and ready for validation" : hint}</span>
    <span className="file-upload-action mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold">
      <UploadIcon />
      {fileName ? "Choose a different file" : "Browse files"}
    </span>
  </label>;
}
