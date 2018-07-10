import React from "react";
import Button from "./Button";
import PropTypes from "prop-types";
import styles from "./PropertyGroup.scss";

export default function PropertyGroup({ name, removable, removeHandler, children }) {
  const displayRemoveButton = (removable, removeHandler) => {
    if (!removable) {
      return;
    }
    return <Button onClick={removeHandler}>Remove</Button>;
  };

  return (
    <div className={styles.propertyGroup}>
      <div className={styles.name}>
        {name}
        {displayRemoveButton(removable, removeHandler)}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  removable: PropTypes.bool,
  removeHandler: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.element)
};
