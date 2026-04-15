import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = "https://last-page-979962841585.southamerica-east1.run.app";

export default function CompleteProfileScreen() {
  const { loadProfile } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [cuit, setCuit] = useState("");
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!name || !lastName || !phone || !company || !address || !cuit) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        Alert.alert("Error", "No se encontró la sesión");
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Guardar perfil
      const { data, error } = await supabase
        .from("users")
        .update({
          name,
          lastname: lastName,
          phone,
          company_name: company,
          address,
          cuit,
        })
        .eq("id", userId)
        .select();

      if (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        Alert.alert("Error", "No se encontró el usuario");
        setLoading(false);
        return;
      }

      // Llamar a /complete-profile
      const response = await fetch(`${BACKEND_URL}/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        Alert.alert("Error", result.error || "No se pudieron crear las carpetas");
        setLoading(false);
        return;
      }

      // Actualizar context
      await loadProfile(userId);
      Alert.alert("Éxito", "¡Perfil completado!");

    } catch (err) {
      console.error("Error:", err.message);
      Alert.alert("Error", err.message || "Hubo un error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Completá tu perfil</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Nombre" 
          value={name}
          onChangeText={setName} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Apellido" 
          value={lastName}
          onChangeText={setLastName} 
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Empresa" 
          value={company}
          onChangeText={setCompany} 
        />
        <TextInput
          style={styles.input}
          placeholder="Dirección"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="CUIT / CUIL"
          value={cuit}
          keyboardType="numeric"
          onChangeText={setCuit}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <Button title="Guardar perfil" onPress={saveProfile} />
        )}

        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  signOutButton: {
    marginTop: 16,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 15,
    color: "#FF3B30",
  },
});