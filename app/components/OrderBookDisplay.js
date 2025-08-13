"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";

/**
 * Enhanced OrderBookDisplay Component
 *
 * Features:
 * - Two-column layout (YES/NO sides)
 * - Depth bars proportional to max quantity
 * - Click/keyboard interaction to pre-fill orders
 * - User order indicators with cancel functionality
 * - Real-time animations and flash effects
 * - Mobile responsive stacking
 * - Full accessibility support
 *
 * Props:
 * - yesOrders: [{ price, qty, userId?, orderId? }] - pre-sorted descending
 * - noOrders: [{ price, qty, userId?, orderId? }] - pre-sorted ascending
 * - onSelectPrice: ({ side, price }) => void
 * - onCancel?: (orderId) => void
 * - userId?: string
 * - maxRows?: number
 */
export default function OrderBookDisplay({
  yesOrders = [],
  noOrders = [],
  onSelectPrice,
  onCancel,
  userId,
  maxRows = 15,
}) {
  const [flashedRows, setFlashedRows] = useState(new Set());
  const prevDataRef = useRef({ yesOrders: [], noOrders: [] });

  // Format numbers with thousand separators
  const formatQty = (qty) => {
    return new Intl.NumberFormat().format(qty);
  };

  // Format price consistently
  const formatPrice = (price) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(1);
  };

  // Limit rows and validate sorting
  const processedYesOrders = useMemo(() => {
    const orders = [...yesOrders].slice(0, maxRows);
    // Validate descending sort, fallback if needed
    for (let i = 1; i < orders.length; i++) {
      if (orders[i].price > orders[i - 1].price) {
        return orders.sort((a, b) => b.price - a.price);
      }
    }
    return orders;
  }, [yesOrders, maxRows]);

  const processedNoOrders = useMemo(() => {
    const orders = [...noOrders].slice(0, maxRows);
    // Validate ascending sort, fallback if needed
    for (let i = 1; i < orders.length; i++) {
      if (orders[i].price < orders[i - 1].price) {
        return orders.sort((a, b) => a.price - b.price);
      }
    }
    return orders;
  }, [noOrders, maxRows]);

  // Calculate max quantity for depth bars
  const maxQty = useMemo(() => {
    const allQtys = [
      ...processedYesOrders.map((o) => o.qty),
      ...processedNoOrders.map((o) => o.qty),
    ];
    return Math.max(...allQtys, 1); // Prevent division by 0
  }, [processedYesOrders, processedNoOrders]);

  // Flash effect for changed quantities
  useEffect(() => {
    const prevYes = prevDataRef.current.yesOrders;
    const prevNo = prevDataRef.current.noOrders;
    const newFlashed = new Set();

    // Check for quantity changes
    processedYesOrders.forEach((order, index) => {
      const prevOrder = prevYes[index];
      if (prevOrder && prevOrder.qty !== order.qty) {
        newFlashed.add(`yes-${order.price}`);
      }
    });

    processedNoOrders.forEach((order, index) => {
      const prevOrder = prevNo[index];
      if (prevOrder && prevOrder.qty !== order.qty) {
        newFlashed.add(`no-${order.price}`);
      }
    });

    if (newFlashed.size > 0) {
      setFlashedRows(newFlashed);
      setTimeout(() => setFlashedRows(new Set()), 1000);
    }

    prevDataRef.current = {
      yesOrders: processedYesOrders,
      noOrders: processedNoOrders,
    };
  }, [processedYesOrders, processedNoOrders]);

  // Order row component
  const OrderRow = ({ order, side, index, isBest }) => {
    const isUserOrder = userId && order.userId === userId;
    const rowKey = `${side}-${order.price}`;
    const isFlashed = flashedRows.has(rowKey);
    const barWidth = (order.qty / maxQty) * 100;
    const impliedPrice = side === "no" ? (10 - order.price).toFixed(1) : null;

    const handleClick = () => {
      onSelectPrice?.({ side, price: order.price });
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    const handleCancel = (e) => {
      e.stopPropagation();
      onCancel?.(order.orderId);
    };

    const tooltipContent = null; // Removed tooltips as per user request

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Select ${side.toUpperCase()} price ${formatPrice(
          order.price
        )} quantity ${formatQty(order.qty)}`}
        className={`
          relative group cursor-pointer rounded-md px-3 py-2 transition-all duration-200
          ${
            side === "yes"
              ? "hover:bg-emerald-900/30 text-emerald-300"
              : "hover:bg-rose-900/30 text-rose-300"
          }
          ${isFlashed ? "animate-pulse bg-yellow-500/20" : ""}
          focus:outline-none
        `}
      >
        {/* Depth bar */}
        <div
          className={`
            absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-md opacity-30
            ${side === "yes" ? "bg-emerald-500" : "bg-rose-500"}
          `}
          style={{ width: `${barWidth}%` }}
        />

        {/* Content */}
        <div
          className={`relative flex items-center justify-between z-10 ${
            side === "yes" ? "" : "flex-row-reverse"
          }`}
        >
          <div
            className={`font-mono font-bold ${
              side === "yes" ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            ₹{formatPrice(order.price)}
          </div>

          <div className="flex items-center gap-2">
            <span className="tabular-nums font-medium">
              {formatQty(order.qty)}
            </span>

            {isUserOrder && onCancel && order.orderId && (
              <button
                onClick={handleCancel}
                className="text-[10px] px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition"
                aria-label="Cancel order"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      {/* Column headers - Desktop */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-emerald-400 mb-1">
            YES PRICES
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-rose-400 mb-1">NO PRICES</div>
        </div>
      </div>

      {/* Order lists */}
      <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
        {/* YES column */}
        <div className="space-y-1">
          <div className="md:hidden text-center mb-3">
            <div className="text-sm font-bold text-emerald-400 mb-1">
              YES PRICES
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
            {processedYesOrders.length === 0 ? (
              <div className="text-center text-neutral-500 py-4 text-sm">
                No YES orders
              </div>
            ) : (
              processedYesOrders.map((order, index) => (
                <OrderRow
                  key={`yes-${order.price}-${index}`}
                  order={order}
                  side="yes"
                  index={index}
                  isBest={false}
                />
              ))
            )}
          </div>
        </div>

        {/* NO column */}
        <div className="space-y-1">
          <div className="md:hidden text-center mb-3">
            <div className="text-sm font-bold text-rose-400 mb-1">
              NO PRICES
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900">
            {processedNoOrders.length === 0 ? (
              <div className="text-center text-neutral-500 py-4 text-sm">
                No NO orders
              </div>
            ) : (
              processedNoOrders.map((order, index) => (
                <OrderRow
                  key={`no-${order.price}-${index}`}
                  order={order}
                  side="no"
                  index={index}
                  isBest={false}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-4 pt-3 border-t border-neutral-700 text-[10px] text-neutral-500 leading-relaxed">
        <div className="mb-1">
          <span className="font-bold">Matching:</span> YES at ₹P matches NO at
          ₹(10−P) only.
        </div>
        <div>Click any row to pre-fill order form</div>
      </div>
    </div>
  );
}
