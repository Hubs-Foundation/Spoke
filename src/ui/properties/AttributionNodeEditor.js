import React, { Component } from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";
import Collapsible from "../inputs/Collapsible";

export default class AttributionNodeEditor extends Component {
  static propTypes = {
    name: PropTypes.string,
    description: PropTypes.string,
    node: PropTypes.object,
    editor: PropTypes.object,
    children: PropTypes.node,
    disableTransform: PropTypes.bool
  };

  static defaultProps = {
    disableTransform: false
  };

  onChangeAttribution = (attribution, key, value) => {
    attribution[key] = value;
    this.props.editor.setPropertySelected("attribution", attribution);
  };

  render() {
    const { name, node } = this.props;

    return (
      <Collapsible label={name}>
        <InputGroup name="Title">
          <StringInput
            value={(node.attribution && node.attribution.title) || ""}
            onChange={title => this.onChangeAttribution(node.attribution, "title", title)}
          />
        </InputGroup>
        <InputGroup name="Author">
          <StringInput
            value={(node.attribution && node.attribution.author) || ""}
            onChange={author => this.onChangeAttribution(node.attribution, "author", author)}
          />
        </InputGroup>
        <InputGroup name="Url">
          <StringInput
            value={(node.attribution && node.attribution.url) || ""}
            onChange={url => this.onChangeAttribution(node.attribution, "url", url)}
          />
        </InputGroup>
      </Collapsible>
    );
  }
}
