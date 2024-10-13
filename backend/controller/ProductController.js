// createproduct, deleteProduct, updateProduct, getSpecificProduct, getAllProducts


// 4steps for createApi method: 
// a) dataFetch, b) validate, c) send this data to database and save it there. d) send successful product create response.

import { Product } from '../models/ProductModel.js';

export const createProduct = async (req, res) => {
    try {
        const { id, name, brand, category, sub_category, price, discount_price, currency, description, sizes, colors, materials, features, specifications, stock, availability, shipping_details, return_policy, warranty } = req.body;

        // const { images } = req.files;

        // validate Product Data Now 
        if (!id || !name || !brand || !category || !price || !currency || !stock) {
            console.log("Validation Failed");
            return res.status(400).json({
                message: 'Please fill all the required fields!',
            });
        }

        if (discount_price && discount_price > price) {
            return res.status(400).json({
                message: 'Discount price should not be greater than price',
            });
        }
        // send this data to the db and save it simply.
        const newProduct = await Product.create({ id, name, brand, category, sub_category, price, discount_price, currency, description, sizes, colors, materials, features, specifications, stock, availability, shipping_details, return_policy, warranty })

        res.status(201).json({
            message: 'Product Created Successfully',
            product: newProduct,
        })

    } catch (error) {
        res.status(500).json({
            message: 'Error creating product',
            error: error,
        })
    }
}

export const getProducts = async (req, res) => {
    try {
        const ProductsData = await Product.find({});

        if (!ProductsData || !ProductsData.length === 0) {
            return res.status(400).json({
                message: 'Products data not found',
                products: ProductsData,
            })
        }

        res.status(200).json({
            message: 'Products fetched successfully',
            products: ProductsData,
        })

    } catch (error) {
        res.status(500).json({
            message: 'Error getting products',
            error: error.message,
        })
    }
}

export const getProductById = async (id) => {
    try {
        const productData = await Product.findById(req.params.id);

        if (!productData) {
            return res.status(400).json({
                message: 'Product data not found',
                product: productData,
            })
        }

        res.status(200).json({
            message: 'Product fetched successfully',
            product: productData,
        })

    } catch (error) {
        console.log(`Error fetching product: ${error.message}`)
        return res.status(404).json({
            message: 'Product with given Id not found',
            error: error,
        })
    }
}

export const deleteProduct = async (id) => {
    try {
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }


        // Delete the associated images from the cloud storage

        // product.images.forEach(async (image) => {
        // await cloudinary.uploader.destroy(image.public_id);
        // });

        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: 'Product deleted successfully' });
    }
    catch (err) {
        console.log(`Error deleting product: ${error.message}`)
        res.status(500).json({ error: err.message });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // validate if the discount price is lower than the actual price
        if(req.body.discount_price && req.body.discount_price > req.body.price) {
            return res.status(400).json({ message: 'discount price cannot exceed the regular price' });
        }

        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // handle images update on cloud

        res.status(200).json({ message: 'Product updated successfully', updatedProduct });
    } catch (error) {
        console.log(`error occured while updating product , ${error.message}`);
        res.status(500).json({ error: error.message });
    }
} 

export const createProductReview = async (req,res) => {
    try{
      
    } catch(error) {
        console.log(`Error creating review: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}