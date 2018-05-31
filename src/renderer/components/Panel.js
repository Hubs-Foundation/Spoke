import React from "react";
import PropTypes from "prop-types";
import { MosaicWindow } from "react-mosaic-component";
import PanelToolbar from "./PanelToolbar";

export default function Panel({ title, path, toolbarControls, children }) {
  return (
    <MosaicWindow title={title} path={path} toolbarControls={toolbarControls}>
      {children}
    </MosaicWindow>
  );
}

Panel.defaultProps = {
  toolbarControls: PanelToolbar
};

Panel.propTypes = {
  title: PropTypes.string,
  path: PropTypes.array,
  toolbarControls: PropTypes.arrayOf(PropTypes.element),
  children: PropTypes.arrayOf(PropTypes.element)
};
