import React from "react";

const SceneActionsContext = React.createContext(null);

export const SceneActionsContextProvider = SceneActionsContext.Provider;

export function withSceneActions(Component) {
  return function SceneActionsContextComponent(props) {
    return (
      <SceneActionsContext.Consumer>
        {sceneActions => <Component {...props} sceneActions={sceneActions} />}
      </SceneActionsContext.Consumer>
    );
  };
}
