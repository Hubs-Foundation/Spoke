export const AudioFileTypes = [".mp3", "audio/mpeg"];

export const VideoFileTypes = [".mp4", "video/mp4"];

export const ImageFileTypes = [".png", ".jpeg", ".jpg", ".gif", "image/png", "image/jpeg", "image/gif"];

export const ModelFileTypes = [".glb", "model/gltf-binary"];

export const AllFileTypes = [...AudioFileTypes, ...VideoFileTypes, ...ImageFileTypes, ...ModelFileTypes];

export const AcceptsAllFileTypes = AllFileTypes.join(",");

export function matchesFileTypes(file, fileTypes) {
  for (const pattern of fileTypes) {
    if (pattern.startsWith(".")) {
      if (file.name.toLowerCase().endsWith(pattern)) {
        return true;
      }
    } else if (file.type.startsWith(pattern)) {
      return true;
    }
  }

  return false;
}
