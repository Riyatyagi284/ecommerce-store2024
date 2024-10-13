import { Rating } from "../models/RatingModel";

export const createOrUpdateRating = async (req, res) => {
    try {
        const { productId, rating } = req.body;
        const user = req.user;

        if (!productId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Invalid product ID or rating value' });
        }

        // check if user has already rated the product

        const existingRating = await Rating.findOne({ productId });

        if (existingRating) {
            // if user has already rated the product

            const userRating = existingRating.userRatings.get(user._id.toString());

            if (!userRating) {
                const oldRating = userRating;
                existingRating.userRatings.set(user._id.toString(), rating);

                // update the totalRating and averageRating
                const totalRatings = existingRating.total_ratings + 1;
                const newAverageRating = (existingRating.average_rating * totalRatings - oldRating + rating) / totalRatings;

                existingRating.average_rating = newAverageRating;

                await existingRating.save();

                return res.status(200).json({ message: 'Rating updated successfully', rating: existingRating });

            } else {
                // if user hasn't already rated the product create a new rating
                existingRating.total_ratings += 1;
                const newAverageRating = (existingRating.average_rating * (existingRating.total_ratings - 1) + rating) / existingRating.total_ratings;

                existingRating.average_rating = newAverageRating;

                existingRating.userRatings.set(user._id.toString(), rating);

                await existingRating.save();

                res.status(200).json({ message: 'Rating created successfully', rating: existingRating });
            }


            // const newRating = (existingRating.total_ratings * existingRating.average_rating + rating) / totalRatings;

            // existingRating.average_rating = newRating;
            // existingRating.total_ratings = totalRatings;
            // existingRating.userRatings.set(user._id.toString(), rating);
        } else {
            const newRating = new Rating({
                productId,
                userRatings: new Map([[user._id.toString(), rating]]),
                average_rating: rating,
                total_ratings: 1,
            });

            await newRating.save();
            return res.status(200).json({ message: 'rating created successfully', rating: newRating})
        }

    } catch (error) {
        console.log(`Error in createOrUpdateRating controller`, error.message);
        return res.status(500).json({ message: error.message });
    }
}

export const getProductRatings = async (req, res) => {
    try {
        const { productId } = req.params;
        const rating = await Rating.findOne({ productId });

        if (!rating) {
            return res.status(404).json({ message: 'No rating found for this product' });
        }

        res.status(200).json({ message: 'Rating fetched successfully', rating: rating });
    } catch (error) {
        console.log(`Error in getProductRatings controller`, error.message);
        return res.status(500).json({ message: error.message });
    }
}

export const deleteRating = async (req, res) => {
    try {
        const { productId } = req.params;
        const user = req.user;

        const rating = await Rating.findOne({ productId });

        if (!rating) {
            return res.status(404).json({ message: 'No rating found for this product' });
        }

        // only rating created user can delete that particular rating
        if (!rating.userRatings.has(user._id.toString())) {
            return res.status(403).json({ message: 'You are not authorized to delete this rating' });
        }
        rating.userRatings.delete(user._id.toString)

        // lets recalculate the total and average Rating
        ratting.total_ratings -= 1;
        rating.average_rating = (rating.total_ratings > 0) ? (rating.total_ratings * rating.average_rating - rating.userRatings.get(user._id.toString)) / rating.total_ratings : 0;

        await rating.save();
        res.status(200).json({ message: 'Rating deleted successfully !!' });

    } catch (error) {
        console.log(`error deleting rating: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}