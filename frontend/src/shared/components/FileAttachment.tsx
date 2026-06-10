import { useState, useEffect } from "react";
import { getFileUrl } from "@/services/file-service";
import { Download } from "lucide-react";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"]);

function isImage(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTS.has(ext);
}

type Props = {
  fileKey: string;
  fileName: string;
};

const FileAttachment = ({ fileKey, fileName }: Props) => {
  const [url, setUrl] = useState<string | null>(null);
  const showPreview = isImage(fileName);

  useEffect(() => {
    getFileUrl(fileKey).then(setUrl);
  }, [fileKey]);

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  if (showPreview) {
    return (
      <div className="mt-1">
        {url ? (
          <img
            src={url}
            alt={fileName}
            className="max-w-xs max-h-60 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, "_blank")}
          />
        ) : (
          <div className="w-48 h-32 rounded-lg bg-[#F1F5F9] animate-pulse" />
        )}
        <button
          onClick={handleDownload}
          className="mt-1 flex items-center gap-1.5 text-[11px] text-[#64748B] hover:text-[#137FEC] cursor-pointer transition-colors"
        >
          <Download className="w-3 h-3" />
          {fileName}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="mt-1 flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm hover:bg-[#F8FAFC] hover:border-[#137FEC]/40 transition-colors cursor-pointer"
    >
      <Download className="w-3.5 h-3.5 text-[#137FEC]" />
      <span className="truncate text-[#334155]">{fileName}</span>
    </button>
  );
};

export default FileAttachment;
