import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import mongoose from 'mongoose';
import { Product } from '../models/ProductModel.js';
import { Cart } from '../models/CartModel.js';
import { Item } from "../models/CartItemModel.js";
import { User } from "../models/UserModel.js";
import { Coupon } from '../models/CouponsModel.js';
import { Discount } from "../models/DiscountModel.js";
import { calculateCartTotal } from "../utils/calculateCartTotal.js";
import { UserShippingAddress } from '../models/UserShippingAddressModel.js';
import { UserPaymentMethod } from '../models/UserPaymentModel.js';


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
            const { productId, productImages = [], quantity, selectedSize, selectedColor, cartId, userId } = req.body;

            const productQuantity = Number(quantity);

            const product = await Product.findOne({ _id: productId });
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product.stock == 0) {
                return res.status(400).json({ message: 'Product is out of stock' });
            }

            if (product.stock < productQuantity) {
                return res.status(400).json({ message: `We only have available stock of ${product.stock} quantity.` });
            }

            if (!productImages || productImages.length === 0) {
                return res.status(404).json({ message: 'Please add product images first' });
            }

            for (let image of productImages) {
                if (!image.url || typeof image.url !== "string") {
                    return res.status(400).json({ error: "Each image must have a valid 'url'" });
                }

                if (image.alt && typeof image.alt !== "string") {
                    return res.status(400).json({ error: "'alt' must be in a string format if provided" });
                }
            }

            if (selectedSize && !product.sizes.some(size => size.size === selectedSize)) {
                return res.status(400).json({ message: 'Selected size is not available' });
            }

            if (selectedColor && !product.colors.some(color => color.color === selectedColor)) {
                return res.status(400).json({ message: 'Selected color is not available' });
            }

            let cart = await Cart.findOne({ userId }).populate('items');
            if (!cart) {
                cart = new Cart({
                    userId: userId,
                    items: [],
                    itemSubtotal: 0,
                    finalBillAmount: 0,
                    currency: product.currency,
                });
            }
            // Check if product already exists in cart
            const existingItem = cart.items.find(
                item => {
                    const sameProduct = item.productId.toString() === productId.toString();

                    const sameSize = (item.attributes?.size || null) === (selectedSize || null);

                    const sameColor = (item.attributes?.color || null) === (selectedColor || null);

                    return sameProduct && sameSize && sameColor;
                });

            if (existingItem) {
                existingItem.quantity += productQuantity;
                existingItem.totalPrice = existingItem.quantity * existingItem.price;
                await existingItem.save();
            } else {
                const newItem = new Item({
                    productId,
                    quantity: productQuantity,
                    price: product.price,
                    totalPrice: product.price * productQuantity,
                    productName: product.name,
                    attributes: { color: selectedColor, size: selectedSize },
                    availability: { inStock: product.stock > 0, stockQuantity: product.stock }
                });
                await newItem.save();
                cart.items.push(newItem._id);
            }
            await cart.save();

            // Populate items again to ensure all are documents
            await cart.populate('items');

            cart.itemSubtotal = cart.items && cart.items.reduce((sum, item) => {
                const price = Number(item.totalPrice) || 0;
                return sum + price;
            }, 0);

            // cart.tax.taxAmount = cart?.subtotal * (cart?.tax?.taxPercentage || 0) / 100;
            // cart.total = cart?.subtotal + cart?.tax.taxAmount + (cart?.shippingCost || 0);
            // console.log('cart', cart);

            // now push this to user schema
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { cart: cart._id } },
                { new: true }
            );

            await cart.save();
            product.stock -= productQuantity;
            await product.save();
            return res.status(200).json({ message: 'Product added to cart successfully', cart });
        } catch (error) {
            console.error('Error adding to cart:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
];

export const removeItemsFromCart = [
    // body('cartId').isMongoId().withMessage('Invalid cart ID format'),
    body('productId').isMongoId().withMessage('Invalid product ID format'),
    body('itemId').isMongoId().withMessage('Invalid item ID format'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    // body('sessionId').optional().isString().withMessage('Invalid session ID format'),
    body('selectedSize').optional().isString().withMessage('Invalid size format'),
    body('selectedColor').optional().isString().withMessage('Invalid color format'),
    async (req, res) => {
        const errors = validationResult(
            req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { productId, itemId, userId, selectedSize, selectedColor } = req.body;

            // Validate Cart Exists
            let cart = await Cart.findOne({ userId }).populate('items');
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // Validate User Authorization
            if (userId && cart.userId && cart.userId.toString() !== userId) {
                return res.status(403).json({ message: 'You are not authorized to modify this cart' });
            }

            if (!itemId) {
                return res.status(400).json({ message: 'item id not found that you want to delete.' });
            }

            // Validate Empty Cart
            if (!cart.items.length) {
                return res.status(400).json({ message: 'The cart is already empty' });
            }

            // Validate Item Exists in Cart
            const itemIndex = cart.items.findIndex(
                item =>
                    item => {
                        const sameProduct = item.productId.toString() === productId.toString();

                        const sameSize = (item.attributes?.size || null) === (selectedSize || null);

                        const sameColor = (item.attributes?.color || null) === (selectedColor || null);

                        return sameProduct && sameSize && sameColor;
                    }
            );

            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Item not found in the cart' });
            }

            // Validate Cart State
            // if (cart.itemSubtotal == null || cart.finalBillAmount == null || cart.currency == null) {
            //     return res.status(400).json({ message: 'Invalid cart state. Please review your cart.' });
            // }

            if (cart.itemSubtotal == null || cart.finalBillAmount == null) {
                return res.status(400).json({ message: 'Invalid cart state. Please review your cart.' });
            }

            // Ensure Positive Price Values
            if (cart.subtotal < 0 || cart.total < 0 || cart.tax.taxAmount < 0) {
                return res.status(400).json({ message: 'Invalid cart calculations. Please try again.' });
            }

            // Remove Item from Cart
            cart.items.splice(itemIndex, 1);

            await cart.populate('items');

            // Recalculate Cart Totals
            cart.itemSubtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || (item.price * item.quantity)), 0);
            // cart.tax.taxAmount = cart.subtotal * (cart.tax.taxPercentage || 0) / 100;
            // cart.total = cart.subtotal + cart.tax.taxAmount + (cart.shippingCost || 0);

            // Handle Discounts and Promotions
            // if (cart.discounts) {
            //     // Revalidate Discounts if applicable
            //     cart.discounts.totalDiscount = Math.min(cart.subtotal * 0.1, cart.subtotal);
            // }

            const itemObjectId = new mongoose.Types.ObjectId(itemId);
            await Cart.updateOne(
                { _id: cart._id },
                { $pull: { items: itemObjectId } }
            );

            await Item.findByIdAndDelete(itemObjectId);

            await cart.save();
            return res.status(200).json({ message: 'Item removed from cart successfully', cart });
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return res.status(500).json({ message: 'Internal server error. Please try again later.' });
        }
    }
];

