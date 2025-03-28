import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { Product } from '../models/ProductModel.js';
import { Cart } from '../models/CartItemModel.js';
import mongoose from 'mongoose';

import { User } from "../models/UserModel.js";
import { Coupon } from "../models/CouponModel.js";
import { calculateCartTotal } from "../utils/calculateCartTotal.js";

export const addToCart = [
    body('productId').isMongoId().withMessage('Invalid product ID format'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('selectedSize').optional().isString().withMessage('Invalid size format'),
    body('selectedColor').optional().isString().withMessage('Invalid color format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { productId, quantity, selectedSize, selectedColor, sessionId } = req.body;

            // Check if product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Check stock availability
            if (product.stock < quantity) {
                return res.status(400).json({ message: 'Insufficient stock available' });
            }

            // Validate selected size if applicable
            if (selectedSize && !product.sizes.some(size => size.size === selectedSize)) {
                return res.status(400).json({ message: 'Selected size is not available' });
            }

            // Validate selected color if applicable
            if (selectedColor && !product.colors.some(color => color.color === selectedColor)) {
                return res.status(400).json({ message: 'Selected color is not available' });
            }

            // Find or create cart for user/session
            let cart = await Cart.findOne({ sessionId });
            if (!cart) {
                cart = new Cart({
                    cartId: new mongoose.Types.ObjectId().toString(),
                    userId: req.user ? req.user.id : null, // Handle guest users
                    sessionId,
                    items: [],
                    subtotal: 0,
                    total: 0,
                    currency: product.currency,
                });
            }

            // Check if product already exists in cart
            const existingItem = cart.items.find(
                item =>
                    item.product.toString() === productId &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    product: productId,
                    quantity,
                    selectedSize,
                    selectedColor,
                });
            }

            // Update subtotal, tax, and total
            cart.subtotal = cart.items.reduce((sum, item) => sum + product.price * item.quantity, 0);
            cart.tax.taxAmount = cart.subtotal * (cart.tax.taxPercentage || 0) / 100;
            cart.total = cart.subtotal + cart.tax.taxAmount + (cart.shippingCost || 0);

            await cart.save();
            return res.status(200).json({ message: 'Product added to cart successfully', cart });
        } catch (error) {
            console.error('Error adding to cart:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
];

export const removeItemsFromCart = [
    body('cartId').isMongoId().withMessage('Invalid cart ID format'),
    body('productId').isMongoId().withMessage('Invalid product ID format'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    body('sessionId').optional().isString().withMessage('Invalid session ID format'),
    body('selectedSize').optional().isString().withMessage('Invalid size format'),
    body('selectedColor').optional().isString().withMessage('Invalid color format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { cartId, productId, userId, sessionId, selectedSize, selectedColor } = req.body;

            // Validate Cart Exists
            let cart = await Cart.findById(cartId);
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // Validate User Authorization
            if (userId && cart.userId && cart.userId.toString() !== userId) {
                return res.status(403).json({ message: 'You are not authorized to modify this cart' });
            }

            // Validate Empty Cart
            if (!cart.items.length) {
                return res.status(400).json({ message: 'The cart is already empty' });
            }

            // Validate Item Exists in Cart
            const itemIndex = cart.items.findIndex(
                item =>
                    item.product.toString() === productId &&
                    (!selectedSize || item.selectedSize === selectedSize) &&
                    (!selectedColor || item.selectedColor === selectedColor)
            );

            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Item not found in the cart' });
            }

            // Remove Item from Cart
            cart.items.splice(itemIndex, 1);

            // Validate Cart State
            if (cart.subtotal == null || cart.total == null || cart.currency == null) {
                return res.status(400).json({ message: 'Invalid cart state. Please review your cart.' });
            }

            // Recalculate Cart Totals
            cart.subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
            cart.tax.taxAmount = cart.subtotal * (cart.tax.taxPercentage || 0) / 100;
            cart.total = cart.subtotal + cart.tax.taxAmount + (cart.shippingCost || 0);

            // Ensure Positive Price Values
            if (cart.subtotal < 0 || cart.total < 0 || cart.tax.taxAmount < 0) {
                return res.status(400).json({ message: 'Invalid cart calculations. Please try again.' });
            }

            // Handle Discounts and Promotions
            if (cart.discounts) {
                // Revalidate Discounts if applicable
                cart.discounts.totalDiscount = Math.min(cart.subtotal * 0.1, cart.subtotal);
            }

            await cart.save();
            return res.status(200).json({ message: 'Item removed from cart successfully', cart });
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return res.status(500).json({ message: 'Internal server error. Please try again later.' });
        }
    }
];

