import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createCategory, deleteCategory, getAllActiveCategory, getAllCategory, getAllPublicCategory, getSingleCategory, restoreCategory, updateCategory, updateCategoryStatus } from '../controllers/category.controller';




const router = Router();

router.post('/', auth('ADMIN', 'MODERATOR'), createCategory); // post/api/v1/categories
router.get('/', auth('ADMIN', 'MODERATOR'), getAllCategory); // get/api/v1/categories
router.get('/active', auth('ADMIN', 'MODERATOR'), getAllActiveCategory); // get/api/v1/categories/active
router.get('/public', getAllPublicCategory); // get/api/v1/categories/public
router.get('/:id', auth("ADMIN", "MODERATOR"), getSingleCategory); // get/api/v1/categories/:id
router.patch('/:id/status', auth('ADMIN', 'MODERATOR'), updateCategoryStatus) // patch/api/v1/categories/:id/status
router.delete('/:id', auth('ADMIN', 'MODERATOR'), deleteCategory) // delete/api/v1/categories/:id
router.patch('/:id/restore', auth('ADMIN', 'MODERATOR'), restoreCategory) // patch/api/v1/categories/:id/restore
router.patch('/:id', auth('ADMIN', 'MODERATOR'), updateCategory)  // patch/api/v1/categories/:id

export const CategoryRoutes = router;