import React from "react";
import PropTypes from "prop-types";
import { DropTarget } from "react-dnd";
import { NativeTypes } from "@mozillareality/react-dnd-html5-backend";
import { getFilesFromDragEvent } from "html-dir-content";
import styles from "./AssetDropTarget.scss";

function NativeFileDropTarget({ connectDropTarget, children }) {
  return connectDropTarget(<div className={styles.assetDropTarget}>{children}</div>);
}

NativeFileDropTarget.propTypes = {
  connectDropTarget: PropTypes.func,
  children: PropTypes.node
};

export default DropTarget(
  [NativeTypes.DATA_TRANSFER],
  {
    drop(props, monitor) {
      const item = monitor.getItem();

      const filesPromise = getFilesFromDragEvent(item, true);

      if (props.onDropNativeFiles && !monitor.didDrop()) {
        props.onDropNativeFiles(filesPromise, props.target);
      }

      return item;
    },
    canDrop(props) {
      if (props.target) {
        return !!props.target.isDirectory;
      }

      return true;
    }
  },
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
)(NativeFileDropTarget);
