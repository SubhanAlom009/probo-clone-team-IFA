import Link from "next/link";
import { computeSmoothedProb } from "@/lib/marketMath";

export default function EventCard({ ev }) {
  const yes = ev.yesStake || 0;
  const no = ev.noStake || 0;
  const total = yes + no;
  const prob = computeSmoothedProb(yes, no); // Smoothed market probability
  const yesPrice = (prob * 10).toFixed(0); // Example: ₹7 for 70% chance
  const noPrice = ((1 - prob) * 10).toFixed(0); // Example: ₹3 for 30% chance

  return (
    <Link href={`/events/${ev.id}`}>
      <div className="bg-neutral-900 rounded-lg shadow-md p-5 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
        {/* Main Section */}
        <div className="flex flex-col mb-4">
          <h2 className="font-bold text-lg mb-2 text-white">{ev.title}</h2>
          <p className="text-[#a0a0a0] text-sm">
            {ev.description || "No description available."}
          </p>
        </div>

        {/* Market Probability Display */}
        <div className="flex gap-2 mb-1">
          <span className="flex-1 text-center py-1 rounded-full bg-[#0a3d62] text-white font-semibold">
            YES {(prob * 100).toFixed(1)}%
          </span>
          <span className="flex-1 text-center py-1 rounded-full bg-[#7b1113] text-white font-semibold">
            NO {((1 - prob) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </Link>
  );
}
