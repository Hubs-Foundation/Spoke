import VideoMediaSource from "../VideoMediaSource";

export default class BingVideosSource extends VideoMediaSource {
  constructor(api) {
    super(api);
    this.id = "bing_videos";
    this.name = "Bing Videos";
    this.searchLegalCopy = "Search by Bing";
    this.privacyPolicyUrl = "https://privacy.microsoft.com/en-us/privacystatement";
  }
}
