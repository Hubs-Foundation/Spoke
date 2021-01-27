import React, { Component } from "react";
import PropTypes from "prop-types";
import configs from "../../configs";
import { withApi } from "../contexts/ApiContext";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";
import styled from "styled-components";

import StringInput from "../inputs/StringInput";
import BooleanInput from "../inputs/BooleanInput";
import FileInput from "../inputs/FileInput";
import FormField from "../inputs/FormField";
import { Button } from "../inputs/Button";
import ProgressBar from "../inputs/ProgressBar";

export const SceneUploadFormContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  background-color: ${props => props.theme.panel2};
  border-radius: 3px;
`;

export const UploadSceneSection = styled.form`
  padding-bottom: 100px;
  display: flex;

  &:first-child {
    padding-top: 100px;
  }

  h1 {
    font-size: 36px;
  }

  h2 {
    font-size: 16px;
  }
`;

export const UploadSceneContainer = styled.form`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 auto;
  max-width: 800px;
  min-width: 400px;
  padding: 0 20px;
`;

export const SceneUploadHeader = styled.div`
  margin-bottom: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftContent = styled.div`
  display: flex;
  width: 360px;
  border-top-left-radius: inherit;
  align-items: flex-start;
  padding: 30px;
  position: relative;

  img,
  div {
    width: 300px;
    height: 168px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-color: ${props => props.theme.panel};
    border-radius: 6px;
  }
  input {
    opacity: 0;
    position: absolute;
  }
`;

const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 30px 30px;

  label[type="button"] {
    display: flex;
    margin-bottom: 0;
    margin-right: 5px;
  }
