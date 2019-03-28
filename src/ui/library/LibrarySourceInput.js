import React, { Component } from "react";
import styles from "./LibrarySourceInput.scss";
import SelectInput from "../inputs/SelectInput";

export default class LibrarySourceInput extends Component {
  render() {
    return (
      <span className={styles.sourceInputContainer}>
        <SelectInput {...this.props} />
      </span>
    );
  }
}
