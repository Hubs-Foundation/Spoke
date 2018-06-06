import React from "react";
import PropTypes from "prop-types";
import styles from "./InputGroup.scss";

export default function InputGroup({ name, children }) {
  return (
    <div className={styles.inputGroup}>
      <div className={styles.name}>{name}</div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

InputGroup.propTypes = {
  name: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.element)
};
