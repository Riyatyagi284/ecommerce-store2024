import { Review } from "../models/ReviewModel";

export const createReview = async (req, res) => {
    try {
        const { reviewId, productId, rating, title, body, verifiedPurchase } = req.body;

        if (!reviewId || !productId || !rating || !title || !body) {
            res.status(400).json({ message: 'All fields are required.' })

            if (rating < 1 || rating > 5) {
                res.status(400).json({ message: 'Rating must be between 1 and 5.' });
            }

            const newReview = await Review.create({
                reviewId,
                productId,
                rating,
                title,
                body,
                verifiedPurchase,
                user: req.user._id,
                createdAt: new Date(),
            })

            res.status(201).json({ message: 'Review created successfully.', review: newReview });
        }
    } catch (error) {
        console.log(`Error in createReview controller`, error.message);
        return res.status(500).json({ message: error.message });
    }
}

export const getSpecificProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const productReviews = await Review.find({ productId });

        if (!productReviews || productReviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this product.' });
        }

        res.status(200).json({ message: 'Reviews fetched successfully', productReviews: reviews });

    } catch (error) {
        console.log(`Error in getSpecificProductReviews controller`, error.message);
        return res.status(500).json({ message: error.message });
    }
}

export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const updatedReview = await Review.findOneAndUpdate({ reviewId }, req.body, { new: true });

        if (!updatedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.status(200).json({ message: 'Review updated successfully.', review: updatedReview });
    } catch (Error) {
        console.log(`error updating review, ${Error.message}`);
        res.status(500).json({ message: error.message });
    }
}

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const deletedReview = await Review.findOneAndDelete({ reviewId });

        if (!deletedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.status(200).json({ mssage: 'Reviews Deleted successfully ' });
    } catch (error) {
        console.log(`Error deleting review: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
}