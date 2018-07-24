import React from "react";
import PropTypes from "prop-types";

import styles from "./FileInput.scss";
import Button from "../Button";
import { getRelativeURI, getURL } from "../../api/project";

export default function FileInput({ value, onChange, openFileDialog, filters }) {
  return (
    <div className={styles.fileInput}>
      <input value={getRelativeURI(value) || ""} onChange={e => onChange(getURL(e.target.value))} />
      <Button onClick={() => openFileDialog(onChange, { filters })}>...</Button>
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
