import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    // Prefer explicit JSON credential passed via env for hackathon simplicity.
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
      : applicationDefault(),
  });
}

export const adminAuth = getAuth();

export async function verifyToken(req) {
  const header =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new Error("Missing bearer token");
  return await adminAuth.verifyIdToken(token);
}
