import React from "react";
import PropTypes from "prop-types";
import styles from "./StringInput.scss";
import classNames from "classnames";

const StringInput = React.forwardRef(({ onChange, ...props }, ref) => {
  const fullClassName = classNames(styles.stringInput, props.className);
  return <input ref={ref} onChange={e => onChange(e.target.value, e)} {...props} className={fullClassName} />;
});

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
  onChange: PropTypes.func
};

export default StringInput;
