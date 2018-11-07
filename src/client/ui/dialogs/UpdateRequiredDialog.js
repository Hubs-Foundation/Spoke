import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../inputs/Button";
import DialogHeader from "./DialogHeader";

export default class UpdateRequiredDialog extends Component {
  static propTypes = {
    downloadUrl: PropTypes.string
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.dialogContainer}>
        <DialogHeader title="Update Required" />
        <div className={styles.updateRequiredContainer}>
          Please download the latest version to continue using Spoke.
          <div className={styles.downloadButton}>
            <Button href={this.props.downloadUrl}>Download</Button>
          </div>
        </div>
      </div>
    );
  }
}
