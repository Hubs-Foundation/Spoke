import React from "react";
import PropTypes from "prop-types";
import styles from "./TabNavigation.scss";

export default function TabNavigation({ children }) {
  return <div className={styles.tabNavigation}>{children}</div>;
}

TabNavigation.propTypes = {
  children: PropTypes.node
};
