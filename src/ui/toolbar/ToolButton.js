import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import styles from "./ToolButton.scss";

export default function ToolButton({ id, toolType, onClick, selected, tooltip }) {
  const btnColor = selected ? styles.selected : styles.unselected;
  return (
    <div id={id} data-tip={tooltip} data-for="toolbar" data-delay-show="500" data-place="bottom">
      <button className={classNames(styles.toolbtn, btnColor)} onClick={onClick}>
        <i className={classNames("fas", toolType)} />
      </button>
    </div>
  );
}

ToolButton.propTypes = {
  id: PropTypes.string,
  toolType: PropTypes.string,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  tooltip: PropTypes.string
};
