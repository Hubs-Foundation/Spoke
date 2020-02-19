import React, { useCallback, useRef, useEffect, useContext, memo } from "react";
import PropTypes from "prop-types";
import InfiniteScroll from "react-infinite-scroller";
import styled from "styled-components";
import { VerticalScrollContainer } from "../layout/Flex";
import { MediaGrid, ImageMediaGridItem, VideoMediaGridItem, IconMediaGridItem } from "../layout/MediaGrid";
import { unique } from "../utils";
import { ContextMenuTrigger, ContextMenu, MenuItem } from "../layout/ContextMenu";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import AssetTooltip from "./AssetTooltip";
import { EditorContext } from "../contexts/EditorContext";
import { OnboardingContext } from "../contexts/OnboardingContext";
import { ItemTypes } from "../dnd";
import AudioPreview from "./AudioPreview";
import Tooltip, { TooltipContainer } from "../layout/Tooltip";

const AssetGridTooltipContainer = styled(TooltipContainer)`
  max-width: initial;
  text-align: left;
`;

function collectMenuProps({ item }) {
  return { item };
}

function AssetGridItem({ contextMenuId, tooltipComponent, disableTooltip, item, onClick, ...rest }) {
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
    content = <ImageMediaGridItem src={item.thumbnailUrl} onClick={onClickItem} label={item.label} {...rest} />;
  } else if (item.videoUrl) {
    content = <VideoMediaGridItem src={item.videoUrl} onClick={onClickItem} label={item.label} {...rest} />;
  } else if (item.iconComponent) {
    content = (
      <IconMediaGridItem iconComponent={item.iconComponent} onClick={onClickItem} label={item.label} {...rest} />
    );
  } else {
    content = <ImageMediaGridItem onClick={onClickItem} label={item.label} {...rest} />;
  }

  if (item.type === ItemTypes.Audio) {
    content = <AudioPreview src={item.url}>{content}</AudioPreview>;
  }

  const [_dragProps, drag, preview] = useDrag({
    item: { type: item.type },
    begin() {
      return { type: item.type, multiple: false, value: item };
    }
  });

  const renderTooltip = useCallback(() => {
    const TooltipComponent = tooltipComponent;
    return (
      <AssetGridTooltipContainer>
        <TooltipComponent item={item} />
      </AssetGridTooltipContainer>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, tooltipComponent]);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <div ref={drag}>
      <ContextMenuTrigger id={contextMenuId} item={item} collect={collectMenuProps} holdToDisplay={-1}>
        <Tooltip renderContent={renderTooltip} disabled={disableTooltip}>
          {content}
        </Tooltip>
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

AssetGridItem.propTypes = {
  tooltipComponent: PropTypes.func,
  disableTooltip: PropTypes.bool,
  contextMenuId: PropTypes.string,
  onClick: PropTypes.func,
  item: PropTypes.shape({
    id: PropTypes.any.isRequired,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    videoUrl: PropTypes.string,
    iconComponent: PropTypes.object,
    url: PropTypes.string
  }).isRequired
};

let lastId = 0;

const MemoAssetGridItem = memo(AssetGridItem);

export default function AssetGrid({ isLoading, selectedItems, items, onSelect, onLoadMore, hasMore, tooltip, source }) {
  const editor = useContext(EditorContext);
  const onboarding = useContext(OnboardingContext);
  const uniqueId = useRef(`AssetGrid${lastId}`);

  useEffect(() => {
    lastId++;
  }, []);

  const placeObject = useCallback(
    (_, trigger) => {
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
                tooltipComponent={tooltip}
                disableTooltip={onboarding.enabled}
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
