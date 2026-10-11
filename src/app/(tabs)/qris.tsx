import { Ionicons } from "@expo/vector-icons";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showAlert } from "../../components/AppAlert";
import BackHeader from "../../components/BackHeader";

const { width, height } = Dimensions.get("window");

const SCAN_SIZE = width * 0.72;

export default function QRISScreen() {
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  const scanLine = useRef(new Animated.Value(0)).current;

  // ============================================
  // CAMERA PERMISSION
  // ============================================

  useEffect(() => {
    if (!permission) return;

    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // ============================================
  // ANIMASI GARIS SCANNER
  // ============================================

  useEffect(() => {
    if (!permission?.granted || !scanning) {
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),

        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [permission?.granted, scanning]);

  // ============================================
  // QR BERHASIL DISCANN
  // ============================================

  const handleQRCode = ({ data }: { data: string }) => {
    if (!scanning || processing) {
      return;
    }

    console.log("[QRIS Scanner] QR detected:", data);

    setScanning(false);
    setProcessing(true);

    /**
     * Kalau QR berisi wallet address:
     *
     * 0x123456...
     *
     * langsung kirim ke halaman tujuan.
     */

    router.back();

    // Kalau nanti kamu punya halaman send:
    //
    // router.replace({
    //   pathname: "/send",
    //   params: {
    //     walletAddress: data,
    //   },
    // });
  };

  // ============================================
  // PILIH DARI GALERI
  // ============================================

  const openGallery = async () => {
    if (processing) return;

    try {
      setProcessing(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        setProcessing(false);
        return;
      }

      const imageUri = result.assets[0].uri;

      console.log("[QRIS Scanner] Gallery image:", imageUri);

      // Scan QR dari gambar
      const scanResult = await Camera.scanFromURLAsync(imageUri, ["qr"]);

      console.log("[QRIS Scanner] Gallery scan:", scanResult);

      if (!scanResult.length) {
        showAlert(
          "QR Code tidak ditemukan",
          "Pastikan gambar yang dipilih memiliki QR Code yang jelas.",
        );

        setProcessing(false);
        return;
      }

      const qrData = scanResult[0].data;

      console.log("[QRIS Scanner] Gallery QR:", qrData);

      setScanning(false);

      // Contoh:
      router.back();

      // Kalau nanti mau kirim ke halaman tertentu:
      //
      // router.replace({
      //   pathname: "/send",
      //   params: {
      //     walletAddress: qrData,
      //   },
      // });
    } catch (error) {
      console.error("[QRIS Scanner] Gallery error:", error);

      showAlert("Gagal membaca QR", "QR Code pada gambar tidak dapat dibaca.");
    } finally {
      setProcessing(false);
    }
  };

  // ============================================
  // PERMISSION BELUM SIAP
  // ============================================

  if (!permission) {
    return (
      <View style={styles.blackScreen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.blackScreen}>
        <Ionicons name="camera-outline" size={64} color="#FFFFFF" />

        <Text style={styles.permissionTitle}>Camera Permission Required</Text>

        <Text style={styles.permissionText}>
          Izinkan akses kamera untuk melakukan scan QR Code.
        </Text>

        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </Pressable>

        <Pressable
          style={styles.closeButtonPermission}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // ============================================
  // CAMERA SCREEN
  // ============================================

  const lineTranslateY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCAN_SIZE / 2 + 10, SCAN_SIZE / 2 - 10],
  });

  return (
    <View style={styles.container}>
      {/* CAMERA */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={scanning}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanning ? handleQRCode : undefined}
      />

      {/* DARK OVERLAY */}
      <View style={styles.overlay} />

      {/* HEADER */}
      <View style={styles.header}>
        <BackHeader title="Scan QR Code" />
      </View>

      {/* SCAN BOX */}
      <View style={styles.scanArea}>
        <View style={styles.scanBox}>
          {/* TOP LEFT */}
          <View style={[styles.corner, styles.topLeft]} />

          {/* TOP RIGHT */}
          <View style={[styles.corner, styles.topRight]} />

          {/* BOTTOM LEFT */}
          <View style={[styles.corner, styles.bottomLeft]} />

          {/* BOTTOM RIGHT */}
          <View style={[styles.corner, styles.bottomRight]} />

          {/* MOVING YELLOW LINE */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: lineTranslateY,
                  },
                ],
              },
            ]}
          />
        </View>
      </View>

      {/* DESCRIPTION */}
      <Text style={styles.description}>
        Align the QR code to automatically scan the wallet address
      </Text>

      {/* GALLERY */}
      <Pressable
        style={styles.galleryButton}
        onPress={openGallery}
        disabled={processing}
      >
        <View style={styles.galleryCircle}>
          <Ionicons name="images-outline" size={34} color="#FFFFFF" />
        </View>

        <Text style={styles.galleryText}>Photos</Text>
      </Pressable>

      {/* PROCESSING */}
      {processing && (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#FFFFFF" />

          <Text style={styles.processingText}>Reading QR Code...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  blackScreen: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  permissionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },

  permissionText: {
    color: "#AAA",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },

  permissionButton: {
    marginTop: 30,
    backgroundColor: "#FFF",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
  },

  permissionButtonText: {
    color: "#000",
    fontWeight: "700",
  },

  closeButtonPermission: {
    marginTop: 15,
    padding: 12,
  },

  closeButtonText: {
    color: "#AAA",
    fontSize: 15,
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  backButton: {
    width: 44,
    height: 44,

    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 25,
    fontWeight: "500",
  },

  scanArea: {
    position: "absolute",
    top: height * 0.25,
    left: 0,
    right: 0,

    alignItems: "center",
  },

  scanBox: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,

    position: "relative",
  },

  corner: {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 14,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 14,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 14,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 14,
  },

  scanLine: {
    position: "absolute",

    left: 14,
    right: 14,

    top: "50%",

    height: 3,

    backgroundColor: "#F4C542",

    shadowColor: "#F4C542",
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 8,
  },

  description: {
    position: "absolute",

    top: height * 0.67,

    left: 20,
    right: 20,

    color: "#FFFFFF",
    fontSize: 15,

    textAlign: "center",
  },

  galleryButton: {
    position: "absolute",

    bottom: 70,

    left: 0,
    right: 0,

    alignItems: "center",
  },

  galleryCircle: {
    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor: "rgba(255,255,255,0.12)",

    alignItems: "center",
    justifyContent: "center",
  },

  galleryText: {
    color: "#FFFFFF",
    fontSize: 16,

    marginTop: 8,
  },

  processing: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    color: "#FFF",
    marginTop: 15,
    fontSize: 15,
  },
});
