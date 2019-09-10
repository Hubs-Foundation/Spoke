import React from "react";
import PropTypes from "prop-types";
import { ContextMenuTrigger } from "../layout/ContextMenu";

export default function StylableContextMenuTrigger({ className, attributes, children, ...rest }) {
  return (
    <ContextMenuTrigger {...rest} attributes={{ className, ...attributes }}>
      {children}
    </ContextMenuTrigger>
  );
}

StylableContextMenuTrigger.propTypes = {
  className: PropTypes.string,
  attributes: PropTypes.object,
  children: PropTypes.node
};
