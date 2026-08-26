import { Customer, Device } from "../types/data";

export type RootParamList = {
  Login: undefined;
  MainTabs: undefined;
  Repair: { customer: Customer; device: Device } | undefined;
};
