import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";
 
const SECTIONS = [
  {
    videoUri: require("../assets/Intro.mp4"),
  },
  {
    videoUri: require("../assets/altura.mp4"),
  },
  {
    videoUri: require("../assets/verticales.mp4"),
  },
  {
    videoUri: require("../assets/esquinas.mp4"),
  },
  {
    videoUri: require("../assets/3paredes.mp4"),
  },
];
 
function Section({ item, index, scrollY, screenHeight, screenWidth }) {
  const screenRatio = screenWidth / screenHeight;
  const expectedVideoRatio = 9 / 16;
  const ratioDelta = Math.abs(screenRatio - expectedVideoRatio);
  const contentFit = ratioDelta <= 0.08 ? "cover" : "contain";
 
  // No arrancamos el video en el inicializador — el scroll se encarga.
  // Excepción: el index 0 arranca solo porque nunca hay evento de scroll previo.
  const player = useVideoPlayer(item.videoUri, (p) => {
    p.loop = true;
    p.muted = true;
    if (index === 0) {
      p.play();
    }
  });
 
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const currentSection = Math.round(value / screenHeight);
      if (currentSection === index) {
        player.play();
      } else {
        player.pause();
      }
    });
 
    return () => {
      scrollY.removeListener(listener);
      player.pause();
    };
  }, [scrollY, index, player, screenHeight]);
 
  return (
    <View style={[styles.section, { width: screenWidth, height: screenHeight }]}>
      <VideoView
        player={player}
        style={[styles.bgVideo, { width: screenWidth, height: screenHeight }]}
        contentFit={contentFit}
        nativeControls={false}
      />
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
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={screenHeight}
        decelerationRate="fast"
      >
        {SECTIONS.map((item, index) => (
          <Section
            key={index}
            item={item}
            index={index}
            scrollY={scrollY}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
        ))}
 
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
 