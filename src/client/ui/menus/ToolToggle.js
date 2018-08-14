import React, { Component } from "react";
import Toggle from "react-toggle";
import PropTypes from "prop-types";
import "react-toggle/style.css";
import classNames from "classnames";
import styles from "./ToolToggle.scss";

export default class ToolToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: false,
      isSwitch: props.isSwitch,
      icons: {
        checked: this.getIcons(props.icons.checked),
        unchecked: this.getIcons(props.icons.unchecked)
      },
      title: props.text[0]
    };
  }

  getIcons = iconName => {
    if (!iconName) return null;
    return <i className={classNames("fa", iconName)} />;
  };

  onChange = () => {
    this.props.action(this.state.isChecked);
    this.setState({
      isChecked: !this.state.isChecked,
      title: this.props.text[!this.state.isChecked ? 1 : 0]
    });
  };

  renderContent = () => {
    const children = this.props.children;
    if (!this.props.children) {
      return (
        <div>
          <span>{this.state.title}</span>
        </div>
      );
    }
    return React.cloneElement(children, { editor: this.props.editor });
  };

  render() {
    return (
      <div className={styles.wrapper}>
        <Toggle
          defaultChecked={this.state.isChecked}
          onChange={this.onChange}
          icons={this.state.icons}
          className={this.state.isSwitch ? styles.toggleSwitch : styles.toggleOnOff}
        />
        {this.renderContent()}
      </div>
    );
  }
}

ToolToggle.propTypes = {
  text: PropTypes.array,
  action: PropTypes.func,
  isSwitch: PropTypes.bool,
  children: PropTypes.node,
  icons: PropTypes.shape({
    checked: PropTypes.string,
    unchecked: PropTypes.string
  }),
  editor: PropTypes.object
};
