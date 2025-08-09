import { resolveEvent, getUserProfile } from "@/lib/db";
import { verifyToken } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function POST(req, { params }) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    const { outcome } = await req.json();
    await resolveEvent(params.id, outcome, authUser.uid);
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
