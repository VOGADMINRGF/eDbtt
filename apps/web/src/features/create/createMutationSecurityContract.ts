export const CREATE_MUTATION_CSRF_HEADER = "x-edebatte-create-csrf";
export const CREATE_MUTATION_CSRF_VALUE = "create-mutation-v1";
export const CREATE_HONEYPOT_HEADER = "x-edebatte-create-meta";
export const CREATE_CLIENT_SESSION_HEADER = "x-edebatte-create-client";
export const CREATE_MAX_TEXT_LENGTH = 10_000;
export const CREATE_MAX_CONTEXT_LENGTH = 2_000;
export const CREATE_MAX_URL_LENGTH = 2_048;

const CREATE_HONEYPOT_ID = "edebatte-create-request-note";
const CREATE_CLIENT_SESSION_STORAGE_KEY = "edebatte:create:client-session:v1";
let createSecuritySessionPrimed = false;

function createClientSessionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

function readOrCreateClientSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(CREATE_CLIENT_SESSION_STORAGE_KEY)?.trim();
    if (existing) return existing.slice(0, 120);
    const created = createClientSessionId();
    window.sessionStorage.setItem(CREATE_CLIENT_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return "";
  }
}

export function ensureCreateHoneypotElement() {
  if (typeof document === "undefined") return null;
  const existing = document.getElementById(CREATE_HONEYPOT_ID);
  const InputCtor = globalThis.HTMLInputElement;
  if (typeof InputCtor !== "undefined" && existing instanceof InputCtor) return existing;

  const trap = document.createElement("input");
  trap.id = CREATE_HONEYPOT_ID;
  trap.type = "text";
  trap.name = "request_note_2f7";
  trap.autocomplete = "off";
  trap.tabIndex = -1;
  trap.setAttribute("aria-hidden", "true");
  trap.setAttribute("role", "presentation");
  trap.setAttribute("data-create-meta-field", "v1");
  trap.spellcheck = false;
  trap.style.position = "fixed";
  trap.style.left = "-10000px";
  trap.style.top = "-10000px";
  trap.style.width = "1px";
  trap.style.height = "1px";
  trap.style.opacity = "0";
  trap.style.pointerEvents = "none";
  trap.style.overflow = "hidden";
  document.body.appendChild(trap);
  return trap;
}

function readCreateHoneypotValue() {
  const trap = ensureCreateHoneypotElement();
  return trap?.value?.trim().slice(0, 160) ?? "";
}

export function primeCreateSecuritySession() {
  if (typeof window === "undefined" || createSecuritySessionPrimed) return;
  createSecuritySessionPrimed = true;
  void window
    .fetch("/api/create/session", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        [CREATE_MUTATION_CSRF_HEADER]: CREATE_MUTATION_CSRF_VALUE,
      },
      body: "{}",
    })
    .catch(() => {
      createSecuritySessionPrimed = false;
    });
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
  const initialize = () => {
    ensureCreateHoneypotElement();
    readOrCreateClientSessionId();
    primeCreateSecuritySession();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    globalThis.queueMicrotask(initialize);
  }
}

export function createMutationRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    [CREATE_MUTATION_CSRF_HEADER]: CREATE_MUTATION_CSRF_VALUE,
  };

  if (typeof window !== "undefined") {
    const honeypotValue = readCreateHoneypotValue();
    const clientSession = readOrCreateClientSessionId();
    if (honeypotValue) headers[CREATE_HONEYPOT_HEADER] = honeypotValue;
    if (clientSession) headers[CREATE_CLIENT_SESSION_HEADER] = clientSession;
    primeCreateSecuritySession();
  }

  return headers;
}
