import { ScrollView, Text, View } from "react-native";
import { Header } from "@/components/navigation/Header";

export default function Privacy() {
  return (
    <View className="flex-1">
      <Header title="Privacy" back />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-muted text-[15px] leading-6">
          Your account is an anonymous device profile. The app stores a session token in the device keystore and keeps preferences, search history and cached anime
          information locally.
        </Text>
        <Text className="text-muted text-[15px] leading-6">
          Your watch progress, history and My List are saved to your own backend so they follow you across launches. No provider keys or database credentials are ever
          stored in the app.
        </Text>
      </ScrollView>
    </View>
  );
}
