import React from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";

export function OptionDialog({ title, message, options, cancelLabel, onCancel, hideDialog }) {
  return (
    <div className={styles.dialogContainer}>
      <Header title={title} />
      <div className={styles.content}>{message}</div>
      <div className={styles.bottom}>
        {options.map(option => {
          return (
            <Button key={option.label} onClick={e => option.onClick(e, option)}>
              {option.label}
            </Button>
          );
        })}
        <Button key="cancel" onClick={onCancel || hideDialog}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}

OptionDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired
    })
  ),
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func,
  hideDialog: PropTypes.func.isRequired
};

OptionDialog.defaultProps = {
  cancelLabel: "Cancel"
};
