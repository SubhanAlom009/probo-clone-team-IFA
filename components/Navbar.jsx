"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiChevronDown } from "react-icons/fi";
import { MdLogout } from "react-icons/md";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://d39axbyagw7ipf.cloudfront.net/images/logo.webp"
              alt="Probo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Primary Navigation */}
        
        </div>

        {/* Right: Wallet + Profile */}
        <div className="flex items-center gap-4">
            <nav className="hidden lg:flex gap-6 text-sm text-gray-700 font-medium">
            <Link href="/events" className="flex items-center gap-1 hover:text-black">
              <img
                src="https://d39axbyagw7ipf.cloudfront.net/icons/home.svg"
                alt="Home"
                className="w-5 h-5"
              />
              Home
            </Link>
          
            <Link href="/events/portfolio" className="flex items-center gap-1 hover:text-black">
              <img
                src="https://d39axbyagw7ipf.cloudfront.net/icons/portfolio.svg"
                alt="Portfolio"
                className="w-5 h-5"
              />
              Portfolio
            </Link>
          </nav>
          {/* Wallet */}
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-sm font-semibold">
            <img
              src="https://d39axbyagw7ipf.cloudfront.net/icons/wallet.svg"
              alt="Wallet"
              className="w-4 h-4"
            />
            ₹1.7
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1"
            >
              <img
                src="https://probo.gumlet.io/image/upload/probo_product_images/Silhouette.png"
                alt="User"
                className="w-10 h-10 rounded-full"
              />
              <FiChevronDown className="text-gray-600" />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => alert("Logging out...")}
                >
                  <MdLogout className="text-lg" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden p-2 rounded-md">
            <svg
              className="w-6 h-6 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
