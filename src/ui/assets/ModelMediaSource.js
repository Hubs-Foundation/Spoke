import { BaseSource } from "./sources/index";
import { ItemTypes } from "../dnd";
import ModelSourcePanel from "./ModelSourcePanel";
import ModelNode from "../../editor/nodes/ModelNode";

export default class ModelMediaSource extends BaseSource {
  constructor(api) {
    super();
    this.component = ModelSourcePanel;
    this.api = api;
  }

  async search(params, cursor, abortSignal) {
    const { results, suggestions, nextCursor } = await this.api.searchMedia(
      this.id,
      {
        query: params.query,
        filter: params.tags && params.tags.length > 0 && params.tags[0].value
      },
      cursor,
      abortSignal
    );

    return {
      results: results.map(result => ({
        id: result.id,
        thumbnailUrl: result && result.images && result.images.preview && result.images.preview.url,
        attributions: result.attributions,
        label: result.name,
        type: ItemTypes.Model,
        url: result.url,
        nodeClass: ModelNode,
        initialProps: {
          name: result.name,
          scaleToFit: true,
          src: result.url
        }
      })),
      suggestions,
      nextCursor,
      hasMore: !!nextCursor
    };
  }
}
