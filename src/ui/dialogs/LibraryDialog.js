import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog";

export default function LibraryDialog({ component: LibraryComponent, componentProps, onConfirm, ...props }) {
  return (
    <Dialog {...props}>
      <LibraryComponent tooltipId="library-dialog" {...componentProps} />
    </Dialog>
  );
}

LibraryDialog.propTypes = {
  title: PropTypes.string.isRequired,
  component: PropTypes.elementType.isRequired,
  componentProps: PropTypes.object,
  onConfirm: PropTypes.func.isRequired
};
