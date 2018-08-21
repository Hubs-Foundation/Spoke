import React from "react";
import PropTypes from "prop-types";
import styles from "./StringInput.scss";
import classNames from "classnames";

const StringInput = React.forwardRef((props, ref) => {
  const fullClassName = classNames(styles.stringInput, props.className);
  return <input type="text" ref={ref} {...props} className={fullClassName} />;
});

StringInput.defaultProps = {
  value: "",
  onChange: () => {}
};

StringInput.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default StringInput;
