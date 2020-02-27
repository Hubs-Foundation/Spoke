import React, { useContext } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { EditorContext } from "../contexts/EditorContext";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../dnd";
import useUpload from "./useUpload";
import { CloudUploadAlt } from "styled-icons/fa-solid/CloudUploadAlt";

const DropZoneBackground = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  justify-content: center;
  align-items: center;
  opacity: ${({ isOver, canDrop }) => (isOver && canDrop ? "1" : "0")};
  pointer-events: ${({ isDragging }) => (isDragging ? "auto" : "none")};

  h3 {
    font-size: 1.5em;
    margin-top: 12px;
  }
`;

export default function AssetDropZone({ afterUpload, uploadOptions }) {
  const editor = useContext(EditorContext);

  const onUpload = useUpload(uploadOptions);

  const [{ canDrop, isOver, isDragging }, onDropTarget] = useDrop({
    accept: [ItemTypes.File],
    drop(item) {
      onUpload(item.files).then(assets => {
        if (assets) {
          editor.setSource(editor.defaultUploadSource.id);

          if (afterUpload) {
            afterUpload(assets);
          }
        }
      });
    },
    collect: monitor => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver(),
      isDragging: monitor.getItem() !== null && monitor.canDrop()
    })
  });

  return (
    <DropZoneBackground ref={onDropTarget} isDragging={isDragging} canDrop={canDrop} isOver={isOver}>
      <CloudUploadAlt size={48} />
      <h3>Upload Asset</h3>
    </DropZoneBackground>
  );
}

AssetDropZone.propTypes = {
  afterUpload: PropTypes.func,
  uploadOptions: PropTypes.object
};
