import React from "react";
import PropTypes from "prop-types";

import Button from "./Button";
import styles from "./PropertyGroup.scss";
import infoIcon from "../assets/info-icon.svg";
import { withProject } from "./contexts/ProjectContext";
import ReactTooltip from "react-tooltip";

function PropertyGroup(props) {
  const {
    name,
    canRemove,
    removeHandler,
    src,
    saveable,
    modified,
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
      class: src && src.isValid ? styles.src : styles.invalidSrc,
      tip: src && src.isValid ? null : "Cannot find the file.",
      type: src && src.isValid ? null : "error"
    };

    return (
      <div>
        {src.path && (
          <span className={srcStatus.class} data-tip={srcStatus.tip} data-type={srcStatus.type}>
            {project.getRelativeURI(src.path)}
            <ReactTooltip />
          </span>
        )}
        <div className={styles.saveButtons}>
          {src && src.path && <Button onClick={saveHandler}>Save</Button>}
          <Button onClick={saveAsHandler}>Save As...</Button>
          <Button onClick={loadHandler}>Load...</Button>
        </div>
      </div>
    );
  };

  const showSaveInfo = saveable && !src.path;

  return (
    <div className={styles.propertyGroup}>
      <div className={styles.name}>
        {name}
        {renderRemoveButton()}
      </div>
      {renderSaveButtons()}
      {showSaveInfo && (
        <div className={styles.saveInfo}>
          <img className={styles.icon} src={infoIcon} />
          <span className={styles.text}>You must save this component or load a saved file in order to edit it.</span>
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  canRemove: PropTypes.bool,
  removeHandler: PropTypes.func,
  src: PropTypes.object,
  saveable: PropTypes.bool,
  modified: PropTypes.bool,
  saveHandler: PropTypes.func,
  saveAsHandler: PropTypes.func,
  loadHandler: PropTypes.func,
  children: PropTypes.arrayOf(PropTypes.element),
  project: PropTypes.object
};

export default withProject(PropertyGroup);
