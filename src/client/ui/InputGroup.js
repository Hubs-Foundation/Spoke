import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./InputGroup.scss";

export default function InputGroup({ name, children, disabled }) {
  return (
    <div className={classNames(styles.inputGroup, disabled && styles.disabled)}>
      <label className={styles.label}>
        <span className={styles.name}>{name}:</span>
        <div className={styles.content}>{children}</div>
      </label>
    </div>
  );
}

InputGroup.propTypes = {
  name: PropTypes.string,
  children: PropTypes.any,
  disabled: PropTypes.bool
};
