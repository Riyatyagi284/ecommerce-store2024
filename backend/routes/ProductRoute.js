import express from "express";
const router = express.Router()

import { createProduct, createBulkProducts, getProducts, addTag, getRelatedtags } from "../controller/ProductController.js";

router.post('/createProduct', createProduct);
router.post('/createBulkProducts', createBulkProducts);
router.get('/getProducts', getProducts);
router.post('/addTag', addTag);
router.get('/tags/:tagId/related', getRelatedtags);

export default router;