const url = new URL(location.href);

export const isMobileVR = /(OculusBrowser)|(Mobile VR)/i.test(window.navigator.userAgent);

export const quality = url.searchParams.get("quality") || isMobileVR ? "low" : "high";
