import React, { Component } from "react";
import Select, { components } from "react-select";
import PropTypes from "prop-types";
import classNames from "classnames";
import "./AddComponentDropdown.scss";

const SelectContainer = ({ children, ...props }) => {
  return <components.SelectContainer {...props}>{children}</components.SelectContainer>;
};

SelectContainer.propTypes = {
  children: PropTypes.node
};

const Placeholder = props => {
  const { menuIsOpen } = props.selectProps;
  const textStyle = menuIsOpen ? { color: "black" } : { color: "white" };
  const iconStyle = menuIsOpen ? { color: "#B1B1B3", paddingRight: "4px" } : { color: "white", paddingRight: "4px" };
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
  const { label, iconClassName } = props.data;
  return (
    <components.Option {...props}>
      <span>
        <i className={classNames("fas", iconClassName)} />
        <span>{label}</span>
      </span>
    </components.Option>
  );
};

Option.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  data: PropTypes.object
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

  openSelectMenu = () => {
    this.setState({
      isOpen: true
    });
  };

  closeSelectMenu = () => {
    this.setState({
      isOpen: false
    });
  };

  getCustomStyles = () => {
    return {
      control: base => ({
        ...base,
        backgroundColor: this.state.isOpen ? "white" : "#006EFF",
        minHeight: this.state.isOpen ? "24px" : "32px",
        minWidth: this.state.isOpen ? "220px" : "100%",
        maxWidth: this.state.isOpen ? "220px" : "100%",
        border: 0,
        padding: this.state.isOpen ? "0px 8px" : "6px",
        display: "flex",
        justifyContent: "center",
        outline: "0",
        cursor: "pointer"
      }),
      container: base => ({
        ...base,
        padding: this.state.isOpen ? "0px 8px" : "0px",
        display: "flex",
        height: "32px",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        alignContent: "space-between"
      }),
      valueContainer: base => ({
        ...base,
        padding: "0px",
        justifyContent: "center"
      }),
      input: base => ({
        ...base,
        margin: "0px",
        outline: "0"
      }),
      menu: () => ({
        maxWidth: "220px",
        minWidth: "220px",
        textAlign: "left",
        display: "inline-block",
        borderCollapse: "separate",
        borderRadius: "4px",
        border: "1px solid black",
        position: "absolute",
        zIndex: 2,
        right: "calc(50% - 110px)",
        top: "32px",
        boxShadow: "0px 4px 4px  rgba(0, 0, 0, 0.15)"
      }),
      menuList: () => ({
        width: "100%",
        backgroundColor: "black",
        display: "inline-block"
      }),
      option: base => ({
        ...base,
        backgroundColor: "black",
        cursor: "pointer"
      })
    };
  };

  onChange = e => {
    if (!e.value) return;
    const { onChange } = this.props;
    onChange(e);
    this.setState({
      isOpen: false
    });
  };

  render() {
    const { options } = this.props;
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
        onChange={this.onChange}
        onMenuOpen={this.openSelectMenu}
        onMenuClose={this.closeSelectMenu}
        value={null}
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
