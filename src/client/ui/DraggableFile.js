import React from "react";
import PropTypes from "prop-types";
import { DragSource } from "react-dnd";
import Icon from "./Icon";
import styles from "./DraggableFile.scss";
import iconStyles from "./Icon.scss";
import classNames from "classnames";

function DraggableFile({ file, selected, onClick, connectDragSource }) {
  const getFileType = file => {
    const prefix = "icon-";
    const ext = file.ext;
    if (file.isDirectory) {
      return prefix + "folder";
    }
    switch (ext) {
      case ".scene":
        return prefix + "scene";
      case ".gltf":
      case ".glb":
        return prefix + "model";
      case ".material":
        return prefix + "material";
      case ".png":
      case ".jpg":
        return prefix + "file-image";
      default:
        return prefix + "file";
    }
  };

  return connectDragSource(
    <div className={styles.draggableFile}>
      <Icon
        key={file.uri}
        name={file.name}
        selected={selected}
        onClick={e => onClick(e, file)}
        className={classNames(iconStyles.small, getFileType(file), "icon-large")}
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
