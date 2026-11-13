// Run with: node seed/seedHelpCenter.js
// Make sure MONGO_URI is set in your .env file (MongoDB Atlas connection string).
//
// This script ONLY touches the articles collection. It does not import, read,
// create, update, or delete anything in the category collection.

require("dotenv").config();
const mongoose = require("mongoose");
const articleModel = require("../models/articleModel");

const articles = [
  {
    title: "How do I post an ad or product listing?",
    slug: "how-do-i-post-an-ad-or-product-listing",
    content:
      'Click "Post Ad" in the navbar, choose your category — product or classified ad — add photos, price, and description, then publish.',
    category: "selling",
    tags: ["posting", "ads", "listing"],
  },
  {
    title: "Can I edit my listing after posting?",
    slug: "can-i-edit-my-listing-after-posting",
    content:
      'Yes. Go to "My Listings" in your profile, select the listing, and click Edit. Changes appear immediately.',
    category: "selling",
    tags: ["editing", "listing"],
  },
  {
    title: "Is DealSphere free to use?",
    slug: "is-dealsphere-free-to-use",
    content:
      "Basic listings are 100% free. Optional paid packages are available to boost your ad visibility and reach more buyers.",
    category: "account",
    tags: ["pricing", "free"],
  },
  {
    title: "How do I delete my account?",
    slug: "how-do-i-delete-my-account",
    content:
      "Go to Account Settings → Privacy → Delete Account. This permanently removes your profile and all listings.",
    category: "account",
    tags: ["account", "delete"],
  },
  {
    title: "How does DealSphere handle scam reports?",
    slug: "how-does-dealsphere-handle-scam-reports",
    content:
      "Our Trust & Safety team reviews every report within 24 hours. Confirmed scammers are permanently banned.",
    category: "safety",
    tags: ["scam", "safety", "reporting"],
  },
  {
    title: "How to place an order",
    slug: "how-to-place-an-order",
    content:
      "Find a listing you're interested in and open it to review the details, photos, and price. Tap \"Buy Now,\" choose your preferred payment method — card, bank transfer, or cash on delivery — and confirm the order. You'll get an order confirmation right away, and the seller will be notified to prepare your item.",
    category: "orders",
    tags: ["orders", "checkout", "buying"],
  },
  {
    title: "How to post a free item",
    slug: "how-to-post-a-free-item",
    content:
      'Open your dashboard and click "Post." Select the "Free" category, add clear photos and a short description of the item\'s condition, then hit "Post." Free listings are highlighted separately so buyers can find them quickly, and they stay live for 30 days by default.',
    category: "selling",
    tags: ["posting", "free", "listing"],
  },
  {
    title: "How to reset your password",
    slug: "how-to-reset-your-password",
    content:
      "Go to the Login page and click \"Forgot Password.\" Enter the email address linked to your account and check your inbox for a reset link — it usually arrives within a minute. Follow the link to set a new password; for security, the link expires after 30 minutes.",
    category: "account",
    tags: ["password", "login", "security"],
  },
  {
    title: "What payment methods are accepted",
    slug: "what-payment-methods-are-accepted",
    content:
      "DealSphere supports EasyPaisa, JazzCash, direct bank transfer, and cash on delivery for eligible orders. You can add or update your preferred payment method anytime from Account Settings → Payments, and choose which one to use at checkout.",
    category: "payments",
    tags: ["payments", "easypaisa", "jazzcash", "billing"],
  },
  {
    title: "How to track your order",
    slug: "how-to-track-your-order",
    content:
      'Open "My Orders" from your dashboard and select the order you want to check. You\'ll see its current status — processing, shipped, or delivered — along with tracking details and an estimated delivery date. You\'ll also get a notification each time the status changes.',
    category: "orders",
    tags: ["orders", "tracking", "delivery"],
  },
  {
    title: "Tips to avoid scams",
    slug: "tips-to-avoid-scams",
    content:
      "Never share your OTP, password, or full card details with anyone — DealSphere staff will never ask for them. Whenever possible, meet sellers or buyers in a public place for in-person deals, and always inspect the product before paying. If a deal feels too good to be true or someone pressures you to pay outside the app, report it immediately from the listing page.",
    category: "safety",
    tags: ["scam", "safety", "otp", "tips"],
  },
  {
    title: "How to verify your account",
    slug: "how-to-verify-your-account",
    content:
      'Go to Account Settings → Verification and submit a valid CNIC or ID card along with a clear selfie. Verification usually completes within a few hours and adds a "Verified" badge to your profile, which builds trust with other buyers and sellers.',
    category: "account",
    tags: ["verification", "trust", "account"],
  },
  {
    title: "How to leave a review for a seller",
    slug: "how-to-leave-a-review-for-a-seller",
    content:
      'After your order is marked as delivered, open "My Orders," select the order, and tap "Leave a Review." Rate your experience out of 5 stars and add a short comment about the item and the seller\'s communication. Reviews help other buyers make informed decisions.',
    category: "buying",
    tags: ["reviews", "ratings", "buying"],
  },
  {
    title: "How to boost your listing for more visibility",
    slug: "how-to-boost-your-listing-for-more-visibility",
    content:
      'Open the listing from "My Listings" and tap "Boost." Choose a duration and budget, and your ad will appear higher in search results and category pages for that period. Boosted listings typically get significantly more views and messages from interested buyers.',
    category: "selling",
    tags: ["boost", "visibility", "selling"],
  },
  {
    title: "How to contact a seller",
    slug: "how-to-contact-a-seller",
    content:
      'Open the listing you are interested in and tap "Message Seller" to start a chat inside DealSphere. Keep all communication in the app so there is a record of your conversation, and never share your OTP or payment details in chat. If a seller becomes unresponsive or pushy, use the Report button on the listing.',
    category: "buying",
    tags: ["contact", "seller", "chat", "messaging"],
  },
];

const seed = async () => {
  const startTime = Date.now();

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB Atlas -> ${conn.connection.host}/${conn.connection.name}`);

    // Upsert by slug: safe to re-run, and existing view/vote counts are kept.
    // Only the articles collection is touched — categories are never read or written.
    const result = await articleModel.bulkWrite(
      articles.map((article) => ({
        updateOne: {
          filter: { slug: article.slug },
          update: { $set: article },
          upsert: true,
          setDefaultsOnInsert: true,
        },
      }))
    );
    console.log(`${result.upsertedCount} articles added, ${result.modifiedCount} updated`);

    console.log("\nArticles per category:");
    [...new Set(articles.map((a) => a.category))].forEach((slug) => {
      const count = articles.filter((a) => a.category === slug).length;
      console.log(`  - ${slug}: ${count}`);
    });

    const seconds = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nSeeding complete — articles are ready. (${seconds}s)`);
    console.log("You can now start the server and test:  GET /help/articles");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seed();