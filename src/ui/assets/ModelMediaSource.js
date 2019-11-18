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
    const additionalNodeProps = {
      initialScale: "fit"
    };

    const additionalItemProps = {};

    const queryParams = {
      query: params.query
    };

    if (params.tags && params.tags.length > 0) {
      const tag = params.tags[0];
      const paramsKey = tag.paramsKey !== undefined ? tag.paramsKey : "filter";
      queryParams[paramsKey] = tag.value;

      if (tag.initialNodeProps) {
        Object.assign(additionalNodeProps, tag.initialNodeProps);
      }

      if (tag.itemProps) {
        Object.assign(additionalItemProps, tag.itemProps);
      }
    }

    const { results, suggestions, nextCursor } = await this.api.searchMedia(this.id, queryParams, cursor, abortSignal);

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
          ...additionalNodeProps,
          src: result.url
        },
        ...additionalItemProps
      })),
      suggestions,
      nextCursor,
      hasMore: !!nextCursor
    };
  }
}
