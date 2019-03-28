import React, { Component } from "react";
import styles from "./LibraryFilterInput.scss";
import SelectInput from "../inputs/SelectInput";

export default class LibraryFilterInput extends Component {
  render() {
    return (
      <span className={styles.filterInputContainer}>
        <SelectInput placeholder="Filter..." isClearable {...this.props} />
      </span>
    );
  }
}
