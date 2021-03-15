import React from "react";
import PropTypes from "prop-types";
import { useLocation, matchPath } from "react-router-dom";
import configs from "./configs";

const telemetryEnabled = configs.GA_TRACKING_ID && window.ga;

export function initTelemetry() {
  if (window.ga && configs.GA_TRACKING_ID) {
    window.ga("create", configs.GA_TRACKING_ID, "auto");
  } else {
    window.ga = () => {};
  }
}

export function trackEvent(eventAction, eventValue) {
  console.info(
    `Telemetry ${telemetryEnabled ? "enabled" : "disabled"} | Event: ${eventAction} ${
      eventValue !== undefined ? "Value: " + eventValue : ""
    }`
  );
  window.ga("send", { hitType: "event", eventCategory: "Spoke", eventAction, eventValue });
}

export function Telemetry({ overridePage, overrideTitle }) {
  const location = useLocation();

  React.useEffect(() => {
    let overridePage, overrideTitle;

    if (matchPath(location.pathname, { path: "/projects/:projectId" })) {
      overridePage = "/projects/editor";
      overrideTitle = "Editor";
    }

    const page = `/spoke${overridePage || location.pathname}`;
    const title = overrideTitle ? "Spoke by Mozilla | " + overrideTitle : document.title;

    console.info(`Telemetry ${telemetryEnabled ? "enabled" : "disabled"} | Navigated to: ${page}`);

    if (telemetryEnabled) {
      window.ga("set", { page, title });
      window.ga("send", "pageview");
    }
  }, [location, overridePage, overrideTitle]);

  return null;
}

Telemetry.propTypes = {
  match: PropTypes.object
};
