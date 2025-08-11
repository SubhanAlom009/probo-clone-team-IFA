import Link from "next/link";

export default function EventCard({ ev }) {
  // Show current YES/NO prices (BetForm logic)
  const yesPrice =
    ev.currentYesPrice !== null && ev.currentYesPrice !== undefined
      ? `₹${ev.currentYesPrice}`
      : "₹5";
  const noPrice =
    ev.currentNoPrice !== null && ev.currentNoPrice !== undefined
      ? `₹${ev.currentNoPrice}`
      : "₹5";

  return (
    <Link href={`/events/${ev.id}`}>
      <div className="bg-neutral-900 rounded-lg shadow-md p-5 flex flex-col justify-between min-h-[170px] border border-neutral-800 cursor-pointer hover:shadow-lg transition-shadow">
        <div className="flex flex-col mb-4 gap-2">
          <h2
            className="text-lg font-bold text-white truncate"
            title={ev.title}
          >
            {ev.title}
          </h2>
          <div className="text-xs text-neutral-400 truncate">
            {ev.description}
          </div>
        </div>
        <div className="flex gap-2 mt-auto items-end">
          <div className="flex-1 flex flex-col items-center border-2 border-cyan-500/70 bg-cyan-500/10 rounded-lg p-2">
            <span className="text-[12px] text-cyan-300 font-semibold">YES</span>
            <span className="font-mono text-cyan-200 text-base">
              {yesPrice}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center border-2 border-rose-500/70 bg-rose-500/10 rounded-lg p-2">
            <span className="text-[12px] text-rose-300 font-semibold">NO</span>
            <span className="font-mono text-rose-200 text-base">{noPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
