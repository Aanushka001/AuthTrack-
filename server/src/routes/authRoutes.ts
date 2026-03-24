import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { authRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authRateLimit, authController.register);
router.post('/login', authMiddleware, authRateLimit, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);

export default router;