import React from "react";
import PropTypes from "prop-types";
import styles from "./PropertyGroup.scss";

export default function PropertyGroup({ name, children }) {
  return (
    <div className={styles.propertyGroup}>
      <div className={styles.name}>{name}</div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.element)
};
