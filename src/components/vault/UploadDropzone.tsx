import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFiles: (files: File[]) => void | Promise<void>;
  uploading?: boolean;
}

const UploadDropzone = ({ onFiles, uploading }: Props) => {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFiles(Array.from(files));
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handle(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all",
        "glass shadow-soft",
        hover ? "border-primary scale-[1.01] shadow-glow" : "border-border hover:border-primary/60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-gradient shadow-glow">
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
        ) : (
          <UploadCloud className="h-6 w-6 text-primary-foreground" />
        )}
      </div>
      <p className="text-base font-semibold">
        {uploading ? "Uploading…" : "Drop files here, or click to upload"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Photos, docs, anything. Encrypted at rest, only you can see them.
      </p>
    </div>
  );
};

export default UploadDropzone;