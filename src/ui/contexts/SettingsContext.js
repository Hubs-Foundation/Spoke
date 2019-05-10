import React from "react";

export const defaultSettings = {
  enableExperimentalFeatures: false
};

const SettingsContext = React.createContext({
  settings: defaultSettings,
  updateSetting: () => {}
});

export const SettingsContextProvider = SettingsContext.Provider;

export function withSettings(Component) {
  return function SettingsContextComponent(props) {
    return <SettingsContext.Consumer>{ctx => <Component {...props} {...ctx} />}</SettingsContext.Consumer>;
  };
}
