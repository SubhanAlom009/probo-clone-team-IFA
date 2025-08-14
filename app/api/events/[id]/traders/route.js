import { json, err } from "@/lib/apiUtil";
import { verifyToken } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

// Get all traders for an event
export async function GET(req, context) {
  try {
    const authUser = await verifyToken(req);
    const params = await context.params;
    const eventId = params.id;

    // Get all bets for this event
    // Include all matched trade documents for the event; our code writes bets with status "pending" and later "settled"
    // so we should NOT filter by status here, otherwise we'll miss fresh trades
    const betsQuery = query(
      collection(db, "bets"),
      where("eventId", "==", eventId)
    );
    const betsSnapshot = await getDocs(betsQuery);
    const bets = betsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Collect unique trader IDs
    const traderIds = new Set();
    bets.forEach((bet) => {
      if (bet.yesUserId) traderIds.add(bet.yesUserId);
      if (bet.noUserId) traderIds.add(bet.noUserId);
    });

    // Get trader details
    const traders = [];
    for (const traderId of traderIds) {
      try {
        const userDoc = await getDoc(doc(db, "users", traderId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Calculate trader's position in this event
          const traderBets = bets.filter(
            (bet) => bet.yesUserId === traderId || bet.noUserId === traderId
          );

          let totalYesStake = 0;
          let totalNoStake = 0;
          let totalVolume = 0;

          traderBets.forEach((bet) => {
            if (bet.yesUserId === traderId && bet.yesLocked) {
              totalYesStake += bet.yesLocked;
              totalVolume += bet.yesLocked;
            }
            if (bet.noUserId === traderId && bet.noLocked) {
              totalNoStake += bet.noLocked;
              totalVolume += bet.noLocked;
            }
          });

          const position =
            totalYesStake > totalNoStake
              ? "YES"
              : totalNoStake > totalYesStake
              ? "NO"
              : "NEUTRAL";

          traders.push({
            id: traderId,
            displayName: userData.displayName,
            avatar: userData.photoURL || userData.avatar || null,
            totalTrades: userData.totalTrades || 0,
            winRate: userData.winRate || 0,
            totalVolume: userData.totalVolume || 0,
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen,
            eventPosition: {
              position,
              yesStake: totalYesStake,
              noStake: totalNoStake,
              totalStake: totalVolume,
              betCount: traderBets.length,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching trader ${traderId}:`, error);
      }
    }

    // Sort traders by total stake in this event (descending)
    traders.sort(
      (a, b) => b.eventPosition.totalStake - a.eventPosition.totalStake
    );

    // Separate by position
    const yesTraders = traders.filter(
      (t) => t.eventPosition.position === "YES"
    );
    const noTraders = traders.filter((t) => t.eventPosition.position === "NO");
    const neutralTraders = traders.filter(
      (t) => t.eventPosition.position === "NEUTRAL"
    );

    return json({
      traders: {
        all: traders,
        yes: yesTraders,
        no: noTraders,
        neutral: neutralTraders,
      },
      summary: {
        totalTraders: traders.length,
        yesTraders: yesTraders.length,
        noTraders: noTraders.length,
        neutralTraders: neutralTraders.length,
        totalVolume: traders.reduce(
          (sum, t) => sum + t.eventPosition.totalStake,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching event traders:", error);
    return err("Failed to fetch traders", 500);
  }
}
