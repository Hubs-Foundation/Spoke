import React from "react";
import Button from "./Button";
import PropTypes from "prop-types";
import styles from "./PropertyGroup.scss";

export default function PropertyGroup({ name, removeHandler, children }) {
  const displayRemoveButton = (name, removeHandler) => {
    if (name === "Node") {
      return;
    }
    return <Button onClick={removeHandler}>Remove</Button>;
  };

  return (
    <div className={styles.propertyGroup}>
      <div className={styles.name}>
        {name}
        {displayRemoveButton(name, removeHandler)}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  removeHandler: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.element)
};
