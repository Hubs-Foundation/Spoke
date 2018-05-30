import { app, BrowserWindow } from "electron";
import * as path from "path";
import { format as formatUrl } from "url";

const isDevelopment = process.execPath.match(/[\\/]electron/);

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

if (isDevelopment) {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();

  const packageJson = require("../../package.json");
  app.setName(packageJson.productName || packageJson.name);
}

function createMainWindow() {
  const window = new BrowserWindow();

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:8080/index.html`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.resolve(__dirname, "index.html"),
        protocol: "file",
        slashes: true
      })
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// quit application when all windows are closed
app.on("window-all-closed", () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on("ready", () => {
  mainWindow = createMainWindow();
});
