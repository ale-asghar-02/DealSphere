const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const AppError = require("../utils/AppError");

// ────────────────────────────────
// ADD TO CART
// body: { productId, quantity }
// ────────────────────────────────
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return next(new AppError("Product id is required", 400));
    }

    if (
      quantity !== undefined &&
      (!Number.isInteger(Number(quantity)) || Number(quantity) < 1)
    ) {
      return next(new AppError("Quantity must be a whole number of at least 1", 400));
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // seller apna khud ka product cart me add nahi kar sakta
    if (product.seller.toString() === userId) {
      return next(new AppError("You cannot add your own product to the cart", 400));
    }

    if (
      product.isBannedProduct ||
      product.moderationHidden ||
      product.status !== "active"
    ) {
      return next(new AppError("This product is currently unavailable", 400));
    }

    const qty = quantity === undefined ? 1 : Number(quantity);

    let cart = await cartModel.findOne({ user: userId });

    const existingItem = cart?.items.find(
      (item) => item.product.toString() === productId,
    );

    // cart me jitni quantity pehle se hai, usay mila kar stock se zyada na ho
    const totalQty = (existingItem?.quantity || 0) + qty;
    if (product.stock < totalQty) {
      return next(
        new AppError(
          existingItem
            ? `Only ${product.stock} item(s) available, and ${existingItem.quantity} already in your cart`
            : `Only ${product.stock} item(s) left in stock`,
          400,
        ),
      );
    }

    // create a new cart if the user doesn't have one yet
    if (!cart) {
      cart = await cartModel.create({
        user: userId,
        items: [{ product: product._id, quantity: qty, price: product.price }],
      });
    } else if (existingItem) {
      // item already exists in cart, just increase the quantity
      existingItem.quantity += qty;
    } else {
      cart.items.push({
        product: product._id,
        quantity: qty,
        price: product.price,
      });
    }

    cart.calculateTotal();
    await cart.save();

    // product ki poori details (images, title, price, etc.) response me shamil karne k liye
    await cart.populate("items.product");

    res.status(200).json({
      status: "success",
      message: "Product added to cart successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────
// GET CART
// Cart se wo items khud nikal deta hai jo checkout me kabhi nahi chal sakte:
// user ke apne products (pehle add ho chuke hon) aur delete ho chuke products.
// ────────────────────────────────
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await cartModel.findOne({ user: userId }).populate({
      path: "items.product",
      populate: [
        { path: "category", select: "name slug" },
        { path: "subCategory", select: "name slug" },
        // sirf ban/suspend check ke liye, reason buyer ko nahi jani chahiye
        { path: "seller", select: "moderation.isBanned moderation.suspendedUntil" },
      ],
    });

    if (!cart) {
      return res.status(200).json({
        status: "success",
        message: "Cart is empty",
        data: { items: [], totalPrice: 0 },
      });
    }

    let removedOwnCount = 0;
    const validItems = cart.items.filter((item) => {
      if (!item.product) return false; // product delete ho chuka hai

      // seller ab populated hai, isliye ._id use kiya
      if (item.product.seller?._id?.toString() === userId) {
        removedOwnCount += 1;
        return false; // apna hi product
      }
      return true;
    });

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      cart.calculateTotal();
      await cart.save();
    }

    // har item ka status check (null = purchase ho sakta hai)
    const now = new Date();
    const items = cart.items.map((item) => {
      const p = item.product;
      const mod = p.seller?.moderation;
      let unavailableReason = null;

      if (mod?.isBanned || (mod?.suspendedUntil && mod.suspendedUntil > now)) {
        unavailableReason = "seller_unavailable";
      } else if (p.isBannedProduct || p.moderationHidden) {
        unavailableReason = "hidden";
      } else if (p.status !== "active") {
        unavailableReason = p.status; // sold, soldout, expired, etc.
      } else if (p.stock < 1) {
        unavailableReason = "out_of_stock";
      } else if (p.stock < item.quantity) {
        unavailableReason = "insufficient_stock";
      }

      return { ...item.toObject(), unavailableReason };
    });

    const cartObj = cart.toObject();
    cartObj.items = items;

    // total sirf available items ka
    cartObj.payableTotal = items
      .filter((i) => !i.unavailableReason)
      .reduce((sum, i) => sum + i.product.price * i.quantity, 0);

    res.status(200).json({
      status: "success",
      removedOwnCount,
      hasUnavailableItems: items.some((i) => i.unavailableReason),
      data: cartObj,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────
// UPDATE CART ITEM QUANTITY
// params: productId | body: { quantity }
// ────────────────────────────────
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return next(
        new AppError("Please provide a valid quantity (minimum 1)", 400),
      );
    }

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (!item) {
      return next(new AppError("This product is not in your cart", 404));
    }

    item.quantity = Number(quantity);

    cart.calculateTotal();
    await cart.save();

    // product ki poori details (images, title, price, etc.) response me shamil karne k liye
    await cart.populate("items.product");

    res.status(200).json({
      status: "success",
      message: "Cart item updated successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────
// REMOVE SINGLE ITEM FROM CART
// params: productId
// ────────────────────────────────
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId,
    );

    if (!itemExists) {
      return next(new AppError("This product is not in your cart", 404));
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    cart.calculateTotal();
    await cart.save();

    // product ki poori details (images, title, price, etc.) response me shamil karne k liye
    await cart.populate("items.product");

    res.status(200).json({
      status: "success",
      message: "Product removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────
// CLEAR ENTIRE CART
// ────────────────────────────────
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(200).json({
      status: "success",
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};