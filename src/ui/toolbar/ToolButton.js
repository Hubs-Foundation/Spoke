import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import styles from "./ToolButton.scss";

export default function ToolButton({ toolType, onClick, selected }) {
  const btnColor = selected ? styles.selected : styles.unselected;
  return (
    <div>
      <button className={classNames(styles.toolbtn, btnColor)} onClick={onClick}>
        <i className={classNames("fas", toolType)} />
      </button>
    </div>
  );
}

ToolButton.propTypes = {
  toolType: PropTypes.string,
  onClick: PropTypes.func,
  selected: PropTypes.bool
};
