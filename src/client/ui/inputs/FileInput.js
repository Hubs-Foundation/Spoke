import React from "react";
import PropTypes from "prop-types";

import styles from "./FileInput.scss";
import Button from "../Button";
import ReactTooltip from "react-tooltip";

export default function FileInput({ value, onChange, openFileDialog, filters, isValid }) {
  const inputStyles = `${styles.fileInput} ${isValid ? "" : styles.invalidPath}`;
  return (
    <div className={inputStyles} data-tip="Cannot find the file" data-type="error" data-event-off="">
      <input value={value || ""} onChange={e => onChange(e.target.value)} />
      {isValid ? null : <ReactTooltip />}
      <Button className={styles.inputButton} onClick={() => openFileDialog(onChange, { filters })}>
        ...
      </Button>
    </div>
  );
}

FileInput.defaultProps = {
  value: "",
  isValid: true,
  onChange: () => {}
};

FileInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  openFileDialog: PropTypes.func,
  filters: PropTypes.arrayOf(PropTypes.string),
  isValid: PropTypes.bool
};
