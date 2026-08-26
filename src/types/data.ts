export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  document: string;
}
export interface Device {
  Customer: Customer;
  id: string;
  reference: string;
  model: string;
  brand: string;
  location: string;
}
export interface Part {
  id: string;
  name: string;
  price: number;
}
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}
export interface Repair {
  id: string;
  Customer: Customer;
  Device: Device;
  date: string;
  comments: string;
  parts: Part[];
  services: Service[];
  total: string;
}

export interface MaintenanceReminder {
  id: string;
  dueAt: string;
  intervalDays: number;
  Customer: Customer;
  Device: Device;
}
export interface Period {
  start: number;
  startFormatted: string;
  end: number;
  endFormatted: string;
}
export interface CustomerDevices extends Customer {
  Devices: Device;
}

export interface CustomerStats extends Customer {
  devicesQuantity: number;
}
