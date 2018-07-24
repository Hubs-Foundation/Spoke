import React from "react";
import { Project } from "../../api/project";

const ProjectContext = React.createContext(new Project());

export function withProject(Component) {
  return function ProjectContextComponent(props) {
    return <ProjectContext.Consumer>{project => <Component {...props} project={project} />}</ProjectContext.Consumer>;
  };
}
