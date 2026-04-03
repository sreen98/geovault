import { useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function AddRoute() {
  const { colors } = useTheme();

  useEffect(() => {
    router.push("/place/new");
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
