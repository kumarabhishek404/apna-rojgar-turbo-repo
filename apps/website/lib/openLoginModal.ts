/** Dispatched to ask Navbar to open the main login modal (stay on current page). */
export const OPEN_LOGIN_MODAL_EVENT = "apna-rojgar:open-login";

/** Fired after auth is saved so in-page UI can refresh / resume pending actions. */
export const AUTH_CHANGED_EVENT = "apna-rojgar:auth-changed";

export type OpenLoginModalDetail = {
  /** When true, successful login closes the modal and stays on the current URL. */
  stayOnPage?: boolean;
};

export type AuthChangedDetail = {
  stayOnPage?: boolean;
};

export function openLoginModal(detail?: OpenLoginModalDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPEN_LOGIN_MODAL_EVENT, { detail: detail || {} }),
  );
}

export function notifyAuthChanged(detail?: AuthChangedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_CHANGED_EVENT, { detail: detail || {} }),
  );
}
