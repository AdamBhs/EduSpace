import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFileUrl } from "@/services/file-service";
import { Image, FileText, Link2, ChevronUp, ChevronDown, Download, Play } from "lucide-react";
import { isImage, isVideo, isMedia } from "@/shared/utils/media";

type SharedFile = {
  id: string;
  senderId: string;
  fileKey: string;
  fileName: string;
  createdAt: string;
};

type SharedLink = {
  id: string;
  senderId: string;
  url: string;
  createdAt: string;
};

type Props = {
  filesQueryKey: string[];
  filesQueryFn: () => Promise<SharedFile[]>;
  linksQueryKey: string[];
  linksQueryFn: () => Promise<SharedLink[]>;
};

type SubView = null | "media" | "files" | "links";

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
        <video src={url} preload="metadata" muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
          <Play className="w-5 h-5 text-white fill-white" />
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

const MediaFilesPanel = ({ filesQueryKey, filesQueryFn, linksQueryKey, linksQueryFn }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const [subView, setSubView] = useState<SubView>(null);

  const { data: allFiles } = useQuery<SharedFile[]>({
    queryKey: filesQueryKey,
    queryFn: filesQueryFn,
  });

  const { data: allLinks } = useQuery<SharedLink[]>({
    queryKey: linksQueryKey,
    queryFn: linksQueryFn,
  });

  const mediaItems = allFiles?.filter((f) => isMedia(f.fileName)) ?? [];
  const fileItems = allFiles?.filter((f) => !isMedia(f.fileName)) ?? [];
  const linkItems = allLinks ?? [];

  const handleItemClick = (view: SubView) => {
    setSubView(subView === view ? null : view);
  };

  if (subView === "media") {
    return (
      <div className="border-t border-[#E2E8F0]">
        <button
          onClick={() => setSubView(null)}
          className="flex items-center gap-2 px-4 py-2.5 w-full text-left cursor-pointer hover:bg-[#F1F5F9]"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] rotate-90" />
          <span className="text-xs font-semibold text-[#137FEC]">Media</span>
        </button>
        {mediaItems.length === 0 ? (
          <div className="text-center py-6 px-4">
            <Image className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
            <p className="text-[11px] text-[#94A3B8]">No shared media</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 px-3 pb-3">
            {mediaItems.map((f) => (
              <MediaThumbnail key={f.id} fileKey={f.fileKey} fileName={f.fileName} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (subView === "files") {
    return (
      <div className="border-t border-[#E2E8F0]">
        <button
          onClick={() => setSubView(null)}
          className="flex items-center gap-2 px-4 py-2.5 w-full text-left cursor-pointer hover:bg-[#F1F5F9]"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] rotate-90" />
          <span className="text-xs font-semibold text-[#137FEC]">Files</span>
        </button>
        {fileItems.length === 0 ? (
          <div className="text-center py-6 px-4">
            <FileText className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
            <p className="text-[11px] text-[#94A3B8]">No shared files</p>
          </div>
        ) : (
          <div className="px-2 pb-2 space-y-0.5">
            {fileItems.map((f) => (
              <FileRow key={f.id} file={f} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (subView === "links") {
    return (
      <div className="border-t border-[#E2E8F0]">
        <button
          onClick={() => setSubView(null)}
          className="flex items-center gap-2 px-4 py-2.5 w-full text-left cursor-pointer hover:bg-[#F1F5F9]"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] rotate-90" />
          <span className="text-xs font-semibold text-[#137FEC]">Links</span>
        </button>
        {linkItems.length === 0 ? (
          <div className="text-center py-6 px-4">
            <Link2 className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
            <p className="text-[11px] text-[#94A3B8]">No shared links</p>
          </div>
        ) : (
          <div className="px-2 pb-2 space-y-0.5">
            {linkItems.map((l, i) => (
              <LinkRow key={`${l.id}-${i}`} link={l} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-[#E2E8F0]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-2.5 w-full cursor-pointer hover:bg-[#F1F5F9]"
      >
        <span className="text-xs font-semibold text-[#0F172A]">Media, files and links</span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
        )}
      </button>

      {expanded && (
        <div className="pb-2">
          <button
            onClick={() => handleItemClick("media")}
            className="flex items-center gap-3 px-4 py-2 w-full text-left cursor-pointer hover:bg-[#F1F5F9] transition-colors"
          >
            <Image className="w-4 h-4 text-[#64748B]" />
            <span className="text-xs font-medium text-[#0F172A]">Media</span>
          </button>
          <button
            onClick={() => handleItemClick("files")}
            className="flex items-center gap-3 px-4 py-2 w-full text-left cursor-pointer hover:bg-[#F1F5F9] transition-colors"
          >
            <FileText className="w-4 h-4 text-[#64748B]" />
            <span className="text-xs font-medium text-[#0F172A]">Files</span>
          </button>
          <button
            onClick={() => handleItemClick("links")}
            className="flex items-center gap-3 px-4 py-2 w-full text-left cursor-pointer hover:bg-[#F1F5F9] transition-colors"
          >
            <Link2 className="w-4 h-4 text-[#64748B]" />
            <span className="text-xs font-medium text-[#0F172A]">Links</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#F1F5F9] cursor-pointer transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-[#137FEC]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#0F172A] truncate">{file.fileName}</p>
        <p className="text-[10px] text-[#94A3B8]">{ext} &middot; {date}</p>
      </div>
      <Download className="w-3 h-3 text-[#94A3B8] shrink-0" />
    </button>
  );
}

function LinkRow({ link }: { link: SharedLink }) {
  let displayUrl = link.url;
  try {
    const parsed = new URL(link.url);
    displayUrl = parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
  } catch {}

  const date = new Date(link.createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] flex items-center justify-center shrink-0">
        <Link2 className="w-3.5 h-3.5 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[#137FEC] truncate hover:underline">{displayUrl}</p>
        <p className="text-[10px] text-[#94A3B8]">{date}</p>
      </div>
    </a>
  );
}

export default MediaFilesPanel;
