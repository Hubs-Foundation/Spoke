import React from "react";

const ProjectContext = React.createContext({
  project: null
});

export const Provider = ProjectContext.Provider;

export function withProject(Component) {
  return function ProjectContextComponent(props) {
    return (
      <ProjectContext.Consumer>
        {projectContext => <Component {...props} {...projectContext} />}
      </ProjectContext.Consumer>
    );
  };
}