export const getAllCartProducts = [
    query('cartId').isMongoId().withMessage('Invalid cart ID format'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    query('sessionId').optional().isString().withMessage('Invalid session ID format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { cartId, userId, sessionId } = req.query;

            // Validate Cart Exists
            let cart = await Cart.findById(cartId).populate({
                path: 'items',
                populate: { path: 'product', select: 'name price images stock' }
            });

            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // Validate User Authorization
            if (userId && cart.userId && cart.userId.toString() !== userId) {
                return res.status(403).json({ message: 'You are not authorized to access this cart' });
            }

            // Validate Empty Cart
            if (!cart.items.length) {
                return res.status(200).json({ message: 'The cart is empty', cart });
            }

            // Validate Cart State
            if (cart.subtotal == null || cart.total == null || cart.currency == null) {
                return res.status(400).json({ message: 'Invalid cart state. Please review your cart.' });
            }

            if (cart.subtotal < 0 || cart.total < 0 || cart.tax?.taxAmount < 0) {
                return res.status(400).json({ message: 'Invalid cart calculations. Please try again.' });
            }

            // Ensure Valid Item References
            if (cart.items.some(item => !item.product)) {
                return res.status(400).json({ message: 'Invalid item references found in cart' });
            }

            return res.status(200).json({ message: 'Cart retrieved successfully', cart });
        } catch (error) {
            console.error('Error fetching cart:', error);
            return res.status(500).json({ message: 'Internal server error. Please try again later.' });
        }
    }
];




// I will update below code
export const updateQuantity = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { quantity } = req.body;
        const user = req.user;
        const existingItem = user.cartItems.findById(productId);

        if (existingItem) {
            if (existingItem.quantity == 0) {
                // lets remove this item from cart
                res.status(400).json({ message: 'Cannot update to zero quantity' });
                user.cartItems = user.cartItems.filter(item => item.id !== productId);
                await user.save();
                return res.json(user.cartItems);
            }
            // handling else case where quantity is not equals to zero
            existingItem.quantity = quantity;
            await user.save();
            return res.json(user.cartItems);
        } else {
            res.status(404).json({ message: "Product not found" });
        }

    } catch (err) {
        console.log('Error in updateQuantity', err.message);
        res.status(500).json({ message: err.message });
    }
}

export const applyPromoCode = async (req, res) => {
    try {
        const { promoCode } = req.body;
        const user = req.user;

        // check if user has a cart
        const cart = await Cart.findOne({ userId: user._id }).populate('items.product');

        if (cart.length === 0) {
            return res.status(400).json({ message: 'No items in cart' });
        }

        // find the promo code
        const coupon = await Coupon.findOne({ code: promoCode });
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid promo code' });
        }

        // let's check if the coupon is active + coupon is not lies with the specified range
        const currentDate = new Date();
        if (!coupon.isActive || now < coupon.startDate || now > coupon.endDate) {
            return res.status(400).json({ message: 'Promo code is not active or out of range' });
        }

        // let's check for the minimum purchase amount for apply the coupon
        const cartTotal = Cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

        if (cartTotal < coupon.minimumPurchaseAmount) {
            return res.status(400).json({ message: `Minimum purchase amount is ${coupon.minimumPurchaseAmount}` });
        }

        // let's check for any product/category restrictions for apply the coupon
        const productIds = cart.items.map((item) => item.product._id.toString());
        const productCategories = cart.items.map(item => item.product.category);

        // ensure coupon is applied only to allowed products/categories only
        const isEligibleForDiscount = coupon.appliedTo.products.length === 0 || coupon.appliedTo.products.some(id => productIds.includes(id)) || coupon.appliedTo.categories.some(category => productCategories.includes(category))

        if (!isEligibleForDiscount) {
            return res.status(400).json({
                message: 'This coupon is not applicable to the products available in your cart'
            })
        }

        // ensure [given -> products/categories] are not excluded
        const isExcluded = coupon.exclusions.products.some(id => productIds.includes(id)) || coupon.exclusions.categories.some(category => productCategories.includes(category));

        if (isExcluded) {
            return res.status(400).json({ message: 'Coupon cannot be applied to some products in your cart' });
        }

        // lets validate usage limits 
        if (coupon.redumption.timeUsed >= coupon.usageLimit.total) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        const userRedumptions = coupon.redumption.userRedumptions.get(user._id.toString()) || 0;

        if (userRedumptions >= coupon.usageLimit.perUser) {
            return res.status(400).json({ message: 'You have reached the usage limit for this promo code' });
        }

        // lets calculate the discount
        let discountAmount = 0;
        if (coupon.discountType === "Percentage") {
            discountAmount = (cartTotal * coupondiscounAmount) / 100;
        } else if (coupon.discountType === 'Fixed') {
            discountAmount = coupon.discountAmount;
        }

        // Ensure that discountAmount not exceeds the cartTotal
        discountAmount = Math.min(discountAmount, cartTotal);

        // lets update the cart total with the new discountAmount
        const finalTotal = cartTotal - discountAmount;
        cart.discountAmount = discountAmount;
        cart.totalPrice = finalTotal;
        await cart.save();

        // Update coupon usage
        coupon.redumption.timeUsed += 1;
        coupon.redumption.userRedumptions.set(user._id.toString(), userRedumptions + 1);
        await coupon.save();

        return res.json({
            message: 'Promo code applied successfully',
            cart: {
                originalTotal: cartTotal,
                discount: discountAmount,
                finalTotal: finalTotal,
                promoCodeApplied: promoCode,
            },
        });

    } catch (err) {
        console.log('Error in applyPromoCode', err.message);
        res.status(500).json({ message: err.message });
    }
}

export const saveCartForFutureUse = async (req, res) => {
    try {
        const user = req.user;
        const { items, totalPrice, coupon } = req.body;

        // find if user already has a cart
        let cart = await Cart.findOne({ userId: user._id });

        if (!cart) {

        }
    } catch (err) {
        console.log('Error in saveCartForFutureUse', err.message);
        res.status(500).json({ message: err.message });
    }
}