import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import inputGroupStyles from "./InputGroup.scss";
import Scrubber from "./Scrubber";
import NumericInput from "./NumericInput";

export default function NumericInputGroup({ name, className, disabled, tooltipId, info, ...rest }) {
  const { displayPrecision, ...scrubberProps } = rest;
  return (
    <div className={classNames(inputGroupStyles.inputGroup, className, disabled && "disabled")}>
      <Scrubber {...scrubberProps}>{name}:</Scrubber>
      <div className="content">
        <NumericInput {...rest} />
        {info && <div className={inputGroupStyles.info} data-for={tooltipId} data-tip={info} />}
      </div>
    </div>
  );
}

NumericInputGroup.defaultProps = {
  tooltipId: "node-editor"
};

NumericInputGroup.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  tooltipId: PropTypes.string,
  info: PropTypes.string
};
