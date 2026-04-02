import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'MANAGER'));

router.get('/overview', ctrl.getOverview);
router.get('/interventions', ctrl.getInterventionsTrend);
router.get('/technicians', ctrl.getTechnicianPerformance);
router.get('/sites', ctrl.getProblematicSites);
router.get('/products', ctrl.getProductUsage);

export default router;
