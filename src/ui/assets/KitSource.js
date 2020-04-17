import Fuse from "fuse.js";
import { proxiedUrlFor } from "../../api/Api";
import { BaseSource } from "./sources/index";
import { ItemTypes } from "../dnd";
import KitSourcePanel from "./KitSourcePanel";
import KitPieceNode from "../../editor/nodes/KitPieceNode";

function hasTags(result, tags) {
  for (const { value } of tags) {
    if (result.tags.indexOf(value) === -1) {
      return false;
    }
  }

  return true;
}

export default class KitSource extends BaseSource {
  constructor(api, kitUrl) {
    super();
    this.api = api;
    this.kitUrl = proxiedUrlFor(new URL(kitUrl, window.location).href);
    this.component = KitSourcePanel;
    this.assets = [];
    this.tags = [];
    this.loaded = false;
    this.searchDebounceTimeout = 0;
  }

  async load() {
    const response = await this.api.fetch(this.kitUrl);
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
              kitId: this.id,
              pieceId: id
            }
          });
        }
      }

      const uniqueTags = Array.from(tagsSet);

      const tagTree = [];

      for (const tag of uniqueTags) {
        const parts = tag.split("/");

        let curPart = parts.shift();
        let curArray = tagTree;

        while (curPart) {
          let curNode = curArray.find(n => n.label === curPart);

          if (!curNode) {
            curNode = {
              label: curPart,
              value: tag
            };

            curArray.push(curNode);
          }

          curPart = parts.shift();

          if (curPart) {
            if (!curNode.children) {
              curNode.children = [];
            }

            curArray = curNode.children;
          }
        }
      }

      this.tags = tagTree;
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