`;

class CreateScenePage extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    match: PropTypes.object
  };

  constructor(props) {
    super(props);

    const isAuthenticated = this.props.api.isAuthenticated();

    this.state = {
      isAuthenticated,
      isUploading: false,
      isLoading: true,

      sceneId: null,

      error: null,

      name: "",
      creatorAttribution: "",
      allowRemixing: false,
      allowPromotion: false,
      glbFile: null,
      thumbnailFile: null,

      thumbnailUrl: null,
      sceneUrl: null
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const sceneId = match.params.sceneId;
    const isNew = sceneId === "new";

    const scene = isNew ? {} : await this.props.api.getScene(sceneId);
    this.setState({
      name: scene.name || "",
      creatorAttribution: scene.creatorAttribution || "",
      allowRemixing: scene.allowRemixing,
      allowPromotion: scene.allowPromotion,
      thumbnailUrl: scene.screenshot_url,
      sceneId: scene.scene_id,
      sceneUrl: scene.url,
      isLoading: false
    });

    console.log(sceneId, scene);
  }

  onChangeName = name => this.setState({ name });

  onChangeCreatorAttribution = creatorAttribution => this.setState({ creatorAttribution });

  onChangeAllowRemixing = allowRemixing => this.setState({ allowRemixing });

  onChangeAllowPromotion = allowPromotion => this.setState({ allowPromotion });

  onChangeGlbFile = ([glbFile]) => this.setState({ glbFile });

  onChangeThumbnailFile = ([thumbnailFile]) => {
    if (this.state.thumbnailUrl && this.state.thumbnailUrl.indexOf("data:") === 0) {
      URL.revokeObjectURL(this.state.thumbnailUrl);
    }

    this.setState({ thumbnailFile });

    // For preview
    const reader = new FileReader();
    reader.onload = e => {
      this.setState({
        thumbnailUrl: e.target.result
      });
    };
    reader.readAsDataURL(thumbnailFile);
  };

  onPublish = async e => {
    const API = this.props.api;

    e.preventDefault();
    console.log(this.state);

    this.setState({ isUploading: true });

    const abortController = new AbortController();

    const resp = await API.publishGLBScene(
      this.state.thumbnailFile,
      this.state.glbFile,
      {
        name: this.state.name,
        allow_remixing: this.state.allowRemixing,
        allow_promotion: this.state.allowPromotion,
        attributions: {
          creator: this.state.creatorAttribution,
          content: []
        }
      },
      abortController.signal,
      this.state.sceneId
    );

    console.log(resp);
    const scene = resp.scenes[0];
    this.setState({
      isUploading: false,
      sceneId: scene.scene_id,
      sceneUrl: scene.url,
      glbFile: null,
      thumbnailFile: null
    });
  };

  openScene = () => {
    window.open(this.state.sceneUrl);
  };

  render() {
    const { sceneId, sceneUrl, isLoading, isUploading } = this.state;

    const isNew = !sceneId;

    const { creatorAttribution, name, allowRemixing, allowPromotion } = this.state;

    const maxSize = this.props.api.maxUploadSize;

    const content = isLoading ? (
      <ProgressBar />
    ) : (
      <>
        <SceneUploadHeader>
          <h1>{isNew ? "Publish Scene From GLB" : "Update GLB Scene"}</h1>

          {sceneUrl && (
            <Button disabled={isUploading} onClick={this.openScene}>
              {configs.isMoz() ? "Open in Hubs" : "Open Scene"}
            </Button>
          )}
        </SceneUploadHeader>
        <SceneUploadFormContainer>
          <LeftContent>
            <label htmlFor="screenshotFile">
              {this.state.thumbnailUrl ? (
                <img src={this.state.thumbnailUrl} />
              ) : (
                <div>Click to select scene thumbnail (16:9 .png)</div>
              )}
            </label>
            <input
              id="screenshotFile"
              type="file"
              required={isNew}
              accept=".png,image/png"
              onChange={e => this.onChangeThumbnailFile(e.target.files)}
            />
          </LeftContent>

          <RightContent>
            <FormField>
              <label htmlFor="sceneName">Scene Name</label>
              <StringInput
                id="sceneName"
                required
                pattern={"[A-Za-z0-9-':\"!@#$%^&*(),.?~ ]{4,64}"}
                title="Name must be between 4 and 64 characters and cannot contain underscores"
                value={name}
                onChange={this.onChangeName}
              />
            </FormField>
            <FormField>
              <label htmlFor="creatorAttribution">Your Attribution (optional):</label>
              <StringInput
                id="creatorAttribution"
                value={creatorAttribution}
                onChange={this.onChangeCreatorAttribution}
              />
            </FormField>
            <FormField>
              <FormField inline>
                <label htmlFor="allowRemixing">
                  Allow{" "}
                  <a
                    href="https://github.com/mozilla/Spoke/blob/master/REMIXING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Remixing
                  </a>
                  &nbsp;with
                  <br />
                  Creative Commons&nbsp;
                  <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">
                    CC-BY 3.0
                  </a>
                </label>
                <BooleanInput id="allowRemixing" value={allowRemixing} onChange={this.onChangeAllowRemixing} />
              </FormField>
              <FormField inline>
                <label htmlFor="allowPromotion">
                  Allow {configs.isMoz() ? "Mozilla to " : ""}
                  <a
                    href="https://github.com/mozilla/Spoke/blob/master/PROMOTION.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {configs.isMoz() ? "promote" : "promotion"}
                  </a>{" "}
                  {configs.isMoz() ? "" : "of "}my scene
                </label>
                <BooleanInput id="allowPromotion" value={allowPromotion} onChange={this.onChangeAllowPromotion} />
              </FormField>
            </FormField>

            <FormField>
              <FileInput
                label={isNew ? "Select scene model file (.glb)" : `Replace scene model file (max ${maxSize}mb .glb)`}
                id="glbFile"
                type="file"
                required={isNew}
                accept=".glb,model/gltf-binary"
                showSelectedFile
                onChange={this.onChangeGlbFile}
              />
            </FormField>
            {isUploading ? <ProgressBar /> : <Button type="submit">{isNew ? "Publish" : "Update"}</Button>}
          </RightContent>
        </SceneUploadFormContainer>
      </>
    );

    return (
      <>
        <NavBar />
        <main>
          <UploadSceneSection onSubmit={this.onPublish}>
            <UploadSceneContainer>{content}</UploadSceneContainer>
          </UploadSceneSection>
        </main>
        <Footer />
      </>
    );
  }
}

export default withApi(CreateScenePage);
