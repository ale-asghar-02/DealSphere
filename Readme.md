# DealSphere

A full-stack online marketplace built with the MERN stack. Users can post classified ads, sell products with direct checkout (COD or Stripe), chat with sellers in real time, and use AI-powered tools (Google Gemini) for listing creation, moderation, support and design generation.

> Built as an internship project.

[![Open DealSphere](https://img.shields.io/badge/Open-DealSphere-2ea44f?style=for-the-badge)](https://REPLACE-WITH-YOUR-CLIENT_URL)

## Features

### Marketplace
- Roles: **guest**, **seller**, **admin**
- Ads and products with categories and subcategories (self-referencing category model)
- Image uploads via Cloudinary (multer memory storage)
- Combined search (ads + products) with debounced suggestions
- Wishlist, cart, featured listings
- Country and city filters

### Orders and Payments
- Buy now or checkout from cart
- Payment via **Cash on Delivery** or **Stripe Checkout**
- Seller-controlled order status: `pending → processing → shipped → delivered`
- Escrow-style flow: seller wallet is credited when the buyer confirms receipt
- Wallet, transaction history and withdrawal requests (fee is applied on withdrawal)

### Subscriptions
- **Seller plans:** Free / Monthly / Yearly with separate ad and product limits and featured slots
- **Design plans:** Free / Monthly / Yearly with daily and monthly generation limits, edits per design and watermark control
- Admin-controlled prices and time-limited discounts
- Featured listing plans (normal / basic / premium) with automatic expiry via cron

### Real-time Chat and Notifications
- Real-time chat between a buyer and a seller (guest-to-seller and seller-to-seller) using Socket.io
- In-app and email notifications

### AI Features (Google Gemini)
1. **Autofill for ads and products:** generates the description, condition and other listing fields from the seller's description and images (images themselves are not generated)
2. **AI moderation:** scores new listings by content and seller history, then marks them active, pending review or rejected
3. **AI chat assistant:** answers buyer questions about a listing
4. **Site chatbot:** Gemini function calling with public tools for guests and account tools (orders, wallet, cart) for logged-in users
5. **AI Design Studio:** generates images such as posters, banners and thumbnails from a prompt, limited by the user's design plan

### Admin Panel
1. **Ads and products:** review, approve, reject and remove listings, manage featured status
2. **Subscriptions:** manage seller plans, limits, prices and discounts
3. **Design subscriptions:** manage design plans, usage limits and discounts
4. **Articles:** create, edit and publish articles
5. **Platform management:** users (ban/suspend), categories, reports, contact messages, withdrawals and transactions

### Auth and Security
- JWT access and refresh tokens in httpOnly cookies
- OTP email verification and password reset (Brevo SMTP)
- Google Sign-In: the frontend sends a Google ID token and the backend verifies it with Google's OAuth2 client
- Banned, suspended and deleted accounts are blocked at login
- Rate limiting and input validation (express-validator, zod for AI output)

## Tech Stack

<table width="100%">
  <thead>
    <tr>
      <th width="25%" align="left">Layer</th>
      <th width="75%" align="left">Technologies</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Frontend</td><td>React (Vite), Bootstrap CSS, Tabler Icons, SweetAlert2</td></tr>
    <tr><td>Backend</td><td>Node.js, Express, Socket.io, node-cron</td></tr>
    <tr><td>Database</td><td>MongoDB, Mongoose</td></tr>
    <tr><td>Payments</td><td>Stripe</td></tr>
    <tr><td>Storage</td><td>Cloudinary</td></tr>
    <tr><td>Email</td><td>Brevo SMTP</td></tr>
    <tr><td>AI</td><td>Google Gemini (<code>gemini-2.5-flash</code>)</td></tr>
    <tr><td>Auth</td><td>JWT, bcrypt, Google ID token verification</td></tr>
  </tbody>
</table>

> **Note:** The backend is hosted on Render's free plan, which puts the service to sleep after a period of inactivity. If the website takes longer than usual to load, please wait a few seconds while the server wakes up.

## Author

**Ali Asghar**
GitHub: [@ale-asghar-02](https://github.com/ale-asghar-02)