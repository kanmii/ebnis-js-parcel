export const OFFLINE_ID_PREFIX = "ebnis-unsaved-id-";

export function makeOfflineId(id: string | number = new Date().getTime()) {
  return OFFLINE_ID_PREFIX + id;
}

export function isOfflineId(id?: string) {
  return id ? id.startsWith(OFFLINE_ID_PREFIX) : false;
}
