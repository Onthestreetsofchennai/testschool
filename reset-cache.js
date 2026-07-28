async function resetAppCache() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    localStorage.removeItem("ots-admin-token");
    localStorage.removeItem("ots-student-token");
    document.querySelector("#status").textContent = "Done. Open the student login again.";
  } catch {
    document.querySelector("#status").textContent =
      "Cache reset finished with a small browser warning. Open the student login again.";
  }
}

resetAppCache();
