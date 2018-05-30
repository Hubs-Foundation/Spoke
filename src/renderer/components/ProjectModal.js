import React from "react";
import PropTypes from "prop-types";
import styles from "./ProjectModal.scss";
import IconGrid from "./IconGrid";

export default function ProjectModal({ templates, onCreateFromTemplate }) {
  const items = templates.map(({ name, uri, icon }) => ({
    id: uri,
    name,
    icon,
    onClick: () => {
      onCreateFromTemplate(uri);
    }
  }));

  return (
    <div className={styles.ProjectModal}>
      <IconGrid items={items} />
    </div>
  );
}

ProjectModal.propTypes = {
  onCreateFromTemplate: PropTypes.func,
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      uri: PropTypes.string.isRequired,
      icon: PropTypes.string
    })
  )
};
