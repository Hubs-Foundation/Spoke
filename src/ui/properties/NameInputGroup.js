import React, { Component } from "react";
import PropTypes from "prop-types";
import InputGroup from "../inputs/InputGroup";
import StringInput from "../inputs/StringInput";
import styled from "styled-components";

const StyledNameInputGroup = styled(InputGroup)`
  label {
    width: auto !important;
    padding-right: 8px;
  }
`;

export default class NameInputGroup extends Component {
  static propTypes = {
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      name: this.props.node.name,
      focusedNode: null
    };
  }

  onUpdateName = name => {
    this.setState({ name });
  };

  onFocus = () => {
    this.setState({
      focusedNode: this.props.node,
      name: this.props.node.name
    });
  };

  onBlurName = () => {
    // Check that the focused node is current node before setting the property.
    // This can happen when clicking on another node in the HierarchyPanel
    if (this.props.node.name !== this.state.name && this.props.node === this.state.focusedNode) {
      this.props.editor.setPropertySelected("name", this.state.name);
    }

    this.setState({ focusedNode: null });
  };

  onKeyUpName = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.props.editor.setPropertySelected("name", this.state.name);
    }
  };

  render() {
    const name = this.state.focusedNode ? this.state.name : this.props.node.name;

    return (
      <StyledNameInputGroup name="Name">
        <StringInput
          value={name}
          onChange={this.onUpdateName}
          onFocus={this.onFocus}
          onBlur={this.onBlurName}
          onKeyUp={this.onKeyUpName}
        />
      </StyledNameInputGroup>
    );
  }
}
