import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import ImageGrid from "../components/ImageGrid";
import { supabase } from "../lib/supabase";

const API_BASE = "https://last-page-979962841585.southamerica-east1.run.app";
const MAX_IMAGES = 50;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const MAX_WARMUP_ATTEMPTS = 10;
const WARMUP_INTERVAL_MS = 3000;

export default function UploadScreen({ navigation }) {
  const [formData, setFormData] = useState({
    address: "",
    comentarios: "",
    watermark: false,
  });

  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [precio, setPrecio] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galería para que puedas subir las imágenes."
        );
      }
    })();

    // Traer precio del mes actual
    const fetchPrecio = async () => {
      const ahora = new Date();
      const mes = ahora.getMonth() + 1;
      const anio = ahora.getFullYear();

      const { data, error } = await supabase
        .from("precios")
        .select("precio")
        .eq("mes", mes)
        .eq("anio", anio)
        .single();

      if (!error && data) {
        setPrecio(data.precio);
      }
    };

    fetchPrecio();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleWatermark = () => {
    setFormData((prev) => ({ ...prev, watermark: !prev.watermark }));
  };

  const pickImages = async () => {
    try {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        Alert.alert("Límite alcanzado", `Solo puedes subir hasta ${MAX_IMAGES} imágenes.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(remaining, 50),
        quality: 1,
      });

      if (result.canceled) return;

      const picked = (result.assets || []).map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName || asset.uri.split("/").pop(),
        mimeType: asset.mimeType || "image/jpeg",
      }));

      setImages((prev) => {
        const merged = [...prev, ...picked];
        return merged.slice(0, MAX_IMAGES);
      });

      setMessage("");
    } catch (err) {
      console.error("Error picking images:", err);
      Alert.alert("Error", "No se pudieron seleccionar las imágenes.");
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const chunkFiles = (list, size) => {
    const chunks = [];
    for (let i = 0; i < list.length; i += size) {
      chunks.push(list.slice(i, i + size));
    }
    return chunks;
  };

  const buildFileFromAsset = (asset) => {
    const name = asset.fileName || asset.uri.split("/").pop() || "image.jpg";
    const lower = name.toLowerCase();

    let type = "image/jpeg";
    if (lower.endsWith(".heic") || lower.endsWith(".heif")) {
      type = "image/heic";
    } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      type = "image/jpeg";
    }

    return { uri: asset.uri, name, type };
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForServer = async () => {
    for (let attempt = 1; attempt <= MAX_WARMUP_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/ready`, { method: "GET" });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "ready") {
            return true;
          }
        }

        await sleep(WARMUP_INTERVAL_MS);
      } catch (err) {
        await sleep(WARMUP_INTERVAL_MS);
      }
    }
    return false;
  };

  const uploadBatchWithRetry = async (batch, batchIndex, totalBatches, token) => {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const data = new FormData();
        data.append("address", formData.address);
        data.append("comentarios", formData.comentarios);
        data.append("watermark", formData.watermark ? "true" : "false");
        data.append("totalImages", images.length);
        data.append("batchIndex", batchIndex);
        data.append("totalBatches", totalBatches);

        batch.forEach((asset) => {
          data.append("images", buildFileFromAsset(asset));
        });

        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const result = await res.json();

        if (result.failed && result.failed > 0) {
          console.warn(`⚠️ Batch ${batchIndex + 1}: ${result.failed} imágenes fallaron en el servidor`);
        }

        return { success: true, uploaded: result.uploaded || batch.length, failed: result.failed || 0 };

      } catch (err) {
        lastError = err;

        if (attempt < MAX_RETRIES) {
          setMessage(`Reintentando... (intento ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    return { success: false, uploaded: 0, failed: batch.length };
  };

  const doUpload = async () => {
    setLoading(true);
    setProgress(0);

    // ← Punto 2: mostrar "Cargando imágenes" mientras espera al servidor
    setMessage("Cargando imágenes...");

    try {
      const serverReady = await waitForServer();

      if (!serverReady) {
        Alert.alert(
          "Servidor no disponible",
          "No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo."
        );
        setMessage("");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sesión inválida o expirada. Iniciá sesión nuevamente.");
      }
      const token = session.access_token;

      const batches = chunkFiles(images, BATCH_SIZE);
      const totalBatches = batches.length;
      let totalUploaded = 0;
      let totalFailed = 0;

      for (let i = 0; i < batches.length; i++) {
        // ← A partir de acá muestra el progreso real
        setMessage(`Subiendo imágenes... (${Math.min((i + 1) * BATCH_SIZE, images.length)} de ${images.length})`);

        const result = await uploadBatchWithRetry(batches[i], i, totalBatches, token);

        totalUploaded += result.uploaded;
        totalFailed += result.failed;

        setProgress(Math.floor(((i + 1) / totalBatches) * 100));
      }

      setProgress(100);
      setImages([]);
      setFormData({ address: "", comentarios: "", watermark: false });

      if (totalFailed === 0) {
        setMessage(`✅ ${totalUploaded} imágenes subidas correctamente.`);
        Alert.alert(
          "¡Subida exitosa!",
          `${totalUploaded} imágenes subidas. Tus fotos estarán listas en 48 hs.`,
          [{ text: "OK", onPress: () => navigation.navigate("Main") }]
        );
      } else if (totalUploaded === 0) {
        setMessage("❌ No se pudo subir ninguna imagen. Intentá de nuevo.");
        Alert.alert(
          "Error en la subida",
          "No se pudo subir ninguna imagen. Verificá tu conexión e intentá de nuevo."
        );
      } else {
        setMessage(`⚠️ Se subieron ${totalUploaded} de ${images.length} imágenes. ${totalFailed} no pudieron subirse.`);
        Alert.alert(
          "Subida parcial",
          `Se subieron ${totalUploaded} de ${totalUploaded + totalFailed} imágenes.\n\n${totalFailed} no pudieron subirse. Te recomendamos volver a intentarlo.`,
          [{ text: "OK", onPress: () => navigation.navigate("Main") }]
        );
      }

    } catch (err) {
      console.error("Error general:", err);
      Alert.alert("Error", err.message || "Ocurrió un error inesperado.");
      setMessage("Error: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.address || images.length === 0) {
      Alert.alert(
        "Datos incompletos",
        "Debes indicar la dirección y subir al menos una imagen."
      );
      return;
    }

    // ← Punto 1: cartel de confirmación con precio
    const totalEstimado = precio !== null
      ? `$${(images.length * precio).toFixed(2)}`
      : "precio no disponible";

    const precioTexto = precio !== null
      ? `Precio por imagen: $${precio}\nTotal estimado: ${totalEstimado}`
      : "No hay precio configurado para este mes.";

    Alert.alert(
      "Confirmar pedido",
      `Estás cargando un pedido de ${images.length} imagen${images.length !== 1 ? "es" : ""}.\n\n${precioTexto}\n\nEste monto se cobrará a fin de mes. ¿Estás seguro?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, subir", onPress: doUpload },
      ]
    );
  };

  const openGuide = () => {
    Linking.openURL(
      "https://drive.google.com/file/d/1HSwFHTJU_S_ULFEp8f3sRNvDUGZ2OyN8/preview"
    ).catch(() => {
      Alert.alert("Error", "No se pudo abrir la guía.");
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subir imágenes</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Dirección de la propiedad"
            value={formData.address}
            onChangeText={(text) => handleChange("address", text)}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Comentarios adicionales (opcional)"
            value={formData.comentarios}
            onChangeText={(text) => handleChange("comentarios", text)}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.checkboxRow} onPress={toggleWatermark}>
            <View style={[styles.checkbox, formData.watermark && styles.checkboxChecked]}>
              {formData.watermark && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>Quiero agregar mi marca de agua</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Text style={styles.pickButtonText}>
              Seleccionar imágenes ({images.length}/{MAX_IMAGES})
            </Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <ImageGrid images={images} onRemove={removeImage} />
          )}

          {/* Precio estimado debajo de las imágenes */}
          {images.length > 0 && precio !== null && (
            <View style={styles.precioEstimado}>
              <Text style={styles.precioTexto}>
                {images.length} imágenes × ${precio} = <Text style={styles.precioTotal}>${(images.length * precio).toFixed(2)}</Text>
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
              <ActivityIndicator style={{ marginTop: 8 }} />
            </View>
          )}

          {message ? <Text style={styles.infoText}>{message}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Subiendo..." : "Subir"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guideButton} onPress={openGuide}>
            <Text style={styles.guideButtonText}>
              📘 Ver guía rápida Realty Shot
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backText: { color: "#2563eb", fontSize: 14, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9ca3af",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  checkboxInner: { width: 10, height: 10, backgroundColor: "#ffffff", borderRadius: 2 },
  checkboxLabel: { fontSize: 14, color: "#111827" },
  pickButton: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 8,
  },
  pickButtonText: { color: "#111827", fontSize: 14, fontWeight: "500" },
  precioEstimado: {
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    alignItems: "center",
  },
  precioTexto: { fontSize: 13, color: "#374151" },
  precioTotal: { fontWeight: "700", color: "#2563eb" },
  progressContainer: { marginTop: 12, alignItems: "center" },
  progressBarBackground: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#2563eb" },
  progressText: { marginTop: 4, fontSize: 12, color: "#374151" },
  infoText: { marginTop: 8, fontSize: 13, color: "#374151" },
  submitButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  guideButton: { marginTop: 12, alignItems: "center" },
  guideButtonText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
});