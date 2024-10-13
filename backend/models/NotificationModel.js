import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    notificationId: {
        type: UUID,
        required: true
    },
    message: {
        type: string,
        minLength: 1,
        required: true
    },
    read: {
        type: boolean,
        default: false
    },
    createdAt: {
        type: string,
        format: date,
        required: true
    }
})

export const Notification = mongoose.model('Notification', notificationSchema);