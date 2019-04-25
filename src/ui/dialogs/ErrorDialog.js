import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";

export default function ErrorDialog({ message, onCancel, ...props }) {
  return <Dialog {...props}>{message}</Dialog>;
}

ErrorDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func
};

ErrorDialog.defaultProps = {
  title: "Error"
};
