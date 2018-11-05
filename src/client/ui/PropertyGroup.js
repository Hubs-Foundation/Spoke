import React, { Fragment } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import styles from "./PropertyGroup.scss";

function PropertyGroup(props) {
  const { name, description, children, className, useDefault, headerClassName, contentClassName } = props;

  return (
    <div className={classNames(styles.propertyGroup, className)}>
      <div
        className={classNames(
          { [`${styles.header}`]: useDefault, [`${styles.lightHeader}`]: !useDefault },
          headerClassName
        )}
      >
        {name}
      </div>
      {description && (
        <div className={styles.description}>
          {description.split("\\n").map((line, i) => (
            <Fragment key={i}>
              {line}
              <br />
            </Fragment>
          ))}
        </div>
      )}
      <div className={classNames(styles.content, contentClassName)}>{children}</div>
    </div>
  );
}

PropertyGroup.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  children: PropTypes.node,
  useDefault: PropTypes.bool
};

export default PropertyGroup;
