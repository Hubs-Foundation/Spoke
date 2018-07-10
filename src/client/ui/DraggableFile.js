import React from "react";
import PropTypes from "prop-types";
import { DragSource } from "react-dnd";
import Icon from "./Icon";
import fileIcon from "../assets/file-icon.svg";
import folderIcon from "../assets/folder-icon.svg";
import styles from "./DraggableFile.scss";
import iconStyles from "./Icon.scss";

function DraggableFile({ file, selected, onClick, connectDragSource }) {
  return connectDragSource(
    <div className={styles.draggableFile}>
      <Icon
        key={file.uri}
        name={file.name}
        src={file.isDirectory ? folderIcon : fileIcon}
        selected={selected}
        onClick={e => onClick(e, file)}
        className={iconStyles.small}
      />
    </div>
  );
}

DraggableFile.propTypes = {
  file: PropTypes.object,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  connectDragSource: PropTypes.func
};

export default DragSource(
  "file",
  {
    beginDrag({ file }) {
      return { file };
    }
  },
  (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  })
)(DraggableFile);