export const getAllCartProducts = [
    // query('cartId').isMongoId().withMessage('Invalid cart ID format'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    // query('sessionId').optional().isString().withMessage('Invalid session ID format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { userId } = req.query;

            // Validate Cart Exists
            // let cart = await Cart.findOne({ userId }).populate({
            //     path: 'items',
            //     // populate: { path: 'Product', select: 'name price images stock' }
            // });

            let cart = await Cart.findOne({ userId }).populate('items');

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
            // if (cart.subtotal == null || cart.total == null || cart.currency == null) {
            //     return res.status(400).json({ message: 'Invalid cart state. Please review your cart.' });
            // }

            if (cart.itemSubtotal == null || cart.finalBillAmount == null) {
                return res.status(400).json({ message: 'Invalid cart state. Please review your cart.' });
            }

            // if (cart.itemSubtotal < 0 || cart.finalBillAmount < 0 || cart.tax?.taxAmount < 0) {
            //     return res.status(400).json({ message: 'Invalid cart calculations. Please try again.' });
            // }

            if (cart.itemSubtotal < 0 || cart.finalBillAmount < 0) {
                return res.status(400).json({ message: 'Invalid cart calculations. Please try again.' });
            }


            // Ensure Valid Item References
            // if (cart.items.some(item => !item.product)) {
            //     return res.status(400).json({ message: 'Invalid item references found in cart' });
            // }

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

// implementation of other cart related apis

// Update Cart API
export const updateCart = [
    // body('sessionId').optional().isString().withMessage('Session ID must be a string'),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('total').optional().isNumeric().withMessage('Total must be a number'),
    body('currency').optional().isString().withMessage('Currency must be a string'),
    body('userShippingAddress').optional().isObject().withMessage('Shipping address must be an object'),
    body('userPaymentMethod').optional().isString().withMessage('Payment method must be a string'),
    body('promotions').optional().isArray().withMessage('Promotions must be an array'),
    body('loyaltyPoints').optional().isNumeric().withMessage('Loyalty points must be a number'),
    body('cartNotes').optional().isString().withMessage('Cart notes must be a string'),
    body('isGift').optional().isBoolean().withMessage('isGift must be a boolean'),
    body('savedForLater').optional().isBoolean().withMessage('savedForLater must be a boolean'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { cartId } = req.params;
            const updateData = req.body;

            // Validate that cartId exists
            const cart = await Cart.findOne({ cartId });
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // Prevent update of cartId and userId
            if (updateData.cartId || updateData.userId) {
                return res.status(400).json({ message: 'cartId and userId cannot be updated' });
            }

            // Updating only allowed fields
            const updatedCart = await Cart.findOneAndUpdate(
                { cartId },
                {
                    ...updateData,
                    updatedAt: new Date()  // Update the updatedAt field
                },
                { new: true }
            );

            res.json(updatedCart);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error' });
        }
    }
];

