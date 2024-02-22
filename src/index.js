import configs from "./configs";
import ReactDOM from "react-dom";
import React from "react";
import * as Sentry from "@sentry/browser";
import "abortcontroller-polyfill/dist/polyfill-patch-fetch";
import App from "./ui/App";
import Api from "./api/Api";
import { initTelemetry } from "./telemetry";
import "./locales/i18n.ts";

/**
 * belivvr custom
 * token 값이 있는지 확인 후 로컬 스토리지에 저장함
 */
const token = new URLSearchParams(location.search).get("token");
window.token = token;
if (token) {
  localStorage.clear();
  localStorage.setItem("___hubs_store", JSON.stringify({ credentials: { email: "default", token } }));
}

/**
 * belivvr custom
 * projects/new 로 들어올 경우에 프로젝트 생성임을 구분함.
 */
const isCreatingProject = location.href.split("?")[0].includes("new");
window.isCreatingProject = !!isCreatingProject;

/**
 * belivvr custom
 * event-callback 쿼리스트링이 있을 경우에 나중에 API request를 위해 전역변수에 담음.
 */
const eventCallback = new URLSearchParams(location.search).get("event-callback");
if (eventCallback) {
  // window.eventCallback = decodeURI(eventCallback);
}
window.eventCallback = configs.BACKEND_URL;

if (configs.SENTRY_DSN) {
  Sentry.init({
    dsn: configs.SENTRY_DSN,
    release: process.env.BUILD_VERSION,
    integrations(integrations) {
      return integrations.filter(integration => integration.name !== "Breadcrumbs");
    }
  });
}

/**
 * belivvr custom
 * option Id window
 */
const optId = new URLSearchParams(location.search).get("optId")
window.optId = optId

initTelemetry();

// eslint-disable-next-line no-undef
console.info(`Spoke version: ${process.env.BUILD_VERSION}`);

const api = new Api();

ReactDOM.render(<App api={api} />, document.getElementById("app"));
