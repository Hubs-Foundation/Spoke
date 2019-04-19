import React from "react";

const AuthContext = React.createContext();

export const AuthContextProvider = AuthContext.Provider;

export function withAuth(Component) {
  return function AuthContextComponent(props) {
    return (
      <AuthContext.Consumer>
        {isAuthenticated => <Component {...props} isAuthenticated={isAuthenticated} />}
      </AuthContext.Consumer>
    );
  };
}
