import React, { Component } from "react";
import PropTypes from "prop-types";
import * as Sentry from "@sentry/browser";
import Dialog, { DialogContent } from "./Dialog";
import { Button } from "../inputs/Button";
import styled from "styled-components";

const ErrorDialogContainer = styled(Dialog)`
  max-width: 600px;

  ${DialogContent} {
    padding: 0;
  }
`;

const ErrorMessage = styled.code`
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 16px;
  color: ${props => props.theme.red};
`;

export default class ErrorDialog extends Component {
  state = { eventId: null };

  componentDidMount() {
    if (this.props.error) {
      const eventId = Sentry.captureException(this.props.error);
      this.setState({ eventId });
    }
  }

  onShowReportDialog = () => {
    Sentry.showReportDialog({
      eventId: this.state.eventId,
      user: {
        name: "Anonymous Spoke User",
        email: "anonymous.spoke.user@mozilla.com"
      }
    });
  };

  renderBottomNav() {
    return this.state.eventId ? <Button onClick={this.onShowReportDialog}>Submit Feedback</Button> : null;
  }

  render() {
    const { error, message, onCancel, ...props } = this.props;

    return (
      <ErrorDialogContainer {...props} bottomNav={this.renderBottomNav()}>
        <ErrorMessage>{message}</ErrorMessage>
      </ErrorDialogContainer>
    );
  }
}

ErrorDialog.propTypes = {
  title: PropTypes.string.isRequired,
  error: PropTypes.object,
  message: PropTypes.string.isRequired,
  onCancel: PropTypes.func
};

ErrorDialog.defaultProps = {
  title: "Error"
};
