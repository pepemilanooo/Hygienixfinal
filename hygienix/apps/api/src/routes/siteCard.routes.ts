import { Router } from 'express';
import * as ctrl from '../controllers/siteCard.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createSiteCardPointSchema, updateSiteCardPointSchema, updateSiteCardSchema } from '@hygienix/validators';

const router = Router();
router.use(authenticate);

// Cartellino sede
router.get('/:siteId/card', ctrl.getSiteCard);
router.post('/:siteId/card', authorize('ADMIN', 'MANAGER'), ctrl.createOrUpdateSiteCard);
router.patch('/:siteId/card', authorize('ADMIN', 'MANAGER'), validate(updateSiteCardSchema), ctrl.updateSiteCard);
router.get('/:siteId/card/history', authorize('ADMIN', 'MANAGER'), ctrl.getSiteCardHistory);

// Punti del cartellino
router.get('/:siteId/card/points', ctrl.getPoints);
router.post('/:siteId/card/points', authorize('ADMIN', 'MANAGER'), validate(createSiteCardPointSchema), ctrl.createPoint);
router.patch('/:siteId/card/points/:pointId', authorize('ADMIN', 'MANAGER'), validate(updateSiteCardPointSchema), ctrl.updatePoint);
router.delete('/:siteId/card/points/:pointId', authorize('ADMIN'), ctrl.deletePoint);

export default router;
