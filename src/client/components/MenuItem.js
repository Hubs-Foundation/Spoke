import React from "react";
import PropTypes from "prop-types";
import styles from "./MenuItem.scss";

export default function MenuItem({ name, onClick }) {
  return (
    <div className={styles.menuItem} onClick={onClick}>
      {name}
    </div>
  );
}

MenuItem.propTypes = {
  name: PropTypes.string,
  onClick: PropTypes.func
};
