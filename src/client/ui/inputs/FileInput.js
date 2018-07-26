import React from "react";
import PropTypes from "prop-types";

import styles from "./FileInput.scss";
import Button from "../Button";
import { withProject } from "../contexts/ProjectContext";
import ReactTooltip from "react-tooltip";

function FileInput({ fileObj, onChange, openFileDialog, filters, project }) {
  const { path, isValid } = fileObj;
  const inputStyles = `${styles.fileInput} ${isValid ? "" : styles.invalidPath}`;
  return (
    <div className={inputStyles} data-tip={isValid ? "" : "Cannot find the file"} data-type={isValid ? "" : "error"}>
      <input
        value={(path && project.getRelativeURI(path)) || ""}
        onChange={e => onChange(project.getAbsoluteURI(e.target.value))}
      />
      {isValid ? null : <ReactTooltip />}
      <Button onClick={() => openFileDialog(onChange, { filters })}>...</Button>
    </div>
  );
}

FileInput.propTypes = {
  fileObj: PropTypes.object,
  onChange: PropTypes.func,
  openFileDialog: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.object
};

FileInput.defaultProps = {
  fileObj: {
    path: "",
    isValid: true
  },
  onChange: () => {}
};

export default withProject(FileInput);
