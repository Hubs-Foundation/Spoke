import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";
import StringInput from "../inputs/StringInput";

export default class PublishDialog extends Component {
  static propTypes = {
    onPublish: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    hideDialog: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      name: "",
      description: ""
    };
  }

  render() {
    const { onPublish, onCancel, hideDialog } = this.props;
    return (
      <div className={styles.dialogContainer}>
        <Header title="Publish to Hubs" />
        <div className={styles.publishContainer}>
          <div className={styles.content}>
            <img className={styles.sceneThumbnail} />
            <div>
              <div className={styles.inputField}>
                <label className={styles.label}>Name:</label>
                <StringInput id="name" required value={this.state.name} onChange={name => this.setState({ name })} />
              </div>
              <div className={styles.inputField}>
                <label className={styles.label}>Description:</label>
                <textarea
                  className={styles.description}
                  id="description"
                  onChange={description => this.setState({ description })}
                >
                  {this.state.description}
                </textarea>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <Button key="cancel" onClick={onCancel || hideDialog} className={styles.cancel}>
            Cancel
          </Button>
          <Button key="publish" onClick={() => onPublish(this.state)}>
            Publish
          </Button>
        </div>
      </div>
    );
  }
}
