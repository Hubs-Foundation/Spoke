import React from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";

export const PROGRESS_DIALOG_DELAY = 200;

export default function ProgressDialog({ title, message, cancelable, onCancel, cancelLabel, hideDialog }) {
  return (
    <div className={styles.dialogContainer}>
      <Header title={title} />
      <div className={styles.content}>{message}</div>
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
