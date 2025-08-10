// ProboEventPage.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function ProboEventPage() {
  return (
    
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 px-4">
        {/* Left Section */}
        <div className="flex-1 space-y-6">
          {/* Event Title */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-400 rounded flex items-center justify-center text-white font-bold text-lg">
              🎯
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              West Delhi Lions to win the match vs East Delhi Riders?
            </h1>
          </div>

          {/* Tabs */}
          <nav className="flex space-x-6 border-b border-gray-200 pb-2 text-gray-600 text-sm font-medium">
            {["Orderbook", "Timeline", "Overview"].map((tab) => (
              <button
                key={tab}
                className={`pb-2 ${
                  tab === "Orderbook"
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Order Book */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="sr-only">Order Book</h2>
            <table className="w-full text-left text-sm text-gray-700">
              <thead>
                <tr>
                  <th className="px-2 py-1">PRICE</th>
                  <th className="px-2 py-1 text-blue-600">QTY AT YES</th>
                  <th className="px-2 py-1">PRICE</th>
                  <th className="px-2 py-1 text-red-600">QTY AT NO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { price: 5.5, yesQty: 17174, noQty: 16267 },
                  { price: 6, yesQty: 19500, noQty: 15500 },
                  { price: 6.5, yesQty: 16500, noQty: 14500 },
                  { price: 7, yesQty: 16500, noQty: 14500 },
                  { price: 7.5, yesQty: 26520, noQty: 25522 },
                ].map(({ price, yesQty, noQty }, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-2 py-1">{price.toFixed(1)}</td>
                    <td className="px-2 py-1 text-blue-600 font-semibold">{yesQty}</td>
                    <td className="px-2 py-1">{price.toFixed(1)}</td>
                    <td className="px-2 py-1 text-red-600 font-semibold">{noQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Probability Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2 text-blue-600 font-semibold text-sm">
                <span>YES</span>
                <span>55% Probability</span>
              </div>
              <div className="text-gray-400 text-xs">probo.</div>
            </div>
            <div className="h-48 bg-gradient-to-b from-blue-100 to-white rounded-lg relative mb-2">
              {/* Graph placeholder */}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>00:50</span>
              <span>01:48</span>
            </div>
            <div className="flex space-x-2 mt-2 text-xs text-gray-600">
              {["15 m", "30 m", "1 h", "3 h", "All"].map((label) => (
                <button
                  key={label}
                  className={`px-2 py-1 rounded ${
                    label === "1 h" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Stats</h2>

            {/* Head-to-Head */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Head-to-Head Record</h3>
              <div className="text-xs text-gray-500 mb-2">Total matches played 3</div>
              {/* Pie chart placeholder */}
              <div className="w-24 h-24 bg-yellow-300 rounded-full relative mb-2">
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-yellow-800">
                  1
                </div>
              </div>
              <ul className="text-xs text-gray-600">
                <li>WDL – 1</li>
                <li>EDR – 2</li>
                <li>Draws – 0</li>
                <li>Tie – 0</li>
                <li>No Result – 0</li>
              </ul>
            </div>

            {/* Last 5 Match Streak */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Last 5 Match Streak</h3>
              <div className="flex items-center space-x-6">
                <div className="flex space-x-1 text-xs">
                  {["L", "W", "W", "L", "L"].map((r, idx) => (
                    <div
                      key={idx}
                      className={`px-2 rounded text-white font-bold ${
                        r === "W" ? "bg-green-500" : r === "L" ? "bg-yellow-400" : "bg-gray-400"
                      }`}
                    >
                      {r}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-1 text-xs">
                  {["W", "W", "L", "W", "W"].map((r, idx) => (
                    <div
                      key={idx}
                      className={`px-2 rounded text-white font-bold ${
                        r === "W" ? "bg-green-500" : r === "L" ? "bg-yellow-400" : "bg-gray-400"
                      }`}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Toss Statistics */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Toss Statistics</h3>
              <div className="flex space-x-8 text-xs">
                <div className="flex-1 bg-gray-100 p-4 rounded">
                  <button className="bg-black text-white text-xs px-3 py-1 rounded-full mb-2 cursor-default flex items-center space-x-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-4 4m0-4l4 4" />
                    </svg>
                    <span>Batting First</span>
                  </button>
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center font-semibold text-yellow-700">
                      5
                    </div>
                    <div className="text-gray-600 text-xs">
                      <div>WDL</div>
                      <div>6 match(es) played</div>
                      <div>17% wins</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-gray-100 p-4 rounded">
                  <button className="bg-red-500 text-white text-xs px-3 py-1 rounded-full mb-2 cursor-default flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <span>Bowling First</span>
                  </button>
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center font-semibold text-green-800">
                      3
                    </div>
                    <div className="text-gray-600 text-xs">
                      <div>EDR</div>
                      <div>5 match(es) played</div>
                      <div>60% wins</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About the Event */}
          <div className="bg-white rounded-lg shadow p-6 space-y-2 text-sm text-gray-600">
            <div>
              <strong>Source of Truth:</strong>{" "}
              <a
                href="https://www.thesportsmandi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                www.thesportsmandi.com
              </a>
            </div>
            <div>
              <strong>Trading started on:</strong> 09 Aug, 2025
            </div>
            <div>
              <strong>Event expires on:</strong> 11 Aug, 2025
            </div>
            <div>
              <strong>Event Overview & Statistics:</strong><br />
              H2H last 5 T20: WDL 1, EDR 2, DRAW 0<br />
              Match 17 on 10 Aug 2025 at 19:00<br />
              Venue Stats: Pitch Behavior – Overall - Batting | Suited for – Pace | Avg Score: 168<br />
              Team Stats (Last 5 matches comparison)... <button className="text-blue-600 underline text-xs">Read More</button>
            </div>
            <div>
              <strong>Rules:</strong><br />
              1. The scorecard on the mentioned Source of Truth will be considered for settlement. The score on live streaming will not be taken into consideration.<br />
              2. The scorecard displayed on the Platform along with the one-liner is only for ease of viewing; the Source of Truth will be the basis for settlement. <button className="text-blue-600 underline text-xs">Read More</button>
            </div>
          </div>
        </div>

        {/* Right Section - Order Panel */}
        <div className="lg:w-80">
          <div className="bg-white p-6 rounded-lg shadow sticky top-6 space-y-4 text-sm">
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold">Yes @ ₹5.5</button>
              <button className="flex-1 bg-gray-200 text-gray-600 py-2 rounded font-semibold">No @ ₹4.5</button>
            </div>
            <div className="space-y-2">
              <label className="block text-gray-600">Set price</label>
              <div className="flex items-center space-x-2">
                <button className="px-2 py-1 bg-gray-200 rounded">−</button>
                <span className="flex-1 text-center font-medium">₹5.5</span>
                <button className="px-2 py-1 bg-gray-200 rounded">+</button>
              </div>
              <div className="text-gray-500 text-xs">17174 qty available</div>

              <label className="block text-gray-600">Quantity</label>
              <input
                type="number"
                min="1"
                defaultValue="1"
                className="w-full border border-gray-300 rounded p-2"
              />
              <div className="text-gray-500 text-xs">₹5.5 you put</div>
              <div className="text-red-500 text-xs flex items-center space-x-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                <span>Insufficient balance</span>
              </div>

              <button className="w-full bg-blue-400 text-white py-2 rounded font-semibold" disabled>
                Place order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
