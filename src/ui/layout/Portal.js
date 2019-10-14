import { Component } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

export default class Portal extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  constructor(props) {
    super(props);
    this.el = document.createElement("div");
  }

  componentDidMount() {
    document.body.appendChild(this.el);
  }

  componentWillUnmount() {
    try {
      if (this.el) {
        document.body.removeChild(this.el);
      }
    } catch (err) {
      console.warn(`Error removing Portal element: ${err}`);
    }
  }

  render() {
    return createPortal(this.props.children, this.el);
  }
}
