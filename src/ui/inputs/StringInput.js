import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import Input from "./Input";

const StyledStringInput = styled(Input)`
  display: flex;
  width: 100%;
`;

const StringInput = React.forwardRef(({ onChange, ...rest }, ref) => (
  <StyledStringInput onChange={e => onChange(e.target.value, e)} {...rest} ref={ref} />
));

StringInput.displayName = "StringInput";

StringInput.defaultProps = {
  value: "",
  onChange: () => {},
  type: "text",
  required: false
};

StringInput.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  onChange: PropTypes.func
};

export default StringInput;
