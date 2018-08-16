import React from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";

export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className={styles.dialogContainer}>
      <Header title={title} />
      <div className={styles.content}>{message}</div>
      <div className={styles.bottom}>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
        <Button onClick={onCancel}>{cancelLabel}</Button>
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
