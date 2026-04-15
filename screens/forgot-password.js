import { useState } from "react";
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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresá tu email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setStep(2);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert("Error", "Completá el código y la nueva contraseña");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    if (verifyError) {
      setLoading(false);
      Alert.alert("Error", "Código incorrecto o expirado. Intentá de nuevo.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateError) {
      Alert.alert("Error", updateError.message);
    } else {
      Alert.alert(
        "¡Listo!",
        "Contraseña actualizada con éxito. Ya podés iniciar sesión."
      );
      // AuthContext detecta la sesión y redirige automáticamente
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>

        {step === 1 && (
          <>
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresá tu email y te enviamos un código para crear una nueva contraseña.
            </Text>

            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#6b7280"
            />

            {loading ? (
              <ActivityIndicator />
            ) : (
              <Button title="Enviar código" onPress={handleSendOtp} />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.title}>Ingresá el código</Text>
            <Text style={styles.subtitle}>
              Revisá tu email y pegá el código que te enviamos.
            </Text>

            <TextInput
              placeholder="Código del email"
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              autoCapitalize="none"
              keyboardType="number-pad"
              placeholderTextColor="#6b7280"
            />

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
              <Button title="Actualizar contraseña" onPress={handleResetPassword} />
            )}

            <Text style={styles.link} onPress={() => setStep(1)}>
              ¿No recibiste el código? Volver
            </Text>
          </>
        )}

        <Text style={styles.link} onPress={() => navigation.goBack()}>
          Volver al login
        </Text>

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
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "blue",
  },
});