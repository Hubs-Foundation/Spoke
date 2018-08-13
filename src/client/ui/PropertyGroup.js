import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

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
    srcIsValid,
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
      classNames: [styles.src, src && srcIsValid ? null : styles.invalidSrc],
      tip: src && srcIsValid ? null : "File does not exist",
      type: src && srcIsValid ? null : "error"
    };

    return (
      <div>
        {src && (
          <span className={classNames(srcStatus.classNames)} data-tip={srcStatus.tip} data-type={srcStatus.type}>
            {project.getRelativeURI(src)}
            {modified && "*"}
            <ReactTooltip />
          </span>
        )}
        <div className={styles.saveButtons}>
          {src && <Button onClick={saveHandler}>Save</Button>}
          <Button onClick={saveAsHandler}>Save As...</Button>
          <Button onClick={loadHandler}>Load...</Button>
        </div>
      </div>
    );
  };

  const showSaveInfo = saveable && !src;

  return (
    <div className={classNames(styles.propertyGroup, props.className)}>
      <div
        className={classNames(
          { [`${styles.header}`]: props.useDefault, [`${styles.lightHeader}`]: !props.useDefault },
          props.headerClassName
        )}
      >
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
      <div className={classNames(styles.content, props.contentClassName)}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  canRemove: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  removeHandler: PropTypes.func,
  src: PropTypes.string,
  srcIsValid: PropTypes.bool,
  saveable: PropTypes.bool,
  modified: PropTypes.bool,
  saveHandler: PropTypes.func,
  saveAsHandler: PropTypes.func,
  loadHandler: PropTypes.func,
  children: PropTypes.node,
  project: PropTypes.object,
  useDefault: PropTypes.bool
};

export default withProject(PropertyGroup);
