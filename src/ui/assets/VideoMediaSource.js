import { BaseSource } from "./sources/index";
import { ItemTypes } from "../dnd";
import VideoSourcePanel from "./VideoSourcePanel";
import VideoNode from "../../editor/nodes/VideoNode";

export default class VideoMediaSource extends BaseSource {
  constructor(api) {
    super();
    this.component = VideoSourcePanel;
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
        type: ItemTypes.Video,
        url: result.url,
        nodeClass: VideoNode,
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
