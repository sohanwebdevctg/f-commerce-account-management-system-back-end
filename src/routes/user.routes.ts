import { Router } from 'express';
import { createUser, deleteUser, getAllUsers, getSingleUser, getUserProfile, restoreUser, updateUserProfile, updateUserRole, updateUserStatus } from '../controllers/user.controller';
import { auth } from '../middlewares/auth';
import { upload } from '../middlewares/upload';


const router = Router();


router.post('/', auth('ADMIN'), createUser); // post/api/v1/users
router.get('/', auth('ADMIN', 'MODERATOR'), getAllUsers); // get/api/v1/users
router.get('/profile', auth('ADMIN', 'MODERATOR', 'STAFF'), getUserProfile); // get/api/v1/users/profile
router.patch( "/profile", auth("ADMIN", "MODERATOR", "STAFF"), upload.single("profileImage"),  updateUserProfile); // patch/api/v1/users/profile
router.get('/:id', auth("ADMIN", "MODERATOR"), getSingleUser); // get/api/v1/users/:id
router.patch('/:id/role', auth("ADMIN"), updateUserRole); // patch/api/v1/users/:id/role
router.patch('/:id/status', auth("ADMIN", "MODERATOR"), updateUserStatus); // patch/api/v1/users/:id/status
router.delete('/:id', auth("ADMIN"), deleteUser); // delete/api/v1/users/:id
router.patch('/:id/restore', auth("ADMIN"), restoreUser); // patch/api/v1/users/:id/restore





export const UserRoutes = router;


