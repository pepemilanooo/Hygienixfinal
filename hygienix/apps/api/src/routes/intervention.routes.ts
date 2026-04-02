import { Router } from 'express';
import * as ctrl from '../controllers/intervention.controller';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createInterventionSchema, updateInterventionSchema,
  addInterventionProductSchema, updateInterventionPointSchema,
  interventionSignatureSchema, paginationSchema
} from '@hygienix/validators';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'MANAGER'), validate(paginationSchema, 'query'), ctrl.listInterventions);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createInterventionSchema), ctrl.createIntervention);
router.get('/my', ctrl.getMyInterventions);
router.get('/:id', ctrl.getIntervention);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), validate(updateInterventionSchema), ctrl.updateIntervention);
router.delete('/:id', authorize('ADMIN'), ctrl.archiveIntervention);

// Workflow
router.post('/:id/checkin', ctrl.checkIn);
router.post('/:id/checkout', ctrl.checkOut);
router.patch('/:id/outcome', ctrl.updateOutcome);

// Foto
router.post('/:id/photos', upload.array('photos', 10), ctrl.uploadPhotos);
router.delete('/:id/photos/:photoId', authorize('ADMIN', 'MANAGER'), ctrl.deletePhoto);

// Firma
router.post('/:id/signature/technician', validate(interventionSignatureSchema), ctrl.saveTechnicianSignature);
router.post('/:id/signature/client', validate(interventionSignatureSchema), ctrl.saveClientSignature);

// Prodotti
router.post('/:id/products', validate(addInterventionProductSchema), ctrl.addProduct);
router.delete('/:id/products/:productId', ctrl.removeProduct);

// Punti cartellino
router.post('/:id/points/:pointId', validate(updateInterventionPointSchema), ctrl.updateInterventionPoint);

// Chiusura
router.post('/:id/close', ctrl.closeIntervention);

// Report
router.get('/:id/report', ctrl.downloadReport);
router.post('/:id/report/regenerate', authorize('ADMIN', 'MANAGER'), ctrl.regenerateReport);

export default router;
