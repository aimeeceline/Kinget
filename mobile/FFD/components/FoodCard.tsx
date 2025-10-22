import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Food } from "../types/food";

interface Props {
  food: Food;
  onPress: () => void;
}

const FoodCard: React.FC<Props> = ({ food, onPress }) => {
  const firstSize = food.sizes?.[0];
  const price = firstSize ? firstSize.price : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={
          food.image
            ? { uri: food.image }
            : require("../screens/images/no-image.png")
        }
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.name} numberOfLines={2}>
        {food.name}
      </Text>
      {firstSize && (
        <Text style={styles.price}>{price.toLocaleString("vi-VN")} ₫</Text>
      )}
    </TouchableOpacity>
  );
};

export default FoodCard;

const styles = StyleSheet.create({
  card: {
    width: 188, // ✅ cố định chiều rộng hợp lý khi hiển thị ngang
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F58220",
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 8,
  },
  name: {
    fontWeight: "bold",
    marginTop: 6,
    color: "#333",
  },
  price: {
    color: "#F58220",
    marginTop: 4,
    fontWeight: "600",
  },
});
