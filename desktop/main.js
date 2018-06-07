const { Runtime } = Components.utils.import("resource://qbrt/modules/Runtime.jsm", {});
const { Services } = Components.utils.import("resource://gre/modules/Services.jsm", {});

const WINDOW_URL = "chrome://app/content/app/index.html";

const WINDOW_FEATURES = ["chrome", "centerscreen", "dialog=no", "all", "width=1280", "height=768", "resizable"].join(
  ","
);

if (Services.appinfo.OS === "Darwin") {
  Components.classes["@mozilla.org/widget/macdocksupport;1"]
    .getService(Components.interfaces.nsIMacDockSupport)
    .activateApplication(true);
}

const window = Services.ww.openWindow(null, WINDOW_URL, "Hubs Editor", WINDOW_FEATURES, null);

Runtime.openDevTools(window);
