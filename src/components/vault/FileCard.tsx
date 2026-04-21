import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, FileImage, FileVideo, FileAudio, FileArchive, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VaultFile {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const iconFor = (mime: string | null) => {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return FileArchive;
  if (mime.startsWith("text/") || mime.includes("pdf") || mime.includes("document")) return FileText;
  return FileIcon;
};

interface Props {
  file: VaultFile;
  onDelete: (file: VaultFile) => void;
}

const FileCard = ({ file, onDelete }: Props) => {
  const [thumb, setThumb] = useState<string | null>(null);
  const isImage = file.mime_type?.startsWith("image/");
  const Icon = iconFor(file.mime_type);

  useEffect(() => {
    let revoked = false;
    if (isImage) {
      supabase.storage
        .from("vault")
        .createSignedUrl(file.storage_path, 60 * 60)
        .then(({ data }) => {
          if (!revoked && data?.signedUrl) setThumb(data.signedUrl);
        });
    }
    return () => {
      revoked = true;
    };
  }, [file.storage_path, isImage]);

  const handleDownload = async () => {
    const { data, error } = await supabase.storage
      .from("vault")
      .createSignedUrl(file.storage_path, 60, { download: file.name });
    if (error || !data) return;
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="group glass animate-scale-in overflow-hidden rounded-2xl shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
      <div className={cn("relative flex aspect-square w-full items-center justify-center overflow-hidden", "bg-soft-gradient")}>
        {isImage && thumb ? (
          <img src={thumb} alt={file.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <Icon className="h-14 w-14 text-primary/70" strokeWidth={1.4} />
        )}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <Button size="icon" variant="secondary" onClick={handleDownload} className="h-9 w-9 rounded-full">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" onClick={() => onDelete(file)} className="h-9 w-9 rounded-full">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatSize(file.size_bytes)}</p>
      </div>
    </div>
  );
};

export default FileCard;