import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { useAssetSearch } from "./useAssetSearch";
import { AssetsPanelToolbar, AssetPanelContentContainer } from "./AssetsPanel";
import AssetSearchInput from "./AssetSearchInput";
import TagList from "./TagList";
import AssetGrid from "./AssetGrid";
import FileInput from "../inputs/FileInput";
import useUpload from "./useUpload";

export default function MediaSourcePanel({ editor, source, searchPlaceholder, initialSearchParams }) {
  const { params, setParams, isLoading, loadMore, hasMore, results } = useAssetSearch(source, initialSearchParams);

  const onSelect = useCallback(
    item => {
      const { nodeClass, initialProps } = item;
      const node = new nodeClass(editor);

      if (initialProps) {
        Object.assign(node, initialProps);
      }

      editor.addObject(node);
    },
    [editor]
  );

  const onUpload = useUpload(source);

  return (
    <>
      <AssetsPanelToolbar title={source.name}>
        <AssetSearchInput
          placeholder={searchPlaceholder}
          value={params.query}
          onChange={e => setParams({ ...params, query: e.target.value })}
          legal={source.searchLegalCopy}
          privacyPolicyUrl={source.privacyPolicyUrl}
        />
        {source.upload && (
          <FileInput
            accept={source.acceptFileTypes || "all"}
            multiple={source.uploadMultiple || false}
            onChange={onUpload}
          />
        )}
      </AssetsPanelToolbar>
      <AssetPanelContentContainer>
        {source.tags && (
          <TagList tags={source.tags} selectedTags={params.tags} onChange={tags => setParams({ ...params, tags })} />
        )}
        <AssetGrid
          source={source}
          items={results}
          onLoadMore={loadMore}
          hasMore={hasMore}
          onSelect={onSelect}
          isLoading={isLoading}
        />
      </AssetPanelContentContainer>
    </>
  );
}

MediaSourcePanel.propTypes = {
  searchPlaceholder: PropTypes.string,
  initialSearchParams: PropTypes.object,
  editor: PropTypes.object,
  source: PropTypes.object
};

MediaSourcePanel.defaultProps = {
  searchPlaceholder: "Search...",
  initialSearchParams: {
    query: "",
    tags: []
  }
};
