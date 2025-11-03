import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../data/FireBase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useMessageBox } from "../../context/MessageBoxContext";

const OrderDetailScreen = ({ route, navigation }: any) => {
  const { order } = route.params;
  const { user } = useAuth();
  const { show, confirm } = useMessageBox();

  const [orderData, setOrderData] = useState<any>(order);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 🔥 Lắng nghe realtime Firestore
  useEffect(() => {
    const ref = doc(db, "orders", order.id);
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setOrderData({ id: snapshot.id, ...snapshot.data() });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [order.id]);

  // 🧭 Hàm cập nhật trạng thái đơn hàng
  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, "orders", orderData.id), { status: newStatus });
      show(
        newStatus === "cancelled"
          ? "Đơn hàng đã được hủy!"
          : "Cập nhật trạng thái thành công!",
        "success"
      );
      navigation.goBack();
    } catch (error) {
      show("Lỗi khi cập nhật đơn hàng!", "error");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    const ok = await confirm("Bạn có chắc muốn hủy đơn hàng này?");
    if (!ok) return;
    updateStatus("cancelled");
  };

  const handleConfirmReceived = async () => {
    const ok = await confirm("Xác nhận đã nhận được hàng?");
    if (!ok) return;
    updateStatus("completed");
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text style={{ color: "#555", marginTop: 10 }}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  const statusColors: any = {
    processing: "#F9A825",
    preparing: "#db00ba",
    delivering: "#2196F3",
    completed: "#4CAF50",
    cancelled: "#E53935",
  };

  const statusLabels: any = {
    processing: "Chờ xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
  };

  const statusColor = statusColors[orderData.status] || "#333";
  const statusLabel = statusLabels[orderData.status] || "Không xác định";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 🔹 Trạng thái đơn hàng */}
        <View style={styles.statusCard}>
          <Ionicons name="time-outline" size={26} color={statusColor} />
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {statusLabel}
            </Text>
            <Text style={styles.statusSub}>Cảm ơn bạn đã lựa chọn Kinget!</Text>
          </View>
        </View>

        {/* 🏠 Thông tin người nhận */}
        <View style={styles.addressCard}>
          <Text style={styles.addressTitle}>Thông tin người nhận</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#F58220" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.receiverName}>
                {orderData.receiverName || "Nguyễn Văn A"}
              </Text>
              <Text style={styles.receiverPhone}>
                {orderData.receiverPhone
                  ? `(+84) ${orderData.receiverPhone}`
                  : "(+84) 941 863 121"}
              </Text>
              <Text style={styles.receiverAddress}>
                {orderData.receiverAddress ||
                  "105 Bà Huyện Thanh Quan, Quận 3, TP. Hồ Chí Minh"}
              </Text>
            </View>
          </View>
        </View>

        {/* 🍔 Danh sách món ăn */}
        <View style={styles.itemCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="fast-food-outline" size={20} color="#F58220" />
            <Text style={styles.infoTitle}>Sản phẩm</Text>
          </View>

          {orderData.items.map((item: any, index: number) => {
            const options: string[] = [];
            if (item.selectedSize?.label) options.push(`Size: ${item.selectedSize.label}`);
            if (item.selectedBase?.label) options.push(`Đế: ${item.selectedBase.label}`);
            if (item.selectedTopping?.label) options.push(`Topping: ${item.selectedTopping.label}`);
            if (item.selectedAddOn?.label) options.push(`Thêm: ${item.selectedAddOn.label}`);

            return (
              <View key={index} style={styles.itemRow}>
                <Image
                  source={{ uri: item.image || "https://via.placeholder.com/80" }}
                  style={styles.itemImage}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {options.length > 0 && (
                    <Text style={styles.itemOptions}>{options.join(" • ")}</Text>
                  )}
                  {item.note && (
                    <Text style={styles.itemNote}>Ghi chú: {item.note}</Text>
                  )}
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {(item.price || 0).toLocaleString("vi-VN")}₫
                </Text>
              </View>
            );
          })}

          {/* 💰 Tổng tiền */}
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
              <Text style={styles.totalValueSmall}>
                {orderData.subtotal?.toLocaleString("vi-VN")}₫
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Phí vận chuyển</Text>
              <Text style={styles.totalValueSmall}>
                {orderData.shippingFee?.toLocaleString("vi-VN")}₫
              </Text>
            </View>
            <View style={[styles.totalRow, { borderTopWidth: 0.5, borderColor: "#eee", paddingTop: 6 }]}>
              <Text style={[styles.totalLabel, { fontWeight: "600" }]}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {orderData.total?.toLocaleString("vi-VN")}₫
              </Text>
            </View>
          </View>
        </View>

        {/* 💳 Thông tin đơn hàng */}
        <View style={styles.detailCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="receipt-outline" size={20} color="#F58220" />
            <Text style={styles.infoTitle}>Thông tin đơn hàng</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
            <Text style={styles.detailValue}>#{orderData.id?.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.detailValue}>
              {orderData.paymentMethod === "bank"
                ? "Chuyển khoản ngân hàng"
                : "Tiền mặt khi nhận hàng"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hình thức giao hàng:</Text>
            <Text style={styles.detailValue}>
              {orderData.shippingMethod === "drone"
                ? "Giao bằng Drone"
                : "Giao bằng xe máy"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 🧭 Footer */}
      {orderData.status === "processing" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, updating && { opacity: 0.6 }]}
            disabled={updating}
            onPress={handleCancelOrder}
          >
            <Text style={styles.cancelText}>
              {updating ? "Đang hủy..." : "Hủy đơn hàng"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {orderData.status === "delivering" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.receiveButton, updating && { opacity: 0.6 }]}
            disabled={updating}
            onPress={handleConfirmReceived}
          >
            <Text style={styles.receiveText}>
              {updating ? "Đang cập nhật..." : "Đã nhận được hàng"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default OrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
  },
  statusLabel: { fontSize: 16, fontWeight: "700" },
  statusSub: { color: "#888", fontSize: 13 },
  addressCard: { margin: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, elevation: 1 },
  addressTitle: { fontWeight: "700", fontSize: 15, marginBottom: 5 },
  addressRow: { flexDirection: "row", alignItems: "center" },
  receiverName: { fontWeight: "600", fontSize: 15 },
  receiverPhone: { color: "#555", marginVertical: 2 },
  receiverAddress: { color: "#777" },
  itemCard: { margin: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, elevation: 1 },
  infoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoTitle: { fontWeight: "700", fontSize: 15, marginLeft: 6 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    paddingVertical: 8,
  },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  itemName: { fontWeight: "600", color: "#333" },
  itemOptions: { color: "#555", fontSize: 12 },
  itemNote: { color: "#03AF14", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  itemQty: { fontSize: 12, color: "#777" },
  itemPrice: { fontWeight: "bold", color: "#E53935" },
  totalBox: { marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  totalLabel: { color: "#444" },
  totalValueSmall: { color: "#333", fontWeight: "500" },
  totalValue: { color: "#E53935", fontWeight: "bold", fontSize: 15 },
  detailCard: { margin: 12, padding: 12, backgroundColor: "#fff", borderRadius: 10, elevation: 1 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  detailLabel: { color: "#444" },
  detailValue: { fontWeight: "500" },
  footer: { padding: 16, borderTopWidth: 1, borderColor: "#eee" },
  cancelButton: { backgroundColor: "#E53935", padding: 14, borderRadius: 8, alignItems: "center" },
  cancelText: { color: "#fff", fontWeight: "bold" },
  receiveButton: { backgroundColor: "#4CAF50", padding: 14, borderRadius: 8, alignItems: "center" },
  receiveText: { color: "#fff", fontWeight: "bold" },
});
