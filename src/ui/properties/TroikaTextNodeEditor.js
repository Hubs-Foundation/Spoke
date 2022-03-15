import React, { Component } from "react";
import PropTypes from "prop-types";
import NodeEditor from "./NodeEditor";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";
import { AlignCenter } from "styled-icons/fa-solid/AlignCenter";
import SelectInput from "../inputs/SelectInput";
import NumericInputGroup from "../inputs/NumericInputGroup";
import ColorInput from "../inputs/ColorInput";
import Vector2Input from "../inputs/Vector2Input";

const textAlignments = [
  {
    label: "left",
    value: "left"
  },
  {
    label: "right",
    value: "right"
  },
  {
    label: "center",
    value: "center"
  },
  {
    label: "justify",
    value: "justify"
  }
];

const xAnchors = [
  {
    label: "left",
    value: "left"
  },
  {
    label: "right",
    value: "right"
  },
  {
    label: "center",
    value: "center"
  }
];

const yAnchors = [
  {
    label: "top",
    value: "top"
  },
  {
    label: "top-baseline",
    value: "top-baseline"
  },
  {
    label: "middle",
    value: "middle"
  },
  {
    label: "bottom-baseline",
    value: "bottom-baseline"
  },
  {
    label: "bottom",
    value: "bottom"
  }
];

const overflowWraps = [
  {
    label: "normal",
    value: "normal"
  },
  {
    label: "break-word",
    value: "break-word"
  }
];

const whiteSpaces = [
  {
    label: "normal",
    value: "normal"
  },
  {
    label: "nowrap",
    value: "nowrap"
  }
];

export default class TroikaTextNodeEditor extends Component {
  static propTypes = {
    editor: PropTypes.object,
    node: PropTypes.object,
    multiEdit: PropTypes.bool
  };

  static iconComponent = AlignCenter;

  static description = "Creates a 3D text element using the troika-three-text library.";

  constructor(props) {
    super(props);

    // TODO: determine proper use of UI component state
    this.state = {
      options: []
    };
  }

  componentDidMount() {
    const options = [];

    const sceneNode = this.props.editor.scene;

    sceneNode.traverse(o => {
      if (o.isNode && o !== sceneNode) {
        options.push({ label: o.name, value: o.uuid, nodeName: o.nodeName });
      }
    });

    this.setState({ options });
  }

  onChangeProperty = (property, value) => {
    this.props.editor.setPropertySelected(property, value);
  };

