export const TOKEN_KEY = "ebnis-token-key";
export const SITE_TITLE = "Ebnis";
export const THEME_COLOR = "#5faac7";
export const USER_KEY = "nOQhAH4V54h9MMBS3BSwtE/2eZeQWHRnPfoC4K+RDuWairX";
export const PAGE_NOT_FOUND_TITLE = "Page Not Found";
export const UNSAVED_ID_PREFIX = "ebnis-unsaved-id-";

export function makeSiteTitle(title: string) {
  return `${title} | ${SITE_TITLE}`;
}

// istanbul ignore next
export function noop() {
  return null;
}

export function setDocumentTitle(title?: string) {
  document.title = title ? title : SITE_TITLE;
}

export function makeUnsavedId(id: string | number = new Date().getTime()) {
  return UNSAVED_ID_PREFIX + id;
}

export function isUnsavedId(id?: string) {
  return id ? id.startsWith(UNSAVED_ID_PREFIX) : false;
}
