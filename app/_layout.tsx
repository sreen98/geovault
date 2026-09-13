import "../global.css";
import { defineAutoBackupTask } from "../src/services/auto-backup.service";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Must be defined at module level before any component renders
defineAutoBackupTask();
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold
} from '@expo-google-fonts/inter';
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "../src/contexts/ThemeContext";
import { useSettingsStore } from "../src/stores/settings.store";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    // Required by react-native-gesture-handler, which backs drag-to-reorder
    // inside collections.
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

function RootLayoutInner() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.onSurface,
          headerTitleStyle: {
            fontFamily: "Manrope_600SemiBold",
            color: colors.onSurface,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="place/new"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="place/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="place/edit/[id]"
          options={{
            headerShown: true,
            title: "Edit Place",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="collection/new"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="collection/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="collection/edit/[id]"
          options={{
            headerShown: true,
            title: "Edit Collection",
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}
