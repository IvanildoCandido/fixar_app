import { createStackNavigator } from "@react-navigation/stack";
import { FinishedServices } from "../screens/FinishedServices";
import { Repair } from "../screens/Repair";
import { AppRoutes } from "./app.routes";
import { MultiRepair } from "../screens/MultiRepair";
import { Budgets } from "../screens/Budgets";
import { AppState, View } from "react-native";
import { useEffect } from "react";
import { Loading } from "../components/Loading";
import { useAuth } from "../auth/AuthContext";
import { Login } from "../screens/Login";
import { OrganizationSetup } from "../screens/OrganizationSetup";
import { OrganizationProfile } from "../screens/OrganizationProfile";
import { MaintenanceReminders } from "../screens/MaintenanceReminders";
import { syncPendingMaintenances } from "../services/offlineMaintenance";
import { createRepairIdempotent } from "../services/API";

const { Navigator, Screen } = createStackNavigator();

export const MainRoutes = () => {
  const { session, authenticatedUser, needsOrganization, loading } = useAuth();

  useEffect(() => {
    if (!session) return;
    const scope = { userId: session.user.id, organizationId: session.organization.id };
    const sync = () => { void syncPendingMaintenances(scope, createRepairIdempotent); };
    sync();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") sync(); });
    return () => subscription.remove();
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Loading />
      </View>
    );
  }

  return (
    <Navigator
      screenOptions={{ headerShown: false }}
    >
      {!authenticatedUser ? (
        <Screen name="Login" component={Login} />
      ) : needsOrganization || !session ? (
        <Screen name="OrganizationSetup" component={OrganizationSetup} />
      ) : (
        <>
          <Screen name="MainTabs" component={AppRoutes} />
          <Screen name="Repair" component={Repair} />
          <Screen name="MultiRepair" component={MultiRepair} />
          <Screen name="FinishedServices" component={FinishedServices} />
          <Screen name="Budgets" component={Budgets} />
          <Screen name="OrganizationProfile" component={OrganizationProfile} />
          <Screen name="MaintenanceReminders" component={MaintenanceReminders} />
        </>
      )}
    </Navigator>
  );
};
