import PropTypes from "prop-types";
import configs from "../../configs";
import { withApi } from "../contexts/ApiContext";
import NavBar from "../navigation/NavBar";
import Footer from "../navigation/Footer";
import styled from "styled-components";
import { Redirect } from "react-router-dom";

import React, { useState, useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom";

import StringInput from "../inputs/StringInput";
import BooleanInput from "../inputs/BooleanInput";
import FileInput from "../inputs/FileInput";
import FormField from "../inputs/FormField";
import { Button } from "../inputs/Button";
import ProgressBar from "../inputs/ProgressBar";

const SceneUploadFormContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  background-color: ${props => props.theme.panel2};
  border-radius: 3px;
`;

const InfoBox = styled.div`
  background-color: ${props => props.theme.panel2};
  margin-top: 10px;
  padding: 10px;
  border-radius: 3px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.red};
  margin-top: 8px;
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

export const UploadSceneContainer = styled.div`
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

function CreateScenePage({ match, api }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [sceneId, setSceneId] = useState(null);
  const [error, setError] = useState(null);

  const [sceneInfo, setSceneInfo] = useState({
    name: "",
    creatorAttribution: "",
    allowRemixing: false,
    allowPromotion: false
  });

  const [glbFile, setGlbFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [sceneUrl, setSceneUrl] = useState(null);

  const history = useHistory();

  const openScene = useCallback(() => {
    window.open(sceneUrl);
  }, [sceneUrl]);

  useEffect(() => {
    async function doInitialLoad() {
      const sceneId = match.params.sceneId;
      const isNew = sceneId === "new";

      const scene = isNew ? {} : await api.getScene(sceneId);
      setSceneInfo({
        name: scene.name || "",
        creatorAttribution: (scene.attributions && scene.attributions.creator) || "",
        allowRemixing: scene.allow_remixing,
        allowPromotion: scene.allow_promotion
      });
      setThumbnailUrl(scene.screenshot_url);
      setSceneId(scene.scene_id);
      setSceneUrl(scene.url);
      setIsLoading(false);
    }
    doInitialLoad().catch(e => {
      console.error(e);
      setError(e.message);
    });
  }, [match, api, setSceneInfo, setThumbnailUrl, setSceneId, setSceneUrl, setIsLoading]);

  const onChangeName = useCallback(
    name => {
      setSceneInfo(sceneInfo => ({ ...sceneInfo, name }));
    },
    [setSceneInfo]
  );

  const onChangeCreatorAttribution = useCallback(
    creatorAttribution => {
      setSceneInfo({ ...sceneInfo, creatorAttribution });
    },
    [sceneInfo, setSceneInfo]
  );

  const onChangeAllowRemixing = useCallback(
    allowRemixing => {
      setSceneInfo({ ...sceneInfo, allowRemixing });
    },
    [sceneInfo, setSceneInfo]
  );

  const onChangeAllowPromotion = useCallback(
    allowPromotion => {
      setSceneInfo({ ...sceneInfo, allowPromotion });
    },
    [sceneInfo, setSceneInfo]
  );

  const onChangeGlbFile = useCallback(
    ([file]) => {
      setGlbFile(file);
    },
    [setGlbFile]
  );

  const onChangeThumbnailFile = useCallback(
    ([file]) => {
      setThumbnailFile(file);
    },
    [setThumbnailFile]
  );

  // For preview
  useEffect(() => {
    if (!thumbnailFile) return;
    const reader = new FileReader();
    reader.onload = e => {
      setThumbnailUrl(prevUrl => {
        if (prevUrl && prevUrl.indexOf("data:") === 0) {
          URL.revokeObjectURL(prevUrl);
        }
        return e.target.result;
      });
    };
    reader.readAsDataURL(thumbnailFile);

    return () => {
      reader.abort();
    };
  }, [thumbnailFile, setThumbnailUrl]);

  const onPublish = useCallback(
    e => {
      e.preventDefault();

      setError(null);
      setIsUploading(true);

      const abortController = new AbortController();

      api
        .publishGLBScene(
          thumbnailFile,
          glbFile,
          {
            name: sceneInfo.name,
            allow_remixing: sceneInfo.allowRemixing,
            allow_promotion: sceneInfo.allowPromotion,
            attributions: {
              creator: sceneInfo.creatorAttribution,
              content: []
            }
          },
          abortController.signal,
          sceneId
        )
        .then(() => history.push("/projects"))
        .catch(e => {
          setIsUploading(false);
          setError(e.message);
        });
    },
    [thumbnailFile, glbFile, sceneInfo, sceneId, setIsUploading, api, history, setError]
  );

  if (!api.isAuthenticated()) {
    return <Redirect to="/login" />;
  }

  const isNew = !sceneId;

  const content = isLoading ? (
    error ? (
      <ErrorMessage>{error}</ErrorMessage>
    ) : (
      <ProgressBar />
    )
  ) : (
    <>
      <SceneUploadHeader>
        <h1>{isNew ? "Publish Scene From Blender" : "Update Blender Scene"}</h1>

        {sceneUrl && (
          <Button disabled={isUploading} onClick={openScene}>
            {configs.isMoz() ? "Open in Hubs" : "Open Scene"}
          </Button>
        )}
      </SceneUploadHeader>
      <SceneUploadFormContainer>
        <LeftContent>
          <label htmlFor="screenshotFile">
            {thumbnailUrl ? <img src={thumbnailUrl} /> : <div>Click to select scene thumbnail (16:9 .png)</div>}
          </label>
          <input
            id="screenshotFile"
            type="file"
            required={isNew}
            accept=".png,image/png"
            onChange={e => onChangeThumbnailFile(e.target.files)}
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
              value={sceneInfo.name}
              onChange={onChangeName}
            />
          </FormField>
          <FormField>
            <label htmlFor="creatorAttribution">Your Attribution (optional):</label>
            <StringInput
              id="creatorAttribution"
              value={sceneInfo.creatorAttribution}
              onChange={onChangeCreatorAttribution}
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
              <BooleanInput id="allowRemixing" value={sceneInfo.allowRemixing} onChange={onChangeAllowRemixing} />
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
              <BooleanInput id="allowPromotion" value={sceneInfo.allowPromotion} onChange={onChangeAllowPromotion} />
            </FormField>
          </FormField>

          <FormField>
            <FileInput
              label={`${isNew ? "Select scene model file" : "Replace scene model file"} (max ${
                api.maxUploadSize
              }mb .glb)`}
              id="glbFile"
              type="file"
              required={isNew}
              accept=".glb,model/gltf-binary"
              showSelectedFile
              onChange={onChangeGlbFile}
            />
          </FormField>
          {isUploading ? <ProgressBar /> : <Button type="submit">{isNew ? "Publish" : "Update"}</Button>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </RightContent>
      </SceneUploadFormContainer>
      <InfoBox>
        For more info on creating scenes in Blender, check out the{" "}
        <a href="https://github.com/mozillareality/hubs-blender-exporter">Hubs Blender Exporter</a>
      </InfoBox>
    </>
  );

  return (
    <>
      <NavBar />
      <main>
        <UploadSceneSection onSubmit={onPublish}>
          <UploadSceneContainer>{content}</UploadSceneContainer>
        </UploadSceneSection>
      </main>
      <Footer />
    </>
  );
}

CreateScenePage.propTypes = {
  api: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object
};

export default withApi(CreateScenePage);
