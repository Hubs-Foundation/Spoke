require("mocha/mocha.js");
require("mocha/mocha.css");
/* global sourceMapSupport */
require("source-map-support/browser-source-map-support");
sourceMapSupport.install();

mocha.setup({
  ui: "bdd",
  reporter: "spec",
  useColors: true,
  fullTrace: true
});

const req = require.context("./tests", true, /\.test\.js$/);
req.keys().forEach(req);

const mochaEl = document.createElement("div");
mochaEl.id = "mocha";
document.body.appendChild(mochaEl);

mocha.checkLeaks();
