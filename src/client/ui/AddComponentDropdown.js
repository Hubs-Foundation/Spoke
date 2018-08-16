import React, { Component } from "react";
import Select, { components } from "react-select";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./AddComponentDropdown.scss";
import AmbientLightComponent from "../editor/components/AmbientLightComponent";
import DirectionalLightComponent from "../editor/components/DirectionalLightComponent";
import HemisphereLightComponent from "../editor/components/HemisphereLightComponent";
import PointLightComponent from "../editor/components/PointLightComponent";
import SceneReferenceComponent from "../editor/components/SceneReferenceComponent";
import ShadowComponent from "../editor/components/ShadowComponent";
import SpotLightComponent from "../editor/components/SpotLightComponent";
import SkyboxComponent from "../editor/components/SkyboxComponent";

const getIconByName = name => {
  switch (name) {
    case AmbientLightComponent.componentName:
      return "fa-sun";
    case DirectionalLightComponent.componentName:
      return "fa-bolt";
    case HemisphereLightComponent.componentName:
      return "fa-certificate";
    case PointLightComponent.componentName:
      return "fa-lightbulb";
    case SpotLightComponent.componentName:
      return "fa-bullseye";
    case SceneReferenceComponent.componentName:
      return "fa-file-import";
    case ShadowComponent.componentName:
      return "fa-clone";
    case SkyboxComponent.componentName:
      return "fa-cloud";
    default:
      break;
  }
};

const SelectContainer = ({ children, ...props }) => {
  return <components.SelectContainer {...props}>{children}</components.SelectContainer>;
};

SelectContainer.propTypes = {
  children: PropTypes.node
};

const Placeholder = props => {
  const { menuIsOpen } = props.selectProps;
  const textStyle = menuIsOpen ? { color: "black" } : { color: "white" };
  const iconStyle = menuIsOpen ? { color: "#B1B1B3" } : { color: "white" };
  const icon = menuIsOpen ? "fa-search" : "fa-plus";
  const text = props.children;
  return (
    <components.Placeholder {...props}>
      <span style={textStyle}>
        <i style={iconStyle} className={classNames("fas", icon)} />
        {text}
      </span>
    </components.Placeholder>
  );
};

Placeholder.propTypes = {
  children: PropTypes.string,
  selectProps: PropTypes.shape({
    menuIsOpen: PropTypes.bool
  })
};

const Option = props => {
  const { label, value } = props;
  const icon = getIconByName(value);
  return (
    <components.Option {...props}>
      <span>
        <i className={classNames("fas", icon)} />
        {label}
      </span>
    </components.Option>
  );
};

Option.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string
};

const DropdownIndicator = () => {
  return null;
};

const IndicatorSeparator = () => {
  return null;
};

export default class AddComponentDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  toggleSelect = () => {
    this.setState({
      isOpen: !this.state.isOpen
    });
  };

  getCustomStyles = () => {
    return {
      control: base => ({
        ...base,
        backgroundColor: this.state.isOpen ? "white" : "#006EFF",
        minHeight: "20px",
        maxWidth: "220px",
        minWidth: "124px",
        border: 0,
        margin: "6px auto",
        padding: this.state.isOpen ? "0px 8px" : "0px",
        display: "inline-block"
      }),
      container: base => ({
        ...base,
        height: "20px",
        padding: this.state.isOpen ? "0px 8px" : "0px"
      }),
      menu: () => ({
        maxWidth: "220px",
        minWidth: "124px",
        display: "inline-block",
        borderRadius: "4px",
        textAlign: "left"
      }),
      option: base => ({
        ...base,
        backgroundColor: "black"
      })
    };
  };

  render() {
    const { options, className, onChange } = this.props;
    const text = this.state.isOpen ? "Search..." : "Add a component";
    return (
      <Select
        components={{
          Placeholder,
          IndicatorSeparator,
          DropdownIndicator,
          SelectContainer,
          Option
        }}
        styles={this.getCustomStyles()}
        placeholder={text}
        classNamePrefix={this.state.isOpen ? "rc-select" : null}
        options={options}
        onChange={onChange}
        onMenuOpen={this.toggleSelect}
        onMenuClose={this.toggleSelect}
      />
    );
  }
}

AddComponentDropdown.propTypes = {
  placeholder: PropTypes.string,
  options: PropTypes.array,
  className: PropTypes.string,
  onChange: PropTypes.func
};
