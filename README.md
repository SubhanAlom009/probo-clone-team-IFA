# Probo-Clone: Prediction Market Web App

A modern, real-time prediction market platform inspired by Probo, built with Next.js, Firebase, and Recharts. Place YES/NO bets, see a true order book, and track your performance with analytics and a transparent ledger.

## Features

- **User Auth & Profiles**: Sign up/in, profile with balance, ledger, and avatar.
- **Event Markets**: Browse, create, and resolve prediction events with YES/NO order books.
- **Order Book Trading**: Place limit orders, see real-time market depth, and match with other users.
- **Locked Funds & Payouts**: Only matched funds are locked; unmatched/cancelled orders are refunded. Winnings are paid out instantly on event resolution.
- **Order Management**: View, cancel, and track all your orders (open, filled, cancelled).
- **Analytics & Charting**: Live event analytics, price/probability chart, volume bars, and trade markers.
- **Ledger**: Full audit trail of all payouts, refunds, cancels, and recharges.
- **Mobile Friendly**: Responsive design with a modern, intuitive UI.

## Tech Stack

- [Next.js 14+](https://nextjs.org/) (App Router)
- [Firebase Auth & Firestore](https://firebase.google.com/)
- [Recharts](https://recharts.org/) (market chart)
- [Tailwind CSS](https://tailwindcss.com/) (UI)

## Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/SubhanAlom009/probo-clone-team-IFA
   cd probo-clone
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure Firebase:**
   - Create a Firebase project.
   - Enable Email/Password Auth.
   - Create a Firestore database.
   - Copy your Firebase config to `lib/firebase.js`.
4. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `app/` — Next.js app directory (pages, API routes, components)
- `components/` — UI components (OrderBook, BetForm, Chart, etc.)
- `lib/` — Firebase, DB logic, utility functions
- `public/` — Static assets

## How It Works

- Place YES/NO orders at your chosen price and quantity.
- Orders are matched in a true order book (FIFO, price-time priority).
- Only matched funds are locked; unmatched/cancelled orders are refunded.
- On event resolution, all matched bets are settled and payouts are distributed.
- All actions are recorded in your personal ledger for transparency.

## License

MIT

---

Built by SubhanAlom009 with Next.js, Firebase, and a little help from GitHub Copilot.
