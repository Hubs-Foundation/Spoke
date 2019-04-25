import React from "react";
import PropTypes from "prop-types";
import styles from "./Well.scss";

export default function Well(props) {
  return <div className={styles.well}>{props.children}</div>;
}

Well.propTypes = {
  children: PropTypes.node
};