// create discount first before applying
export const createDiscount = [
    body("code").trim().isString().notEmpty().withMessage("Discount code is required."),
    body("discountType").isIn(["percentage", "flat"]).withMessage("Invalid discount type."),
    body("discountValue")
        .isNumeric()
        .custom((value, { req }) => {
            if (req.body.discountType === "percentage" && (value <= 0 || value > 100)) {
                throw new Error("Percentage discount must be between 1 and 100.");
            }
            if (req.body.discountType === "flat" && value <= 0) {
                throw new Error("Flat discount must be greater than 0.");
            }
            return true;
        }),
    body("minPurchaseAmount").optional().isNumeric().withMessage("Min purchase must be a number."),
    body("maxUsage").isInt({ gt: 0 }).withMessage("Max usage must be a positive integer."),
    body("validFrom").isISO8601().withMessage("Invalid start date format."),
    body("validUntil").isISO8601().withMessage("Invalid end date format."),
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { code, discountType, discountValue, minPurchaseAmount, maxUsage, validFrom, validUntil } = req.body;

            // Ensure valid date range
            if (new Date(validFrom) >= new Date(validUntil)) {
                return res.status(400).json({ success: false, message: "ValidUntil must be after ValidFrom." });
            }

            // Check if discount code already exists
            const existingDiscount = await Discount.findOne({ code });
            if (existingDiscount) {
                return res.status(400).json({ success: false, message: "Discount code already exists." });
            }

            // Create new discount
            const discount = new Discount({
                code,
                discountType,
                discountValue,
                minPurchaseAmount,
                maxUsage,
                validFrom,
                validUntil,
            });

            await discount.save();

            res.status(201).json({ success: true, message: "Discount created successfully!", discount });
        } catch (error) {
            console.error("Error creating discount:", error);
            res.status(500).json({ success: false, message: "Internal Server Error. Please try again later." });
        }
    }
];

