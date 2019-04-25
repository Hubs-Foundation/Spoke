import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import styles from "./PrimaryLink.scss";

export default function PrimaryLink({ children, ...props }) {
  return (
    <Link className={styles.primaryLink} {...props}>
      {children}
    </Link>
  );
}

PrimaryLink.propTypes = {
  children: PropTypes.node
};
