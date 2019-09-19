import VideoMediaSource from "../VideoMediaSource";

export default class BingVideosSource extends VideoMediaSource {
  constructor(api) {
    super(api);
    this.id = "twitch";
    this.name = "Twitch";
    this.searchPlaceholder = "Search channels...";
    this.searchLegalCopy = "Search by Twitch";
    this.privacyPolicyUrl = "https://www.twitch.tv/p/legal/privacy-policy/";
  }
}
