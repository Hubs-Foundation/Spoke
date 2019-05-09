import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import inputGroupStyles from "./InputGroup.scss";
import Scrubber from "./Scrubber";
import NumericInput from "./NumericInput";

export default function NumericInputGroup({ name, className, disabled, ...rest }) {
  return (
    <div className={classNames(inputGroupStyles.inputGroup, className, disabled && "disabled")}>
      <Scrubber {...rest}>{name}:</Scrubber>
      <div className="content">
        <NumericInput {...rest} />
      </div>
    </div>
  );
}

NumericInputGroup.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool
};
