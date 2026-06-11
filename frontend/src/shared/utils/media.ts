const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "ogg", "mov"]);

function getExt(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isImage(fileName: string) {
  return IMAGE_EXTS.has(getExt(fileName));
}

export function isVideo(fileName: string) {
  return VIDEO_EXTS.has(getExt(fileName));
}

export function isMedia(fileName: string) {
  return isImage(fileName) || isVideo(fileName);
}
