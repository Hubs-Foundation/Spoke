import React from "react";
import PropTypes from "prop-types";
import styles from "./Center.scss";

export default function Center(props) {
  return <div className={styles.center}>{props.children}</div>;
}

Center.propTypes = {
  children: PropTypes.node
};
