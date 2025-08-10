"use client"

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { NavLink } from "react-router-dom";

export default function ProboEventPage() {
    const [price, setPrice] = useState(7.0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSide, setSelectedSide] = useState("yes");
  const [balance, setBalance] = useState(20); // Simulating no balance for now

  const availableQty = 15;
  const maxPrice = 10.0;
  const minPrice = 1.0;

  const handlePriceChange = (delta) => {
    setPrice((prev) => {
      let newPrice = Math.min(maxPrice, Math.max(minPrice, prev + delta));
      return parseFloat(newPrice.toFixed(1));
    });
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      let newQty = Math.min(availableQty, Math.max(1, prev + delta));
      return newQty;
    });
  };



  const totalPut = price * quantity;
  const totalGet = 10 * quantity; // Example logic: "You get" is ₹10 * qty

 const hasBalance = balance >= totalPut;
    const router = useRouter();
  // const handlePlaceOrder = () => {
  //   if (hasBalance) {
  //     router.push("/dashboard");
  //   }
  // };
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


    <div className="lg:w-80">
      <div className=" rounded-lg shadow sticky top-6 text-sm border border-gray-200">

        {/* Yes / No Buttons */}
        <div className="flex">
          <button
            onClick={() => setSelectedSide("yes")}
            className={`flex-1 py-2 font-semibold text-center ${
              selectedSide === "yes"
                ? "bg-green-100 text-green-700 border-b-2 border-green-500"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Yes ₹{price.toFixed(1)}
          </button>
          <button
            onClick={() => setSelectedSide("no")}
            className={`flex-1 py-2 font-semibold text-center ${
              selectedSide === "no"
                ? "bg-red-100 text-red-700 border-b-2 border-red-500"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            No ₹{(10 - price).toFixed(1)}
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex border-b border-gray-200">
          <button className="flex-1 py-2 text-center font-medium border-b-2 border-blue-500 text-blue-600">
            Set price
          </button>
          <button className="flex-1 py-2 text-center font-medium text-gray-500">
            Market
          </button>
        </div>

        {/* Price Selector */}
        <div className="p-4 space-y-3">
          <div>
            <div className="flex justify-between items-center text-gray-500 mb-1">
              <span>Price</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                className="p-2 rounded "
                onClick={() => handlePriceChange(-0.5)}
              >
                <img
                  src="https://d39axbyagw7ipf.cloudfront.net/icons/minus.svg"
                  alt="minus"
                  className="w-3 h-3"
                />
              </button>
              <span className="text-lg font-semibold text-gray-500">₹{price.toFixed(1)}</span>
              <button
                className="p-2 rounded "
                onClick={() => handlePriceChange(0.5)}
              >
                <img
                  src="https://d39axbyagw7ipf.cloudfront.net/icons/plus.svg"
                  alt="plus"
                  className="w-3 h-3"
                />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {availableQty} qty available
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <div className="flex justify-between items-center text-gray-500 mb-1">
              <span>Quantity</span>
              <img
                src="https://d39axbyagw7ipf.cloudfront.net/icons/settings.svg"
                alt="limit"
                className="w-3 h-3"
              />
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                className={`p-2 rounded bg-gray-100 ${
                  quantity === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity === 1}
              >
                <img
                  src="https://d39axbyagw7ipf.cloudfront.net/icons/minus_gray.svg"
                  alt="minus"
                  className="w-3 h-3"
                />
              </button>
              <span className="text-lg font-semibold text-gray-500">{quantity}</span>
              <button
                className="p-2 rounded bg-gray-100"
                onClick={() => handleQuantityChange(1)}
              >
                <img
                  src="https://d39axbyagw7ipf.cloudfront.net/icons/plus.svg"
                  alt="plus"
                  className="w-3 h-3"
                />
              </button>
            </div>
          </div>

          {/* Total Stats */}
          <div className="flex justify-around border-t pt-2">
            <div className="text-center">
              <div className="font-semibold text-gray-500">₹{totalPut.toFixed(1)}</div>
              <div className="text-xs text-gray-500">You put</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                ₹{totalGet.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">You get</div>
            </div>
          </div>
        </div>

        {/* Insufficient Balance Banner */}
        {!hasBalance && (
          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex items-center space-x-3">
              <img
                src="https://probo.gumlet.io/image/upload/probo_product_images/low_balance.png"
                alt="low balance"
                className="w-6 h-6"
              />
              <div>
                <div className="text-sm font-medium text-gray-500">Insufficient balance</div>
                <div className="text-xs text-gray-500">Learn more</div>
              </div>
            </div>
            <button className="bg-gray-900 text-white px-3 py-1 rounded text-xs font-semibold">
              Recharge
            </button>
          </div>
        )}

        {/* Place Order Button */}
        <div className="p-4">
          <button
            disabled={!hasBalance}
            // onClick={handlePlaceOrder}
            className={`w-full py-2 rounded font-semibold text-white ${
              hasBalance
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-400 cursor-not-allowed"
            }`}
          >
            Place order
          </button>
        </div>
      </div>
    </div>


      </div>
    </div>
  );
}
