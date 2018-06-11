const opn = require("opn");
const path = require("path");
const express = require("express");
const cors = require("cors");
const app = express();

const port = 8080;
const bundlePath = process.argv[2];
const bundleDir = path.dirname(bundlePath);
const bundleName = path.basename(bundlePath);
const bundleURL = `/bundles/${bundleName}`;

app.use(cors());
app.use(express.static(path.join(__dirname, "hubs")));
app.use("/bundles", express.static(bundleDir));

app.listen(port, () => {
  const room = Math.floor(Math.random() * 1000000);
  opn(`http://localhost:${port}/hub.html?room=${room}&allow_multi=true&environment=${bundleURL}`);
});
