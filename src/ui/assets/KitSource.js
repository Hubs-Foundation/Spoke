import Fuse from "fuse.js";
import { BaseSource } from "./sources/index";
import { ItemTypes } from "../dnd";
import KitSourcePanel from "./KitSourcePanel";
import KitPieceNode from "../../editor/nodes/KitPieceNode";

function hasTags(result, tags) {
  console.log(tags, result);
  for (const { value } of tags) {
    if (result.tags.indexOf(value) === -1) {
      return false;
    }
  }

  return true;
}

export default class KitSource extends BaseSource {
  constructor(kitUrl) {
    super();
    this.kitUrl = new URL(kitUrl, window.location).href;
    this.component = KitSourcePanel;
    this.assets = [];
    this.tags = [];
    this.loaded = false;
  }

  async load() {
    const response = await fetch(this.kitUrl);
    const gltf = await response.json();
    const tagsSet = new Set();

    if (gltf.nodes) {
      for (const node of gltf.nodes) {
        if (
          node.extensions &&
          node.extensions.MOZ_hubs_components &&
          node.extensions.MOZ_hubs_components["kit-piece"]
        ) {
          const { id, thumbnailUrl, name, tags } = node.extensions.MOZ_hubs_components["kit-piece"];

          if (tags) {
            for (const tag of tags) {
              tagsSet.add(tag);
            }
          }

          this.assets.push({
            id,
            thumbnailUrl: new URL(thumbnailUrl, this.kitUrl).href,
            label: name,
            tags,
            type: ItemTypes.KitPiece,
            url: this.kitUrl,
            nodeClass: KitPieceNode,
            initialProps: {
              name,
              src: this.kitUrl,
              pieceId: id
            }
          });
        }
      }

      this.tags = Array.from(tagsSet).map(label => ({ label, value: label }));
    }

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
