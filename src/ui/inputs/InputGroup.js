import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./InputGroup.scss";

export default function InputGroup({ name, children, disabled, className, tooltipId, info }) {
  return (
    <div className={classNames(styles.inputGroup, className, disabled && "disabled")}>
      <label>{name}:</label>
      <div className="content">
        {children}
        {info && <div className={styles.info} data-for={tooltipId} data-tip={info} />}
      </div>
    </div>
  );
}

InputGroup.defaultProps = {
  tooltipId: "node-editor"
};

InputGroup.propTypes = {
  name: PropTypes.string,
  children: PropTypes.any,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  tooltipId: PropTypes.string,
  info: PropTypes.string
};
