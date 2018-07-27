import React from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";

export default function ErrorDialog({ title, message, confirmLabel, hideDialog }) {
  return (
    <div className={styles.dialogContainer}>
      <Header title={title} />
      <div className={styles.content}>{message}</div>
      <div className={styles.bottom}>
        <Button onClick={hideDialog}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

ErrorDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  hideDialog: PropTypes.func.isRequired
};

ErrorDialog.defaultProps = {
  title: "Error",
  confirmLabel: "Cancel"
};
