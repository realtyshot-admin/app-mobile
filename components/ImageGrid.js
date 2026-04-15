import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function ImageGrid({ images, onRemove }) {
  return (
    <View style={styles.grid}>
      {images.map((item, index) => (
        <View key={String(index)} style={styles.item}>
          <Image source={{ uri: item.uri }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <View style={styles.removeInner} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  item: {
    width: "31%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeInner: {
    width: 10,
    height: 2,
    backgroundColor: "#fff",
  },
});