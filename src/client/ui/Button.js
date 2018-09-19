import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./Button.scss";

export default function Button({ className, children, ...props }) {
  const fullClassName = classNames(styles.button, className);

  if (props.href) {
    return (
      <a className={fullClassName} {...props}>
        {children}
      </a>
    );
  } else {
    return (
      <button className={fullClassName} {...props}>
        {children}
      </button>
    );
  }
}

Button.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  href: PropTypes.string
};
