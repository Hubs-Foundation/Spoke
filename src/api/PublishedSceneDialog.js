import React from "react";
import PropTypes from "prop-types";
import configs from "../configs";
import PreviewDialog from "../ui/dialogs/PreviewDialog";
import { Button } from "../ui/inputs/Button";

export default function PublishedSceneDialog({ onCancel, sceneName, sceneUrl, screenshotUrl, ...props }) {
  return (
    <PreviewDialog imageSrc={screenshotUrl} title="Scene Published" {...props}>
      <h1>{sceneName}</h1>
      <p>Your scene has been published{configs.isMoz() && " to Hubs"}.</p>
      <Button as="a" href={sceneUrl} target="_blank">
        View Your Scene
      </Button>
    </PreviewDialog>
  );
}

PublishedSceneDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
  sceneName: PropTypes.string.isRequired,
  sceneUrl: PropTypes.string.isRequired,
  screenshotUrl: PropTypes.string.isRequired
};
