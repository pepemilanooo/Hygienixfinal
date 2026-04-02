import { z } from 'zod';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password minimo 6 caratteri'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token richiesto'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, 'Password minimo 8 caratteri').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password deve contenere almeno una maiuscola, una minuscola e un numero'
  ),
});

// ─── USERS ────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'Password minimo 8 caratteri').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password deve contenere almeno una maiuscola, una minuscola e un numero'
  ),
  firstName: z.string().min(1, 'Nome richiesto').max(50),
  lastName: z.string().min(1, 'Cognome richiesto').max(50),
  role: z.enum(['ADMIN', 'MANAGER', 'TECHNICIAN']),
  phone: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional(),
  isActive: z.boolean().optional(),
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  businessName: z.string().min(1, 'Ragione sociale richiesta').max(200),
  type: z.enum(['PRIVATE', 'CONDO', 'COMPANY', 'RESTAURANT', 'HOTEL', 'SHOP', 'INDUSTRY', 'PA', 'OTHER']),
  taxCode: z.string().max(20).optional(),
  vatNumber: z.string().max(20).optional(),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(5).optional(),
  zip: z.string().max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
});

// ─── SITES ────────────────────────────────────────────────────────────────────

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Nome sede richiesto').max(200),
  type: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(5).optional(),
  zip: z.string().max(10).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  localContactName: z.string().max(100).optional(),
  localContactPhone: z.string().max(20).optional(),
  criticalZones: z.string().max(2000).optional(),
  operationalNotes: z.string().max(2000).optional(),
});

export const updateSiteSchema = createSiteSchema.partial().extend({
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'SUSPENDED', 'ARCHIVED']).optional(),
});

// ─── SITE CARD POINTS ─────────────────────────────────────────────────────────

export const createSiteCardPointSchema = z.object({
  code: z.string().min(1, 'Codice punto richiesto').max(20),
  type: z.enum(['TRAP', 'BAIT', 'UV_LAMP', 'MONITOR', 'CHECK_POINT', 'CRITICAL_AREA', 'SENSITIVE_ACCESS']),
  label: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  instructions: z.string().max(1000).optional(),
  frequency: z.string().max(50).optional(),
  positionX: z.number().min(0).max(100),
  positionY: z.number().min(0).max(100),
});

export const updateSiteCardPointSchema = createSiteCardPointSchema.partial().extend({
  status: z.enum(['OK', 'ATTENTION', 'CRITICAL', 'INACTIVE']).optional(),
  lastNotes: z.string().max(1000).optional(),
});

export const updateSiteCardSchema = z.object({
  notes: z.string().max(2000).optional(),
});

// ─── INTERVENTIONS ────────────────────────────────────────────────────────────

export const createInterventionSchema = z.object({
  clientId: z.string().uuid('ID cliente non valido'),
  siteId: z.string().uuid('ID sede non valido'),
  assignedTechnicianId: z.string().uuid().optional(),
  serviceType: z.enum(['DISINFECTION', 'RODENT_CONTROL', 'COCKROACH', 'MONITORING', 'SANIFICATION', 'INSPECTION', 'OTHER']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  scheduledAt: z.string().datetime('Data non valida'),
  scheduledEndAt: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
  operationalNotes: z.string().max(2000).optional(),
});

export const updateInterventionSchema = createInterventionSchema.partial().extend({
  status: z.enum(['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'ARCHIVED']).optional(),
  outcome: z.string().max(2000).optional(),
});

export const addInterventionProductSchema = z.object({
  productId: z.string().uuid('ID prodotto non valido'),
  quantity: z.number().positive('Quantità deve essere positiva'),
  unit: z.string().max(10).default('ml'),
  batchNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updateInterventionPointSchema = z.object({
  outcome: z.enum(['OK', 'ATTENTION', 'CRITICAL', 'NOT_CHECKED']),
  notes: z.string().max(1000).optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export const interventionSignatureSchema = z.object({
  signatureData: z.string().min(1, 'Firma richiesta'), // base64 PNG
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome prodotto richiesto').max(200),
  activeIngredient: z.string().max(200).optional(),
  category: z.enum(['INSECTICIDE', 'RODENTICIDE', 'FUNGICIDE', 'DISINFECTANT', 'BAIT', 'OTHER']),
  manufacturer: z.string().max(200).optional(),
  registrationNumber: z.string().max(50).optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
});

// ─── PAGINATION ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

export const calendarQuerySchema = z.object({
  from: z.string().datetime('Data inizio non valida'),
  to: z.string().datetime('Data fine non valida'),
  technicianId: z.string().uuid().optional(),
  status: z.enum(['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'ARCHIVED']).optional(),
});

// Export type inference
export type LoginSchema = z.infer<typeof loginSchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type CreateClientSchema = z.infer<typeof createClientSchema>;
export type UpdateClientSchema = z.infer<typeof updateClientSchema>;
export type CreateSiteSchema = z.infer<typeof createSiteSchema>;
export type UpdateSiteSchema = z.infer<typeof updateSiteSchema>;
export type CreateSiteCardPointSchema = z.infer<typeof createSiteCardPointSchema>;
export type UpdateSiteCardPointSchema = z.infer<typeof updateSiteCardPointSchema>;
export type CreateInterventionSchema = z.infer<typeof createInterventionSchema>;
export type UpdateInterventionSchema = z.infer<typeof updateInterventionSchema>;
export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>;
export type CalendarQuerySchema = z.infer<typeof calendarQuerySchema>;
