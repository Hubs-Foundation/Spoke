import React from "react";
import styles from "./NumericInput.scss";
import ReactNumericInput from "react-numeric-input";

export default function NumericInput(props) {
  return <ReactNumericInput style={false} className={styles.numericInput} {...props} />;
}
