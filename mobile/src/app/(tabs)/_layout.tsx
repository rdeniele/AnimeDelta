import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

type Icon = keyof typeof Ionicons.glyphMap;
const TABS: { name: string; title: string; icon: Icon; active: Icon }[] = [
  { name: "index", title: "Home", icon: "home-outline", active: "home" },
  { name: "browse", title: "Browse", icon: "compass-outline", active: "compass" },
  { name: "search", title: "Search", icon: "search-outline", active: "search" },
  { name: "my-list", title: "My List", icon: "bookmark-outline", active: "bookmark" },
  { name: "profile", title: "Profile", icon: "person-outline", active: "person" },
];

export default function TabsLayout() {
  const light = useColorScheme() === "light";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#e11d48",
        tabBarInactiveTintColor: light ? "#7a5f6b" : "#a79ba8",
        tabBarStyle: {
          backgroundColor: light ? "#ffffff" : "#0e0a14",
          borderTopColor: light ? "#ead3da" : "#2c2036",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: light ? "#fbf6f7" : "#07050c" },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarAccessibilityLabel: t.title,
            tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? t.active : t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
