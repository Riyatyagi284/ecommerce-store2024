import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const mailSender = async (email, title, body) => {
    try {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
            secure: false // true for 465, false for other ports
        });

        let info = await transporter.sendMail({
            from: '"Ecommerce Store" <noreply@ecommerce-store.com>', // sender address
            to: `${email}`, // list of receivers
            subject: `${title}`, // Subject line
            text: `${body}`, // plain body
        })
    } catch (error) {
        console.error(`Error sending email: ${error}`);
        return error.message;
    }
}