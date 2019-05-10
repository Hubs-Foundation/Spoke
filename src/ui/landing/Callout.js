import React from "react";
import PropTypes from "prop-types";
import styles from "./Callout.scss";

export default function Callout(props) {
  return (
    <div className={styles.callout}>
      <div className={styles.imageContainer}>
        <img src={props.imageSrc} />
      </div>
      <div className={styles.content}>{props.children}</div>
    </div>
  );
}

Callout.propTypes = {
  imageSrc: PropTypes.string,
  children: PropTypes.node
};
