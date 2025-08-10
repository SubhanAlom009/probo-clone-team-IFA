import { useState } from "react";

export default function ProboEventPage() {
  const [activeTab, setActiveTab] = useState("orderbook");
  const [price, setPrice] = useState(5.5);
  const [quantity, setQuantity] = useState(1);
  const [yesNo, setYesNo] = useState("yes");

  const incrementPrice = () => setPrice((p) => Math.min(p + 0.5, 7.5));
  const decrementPrice = () => setPrice((p) => Math.max(p - 0.5, 5.5));
  const incrementQty = () => setQuantity((q) => q + 1);
  const decrementQty = () => setQuantity((q) => Math.max(q - 1, 1));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-xl font-bold cursor-pointer">probo.</div>
            <a href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </a>
            <a href="/portfolio" className="text-gray-700 hover:text-blue-600 font-medium">
              Portfolio
            </a>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-gray-500 text-sm">For 18 years and above only</div>
            <button className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition">
              Download App
            </button>
            <button className="bg-gray-100 px-3 py-1 rounded-md flex items-center space-x-1 hover:bg-gray-200 transition">
              <span>₹1.7</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6 text-gray-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 15c4.97 0 9.216 2.5 10.879 6.189M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <button
              aria-label="cart"
              className="text-gray-600 hover:text-gray-800 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 7M7 13l-2 9m5-9v9m4-9v9m1-14h3"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4 text-gray-600 text-sm">
        Home &gt; <span className="font-semibold text-gray-900">Event Details</span>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-6 flex-1 pb-10">
        {/* Left main section */}
        <section className="flex-1 space-y-6">
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
          <nav className="flex space-x-6 border-b border-gray-200 text-gray-600 text-sm font-medium">
            {["Orderbook", "Timeline", "Overview"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-3 ${
                  activeTab === tab.toLowerCase()
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Orderbook content */}
          {activeTab === "orderbook" && (
            <div className="bg-white rounded-md shadow p-6">
              {/* Table */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">PRICE</th>
                      <th className="px-2 py-1">QTY AT YES</th>
                      <th className="px-2 py-1">PRICE</th>
                      <th className="px-2 py-1">QTY AT NO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { price: 5.5, yesQty: 17174, noQty: 16267 },
                      { price: 6, yesQty: 19500, noQty: 15500 },
                      { price: 6.5, yesQty: 16500, noQty: 14500 },
                      { price: 7, yesQty: 16500, noQty: 14500 },
                      { price: 7.5, yesQty: 26520, noQty: 25522 },
                    ].map(({ price, yesQty, noQty }, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 py-1">{price.toFixed(1)}</td>
                        <td className="px-2 py-1 text-blue-600 font-semibold">{yesQty}</td>
                        <td className="px-2 py-1">{price.toFixed(1)}</td>
                        <td className="px-2 py-1 text-red-600 font-semibold">{noQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* About the event */}
          <section className="bg-white rounded-md shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">About the event</h2>
            <div className="text-xs text-gray-600 space-y-4 leading-relaxed max-w-3xl">
              <p>
                <span className="font-semibold">Source of Truth:</span>{" "}
                <a
                  href="https://www.thesportsmandi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  www.thesportsmandi.com
                </a>
              </p>
              <p>
                <span className="font-semibold">Trading started on:</span> 09 Aug, 2025
              </p>
              <p>
                <span className="font-semibold">Event expires on:</span> 11 Aug, 2025
              </p>
              <p>
                <span className="font-semibold">Event Overview & Statistics:</span><br />
                H2H last 5 T20 : WDL 1, EDR 2, DRAW 0 <br />
                West Delhi Lions vs East Delhi Riders Match 17 on 10 Aug 2025 at 19:00 <br />
                Venue Stats: Pitch Behaviour - Overall - Batting | Suited for - pace | Avg Score : 168 <br />
                Team Stats(Last 5 Matches comparison): West Delhi...{" "}
                <button className="text-blue-600 underline">Read More</button>
              </p>
              <p>
                <span className="font-semibold">Rules</span><br />
                REFERENCE FOR SETTLEMENT (Source of Truth):<br />
                1. The scorecard on the mentioned Source of truth will be considered for settlement. The score on the live streaming will not be taken into consideration.<br />
                2. The scorecard displayed on the Platform along with the one liner is only for ease of viewing; the Source of Truth will be the basis for settlement.<br />
              </p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
