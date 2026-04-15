import { useState, useEffect } from "react";
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
} from "react-native";
import { supabase } from "../lib/supabase";

export default function ResetPasswordScreen({ navigation }) {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert(
        "¡Listo!",
        "Contraseña actualizada con éxito. Ya podés iniciar sesión.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  };

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.subtitle}>Verificando enlace...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>
          Elegí una contraseña de al menos 6 caracteres.
        </Text>

        <TextInput
          placeholder="Nueva contraseña"
          secureTextEntry
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholderTextColor="#6b7280"
        />

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Actualizar contraseña" onPress={handleReset} />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30 },
  title: { fontSize: 24, marginBottom: 12, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
});