import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentErrorScreen() {
  const router = useRouter();

  const { refNo } = useLocalSearchParams<{
    refNo?: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="close" size={52} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Pembayaran Gagal</Text>

        <Text style={styles.description}>
          Pembayaran tidak berhasil diproses. Silakan coba kembali.
        </Text>

        {refNo ? <Text style={styles.refNo}>Ref No: {refNo}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.buttonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },

  description: {
    color: "#AAAAAA",
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },

  refNo: {
    color: "#777777",
    fontSize: 12,
    marginTop: 16,
  },

  button: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  buttonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
});
