import { BaseSource } from "./index";
import { ItemTypes } from "../../dnd";
import UploadSourcePanel from "../UploadSourcePanel";
import ModelNode from "../../../editor/nodes/ModelNode";
import VideoNode from "../../../editor/nodes/VideoNode";
import ImageNode from "../../../editor/nodes/ImageNode";

const assetTypeToNode = {
  model: ModelNode,
  image: ImageNode,
  video: VideoNode
};

const assetTypeToItemType = {
  model: ItemTypes.Model,
  image: ItemTypes.Image,
  video: ItemTypes.Video
};

export default class MyAssetsSource extends BaseSource {
  constructor(editor) {
    super();
    this.component = UploadSourcePanel;
    this.editor = editor;
    this.id = "assets";
    this.name = "My Assets";
    this.tags = [
      { label: "Models", value: "model" },
      { label: "Images", value: "image" },
      { label: "Videos", value: "video" }
    ];
    this.searchLegalCopy = "Search by Mozilla Hubs";
    this.privacyPolicyUrl = "https://github.com/mozilla/hubs/blob/master/PRIVACY.md";
    this.uploadMultiple = true;
    this.acceptFileTypes = ".png,.jpeg,.jpg,.gif,.mp4,.glb,image/png,image/jpeg,image/gif,video/mp4,model/gltf-binary";
    this.requiresAuthentication = true;
  }

  async upload(files, onProgress, abortSignal) {
    await this.editor.api.uploadAssets(this.editor, files, onProgress, abortSignal);
    this.emit("resultsChanged");
  }

  async delete(item) {
    await this.editor.api.deleteAsset(item.id);
    this.emit("resultsChanged");
  }

  async search(params, cursor, abortSignal) {
    const { results, suggestions, nextCursor } = await this.editor.api.searchMedia(
      this.id,
      {
        query: params.query,
        type: params.tags && params.tags.length > 0 && params.tags[0].value
      },
      cursor,
      abortSignal
    );

    return {
      results: results.map(result => ({
        id: result.id,
        thumbnailUrl: result && result.images && result.images.preview && result.images.preview.url,
        label: result.name,
        type: assetTypeToItemType[result.type],
        url: result.url,
        nodeClass: assetTypeToNode[result.type],
        initialProps: {
          name: result.name,
          src: result.url
        }
      })),
      suggestions,
      nextCursor,
      hasMore: !!nextCursor
    };
  }
}
