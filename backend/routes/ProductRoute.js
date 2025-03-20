import express from "express";
const router = express.Router()

import { createProduct, createBulkProducts, getProducts, getProductById, updateProduct, deleteProduct, addTag, getRelatedtags } from "../controller/ProductController.js";

router.post('/createProduct', createProduct);
router.post('/createBulkProducts', createBulkProducts);
router.get('/getProducts', getProducts);
router.get('/product/:id', getProductById);
router.put('/product/:id', updateProduct);
router.delete('/product/:id', deleteProduct);
router.post('/addTag', addTag);
router.get('/tags/:tagId/related', getRelatedtags);

export default router;