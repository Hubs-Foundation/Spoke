import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Button from "../inputs/Button";
import styles from "./Dialog.scss";

export default function Dialog({ icon, title, onCancel, cancelLabel, onConfirm, confirmLabel, bottomNav, children }) {
  return (
    <form className={styles.dialogContainer} onSubmit={onConfirm}>
      <div className={styles.header}>
        {icon && <i className={classNames(styles.icon, "fas", icon)} />}
        <span>{title}</span>
      </div>
      <div className={styles.content}>{children}</div>
      {(onConfirm || onCancel || bottomNav) && (
        <div className={styles.bottomNav}>
          {bottomNav}
          {onCancel && (
            <Button secondary onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          {onConfirm && <Button type="submit">{confirmLabel}</Button>}
        </div>
      )}
    </form>
  );
}

Dialog.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  cancelLabel: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  confirmLabel: PropTypes.string.isRequired,
  bottomNav: PropTypes.node,
  children: PropTypes.node
};

Dialog.defaultProps = {
  confirmLabel: "Ok",
  cancelLabel: "Cancel"
};
