import React, { Component } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import SpokeLogo from "./SpokeLogo";

const StyledLoading = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: ${props => (props.fullScreen ? "100vh" : "100%")};
  width: ${props => (props.fullScreen ? "100vw" : "100%")};
  min-height: 300px;

  svg {
    margin-bottom: 20px;
  }
`;

export default class Loading extends Component {
  static propTypes = {
    message: PropTypes.string,
    fullScreen: PropTypes.bool
  };

  render() {
    return (
      <StyledLoading fullScreen={this.props.fullScreen}>
        <SpokeLogo />
        {this.props.message}
      </StyledLoading>
    );
  }
}
