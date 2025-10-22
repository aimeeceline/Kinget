import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { db } from "../../data/FireBase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useMessageBox } from "../../context/MessageBoxContext";


const OrderDetailScreen = ({ route, navigation }: any) => {
  const { order } = route.params;
  const { user } = useAuth();
  const { confirm, show } = useMessageBox();  
  const [updating, setUpdating] = useState(false);
    const userName =
        user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.firstName ;
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "processing":
        return { color: "#F9A825", label: "Chờ xác nhận", icon: "time-outline" };
      case "preparing":
        return { color: "#db00baff", label: "Đang chuẩn bị", icon: "time-outline" };
      case "delivering":
        return { color: "#2196F3", label: "Đang giao", icon: "bicycle-outline" };
      case "delivered":
        return { color: "#ede100ff", label: "Đã giao", icon: "bicycle-outline" };
      case "completed":
        return { color: "#4CAF50", label: "Hoàn thành", icon: "checkmark-circle-outline" };
      case "cancelled":
        return { color: "#E53935", label: "Đã hủy", icon: "close-circle-outline" };
      default:
        return { color: "#333", label: "Không xác định", icon: "help-circle-outline" };
    }
  };

  const status = getStatusInfo(order.status);

  const handleCancelOrder = async () => {
  const ok = await confirm("Bạn có chắc chắn muốn hủy đơn hàng này?");
  if (!ok) return;
  await updateDoc(doc(db, "orders", order.id), { status: "cancelled" });
  show("Đã hủy đơn hàng!", "success");
};

   const handleReceiveOrder = async () => {
  const ok = await confirm("Bạn đã nhận được hàng?");
  if (!ok) return;
    try {
      setUpdating(true);
      await updateDoc(doc(db, "orders", order.id), { status: "delivered" });
      show("Đơn hàng đã xác nhận!", "success");
      navigation.goBack();
    } catch (error) {
      show("Lỗi khi cập nhật!", "error");
    } finally {
      setUpdating(false);
    }
    return;
  };
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* 🧾 Trạng thái đơn hàng */}
        <View style={styles.statusCard}>
          <Ionicons name={status.icon as any} size={26} color={status.color} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.statusLabel}>{status.label}</Text>
            <Text style={styles.statusSub}>Cảm ơn bạn đã lựa chọn Kinget!</Text>
          </View>
        </View>

        {/* 🏠 Địa chỉ nhận hàng */}
        <View style={styles.addressCard}>
          <Text style={styles.addressTitle}>Địa chỉ nhận hàng</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#F58220" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.receiverLine}>
                <Text style={styles.receiverName}>
                  {userName || "Nguyễn Văn A"}
                </Text>{" "}
                <Text style={styles.receiverPhone}>
                  {user?.phone ? `(+84) ${user.phone}` : "(+84) 941 863 121"}
                </Text>
              </Text>
              <Text style={styles.receiverAddress}>
                {order.receiverAddress ||
                  "20/11, Lê Ngã, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh"}
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

          {order.items.map((item: any, index: number) => {
            // Gộp tất cả tuỳ chọn nếu có
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

        {/* Tuỳ chọn */}
        {options.length > 0 && (
          <Text style={styles.itemOptions}>{options.join(" • ")}</Text>
        )}

        {/* Ghi chú */}
        {item.note && (
          <Text style={styles.itemNote}>Ghi chú: {item.note}</Text>
        )}

        {/* Số lượng */}
        <Text style={styles.itemQty}>x{item.quantity}</Text>
      </View>

      {/* Giá */}
      <Text style={styles.itemPrice}>
        {(item.price || 0).toLocaleString("vi-VN")}₫
      </Text>
    </View>
     );
})}

          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
                <Text style={styles.totalValueSmall}>
                {order.subtotal
                    ? order.subtotal.toLocaleString("vi-VN")
                    : (order.total - (order.shippingFee || 15000)).toLocaleString("vi-VN")}₫
                </Text>
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Phí vận chuyển</Text>
                <Text style={styles.totalValueSmall}>
                {(order.shippingFee || 15000).toLocaleString("vi-VN")}₫
                </Text>
            </View>

            <View style={[styles.totalRow, { borderTopWidth: 0.5, borderColor: "#eee", paddingTop: 6 }]}>
                <Text style={[styles.totalLabel, { fontWeight: "600" }]}>Tổng cộng</Text>
                <Text style={styles.totalValue}>
                {order.total.toLocaleString("vi-VN")}₫
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
            <Text style={styles.detailValue}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày đặt:</Text>
            <Text style={styles.detailValue}>{order.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.detailValue}>
              {order.paymentMethod === "bank"
                ? "Chuyển khoản ngân hàng"
                : "Tiền mặt khi nhận hàng"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hình thức giao hàng:</Text>
            <Text style={styles.detailValue}>
              {order.shippingMethod === "drone" ? "Giao bằng Drone" : "Giao bằng xe máy"}
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* 🧭 Footer hành động */}
        {order.status === "processing" && (
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
        {order.status === "delivering" && (
        <View style={styles.footer}>
            <TouchableOpacity
            style={[styles.receiveButton, updating && { opacity: 0.6 }]}
            disabled={updating}
            onPress={handleReceiveOrder}
            >
            <Text style={styles.receiveText}>
                {updating ? "Đang xác nhận..." : "Đã nhận được hàng"}
            </Text>
            </TouchableOpacity>
        </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F6" },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },

  // --- TRẠNG THÁI ---
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 10,
    elevation: 1,
  },
  statusLabel: { fontWeight: "600", fontSize: 16, color: "#000" },
  statusSub: { color: "#777", fontSize: 13, marginTop: 2 },

  // --- ĐỊA CHỈ NHẬN HÀNG ---
  addressCard: {
    backgroundColor: "#fff",
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  addressTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
    color: "#000",
  },
  addressRow: { flexDirection: "row", alignItems: "flex-start" },
  receiverLine: { flexDirection: "row", alignItems: "center" },
  receiverName: { fontWeight: "600", color: "#000", fontSize: 14 },
  receiverPhone: { color: "#666", fontSize: 13 },
  receiverAddress: {
    color: "#444",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  // --- SẢN PHẨM ---
  itemCard: {
    backgroundColor: "#fff",
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoTitle: { fontWeight: "600", fontSize: 15, marginLeft: 6, color: "#000" },
  itemRow: {
  flexDirection: "row",
  alignItems: "flex-start",
  borderBottomWidth: 0.5,
  borderColor: "#eee",
  paddingVertical: 8,
},
itemImage: {
  width: 60,
  height: 60,
  borderRadius: 8,
  backgroundColor: "#f5f5f5",
},
itemName: {
  fontSize: 14,
  color: "#222",
  fontWeight: "600",
},
itemOptions: {
  color: "#666",
  fontSize: 13,
  marginTop: 2,
  flexWrap: "wrap",
},
itemNote: {
  fontSize: 13,
  color: "#03A678",
  fontStyle: "italic",
  marginTop: 2,
},
itemQty: {
  fontSize: 13,
  color: "#777",
  marginTop: 2,
},
itemPrice: {
  fontSize: 14,
  fontWeight: "600",
  color: "#E53935",
  marginLeft: 8,
},

totalBox: {
  marginTop: 10,
  borderTopWidth: 0.5,
  borderColor: "#eee",
  paddingTop: 8,
},
totalRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginVertical: 2,
},
totalLabel: {
  fontSize: 14,
  color: "#333",
},
totalValueSmall: {
  fontSize: 14,
  color: "#444",
},
totalValue: {
  fontSize: 15,
  fontWeight: "bold",
  color: "#E53935",
},

  // --- THÔNG TIN ĐƠN HÀNG ---
  detailCard: {
    backgroundColor: "#fff",
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: { fontSize: 14, color: "#555" },
  detailValue: { fontSize: 14, color: "#555" },

  // --- FOOTER ---
  footer: {
    backgroundColor: "#fff",
    padding: 14,
    borderTopWidth: 0.5,
    borderColor: "#eee",
  },
  cancelButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E53935",
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 6 },
  receiveButton: {
  backgroundColor: "#4CAF50",
  borderRadius: 50,
  paddingVertical: 14,
  alignItems: "center",
  marginHorizontal: 16,
  marginBottom: 10,
},
receiveText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
},

});
export default OrderDetailScreen;
