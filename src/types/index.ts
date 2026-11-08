export type UserRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'DISPATCHER' | 'DRIVER';
export type ShipmentStatus = 'PENDING' | 'DISPATCHING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
export type PriorityTier = 'STANDARD' | 'EXPRESS' | 'URGENT';
export type ShiftStatus = 'OFFLINE' | 'AVAILABLE' | 'ON_BREAK' | 'BUSY';
export type VehicleClass = 'MOTORCYCLE' | 'SEDAN' | 'VAN' | 'TRUCK';

export interface UserContext { userId: string; tenantId: string | null; role: UserRole }

export interface Shipment {
  id: string; tenantId: string; trackingCode: string; status: ShipmentStatus; priority: PriorityTier;
  recipientName: string; recipientPhone: string; recipientAddress: string; recipientEmail?: string;
  recipientLat?: number; recipientLng?: number;
  weightKg: number; lengthCm: number; widthCm: number; heightCm: number;
  assignedDriverId?: string; deliveryWindowStart?: string; deliveryWindowEnd?: string;
  createdAt: string; updatedAt: string;
}

export interface DriverJobView extends Omit<Shipment, 'recipientName' | 'recipientPhone' | 'recipientAddress'> {
  recipientName?: string; recipientPhone?: string; recipientAddress?: string;
  approxDestLat?: number; approxDestLng?: number; recipientDetailsReleased: boolean;
}

export interface AssignmentOffer {
  id: string; tenantId: string; driverId: string; shipmentId: string;
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED';
  respondBy: string;
  preview?: { weightKg: number; priority: PriorityTier; approxDistanceKm?: number };
}

export interface Vehicle {
  id: string; tenantId: string; licensePlate: string; vehicleClass: VehicleClass;
  maxWeightKg: number; volumeM3: number; maintenanceState: 'OPERATIONAL' | 'IN_MAINTENANCE';
  insuranceExpiry?: string; assignedDriverId?: string;
}

export interface AlertNotification {
  id: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; title: string; body: string;
  shipmentId?: string; acknowledgedAt?: string; createdAt: string;
}

export interface DriverTelemetry {
  driverId: string; lat: number; lng: number; ts: number; speedKmh: number; heading: number; shipmentId?: string;
}

export interface Paginated<T> { data: T[]; page: number; limit: number; total: number; totalPages: number }
export interface DispatchSettings { tenantId: string; allowPlatformDrivers: boolean; maxOwnAttempts: number; platformEnabledAt?: string }
