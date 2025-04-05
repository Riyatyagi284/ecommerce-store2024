import mongoose from 'mongoose';
const { Schema } = mongoose;

// i will be adding sellers after reaching the certain level 
const productSchema = new Schema({
    id: {
        type: String,
        // required: true,
        trim: true, 
        unique: true 
    },
    name: {
        type: String,
        required: true, 
        trim: true,
        minlength: 3 
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, 
    sub_category: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0 
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
        maxlength: 2000 
    },
    images: {
        type: [{
            image_url: { type: String, trim: true, required: true },
            alt_text: { type: String, trim: true, required: true },
            position: { type: Number, required: true }
          }],
        validate: [array_limit, '{PATH} exceeds the limit of 5'] 
    },
    // videos: {
    //     type: [String]
    // },
    sizes: {
        type: [{
            size: { type: String, trim: true },
            // quantity: { type: Number, min: 0 }
            chest: { type: String, trim: true },
            availability: { type: String, trim: true },
        },],
        validate: [array_limit, '{PATH} exceeds the limit of 5'],
        default: undefined,
    },
    colors: {
        type: [{
            color: { type: String, trim: true },
            image: { type: String, trim: true },
            availability: { type: String, trim: true },
        },],
        validate: [array_limit, '{PATH} exceeds the limit of 5'],
        default: undefined,
    },
    materials: {
        type: [String],
        validate: [array_limit, '{PATH} exceeds the limit of 5']
    },
    features: {
        type: [String],
        validate: [array_limit, '{PATH} exceeds the limit of 10']
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
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }]
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
        enum: ['In Stock', 'Out of Stock', 'Limited Stock']
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