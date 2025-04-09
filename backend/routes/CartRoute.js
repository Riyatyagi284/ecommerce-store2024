import express from "express";
const router = express.Router();

import { addToCart, removeItemsFromCart, getAllCartProducts, updateQuantity, applyPromoCode, saveCartForFutureUse, updateCart, createDiscount, applyDiscount, applyTax, setShipping, setPayment, applyPromotions, useLoyalityPoints, markGift, saveForLater, setUserShippingAddress, getUserShippingAddress } from "../controller/CartController.js";

import { authorizedMember, loggedInUsersOnly, verifyToken } from "../middleware/auth.js";

router.post('/addToCart', addToCart);
router.delete('/removeFromCart', removeItemsFromCart);
router.get('/getCartProduct', getAllCartProducts);
router.put('/updateQtyInCart', updateQuantity);
router.post('/applyPromoCode', applyPromoCode);
router.post('/saveCart', saveCartForFutureUse);


// implementation of other cart related routes

router.put('/update-cart', updateCart);
// router.post('/create-discount', authorizedMember, createDiscount);
router.post('/create-discount', createDiscount);
// router.post('/apply-discount', loggedInUsersOnly, applyDiscount);
router.post('/apply-discount', applyDiscount);

// router.post('/set-shipping-address', verifyToken, setUserShippingAddress);
router.post('/set-shipping-address', setUserShippingAddress);
// router.get('/get-shipping-address', verifyToken, getUserShippingAddress);
router.get('/get-shipping-address', getUserShippingAddress);

router.post('/apply-tax', applyTax);
router.post('/set-shipping', setShipping);
router.post('/set-payment', setPayment);
router.post('/apply-promotions', applyPromotions);
router.post('/use-loyality-points', useLoyalityPoints);
router.post('/mark-gift', markGift);
router.post('/save-for-later', saveForLater);

export default router;