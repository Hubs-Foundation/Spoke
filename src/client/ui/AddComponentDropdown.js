import React, { Component } from "react";
import Select, { components } from "react-select";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./AddComponentDropdown";
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
  return (
    <components.SelectContainer className={styles.selectContainer} {...props}>
      {children}
    </components.SelectContainer>
  );
};

SelectContainer.propTypes = {
  children: PropTypes.node
};

const Placeholder = props => {
  const icon = props.selectProps.innerProps.placeholderIcon;
  const text = props.children;
  return (
    <components.Placeholder {...props}>
      <span>
        <i className={classNames("fas", icon)} />
        {text}
      </span>
    </components.Placeholder>
  );
};

Placeholder.propTypes = {
  children: PropTypes.string,
  selectProps: PropTypes.shape({
    innerProps: PropTypes.shape({
      placeholderIcon: PropTypes.string
    })
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
        placeholder={text}
        options={options}
        className={className}
        onChange={onChange}
        onMenuOpen={this.toggleSelect}
        onMenuClose={this.toggleSelect}
        innerProps={{ placeholderIcon: this.state.isOpen ? "fa-search" : "fa-plus" }}
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
