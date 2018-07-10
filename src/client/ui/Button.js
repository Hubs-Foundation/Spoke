import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export default function Button({ className, children, ...props }) {
  const fullClassName = classNames(styles.button, className);

  return (
    <button className={fullClassName} {...props}>
      {children}
    </button>
  );
}

Button.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};
