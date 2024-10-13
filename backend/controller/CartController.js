import { Product } from "../models/ProductModel.js";
import { User } from "../models/UserModel.js";
import { Cart } from "../models/CartModel.js";
import { Coupon } from "../models/CouponModel.js";
import { calculateCartTotal } from "../utils/calculateCartTotal.js";

export const addToCart = async (req, res) => {
    try {
        const { productId, userId } = req.body;

        let cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            cart = new Cart({
                cartId: generateCartId(),
                userId,
                sessionId: req.sessionId || null,
                items: [],
                subtotal: 0,
                total: 0,
                currency: 'USD'
            });
            await cart.save();
        }
        // fetch product details
        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(400).json({ message: 'Product not found' });
        }
        // check if product is already present in the cart .

        const existingCartItem = cart.items.find(item => item.productId === productId);

        if (existingCartItem) {
            existingCartItem.quantity++;
        } else {
            // add the product to the cart
            cart.items.push({
                productId,
                quantity: 1,
            });
        }

        // re-calculate the total price of the cart
        cart.subtotal = calculateCartTotal(cart.items);
        cart.total = calculateCartTotal(cart.items);

        cart.savedForLater = true;
        await cart.save();

        // save the cart to the database
        res.status(200).json({ message: `Product added to the cart, ${cart}` });
    } catch (err) {
        console.log("Error in addToCart controller", err.message);
        res.status(500).json({ message: err.message });
    }
}

export const removeFromCart = async (req, res) => {
    try {
        const { productId, userId } = req.body;

        // issue: we can even fatch only those data which is required 
        let cart = await Cart.findOne({ userId }).populate('items');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        } else {
            // cart.items = cart.items.filter((item) => item.id === productId);

            // delete item directly form database entry
            let cart = await Cart.findOneAndUpdate(
                { userId, "items.productId": productId },
                { $pull: { items: { productId: productId } } },
                { new: true }
            )
            //  cart.total = calculateCartTotal(cart.items);

            // instead of calculating it again and again just subtract that particular item price according to the quantity of that item added to the cart
            const product = await Product.findById(productId);
            if (product) {
                cart.subtotal -= product.price * cart.items.find(item => item.productId === productId).quantity;

                cart.total -= product.price * cart.items.find(item => item.productId === productId).quantity;
            }
        }

        cart.savedForLater = true;
        await cart.save();

        // save the cart to the database
        return res.json({ message: 'Product removed from the cart', data: cart });
    } catch (error) {
        console.log(`Error in removeFromCart controller`, error.message);
        return res.status(500).json({ message: error.message });
    }
}

export const getCartProducts = async (req, res) => {
    try {
        const user = req.user;
        const cartItems = user.cartItems;

        // extract productId from cartItems
        const productIds = cartItems.map(item => item.productId);

        // fetch product details using respective productIds -> BETCH FETCHING PRODUCT DATA
        const products = await Product.find({ _id: { $in: productIds } });

        // combine product details with quantity and then we will calculate total price
        const cartDetails = cartItems.map(item => {
            const product = products.find(prod => prod.productId === item.productId);

            // we are finding price for every single product one by one
            const totalPrice = product.price * item.quantity;
            return {
                productId: item.productId,
                productName: product.name,
                productPrice: totalPrice,
                quantity: item.quantity,
                totalPrice: totalPrice,
            }
        });

        // calculate total price
        const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);

        return res.json({
            message: 'cart items fetched successfully',
            cartDetails,
            grandTotal,
        })

    } catch (err) {
        console.log(`Error in getCartProducts controller`, err.message);
        return res.status(500).json({ message: err.message });
    }
}

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