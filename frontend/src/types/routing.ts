export interface Order {
  id: number;
  label: string;
  weight: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price: number;
  lat: number;
  lng: number;
  status: string;
  orderedAt?: string | null;
}

export interface RouteStop {
  label: string;
  address: string;
}

export interface RouteOption {
  id: number;
  title: string;
  subtitle: string;
  estimatedTime: number;
  totalDistance: number;
  stops: RouteStop[];
}

export interface ActiveDeliveryPoint {
  lng: number;
  lat: number;
  label: string;
}

export interface ActiveDeliveryLine {
  from: number;
  to: number;
}

export interface ActiveDelivery {
  tripId: string;
  robotId: string;
  eta: number;
  mapPoints: ActiveDeliveryPoint[];
  mapLines: ActiveDeliveryLine[];
}
