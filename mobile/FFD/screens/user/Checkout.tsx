import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { useMessageBox } from "../../context/MessageBoxContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../data/FireBase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FoodOrderItem } from "../../types/food";

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuth();
  const { show } = useMessageBox();
  const { clearCart, selectedBranch } = useContext(CartContext)!;

  const { selectedFoods } = route.params as { selectedFoods: FoodOrderItem[] };

  const [currentBranch, setCurrentBranch] = useState<string | null>(selectedBranch);
  const [receiverName, setReceiverName] = useState(user?.firstName || "");
  const [receiverPhone, setReceiverPhone] = useState(user?.phone || "");
  const [receiverAddress, setReceiverAddress] = useState(
    "284 An Dương Vương, Phường 3, Quận 5, TP. Hồ Chí Minh"
  );
  const [shippingMethod, setShippingMethod] =
    useState<"motorbike" | "drone">("motorbike");
  const [paymentMethod, setPaymentMethod] =
    useState<"cash" | "bank">("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("selectedBranch").then((b) => {
      if (b) setCurrentBranch(b);
    });
  }, []);

  // ✅ Tính tổng tiền (giống logic cũ)
  const subtotal = selectedFoods.reduce((sum, item) => {
    const size = item.selectedSize?.price || 0;
    const base = item.selectedBase?.price || 0;
    const topping =
      item.selectedTopping?.reduce((s, t) => s + (t.price || 0), 0) || 0;
    const addOn =
      item.selectedAddOn?.reduce((s, a) => s + (a.price || 0), 0) || 0;
    return sum + (size + base + topping + addOn) * (item.quantity || 1);
  }, 0);

  const shippingFee = shippingMethod === "drone" ? 20000 : 10000;
  const total = subtotal + shippingFee;

  // ✅ Build item giống schema WEB (B02)
  function buildOrderItem(item: FoodOrderItem) {
    const sizePrice = item.selectedSize?.price || 0;
    const basePrice = item.selectedBase?.price || 0;
    const toppingPrice =
      item.selectedTopping?.reduce((s, t) => s + (t.price || 0), 0) || 0;
    const addOnPrice =
      item.selectedAddOn?.reduce((s, a) => s + (a.price || 0), 0) || 0;

    const unitPrice = sizePrice + basePrice + toppingPrice + addOnPrice;

    return {
      // 👇 CẤU TRÚC Y HỆT WEB
      branchId: currentBranch || null,
      cartId: (item as any).firestoreId || null, // nếu có docId trong giỏ
      category: item.category,
      foodId: item.id, // web dùng foodId
      image: item.image,
      name: item.name,
      note: item.note || "",
      price: unitPrice,
      quantity: item.quantity || 1,
      selectedAddOn: item.selectedAddOn ?? [],
      selectedBase: item.selectedBase ?? null,
      selectedSize: item.selectedSize ?? null,
      selectedTopping: item.selectedTopping ?? [],
      signature: item.signature,
    };
  }

  // ✅ Tạo đơn hàng
  const handlePlaceOrder = async () => {
    if (!selectedFoods.length) return show("Chưa chọn món nào!", "info");
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim())
      return show("Vui lòng nhập đầy đủ thông tin người nhận!", "info");

    try {
      setLoading(true);

      const normalizedItems = selectedFoods.map(buildOrderItem);

      const orderData = {
        branchId: currentBranch,
        userId: user?.id || "guest", // THỐNG NHẤT: dùng user.id
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        orderAddress: receiverAddress.trim(),

        // Web đang dùng origin/currentPos/delivery, app tạm để giống origin
        origin: { lat: 10.7585, lng: 106.6818 },
        currentPos: { lat: 10.7585, lng: 106.6818 },
        delivery: { lat: 10.7832852, lng: 106.7063916 },

        paymentMethod,  // "cash" | "bank"
        shippingMethod, // "motorbike" | "drone"
        shippingFee,
        subtotal,
        total,
        status: "processing",
        createdAt: serverTimestamp(),

        items: normalizedItems,
      };

      if (paymentMethod === "cash") {
        await addDoc(collection(db, "orders"), orderData);
        await clearCart(currentBranch || undefined);
        show("🎉 Đặt hàng thành công! Đơn đang được xử lý.", "success");
        navigation.navigate("MainTabs", { screen: "Orders" });
      } else {
        navigation.navigate("Transfer", { orderData });
      }
    } catch (e) {
      console.error("🔥 Lỗi đặt hàng:", e);
      show("Không thể tạo đơn hàng!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {/* 🏠 Thông tin người nhận */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Nhập họ tên"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={receiverPhone}
              onChangeText={setReceiverPhone}
              placeholder="Nhập số điện thoại"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              multiline
              value={receiverAddress}
              onChangeText={setReceiverAddress}
              placeholder="Nhập địa chỉ giao hàng"
            />
          </View>
        </View>

        {/* 🛒 Danh sách món */}
        <Text style={styles.sectionTitle}>Danh sách món</Text>
        {selectedFoods.map((item, index) => (
          <View key={index} style={styles.cartCard}>
            <Image source={{ uri: item.image }} style={styles.foodImage} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodDetail}>
                {item.selectedSize?.label}{" "}
                {item.selectedBase?.label && `• ${item.selectedBase.label}`}
              </Text>
              {item.note ? (
                <Text style={styles.foodNote}>Ghi chú: {item.note}</Text>
              ) : null}
              <Text style={styles.priceText}>
                {(
                  (item.quantity || 1) *
                  ((item.selectedSize?.price || 0) +
                    (item.selectedBase?.price || 0) +
                    (item.selectedAddOn?.reduce(
                      (s, a) => s + (a.price || 0),
                      0
                    ) || 0) +
                    (item.selectedTopping?.reduce(
                      (s, t) => s + (t.price || 0),
                      0
                    ) || 0))
                ).toLocaleString("vi-VN")}{" "}
                ₫
              </Text>
            </View>
          </View>
        ))}

        {/* 🚚 Vận chuyển */}
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
                  {
                    color:
                      shippingMethod === method.key ? "#F58220" : "#333",
                  },
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

        {/* 💳 Thanh toán */}
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
                  {
                    color:
                      paymentMethod === method.key ? "#F58220" : "#333",
                  },
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

        {/* 💰 Tổng thanh toán */}
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
    <Text
      style={[
        styles.summaryValue,
        { color: "#E53935", fontWeight: "bold" },
      ]}
    >
      {total.toLocaleString("vi-VN")} ₫
    </Text>
  </View>
</View>
      </ScrollView>

      {/* ✅ Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, loading && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.checkoutText}>
            {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F6" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
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
  foodNote: { fontSize: 13, color: "#666", marginTop: 4 },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E53935",
    marginTop: 6,
  },
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
