import { Router } from 'express';
import * as ctrl from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema, paginationSchema } from '@hygienix/validators';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate(paginationSchema, 'query'), ctrl.listUsers);
router.post('/', validate(createUserSchema), ctrl.createUser);
router.get('/:id', ctrl.getUser);
router.patch('/:id', validate(updateUserSchema), ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

export default router;
