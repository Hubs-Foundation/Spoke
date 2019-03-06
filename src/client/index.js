import ReactDOM from "react-dom";
import React from "react";

import App from "./ui/App";
import Project from "./api/Project";

(async () => {
  // eslint-disable-next-line no-undef
  console.log(`Spoke v${SPOKE_VERSION}`);

  const rootEl = document.createElement("div");
  rootEl.id = "app";
  document.body.appendChild(rootEl);

  const project = new Project();

  ReactDOM.render(<App project={project} />, rootEl);
})().catch(e => console.error(e));
