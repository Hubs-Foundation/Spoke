import React from "react";
import PropTypes from "prop-types";

import styles from "./FileInput.scss";
import Button from "../Button";
import { withProject } from "../contexts/ProjectContext";

function FileInput({ value, onChange, openFileDialog, filters, project }) {
  return (
    <div className={styles.fileInput}>
      <input
        value={(value && project.getRelativeURI(value)) || ""}
        onChange={e => onChange(project.getAbsoluteURI(e.target.value))}
      />
      <Button onClick={() => openFileDialog(onChange, { filters })}>...</Button>
    </div>
  );
}

FileInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  openFileDialog: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.object
};

FileInput.defaultProps = {
  value: "",
  onChange: () => {}
};

export default withProject(FileInput);
