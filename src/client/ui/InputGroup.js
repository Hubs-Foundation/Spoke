import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./InputGroup.scss";

export default function InputGroup({ name, children, disabled, className }) {
  return (
    <div className={classNames(styles.inputGroup, className, disabled && "disabled")}>
      <label>{name}:</label>
      <div className="content">{children}</div>
    </div>
  );
}

InputGroup.propTypes = {
  name: PropTypes.string,
  children: PropTypes.any,
  disabled: PropTypes.bool,
  className: PropTypes.string
};
