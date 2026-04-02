import { Router } from 'express';
import * as ctrl from '../controllers/client.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createClientSchema, updateClientSchema, paginationSchema } from '@hygienix/validators';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', validate(paginationSchema, 'query'), ctrl.listClients);
router.post('/', validate(createClientSchema), ctrl.createClient);
router.get('/:id', ctrl.getClient);
router.patch('/:id', validate(updateClientSchema), ctrl.updateClient);
router.delete('/:id', authorize('ADMIN'), ctrl.archiveClient);
router.get('/:id/interventions', ctrl.getClientInterventions);
router.get('/:id/sites', ctrl.getClientSites);

export default router;
