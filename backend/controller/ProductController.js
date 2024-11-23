// createproduct, deleteProduct, updateProduct, getSpecificProduct, getAllProducts


// 4steps for createApi method: 
// a) dataFetch, b) validate, c) send this data to database and save it there. d) send successful product create response.

import mongoose from 'mongoose';
import { Product } from '../models/ProductModel.js';
import { body, check, validationResult, query, param } from 'express-validator';
import Tag from '../models/TagsModel.js';
import { validateTags } from '../utils/validateTags.js'

// custom Validator implementation
const array_limit = (val) => val.length <= 5;

export const createProduct = [

    // IMPROVEMENTS-SUGGESTIONS :--
    // a) for SCHEMA_VALIDATIONS
    //  1) Add Quantity for Sizes:-- validation to track the available quantity for each size.

    // 2) Add Color Image Validation :-- validation to track the available qty for each color product + allow associating an image with each color.

    // 3) Add Nested Schema Validation :-- While ratings and questions_and_answers are defined as arrays of Schema.Types.Mixed, it might be better to define separate schemas for these if they have a specific structure. This allows for stricter validation of the nested data.

    // b) for CONTROLLERS_VALIDATION
    // 1) Image Validations :--  ensure they are valid image formats (e.g., using a mime-type checker library).

    // store images on cloudinary server.


    // Express-validator middleware for additional validations
    body('id').trim().notEmpty().withMessage('Product ID is required').isString().withMessage('Product ID must be a string'),
    body('name').trim().isLength({ min: 3 }).withMessage('Product name must be at least 3 characters long'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('discount_price').optional().isFloat({ min: 0 }).withMessage('Discount price must be a positive number')
        .custom((value, { req }) => {
            if (value > req.body.price) {
                throw new Error('Discount price cannot exceed the regular price');
            }
            return true;
        }),
    body('currency').trim().isIn(['USD', 'EUR', 'INR', 'GBP']).withMessage('Currency must be one of USD, EUR, INR, or GBP'),
    body('images').optional().isArray({ max: 5 }).withMessage('Cannot have more than 5 images'),
    body('images.*.image_url').isString().withMessage('Image URL must be a string'),
    body('images.*.alt_text').isString().withMessage('Alt text must be a string'),
    body('images.*.position').isInt({ min: 1 }).withMessage('Position must be a positive integer'),
    body('sizes').optional().isArray().withMessage('Sizes must be an array').custom(array_limit).withMessage('Cannot have more than 5 sizes'),
    body('colors').optional().isArray().withMessage('Colors must be an array').custom(array_limit).withMessage('Cannot have more than 5 colors'),
    body('features').optional().isArray({ max: 10 }).withMessage('Cannot have more than 10 features'),
    body('tags').optional().isArray({ max: 10 }).withMessage('Cannot have more than 10 tags'),
    body('stock').isInt({ min: 0 }).withMessage('Stock cannot be negative'),
    body('availability').isIn(['In Stock', 'Out of Stock', 'Limited Stock']).withMessage('Invalid availability status'),
    body('shipping_details.free_shipping').optional().isBoolean().withMessage('Free shipping must be a boolean'),
    body('shipping_details.shipping_cost').optional().isFloat({ min: 0 }).withMessage('Shipping cost must be a positive number'),
    body('shipping_details.express_shipping_cost').optional().isFloat({ min: 0 }).withMessage('Express shipping cost must be a positive number'),
    body('meta.updated_at').optional().isISO8601().withMessage('Updated date must be valid ISO 8601 format'),
    async (req, res) => {
        try {
            // validation checks
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id, name, brand, category, sub_category, price, discount_price, currency, description, sizes, colors, materials, features, specifications, stock, availability, shipping_details, return_policy, warranty, images } = req.body;

            // Assuming images are uploaded using req.files
            // const images = req.files ? req.files.images : [];

            // Creating a new product with validated data
            const newProduct = await Product.create({
                id,
                name,
                brand,
                category,
                sub_category,
                price,
                discount_price,
                currency,
                description,
                images,
                sizes,
                colors,
                materials,
                features,
                specifications,
                stock,
                availability,
                shipping_details,
                return_policy,
                warranty
            });

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
];

export const createBulkProducts = [
    // Validation rules
    body('products').isArray({ min: 1 }).withMessage('Products should be an array with at least one product'),

    body('products.*.id').trim().notEmpty().withMessage('Product ID is required').isString().withMessage('Product ID must be a string'),
    body('products.*.name').trim().isLength({ min: 3 }).withMessage('Product name must be at least 3 characters long'),
    body('products.*.brand').trim().notEmpty().withMessage('Brand is required'),
    body('products.*.category').trim().notEmpty().withMessage('Category is required'),
    body('products.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),

    // DiscountPrice
    body('products.*.discount_price')
        .optional()
        .isFloat({ min: 0 })
        .custom((value, { req }) => {
            const productIndex = req.body.products.findIndex(product => product.discount_price === value);
            const productPrice = req.body.products[productIndex]?.price;
            if (value > productPrice) {
                throw new Error('Discount price cannot exceed the regular price');
            }
            return true;
        })
        .withMessage('Discount price cannot exceed the regular price'),

    // DiscountPrice 
    body('products.*.currency').trim().isIn(['USD', 'EUR', 'INR', 'GBP']).withMessage('Invalid currency'),
    body('products.*.description').optional().trim().isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
    body('products.*.images').optional().isArray().custom((val) => array_limit(val, 5)).withMessage('You can upload up to 5 images'),
    body('products.*.sizes').optional().isArray().custom((val) => array_limit(val, 5)).withMessage('You can specify up to 5 sizes'),
    body('products.*.colors').optional().isArray().custom((val) => array_limit(val, 5)).withMessage('You can specify up to 5 colors'),
    body('products.*.materials').optional().isArray().custom((val) => array_limit(val, 5)).withMessage('You can specify up to 5 materials'),
    body('products.*.features').optional().isArray().custom((val) => array_limit(val, 10)).withMessage('You can specify up to 10 features'),
    body('products.*.stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    body('products.*.availability').optional().isIn(['In Stock', 'Out of Stock', 'Limited Stock']).withMessage('Invalid availability status'),

    // Handling bulk product creation
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { products } = req.body;

        try {
            // Insert products in bulk using Mongoose
            const createdProducts = await Product.insertMany(products);

            return res.status(201).json({
                message: 'Products created successfully',
                createdProducts,
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error during bulk product creation',
                error: error.message,
            });
        }
    },
];

export const getProducts = [
    query('query').optional().isString().trim().escape(),
    query('category').optional().isString().trim().escape(),
    query('price_min').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('price_max').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    query('ratings').optional().isFloat({ min: 0, max: 5 }).withMessage('Ratings must be between 0 and 5'),
    query('size').optional().isString().trim(),
    query('colors').optional().isString().trim(),
    query('materials').optional().isString().trim(),
    query('availability').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { query, category, price_min, price_max, ratings, size, colors, materials, availability, page = 1, limit = 4 } = req.query;

            // Build the search and filter object
            const filter = {};

            // Search by product name
            if (query) filter.name = { $regex: query, $options: 'i' };

            // Filter by category
            if (category) filter.category = { $regex: new RegExp(category, 'i') };

            // Filter by price range
            if (price_min || price_max) {
                filter.price = {};
                if (price_min) {
                    filter.price.$gte = Number(price_min);
                }
                if (price_max) {
                    filter.price.$lte = Number(price_max);
                }
            }

            // Filter by ratings
            if (ratings) filter.ratings = { $gte: Number(ratings) };

            // Filter by size
            if (size) {
                filter['sizes.size'] = { $in: size.split(',').map(c => newRegExp(c, 'i')) };
            }

            // Filter by color
            if (colors) {
                filter['colors.color'] = { $in: colors.split(',').map(c => new RegExp(c, 'i')) };
            }

            // Filter by materials
            if (materials) {
                filter.materials = { $in: materials.split(',').map(m => new RegExp(m, 'i')) };
            }

            // Filter by availability
            if (availability) {
                filter['sizes.availability'] = new RegExp(availability, 'i');
            }

            // Pagination
            const skip = (page - 1) * limit;
            const products = await Product.find(filter).skip(skip).limit(Number(limit));

            // Check if products are found
            if (products.length === 0) {
                return res.status(404).json({ message: 'No products found' });
            }

            // Return filtered and paginated products
            res.status(200).json({
                message: 'Products fetched successfully',
                products,
            });
        } catch (error) {
            console.log(`Error getting products: ${error.message}`);
            res.status(500).json({
                message: 'Error fetching products',
                error: error.message,
            });
        }
    }
];


export const getProductById = [
    param('id').isMongoId().withMessage('Invalid product ID format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const productData = await Product.findById(req.params.id);

            if (!productData) {
                return res.status(400).json({
                    message: 'Product data of given Id not found',
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
];

export const deleteProduct = [
    param('id').isMongoId().withMessage('Invalid product ID format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }


            // Delete the associated images from the cloud storage

            // product.images.forEach(async (image) => {
            // await cloudinary.uploader.destroy(image.public_id);
            // });

            await Product.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Product deleted successfully' });
        }
        catch (err) {
            console.log(`Error deleting product: ${err.message}`)
            res.status(500).json({ error: err.message });
        }
    }
];

export const updateProduct = [
    param('id').isMongoId().withMessage('Invalid product ID format'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { id } = req.params;

            // validate if the discount price is lower than the actual price
            if (req.body.discount_price && req.body.discount_price > req.body.price) {
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
];

// Apis related to tags 
export const addTag = [
    check('tag_id').not().isEmpty().withMessage('Tag ID is required'),
    check('name').not().isEmpty().withMessage('Name is required'),
    check('description').not().isEmpty().withMessage('Description is required'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { tag_id, name, description, related_tags, productId } = req.body;

            if (!productId || productId.length === 0) {
                return res.status(400).json({ message: 'Product ID is required' });
            }

            // const products = await Product.find({ productId: { $in: productId } });

            const products = await Product.find({ _id: { $in: productId } });

            if (!products || products.length === 0) {
                return res.status(400).json({ message: 'Products not found' });
            }

            // validate if tag already exists
            const existingTag = await Tag.findOne({ tag_id });
            if (existingTag) {
                return res.status(400).json({ message: 'Tag with this tag_id already exists' });
            }

            // validate related_tags array
            let validateRelatedTags = [];
            if (related_tags && related_tags.length > 0) {
                validateRelatedTags = await validateTags(related_tags);
                if (!validateRelatedTags) {
                    return res.status(400).json({ message: 'Invalid related_tags array' });
                }
            }

            // create and save the tag
            const newTag = new Tag({
                tag_id,
                name,
                description,
                related_tags: validateRelatedTags,
                productId: productId,
                metadata: {
                    created_at: Date.now(),
                    updated_at: Date.now(),
                }
            });
            await newTag.save();

            // Update the products to add the tag reference
            await Product.updateMany(
                { _id: { $in: productId } },
                { $push: { tags: newTag._id } }
            );

            res.status(201).json({ message: 'Tag added successfully', newTag });
        } catch (error) {
            console.log(`Error adding tag: ${error.message}`);
            res.status(500).json({ message: 'Error adding tag', error: error.message });
        }
    }
];

export const getTagById = async(req,res) => {
    try{
     
    } catch(error) {
        console.log(`Error getting tag by id: ${error.message}`);
        res.status(500).json({ message: 'Error getting tag by id', error: error.message });
    }
}

export const deleteTag = async(req,res) => {
    try {

    } catch(error) {
    console.log(`Error deleting tag: ${error.message}`);
    res.status(500).json({ message: 'Error deleting tag', error: error.message });
    } 
}

export const updateTag = async(req,res) => {
 try{
  // validate and update tag here, we should have validation for related_tags and tag_id here as well
 } catch (error) {
    console.log(`Error updating tag: ${error.message}`);
    res.status(500).json({ message: 'Error updating tag', error: error.message });
   
 }
}

export const createBatchTagging = async (req, res) => {
    try{
       
    } catch (error) {
        console.log(`Error creating batch tagging: ${error.message}`);
        res.status(500).json({ message: 'Error creating batch tagging', error: error.message });
    }
};



// lets fetch related products based on category and tags
export const getRelatedProductsByCategory = async (req, res) => {
    try {
        // use Indexing , add Validations, add more error handling
        const product = await Product.findById(req.params.id).populate('category').populate('tags');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (!product.category) {
            return res.status(404).json({ message: 'Product category not found' });
        }
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id },
            tags: { $in: product.tags },
        }).limit(4);
        res.json(product, relatedProducts);
    } catch (error) {
        console.log(`Error fetching related products by category: ${error.message}`);
        res.status(500).json({ message: 'Error fetching related products by category', error: error.message });
    }
};

export const getRelatedProductsByAttribute = async (req, res) => {
    try{
      const { productId } = req.query;
      
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }
      
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const relatedProducts = await Product.find({
        brand: product.brand,
        colors: product.colors,
        sizes: product.sizes,
        _id: { $ne: productId },
      }).limit(4);
      
      res.json({product, relatedProducts});
    } catch (error) {
        console.log(`Error fetching related products by attribute: ${error.message}`);
        res.status(500).json({ message: 'Error fetching related products by attribute', error: error.message });
    }
}

export const getRelatedtags = async (req, res) => {
    // use Indexing , addValidations, addMoreErrorHandling

    const { tagId } = req.params;

    try {
        const tag = await Tag.findById(tagId).populate('related_tags');

        if (!tag) {
            return res.status(404).json({ message: 'Tag not found' });
        }

        if (!tag.related_tags || tag.related_tags.length === 0) {
            return res.status(200).json({ message: 'No related tags found' });
        }

        res.status(200).json({ message: 'Related tags fetched successfully', relatedTags: tag.related_tags });
    } catch (error) {
        console.log(`Error getting related tags: ${error.message}`);
        res.status(500).json({ message: 'Error getting related tags', error: error.message });
    }
}

//  Apis related to tags

// add -> a) improve validation to ensure that the tag follows your desired format or criteria.

// b) further enhanced for more granular error responses.
// c) Implementing additional logic to handle "Tags as Unique".

// export const addTags = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { tag } = req.body;

//         if (!tags) {
//             return res.status(400).json({ message: 'Please provide tag' });
//         }

//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         // product.tags = [...product.tags,...tags];

//         if (!product.tags.includes(tag)) {
//             product.tags.push(tag);
//             await product.save();
//             return res.status(200).json({ message: 'Tags added successfully', product });
//         }
//         else {
//             return res.status(400).json({ message: 'This tag already exists for this product' });
//         }
//     } catch (err) {
//         console.log(`Error adding tags to product: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// }

// export const getProductTags = async (req, res) => {
//     try {

//     } catch (err) {
//         console.log(`Error getting tags for product: ${error.message}`);
//         res.status(500).json({ error: error.message });
//     }
// }

// export const getProductByTag = async (req, res) => {
//     try {
//         const { tag } = req.params;
//         const products = await Product.find({ tags: tag });

//         if (products.length === 0) {
//             return res.status(404).json({ message: 'Product not found with this tag' })
//         }

//         return res.status(200).json({ message: 'Product found', products: products });
//     } catch (err) {
//         console.log(`Error getting products by tag: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// }

// export const deleteProductTags = async (req, res) => {
//     try {
//         const { id, tag } = req.params;
//         const product = await Product.findById(id);

//         if (!product) {
//             return res.status(404).json({ message: 'Product not found' });
//         }

//         //  Remove the ag if it exists

//         if (product.tags.includes(tag)) {
//             product.tags = product.tags.filter(t => t !== tag);
//             await product.save();
//             return res.status(200).json({ message: 'Tag removed successfully', product });
//         } else {
//             return res.status(400).json({ message: 'This tag does not exist for this product' });
//         }

//     } catch (error) {
//         console.log(`Error deleting tags from product: ${error.message}`);
//         res.status(500).json({ error: error.message });
//     }
// }

//  Apis related to bulk create and update products

// enhance this further by adding validation, logging failed updates, or handling specific errors

// export const createProductsInBulk = async (req, res) => {
//     try {
//         const products = req.body.products;

//         if (!products || !Array.isArray(products) || products.length === 0) {
//             return res.status(400).json({ message: 'Products array is required and cannot be empty' })
//         }

//         const createBulkProducts = await Product.insertMany(products, { ordered: false })
//         res.status(200).json({ message: `${createBulkProducts.length} products created successfully!!` });
//     } catch (err) {
//         console.log(`Error creating products in bulk: ${err.message}`);

//         if (err.name === 'BulkWriteError') {
//             // handle duplicate key error or validation error
//             const duplicateErrorIndex = err.result?.writeErrors?.find(e => e.code === 11000);

//             if (duplicateErrorIndex) {
//                 return res.status(400).json({
//                     message: 'Duplicate product ID detected. Bulk insertion aborted.'
//                 })
//             }
//             return res.status(400).json({ message: 'Error in bulk insertion', errors: error.writeErrors })
//         }
//         res.status(500).json({ message: 'Internal Server error found', error: err.message });
//     }
// }

// export const updateProductsInBulk = async (req, res) => {
//     try {
//         const updateProductsData = req.body.updates;

//         if (!updateProductsData || updateProductsData.length === 0 || !Array.isArray(updateProductsData)) {
//             return res.status(400).json({ message: 'Updates array is required and cannot be empty' })
//         }

//         const bulkOperations = updateProductsData.map((updateData) => {
//             return {
//                 updateOne: {
//                     filter: { id: updateData.id },
//                     update: { $set: updateData.data },
//                     new: true,
//                     upsert: false, // if product not found it won't create any new product.
//                 }
//             }
//         })

//         const result = await Product.bulkWrite(bulkOperations, { ordered: false });

//         res.status(200).json({ message: `${result.modifiedCount} products updated successfully!!` });
//     } catch (err) {
//         console.log(`Error updating products in bulk: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// }

//  Apis related to product availability checker
export const availabilityChecker = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById({ id }).select('availability stock');

        if (!product) {
            return res.status(404).json({ message: 'Product not found!!' });
        }

        return res.status(200).json({
            productId: id,
            availability: product.availability,
            stock: product.stock,
        })
    } catch (err) {
        console.log(`Error checking product availability: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
}

//  Apis related to tracking product stock

export const trackProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stockChange } = req.body;

        if (!stockChange || typeof stockChange !== 'number') {
            return res.status(400).json({ message: 'Please provide a valid stock change value' });
        }

        if (stockChange < 0) {
            return res.status(400).json({ message: 'Cannot change stocks with negative Numbers.' });
        }

        const product = await Product.findById({ id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found!!' });
        }

        const newStockLevel = product.stock + stockChange;

        if (newStockLevel < 0) {
            return res.status(400).json({ message: 'Invalid stock change value. Stock level cannot go below zero.' });
        }

        product.stock = newStockLevel;
        product.availability = newStockLevel > 0 ? 'In Stock' : 'In Of Stock';

        await product.save();

        return res.status(200).json({
            message: 'Stock updated successfully',
            productId: id,
            newStock: product.stock,
            availability: product.availability
        })

    } catch (err) {
        console.log(`Error tracking product stock: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
}

//  Apis related to adding product to wishlist
// export const addProductsToWishlist = async (req, res) => {
//     try {

//     } catch (err) {
//         console.log(`Error adding product to wishlist: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// }

//  Apis related to getting wishlist products
// export const getWishlistProduct = async (req, res) => {
//     try {

//     } catch (err) {
//         console.log(`Error getting wishlist products: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// }

//  Apis related to social media sharing
// export const shareProductOnSocialMedia = async (req, res) => {
//     try {

//     } catch (err) {
//         console.log(`Error sharing product on social media: ${err.message}`);
//         res.status(500).json({ error: err.message });
//     }
// }