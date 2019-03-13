import React from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../inputs/Button";
import ProgressBar from "../inputs/ProgressBar";
import DialogHeader from "./DialogHeader";

export const PROGRESS_DIALOG_DELAY = 500;

export default function ProgressDialog({ title, message, cancelable, onCancel, cancelLabel, hideDialog }) {
  return (
    <div className={styles.dialogContainer}>
      <DialogHeader title={title} />
      <div className={styles.progressContainer}>
        <div className={styles.message}>{message}</div>
        <ProgressBar />
      </div>
      {cancelable && (
        <div className={styles.bottom}>
          <Button key="cancel" onClick={onCancel || hideDialog}>
            {cancelLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

ProgressDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  cancelable: PropTypes.bool,
  onCancel: PropTypes.func,
  cancelLabel: PropTypes.string,
  hideDialog: PropTypes.func.isRequired
};

ProgressDialog.defaultProps = {
  title: "Loading...",
  message: "Loading...",
  cancelable: false,
  cancelLabel: "Cancel"
};
