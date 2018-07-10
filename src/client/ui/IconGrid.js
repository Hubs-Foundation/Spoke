import React from "react";
import PropTypes from "prop-types";
import styles from "./IconGrid.scss";

export default function IconGrid({ children }) {
  return <div className={styles.iconGrid}>{children}</div>;
}

IconGrid.propTypes = {
  children: PropTypes.arrayOf(PropTypes.any)
};
