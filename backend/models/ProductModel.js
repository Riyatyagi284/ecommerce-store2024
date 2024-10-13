import mongoose from 'mongoose';
const { Schema } = mongoose;

const productSchema = new Schema({
    id: {
        type: String,
        required: true, // Product ID should be mandatory
        trim: true, // Remove whitespace
        unique: true // Each product should have a unique ID
    },
    name: {
        type: String,
        required: true, // Product name is required
        trim: true,
        minlength: 3 // Minimum length of the product name
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    sub_category: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0 // Price must be at least 0
    },
    discount_price: {
        type: Number,
        min: 0,
        validate: {
            validator: function (value) {
                // Discount price must be less than or equal to the actual price
                return value <= this.price;
            },
            message: 'Discount price cannot exceed the regular price.'
        }
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'EUR', 'INR', 'GBP'] // Allowed currencies
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000 // Limit the description length
    },
    // images: {
    //     type: [String],
    //     validate: [array_limit, '{PATH} exceeds the limit of 5'] // Maximum 5 images
    // },
    // videos: {
    //     type: [String]
    // },
    sizes: {
        type: [Schema.Types.Mixed],
        validate: [array_limit, '{PATH} exceeds the limit of 5']
    },
    colors: {
        type: [Schema.Types.Mixed],
        validate: [array_limit, '{PATH} exceeds the limit of 5']
    },
    materials: {
        type: [String],
        validate: [array_limit, '{PATH} exceeds the limit of 5']
    },
    features: {
        type: [String],
        validate: [array_limit, '{PATH} exceeds the limit of 10'] // Maximum 10 features
    },
    specifications: {
        fit: { type: String, trim: true },
        fabric_type: { type: String, trim: true },
        sleeve_type: { type: String, trim: true },
        neck_style: { type: String, trim: true },
        pattern: { type: String, trim: true }, 
        care_instructions: { type: String, trim: true }
    },
    reviews: {
        type: [Schema.Types.Mixed]
    },

    ratings: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating' },

    questions_and_answers: {
        type: [Schema.Types.Mixed]
    },
    tags: {
        type: [String],
        validate: [array_limit, '{PATH} exceeds the limit of 10']
    },
    related_products: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    frequently_bought_together: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    stock: {
        type: Number,
        required: true,
        min: 0 // Stock cannot be negative
    },
    availability: {
        type: String,
        enum: ['In Stock', 'Out of Stock', 'Limited Stock'] // Allowed availability statuses
    },
    shipping_details: {
        free_shipping: { type: Boolean },
        estimated_delivery: { type: String, trim: true },
        shipping_cost: { type: Number, min: 0 },
        express_shipping_cost: { type: Number, min: 0 },
        international_shipping: { type: Boolean }
    },
    return_policy: {
        type: String,
        trim: true
    },
    warranty: {
        type: String,
        trim: true
    },
    // seller: {
    //     id: {
    //         type: String,
    //         required: true,
    //         trim: true
    //     },
    //     name: {
    //         type: String,
    //         trim: true
    //     },
    //     rating: {
    //         type: Number,
    //         min: 0,
    //         max: 5
    //     },
    //     location: {
    //         type: String,
    //         trim: true
    //     }
    // },
    meta: {
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date
        }
    }
});

// Custom validator to limit array length
function array_limit(val) {
    return val.length <= 5; // Customize as needed
}

export const Product = mongoose.model('Product', productSchema);