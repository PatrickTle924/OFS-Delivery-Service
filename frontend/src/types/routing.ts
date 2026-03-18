export interface Order {
  id: string;
  weight: number;
  address: string;
  time: string;
  price: number;
  selected?: boolean;
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

export interface ActiveDelivery {
  tripId: string;
  robotId: string;
  eta: number;
  mapPoints: { x: number; y: number; label: string }[];
  mapLines: { from: number; to: number }[];
}
