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
      isSwitch: props.isSwitch,
      icons: {
        checked: this.getIcons(props.icons.checked),
        unchecked: this.getIcons(props.icons.unchecked)
      },
      title: props.text[!props.isChecked ? 1 : 0]
    };
  }

  getIcons = iconName => {
    if (!iconName) return null;
    return <i className={classNames("fa", iconName)} />;
  };

  onChange = () => {
    this.props.action();
  };

  renderContent = () => {
    const children = this.props.children;
    if (!this.props.children) {
      return (
        <div className={styles.toggleText}>
          <span>{this.props.text[!this.props.isChecked ? 0 : 1]}</span>
        </div>
      );
    }
    return React.cloneElement(children, { editor: this.props.editor });
  };

  render() {
    return (
      <div className={styles.wrapper}>
        <Toggle
          checked={this.props.isChecked}
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
  isChecked: PropTypes.bool,
  isSwitch: PropTypes.bool,
  children: PropTypes.node,
  icons: PropTypes.shape({
    checked: PropTypes.string,
    unchecked: PropTypes.string
  }),
  editor: PropTypes.object
};
