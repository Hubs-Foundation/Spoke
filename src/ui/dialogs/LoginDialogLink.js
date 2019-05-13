import React, { Component } from "react";
import PropTypes from "prop-types";
import { withDialog } from "../contexts/DialogContext";
import { withApi } from "../contexts/ApiContext";

class LoginDialogLink extends Component {
  static propTypes = {
    api: PropTypes.object.isRequired,
    showDialog: PropTypes.func.isRequired,
    hideDialog: PropTypes.func.isRequired,
    children: PropTypes.node
  };

  onClick = e => {
    const { api, showDialog, hideDialog } = this.props;
    e.preventDefault();
    e.target.blur();
    api.showLoginDialog(showDialog, hideDialog);
  };

  render() {
    return (
      <a href="" onClick={this.onClick}>
        {this.props.children}
      </a>
    );
  }
}

export default withDialog(withApi(LoginDialogLink));
