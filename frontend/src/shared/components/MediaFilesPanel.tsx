import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFileUrl } from "@/services/file-service";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Download, Image, FileText, X, Play } from "lucide-react";
import { isImage, isVideo, isMedia } from "@/shared/utils/media";

type SharedFile = {
  id: string;
  senderId: string;
  fileKey: string;
  fileName: string;
  createdAt: string;
};

type Props = {
  queryKey: string[];
  queryFn: () => Promise<SharedFile[]>;
  onClose: () => void;
};

function MediaThumbnail({ fileKey, fileName }: { fileKey: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getFileUrl(fileKey).then(setUrl);
  }, [fileKey]);

  if (!url) {
    return <div className="w-full aspect-square rounded-lg bg-[#F1F5F9] animate-pulse" />;
  }

  if (isVideo(fileName)) {
    return (
      <div
        className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => window.open(url, "_blank")}
      >
        <video
          src={url}
          preload="metadata"
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={fileName}
      className="w-full aspect-square rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => window.open(url, "_blank")}
    />
  );
}

function FileRow({ file }: { file: SharedFile }) {
  const handleDownload = async () => {
    const url = await getFileUrl(file.fileKey);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const ext = file.fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  const date = new Date(file.createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={handleDownload}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] cursor-pointer transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-[#137FEC]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] truncate">{file.fileName}</p>
        <p className="text-[11px] text-[#94A3B8]">{ext} &middot; {date}</p>
      </div>
      <Download className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
    </button>
  );
}

const MediaFilesPanel = ({ queryKey, queryFn, onClose }: Props) => {
  const [tab, setTab] = useState<"media" | "files">("media");

  const { data: allFiles, isLoading } = useQuery<SharedFile[]>({
    queryKey,
    queryFn,
  });

  const media = allFiles?.filter((f) => isMedia(f.fileName)) ?? [];
  const files = allFiles?.filter((f) => !isMedia(f.fileName)) ?? [];

  return (
    <div className="w-64 border-l border-[#E2E8F0] flex flex-col bg-white shrink-0 h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-bold text-[#0F172A]">Shared</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-[#F1F5F9] cursor-pointer transition-colors"
        >
          <X className="w-4 h-4 text-[#64748B]" />
        </button>
      </div>

      <div className="flex border-b border-[#E2E8F0]">
        <button
          onClick={() => setTab("media")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-wide text-center cursor-pointer transition-colors ${
            tab === "media"
              ? "text-[#137FEC] border-b-2 border-[#137FEC]"
              : "text-[#94A3B8] hover:text-[#64748B]"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Image className="w-3.5 h-3.5" />
            Media ({media.length})
          </span>
        </button>
        <button
          onClick={() => setTab("files")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-wide text-center cursor-pointer transition-colors ${
            tab === "files"
              ? "text-[#137FEC] border-b-2 border-[#137FEC]"
              : "text-[#94A3B8] hover:text-[#64748B]"
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Files ({files.length})
          </span>
        </button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <p className="text-xs text-gray-400 text-center py-8">Loading...</p>
        ) : tab === "media" ? (
          media.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Image className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-[#94A3B8]">No shared media yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-2">
              {media.map((f) => (
                <MediaThumbnail key={f.id} fileKey={f.fileKey} fileName={f.fileName} />
              ))}
            </div>
          )
        ) : files.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-[#94A3B8]">No shared files yet</p>
          </div>
        ) : (
          <div className="py-1">
            {files.map((f) => (
              <FileRow key={f.id} file={f} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MediaFilesPanel;
