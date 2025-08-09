import { verifyToken } from "@/lib/firebaseAdmin";
import { requestRoleUpgrade, getUserProfile } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (profile.role === "admin") return err("Already admin", 400);
    if (profile.upgradeRequested) return json({ ok: true, already: true });
    await requestRoleUpgrade(authUser.uid);
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
