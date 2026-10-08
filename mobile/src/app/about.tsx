import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";
import { Header } from "@/components/navigation/Header";

export default function About() {
  return (
    <View className="flex-1">
      <Header title="About" back />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="items-center">
          <Image source={require("../../assets/images/logo.png")} style={{ width: 160, height: 160, borderRadius: 32 }} accessibilityLabel="AnimeDelta logo" />
        </View>
        <Text className="text-fg text-lg font-bold">AnimeDelta 1.0.0</Text>
        <Text className="text-muted text-[15px] leading-6">
          A personal, fan-made anime library. It is an original app and is not affiliated with any streaming service.
        </Text>
        <Text className="text-muted text-[15px] leading-6">
          AnimeDelta only plays media supplied by the video provider configured on your own backend, such as official videos from channels that allow embedding, or files
          you have the rights to use. It does not include or bypass DRM, paywalls or advertising of third-party services.
        </Text>
      </ScrollView>
    </View>
  );
}
