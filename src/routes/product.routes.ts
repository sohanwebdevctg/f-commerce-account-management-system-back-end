import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { createProduct, deleteProduct, deleteProductVariant, deleteProductVariantItem, getAllProduct, getAllPublicProduct, getSingleProduct, getSinglePublicProduct, restoreProduct, restoreProductVariant, restoreProductVariantItem, updateProduct, updateProductStatus, updateProductVariantItemStatus, updateProductVariantStatus } from '../controllers/product.controller';
import { upload } from '../middlewares/upload';


const router = Router();

// Define route endpoint
// public
router.get('/public', getAllPublicProduct) // get/api/v1/products/public
router.get('/public/:id', getSinglePublicProduct) // get/api/v1/products/public/:id

// basic product action
router.post('/', auth('ADMIN', 'MODERATOR'), upload.any(), createProduct); // post/api/v1/products
router.get('/', auth('ADMIN', 'MODERATOR', 'STAFF'), getAllProduct); // get/api/v1/products
router.get('/:id', auth('ADMIN', 'MODERATOR', 'STAFF'), getSingleProduct) // get/api/v1/products/:id
router.patch('/:id', auth('ADMIN', 'MODERATOR'), upload.any(), updateProduct) // patch/api/v1/products/:id

// product related
router.patch('/:id/status', auth('ADMIN', 'MODERATOR'), updateProductStatus); // patch/api/v1/products/:id/status
router.delete('/:id', auth('ADMIN', 'MODERATOR'), deleteProduct); // delete/api/v1/products/:id
router.patch('/:id/restore', auth('ADMIN', 'MODERATOR'), restoreProduct); // patch/api/v1/products/:id/restore

// product variant related
router.patch('/:productId/variants/:variantId/status', auth('ADMIN', 'MODERATOR'), updateProductVariantStatus); // patch/api/v1/products/:productId/variants/:variantId/status
router.delete('/:productId/variants/:variantId', auth('ADMIN', 'MODERATOR'), deleteProductVariant); // delete/api/v1/products/:productId/variants/:variantId
router.patch('/:productId/variants/:variantId/restore', auth('ADMIN', 'MODERATOR'), restoreProductVariant); // patch/api/v1/products/:productId/variants/:variantId/restore

// product variant item related
router.patch('/:productId/variants/:variantId/items/:itemId/status', auth('ADMIN', 'MODERATOR'), updateProductVariantItemStatus); // patch/api/v1/products/:productId/variants/:variantId/items/:itemId/status
router.delete('/:productId/variants/:variantId/items/:itemId', auth('ADMIN', 'MODERATOR'), deleteProductVariantItem); // delete/api/v1/products/:productId/variants/:variantId/items/:itemId
router.patch('/:productId/variants/:variantId/items/:itemId/restore', auth('ADMIN', 'MODERATOR'), restoreProductVariantItem); // patch/api/v1/products/:productId/variants/:variantId/items/:itemId/restore


// Export the product router module to be mounted in the main router
export const ProductRoutes = router;