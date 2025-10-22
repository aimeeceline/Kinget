import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { CartContext } from "../../context/CartContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import { Food } from "../../types/food";
import * as Haptics from "expo-haptics";

const FoodDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const { food } = route.params as { food: Food };
  const { addToCart } = useContext(CartContext)!;
  const { show } = useMessageBox();

  // ✅ Các state lựa chọn
 const [selectedSize, setSelectedSize] = useState<any>(food.sizes?.[0] || null);
const [selectedBase, setSelectedBase] = useState<any>(food.bases?.[0] || null);
const [selectedTopping, setSelectedTopping] = useState<any | null>(null);
const [selectedAddOn, setSelectedAddOn] = useState<any | null>(null);
const [note, setNote] = useState("");
const [quantity, setQuantity] = useState(1);
const [inputHeight, setInputHeight] = useState(40);

// ✅ Tính giá gốc
const basePrice =
  (selectedSize?.price || food.sizes?.[0]?.price || 0) +
  (selectedBase?.price || 0) +
  (selectedTopping?.price || 0) +
  (selectedAddOn?.price || 0);

const total = basePrice * quantity;

  
  // ✅ Thêm món vào giỏ
  const handleAddToCart = () => {


    if (!addToCart) {
      console.log("🎉 Thành công", `${food.name} đã được thêm vào giỏ hàng!`);
      return;
    }
    addToCart(
  {
    
    ...food,
    price: basePrice, 
    selectedSize,
    selectedBase,
    selectedTopping,
    selectedAddOn,
    note,
    quantity,
  },
  quantity
);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    show("Đã thêm vào giỏ hàng!", "success");
    //show("Lỗi", "Không thể kết nối tới máy chủ!", "error");
    //show("Thông tin", "Đơn hàng đang được xử lý...", "info");
}
  // ================================
  // 🚀 RENDER UI
  // ================================
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 60 : 80}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* ẢNH MÓN */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: food.image }} style={styles.image} />
        </View>

        {/* THÔNG TIN */}
        <View style={styles.content}>
          <Text style={styles.name}>{food.name}</Text>
          <Text style={styles.desc}>
            {food.description || "Thơm ngon, nóng hổi, phục vụ tận nơi!"}
          </Text>

          {/* =========================
              🍕 PIZZA / 🍔 BURGER / 🥤 DRINK
          ========================= */}
          {food.sizes && (
            <>
              <Text style={styles.sectionTitle}>Chọn kích cỡ</Text>
              <View style={styles.optionRow}>
                {food.sizes.map((size, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionButton,
                      selectedSize?.label === size.label && styles.optionActive,
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedSize?.label === size.label &&
                          styles.optionTextActive,
                      ]}
                    >
                      {size.label}
                    </Text>
                    <Text
                      style={[
                        styles.optionPrice,
                        selectedSize?.label === size.label &&
                          styles.optionTextActive,
                      ]}
                    >
                      {size.price.toLocaleString("vi-VN")} ₫
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* =========================
              🍕 ĐẾ BÁNH (Pizza)
          ========================= */}
          {food.category === "Pizza" && food.bases && (
            <>
              <Text style={styles.sectionTitle}>Chọn đế bánh</Text>
              <View style={styles.optionRow}>
                {food.bases.map((base, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionButton,
                      selectedBase?.label === base.label && styles.optionActive,
                    ]}
                    onPress={() => setSelectedBase(base)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedBase?.label === base.label &&
                          styles.optionTextActive,
                      ]}
                    >
                      {base.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* =========================
              🍕 TOPPING (Pizza / Drink)
          ========================= */}
          {food.toppings && food.toppings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Thêm topping</Text>
              <View style={styles.optionRow}>
                {food.toppings.map((top, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionButton,
                      selectedTopping?.label === top.label &&
                        styles.optionActive,
                    ]}
                    onPress={() => setSelectedTopping(top)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedTopping?.label === top.label &&
                          styles.optionTextActive,
                      ]}
                    >
                      {top.label}
                    </Text>
                    <Text style={styles.optionPrice}>
                      +{top.price.toLocaleString("vi-VN")} ₫
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* =========================
              🍔 ADD-ONS (Burger)
          ========================= */}
          {food.category === "Burger" && food.addOns && (
            <>
              <Text style={styles.sectionTitle}>Tùy chọn thêm</Text>
              <View style={styles.optionRow}>
                {food.addOns.map((add, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionButton,
                      selectedAddOn?.label === add.label &&
                        styles.optionActive,
                    ]}
                    onPress={() => setSelectedAddOn(add)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedAddOn?.label === add.label &&
                          styles.optionTextActive,
                      ]}
                    >
                      {add.label}
                    </Text>
                    <Text style={styles.optionPrice}>
                      +{add.price.toLocaleString("vi-VN")} ₫
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* =========================
              🥤 ICE & SUGAR (Drink)
          ========================= */}
        

          {/* =========================
              ✏️ GHI CHÚ
          ========================= */}
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <TextInput
            style={[styles.input, { height: Math.min(inputHeight, 100) }]}
            placeholder="Ví dụ: ít cay, thêm phô mai..."
            value={note}
            onChangeText={setNote}
            multiline
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
            numberOfLines={3}
            textAlignVertical="top"
            scrollEnabled={inputHeight > 100}
            returnKeyType="done"
          />
        </View>
      </KeyboardAwareScrollView>

      {/* =========================
          FOOTER
      ========================= */}
    {/* =========================
    FOOTER (đồng bộ với CartScreen)
========================= */}
<View style={styles.footer}>
  <View style={styles.footerTop}>
    {/* Box tăng giảm số lượng */}
    <View style={styles.qtyBox}>
      <TouchableOpacity
        style={styles.qtyBtn}
        onPress={() => setQuantity((q) => Math.max(1, q - 1))}
      >
        <Text style={styles.qtySymbol}>−</Text>
      </TouchableOpacity>
      <Text style={styles.qtyText}>{quantity}</Text>
      <TouchableOpacity
        style={styles.qtyBtn}
        onPress={() => setQuantity((q) => q + 1)}
      >
        <Text style={styles.qtySymbol}>＋</Text>
      </TouchableOpacity>
    </View>

    {/* Tổng cộng */}
    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.totalLabel}>Tổng cộng:</Text>
      <Text style={styles.totalPrice}>{total.toLocaleString("vi-VN")} ₫</Text>
    </View>
  </View>

  {/* Nút thêm vào giỏ hàng */}
  <TouchableOpacity
    style={styles.addButton}
    onPress={handleAddToCart}
    activeOpacity={0.9}
  >
    <Text style={styles.addButtonText}>Thêm vào giỏ hàng</Text>
  </TouchableOpacity>
</View>

    </View>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 150 },
  imageContainer: { alignItems: "center", marginTop: 10 },
  image: { width: "90%", height: 220, borderRadius: 16 },
  content: { paddingHorizontal: 20, marginTop: 10 },
  name: { fontSize: 22, fontWeight: "bold", color: "#333" },
  desc: { fontSize: 15, color: "#666", marginTop: 5 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginTop: 15, color: "#222" },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F58220",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionActive: { backgroundColor: "#F58220" },
  optionText: { color: "#F58220", fontSize: 14, fontWeight: "600" },
  optionTextActive: { color: "#fff" },
  optionPrice: { marginLeft: 6, color: "#888", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  footer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  borderTopWidth: 1,
  borderColor: "#eee",
  paddingVertical: 20,
  paddingHorizontal: 16,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: -2 },
  shadowRadius: 6,
  elevation: 10,
},
footerTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
},

// Giống CartScreen
qtyBox: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  backgroundColor: "#fff",
},
qtyBtn: {
  width: 35,
  height: 35,
  justifyContent: "center",
  alignItems: "center",
},
qtySymbol: { fontSize: 18, color: "#333" },
qtyText: { fontSize: 16, fontWeight: "bold", marginHorizontal: 10 },

totalLabel: { color: "#444", fontSize: 14 },
totalPrice: { color: "#E53935", fontWeight: "bold", fontSize: 17 },

addButton: {
  backgroundColor: "#F58220",
  borderRadius: 50,
  paddingVertical: 14,
  alignItems: "center",
  marginTop: 6,
},
addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

});
