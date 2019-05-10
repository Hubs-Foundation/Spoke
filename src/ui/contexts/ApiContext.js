import React from "react";

const ApiContext = React.createContext();

export const ApiContextProvider = ApiContext.Provider;

export function withApi(Component) {
  return function ApiContextComponent(props) {
    return <ApiContext.Consumer>{api => <Component {...props} api={api} />}</ApiContext.Consumer>;
  };
}
