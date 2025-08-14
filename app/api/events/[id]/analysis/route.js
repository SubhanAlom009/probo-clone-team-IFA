import { json, err } from "@/lib/apiUtil";
import { verifyToken } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

// In-memory cache: eventId -> { data, ts }
const CACHE = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60s

// Per-event AI rate limit (default 10 minutes)
const AI_MIN_INTERVAL_MS = (() => {
  const ms = Number(process.env.ANALYSIS_AI_MIN_INTERVAL_MS);
  if (!isNaN(ms) && ms > 0) return ms;
  const min = Number(process.env.ANALYSIS_AI_MIN_INTERVAL_MINUTES);
  return ((isNaN(min) ? 10 : min) || 10) * 60 * 1000;
})();
const AI_CALLS = new Map(); // eventId -> { ts, insights }

export async function GET(req, context) {
  try {
    await verifyToken(req);
    const { id: eventId } = await context.params;

    const cached = CACHE.get(eventId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return json({ analysis: cached.data });
    }

    const eventSnap = await getDoc(doc(db, "events", eventId));
    if (!eventSnap.exists()) return err("Event not found", 404);
    const event = eventSnap.data();

    const betsQ = query(
      collection(db, "bets"),
      where("eventId", "==", eventId),
      where("status", "==", "matched")
    );
    const betsSnap = await getDocs(betsQ);
    const bets = betsSnap.docs.map((d) => d.data());

    const analysis = await buildAnalysis(eventId, event, bets);
    CACHE.set(eventId, { data: analysis, ts: Date.now() });
    return json({ analysis });
  } catch (error) {
    console.error("Error analyzing event:", error);
    return err("Failed to analyze event", 500);
  }
}

