import {
  getEvents,
  createEvent,
  getUserProfile,
  seedDummyEvents,
} from "@/lib/db";
import { verifyToken } from "@/lib/firebaseAdmin";
import { json, err } from "@/lib/apiUtil";

export async function GET() {
  const events = await getEvents();
  return json(events);
}

export async function POST(req) {
  try {
    const authUser = await verifyToken(req);
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== "admin") return err("Forbidden", 403);
    const body = await req.json().catch(() => ({}));

    // Seeding dummy events: { seed: true, count?: number }
    if (body.seed) {
      const count = Math.min(Number(body.count) || 5, 25);
      const ids = await seedDummyEvents(authUser.uid, count);
      return json({ ok: true, seeded: ids.length, ids });
    }

    const { title, description, closesAt } = body;
    if (!title) return err("Title required");
    const id = await createEvent(
      title,
      description || "",
      closesAt || null,
      authUser.uid
    );
    return json({ id });
  } catch (e) {
    return err(e.message, 400);
  }
}
