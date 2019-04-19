import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "../ui/dialogs/dialog.scss";
import DialogHeader from "../ui/dialogs/DialogHeader";
import Button from "../ui/inputs/Button";
import StringInput from "../ui/inputs/StringInput";
import BooleanInput from "../ui/inputs/BooleanInput";

export default class PublishDialog extends Component {
  static propTypes = {
    hideDialog: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    screenshotURL: PropTypes.string,
    contentAttributions: PropTypes.array,
    onPublish: PropTypes.func,
    published: PropTypes.bool,
    sceneUrl: PropTypes.string,
    initialName: PropTypes.string,
    initialDescription: PropTypes.string,
    initialCreatorAttribution: PropTypes.string,
    initialAllowRemixing: PropTypes.bool,
    initialAllowPromotion: PropTypes.bool,
    isNewScene: PropTypes.bool
  };

  static defaultProps = {
    initialName: "",
    initialDescription: "",
    initialCreatorAttribution: "",
    initialAllowRemixing: true,
    initialAllowPromotion: true
  };

  constructor(props) {
    super(props);

    this.state = {
      name: props.initialName,
      // Description field removed for initial launch
      description: props.initialDescription,
      creatorAttribution: props.initialCreatorAttribution,
      allowRemixing: props.initialAllowRemixing,
      allowPromotion: props.initialAllowPromotion,
      isNewScene: props.isNewScene
    };
  }

  handleSubmit = e => {
    e.preventDefault();

    if (this.props.onPublish) {
      const publishState = { ...this.state };
      publishState.name = publishState.name.trim();
      publishState.creatorAttribution = publishState.creatorAttribution.trim();
      this.props.onPublish(publishState);
    }
  };

  render() {
    const { onCancel, hideDialog, screenshotURL, published, sceneUrl, contentAttributions } = this.props;
    return (
      <div className={styles.dialogContainer}>
        <DialogHeader title="Publish to Hubs" />
        <div className={styles.publishContainer}>
          <div className={styles.content}>
            <img className={styles.sceneThumbnail} src={screenshotURL} />
            <div>
              <form id="publish" onSubmit={this.handleSubmit}>
                {this.state.isNewScene && !published ? (
                  <div>
                    <div className={styles.inputField}>
                      <label className={styles.label}>Scene Name:</label>
                      <StringInput
                        id="name"
                        required
                        pattern={"[A-Za-z0-9-':\"!@#$%^&*(),.?~ ]{4,64}"}
                        title="Name must be between 4 and 64 characters and cannot contain underscores"
                        value={this.state.name}
                        className={styles.name}
                        onChange={name => this.setState({ name })}
                      />
                    </div>
                    <div className={styles.inputField}>
                      <label className={styles.label}>Your Attribution (optional):</label>
                      <StringInput
                        id="creatorAttribution"
                        value={this.state.creatorAttribution}
                        className={styles.creatorAttribution}
                        onChange={value => this.setState({ creatorAttribution: value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={styles.titleRow}>
                      <div className={styles.contentTitle}>{this.state.name}</div>

                      {!published && <Button onClick={() => this.setState({ isNewScene: true })}>New Scene</Button>}
                    </div>
                    {this.state.creatorAttribution && (
                      <div className={styles.titleRow}>
                        <div>by {this.state.creatorAttribution}</div>
                      </div>
                    )}
                  </div>
                )}
                {!published ? (
                  <div>
                    <div className={styles.inputField}>
                      <div className={styles.checkboxRow}>
                        <label htmlFor="allowRemixing">
                          Allow{" "}
                          <a
                            href="https://github.com/MozillaReality/Spoke/blob/master/REMIXING.md"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Remixing
                          </a>
                          &nbsp;with
                          <br />
                          Creative Commons&nbsp;
                          <a
                            href="https://creativecommons.org/licenses/by/3.0/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            CC-BY 3.0
                          </a>
                        </label>
                        <BooleanInput
                          id="allowRemixing"
                          value={this.state.allowRemixing}
                          onChange={allowRemixing => this.setState({ allowRemixing })}
                        />
                      </div>
                    </div>
                    <div className={styles.inputField}>
                      <div className={styles.checkboxRow}>
                        <label htmlFor="allowPromotion">
                          Allow Mozilla to{" "}
                          <a
                            href="https://github.com/MozillaReality/Spoke/blob/master/PROMOTION.md"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            promote
                          </a>{" "}
                          my scene
                        </label>
                        <BooleanInput
                          id="allowPromotion"
                          value={this.state.allowPromotion}
                          onChange={allowPromotion => this.setState({ allowPromotion })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.publishInfo}>
                    <span>Your scene has been published to Hubs.</span>
                    <Button href={sceneUrl} target="_blank">
                      View Your Scene
                    </Button>
                  </div>
                )}
              </form>
              {!published && contentAttributions && (
                <div className={styles.attribution}>
                  <label>Model Attribution:</label>
                  <p className={styles.attributionText}>{contentAttributions.map(a => `${a.name} by ${a.author}\n`)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {published ? (
          <div className={styles.bottom}>
            <Button key="ok" className={styles.cancel} onClick={hideDialog}>
              Close
            </Button>
          </div>
        ) : (
          <div className={styles.bottom}>
            <Button key="cancel" onClick={onCancel || hideDialog} className={styles.cancel}>
              Cancel
            </Button>
            <Button key="publish" type="submit" form="publish">
              Save and Publish
            </Button>
          </div>
        )}
      </div>
    );
  }
}
