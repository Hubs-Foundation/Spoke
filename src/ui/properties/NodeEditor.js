import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactTooltip from "react-tooltip";
import PropertyGroup from "./PropertyGroup";
import TransformPropertyGroup from "./TransformPropertyGroup";
import NameInputGroup from "./NameInputGroup";
import InputGroup from "../inputs/InputGroup";
import BooleanInput from "../inputs/BooleanInput";
import styled from "styled-components";

const StyledNodeEditor = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const PropertiesHeader = styled.div`
  background-color: ${props => props.theme.panel2};
  border: none !important;
  padding-bottom: 0 !important;
`;

const NameInputGroupContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: flex-start;
  padding: 8px 0;
`;

const VisibleInputGroup = styled(InputGroup)`
  display: flex;
  flex: 0;

  & > label {
    width: auto !important;
    padding-right: 8px;
  }
`;

const NodeEditorTooltip = styled(ReactTooltip)`
  max-width: 200px;
  overflow: hidden;
  overflow-wrap: break-word;
  user-select: none;
`;

export default class NodeEditor extends Component {
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

  onChangeVisible = value => {
    this.props.editor.setProperty(this.props.node, "visible", value);
  };

  render() {
    const { node, description, editor, children } = this.props;

    return (
      <StyledNodeEditor>
        <PropertiesHeader>
          <NameInputGroupContainer>
            <NameInputGroup node={node} editor={editor} />
            {node.nodeName !== "Scene" && (
              <VisibleInputGroup name="Visible">
                <BooleanInput value={node.visible} onChange={this.onChangeVisible} />
              </VisibleInputGroup>
            )}
          </NameInputGroupContainer>
          {!node.disableTransform && <TransformPropertyGroup node={node} editor={editor} />}
        </PropertiesHeader>
        <PropertyGroup name={node.nodeName} description={description}>
          {children}
        </PropertyGroup>
        <NodeEditorTooltip id="node-editor" />
      </StyledNodeEditor>
    );
  }
}
