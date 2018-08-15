import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";

const DropdownIndicator = () => {
  return null;
};

const placeholder = text => {
  return (
    <span>
      <i className="fa faplus" />
      {text}
    </span>
  );
};

export default function AddComponentDropdown(props) {
  return <Select arrowRenderer={DropdownIndicator} placeholder={placeholder(props.placeholder)} {...props} />;
}

AddComponentDropdown.propTypes = {
  placeholder: PropTypes.string
};
