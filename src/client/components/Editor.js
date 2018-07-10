import React from "react";
import PropTypes from "prop-types";
import styles from "./Editor.scss";

export default function Editor({ children }) {
  return <div className={styles.editor}> {children}</div>;
}

Editor.propTypes = {
  children: PropTypes.node
};
