import React from "react";
import PropTypes from "prop-types";
import "../../vendor/react-select/index.scss";
import Select from "react-select";

const staticStyle = {
  container: base => ({
    ...base,
    width: "100%"
  }),
  control: base => ({
    ...base,
    backgroundColor: "black",
    minHeight: "24px",
    border: "1px solid #5D646C",
    cursor: "pointer"
  }),
  input: base => ({
    ...base,
    margin: "0px",
    color: "white"
  }),
  dropdownIndicator: base => ({
    ...base,
    padding: "0 4px 0 0"
  }),
  placeholder: base => ({
    ...base,
    color: "white"
  }),
  menu: base => ({
    ...base,
    borderRadius: "4px",
    border: "1px solid black",
    backgroundColor: "black",
    outline: "none",
    padding: "0",
    position: "absolute",
    top: "20px"
  }),
  menuList: base => ({
    ...base,
    padding: "0"
  }),
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? "#006EFF" : "black",
    cursor: "pointer"
  }),
  singleValue: base => ({
    ...base,
    color: "white"
  })
};

export default function SelectInput({ value, options, onChange }) {
  const selectedOption = options.find(o => o.value === value);

  return (
    <Select
      styles={staticStyle}
      value={selectedOption}
      components={{ IndicatorSeparator: () => null }}
      options={options}
      onChange={({ value }) => onChange(value)}
    />
  );
}

SelectInput.defaultProps = {
  value: null,
  onChange: () => {}
};

SelectInput.propTypes = {
  value: PropTypes.any,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any,
      label: PropTypes.string
    })
  ),
  onChange: PropTypes.func
};
