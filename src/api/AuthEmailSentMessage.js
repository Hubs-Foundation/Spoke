import React, { Component } from "react";
import PropTypes from "prop-types";
import ProgressBar from "../ui/inputs/ProgressBar";
import styled from "styled-components";

const StyledAuthEmailSentMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  max-width: 400px;
  align-self: center;

  & > * {
    margin-bottom: 20px;
  }

  h2 {
    font-size: 20px;
  }
`;

export default class AuthEmailSentMessage extends Component {
  static propTypes = {
    email: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired
  };

  onCancel = e => {
    e.preventDefault();
    e.target.blur();
    this.props.onCancel();
  };

  render() {
    return (
      <StyledAuthEmailSentMessage>
        <h2>Email sent!</h2>
        <p>Waiting for you to click on the link sent to {this.props.email}</p>
        <strong>Don&#39;t close this browser tab or you may lose your work!</strong>
        <ProgressBar />
        <div>
          <a href="" onClick={this.onCancel}>
            Cancel
          </a>
        </div>
      </StyledAuthEmailSentMessage>
    );
  }
}
