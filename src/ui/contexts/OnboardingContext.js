import React from "react";

export const OnboardingContext = React.createContext({ enabled: false });

export const OnboardingContextProvider = OnboardingContext.Provider;
