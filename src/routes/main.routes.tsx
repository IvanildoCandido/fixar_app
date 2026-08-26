import { createStackNavigator } from "@react-navigation/stack";
import { FinishedServices } from "../screens/FinishedServices";
import { Repair } from "../screens/Repair";
import { AppRoutes } from "./app.routes";
import { MultiRepair } from "../screens/MultiRepair";
import { Budgets } from "../screens/Budgets";
import { View } from "react-native";
import { Loading } from "../components/Loading";
import { useAuth } from "../auth/AuthContext";
import { Login } from "../screens/Login";
import { OrganizationSetup } from "../screens/OrganizationSetup";
import { OrganizationProfile } from "../screens/OrganizationProfile";

const { Navigator, Screen } = createStackNavigator();

export const MainRoutes = () => {
  const { session, authenticatedUser, needsOrganization, loading } = useAuth();

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
        </>
      )}
    </Navigator>
  );
};
