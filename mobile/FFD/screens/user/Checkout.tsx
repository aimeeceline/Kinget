import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useMessageBox } from "../../context/MessageBoxContext";

import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../data/FireBase"; // 🔥 đảm bảo bạn đã export db từ Firebase config

import { FoodOrderItem } from "../../types/food"; // ← import đúng interface này
function normalizeOrderItem(item: FoodOrderItem): FoodOrderItem {
  return {
    ...item,
    selectedSize: item.selectedSize ?? null,
    selectedBase: item.selectedBase ?? null,
    selectedTopping: item.selectedTopping ?? null,
    selectedAddOn: item.selectedAddOn ?? null,
    note: item.note ?? null,
  };
}

const CheckoutScreen: React.FC = () => {
    const { cart, address, clearCart, setCart } = useCart();
    const { user } = useAuth();
    const { show } = useMessageBox();
    const [receiverName, setReceiverName] = useState(user?.firstName || "");
    const [receiverPhone, setReceiverPhone] = useState(user?.phone || "");
    const [receiverAddress, setReceiverAddress] = useState(
      address || "284 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
);

    const route = useRoute();

    const { selectedFoods } = route.params as { selectedFoods: FoodOrderItem[] };
    console.table(
      selectedFoods.map((item, index) => ({
        "#": index + 1,
        "Tên món": item.name,
        "Số lượng": item.quantity,
        "Kích cỡ": item.selectedSize?.label || "-",
        "Đế bánh": item.selectedBase?.label || "-",
        "Topping": item.selectedTopping?.label || "-",
        "Add-on": item.selectedAddOn?.label || "-",
        "Ghi chú": item.note?.trim() || "-",
      }))
);

    const navigation = useNavigation<any>();
    

  // ✅ State lựa chọn
  const [shippingMethod, setShippingMethod] = useState<"motorbike" | "drone">("motorbike");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");

  // ✅ Tính tổng tiền
const subtotal = selectedFoods.reduce((sum, item) => {
    const sizePrice = item.selectedSize?.price || 0;
    const basePrice = item.selectedBase?.price || 0;
    const toppingPrice = item.selectedTopping?.price || 0;
    const addOnPrice = item.selectedAddOn?.price || 0;
    const totalItem =
      (sizePrice + basePrice + toppingPrice + addOnPrice) * (item.quantity || 1);
    return sum + totalItem;
  }, 0);

  const shippingFee = shippingMethod === "drone" ? 20000 : 10000;
  const total = subtotal + shippingFee;

  
  // ✅ Xử lý xác nhận thanh toán
  const handlePlaceOrder = async () => {
    if (!cart.length) {
      show("Giỏ hàng đang trống!", "info");      
    return;
    }
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      show("Vui lòng nhập đầy đủ thông tin người nhận!", "info");
      return;
    }
  try {
    console.log("🧾 Bắt đầu tạo đơn hàng...");

    // ✅ Chỉ nhận món được chọn
    const normalizedCart = selectedFoods.map(normalizeOrderItem);

    const orderData = {
    userId: user?.phone || "guest",
    receiverName: receiverName.trim(),
    receiverPhone: receiverPhone.trim(),
    receiverAddress: receiverAddress.trim(),
    items: normalizedCart,
    shippingMethod: shippingMethod || "motorbike",
    paymentMethod: paymentMethod || "cash",
    subtotal: subtotal || 0,
    shippingFee: shippingFee || 0,
    total: total || 0,
    status: "processing",
    createdAt: serverTimestamp(),
  };

    // 🧭 Phân nhánh xử lý theo phương thức thanh toán
    if (paymentMethod === "cash") {
      // 💵 Thanh toán tiền mặt → tạo đơn ngay
      await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "processing",
      });

      show("Đặt hàng thành công! Đơn của bạn đang chờ xác nhận.", "success");
      setCart((prev) =>
        prev.filter(
          (item) =>
            !selectedFoods.some(
              (sf) =>
                sf.id === item.id &&
                sf.selectedSize?.label === item.selectedSize?.label &&
                sf.selectedBase?.label === item.selectedBase?.label &&
                sf.selectedTopping?.label === item.selectedTopping?.label &&
                sf.selectedAddOn?.label === item.selectedAddOn?.label &&
                (sf.note?.trim() || "") === (item.note?.trim() || "")
            )
        )
      );
      navigation.navigate("MainTabs", { screen: "Đơn hàng" });
    } else if (paymentMethod === "bank") {
      // 💳 Thanh toán chuyển khoản → điều hướng sang trang giả lập
      navigation.navigate("Transfer", {
        orderData, // truyền dữ liệu đơn để xử lý tiếp
      });
    }
  } catch (error: any) {
    console.error("❌ Lỗi khi tạo đơn hàng:", error);
    show("Không thể tạo đơn hàng!", "error");
  }
};


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
    {/* 🏠 Thông tin người nhận */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Thông tin người nhận</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên người nhận"
          value={receiverName}
          onChangeText={setReceiverName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại người nhận"
          keyboardType="phone-pad"
          value={receiverPhone}
          onChangeText={setReceiverPhone}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Địa chỉ nhận hàng</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          placeholder="Nhập địa chỉ nhận hàng"
          multiline
          value={receiverAddress}
          onChangeText={setReceiverAddress}
        />
      </View>
    </View>



        {/* 🛍 Danh sách món */}
        <Text style={styles.sectionTitle}>Danh sách món</Text>
            {selectedFoods.map((item, index) => (
            <View key={index} style={styles.cartCard}>
                <Image source={{ uri: item.image }} style={styles.foodImage} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodDetail}>
                    {item.selectedSize?.label}
                    {item.selectedBase?.label ? ` • ${item.selectedBase.label}` : ""}
                    {item.selectedTopping?.label ? ` • ${item.selectedTopping.label}` : ""}
                    {item.selectedAddOn?.label ? ` • ${item.selectedAddOn.label}` : ""}
                </Text>
                <Text style={styles.priceText}>
                    {(
                    item.quantity *
                    (
                        (item.selectedSize?.price || 0) +
                        (item.selectedBase?.price || 0) +
                        (item.selectedTopping?.price || 0) +
                        (item.selectedAddOn?.price || 0)
                    )
                    ).toLocaleString("vi-VN")} ₫
                </Text>
                </View>
            </View>
            ))}

        {/* 🚚 Phương thức vận chuyển */}
        <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
        {[
          { key: "motorbike", label: "Xe máy", icon: "bicycle-outline" },
          { key: "drone", label: "Drone", icon: "airplane-outline" },
        ].map((method) => (
          <TouchableOpacity
            key={method.key}
            style={[
              styles.radioBox,
              shippingMethod === method.key && styles.radioBoxActive,
            ]}
            onPress={() => setShippingMethod(method.key as any)}
          >
            <View style={styles.radioLeft}>
              <Ionicons
                name={method.icon as any}
                size={22}
                color={shippingMethod === method.key ? "#F58220" : "#999"}
              />
              <Text
                style={[
                  styles.radioLabel,
                  { color: shippingMethod === method.key ? "#F58220" : "#333" },
                ]}
              >
                {method.label}
              </Text>
            </View>
            <Ionicons
              name={
                shippingMethod === method.key
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={22}
              color={shippingMethod === method.key ? "#F58220" : "#ccc"}
            />
          </TouchableOpacity>
        ))}

        {/* 💳 Phương thức thanh toán */}
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        {[
          { key: "cash", label: "Tiền mặt", icon: "cash-outline" },
          { key: "bank", label: "Chuyển khoản", icon: "card-outline" },
        ].map((method) => (
          <TouchableOpacity
            key={method.key}
            style={[
              styles.radioBox,
              paymentMethod === method.key && styles.radioBoxActive,
            ]}
            onPress={() => setPaymentMethod(method.key as any)}
          >
            <View style={styles.radioLeft}>
              <Ionicons
                name={method.icon as any}
                size={22}
                color={paymentMethod === method.key ? "#F58220" : "#999"}
              />
              <Text
                style={[
                  styles.radioLabel,
                  { color: paymentMethod === method.key ? "#F58220" : "#333" },
                ]}
              >
                {method.label}
              </Text>
            </View>
            <Ionicons
              name={
                paymentMethod === method.key
                  ? "checkmark-circle"
                  : "ellipse-outline"
              }
              size={22}
              color={paymentMethod === method.key ? "#F58220" : "#ccc"}
            />
          </TouchableOpacity>
        ))}

        {/* 💰 Chi tiết thanh toán */}
        <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
            <Text style={styles.summaryValue}>
              {subtotal.toLocaleString("vi-VN")} ₫
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>
              {shippingFee.toLocaleString("vi-VN")} ₫
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>
              Tổng thanh toán
            </Text>
            <Text style={[styles.summaryValue, { color: "#E53935", fontWeight: "bold" }]}>
              {total.toLocaleString("vi-VN")} ₫
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 🧡 Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.checkoutText}>Xác nhận thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutScreen;

// ======================== STYLE ==========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F6" },
  scrollView: { paddingHorizontal: 16, paddingTop: 20 },

  section: {
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 14,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 8,
},
inputGroup: { marginBottom: 10 },
label: { fontSize: 14, color: "#555", marginBottom: 4 },
input: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  fontSize: 14,
  backgroundColor: "#fafafa",
},
  cartCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
  },
  foodImage: { width: 80, height: 80, borderRadius: 10 },
  foodName: { fontSize: 15, fontWeight: "bold", color: "#1a1a1a" },
  foodDetail: { fontSize: 13, color: "#666", marginTop: 4 },
  priceText: { fontSize: 14, fontWeight: "bold", color: "#E53935", marginTop: 6 },

  radioBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  radioBoxActive: {
    borderColor: "#F58220",
    shadowColor: "#F58220",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  radioLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioLabel: { fontSize: 15, fontWeight: "500" },

  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  summaryLabel: { color: "#444", fontSize: 14 },
  summaryValue: { color: "#000", fontSize: 14 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 10,
  },
  checkoutBtn: {
    backgroundColor: "#F58220",
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
function setCart(arg0: (prev: any) => any) {
    throw new Error("Function not implemented.");
}

