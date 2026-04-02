// ─────────────────────────────────────────────────────────────────────────────
// HYGIENIX — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ─── API RESPONSE TYPES ──────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── AUTH TYPES ───────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'MANAGER' | 'TECHNICIAN';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── USER TYPES ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  fullName: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

// ─── CLIENT TYPES ─────────────────────────────────────────────────────────────

export type ClientType = 'PRIVATE' | 'CONDO' | 'COMPANY' | 'RESTAURANT' | 'HOTEL' | 'SHOP' | 'INDUSTRY' | 'PA' | 'OTHER';
export type ClientStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface ClientSummary {
  id: string;
  businessName: string;
  type: ClientType;
  status: ClientStatus;
  city?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  _count?: { sites: number; interventions: number };
  createdAt: Date;
}

export interface ClientDetail extends ClientSummary {
  taxCode?: string | null;
  vatNumber?: string | null;
  contactName?: string | null;
  address?: string | null;
  province?: string | null;
  zip?: string | null;
  notes?: string | null;
  updatedAt: Date;
}

export interface CreateClientDto {
  businessName: string;
  type: ClientType;
  taxCode?: string;
  vatNumber?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  city?: string;
  province?: string;
  zip?: string;
  notes?: string;
}

export type UpdateClientDto = Partial<CreateClientDto> & { status?: ClientStatus };

// ─── SITE TYPES ───────────────────────────────────────────────────────────────

export type SiteStatus = 'ACTIVE' | 'MAINTENANCE' | 'SUSPENDED' | 'ARCHIVED';

export interface SiteSummary {
  id: string;
  clientId: string;
  name: string;
  type?: string | null;
  address?: string | null;
  city?: string | null;
  status: SiteStatus;
  hasSiteCard: boolean;
  _count?: { interventions: number };
  createdAt: Date;
}

export interface SiteDetail extends SiteSummary {
  province?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  localContactName?: string | null;
  localContactPhone?: string | null;
  criticalZones?: string | null;
  operationalNotes?: string | null;
  client: { id: string; businessName: string };
  updatedAt: Date;
}

export interface CreateSiteDto {
  name: string;
  type?: string;
  address?: string;
  city?: string;
  province?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  localContactName?: string;
  localContactPhone?: string;
  criticalZones?: string;
  operationalNotes?: string;
}

export type UpdateSiteDto = Partial<CreateSiteDto> & { status?: SiteStatus };

// ─── SITE CARD TYPES ─────────────────────────────────────────────────────────

export type CardPointType = 'TRAP' | 'BAIT' | 'UV_LAMP' | 'MONITOR' | 'CHECK_POINT' | 'CRITICAL_AREA' | 'SENSITIVE_ACCESS';
export type CardPointStatus = 'OK' | 'ATTENTION' | 'CRITICAL' | 'INACTIVE';

export interface SiteCardPoint {
  id: string;
  siteCardId: string;
  code: string;
  type: CardPointType;
  label?: string | null;
  description?: string | null;
  instructions?: string | null;
  frequency?: string | null;
  positionX: number;
  positionY: number;
  status: CardPointStatus;
  lastNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteCard {
  id: string;
  siteId: string;
  baseImageUrl?: string | null;
  baseImageWidth?: number | null;
  baseImageHeight?: number | null;
  version: number;
  notes?: string | null;
  points: SiteCardPoint[];
  updatedAt: Date;
}

export interface CreateSiteCardPointDto {
  code: string;
  type: CardPointType;
  label?: string;
  description?: string;
  instructions?: string;
  frequency?: string;
  positionX: number;
  positionY: number;
}

export type UpdateSiteCardPointDto = Partial<CreateSiteCardPointDto> & { status?: CardPointStatus; lastNotes?: string };

// ─── INTERVENTION TYPES ───────────────────────────────────────────────────────

export type InterventionStatus = 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'ARCHIVED';
export type ServiceType = 'DISINFECTION' | 'RODENT_CONTROL' | 'COCKROACH' | 'MONITORING' | 'SANIFICATION' | 'INSPECTION' | 'OTHER';
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type PhotoType = 'BEFORE' | 'AFTER' | 'GENERIC';
export type PointOutcome = 'OK' | 'ATTENTION' | 'CRITICAL' | 'NOT_CHECKED';

export interface InterventionSummary {
  id: string;
  clientId: string;
  siteId: string;
  assignedTechnicianId?: string | null;
  serviceType: ServiceType;
  status: InterventionStatus;
  priority: Priority;
  scheduledAt: Date;
  scheduledEndAt?: Date | null;
  client: { id: string; businessName: string };
  site: { id: string; name: string; city?: string | null };
  assignedTechnician?: { id: string; firstName: string; lastName: string } | null;
  createdAt: Date;
}

export interface InterventionDetail extends InterventionSummary {
  startedAt?: Date | null;
  completedAt?: Date | null;
  closedAt?: Date | null;
  description?: string | null;
  operationalNotes?: string | null;
  outcome?: string | null;
  technicianSignatureUrl?: string | null;
  clientSignatureUrl?: string | null;
  reportPdfUrl?: string | null;
  photos: InterventionPhoto[];
  products: InterventionProductDetail[];
  points: InterventionPointDetail[];
  updatedAt: Date;
}

export interface InterventionPhoto {
  id: string;
  url: string;
  type: PhotoType;
  caption?: string | null;
  createdAt: Date;
}

export interface InterventionProductDetail {
  id: string;
  product: { id: string; name: string; activeIngredient?: string | null; category: string };
  quantity: number;
  unit: string;
  batchNumber?: string | null;
  notes?: string | null;
}

export interface InterventionPointDetail {
  id: string;
  siteCardPoint: SiteCardPoint;
  outcome: PointOutcome;
  notes?: string | null;
  photoUrls: string[];
  checkedAt?: Date | null;
}

export interface CreateInterventionDto {
  clientId: string;
  siteId: string;
  assignedTechnicianId?: string;
  serviceType: ServiceType;
  priority?: Priority;
  scheduledAt: string;
  scheduledEndAt?: string;
  description?: string;
  operationalNotes?: string;
}

export type UpdateInterventionDto = Partial<CreateInterventionDto> & { status?: InterventionStatus };

// ─── PRODUCT TYPES ────────────────────────────────────────────────────────────

export type ProductCategory = 'INSECTICIDE' | 'RODENTICIDE' | 'FUNGICIDE' | 'DISINFECTANT' | 'BAIT' | 'OTHER';
export type ProductStatus = 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  activeIngredient?: string | null;
  category: ProductCategory;
  manufacturer?: string | null;
  registrationNumber?: string | null;
  safetySheetUrl?: string | null;
  status: ProductStatus;
  createdAt: Date;
}

// ─── ANALYTICS TYPES ──────────────────────────────────────────────────────────

export interface DashboardKpi {
  interventionsToday: number;
  interventionsOpen: number;
  interventionsCompletedThisMonth: number;
  activeTechnicians: number;
  activeClients: number;
  interventionsToSchedule: number;
  alertsCount: number;
}

export interface InterventionTrend {
  date: string;
  completed: number;
  planned: number;
}

export interface TechnicianPerformance {
  technician: { id: string; firstName: string; lastName: string };
  totalInterventions: number;
  completedOnTime: number;
  averageDurationMinutes: number;
}
