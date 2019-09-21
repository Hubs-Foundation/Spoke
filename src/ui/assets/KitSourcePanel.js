import React from "react";
import PropTypes from "prop-types";
import MediaSourcePanel from "./MediaSourcePanel";

export default function KitSourcePanel(props) {
  return (
    <MediaSourcePanel
      {...props}
      multiselectTags
      searchPlaceholder={props.source.searchPlaceholder || "Search pieces..."}
    />
  );
}

KitSourcePanel.propTypes = {
  source: PropTypes.object
};
