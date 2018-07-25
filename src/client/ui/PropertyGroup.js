import React from "react";
import PropTypes from "prop-types";

import Button from "./Button";
import styles from "./PropertyGroup.scss";
import { withProject } from "./contexts/ProjectContext";
import ReactTooltip from "react-tooltip";

function PropertyGroup(props) {
  const {
    name,
    canRemove,
    removeHandler,
    src,
    srcIsValid,
    saveable,
    saveHandler,
    saveAsHandler,
    loadHandler,
    children,
    project
  } = props;
  const renderRemoveButton = () => {
    if (!canRemove) return;
    return <Button onClick={removeHandler}>Remove</Button>;
  };

  const renderSaveButtons = () => {
    if (!saveable) return;
    const srcStatus = {
      class: srcIsValid ? styles.src : styles.invalidSrc,
      tip: srcIsValid ? "file path" : "Cannot find the file.",
      type: srcIsValid ? "info" : "error"
    };
    return (
      <div>
        <span className={srcStatus.class} data-tip={srcStatus.tip} data-type={srcStatus.type}>
          {src && project.getRelativeURI(src)}
          <ReactTooltip />
        </span>
        <div className={styles.saveButtons}>
          {src && <Button onClick={saveHandler}>Save</Button>}
          <Button onClick={saveAsHandler}>Save As...</Button>
          <Button onClick={loadHandler}>Load...</Button>
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
  canRemove: PropTypes.bool,
  removeHandler: PropTypes.func,
  src: PropTypes.string,
  srcIsValid: PropTypes.bool,
  saveable: PropTypes.bool,
  saveHandler: PropTypes.func,
  saveAsHandler: PropTypes.func,
  loadHandler: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.element),
  project: PropTypes.object
};

export default withProject(PropertyGroup);
