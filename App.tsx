import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

import { NavigationContainer } from "@react-navigation/native";
import styled from "styled-components/native";
import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";

import { FixarThemeProvider } from "./src/global/styles/ThemeContext";
import { AuthProvider } from "./src/auth/AuthContext";
import {
  useFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from "@expo-google-fonts/inter";

async function checkForUpdates() {
  try {
    if (__DEV__) return;

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      // Aguarde a atualização ser baixada e pronta para instalar
      await Updates.reloadAsync();
    }
  } catch (e) {
    console.log(e);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const View = styled.View`
  width: 100%;
  height: 100%;
`;
import { MainRoutes } from "./src/routes/main.routes";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore "already hidden/already prevented" errors during fast refresh.
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    async function hideSplashWhenReady() {
      if (!fontsLoaded && !fontError) return;

      try {
        await SplashScreen.hideAsync();
      } catch {
        // Ignore hide errors during hot reload/reattach.
      }
    }
    hideSplashWhenReady();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View>
      <FixarThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <MainRoutes />
          </NavigationContainer>
        </AuthProvider>
      </FixarThemeProvider>
    </View>
  );
}
