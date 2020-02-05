import React from "react";
import { useDragLayer } from "react-dnd";
import styled from "styled-components";
import { ItemTypes } from ".";

const DragLayerContainer = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;

const DragPreviewContainer = styled.div.attrs(props => ({
  style: {
    transform: `translate(${props.offset.x}px, ${props.offset.y}px)`
  }
}))`
  background-color: ${props => props.theme.blue};
  opacity: 0.3;
  color: ${props => props.theme.text};
  padding: 4px;
  border-radius: 4px;
  display: inline-block;
`;

export default function DragLayer() {
  const { item, itemType, currentOffset, isDragging } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  let preview;

  if (itemType === ItemTypes.Node) {
    if (item.multiple) {
      preview = <div>{`${item.value.length} Nodes Selected`}</div>;
    } else {
      preview = <div>{item.value.name}</div>;
    }
  } else if (itemType === ItemTypes.Model) {
    if (item.multiple) {
      preview = <div>{`${item.value.length} Models Selected`}</div>;
    } else {
      preview = <div>{item.value.label}</div>;
    }
  } else if (itemType === ItemTypes.Image) {
    if (item.multiple) {
      preview = <div>{`${item.value.length} Images Selected`}</div>;
    } else {
      preview = <div>{item.value.label}</div>;
    }
  } else if (itemType === ItemTypes.Video) {
    if (item.multiple) {
      preview = <div>{`${item.value.length} Videos Selected`}</div>;
    } else {
      preview = <div>{item.value.label}</div>;
    }
  } else if (itemType === ItemTypes.Audio) {
    if (item.multiple) {
      preview = <div>{`${item.value.length} Audio Sources Selected`}</div>;
    } else {
      preview = <div>{item.value.label}</div>;
    }
  } else if (itemType === ItemTypes.KitPiece) {
    if (item.multiple) {
      preview = <div>{`${item.value.length} Kit Pieces Selected`}</div>;
    } else {
      preview = <div>{item.value.label}</div>;
    }
  } else {
    preview = <div>{item.type}</div>;
  }

  return (
    <DragLayerContainer>
      <DragPreviewContainer offset={currentOffset}>{preview}</DragPreviewContainer>
    </DragLayerContainer>
  );
}
