import type { ColorValue } from "react-native";
import { useColors } from "@/lib/theme";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { resolveFontFamily } from "@/lib/fonts";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue | null; size: number }) {
    return <Ionicons name={name} size={size} color={(color ?? undefined) as string | undefined} />;
  };

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: resolveFontFamily(undefined, 600) },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Bugün", tabBarIcon: icon("today-outline") }} />
      <Tabs.Screen name="appointments" options={{ title: "Randevular", tabBarIcon: icon("calendar-outline") }} />
      <Tabs.Screen name="customers" options={{ title: "Müşteriler", tabBarIcon: icon("people-outline") }} />
      <Tabs.Screen name="more" options={{ title: "Daha fazla", tabBarIcon: icon("menu-outline") }} />
    </Tabs>
  );
}
