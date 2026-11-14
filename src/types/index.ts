export type UserRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'DISPATCHER' | 'DRIVER';
export type ShipmentStatus =
  'PENDING' | 'DISPATCHING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
export type PriorityTier = 'STANDARD' | 'EXPRESS' | 'URGENT';
export type ShiftStatus = 'OFFLINE' | 'AVAILABLE' | 'ON_BREAK' | 'BUSY';
export type VehicleClass = 'MOTORCYCLE' | 'SEDAN' | 'VAN' | 'TRUCK';

export interface UserContext {
  userId: string;
  tenantId: string | null;
  role: UserRole;
}

export interface Shipment {
  id: string;
  tenantId: string;
  trackingCode: string;
  status: ShipmentStatus;
  priority: PriorityTier;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientEmail?: string;
  recipientLat?: number;
  recipientLng?: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  assignedDriverId?: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverJobView extends Omit<Shipment, 'recipientName' | 'recipientPhone' | 'recipientAddress'> {
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  approxDestLat?: number;
  approxDestLng?: number;
  recipientDetailsReleased: boolean;
}

export interface AssignmentOffer {
  id: string;
  tenantId: string;
  driverId: string;
  shipmentId: string;
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED';
  respondBy: string;
  preview?: { weightKg: number; priority: PriorityTier; approxDistanceKm?: number };
}

export interface Vehicle {
  id: string;
  tenantId: string;
  licensePlate: string;
  vehicleClass: VehicleClass;
  maxWeightKg: number;
  volumeM3: number;
  maintenanceState: 'OPERATIONAL' | 'IN_MAINTENANCE';
  insuranceExpiry?: string;
  assignedDriverId?: string;
}

export interface AlertNotification {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  body: string;
  shipmentId?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface DriverTelemetry {
  driverId: string;
  lat: number;
  lng: number;
  ts: number;
  speedKmh: number;
  heading: number;
  shipmentId?: string;
}

export interface DriverProfile {
  id: string;
  tenantId: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseVerifiedAt?: string | null;
  shiftStatus: ShiftStatus;
  currentLat?: number | null;
  currentLng?: number | null;
  assignedVehicleId?: string | null;
  vehicle?: Vehicle | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface DispatchSettings {
  tenantId: string;
  allowPlatformDrivers: boolean;
  maxOwnAttempts: number;
  platformEnabledAt?: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
}

export interface JoinRequest {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  phone: string;
  requestedRole: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantJoinCode {
  enabled: boolean;
  joinCode: string | null;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  allowedIps: string[];
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface CreatedApiKey {
  id: string;
  name: string;
  apiKey: string;
  keyPrefix: string;
}

export interface PlatformDriverRow {
  driverId: string;
  shiftStatus: ShiftStatus;
  createdAt: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseVerifiedAt: string | null;
  vehicle: {
    id: string;
    licensePlate: string;
    vehicleClass: VehicleClass;
    insuranceExpiry?: string | null;
  } | null;
  eligible: boolean;
  blocker: string | null;
}

export interface PlatformDriverUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  createdAt: string;
}

export interface PlatformDriverItem extends PlatformDriverRow {
  user?: PlatformDriverUser;
}

export interface PublicTracking {
  trackingCode: string;
  status: ShipmentStatus | string;
  priority: PriorityTier | string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  createdAt?: string;
}

export interface LiveTripPosition {
  lat: number;
  lng: number;
  ts: number;
  heading?: number;
  eta?: number | null;
}

export interface LiveTripSubscribeResponse {
  ok: boolean;
  status?: string;
  destLat?: number;
  destLng?: number;
  error?: string;
}


