import { Router } from 'express';
import * as ctrl from '../controllers/calendar.controller';
import { authenticate, authorize } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), ctrl.getCalendar);
router.get('/my', ctrl.getMyCalendar);

export default router;
