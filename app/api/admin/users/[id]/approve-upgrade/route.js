import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserProfile, approveRoleUpgrade } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

export async function POST(req, { params }) {
  try {
    const authUser = await verifyToken(req);
    const adminProfile = await getUserProfile(authUser.uid);
    if (!adminProfile || adminProfile.role !== "admin")
      return err("Forbidden", 403);
    const targetProfile = await getUserProfile(params.id);
    if (!targetProfile) return err("User not found", 404);
    if (targetProfile.role === "admin")
      return json({ ok: true, already: true });
    await approveRoleUpgrade(params.id);
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 400);
  }
}
