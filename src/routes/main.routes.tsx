import { createStackNavigator } from "@react-navigation/stack";
import { FinishedServices } from "../screens/FinishedServices";
import { Repair } from "../screens/Repair";
import { AppRoutes } from "./app.routes";
import { MultiRepair } from "../screens/MultiRepair";
import { Budgets } from "../screens/Budgets";
import { AppState, View } from "react-native";
import { useEffect, useState } from "react";
import { Loading } from "../components/Loading";
import { useAuth } from "../auth/AuthContext";
import { Login } from "../screens/Login";
import { OrganizationSetup } from "../screens/OrganizationSetup";
import { OrganizationProfile } from "../screens/OrganizationProfile";
import { MaintenanceReminders } from "../screens/MaintenanceReminders";
import { EquipmentLabels } from "../screens/EquipmentLabels";
import { syncPendingMaintenances } from "../services/offlineMaintenance";
import { createRepairIdempotent } from "../services/API";
import { CommercialProvider } from "../commercial/CommercialContext";
import { MyPlan } from "../screens/MyPlan";
import { Plans } from "../screens/Plans";
import { Onboarding } from "../screens/Onboarding";
import { isOnboardingPending } from "../services/onboarding";
import { DeleteAccount } from "../screens/DeleteAccount";

const { Navigator, Screen } = createStackNavigator();

export const MainRoutes = () => {
  const { session, authenticatedUser, needsOrganization, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!session) { setShowOnboarding(false); setCheckingOnboarding(false); return; }
    setCheckingOnboarding(true);
    isOnboardingPending(session.user.id).then(setShowOnboarding).finally(() => setCheckingOnboarding(false));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const scope = { userId: session.user.id, organizationId: session.organization.id };
    const sync = () => { void syncPendingMaintenances(scope, createRepairIdempotent); };
    sync();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") sync(); });
    return () => subscription.remove();
  }, [session]);

  if (loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Loading />
      </View>
    );
  }

  const routes = (
    <Navigator
      screenOptions={{ headerShown: false }}
    >
      {!authenticatedUser ? (
        <Screen name="Login" component={Login} />
      ) : needsOrganization || !session ? (
        <Screen name="OrganizationSetup" component={OrganizationSetup} />
      ) : (
        <>
          {showOnboarding ? <Screen name="Onboarding" component={Onboarding} /> : null}
          <Screen name="MainTabs" component={AppRoutes} />
          <Screen name="Repair" component={Repair} />
          <Screen name="MultiRepair" component={MultiRepair} />
          <Screen name="FinishedServices" component={FinishedServices} />
          <Screen name="Budgets" component={Budgets} />
          <Screen name="OrganizationProfile" component={OrganizationProfile} />
          <Screen name="MaintenanceReminders" component={MaintenanceReminders} />
          <Screen name="EquipmentLabels" component={EquipmentLabels} />
          <Screen name="MyPlan" component={MyPlan} />
          <Screen name="Plans" component={Plans} />
          <Screen name="DeleteAccount" component={DeleteAccount} />
        </>
      )}
    </Navigator>
  );
  return session ? <CommercialProvider>{routes}</CommercialProvider> : routes;
};
