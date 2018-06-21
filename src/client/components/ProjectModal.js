import React from "react";
import PropTypes from "prop-types";
import styles from "./ProjectModal.scss";
import Header from "./Header";
import IconGrid from "./IconGrid";
import Icon from "./Icon";
import TabNavigation from "./TabNavigation";
import Tab from "./Tab";
import NativeFileInput from "./NativeFileInput";
import defaultThumbnail from "../assets/default-thumbnail.png";

export default function ProjectModal({ tab, projects, onSelectProject, onChangeTab, onOpenProject }) {
  return (
    <div className={styles.projectModal}>
      <Header title="Projects" />
      <TabNavigation>
        <Tab name="Recent Projects" selected={tab === "projects"} onClick={() => onChangeTab("projects")} />
        <Tab name="Templates" selected={tab === "templates"} onClick={() => onChangeTab("templates")} />
      </TabNavigation>
      <IconGrid>
        {projects.map(project => (
          <Icon
            key={project.uri}
            src={project.icon || defaultThumbnail}
            name={project.name}
            onClick={() => onSelectProject(project)}
          />
        ))}
      </IconGrid>
      <NativeFileInput label="Open Project..." onChange={onOpenProject} />
    </div>
  );
}

ProjectModal.propTypes = {
  tab: PropTypes.string,
  onChangeTab: PropTypes.func,
  onSelectProject: PropTypes.func,
  onOpenProject: PropTypes.func,
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      uri: PropTypes.string.isRequired,
      icon: PropTypes.string
    })
  )
};
