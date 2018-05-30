import React from "react";
import PropTypes from "prop-types";
import styles from "./Editor.scss";

export default function Editor(props) {
  return <div className={styles.editor}>{props.children}</div>;
}

Editor.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element)
};
