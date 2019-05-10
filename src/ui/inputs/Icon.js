import React from "react";
import PropTypes from "prop-types";

export default function Icon(props) {
  return <img src={props.src} style={{ color: props.color, width: props.size, height: props.size }} />;
}

Icon.propTypes = {
  src: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired
};

Icon.defaultProps = {
  color: "white",
  size: 32
};
