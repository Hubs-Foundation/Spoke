import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";

export default function ConfirmDialog({ message, ...props }) {
  return <Dialog {...props}>{message}</Dialog>;
}

ConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  tag: PropTypes.string,
  onCancel: PropTypes.func,
  cancelLabel: PropTypes.string.isRequired,
  onConfirm: PropTypes.func,
  confirmLabel: PropTypes.string.isRequired,
  bottomNav: PropTypes.node
};

ConfirmDialog.defaultProps = {
  title: "Confirm"
};
