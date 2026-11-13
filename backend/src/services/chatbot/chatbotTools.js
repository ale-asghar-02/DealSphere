/**
 * Ye file sirf FUNCTION DEFINITIONS/SCHEMA rakhti hai (Gemini ko batane ke liye
 * konse functions available hain aur unke parameters kya hain).
 * Actual execution logic chatbotFunctions.js mein hai.
 *
 * publicTools -> guest + logged-in user dono access kar sakte hain
 * privateTools -> sirf logged-in user (userId session se milega, AI se kabhi nahi)
 */

const publicFunctionDeclarations = [
  {
    name: "search_products",
    description:
      "Search/filter products listed on the marketplace by category, price range, or featured status.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "e.g. bike, mobile, electronics" },
        minPrice: { type: "number", description: "Minimum price filter" },
        maxPrice: { type: "number", description: "Maximum price filter" },
        featured: { type: "boolean", description: "Only featured/promoted products" },
        keyword: { type: "string", description: "Free text search keyword" },
        limit: { type: "number", description: "Max results to return, default 10" },
      },
    },
  },
  {
    name: "search_advertisements",
    description:
      "Search/filter advertisements listed on the marketplace by category, price range, or featured status.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        minPrice: { type: "number" },
        maxPrice: { type: "number" },
        featured: { type: "boolean" },
        keyword: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_listing_details",
    description:
      "Get full details and shareable link of a single product or advertisement by its ID.",
    parameters: {
      type: "object",
      properties: {
        listingId: { type: "string", description: "The product or advertisement ID" },
        listingType: {
          type: "string",
          enum: ["product", "advertisement"],
          description: "Whether the ID belongs to a product or an advertisement",
        },
      },
      required: ["listingId", "listingType"],
    },
  },
  {
    name: "get_categories",
    description: "Get the list of all available categories on the marketplace.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_subscription_plans",
    description: "Get available subscription plans and their pricing.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_feature_plans",
    description: "Get available 'featured ad' plans and their pricing.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_announcements",
    description: "Get latest site announcements/updates.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_site_link",
    description:
      "Get the direct URL/link of a general (non-account) page on the website: home, deals, services, contact, help center, for-businesses (DealSphere for Businesses), privacy policy, terms of use, advertisement listing, product listing, upgrade plan, design pricing (AI Design Studio pricing), login, register, or reset password.",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: [
            "home",
            "deals",
            "services",
            "contact",
            "help-center",
            "for-businesses",
            "privacy-policy",
            "terms-of-use",
            "advertisement",
            "product",
            "upgrade-plan",
            "design-pricing",
            "login",
            "register",
            "reset-password",
          ],
          description: "Which page's link is needed",
        },
      },
      required: ["page"],
    },
  },
];

const privateFunctionDeclarations = [
  {
    name: "get_user_balance",
    description: "Get the logged-in user's current wallet balance. Requires login.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_user_transactions",
    description: "Get the logged-in user's transaction history. Requires login.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results, default 10" },
      },
    },
  },
  {
    name: "get_withdrawals",
    description: "Get the logged-in user's withdrawal requests/status. Requires login.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_user_orders",
    description: "Get the logged-in user's orders. Requires login.",
    parameters: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "get_feature_orders",
    description: "Get the logged-in user's featured-ad orders. Requires login.",
    parameters: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "get_contact_requests",
    description:
      "Get how many people contacted the logged-in user's ad(s). Requires login.",
    parameters: {
      type: "object",
      properties: {
        adId: { type: "string", description: "Optional, specific ad ID" },
      },
    },
  },
  {
    name: "get_reports",
    description: "Get reports made by or against the logged-in user. Requires login.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_cart",
    description: "Get the logged-in user's cart items. Requires login.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_wishlist",
    description: "Get the logged-in user's wishlist items. Requires login.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_notifications",
    description: "Get the logged-in user's recent notifications. Requires login.",
    parameters: {
      type: "object",
      properties: { limit: { type: "number" } },
    },
  },
  {
    name: "get_account_link",
    description:
      "Get the direct URL/link of a logged-in user's account page: dashboard, create ads, create product, design studio (AI design tool), chat, cart, checkout, or wishlist. Requires login.",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: [
            "dashboard",
            "create-ads",
            "create-product",
            "design-studio",
            "chat",
            "cart",
            "checkout",
            "wishlist",
          ],
          description: "Which account page's link is needed",
        },
      },
      required: ["page"],
    },
  },
];

/**
 * Guest ko sirf public tools milte hain.
 * Logged-in user ko public + private dono milte hain.
 */
function getToolsForUser(isLoggedIn) {
  const declarations = isLoggedIn
    ? [...publicFunctionDeclarations, ...privateFunctionDeclarations]
    : publicFunctionDeclarations;

  return [{ functionDeclarations: declarations }];
}

module.exports = {
  publicFunctionDeclarations,
  privateFunctionDeclarations,
  getToolsForUser,
};