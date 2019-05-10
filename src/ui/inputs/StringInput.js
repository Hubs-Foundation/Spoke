import React from "react";
import PropTypes from "prop-types";
import styles from "./StringInput.scss";
import classNames from "classnames";

const StringInput = React.forwardRef(({ className, onChange, ...rest }, ref) => {
  const fullClassName = classNames(styles.stringInput, className);
  return <input {...rest} ref={ref} onChange={e => onChange(e.target.value, e)} className={fullClassName} />;
});

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
