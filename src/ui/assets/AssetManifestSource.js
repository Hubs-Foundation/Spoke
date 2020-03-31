import Fuse from "fuse.js";
import { proxiedUrlFor } from "../../api/Api";
import { BaseSource } from "./sources/index";
import KitSourcePanel from "./KitSourcePanel";
import { ItemTypes } from "../dnd";
import AudioNode from "../../editor/nodes/AudioNode";
import ImageNode from "../../editor/nodes/ImageNode";
import VideoNode from "../../editor/nodes/VideoNode";
import ModelNode from "../../editor/nodes/ModelNode";

function hasTags(result, tags) {
  for (const { value } of tags) {
    if (result.tags.indexOf(value) === -1) {
      return false;
    }
  }

  return true;
}

const assetTypeToNodeClass = {
  [ItemTypes.Audio]: AudioNode,
  [ItemTypes.Image]: ImageNode,
  [ItemTypes.Video]: VideoNode,
  [ItemTypes.Model]: ModelNode
};

export default class AssetManifestSource extends BaseSource {
  constructor(editor, name, manifestUrl) {
    super();
    this.editor = editor;
    this.id = manifestUrl;
    this.name = name;
    this.manifestUrl = proxiedUrlFor(new URL(manifestUrl, window.location).href);
    this.component = KitSourcePanel;
    this.assets = [];
    this.tags = [];
    this.loaded = false;
    this.searchDebounceTimeout = 0;
  }

  async load() {
    const response = await this.editor.api.fetch(this.manifestUrl);
    const manifest = await response.json();

    if (manifest.searchPlaceholder) {
      this.searchPlaceholder = manifest.searchPlaceholder;
    }

    for (const asset of manifest.assets) {
      const assetUrl = proxiedUrlFor(new URL(asset.url, this.manifestUrl).href);
      const nodeClass = assetTypeToNodeClass[asset.type];
      const nodeEditor = this.editor.nodeEditors.get(nodeClass);

      this.assets.push({
        id: asset.id,
        label: asset.label,
        url: assetUrl,
        tags: asset.tags || [],
        type: asset.type,
        iconComponent: nodeEditor.iconComponent,
        nodeClass,
        initialProps: {
          name: asset.label,
          src: assetUrl
        }
      });
    }

    this.tags = manifest.tags;

    const options = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["label", "tags"]
    };

    this.fuse = new Fuse(this.assets, options);

    this.loaded = true;
  }

  async search(params, _cursor, _abortSignal) {
    if (!this.loaded) {
      await this.load();
    }

    let results = this.assets;

    if (params.tags && params.tags.length > 0) {
      results = results.filter(result => hasTags(result, params.tags));
    }

    if (params.query) {
      results = this.fuse.search(params.query);
    }

    return {
      results,
      hasMore: false
    };
  }
}
