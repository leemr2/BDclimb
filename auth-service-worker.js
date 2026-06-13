import { initializeApp } from "firebase/app";
import { getAuth, getIdToken } from "firebase/auth";
import { getInstallations, getToken } from "firebase/installations";

const serializedFirebaseConfig = new URL(location).searchParams.get(
  "firebaseConfig"
);

if (!serializedFirebaseConfig) {
  throw new Error(
    "Firebase Config object not found in service worker query string."
  );
}

const firebaseConfig = JSON.parse(serializedFirebaseConfig);

export const getAuthIdToken = async (auth) => {
  await auth.authStateReady();
  if (!auth.currentUser) return;
  return await getIdToken(auth.currentUser);
};

export const fetchWithFirebaseHeaders = async (request) => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const installations = getInstallations(app);
  const headers = new Headers(request.headers);
  const [authIdToken, installationToken] = await Promise.all([
    getAuthIdToken(auth),
    getToken(installations),
  ]);
  headers.append("Firebase-Instance-ID-Token", installationToken);
  if (authIdToken) headers.append("Authorization", `Bearer ${authIdToken}`);
  const newRequest = new Request(request, { headers });
  return await fetch(newRequest);
};

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const request = event.request;

  // Next.js client navigation uses RSC/flight requests — intercepting them
  // can cause 404 on first visit while a full refresh still works.
  if (
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Router-State-Tree") != null
  ) {
    return;
  }

  event.respondWith(fetchWithFirebaseHeaders(request));
});
