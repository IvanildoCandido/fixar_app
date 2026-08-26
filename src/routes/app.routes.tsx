import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Customers } from "../screens/Customers";
import { Home } from "../screens/Home";
import { useTheme } from "styled-components/native";
import { House, Package, Snowflake, Users, Wrench } from "lucide-react-native";
import { Parts } from "../screens/Parts";
import { Services } from "../screens/Services";
import { Devices } from "../screens/Devices";
import { Platform } from "react-native";

const { Navigator, Screen } = createBottomTabNavigator();

export const AppRoutes = () => {
  const theme = useTheme();
  return (
    <Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 90 : 60,
          paddingTop: 8,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Screen
        options={{
          tabBarLabel: "Peças",
          tabBarIcon: ({ size, color }) => (
            <Package size={size + 6} color={color} strokeWidth={2} />
          ),
        }}
        name="Catálogo"
        component={Parts}
      />
      <Screen
        options={{
          tabBarLabel: "Equipamentos",
          tabBarIcon: ({ size, color }) => (
            <Snowflake size={size + 6} color={color} strokeWidth={2} />
          ),
        }}
        name="Ativos"
        component={Devices}
      />
      <Screen
        options={{
          tabBarIcon: ({ size, color }) => (
            <House size={size + 6} color={color} strokeWidth={2} />
          ),
        }}
        name="Home"
        component={Home}
      />
      <Screen
        options={{
          tabBarIcon: ({ size, color }) => (
            <Wrench size={size + 6} color={color} strokeWidth={2} />
          ),
        }}
        name="Serviços"
        component={Services}
      />
      <Screen
        options={{
          tabBarIcon: ({ size, color }) => (
            <Users size={size + 6} color={color} strokeWidth={2} />
          ),
        }}
        name="Clientes"
        component={Customers}
      />
    </Navigator>
  );
};
