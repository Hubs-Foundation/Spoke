import { BaseSource } from "./index";
import { ItemTypes } from "../../dnd";
import UploadSourcePanel from "../UploadSourcePanel";
import ModelNode from "../../../editor/nodes/ModelNode";
import VideoNode from "../../../editor/nodes/VideoNode";
import ImageNode from "../../../editor/nodes/ImageNode";
import AudioNode from "../../../editor/nodes/AudioNode";
import { AcceptsAllFileTypes } from "../fileTypes";
import { PRIVACY } from "../../../constants";

const assetTypeToNode = {
  model: ModelNode,
  image: ImageNode,
  video: VideoNode,
  audio: AudioNode
};

const assetTypeToItemType = {
  model: ItemTypes.Model,
  image: ItemTypes.Image,
  video: ItemTypes.Video,
  audio: ItemTypes.Audio
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
      { label: "Videos", value: "video" },
      { label: "Audio", value: "audio" }
    ];
    this.searchLegalCopy = "Search by Mozilla Hubs";
    this.privacyPolicyUrl = PRIVACY;
    this.uploadSource = true;
    this.uploadMultiple = true;
    this.acceptFileTypes = AcceptsAllFileTypes;
    this.requiresAuthentication = true;
  }

  async upload(files, onProgress, abortSignal) {
    const assets = await this.editor.api.uploadAssets(this.editor, files, onProgress, abortSignal);
    this.emit("resultsChanged");
    return assets;
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
      results: results.map(result => {
        const thumbnailUrl = result && result.images && result.images.preview && result.images.preview.url;
        const nodeClass = assetTypeToNode[result.type];
        const iconComponent = thumbnailUrl ? null : this.editor.nodeEditors.get(nodeClass).iconComponent;

        return {
          id: result.id,
          thumbnailUrl,
          iconComponent,
          label: result.name,
          type: assetTypeToItemType[result.type],
          url: result.url,
          nodeClass,
          initialProps: {
            name: result.name,
            src: result.url
          }
        };
      }),
      suggestions,
      nextCursor,
      hasMore: !!nextCursor
    };
  }
}
