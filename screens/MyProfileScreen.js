import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function MyProfileScreen({ navigation }) {
  const { user, userProfile, loadProfile, logout } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [cuit, setCuit] = useState("");

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setLastName(userProfile.lastname || "");
      setPhone(userProfile.phone || "");
      setCompany(userProfile.company_name || "");
      setAddress(userProfile.address || "");
      setCuit(userProfile.cuit || "");
    }
  }, [userProfile]);

  const saveProfile = async () => {
    if (!user) {
      Alert.alert("Error", "No hay sesión activa");
      return;
    }

    try {
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
        .eq("id", user.id)
        .select();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      await loadProfile(user.id);
      Alert.alert("Perfil actualizado", "Tus datos han sido guardados correctamente.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header con botón volver */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Main", { screen: "Tablero" })}
            >
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Image
              source={require("../assets/icon.png")}
              style={styles.smallLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle}>Mi perfil</Text>

          <Text style={styles.label}>Email (no editable)</Text>
          <Text style={styles.staticValue}>{user?.email}</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Nombre de empresa</Text>
          <TextInput style={styles.input} value={company} onChangeText={setCompany} />

          <Text style={styles.label}>Dirección de facturación</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />

          <Text style={styles.label}>CUIT / CUIL</Text>
          <TextInput
            style={styles.input}
            value={cuit}
            onChangeText={setCuit}
            keyboardType="numeric"
          />

          <Button title="Guardar cambios" onPress={saveProfile} />

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: "#2563eb",
    fontSize: 15,
    fontWeight: "500",
  },
  smallLogo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  label: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 14,
    color: "#374151",
  },
  staticValue: {
    paddingVertical: 8,
    fontSize: 16,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 32,
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});