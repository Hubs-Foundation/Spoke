import React from "react";
import PropTypes from "prop-types";
import { browseDirectory } from "../api";

async function onBrowse(e, { title, value, buttonLabel, onChange }) {
  e.preventDefault();

  const newPath = await browseDirectory({
    title,
    defaultPath: value,
    buttonLabel
  });

  if (newPath !== null) {
    onChange(newPath);
  }
}

export default function NativeFileInput(props) {
  return <button onClick={e => onBrowse(e, props)}>{props.label}</button>;
}

NativeFileInput.propTypes = {
  label: PropTypes.string,
  buttonLabel: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func
};

NativeFileInput.defaultProps = {
  label: "Browse..."
};
