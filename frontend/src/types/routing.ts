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

export interface RouteGeometry {
  type: "LineString";
  coordinates: number[][];
}

export interface RoutePreview {
  orderIds: number[];
  estimatedTime: number;
  totalDistance: number;
  totalWeight: number;
  routeGeometry: GeoJSON.LineString | null;
  mapPoints: {
    lng: number;
    lat: number;
    label: string;
    completed?: boolean;
  }[];
}

export interface ActiveDeliveryPoint {
  lng: number;
  lat: number;
  label: string;
}

export interface MapPoint {
  orderId?: number;
  lng: number;
  lat: number;
  label: string;
  status?: string;
  completed?: boolean;
}

export interface ActiveDeliveryLine {
  from: number;
  to: number;
}

export interface TrafficInfo {
  estimatedTime: number;
  totalDistance: number;
  totalWeight?: number;
  trafficEnabled?: boolean;
}

export interface ActiveDelivery {
  tripId: string;
  tripNumericId: number;
  robotId: string;
  eta: number;
  mapPoints: {
    lng: number;
    lat: number;
    label: string;
    completed?: boolean;
  }[];
  mapLines?: unknown[];
  routeGeometry?: GeoJSON.LineString | null;
  traveledPath?: GeoJSON.LineString | null;
  robotPosition?: {
    lng: number;
    lat: number;
  } | null;
  status: string;
  trafficInfo?: TrafficInfo;
}
