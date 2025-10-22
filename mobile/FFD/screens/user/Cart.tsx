import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import Checkbox from "expo-checkbox"; 
import { useMessageBox } from "../../context/MessageBoxContext";

const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, guestMode } = useAuth();
  const { cart, removeFromCart, setAddress, address, clearCart, setCart, increaseQtyInCart, decreaseQtyInCart } = useContext(CartContext)!;
  const { show, confirm} = useMessageBox();

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const displayAddress =
    address || "284 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh";

  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "Khách";

   // ✅ Tổng tiền các món được chọn
  const subtotal = cart.reduce((sum, item, index) => {
    if (selectedItems.includes(index)) {
      const price =
        (item.selectedSize?.price || 0) +
        (item.selectedBase?.price || 0) +
        (item.selectedTopping?.price || 0) +
        (item.selectedAddOn?.price || 0);
      return sum + price * (item.quantity || 1);
    }
    return sum;
  }, 0);

  // ✅ Bật/tắt checkbox
  const toggleSelect = (index: number) => {
    setSelectedItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleRemoveItem = async (index: number) => {
  const ok = await confirm("Bạn có muốn xóa món này khỏi giỏ hàng?");
  if (!ok) return;
  removeFromCart(index);
  show("Đã xóa món khỏi giỏ hàng!", "success");
};


  // ✅ Khi người dùng nhấn "Thanh toán"
  const handleCheckout = () => {
    if (guestMode) {
            show("Vui lòng đăng nhập để đặt hàng!", "info");      
      return;
    }
    if (selectedItems.length === 0) {
            show("Vui lòng chọn ít nhất một món để thanh toán!", "info");      
      return;
    }

    // ⚡ Chuyển sang trang Checkout
    const selectedFoods = cart.filter((_, index) =>
          selectedItems.includes(index)

);

    navigation.navigate("Checkout", { selectedFoods });
  };

return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cart.length === 0 ? (
          <Text style={styles.emptyText}>Giỏ hàng trống.</Text>
        ) : (
          cart.map((item, index) => {
            const itemPrice =
              (item.price || 0) + 
              (item.selectedSize?.price || 0) +
              (item.selectedBase?.price || 0) +
              (item.selectedTopping?.price || 0) +
              (item.selectedAddOn?.price || 0);

            return (
              <View key={index} style={styles.cartCard}>
                {/* 🔘 Check chọn */}
                <Checkbox
                  value={selectedItems.includes(index)}
                  onValueChange={() => toggleSelect(index)}
                  color="#F58220"
                  style={styles.checkbox}
                />

                {/* 📸 Hình ảnh món */}
                <Image source={{ uri: item.image }} style={styles.foodImage} />

                {/* 🧾 Thông tin món */}
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>

                  {item.selectedSize?.label && (
                    <Text style={styles.foodDetail}>Size: {item.selectedSize.label}</Text>
                  )}
                  {item.selectedBase?.label && (
                    <Text style={styles.foodDetail}>Đế: {item.selectedBase.label}</Text>
                  )}
                  {item.selectedTopping?.label && (
                    <Text style={styles.foodDetail}>Topping: {item.selectedTopping.label}</Text>
                  )}
                  {item.selectedAddOn?.label && (
                    <Text style={styles.foodDetail}>Thêm: {item.selectedAddOn.label}</Text>
                  )}

                  {/* 📝 Ghi chú */}
                  {item.note ? (
                    <Text style={styles.noteText}>Ghi chú: {item.note}</Text>
                  ) : null}

                  {/* ➕➖ Số lượng */}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      onPress={() => decreaseQtyInCart(index)}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtySymbol}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      onPress={() => increaseQtyInCart(index)}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtySymbol}>＋</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 💸 Giá tiền */}
                  <Text style={styles.priceText}>
                    {(itemPrice * item.quantity).toLocaleString("vi-VN")} ₫
                  </Text>
                </View>

                {/* 🗑️ Xoá món */}
                <TouchableOpacity
                  onPress={() => handleRemoveItem(index)}                 
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 📦 Footer tổng cộng */}
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>
          Tổng cộng:{" "}
          <Text style={styles.totalValue}>
            {subtotal.toLocaleString("vi-VN")} ₫
          </Text>
        </Text>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout} // ✅ luôn bấm được
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutText}>
            Thanh toán ({selectedItems.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#777",
  },
  cartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F58220",
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    marginRight: 8,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: "cover",
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  foodName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  foodDetail: {
    color: "#666",
    fontSize: 13,
  },
  noteText: {
    color: "#03AF14",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtySymbol: {
    fontSize: 16,
    color: "#333",
  },
  qtyText: {
    marginHorizontal: 10,
    fontSize: 15,
  },
  priceText: {
    marginTop: 6,
    color: "#E53935",
    fontWeight: "700",
    fontSize: 15,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 16,
    paddingBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    color: "#E53935",
    fontWeight: "bold",
  },
  checkoutBtn: {
    backgroundColor: "#F58220",
    borderRadius: 50,
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutBtnDisabled: {
    backgroundColor: "#ccc",
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
