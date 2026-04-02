import { Router } from 'express';
import * as ctrl from '../controllers/site.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createSiteSchema, updateSiteSchema } from '@hygienix/validators';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), ctrl.listSites);
router.get('/:id', authorize('ADMIN', 'MANAGER'), ctrl.getSite);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateSiteSchema), ctrl.updateSite);
router.delete('/:id', authorize('ADMIN'), ctrl.archiveSite);
router.get('/:id/interventions', authorize('ADMIN', 'MANAGER'), ctrl.getSiteInterventions);

// Creazione sedi → sotto /clients/:clientId/sites (gestita in client.routes)
// Ma supportiamo anche POST /sites con clientId nel body
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createSiteSchema), ctrl.createSite);

export default router;