  render() {
    const { node } = this.props;

    return (
      <NodeEditor description={TroikaTextNodeEditor.description} {...this.props}>
        <InputGroup name="Text" info="The text you want to display in your scene">
          <StringInput
            value={node.text}
            onChange={value => {
              this.onChangeProperty("text", value);
            }}
          />
        </InputGroup>

        <NumericInputGroup
          name="Font Size"
          info="The em-height at which to render the font, in local world units."
          min={0}
          smallStep={0.01}
          mediumStep={0.1}
          largeStep={1}
          value={node.fontSize}
          onChange={value => {
            this.onChangeProperty("fontSize", value);
          }}
          unit="m"
        />

        <InputGroup name="Color" info="Set the color of the text's material.">
          <ColorInput
            value={node.color}
            onChange={value => {
              this.onChangeProperty("color", value);
            }}
          />
        </InputGroup>

        <NumericInputGroup
          name="Max Width"
          info="The maximum width of the text block, above which text may start wrapping according to the whiteSpace and overflowWrap properties."
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={node.maxWidth}
          onChange={value => {
            this.onChangeProperty("maxWidth", value);
          }}
          unit="m"
        />

        <NumericInputGroup
          name="Letter Spacing"
          info="Sets a uniform adjustment to spacing between letters after kerning is applied, in local world units. Positive numbers increase spacing and negative numbers decrease it."
          min={-100}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={node.letterSpacing}
          onChange={value => {
            this.onChangeProperty("letterSpacing", value);
          }}
          unit="m"
        />

        <InputGroup name="Clip Rect Min">
          <Vector2Input
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            value={node.clipRectMin}
            onChange={value => {
              this.onChangeProperty("clipRectMin", value);
            }}
          />
        </InputGroup>

        <InputGroup name="Clip Rect Max">
          <Vector2Input
            smallStep={0.01}
            mediumStep={0.1}
            largeStep={0.25}
            value={node.clipRectMax}
            onChange={value => {
              this.onChangeProperty("clipRectMax", value);
            }}
          />
        </InputGroup>

        <NumericInputGroup
          name="Line Height"
          info="Sets the height of each line of text. Can either be 'normal' which chooses a reasonable height based on the chosen font's ascender/descender metrics, or a number that is interpreted as a multiple of the fontSize."
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          value={node.lineHeight}
          onChange={value => {
            this.onChangeProperty("lineHeight", value);
          }}
          unit="x"
        />

        <InputGroup
          name="Text Align"
          info="The horizontal alignment of each line of text within the overall text bounding box."
        >
          <SelectInput
            label="Text Align"
            options={textAlignments}
            value={node.textAlign}
            onChange={value => {
              this.onChangeProperty("textAlign", value);
            }}
          />
        </InputGroup>

        <InputGroup
          name="Anchors"
          info="Defines the horizontal and vertical position in the text block that should line up with the local origin."
        >
          <SelectInput
            label="Anchor X"
            options={xAnchors}
            value={node.anchorX}
            onChange={value => {
              this.onChangeProperty("anchorX", value);
            }}
          />
          <SelectInput
            label="Anchor Y"
            options={yAnchors}
            value={node.anchorY}
            onChange={value => {
              this.onChangeProperty("anchorY", value);
            }}
          />
        </InputGroup>

        <InputGroup
          name="Overflow Wrap"
          info="Defines how text wraps. Can be either 'normal' to break at whitespace characters, or 'break-word' to allow breaking within words."
        >
          <SelectInput
            options={overflowWraps}
            value={node.overflowWrap}
            onChange={value => {
              this.onChangeProperty("overflowWrap", value);
            }}
          />
        </InputGroup>

        <NumericInputGroup
          name="Text Indent"
          info="An indentation applied to the first character of each hard newline. Behaves like CSS text-indent."
          min={0}
          smallStep={0.1}
          mediumStep={0.5}
          largeStep={1}
          value={node.textIndent}
          onChange={value => {
            this.onChangeProperty("textIndent", value);
          }}
          unit="m"
        />

        <NumericInputGroup
          name="Curve Radius"
          info="Defines a cylindrical radius along which the text's plane will be curved."
          min={-100}
          smallStep={0.1}
          mediumStep={1}
          largeStep={5}
          value={node.curveRadius}
          onChange={value => {
            this.onChangeProperty("curveRadius", value);
          }}
          unit="m"
        />

        <InputGroup
          name="White Space"
          info="Defines whether text should wrap when a line reaches the maxWidth. Can be either 'normal', to allow wrapping according to the overflowWrap property, or 'nowrap' to prevent wrapping."
        >
          <SelectInput
            options={whiteSpaces}
            value={node.whiteSpace}
            onChange={value => {
              this.onChangeProperty("whiteSpace", value);
            }}
          />
        </InputGroup>

        <InputGroup
          name="Stroke Color"
          info="The color of the text's interior stroke lines when strokeWidth is non-zero."
        >
          <ColorInput
            value={node.strokeColor}
            onChange={value => {
              this.onChangeProperty("strokeColor", value);
            }}
          />
        </InputGroup>

        <NumericInputGroup
          name="Stroke Width"
          info="Sets the width of a stroke drawn inside the edge of each text glyph, using the strokeColor and strokeOpacity. The width can be specified as either an absolute number in local units, or as a percentage string e.g. '10%' which is interpreted as a percentage of the fontSize."
          min={0}
          max={1}
          smallStep={1}
          mediumStep={5}
          largeStep={10}
          value={node.strokeWidth}
          onChange={value => {
            this.onChangeProperty("strokeWidth", value);
          }}
          unit="0-1"
        />

        <NumericInputGroup
          name="Stroke Opacity"
          info="The opacity of the text stroke, when strokeWidth is nonzero. Accepts a number from 0 to 1."
          min={0}
          max={1}
          smallStep={0.01}
          mediumStep={0.05}
          largeStep={0.1}
          value={node.strokeOpacity}
          onChange={value => {
            this.onChangeProperty("strokeOpacity", value);
          }}
          unit="0-1"
        />
      </NodeEditor>
    );
  }
}
