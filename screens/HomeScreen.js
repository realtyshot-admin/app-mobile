import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
} from "react-native";

const WHATSAPP_NUMBER = "+5491122359527"; // ← Cambiá por tu número
const WHATSAPP_MESSAGE = "Hola, necesito ayuda";

export default function HomeScreen({ navigation }) {
  const openWhatsApp = async () => {
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

    try {
      await Linking.openURL(whatsappUrl);
    } catch (err) {
      console.error("Error al abrir WhatsApp:", err);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.brand}>
          <Text style={styles.logoText}>Realty Shot</Text>
          <Text style={styles.subtitle}>Sube tus imágenes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido a Realty Shot</Text>

          <Text style={styles.text}>
            Sube hasta 50 imágenes de tus propiedades en formatos JPG, JPEG o HEIC,
            en calidad HD, 4K u 8K, para que nuestro equipo pueda editarlas.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Upload")}
          >
            <Text style={styles.buttonText}>Subir imágenes</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Realty Shot — Servicio de edición fotográfica
        </Text>

        {/* Texto de ayuda */}
        <TouchableOpacity onPress={openWhatsApp}>
          <Text style={styles.helpLink}>Necesito ayuda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  brand: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 15,
    color: "#444",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
  helpLink: {
    marginTop: 16,
    fontSize: 12,
    color: "#999",
    textDecorationLine: "underline",
  },
});