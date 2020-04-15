export async function register() {
  if (process.env.REGISTER_SERVICE_WORKER && "serviceWorker" in navigator) {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox("/sw.js");
    wb.register();
  }
}
