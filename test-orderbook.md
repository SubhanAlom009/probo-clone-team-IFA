# OrderBookDisplay Component Test Cases

## Test Data Structure

```javascript
const testYesOrders = [
  { price: 7.5, qty: 15000, userId: "user1", orderId: "order1" },
  { price: 7.0, qty: 8500, userId: "user2", orderId: "order2" },
  { price: 6.5, qty: 12000, userId: "current_user", orderId: "order3" }, // User's order
  { price: 6.0, qty: 5000, userId: "user3", orderId: "order4" },
];

const testNoOrders = [
  { price: 2.5, qty: 18000, userId: "user4", orderId: "order5" },
  { price: 3.0, qty: 9500, userId: "current_user", orderId: "order6" }, // User's order
  { price: 3.5, qty: 7200, userId: "user5", orderId: "order7" },
  { price: 4.0, qty: 3000, userId: "user6", orderId: "order8" },
];
```

## Unit Tests to Verify

### 1. Depth Bar Scaling

```javascript
// Test: Depth bars scale correctly
const maxQty = Math.max(
  ...testYesOrders.map((o) => o.qty),
  ...testNoOrders.map((o) => o.qty)
);
// Expected: maxQty = 18000 (from NO order at 2.5)

// Bar width for YES 7.5 (qty: 15000) should be: (15000 / 18000) * 100 = 83.33%
// Bar width for NO 3.5 (qty: 7200) should be: (7200 / 18000) * 100 = 40%
```

### 2. Click/Enter Selection

```javascript
// Test: Clicking/pressing Enter calls onSelectPrice with correct payload
const expectedPayloads = [
  { side: "yes", price: 7.5 }, // Clicking YES 7.5 row
  { side: "no", price: 2.5 }, // Clicking NO 2.5 row
];
```

### 3. Tooltip Implied Price Calculation

```javascript
// Test: NO row tooltips show correct implied YES price
const noOrder = { price: 3.0, qty: 9500 };
const impliedYesPrice = (10 - 3.0).toFixed(1); // Expected: "7.0"

// Tooltip should display:
// Price: ₹3.0
// Quantity: 9,500
// Implied YES: ₹7.0
```

### 4. Best Price Indicators

```javascript
// Test: "Best" labels appear on correct rows
// Best YES = highest YES price = 7.5
// Best NO = lowest NO price = 2.5
```

### 5. User Order Indicators

```javascript
// Test: User's orders show "Mine" label and cancel button
// User orders: YES 6.5 and NO 3.0 should have:
// - "Mine" label
// - Cancel button (✕)
// - cyan ring border
```

### 6. Large Number Formatting

```javascript
// Test: Large quantities show thousand separators
const largeQty = 123456;
const formatted = new Intl.NumberFormat().format(largeQty);
// Expected: "123,456"
```

### 7. Empty State Handling

```javascript
// Test: Empty order lists show placeholder
const emptyYes = [];
const emptyNo = [];
// Should display: "No YES orders" and "No NO orders"
```

### 8. Price Formatting Consistency

```javascript
// Test: Prices display consistently
const prices = [5, 5.5, 7.0, 8.5];
const formatted = prices.map((p) =>
  p % 1 === 0 ? p.toString() : p.toFixed(1)
);
// Expected: ["5", "5.5", "7.0", "8.5"]
```

## Accessibility Tests

### 1. Keyboard Navigation

- Tab through all interactive rows
- Press Enter on a row to trigger onSelectPrice
- Press Space on a row to trigger onSelectPrice

### 2. Screen Reader Support

- aria-label on each row includes price, quantity, and side
- Table structure with proper headers
- Tooltips use aria-describedby

### 3. Mobile Responsiveness

- On narrow screens, columns stack vertically (YES first, then NO)
- Rows remain tappable with full-width depth bars
- Touch targets are at least 44px tall

## Visual Tests

### 1. Flash Animation

- Change quantity in testYesOrders[0] from 15000 to 20000
- Row should flash (animate-pulse with bg-yellow-500/20) for 1 second

### 2. Depth Bar Transitions

- When quantities change, depth bars should smoothly transition width
- CSS transition should take ~300ms

### 3. Hover Effects

- Hovering a row shows bg-neutral-700/50
- Tooltip appears above row with arrow pointer

## Integration Tests

### 1. Real-time Updates

```javascript
// Simulate Firestore update
const updatedOrders = [...testYesOrders];
updatedOrders[0].qty = 25000; // Change from 15000

// Expected:
// 1. Depth bars recalculate (new maxQty = 25000)
// 2. Flash effect on changed row
// 3. Smooth bar width transitions
```

### 2. Order Cancellation

```javascript
// Test cancel button functionality
const onCancel = jest.fn();
// Click cancel button on user's order
// Should call: onCancel("order3")
```

## Edge Case Tests

### 1. Very Large Quantities

```javascript
const extremeOrder = {
  price: 5.0,
  qty: 999999999,
  userId: "user",
  orderId: "big",
};
// Should format as: "999,999,999"
// Depth bar should be 100% width
```

### 2. Decimal Prices

```javascript
const decimalPrices = [0.5, 1.5, 2.5, 9.5];
// All should display with .5 suffix
```

### 3. Zero Quantities (should be filtered out in parent)

```javascript
const invalidOrder = { price: 5.0, qty: 0, userId: "user", orderId: "zero" };
// Should not appear in order book
```

### 4. Missing User IDs

```javascript
const anonymousOrder = { price: 5.0, qty: 1000, orderId: "anon" };
// Should not show "Mine" or cancel button
```

## Performance Tests

### 1. Large Order Books

```javascript
// Generate 1000 orders
const largeOrderBook = Array.from({ length: 1000 }, (_, i) => ({
  price: (i % 10) / 2 + 0.5, // Prices 0.5-5.0
  qty: Math.floor(Math.random() * 10000),
  userId: `user${i}`,
  orderId: `order${i}`,
}));

// Should render smoothly with virtualization if needed
// Max rows prop should limit display to manageable number
```

## Usage Example

```jsx
<OrderBookDisplay
  yesOrders={testYesOrders}
  noOrders={testNoOrders}
  onSelectPrice={({ side, price }) => {
    console.log(`Selected ${side} at ₹${price}`);
  }}
  onCancel={(orderId) => {
    console.log(`Cancel order ${orderId}`);
  }}
  userId="current_user"
  maxRows={15}
/>
```
