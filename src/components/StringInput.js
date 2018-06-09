import React from "react";
import PropTypes from "prop-types";
import styles from "./StringInput.scss";

export default function StringInput({ value, onChange }) {
  return <input className={styles.stringInput} value={value} onChange={onChange} />;
}

StringInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};
