// lib/marketMath.js

// Bayesian smoothing prior (alpha pseudo-stake on each side)
export const PRIOR = 50;

// Compute smoothed market probability of YES
export function computeSmoothedProb(yesStake, noStake, prior = PRIOR) {
  const y = yesStake || 0;
  const n = noStake || 0;
  return (y + prior) / (y + n + 2 * prior);
}

// Pool (pari-mutuel) payout for a winning bet
export function computePoolPayout({ totalStake, winningPool, stake }) {
  if (winningPool <= 0) return 0;
  return totalStake * (stake / winningPool);
}

// Fixed-odds payout (oddsSnapshot stored as yes probability at time of bet)
export function computeFixedOddsPayout({ outcome, side, stake, oddsSnapshot }) {
  const p =
    typeof oddsSnapshot === "number" && oddsSnapshot > 0 && oddsSnapshot < 1
      ? oddsSnapshot
      : 0.5;
  if (outcome === side) {
    if (side === "yes") return stake * (1 / p);
    return stake * (1 / (1 - p));
  }
  return 0;
}

// Potential return preview for UI based on mode
export function previewReturn({
  mode,
  side,
  stake,
  yesStake,
  noStake,
  oddsSnapshot,
}) {
  const s = Number(stake) || 0;
  if (!s) return 0;
  if (mode === "fixed") {
    const p = oddsSnapshot ?? computeSmoothedProb(yesStake, noStake);
    return side === "yes" ? s * (1 / p) : s * (1 / (1 - p));
  }
  // pool preview (approx): assume current pool sizes
  const y = yesStake || 0;
  const n = noStake || 0;
  const total = y + n + s;
  if (!total) return s;
  if (side === "yes") {
    const newY = y + s;
    return total * (s / newY);
  } else {
    const newN = n + s;
    return total * (s / newN);
  }
}
