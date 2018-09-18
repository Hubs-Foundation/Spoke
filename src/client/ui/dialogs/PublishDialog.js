import React, { Component } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import styles from "./dialog.scss";
import Button from "../Button";
import Header from "../Header";
import StringInput from "../inputs/StringInput";

export default class PublishDialog extends Component {
  static propTypes = {
    hideDialog: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    screenshotURL: PropTypes.string,
    onPublish: PropTypes.func,
    published: PropTypes.bool,
    sceneUrl: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      name: "",
      description: ""
    };
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.onPublish(this.state);
  };

  render() {
    const { onCancel, hideDialog, screenshotURL, published, sceneUrl } = this.props;
    return (
      <div className={styles.dialogContainer}>
        <Header title="Publish to Hubs" />
        <div className={styles.publishContainer}>
          <div className={styles.content}>
            <img className={styles.sceneThumbnail} src={screenshotURL} />
            {published ? (
              <div className={classNames(styles.content, styles.publishedContent)}>
                <span>
                  Your scene has been published!<br />
                  <a href={sceneUrl} target="_blank" rel="noopener noreferrer">
                    {sceneUrl}
                  </a>
                </span>
              </div>
            ) : (
              <form id="publish" onSubmit={this.handleSubmit}>
                <div className={styles.inputField}>
                  <label className={styles.label}>Name:</label>
                  <StringInput id="name" required value={this.state.name} onChange={name => this.setState({ name })} />
                </div>
                <div className={styles.inputField}>
                  <label className={styles.label}>Description:</label>
                  <textarea
                    className={styles.description}
                    id="description"
                    value={this.state.description}
                    onChange={e => this.setState({ description: e.target.value })}
                  />
                </div>
              </form>
            )}
          </div>
        </div>
        {published ? (
          <div className={styles.bottom}>
            <Button key="ok" onClick={hideDialog}>
              Ok
            </Button>
          </div>
        ) : (
          <div className={styles.bottom}>
            <Button key="cancel" onClick={onCancel || hideDialog} className={styles.cancel}>
              Cancel
            </Button>
            <Button key="publish" form="publish">
              Publish
            </Button>
          </div>
        )}
      </div>
    );
  }
}
