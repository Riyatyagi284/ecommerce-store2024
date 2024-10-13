import { Product } from "../models/ProductModel.js";

export const calculateCartTotal = async (items) => {
    let total = 0;

    const productPromises = items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if(product) {
          return product.price * item.quantity;
        }
        return 0; // if there is no product in cart
    })
    
    const itemTotal = await Promise.all(productPromises);

    total = itemTotal.reduce((acc, curr) => acc + curr, 0);

    return total;
};