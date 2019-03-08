import ReactDOM from "react-dom";
import React from "react";

import App from "./ui/App";
import Api from "./api/Api";

(async () => {
  // eslint-disable-next-line no-undef
  console.log(`Spoke v${SPOKE_VERSION}`);

  const rootEl = document.createElement("div");
  rootEl.id = "app";
  document.body.appendChild(rootEl);

  const api = new Api();

  ReactDOM.render(<App api={api} />, rootEl);
})().catch(e => console.error(e));
