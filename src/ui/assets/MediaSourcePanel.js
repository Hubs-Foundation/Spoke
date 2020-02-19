import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { useAssetSearch } from "./useAssetSearch";
import { AssetsPanelToolbar, AssetPanelContentContainer } from "./AssetsPanel";
import AssetSearchInput from "./AssetSearchInput";
import TagList from "./TagList";
import AssetGrid from "./AssetGrid";
import FileInput from "../inputs/FileInput";
import useUpload from "./useUpload";

export default function MediaSourcePanel({
  editor,
  source,
  searchPlaceholder,
  initialSearchParams,
  multiselectTags,
  savedState,
  setSavedState
}) {
  const { params, setParams, isLoading, loadMore, hasMore, results } = useAssetSearch(
    source,
    savedState.searchParams || initialSearchParams
  );

  const onSelect = useCallback(
    item => {
      const { nodeClass, initialProps } = item;
      const node = new nodeClass(editor);

      if (initialProps) {
        Object.assign(node, initialProps);
      }

      const transformPivot = item.transformPivot || source.transformPivot;

      if (transformPivot) {
        editor.spokeControls.setTransformPivot(transformPivot);
      }

      editor.spawnGrabbedObject(node);
    },
    [editor, source.transformPivot]
  );

  const onUpload = useUpload({ source });

  const onLoadMore = useCallback(() => {
    loadMore(params);
  }, [params, loadMore]);

  const onChangeQuery = useCallback(
    e => {
      const nextParams = { ...params, query: e.target.value };
      setParams(nextParams);
      setSavedState({ ...savedState, searchParams: nextParams });
    },
    [params, setParams, savedState, setSavedState]
  );

  const onChangeTags = useCallback(
    tags => {
      const nextParams = { ...params, tags };
      setParams(nextParams);
      setSavedState({ ...savedState, searchParams: nextParams });
    },
    [params, setParams, setSavedState, savedState]
  );

  const onChangeExpandedTags = useCallback(expandedTags => setSavedState({ ...savedState, expandedTags }), [
    savedState,
    setSavedState
  ]);

  return (
    <>
      <AssetsPanelToolbar title={source.name}>
        <AssetSearchInput
          placeholder={searchPlaceholder}
          value={params.query}
          onChange={onChangeQuery}
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
          <TagList
            multiselect={multiselectTags}
            tags={source.tags}
            selectedTags={params.tags}
            onChange={onChangeTags}
            initialExpandedTags={savedState.expandedTags}
            onChangeExpandedTags={onChangeExpandedTags}
          />
        )}
        <AssetGrid
          source={source}
          items={results}
          onLoadMore={onLoadMore}
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
  source: PropTypes.object,
  multiselectTags: PropTypes.bool,
  savedState: PropTypes.object,
  setSavedState: PropTypes.func.isRequired
};

MediaSourcePanel.defaultProps = {
  searchPlaceholder: "Search...",
  initialSearchParams: {
    query: "",
    tags: []
  },
  multiselectTags: false
};
