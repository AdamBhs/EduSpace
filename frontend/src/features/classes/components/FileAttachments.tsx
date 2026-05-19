import { useRef } from "react";
import { Paperclip, X, FileIcon, Loader2 } from "lucide-react";

export interface AttachmentMeta {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface FileAttachmentsProps {
  attachments: AttachmentMeta[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  uploading: boolean;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileAttachments = ({ attachments, onAdd, onRemove, uploading }: FileAttachmentsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAdd(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        {uploading ? "Uploading..." : "Attach files"}
      </button>
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {attachments.map((att, i) => (
            <div
              key={att.fileKey}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-[#F8FAFC] px-3 py-2 text-sm"
            >
              <FileIcon className="w-4 h-4 text-[#64748B] shrink-0" />
              <span className="flex-1 truncate text-[#334155]">{att.fileName}</span>
              <span className="text-xs text-[#94A3B8] shrink-0">{formatSize(att.fileSize)}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-[#94A3B8] hover:text-red-500 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileAttachments;
