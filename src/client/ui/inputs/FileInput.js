import React from "react";
import PropTypes from "prop-types";

import Button from "../Button";

export default function FileInput({ value, onChange, openFileDialog, filters }) {
  return (
    <div>
      <span>{value}</span>
      <Button onClick={() => openFileDialog(onChange, filters)}>...</Button>
    </div>
  );
}

FileInput.defaultProps = {
  value: "",
  onChange: () => {}
};

FileInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  openFileDialog: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.string)
};
