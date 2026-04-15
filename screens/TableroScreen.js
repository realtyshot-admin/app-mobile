import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import { supabase } from "../lib/supabase";
import { AuthContext } from "../context/AuthContext";

export default function TableroScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    totalImagenes: 0,
    pedidos: [],
    precio: 0,
    totalDebe: 0,
    driveFolderPublicLink: null,
  });

  const fetchData = async () => {
    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const anio = ahora.getFullYear();

    const inicioMes = new Date(anio, mes - 1, 1).toISOString();
    const finMes = new Date(anio, mes, 1).toISOString();

    const { data: uploads, error: uploadsError } = await supabase
      .from("uploads")
      .select("property_address, total_images, created_at, status, delivery_link")
      .eq("user_id", user.id)
      .gte("created_at", inicioMes)
      .lt("created_at", finMes)
      .order("created_at", { ascending: false });

    if (uploadsError) {
      console.error("Error uploads:", uploadsError.message);
      return;
    }

    const { data: precioData, error: precioError } = await supabase
      .from("precios")
      .select("precio")
      .eq("mes", mes)
      .eq("anio", anio)
      .single();

    if (precioError && precioError.code !== "PGRST116") {
      console.error("Error precio:", precioError.message);
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("drive_folder_public_link")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error user:", userError.message);
    }

    const precio = precioData?.precio ?? 0;
    const totalImagenes = uploads?.reduce((acc, u) => acc + u.total_images, 0) ?? 0;
    const totalDebe = totalImagenes * precio;

    setData({
      totalImagenes,
      pedidos: uploads ?? [],
      precio,
      totalDebe,
      driveFolderPublicLink: userData?.drive_folder_public_link ?? null,
    });
  };

  const load = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const abrirLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => console.warn("No se pudo abrir el link"));
  };

  const mesNombre = new Date().toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const statusLabel = (status) => {
    switch (status) {
      case "pedido": return { texto: "Pedido", color: "#f59e0b" };
      case "en_proceso": return { texto: "En proceso", color: "#3b82f6" };
      case "terminado": return { texto: "Terminado", color: "#10b981" };
      default: return { texto: status, color: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header con título y botón Mi Perfil */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.titulo}>Tablero</Text>
          <Text style={styles.subtitulo}>{mesNombre}</Text>
        </View>
        <TouchableOpacity
          style={styles.perfilButton}
          onPress={() => navigation.navigate("MyProfile")}
        >
          <Text style={styles.perfilButtonText}>Mi perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      <View style={styles.fila}>
        <View style={styles.card}>
          <Text style={styles.cardNumero}>{data.totalImagenes}</Text>
          <Text style={styles.cardLabel}>Imágenes enviadas</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNumero}>{data.pedidos.length}</Text>
          <Text style={styles.cardLabel}>Pedidos</Text>
        </View>
      </View>

      {/* Precio por imagen */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Precio por imagen</Text>
        <Text style={styles.cardNumero}>${data.precio}</Text>
      </View>

      {/* Total acumulado */}
      <View style={[styles.card, styles.cardDebe]}>
        <Text style={styles.cardLabelBlanco}>Total acumulado este mes</Text>
        <Text style={styles.cardNumeroBig}>${data.totalDebe.toFixed(2)}</Text>
      </View>

      {/* Carpeta pública de entregas */}
      {data.driveFolderPublicLink && (
        <TouchableOpacity
          style={styles.cardLink}
          onPress={() => abrirLink(data.driveFolderPublicLink)}
        >
          <Text style={styles.cardLinkIcon}>📂</Text>
          <View>
            <Text style={styles.cardLinkTitulo}>Mi carpeta de entregas</Text>
            <Text style={styles.cardLinkSub}>Ver fotos procesadas en Drive</Text>
          </View>
          <Text style={styles.cardLinkArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Lista de pedidos */}
      <Text style={styles.seccion}>Pedidos del mes</Text>

      {data.pedidos.length === 0 ? (
        <Text style={styles.vacio}>No hay pedidos este mes</Text>
      ) : (
        data.pedidos.map((pedido, index) => {
          const { texto, color } = statusLabel(pedido.status);
          return (
            <View key={index} style={styles.pedido}>
              <View style={styles.pedidoHeader}>
                <Text style={styles.pedidoDireccion}>{pedido.property_address}</Text>
                <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color }]}>
                  <Text style={[styles.badgeTexto, { color }]}>{texto}</Text>
                </View>
              </View>

              <View style={styles.pedidoFila}>
                <Text style={styles.pedidoDetalle}>{pedido.total_images} imágenes</Text>
                <Text style={styles.pedidoFecha}>
                  {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                </Text>
              </View>

              {pedido.status === "terminado" && pedido.delivery_link && (
                <TouchableOpacity
                  style={styles.entregaButton}
                  onPress={() => abrirLink(pedido.delivery_link)}
                >
                  <Text style={styles.entregaButtonText}>📥 Ver entrega</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 20,
  },
  titulo: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitulo: {
    fontSize: 14,
    color: "#6b7280",
    textTransform: "capitalize",
    marginTop: 2,
  },
  perfilButton: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  perfilButtonText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  fila: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDebe: {
    backgroundColor: "#2563eb",
    alignItems: "center",
    paddingVertical: 20,
  },
  cardNumero: { fontSize: 28, fontWeight: "800", color: "#111827" },
  cardNumeroBig: { fontSize: 36, fontWeight: "800", color: "#ffffff", marginTop: 4 },
  cardLabel: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  cardLabelBlanco: { fontSize: 13, color: "#bfdbfe" },
  cardLink: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLinkIcon: { fontSize: 24 },
  cardLinkTitulo: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardLinkSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  cardLinkArrow: { fontSize: 22, color: "#9ca3af", marginLeft: "auto" },
  seccion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },
  vacio: { textAlign: "center", color: "#6b7280", marginTop: 20 },
  pedido: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pedidoDireccion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeTexto: { fontSize: 11, fontWeight: "600" },
  pedidoFila: { flexDirection: "row", justifyContent: "space-between" },
  pedidoDetalle: { fontSize: 13, color: "#6b7280" },
  pedidoFecha: { fontSize: 13, color: "#6b7280" },
  entregaButton: {
    marginTop: 10,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  entregaButtonText: { color: "#10b981", fontWeight: "600", fontSize: 13 },
});