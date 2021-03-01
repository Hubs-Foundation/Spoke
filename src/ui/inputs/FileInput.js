import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

import { Button } from "./Button";

let nextId = 0;

export const FileInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

// We do this instead of actually hiding it so that form validation can still display tooltips correctly
export const StyledInput = styled.input`
  opacity: 0;
  position: absolute;
`;

export default class FileInput extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    showSelectedFile: PropTypes.bool
  };

  static defaultProps = {
    label: "Upload...",
    showSelectedFile: false
  };

  constructor(props) {
    super(props);

    this.state = {
      id: `file-input-${nextId++}`
    };
  }

  onChange = e => {
    this.setState({ filename: e.target.files[0].name });
    this.props.onChange(e.target.files, e);
  };

  render() {
    const { label, onChange, ...rest } = this.props;

    return (
      <FileInputContainer>
        <Button as="label" htmlFor={this.state.id}>
          {label}
        </Button>
        <StyledInput {...rest} id={this.state.id} type="file" onChange={this.onChange} />
        {this.props.showSelectedFile && <span>{this.state.filename ? this.state.filename : "No File chosen"}</span>}
      </FileInputContainer>
    );
  }
}
