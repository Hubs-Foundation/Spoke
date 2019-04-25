import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";
import ProgressBar from "../inputs/ProgressBar";
import styles from "./ProgressDialog.scss";

export default function ProgressDialog({ message, onConfirm, cancelable, onCancel, ...props }) {
  return (
    <Dialog onCancel={cancelable ? onCancel : null} {...props}>
      <div className={styles.progressContainer}>
        <div className={styles.message}>{message}</div>
        <ProgressBar />
      </div>
    </Dialog>
  );
}

ProgressDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  cancelable: PropTypes.bool,
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func
};

ProgressDialog.defaultProps = {
  title: "Loading...",
  message: "Loading...",
  cancelable: false,
  cancelLabel: "Cancel"
};
