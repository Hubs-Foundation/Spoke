import ReactDOM from "react-dom";
import React from "react";

import App from "./ui/App";
import Api from "./api/Api";

// eslint-disable-next-line no-undef
console.log(`Spoke v${SPOKE_VERSION}`);

const api = new Api();

ReactDOM.render(<App api={api} />, document.getElementById("app"));
