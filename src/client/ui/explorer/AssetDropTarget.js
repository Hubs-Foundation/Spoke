import React from "react";
import PropTypes from "prop-types";
import { NativeTypes } from "@mozillareality/react-dnd-html5-backend";
import { DropTarget } from "react-dnd";
import styles from "./AssetDropTarget.scss";

function AssetDropTarget({ connectDropTarget, children }) {
  return connectDropTarget(<div className={styles.assetDropTarget}>{children}</div>);
}

AssetDropTarget.propTypes = {
  connectDropTarget: PropTypes.func,
  children: PropTypes.node
};

export default DropTarget(
  ["file", NativeTypes.DATA_TRANSFER],
  {
    drop(props, monitor) {
      const item = monitor.getItem();

      if (props.onDropAsset) {
        props.onDropAsset(item);
      }

      return item;
    }
  },
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
)(AssetDropTarget);
