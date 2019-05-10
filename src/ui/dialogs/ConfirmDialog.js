import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";

export default function ConfirmDialog({ message, ...props }) {
  return <Dialog {...props}>{message}</Dialog>;
}

ConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

ConfirmDialog.defaultProps = {
  title: "Confirm"
};
