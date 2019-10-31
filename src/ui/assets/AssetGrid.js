import React, { useCallback, useRef, useEffect, useContext, memo } from "react";
import PropTypes from "prop-types";
import InfiniteScroll from "react-infinite-scroller";
import styled from "styled-components";
import { VerticalScrollContainer } from "../layout/Flex";
import { MediaGrid, ImageMediaGridItem, VideoMediaGridItem, IconMediaGridItem } from "../layout/MediaGrid";
import Tooltip from "react-tooltip";
import { unique } from "../utils";
import { ContextMenuTrigger, ContextMenu, MenuItem } from "../layout/ContextMenu";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import AssetTooltip from "./AssetTooltip";
import { EditorContext } from "../contexts/EditorContext";

function collectMenuProps({ item }) {
  return { item };
}

function AssetGridItem({ contextMenuId, tooltipId, item, onClick, ...rest }) {
  const onClickItem = useCallback(
    e => {
      if (onClick) {
        onClick(item, e);
      }
    },
    [item, onClick]
  );

  let content;

  if (item.thumbnailUrl) {
    content = (
      <ImageMediaGridItem
        src={item.thumbnailUrl}
        onClick={onClickItem}
        data-tip={item.id}
        data-for={tooltipId}
        data-effect="solid"
        label={item.label}
        {...rest}
      />
    );
  } else if (item.videoUrl) {
    content = (
      <VideoMediaGridItem
        src={item.videoUrl}
        onClick={onClickItem}
        data-tip={item.id}
        data-for={tooltipId}
        data-effect="solid"
        label={item.label}
        {...rest}
      />
    );
  } else if (item.iconComponent) {
    content = (
      <IconMediaGridItem
        iconComponent={item.iconComponent}
        onClick={onClickItem}
        data-tip={item.id}
        data-for={tooltipId}
        data-effect="solid"
        label={item.label}
        {...rest}
      />
    );
  } else {
    content = (
      <ImageMediaGridItem
        onClick={onClickItem}
        data-tip={item.id}
        data-for={tooltipId}
        data-effect="solid"
        label={item.label}
        {...rest}
      />
    );
  }

  const [_dragProps, drag, preview] = useDrag({
    item: { type: item.type },
    begin() {
      return { type: item.type, multiple: false, value: item };
    }
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div ref={drag}>
      <ContextMenuTrigger id={contextMenuId} item={item} collect={collectMenuProps} holdToDisplay={-1}>
        {content}
      </ContextMenuTrigger>
    </div>
  );
}

const LoadingItem = styled.div`
  display: flex;
  flex-direction: column;
  height: 100px;
  border-radius: 6px;
  background-color: rgba(128, 128, 128, 0.5);
  border: 2px solid transparent;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

const StyledTooltip = styled(Tooltip)`
  max-width: 200px;
  overflow: hidden;
  overflow-wrap: break-word;
  user-select: none;
`;

AssetGridItem.propTypes = {
  tooltipId: PropTypes.string,
  contextMenuId: PropTypes.string,
  onClick: PropTypes.func,
  item: PropTypes.shape({
    id: PropTypes.any.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    videoUrl: PropTypes.string,
    iconComponent: PropTypes.object
  }).isRequired
};

let lastId = 0;

const MemoAssetGridItem = memo(AssetGridItem);

export default function AssetGrid({ isLoading, selectedItems, items, onSelect, onLoadMore, hasMore, tooltip, source }) {
  const editor = useContext(EditorContext);
  const uniqueId = useRef(`AssetGrid${lastId}`);

  useEffect(() => {
    lastId++;
  }, []);

  const renderTooltip = useCallback(
    id => {
      const item = items.find(i => i.id == id);
      const TooltipComponent = tooltip;
      return item && <TooltipComponent item={item} />;
    },
    [items, tooltip]
  );

  useEffect(() => {
    Tooltip.rebuild();
  }, [items]);

  const placeObject = useCallback(
    (_, trigger) => {
      Tooltip.hide();

      const item = trigger.item;

      const node = new item.nodeClass(editor);

      if (item.initialProps) {
        Object.assign(node, item.initialProps);
      }

      editor.getSpawnPosition(node.position);

      editor.addObject(node);
    },
    [editor]
  );

  const placeObjectAtOrigin = useCallback(
    (_, trigger) => {
      const item = trigger.item;

      const node = new item.nodeClass(editor);

      if (item.initialProps) {
        Object.assign(node, item.initialProps);
      }

      editor.addObject(node);
    },
    [editor]
  );

  const copyURL = useCallback((_, trigger) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trigger.item.url);
    }
  }, []);

  const openURL = useCallback((_, trigger) => {
    window.open(trigger.item.url);
  }, []);

  const onDelete = useCallback(
    (_, trigger) => {
      source.delete(trigger.item);
    },
    [source]
  );

  return (
    <>
      <VerticalScrollContainer flex>
        <InfiniteScroll pageStart={0} loadMore={onLoadMore} hasMore={hasMore} threshold={100} useWindow={false}>
          <MediaGrid>
            {unique(items, "id").map(item => (
              <MemoAssetGridItem
                key={item.id}
                tooltipId={uniqueId.current}
                contextMenuId={uniqueId.current}
                item={item}
                selected={selectedItems.indexOf(item) !== -1}
                onClick={onSelect}
              />
            ))}
            {isLoading && <LoadingItem>Loading...</LoadingItem>}
          </MediaGrid>
        </InfiniteScroll>
      </VerticalScrollContainer>
      <StyledTooltip id={uniqueId.current} getContent={renderTooltip} />
      <ContextMenu id={uniqueId.current}>
        <MenuItem onClick={placeObject}>Place Object</MenuItem>
        <MenuItem onClick={placeObjectAtOrigin}>Place Object at Origin</MenuItem>
        {!source.disableUrl && <MenuItem onClick={copyURL}>Copy URL</MenuItem>}
        {!source.disableUrl && <MenuItem onClick={openURL}>Open URL in New Tab</MenuItem>}
        {source.delete && <MenuItem onClick={onDelete}>Delete Asset</MenuItem>}
      </ContextMenu>
    </>
  );
}

AssetGrid.propTypes = {
  source: PropTypes.object,
  tooltip: PropTypes.func,
  isLoading: PropTypes.bool,
  onSelect: PropTypes.func,
  onLoadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool,
  selectedItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      label: PropTypes.string,
      thumbnailUrl: PropTypes.string
    })
  ).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.any.isRequired,
      label: PropTypes.string,
      thumbnailUrl: PropTypes.string
    })
  ).isRequired
};

AssetGrid.defaultProps = {
  onSelect: () => {},
  items: [],
  selectedItems: [],
  tooltip: AssetTooltip
};
