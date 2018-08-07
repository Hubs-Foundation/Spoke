import React from "react";
import PropTypes from "prop-types";
import styles from "./BooleanInput.scss";

export default function BooleanInput({ onChange, value }) {
  return (
    <div className={styles.checkBox}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
    </div>
  );
}

BooleanInput.defaultProps = {
  value: false,
  onChange: () => {}
};

BooleanInput.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func
};
