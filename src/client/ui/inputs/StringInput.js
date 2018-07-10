import React from "react";
import PropTypes from "prop-types";
import styles from "./StringInput.scss";
import classNames from "classnames";

export default function StringInput(props) {
  const fullClassName = classNames(styles.stringInput, props.className);
  return <input {...props} className={fullClassName} />;
}

StringInput.defaultProps = {
  value: "",
  onChange: () => {}
};

StringInput.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func
};
