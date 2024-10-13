const userSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.UUID,
        required: true,
    },
    email: {
        type: String,
        format: email,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    firstName: {
        type: String,
        minLength: 1,
        maxLength: 100,
        required: true,
    },
    lastName: {
        type: String,
        minLength: 1,
        maxLength: 100,
        required: true,
    },
    phone: {
        type: String,
        match: /^[0-9]{10,15}$/,
        required: true,
    },
    dateOfBirth: {
        type: string,
        format: date,
    },
    gender: {
        type: string,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    addresses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserShippingAddress'
        },],

    paymentMethods: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPaymentMethod' },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist' }],

    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }],

    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecentlyViewed' }],

    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],

    loyaltyPoints: {
        pointsEarned: {
            type: number,
            minimum: 0
        },
        pointsSpent: {
            type: number,
            minimum: 0
        },
        pointsAvailable: {
            type: number,
            minimum: 0
        }
    },

    accountStatus: {
        type: string,
        enum: ["Active", "Suspended", "Banned"],
        required: true
    },
    role: {
        type: string,
        enum: ["Customer", "Admin"],
        required: true
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const User = mongoose.model('User', userSchema);