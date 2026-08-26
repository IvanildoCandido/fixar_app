import { Customer, Device, Part, Period, Service } from "../types/data";

export const defaultDevice: Device = {
  id: "",
  Customer: {
    id: "",
    address: "",
    document: "",
    email: "",
    name: "",
    phone: "",
  },
  reference: "",
  model: "",
  brand: "",
  location: "Selecione um equipamento",
};
export const defaultCustomer: Customer = {
  id: "",
  name: "Selecione um cliente",
  address: "",
  document: "",
  phone: "",
  email: "",
};
export const defaultPeriod: Period = {
  start: 0,
  startFormatted: "Selecione as datas",
  end: 0,
  endFormatted: "",
};
export const defaultPart: Part = {
  id: "",
  name: "",
  price: 0,
};
export const defaultService: Service = {
  id: "",
  name: "",
  description: "",
  price: 0,
};
