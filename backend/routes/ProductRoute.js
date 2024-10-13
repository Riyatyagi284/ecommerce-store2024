import express from "express";
const router = express.Router()

import { createProduct } from "../controller/ProductController.js";

router.post('/createProduct', createProduct);

export default router;