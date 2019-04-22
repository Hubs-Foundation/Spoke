import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Link } from "react-router-dom";
import styles from "./Button.scss";

export default function Button({ className, children, medium, large, ...props }) {
  const fullClassName = classNames(styles.button, { [styles.medium]: medium, [styles.large]: large }, className);

  if (props.to) {
    return (
      <Link className={fullClassName} to={props.to}>
        {children}
      </Link>
    );
  } else if (props.href) {
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
  medium: PropTypes.bool,
  large: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  href: PropTypes.string,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
