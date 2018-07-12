import React from "react";
import styles from "./SnackBar.scss";
import errorIcon from "../assets/error-icon.svg";
import warningIcon from "../assets/warning-icon.svg";
import PropTypes from "prop-types";
import Button from "./Button";
import classNames from "classnames";

export default function SnackBar({ conflictType }) {
  const conflictTypes = {
    missing: {
      img: errorIcon,
      content: "Missing nodes in your .scene file.",
      helpURL: "https://github.com/MozillaReality/hubs-editor/wiki/Tutorials"
    },
    duplicate: {
      img: warningIcon,
      content: "Duplicate node names in your gltf modals.",
      helpURL: "https://github.com/MozillaReality/hubs-editor/wiki/Tutorials"
    }
  };

  return (
    <div className={styles.bar}>
      <div className={styles.icon}>
        <img src={conflictTypes[conflictType].img} />
      </div>
      <div
        className={classNames(styles.content, {
          error: conflictType === "missing",
          warning: conflictType === "duplicate"
        })}
      >
        {conflictTypes[conflictType].content}
      </div>
      <div className={styles.options}>
        <Button onClick={() => window.open(conflictTypes[conflictType].helpURL)}>Help</Button>
      </div>
    </div>
  );
}

SnackBar.propTypes = {
  conflictType: PropTypes.string
};
