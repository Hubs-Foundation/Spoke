import React from "react";
import PropTypes from "prop-types";
import styles from "./ProjectModal.scss";
import Header from "./Header";
import IconGrid from "./IconGrid";
import TabNavigation from "./TabNavigation";
import NativeFileInput from "./NativeFileInput";

function onSelectIcon(icon, event, projects, onSelectProject) {
  const project = projects.find(({ uri }) => uri === icon.id);
  onSelectProject(project, event);
}

export default function ProjectModal({ tab, projects, onSelectProject, onChangeTab, onOpenProject }) {
  const tabs = [
    {
      name: "Recent Projects",
      selected: tab === "projects",
      onClick: () => onChangeTab("projects")
    },
    {
      name: "Templates",
      selected: tab === "templates",
      onClick: () => onChangeTab("templates")
    }
  ];

  const icons = projects.map(project => ({
    id: project.uri,
    src: project.icon,
    name: project.name
  }));

  return (
    <div className={styles.projectModal}>
      <Header title="Projects" />
      <TabNavigation tabs={tabs} />
      <IconGrid icons={icons} onSelect={(icon, event) => onSelectIcon(icon, event, projects, onSelectProject)} />
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
