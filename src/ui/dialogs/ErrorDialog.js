import React, { Component } from "react";
import PropTypes from "prop-types";
import * as Sentry from "@sentry/browser";
import Dialog from "./Dialog";
import { Button } from "../inputs/Button";

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
      <Dialog {...props} bottomNav={this.renderBottomNav()}>
        {message}
      </Dialog>
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
