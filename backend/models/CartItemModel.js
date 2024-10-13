import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    productName: { type: String, required: true },
    productDescription: { type: String },
    productImages: [
        {
            url: { type: String, required: true },
            alt: { type: String }
        }
    ],
    attributes: {
        color: { type: String },
        size: { type: String },
        layout: { type: String }
    },
    discount: {
        discountId: { type: String },
        discountPercentage: { type: Number },
        discountAmount: { type: Number },
        applied: { type: Boolean, default: false }
    },
    shipping: {
        shippingMethod: { type: String },
        shippingCost: { type: Number },
        estimatedDelivery: { type: Date }
    },
    availability: {
        inStock: { type: Boolean, required: true },
        stockQuantity: { type: Number }
    }
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;