import React from "react";
import Button from "./Button";
import PropTypes from "prop-types";
import styles from "./PropertyGroup.scss";

export default function PropertyGroup(props) {
  const { name, removable, removeHandler, uri, saveable, saveHandler, loadHandler, children } = props;
  const renderRemoveButton = () => {
    if (!removable) return;
    return <Button onClick={removeHandler}>Remove</Button>;
  };

  const renderSaveButtons = () => {
    if (!saveable) return;
    return (
      <div>
        <span className={styles.uri}>{uri}</span>
        <div className={styles.saveButtons}>
          <Button onClick={saveHandler}>Save</Button>
          <Button onClick={loadHandler}>Load</Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.propertyGroup}>
      <div className={styles.name}>
        {name}
        {renderRemoveButton()}
      </div>
      {renderSaveButtons()}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  removable: PropTypes.bool,
  removeHandler: PropTypes.func,
  uri: PropTypes.string,
  saveable: PropTypes.bool,
  saveHandler: PropTypes.func,
  loadHandler: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.element)
};
