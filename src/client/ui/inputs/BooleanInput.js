import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./BooleanInput.scss";

export default function BooleanInput({ onChange, value }) {
  return (
    <div>
      <label>
        <input type="checkbox" className={styles.hide} checked={value} onChange={e => onChange(e.target.checked)} />
        <span className={classNames("fas", "fa-square", "fa-12px")} />
      </label>
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
