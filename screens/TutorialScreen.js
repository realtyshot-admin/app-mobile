import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Animated,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

const SECTIONS = [
  {
    videoUri: require("../assets/altura.mp4"),
    badge: "A",
    title: "ALTURA\nDE CÁMARA",
    body: "POSICIONÁ LA CÁMARA A LA ALTURA DEL PECHO, APUNTANDO LEVEMENTE HACIA ARRIBA PARA MOSTRAR EL ESPACIO COMPLETO.",
  },
  {
    videoUri: require("../assets/verticales.mp4"),
    badge: "V",
    title: "VERTICALES\nPARALELAS",
    body: "MANTENÉ LAS LÍNEAS VERTICALES RECTAS. LAS PAREDES Y MARCOS DEBEN VERSE PARALELOS EN LA FOTO.",
  },
  {
    videoUri: require("../assets/esquinas.mp4"),
    badge: "E",
    title: "ESQUINAS",
    body: "ENCUADRÁ DESDE LAS ESQUINAS DEL AMBIENTE PARA MOSTRAR LA MAYOR PROFUNDIDAD POSIBLE.",
  },
  {
    videoUri: require("../assets/3paredes.mp4"),
    badge: "3",
    title: "3 PAREDES",
    body: "INTENTÁ QUE SE VEAN AL MENOS TRES PAREDES EN CADA TOMA PARA DAR SENSACIÓN DE AMPLITUD.",
  },
];

function Section({ item, index, scrollY, screenHeight, screenWidth }) {
  const inputRange = [
    (index - 0.5) * screenHeight,
    index * screenHeight,
    (index + 0.5) * screenHeight,
  ];

  const opacity = scrollY.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  const player = useVideoPlayer(item.videoUri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play(); // ✅ Reproducir automáticamente
  });

  // ✅ Asegurar que el video se reproduzca cuando esté en pantalla
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const currentSection = Math.round(value / screenHeight);
      if (currentSection === index) {
        player.play();
      }
    });

    return () => {
      scrollY.removeListener(listener);
      player.pause();
    };
  }, [scrollY, index, player, screenHeight]);

  return (
    <View style={styles.section}>
      <VideoView
        player={player}
        style={[styles.bgVideo, { width: screenWidth, height: screenHeight }]}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.overlay} />

      <Animated.View style={[styles.content, { opacity }]}>
        {/* Fila superior: círculo + título */}
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
        </View>

        {/* Descripción abajo */}
        <Text style={styles.body}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

export default function TutorialScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const openGuide = () => {
    Linking.openURL(
      "https://drive.google.com/file/d/1HSwFHTJU_S_ULFEp8f3sRNvDUGZ2OyN8/preview"
    ).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}> {/* ✅ Asegurar bordes seguros */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={screenHeight} // ✅ Snap exacto a la altura de pantalla
        decelerationRate="fast" // ✅ Scroll más preciso
      >
        {SECTIONS.map((item, index) => (
          <View key={index} style={[styles.section, { width: screenWidth, height: screenHeight }]}>
            <Section
              item={item}
              index={index}
              scrollY={scrollY}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
            />
          </View>
        ))}

        {/* Pantalla final con botón */}
        <View style={[styles.finalSection, { width: screenWidth, height: screenHeight }]}>
          <Image
            source={require("../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.finalTitle}>¿LISTO PARA{"\n"}EMPEZAR?</Text>
          <Text style={styles.finalSub}>
            MIRÁ LA GUÍA COMPLETA CON EJEMPLOS VISUALES PASO A PASO.
          </Text>
          <TouchableOpacity style={styles.button} onPress={openGuide}>
            <Text style={styles.buttonText}>ABRIR GUÍA COMPLETA</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  section: {
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bgVideo: {
    position: "absolute",
    top: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 2,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: 3,
    lineHeight: 40,
    flex: 1,
    textAlign: "right",
  },
  body: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 11,
    letterSpacing: 2.5,
    lineHeight: 20,
    textAlign: "justify",
  },
  finalSection: {
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  logo: {
    width: 52,
    height: 52,
    marginBottom: 32,
    opacity: 0.9,
  },
  finalTitle: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "300",
    letterSpacing: 4,
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 20,
  },
  finalSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    letterSpacing: 2.5,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 40,
  },
  button: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 999,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3,
  },
});