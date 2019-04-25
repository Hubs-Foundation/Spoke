import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./FormField.scss";

export default function FormField({ inline, children }) {
  return <div className={classNames(styles.formField, { [styles.inline]: inline })}>{children}</div>;
}

FormField.propTypes = {
  inline: PropTypes.bool,
  children: PropTypes.node
};
