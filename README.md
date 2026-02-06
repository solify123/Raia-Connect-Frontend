# Raia-Connect Frontend

React Native (Expo) app for Raia-Connect — product catalog, real-time filter, and checkout.

## Tech Stack

- React Native, Expo, TypeScript, Expo Router
- Web + iOS/Android (Expo Go)

## Setup

```bash
cd Raia-Connect-Frontend
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL (e.g. http://localhost:3000)
npx expo start
```

Then press **w** for web, **a** for Android, or **i** for iOS.

## Features

- **Product catalog** — List with name, price, category, stock; images from local assets
- **Real-time filter** — Search bar + category pills (no page reload)
- **Product detail** — Tap a product to open a modal with more info and Buy
- **Checkout** — Buy button calls `POST /checkout`; Toast on success or API error
- **Loading / empty / error** — Loading spinner, empty state when no matches, error state with Retry; Toast for API failures

## Project Structure

- `app/` — Expo Router screens (`_layout.tsx`, `index.tsx`)
- `src/api/` — API client (GET /products, POST /checkout)
- `src/context/` — Toast for error/success messages
- `src/hooks/` — useProducts (fetch + loading/error)
- `src/types/` — Product type
- `src/constants/` — Product image mapping for assets
