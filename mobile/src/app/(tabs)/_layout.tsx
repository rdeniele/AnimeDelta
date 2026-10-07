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
        tabBarActiveTintColor: "#8b5cf6",
        tabBarInactiveTintColor: light ? "#6a5e8c" : "#a99fc4",
        tabBarStyle: {
          backgroundColor: light ? "#ffffff" : "#110a1f",
          borderTopColor: light ? "#d9cff2" : "#2c2047",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: light ? "#f7f4ff" : "#0a0612" },
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
