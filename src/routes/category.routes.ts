import { Router } from "express";
import { createCategory, getAllCategories, getCategoryById, getPublicCategories, restoreCategory, softDeleteCategory, updateCategory, updateCategoryStatus } from "../controllers/category.controller";
import { auth } from "../middlewares/auth";

const router = Router();


router.post('/', auth('ADMIN', 'MODERATOR'), createCategory); // post/api/v1/categories
router.get("/", auth("ADMIN", "MODERATOR"), getAllCategories); // get/api/v1/categories
router.get("/public", getPublicCategories); // get/api/v1/categories/public
router.get('/:id', auth('ADMIN', 'MODERATOR'), getCategoryById); // get/api/v1/categories/:id
router.patch("/:id/status", auth("ADMIN", "MODERATOR"), updateCategoryStatus);  // patch/api/v1/categories/:id/status
router.patch("/:id", auth("ADMIN", "MODERATOR"), updateCategory); // patch/api/v1/categories/:id
router.delete("/:id", auth("ADMIN", "MODERATOR"), softDeleteCategory); // delete/api/v1/categories/:id
router.patch("/:id/restore", auth("ADMIN", "MODERATOR"), restoreCategory); // patch/api/v1/categories/:id/restore


export const CategoryRoutes = router;
