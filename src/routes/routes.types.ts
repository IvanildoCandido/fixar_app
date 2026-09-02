import { Customer, Device } from "../types/data";

export type RootParamList = {
  Login: undefined;
  MainTabs: undefined;
  Repair: { customer?: Customer; device?: Device; localId?: string } | undefined;
  MyPlan: undefined;
  Plans: undefined;
  Onboarding: undefined;
};
