const DEVICE_KEY = "hear-that-device-uuid";

export function getDeviceUUID(): string {
  if (typeof window === "undefined") return "";

  let uuid = localStorage.getItem(DEVICE_KEY);
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, uuid);
  }
  return uuid;
}
