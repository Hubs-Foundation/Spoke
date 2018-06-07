import React from "react";
import PropTypes from "prop-types";
import styles from "./Tab.scss";
import classNames from "classnames";

export default function Tab({ name, selected, onClick }) {
  const className = classNames(styles.tab, {
    [styles.selected]: selected
  });

  return (
    <div className={className} onClick={onClick}>
      {name}
    </div>
  );
}

Tab.propTypes = {
  name: PropTypes.string,
  selected: PropTypes.bool,
  onClick: PropTypes.func
};
