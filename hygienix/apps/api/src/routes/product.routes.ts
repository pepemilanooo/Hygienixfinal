import { Router } from 'express';
import * as ctrl from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema, paginationSchema } from '@hygienix/validators';

const router = Router();
router.use(authenticate);

router.get('/', validate(paginationSchema, 'query'), ctrl.listProducts);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createProductSchema), ctrl.createProduct);
router.get('/:id', ctrl.getProduct);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', authorize('ADMIN'), ctrl.archiveProduct);

export default router;
