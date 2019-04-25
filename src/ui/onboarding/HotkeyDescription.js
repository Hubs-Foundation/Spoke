import React from "react";
import PropTypes from "prop-types";
import styles from "./HotkeyDescription.scss";
import { insertSeparator } from "../utils";

export default function HotkeyDescription({ children, action }) {
  return (
    <div className={styles.hotkeyDescription}>
      {insertSeparator(children, index => (
        <div key={index} className={styles.separator}>
          +
        </div>
      ))}
      <div className={styles.separator}>=</div>
      <div>{action}</div>
    </div>
  );
}

HotkeyDescription.propTypes = {
  action: PropTypes.string.isRequired,
  children: PropTypes.node
};
