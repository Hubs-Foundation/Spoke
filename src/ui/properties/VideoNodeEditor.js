import React from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import StringInput from "../inputs/StringInput";
import { VideoProjection } from "../../editor/objects/Video";
import VideoInput from "../inputs/VideoInput";
import { Video } from "styled-icons/fa-solid/Video";
import AudioSourceProperties from "./AudioSourceProperties";
import useSetPropertySelected from "./useSetPropertySelected";
import AttributionNodeEditor from "./AttributionNodeEditor";

const videoProjectionOptions = Object.values(VideoProjection).map(v => ({ label: v, value: v }));

export default function VideoNodeEditor(props) {
  const { editor, node } = props;
  const onChangeSrc = useSetPropertySelected(editor, "src");
  const onChangeProjection = useSetPropertySelected(editor, "projection");
  const onChangeBillboard = useSetPropertySelected(editor, "billboard");
  const onChangeHref = useSetPropertySelected(editor, "href");

  return (
    <NodeEditor description={VideoNodeEditor.description} {...props}>
      <InputGroup name="Video">
        <VideoInput value={node.src} onChange={onChangeSrc} />
      </InputGroup>
      <InputGroup name="Billboard" info="Video always faces user in Hubs. Does not billboard in Spoke.">
        <BooleanInput value={node.billboard} onChange={onChangeBillboard} />
      </InputGroup>
      {node.projection === VideoProjection.Flat && (
        <InputGroup name="Link Href" info="Allows the video to function as a link for the given url.">
          <StringInput value={node.href} onChange={onChangeHref} />
        </InputGroup>
      )}
      <InputGroup name="Projection">
        <SelectInput options={videoProjectionOptions} value={node.projection} onChange={onChangeProjection} />
      </InputGroup>
      <AudioSourceProperties {...props} />
      <AttributionNodeEditor name="Attribution" {...props} />
    </NodeEditor>
  );
}

VideoNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object,
  multiEdit: PropTypes.bool
};

VideoNodeEditor.iconComponent = Video;

VideoNodeEditor.description = "Dynamically loads a video.";