export const applyDiscount = [
    body("code").trim().notEmpty().withMessage("Discount code is required."),
    body("cartTotal").isNumeric().withMessage("Cart total must be a number."),

    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { code, cartTotal } = req.body;
            const userId = req.user._id;

            // Check if the discount exists
            const discount = await Discount.findOne({ code });
            if (!discount) {
                return res.status(404).json({ success: false, message: "Invalid discount code." });
            }

            // Check if discount is within the valid date range
            const currentDate = new Date();
            if (currentDate < discount.validFrom || currentDate > discount.validUntil) {
                return res.status(400).json({ success: false, message: "Discount code is expired or not active yet." });
            }

            // Check if the discount has reached its max usage
            const usageCount = await Cart.countDocuments({ "discountsApplied.discountId": discount._id });
            if (usageCount >= discount.maxUsage) {
                return res.status(400).json({ success: false, message: "This discount code has reached its maximum usage limit." });
            }

            // Ensure cart total meets minimum purchase amount
            if (cartTotal < discount.minPurchaseAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum purchase of ₹${discount.minPurchaseAmount} required to use this discount.`,
                });
            }

            // Calculate discount amount
            let discountAmount = 0;
            if (discount.discountType === "percentage") {
                discountAmount = (cartTotal * discount.discountValue) / 100;
            } else {
                discountAmount = discount.discountValue;
            }

            // Apply discount to the cart
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.status(404).json({ success: false, message: "Cart not found." });
            }

            cart.discounts.totalDiscount = discountAmount;
            cart.discounts.discountsApplied.push({
                discountId: discount._id,
                description: `Applied ${discount.code} - ₹${discountAmount} off`,
            });

            await cart.save();

            res.status(200).json({
                success: true,
                message: "Discount applied successfully!",
                totalDiscount: discountAmount,
                updatedCart: cart,
            });
        } catch (error) {
            console.error("Error applying discount:", error);
            res.status(500).json({ success: false, message: "Internal Server Error. Please try again later." });
        }
    }
];

// create tax first before applying 
export const applyTax = async (req, res) => {
    try {
        const { cartId, taxPercentage } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.tax.taxPercentage = taxPercentage;
        cart.tax.taxAmount = cart.subtotal * (taxPercentage / 100);

        cart.total = cart.subtotal - cart.discounts.totalDiscount + cart.tax.taxAmount + cart.shippingCost;

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// shipping_address includes: email, firstName, lastName, phone, address, city, state, zip_code, country, 

export const setUserShippingAddress = [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("addressLine1").trim().notEmpty().withMessage("Address Line 1 is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("postalCode").trim().notEmpty().withMessage("Postal Code is required"),
    body("country").trim().notEmpty().withMessage("Country is required"),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Invalid phone number format"),
    body("isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),

    async (req, res) => {
        try {
            // Validate request body
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { fullName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault, userId } = req.body;
            // const userId = req.user.id; // Extracted from JWT in verifyToken middleware

            if (!userId) {
                return res.status(400).json({ success: false, message: 'please provide userId' })
            }

            // If isDefault is true, reset other addresses' isDefault to false
            if (isDefault) {
                await UserShippingAddress.updateMany({ userId }, { isDefault: false });
            }

            const newAddress = new UserShippingAddress({
                userId,
                fullName,
                addressLine1,
                addressLine2,
                city,
                state,
                postalCode,
                country,
                phone,
                isDefault: isDefault || false,
            });

            

            await newAddress.save();

            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { addresses: newAddress._id } },
                { new: true }
            );

            const cart = await Cart.findOne({ userId });

            if (cart) {
                cart.userShippingAddress = newAddress._id;
                await cart.save();
            }


            return res.status(201).json({ success: true, message: "Address added successfully", data: newAddress });
        } catch (error) {
            console.error("Error adding shipping address:", error);
            return res.status(500).json({ success: false, message: "Error occur while setting shipping address." });
        }
    }
]

export const getUserShippingAddress = async (req, res) => {
    try {
        // const userId = req.user.id;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId not found!!'
            })
        }

        const addresses = await UserShippingAddress.find({ userId }).sort({ isDefault: -1 });

        if (!addresses.length) {
            return res.status(404).json({ success: false, message: "No shipping addresses found" });
        }

        return res.status(200).json({ success: true, data: addresses });
    } catch (error) {
        console.error("Error fetching shipping addresses:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export const setUserPaymentAddress = [
    body("paymentMethodId").trim().notEmpty().withMessage("Payment method ID is required"),
    body("cardType").isIn(["Visa", "MasterCard", "Amex", "Discover"]).withMessage("Invalid card type"),
    body("cardLast4Digits").isLength({ min: 4, max: 4 }).withMessage("Card last 4 digits must be exactly 4 digits"),
    body("expirationDate").isISO8601().withMessage("Invalid expiration date"),
    body("cardHolderName").trim().notEmpty().withMessage("Cardholder name is required"),

    // Billing Address Validation
    body("billingAddress.fullName").trim().notEmpty().withMessage("Billing full name is required"),
    body("billingAddress.phone").isMobilePhone().withMessage("Invalid phone number format"),
    body("billingAddress.addressLine1").trim().notEmpty().withMessage("Billing address line 1 is required"),
    body("billingAddress.city").trim().notEmpty().withMessage("Billing city is required"),
    body("billingAddress.state").trim().notEmpty().withMessage("Billing state is required"),
    body("billingAddress.postalCode").trim().notEmpty().withMessage("Billing postal code is required"),
    body("billingAddress.country").trim().notEmpty().withMessage("Billing country is required"),
    body("billingAddress.paymentMethod").isIn(["card", "paypal", "upi", "crypto"]).withMessage("Invalid payment method"),
    body("billingAddress.isDefault").optional().isBoolean().withMessage("isDefault must be a boolean"),

    async (req, res) => {
        try {
            // Validate request body
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const {
                paymentMethodId,
                cardType,
                cardLast4Digits,
                expirationDate,
                cardHolderName,
                billingAddress,
            } = req.body;

            const userId = req.user.id; // Extracted from JWT in verifyToken middleware

            // If isDefault is true, reset other addresses' isDefault to false
            if (billingAddress.isDefault) {
                await UserPaymentMethod.updateMany({ userId }, { "billingAddress.isDefault": false });
            }

            const newPaymentMethod = new UserPaymentMethod({
                userId,
                paymentMethodId,
                cardType,
                cardLast4Digits,
                expirationDate,
                cardHolderName,
                billingAddress,
            });

            await newPaymentMethod.save();
            return res.status(201).json({ success: true, message: "Payment method added successfully", data: newPaymentMethod });
        } catch (error) {
            console.error("Error adding payment method:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }
];

export const getUserPaymentAddress = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from JWT in verifyToken middleware
        const paymentMethods = await UserPaymentMethod.find({ userId }).sort({ "billingAddress.isDefault": -1 });

        if (!paymentMethods.length) {
            return res.status(404).json({ success: false, message: "No payment methods found" });
        }

        return res.status(200).json({ success: true, data: paymentMethods });
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const setShipping = async (req, res) => {
    try {
        const { cartId, shippingCost, userShippingAddress } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.shippingCost = shippingCost;
        cart.userShippingAddress = userShippingAddress;

        cart.total = cart.subtotal - cart.discounts.totalDiscount + cart.tax.taxAmount + shippingCost;

        await cart.save();
        res.json(cart); 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setPayment = async (req, res) => {
    try {
        const { cartId, userPaymentMethod } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.userPaymentMethod = userPaymentMethod;

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const applyPromotions = async (req, res) => {
    try {
        const { cartId, promotionId, description } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.promotions.push({ promotionId, description, applied: true });

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const useLoyalityPoints = async (req, res) => {
    try {
        const { cartId, points } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.loyaltyPoints.redeemedPoints = points;
        cart.total -= points; // Reduce total price

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markGift = async (req, res) => {
    try {
        const { cartId, isGift } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.isGift = isGift;

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const saveForLater = async (req, res) => {
    try {
        const { cartId } = req.body;

        let cart = await Cart.findById(cartId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.savedForLater = true;

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};