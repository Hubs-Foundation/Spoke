import React from "react";
import PropTypes from "prop-types";

export default function BooleanInput({ onChange, value }) {
  return <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />;
}

BooleanInput.defaultProps = {
  value: false,
  onChange: () => {}
};

BooleanInput.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func
};