async function buildAnalysis(eventId, event, bets) {
  const now = new Date();
  const closesAtDate = event?.closesAt?.toDate
    ? event.closesAt.toDate()
    : new Date(event.closesAt);
  const eventEnd = isNaN(new Date(closesAtDate).getTime())
    ? new Date(now.getTime())
    : new Date(closesAtDate);
  const msRemaining = eventEnd.getTime() - now.getTime();
  const hoursRemaining = isNaN(msRemaining)
    ? 0
    : msRemaining / (1000 * 60 * 60);

  let totalYesVolume = 0;
  let totalNoVolume = 0;
  const uniqueTraders = new Set();
  bets.forEach((bet) => {
    if (bet.yesLocked) totalYesVolume += bet.yesLocked;
    if (bet.noLocked) totalNoVolume += bet.noLocked;
    if (bet.yesUserId) uniqueTraders.add(bet.yesUserId);
    if (bet.noUserId) uniqueTraders.add(bet.noUserId);
  });

  const totalVolume = totalYesVolume + totalNoVolume;
  const yesPercentage =
    totalVolume > 0 ? (totalYesVolume / totalVolume) * 100 : 50;

  const marketData = {
    eventTitle: event.title,
    eventDescription: event.description,
    totalVolume,
    yesPercentage,
    noPercentage: 100 - yesPercentage,
    totalBets: bets.length,
    uniqueTraders: uniqueTraders.size,
    hoursRemaining: Math.max(0, hoursRemaining),
    recentBets: bets.slice(0, 10).map((bet) => ({
      side: bet.side,
      amount: bet.yesLocked || bet.noLocked,
      timestamp: bet.createdAt,
    })),
  };

  // AI insights with per-event rate limit
  let aiInsights = null;
  const lastAi = AI_CALLS.get(eventId);
  if (lastAi && Date.now() - lastAi.ts < AI_MIN_INTERVAL_MS) {
    aiInsights = lastAi.insights || null;
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const shouldCallGemini =
        !lastAi || Date.now() - lastAi.ts >= AI_MIN_INTERVAL_MS;
      if (shouldCallGemini) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
Analyze this prediction market event and provide insights:

Event: "${event.title}"
Description: "${event.description}"

Market Data:
- Total Volume: ₹${totalVolume}
- Current YES probability: ${yesPercentage.toFixed(1)}%
- Current NO probability: ${(100 - yesPercentage).toFixed(1)}%
- Total Bets: ${bets.length}
- Unique Traders: ${uniqueTraders.size}
- Hours Remaining: ${Math.max(0, hoursRemaining).toFixed(1)}

Recent Trading Activity:
${marketData.recentBets
  .map((bet) => `- ${bet.side?.toUpperCase?.() || bet.side}: ₹${bet.amount}`)
  .join("\n")}

Please provide:
1. Market sentiment analysis (bullish/bearish/neutral)
2. Confidence level (1-100) in current pricing
3. Key factors influencing the market
4. Risk assessment
5. Brief recommendation for traders

Format your response as JSON with these exact keys:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": number,
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskLevel": "low|medium|high",
  "recommendation": "brief recommendation text",
  "summary": "brief market summary"
}
`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
          let cleaned = String(text || "");
          cleaned = cleaned
            .replace(/```(json)?/gi, "")
            .replace(/```/g, "")
            .trim();
          const first = cleaned.indexOf("{");
          const last = cleaned.lastIndexOf("}");
          if (first !== -1 && last !== -1 && last > first) {
            const inner = cleaned.substring(first, last + 1);
            aiInsights = JSON.parse(inner);
          } else {
            aiInsights = JSON.parse(cleaned);
          }
        } catch (parseError) {
          aiInsights = {
            sentiment: text.toLowerCase().includes("bullish")
              ? "bullish"
              : text.toLowerCase().includes("bearish")
              ? "bearish"
              : "neutral",
            confidence: 75,
            keyFactors: ["AI analysis available", "Market data processed"],
            riskLevel: "medium",
            recommendation: text.substring(0, 200) + "...",
            summary: "AI analysis completed successfully",
          };
        }

        AI_CALLS.set(eventId, { ts: Date.now(), insights: aiInsights });
      }
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
      aiInsights = lastAi?.insights || null;
    }
  }

  const fallbackAnalysis = {
    sentiment:
      yesPercentage > 60
        ? "bullish"
        : yesPercentage < 40
        ? "bearish"
        : "neutral",
    confidence: Math.min(
      90,
      Math.max(50, totalVolume / 10 + uniqueTraders.size * 5)
    ),
    keyFactors: [
      `${yesPercentage.toFixed(1)}% market leans YES`,
      `₹${totalVolume} total volume`,
      `${uniqueTraders.size} active traders`,
      hoursRemaining > 0
        ? `${hoursRemaining.toFixed(1)} hours remaining`
        : "Event closed",
    ],
    riskLevel:
      totalVolume < 100 ? "high" : totalVolume < 500 ? "medium" : "low",
    recommendation: generateSimpleRecommendation(
      yesPercentage,
      totalVolume,
      hoursRemaining
    ),
    summary: `Market showing ${
      yesPercentage > 60
        ? "strong YES"
        : yesPercentage < 40
        ? "strong NO"
        : "mixed"
    } sentiment with ₹${totalVolume} volume`,
  };

  return {
    marketMetrics: {
      totalVolume: totalVolume.toFixed(2),
      yesPercentage: Number(yesPercentage.toFixed(1)),
      noPercentage: Number((100 - yesPercentage).toFixed(1)),
      totalBets: bets.length,
      uniqueTraders: uniqueTraders.size,
      averageBetSize:
        totalVolume > 0 ? (totalVolume / bets.length).toFixed(2) : "0",
    },
    probability: {
      yes: Number(yesPercentage.toFixed(1)),
      no: Number((100 - yesPercentage).toFixed(1)),
      confidence: getConfidenceLabel(
        aiInsights?.confidence || fallbackAnalysis.confidence
      ),
    },
    analysis: {
      marketSentiment: {
        sentiment: getSentimentLabel(
          aiInsights?.sentiment || fallbackAnalysis.sentiment
        ),
        color: getSentimentColor(
          aiInsights?.sentiment || fallbackAnalysis.sentiment
        ),
        description: aiInsights?.summary || fallbackAnalysis.summary,
      },
      volumeAnalysis: getVolumeAnalysis(totalVolume, uniqueTraders.size),
      timeAnalysis: getTimeAnalysis(hoursRemaining),
      riskAssessment: getRiskAssessment(
        aiInsights?.riskLevel || fallbackAnalysis.riskLevel
      ),
      momentum: getMomentum(yesPercentage, totalVolume),
    },
    recommendation: {
      action: getRecommendationAction(
        yesPercentage,
        totalVolume,
        hoursRemaining
      ),
      confidence: getConfidenceLabel(
        aiInsights?.confidence || fallbackAnalysis.confidence
      ),
      reasoning: aiInsights?.recommendation || fallbackAnalysis.recommendation,
      keyFactors: aiInsights?.keyFactors || fallbackAnalysis.keyFactors,
      suggestedStake: getSuggestedStake(
        aiInsights?.confidence || fallbackAnalysis.confidence,
        totalVolume,
        hoursRemaining
      ),
    },
    lastUpdated: new Date().toISOString(),
    aiPowered: !!aiInsights,
  };
}

function getConfidenceLabel(confidence) {
  if (typeof confidence === "string") return confidence;
  if (confidence >= 90) return "Very High";
  if (confidence >= 75) return "High";
  if (confidence >= 50) return "Medium";
  if (confidence >= 25) return "Low";
  return "Very Low";
}

function getSentimentLabel(sentiment) {
  switch (sentiment) {
    case "bullish":
      return "Bullish";
    case "bearish":
      return "Bearish";
    case "neutral":
      return "Neutral";
    default:
      return "Neutral";
  }
}

function getSentimentColor(sentiment) {
  switch (sentiment) {
    case "bullish":
      return "green";
    case "bearish":
      return "red";
    case "neutral":
      return "yellow";
    default:
      return "yellow";
  }
}

function getVolumeAnalysis(volume, traders) {
  if (volume > 10000)
    return {
      level: "High",
      description: "Strong market interest with significant volume",
    };
  if (volume > 5000)
    return { level: "Medium", description: "Moderate trading activity" };
  if (volume > 1000)
    return { level: "Low", description: "Limited trading activity" };
  return { level: "Very Low", description: "Minimal market participation" };
}

function getTimeAnalysis(hoursRemaining) {
  if (hoursRemaining < 1)
    return {
      urgency: "Critical",
      description: "Event closing very soon - prices may be volatile",
    };
  if (hoursRemaining < 6)
    return {
      urgency: "High",
      description: "Limited time remaining - consider quick decisions",
    };
  if (hoursRemaining < 24)
    return {
      urgency: "Medium",
      description: "Event closes today - monitor for updates",
    };
  if (hoursRemaining < 72)
    return {
      urgency: "Low",
      description: "Few days remaining - time for research",
    };
  return {
    urgency: "Very Low",
    description: "Plenty of time for analysis and position building",
  };
}

function getRiskAssessment(riskLevel) {
  switch (riskLevel) {
    case "low":
      return {
        level: "Low",
        color: "green",
        description: "Low risk - stable market conditions",
      };
    case "medium":
      return {
        level: "Medium",
        color: "yellow",
        description: "Moderate risk - normal market conditions",
      };
    case "high":
      return {
        level: "High",
        color: "red",
        description: "High risk - proceed with caution",
      };
    default:
      return {
        level: "Medium",
        color: "yellow",
        description: "Moderate risk - normal market conditions",
      };
  }
}

function getRecommendationAction(yesPercentage, totalVolume, hoursRemaining) {
  if (hoursRemaining <= 0) return "HOLD";
  if (yesPercentage >= 75) return "CONSIDER NO";
  if (yesPercentage <= 25) return "CONSIDER YES";
  return "HOLD";
}

function getMomentum(yesPercentage, totalVolume) {
  const trend =
    yesPercentage >= 55
      ? "Uptrend"
      : yesPercentage <= 45
      ? "Downtrend"
      : "Sideways";
  let description = "Price movement appears range-bound.";
  if (trend === "Uptrend")
    description = "YES odds gaining momentum; buyers dominant recently.";
  if (trend === "Downtrend")
    description = "NO odds gaining momentum; sellers dominant recently.";
  const liquidityNote =
    totalVolume > 5000
      ? " High liquidity supports moves."
      : totalVolume > 1000
      ? " Moderate liquidity."
      : " Low liquidity; moves may be noisy.";
  return { trend, description: description + liquidityNote };
}

function getSuggestedStake(confidence, totalVolume, hoursRemaining) {
  const numeric = Math.max(
    0,
    Math.min(
      100,
      typeof confidence === "number"
        ? confidence
        : confidence === "Very High"
        ? 90
        : confidence === "High"
        ? 75
        : confidence === "Medium"
        ? 50
        : confidence === "Low"
        ? 25
        : 10
    )
  );
  const liquidityFactor = Math.min(1, totalVolume / 10000); // caps at 1 after ₹10k volume
  const timeFactor =
    hoursRemaining <= 1 ? 0.6 : hoursRemaining <= 6 ? 0.8 : 1.0; // reduce size closer to close
  const base = 500; // base stake
  const stake =
    base * (numeric / 50) * (0.5 + liquidityFactor / 2) * timeFactor; // scales ~x1 at 50 conf
  const clamped = Math.max(50, Math.min(5000, Math.round(stake / 10) * 10));
  return clamped;
}

function generateSimpleRecommendation(
  yesPercentage,
  totalVolume,
  hoursRemaining
) {
  if (hoursRemaining <= 0) {
    return "Event has closed. Wait for resolution.";
  }
  if (totalVolume < 100) {
    return "Low liquidity market. Trade with caution due to high volatility.";
  }
  if (yesPercentage > 70) {
    return "Strong YES sentiment. Consider NO position if you disagree with consensus.";
  } else if (yesPercentage < 30) {
    return "Strong NO sentiment. Consider YES position if you see value.";
  } else {
    return "Balanced market. Good opportunity for informed traders with strong opinions.";
  }
}
