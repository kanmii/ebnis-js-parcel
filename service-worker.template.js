/* global importScripts, workbox, idbKeyval */
importScripts("%workboxPath%/workbox-sw.js");

workbox.setConfig({
  modulePathPrefix: "%workboxPath%/",
});

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
