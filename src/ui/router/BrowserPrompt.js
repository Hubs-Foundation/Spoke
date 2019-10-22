import React from "react";
import { Prompt } from "react-router-dom";
import PropTypes from "prop-types";

export default class BrowserPrompt extends React.Component {
  static propTypes = {
    message: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired
  };

  constructor(props) {
    super(props);

    window.addEventListener("beforeunload", this.onBeforeUnload);
  }

  onBeforeUnload = e => {
    const dialogText = this.props.message;
    e.returnValue = dialogText;
    return dialogText;
  };

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onBeforeUnload);
  }

  render() {
    return <Prompt {...this.props} />;
  }
}
