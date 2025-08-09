import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserProfile, requestRoleUpgrade } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile) return err("Profile missing", 404);
    if (profile.role === "admin") return json({ ok: true, already: true });
    if (profile.upgradeRequested) return json({ ok: true, requested: true });
    await requestRoleUpgrade(authUser.uid);
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
