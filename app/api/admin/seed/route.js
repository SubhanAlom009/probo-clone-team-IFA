import { verifyToken } from "@/lib/firebaseAdmin";
import { getUserProfile, seedDummyEvents } from "@/lib/db";
import { json, err } from "@/lib/apiUtil";

// POST /api/admin/seed  { count? }
export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    const { count = 5 } = await req.json().catch(() => ({}));
    const ids = await seedDummyEvents(
      authUser.uid,
      Math.min(Number(count) || 5, 20)
    );
    return json({ ok: true, created: ids.length, ids });
  } catch (e) {
    return err(e.message, 400);
  }
}
