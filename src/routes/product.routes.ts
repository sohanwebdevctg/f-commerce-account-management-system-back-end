import { Router } from "express";
import { auth } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import { createProduct, getAllProducts, getProductById, getPublicProductById, getPublicProducts, restoreColor, restoreProduct, restoreVariant, softDeleteColor, softDeleteProduct, softDeleteVariant, updateColorStatus, updateProduct, updateProductStatus, updateVariantStatus } from "../controllers/product.controller";

const router = Router();


router.post("/", auth("ADMIN", "MODERATOR"),upload.fields([{ name: "thumbnailImage", maxCount: 1 },{ name: "images", maxCount: 10 },]),
  createProduct); // post/api/v1/products
router.get("/", auth("ADMIN", "MODERATOR", "STAFF"), getAllProducts); // get/api/v1/products

// public
router.get("/public", getPublicProducts); // get/api/v1/products/public
router.get("/public/:id", getPublicProductById); // gat/api/v1/products/public/:id

router.get("/:id", auth("ADMIN", "MODERATOR", "STAFF"), getProductById
); // get/api/v1/products/:id
router.patch("/:id", auth("ADMIN", "MODERATOR"), upload.fields([{ name: "thumbnailImage", maxCount: 1 },{ name: "images", maxCount: 10 },]),
  updateProduct); // patch/api/v1/products/:id

// product
router.patch("/:id/status", auth("ADMIN", "MODERATOR"), updateProductStatus); // patch/api/v1/products/:id/status
router.delete("/:id", auth("ADMIN", "MODERATOR"), softDeleteProduct); // delete/api/v1/product/:id
router.patch("/:id/restore", auth("ADMIN", "MODERATOR"), restoreProduct);  // patch/api/v1/products/:id/restore

// color
router.patch("/:productId/colors/:colorId/status", auth("ADMIN", "MODERATOR"),updateColorStatus); // patch/api/v1/products/:productId/colors/:colorId/status
router.delete( "/:productId/colors/:colorId", auth("ADMIN", "MODERATOR"), softDeleteColor); // delete/api/v1/products/:productId/colors/:colorId
router.patch("/:productId/colors/:colorId/restore", auth("ADMIN", "MODERATOR"), restoreColor); // patch/api/v1/products/:productId/colors/:colorId/restore

// variant & Option Level
router.patch("/variants/:variantId/status", auth("ADMIN", "MODERATOR"), updateVariantStatus); // patch/api/v1/products/variants/:variantId/status
router.delete("/variants/:variantId", auth("ADMIN", "MODERATOR"), softDeleteVariant); // delete/api/v1/products/variants/:variantId
router.patch("/variants/:variantId/restore", auth("ADMIN", "MODERATOR"),restoreVariant); // patch/api/v1/products/variants/:variantId/restore



export const ProductRoutes = router;