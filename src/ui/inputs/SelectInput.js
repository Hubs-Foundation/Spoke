import React from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import "../styles/vendor/react-select/index.scss";

const staticStyle = {
  container: base => ({
    ...base,
    width: "100%"
  }),
  control: (base, { isDisabled }) => ({
    ...base,
    backgroundColor: isDisabled ? "#222222" : "black",
    minHeight: "24px",
    border: "1px solid #5D646C",
    cursor: "pointer"
  }),
  input: (base, { isDisabled }) => ({
    ...base,
    margin: "0px",
    color: isDisabled ? "grey" : "white"
  }),
  dropdownIndicator: base => ({
    ...base,
    padding: "0 4px 0 0"
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
  singleValue: (base, { isDisabled }) => ({
    ...base,
    color: isDisabled ? "grey" : "white"
  })
};

export default function SelectInput({ value, options, onChange, placeholder, disabled, error, ...rest }) {
  const selectedOption = options.find(o => {
    if (o.value && o.value.equals) {
      return o.value.equals(value);
    } else {
      return o.value === value;
    }
  });

  const dynamicStyle = {
    ...staticStyle,
    placeholder: (base, { isDisabled }) => ({
      ...base,
      color: isDisabled ? "grey" : error ? "red" : "white"
    })
  };

  return (
    <Select
      {...rest}
      styles={dynamicStyle}
      value={selectedOption}
      components={{ IndicatorSeparator: () => null }}
      placeholder={placeholder}
      options={options}
      onChange={option => onChange(option.value, option)}
      isDisabled={disabled}
    />
  );
}

SelectInput.defaultProps = {
  value: null,
  placeholder: "Select...",
  optionNotFoundPlaceholder: "Error",
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
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.bool,
  disabled: PropTypes.bool
};
