import React from "react";
import PropTypes from "prop-types";

import styles from "./FileInput.scss";
import Button from "../Button";
import { withProject } from "../contexts/ProjectContext";
import ReactTooltip from "react-tooltip";

function FileInput({ value, onChange, openFileDialog, filters, project, isValid }) {
  const inputStyles = `${styles.fileInput} ${isValid ? "" : styles.invalidPath}`;
  return (
    <div
      className={inputStyles}
      data-tip={isValid ? "file path" : "Cannot find the file"}
      data-type={isValid ? "info" : "error"}
      data-event-off=""
    >
      <input
        value={(value && project.getRelativeURI(value)) || ""}
        onChange={e => onChange(project.getAbsoluteURI(e.target.value))}
      />
      {isValid ? null : <ReactTooltip />}
      <Button onClick={() => openFileDialog(onChange, { filters })}>...</Button>
    </div>
  );
}

FileInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  openFileDialog: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.object,
  isValid: PropTypes.bool
};

FileInput.defaultProps = {
  value: "",
  isValid: true,
  onChange: () => {}
};

export default withProject(FileInput);
