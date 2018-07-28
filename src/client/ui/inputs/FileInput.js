import React from "react";
import PropTypes from "prop-types";

import styles from "./FileInput.scss";
import Button from "../Button";
import FileDialog from "../dialogs/FileDialog";
import { withProject } from "../contexts/ProjectContext";
import { withDialog } from "../contexts/DialogContext";

function FileInput({ value, onChange, showDialog, hideDialog, filters, project }) {
  const onClick = () => {
    showDialog(FileDialog, {
      filters,
      onConfirm: src => {
        onChange(src);
        hideDialog();
      }
    });
  };

  return (
    <div className={styles.fileInput}>
      <input
        value={(value && project.getRelativeURI(value)) || ""}
        onChange={e => onChange(project.getAbsoluteURI(e.target.value))}
      />
      <Button onClick={onClick}>...</Button>
    </div>
  );
}

FileInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  showDialog: PropTypes.func.isRequired,
  hideDialog: PropTypes.func.isRequired,
  filters: PropTypes.arrayOf(PropTypes.string),
  project: PropTypes.object.isRequired
};

FileInput.defaultProps = {
  value: "",
  onChange: () => {}
};

export default withProject(withDialog(FileInput));
