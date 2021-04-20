import React from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";
import SelectInput from "../inputs/SelectInput";
import BooleanInput from "../inputs/BooleanInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import { ImageProjection, ImageAlphaMode } from "../../editor/objects/Image";
import ImageInput from "../inputs/ImageInput";
import { Image } from "styled-icons/fa-solid/Image";
import useSetPropertySelected from "./useSetPropertySelected";
import AttributionNodeEditor from "./AttributionNodeEditor";

const mapValue = v => ({ label: v, value: v });
const imageProjectionOptions = Object.values(ImageProjection).map(mapValue);
const imageTransparencyOptions = Object.values(ImageAlphaMode).map(mapValue);

export default function ImageNodeEditor(props) {
  const { editor, node } = props;
  const onChangeSrc = useSetPropertySelected(editor, "src");
  const onChangeControls = useSetPropertySelected(editor, "controls");
  const onChangeBillboard = useSetPropertySelected(editor, "billboard");
  const onChangeProjection = useSetPropertySelected(editor, "projection");
  const onChangeTransparencyMode = useSetPropertySelected(editor, "alphaMode");
  const onChangeAlphaCutoff = useSetPropertySelected(editor, "alphaCutoff");
  const onChangeHref = useSetPropertySelected(editor, "href");

  return (
    <NodeEditor description={ImageNodeEditor.description} {...props}>
      <InputGroup name="Image Url">
        <ImageInput value={node.src} onChange={onChangeSrc} />
      </InputGroup>
      <InputGroup
        name="Controls"
        info="Toggle the visibility of the media controls in Hubs. Does not billboard in Spoke."
      >
        <BooleanInput value={node.controls} onChange={onChangeControls} />
      </InputGroup>
      <InputGroup name="Billboard" info="Image always faces user in Hubs.">
        <BooleanInput value={node.billboard} onChange={onChangeBillboard} />
      </InputGroup>
      {node.projection === ImageProjection.Flat && (
        <InputGroup name="Link Href" info="Allows the image to function as a link for the given url.">
          <StringInput value={node.href} onChange={onChangeHref} />
        </InputGroup>
      )}
      <InputGroup
        name="Transparency Mode"
        info={`How to apply transparency:
'opaque' = no transparency
'blend' = use the images alpha channel
'mask' = Use a specified cutoff value for on/off transparency (more performant)
`}
      >
        <SelectInput options={imageTransparencyOptions} value={node.alphaMode} onChange={onChangeTransparencyMode} />
      </InputGroup>
      {node.alphaMode === ImageAlphaMode.Mask && (
        <NumericInputGroup
          name="Alpha Cutoff"
          info="Pixels with alpha values lower than this will be transparent"
          min={0}
          max={1}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={0.25}
          value={node.alphaCutoff}
          onChange={onChangeAlphaCutoff}
        />
      )}
      <InputGroup name="Projection">
        <SelectInput options={imageProjectionOptions} value={node.projection} onChange={onChangeProjection} />
      </InputGroup>
      <AttributionNodeEditor name="Attribution" {...props} />
    </NodeEditor>
  );
}

ImageNodeEditor.propTypes = {
  editor: PropTypes.object,
  node: PropTypes.object,
  multiEdit: PropTypes.bool
};

ImageNodeEditor.iconComponent = Image;

ImageNodeEditor.description = "Dynamically loads an image.";
