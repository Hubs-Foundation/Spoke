import React, { Component } from "react";
import PropTypes from "prop-types";
import VideoNode from "../../editor/nodes/VideoNode";
import LibrarySearchContainer from "./LibrarySearchContainer";
import { withApi } from "../contexts/ApiContext";
import { withAuth } from "../contexts/AuthContext";
import { withEditor } from "../contexts/EditorContext";
import AssetContextMenu from "./AssetContextMenu";
import ProjectAssetContextMenu from "./ProjectAssetContextMenu";

class VideosLibrary extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    uploadMultiple: PropTypes.bool,
    onAfterUpload: PropTypes.func,
    tooltipId: PropTypes.string,
    isAuthenticated: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      sources: [
        {
          value: "bing_videos",
          label: "Bing Videos",
          searchPlaceholder: "Search videos...",
          legal: "Search by Bing",
          privacyPolicyUrl: "https://privacy.microsoft.com/en-us/privacystatement",
          onSearch: async (...args) => {
            const params = args[1];

            if (!params.query || params.query.trim() === "") {
              return {
                results: [],
                suggestions: [],
                nextCursor: null
              };
            }

            return props.api.searchMedia(...args);
          }
        },
        {
          value: "twitch",
          label: "Twitch",
          searchPlaceholder: "Search channels...",
          legal: "Search by Twitch",
          privacyPolicyUrl: "https://www.twitch.tv/p/legal/privacy-policy/",
          onSearch: (...args) => props.api.searchMedia(...args)
        },
        {
          value: "tenor",
          label: "GIFs",
          defaultFilter: "trending",
          filterOptions: [{ label: "Trending", value: "trending" }],
          filterIsClearable: true,
          searchPlaceholder: "Search gifs...",
          legal: "Search by Tenor",
          privacyPolicyUrl: "https://tenor.com/legal-privacy",
          onSearch: (...args) => props.api.searchMedia(...args)
        },
        {
          value: "assets",
          label: "My Assets",
          defaultType: "video",
          typeOptions: [{ label: "Videos", value: "video" }],
          searchPlaceholder: "Search my assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          onSearch: (...args) => props.api.searchMedia(...args),
          onUpload: (...args) => props.api.uploadAssets(props.editor, ...args),
          contextMenu: AssetContextMenu,
          requiresAuthentication: true
        },
        {
          value: "project_assets",
          label: "Project Assets",
          defaultType: "video",
          typeOptions: [{ label: "Videos", value: "video" }],
          searchPlaceholder: "Search project assets...",
          legal: "Search by Mozilla Hubs",
          privacyPolicyUrl: "https://github.com/mozilla/hubs/blob/master/PRIVACY.md",
          onSearch: (source, params) => props.api.getProjectAssets(props.editor.projectId, params),
          onUpload: (...args) => props.api.uploadProjectAssets(props.editor, props.editor.projectId, ...args),
          contextMenu: ProjectAssetContextMenu,
          requiresAuthentication: true
        }
      ]
    };
  }

  onSelect = (item, source) => {
    const props = { src: item.url };

    if (item.name) {
      props.name = item.name;
    }

    this.props.onSelectItem(VideoNode, props, item, source);
  };

  render() {
    return (
      <LibrarySearchContainer
        sources={this.state.sources.filter(source => this.props.isAuthenticated || !source.requiresAuthentication)}
        onSelect={this.onSelect}
        uploadMultiple={this.props.uploadMultiple}
        onAfterUpload={this.props.onAfterUpload}
        tooltipId={this.props.tooltipId}
      />
    );
  }
}

export default withApi(withEditor(withAuth(VideosLibrary)));
