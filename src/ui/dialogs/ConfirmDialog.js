import React from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../inputs/Button";
import DialogHeader from "./DialogHeader";

export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className={styles.dialogContainer}>
      <DialogHeader title={title} />
      <div className={styles.content}>{message}</div>
      <div className={styles.bottom}>
        <Button className={styles.cancel} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

ConfirmDialog.defaultProps = {
  title: "Confirm",
  confirmLabel: "Ok",
  cancelLabel: "Cancel"
};
