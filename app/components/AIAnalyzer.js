"use client";
import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Target,
} from "lucide-react";

export default function AIAnalyzer({ eventId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const fetchAnalysis = useCallback(async () => {
    if (!user) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const response = await fetch(`/api/events/${eventId}/analysis`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (eventId && user && !authLoading) {
      fetchAnalysis();
    }
  }, [eventId, user, authLoading, fetchAnalysis]);

  if (authLoading || loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">
            AI Market Analysis
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-neutral-400">
            Analyzing market data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-red-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">
            AI Market Analysis
          </h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-400 mb-2">Analysis unavailable</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const getRecommendationIcon = (action) => {
    switch (action) {
      case "CONSIDER YES":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "CONSIDER NO":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  // map color keywords from analysis to safe Tailwind classes
  const sentimentBgClass = (color) => {
    switch ((color || "").toLowerCase()) {
      case "green":
        return "bg-green-500";
      case "red":
        return "bg-red-500";
      case "yellow":
        return "bg-yellow-500";
      case "orange":
        return "bg-orange-500";
      case "purple":
        return "bg-purple-500";
      case "blue":
        return "bg-blue-500";
      case "cyan":
        return "bg-cyan-500";
      case "lime":
        return "bg-lime-400";
      default:
        return "bg-neutral-600";
    }
  };

  const riskTextClass = (color) => {
    switch ((color || "").toLowerCase()) {
      case "green":
        return "text-green-400";
      case "red":
        return "text-red-400";
      case "yellow":
        return "text-yellow-400";
      case "orange":
        return "text-orange-400";
      case "purple":
        return "text-purple-400";
      case "blue":
        return "text-blue-400";
      case "cyan":
        return "text-cyan-400";
      default:
        return "text-neutral-400";
    }
  };
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "Very High":
        return "text-green-400";
      case "High":
        return "text-lime-400";
      case "Medium":
        return "text-yellow-400";
      case "Low":
        return "text-orange-400";
      case "Very Low":
        return "text-red-400";
      default:
        return "text-neutral-400";
    }
  };

  const parseAIReasoning = (text) => {
    if (!text) return { parsed: false, text: "" };
    // remove markdown fences
    let cleaned = text
      .replace(/```(json)?/gi, "")
      .replace(/```/g, "")
      .trim();
    // try to extract JSON substring
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const maybeJson = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        const obj = JSON.parse(maybeJson);
        return { parsed: true, data: obj };
      } catch (e) {
        // fallthrough to return cleaned text
      }
    }

    // Try parsing whole cleaned text
    try {
      const obj = JSON.parse(cleaned);
      return { parsed: true, data: obj };
    } catch (e) {}

    return { parsed: false, text: cleaned };
  };

  const labelFromNumericConfidence = (c) => {
    if (typeof c !== "number") return c || "";
    if (c >= 90) return "Very High";
    if (c >= 75) return "High";
    if (c >= 50) return "Medium";
    if (c >= 25) return "Low";
    return "Very Low";
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-cyan-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">
            AI Market Analysis
          </h3>
        </div>
        <span className="text-xs text-neutral-500">
          Updated {new Date(analysis.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {/* Market Probability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-300">
            Market Probability
          </span>
          <span
            className={`text-sm font-medium ${getConfidenceColor(
              analysis.probability.confidence
            )}`}
          >
            {analysis.probability.confidence} Confidence
          </span>
        </div>

        <div className="relative">
          <div className="flex h-8 bg-neutral-800 rounded overflow-hidden">
            <div
              className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${analysis.probability.yes}%` }}
            >
              {analysis.probability.yes > 20 &&
                `${analysis.probability.yes}% YES`}
            </div>
            <div
              className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${analysis.probability.no}%` }}
            >
              {analysis.probability.no > 20 && `${analysis.probability.no}% NO`}
            </div>
          </div>
        </div>
      </div>

      {/* Market Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-800 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Total Volume</div>
          <div className="text-lg font-semibold text-white">
            ₹{analysis.marketMetrics.totalVolume}
          </div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Active Traders</div>
          <div className="text-lg font-semibold text-white">
            {analysis.marketMetrics.uniqueTraders}
          </div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Total Bets</div>
          <div className="text-lg font-semibold text-white">
            {analysis.marketMetrics.totalBets}
          </div>
        </div>
        <div className="bg-neutral-800 rounded-lg p-3">
          <div className="text-xs text-neutral-400 mb-1">Avg Bet Size</div>
          <div className="text-lg font-semibold text-white">
            ₹{analysis.marketMetrics.averageBetSize}
          </div>
        </div>
      </div>

      {/* Analysis Insights */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start space-x-3">
          <div
            className={`w-2 h-2 rounded-full mt-2 ${sentimentBgClass(
              analysis.analysis.marketSentiment.color
            )}`}
          ></div>
          <div>
            <div className="text-sm font-medium text-white">
              {analysis.analysis.marketSentiment.sentiment}
            </div>
            <div className="text-xs text-neutral-400">
              {analysis.analysis.marketSentiment.description}
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-white">
              Volume Analysis: {analysis.analysis.volumeAnalysis.level}
            </div>
            <div className="text-xs text-neutral-400">
              {analysis.analysis.volumeAnalysis.description}
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Target className="w-4 h-4 text-purple-400 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-white">
              {analysis.analysis.momentum.trend}
            </div>
            <div className="text-xs text-neutral-400">
              {analysis.analysis.momentum.description}
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <AlertTriangle
            className={`w-4 h-4 ${riskTextClass(
              analysis.analysis.riskAssessment.color
            )} mt-0.5`}
          />
          <div>
            <div className="text-sm font-medium text-white">
              Risk Level: {analysis.analysis.riskAssessment.level}
            </div>
            <div className="text-xs text-neutral-400">
              {analysis.analysis.riskAssessment.description}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-lg p-4">
        <div className="flex items-center mb-3">
          {getRecommendationIcon(analysis.recommendation.action)}
          <span className="ml-2 text-white font-semibold">
            {analysis.recommendation.action}
          </span>
          <span
            className={`ml-auto text-sm ${getConfidenceColor(
              analysis.recommendation.confidence
            )}`}
          >
            {analysis.recommendation.confidence} Confidence
          </span>
        </div>

        <div className="text-sm text-neutral-300 mb-3">
          {(() => {
            const reasoning = analysis.recommendation.reasoning || "";
            const parsed = parseAIReasoning(reasoning);
            if (parsed.parsed && parsed.data) {
              const d = parsed.data;
              return (
                <div className="space-y-2">
                  {d.summary && (
                    <div className="text-sm text-neutral-200">{d.summary}</div>
                  )}
                  <div className="flex gap-4 text-xs text-neutral-400">
                    {d.sentiment && (
                      <div>
                        Sentiment:{" "}
                        <span className="font-medium text-white">
                          {String(d.sentiment)}
                        </span>
                      </div>
                    )}
                    {d.confidence !== undefined && (
                      <div>
                        Confidence:{" "}
                        <span
                          className={`font-medium ${getConfidenceColor(
                            labelFromNumericConfidence(d.confidence)
                          )}`}
                        >
                          {labelFromNumericConfidence(d.confidence)}
                        </span>
                      </div>
                    )}
                    {d.riskLevel && (
                      <div>
                        Risk:{" "}
                        <span className="font-medium text-white">
                          {String(d.riskLevel)}
                        </span>
                      </div>
                    )}
                  </div>
                  {Array.isArray(d.keyFactors) && d.keyFactors.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-neutral-300">
                      {d.keyFactors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            // fallback: show cleaned text with limited length
            const cleaned = parsed.text || "";
            const lines = cleaned.split(/\r?\n/).slice(0, 6);
            return (
              <div className="whitespace-pre-wrap text-sm text-neutral-300">
                {lines.join("\n")} {cleaned.length > 500 ? "..." : ""}
              </div>
            );
          })()}
        </div>

        <div className="text-xs text-neutral-400 space-y-1">
          <div>
            💡 Suggested stake: ₹{analysis.recommendation.suggestedStake}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {analysis.recommendation.keyFactors.map((factor, index) => (
              <span key={index}>• {factor}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-neutral-500 text-center">
        ⚠️ This analysis is for informational purposes only. Always do your own
        research.
      </div>
    </div>
  );
}
