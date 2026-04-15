import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Completá email y contraseña");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <Image
            source={require("../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Realty Shot</Text>
          <Text style={styles.brandSubtitle}>Sube tus imágenes</Text>
        </View>

        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#6b7280"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Contraseña"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye" : "eye-off"}
              size={24}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Ingresar" onPress={handleLogin} />
        )}

        <Text
          style={styles.forgotLink}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          ¿Olvidaste tu contraseña? Recuperar
        </Text>

        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
          Crear cuenta
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30 },
  brand: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  title: { fontSize: 24, marginBottom: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  forgotLink: {
    marginTop: 12,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "blue",
  },
});