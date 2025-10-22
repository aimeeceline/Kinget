import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../data/FireBase";
import { collection, onSnapshot, orderBy, query, updateDoc, doc } from "firebase/firestore";

// 🟧 Trạng thái đơn hàng
const statusTabs = [
  { key: "processing", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "delivering", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

const RestaurantOrderScreen: React.FC<any> = ({ navigation }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("processing");
  const [loading, setLoading] = useState(true);

  // 🔹 Lấy danh sách đơn hàng realtime
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data();
      const createdAt = raw.createdAt?.toDate?.() || new Date();

      // Chuẩn hoá danh sách món: đơn giá & thành tiền
      const items = (raw.items || []).map((it: any) => {
        const unit =
          Number(it?.price) ||
          Number(it?.selectedSize?.price || 0) +
            Number(it?.selectedBase?.price || 0) +
            Number(it?.selectedTopping?.price || 0) +
            Number(it?.selectedAddOn?.price || 0);

        const qty = Number(it?.quantity || 1);
        return {
          name: it?.name || "",
          image: it?.image || "",
          quantity: qty,
          unitPrice: unit,                 // đơn giá 1 món
          linePrice: unit * qty,           // thành tiền của dòng
          // giữ lại options nếu cần show
          selectedSize: it?.selectedSize || null,
          selectedBase: it?.selectedBase || null,
          selectedTopping: it?.selectedTopping || null,
          selectedAddOn: it?.selectedAddOn || null,
          note: it?.note || "",
        };
      });

      // Tính tiền hàng (subtotal) và tổng
      const subtotal = items.reduce((s: number, it: any) => s + Number(it.linePrice || 0), 0);
      const shippingFee = Number(raw?.shippingFee ?? 15000);
      const total = subtotal + shippingFee; // ưu tiên tự tính

      return {
        id: docSnap.id,
        date: createdAt.toLocaleString("vi-VN"),
        status: raw.status || "processing",
        userName: raw.userName || "Khách hàng",
        phone: raw.userId || "",
        address:
          raw.receiverAddress ||
          "20/11, Lê Ngã, Phường Phú Trung, Quận Tân Phú, TP.HCM",

        items,                 // đã kèm unitPrice & linePrice
        subtotal,
        shippingFee,
        total,
      };
    });
    setOrders(data);
    setLoading(false);
  });
    return () => unsubscribe();
  }, []);

  // ✅ Cập nhật trạng thái
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
      console.error("❌ Lỗi cập nhật trạng thái:", error);
    }
  };

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text style={{ marginTop: 10, color: "#555" }}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={[styles.header]}>
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <Ionicons name="receipt-outline" size={30} color="#fff" />
      </View>
      <StatusBar barStyle="light-content" backgroundColor="#F58220" />
      <View style={styles.tabWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScroll}
              >
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* 📦 Danh sách đơn */}

      <View style={styles.emptyBox}>
      
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onViewDetail={() =>
              navigation.navigate("RestaurantOrderDetail", { order: item })
            }
            onConfirm={() => handleUpdateStatus(item.id, "preparing")}
            onDeliver={() => handleUpdateStatus(item.id, "delivering")}
            onComplete={() => handleUpdateStatus(item.id, "completed")}
          />
        )}
      />  
      </View>
    </SafeAreaView>
  );
};

export default RestaurantOrderScreen;

/* 🧾 Card hiển thị từng đơn hàng */
const OrderCard = ({
  order,
  onViewDetail,
  onConfirm,
  onDeliver,
  onComplete,
}: {
  order: any;
  onViewDetail: () => void;
  onConfirm: () => void;
  onDeliver: () => void;
  onComplete: () => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "#F9A825"; // vàng
      case "preparing":
        return "#E040FB"; // tím hồng
      case "delivering":
        return "#2196F3"; // xanh dương
      case "delivered":
        return "#00d6cfff"; // xanh dương
      case "completed":
        return "#4CAF50"; // xanh lá
      case "cancelled":
        return "#E53935"; // đỏ
      default:
        return "#333";
    }
  };

  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.9}
      onPress={onViewDetail}
    >
      {/* 🧾 Header */}
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <Text
          style={[styles.orderStatus, { color: getStatusColor(order.status) }]}
        >
          {statusTabs.find((t) => t.key === order.status)?.label}
        </Text>
      </View>

      {/* 👤 Khách hàng */}
      <Text style={styles.customerText}>
      {order.userName}  |  {order.phone}
      </Text>
      
      <Text style={styles.addressText}>Địa chỉ nhận hàng:</Text>
      <Text style={styles.addressText}><Ionicons name="location-outline" size={15} color="#777" />{order.address}</Text>

      {/* 🍔 Danh sách món */}
      {order.items.slice(0, 2).map((item: any, index: number) => (
      <View key={index} style={styles.itemRow}>
        <Image source={{ uri: item.image || "https://via.placeholder.com/80" }} style={styles.itemImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemQty}>x{item.quantity}</Text>
          {/* Nếu muốn show đơn giá: */}
          {/* <Text style={styles.itemUnit}>{item.unitPrice.toLocaleString("vi-VN")}₫/sp</Text> */}
          {/* Thành tiền của dòng: */}
          <Text style={styles.itemPrice}>
            {Number(item.linePrice || 0).toLocaleString("vi-VN")}₫
          </Text>
        </View>
      </View>
    ))}
      {/* 💰 Tổng tiền */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Tiền hàng:</Text>
        <Text style={styles.totalValue}>
          {Number(order.subtotal).toLocaleString("vi-VN")}₫
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Phí vận chuyển:</Text>
        <Text style={styles.totalValue}>
          {Number(order.shippingFee).toLocaleString("vi-VN")}₫
        </Text>
      </View>

      <View style={styles.totalBox}>
        <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>Tổng cộng:</Text>
        <Text style={[styles.totalValue, { color: "#E53935", fontWeight: "bold", fontSize: 15 }]}>
          {Number(order.total).toLocaleString("vi-VN")}₫
        </Text>
      </View>

      {/* 🧭 Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailButton} onPress={onViewDetail}>
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.detailText}>Chi tiết</Text>
        </TouchableOpacity>

        {order.status === "processing" && (
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Ionicons name="checkmark-outline" size={16} color="#fff" />
            <Text style={styles.confirmText}>Xác nhận</Text>
          </TouchableOpacity>
        )}
        {order.status === "preparing" && (
          <TouchableOpacity style={styles.deliverButton} onPress={onDeliver}>
            <Ionicons name="bicycle-outline" size={16} color="#fff" />
            <Text style={styles.confirmText}>Giao hàng</Text>
          </TouchableOpacity>
        )}
        {order.status === "delivering" && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.confirmText}>Hoàn thành</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#F58220",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 30,
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 25 },
  tabWrapper: { marginVertical: 20 },
  tabScroll: { paddingHorizontal: 16, alignItems: "center" },
  tabButton: {
    backgroundColor: "#edecec",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTabButton: { backgroundColor: "#F58220" },
  tabText: { fontSize: 15, color: "#333", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center"},
  emptyText: { color: "#777", fontSize: 14, marginTop: 8 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  orderId: { fontWeight: "600", fontSize: 15, color: "#333" },
  orderStatus: { fontWeight: "bold", fontSize: 13 },
  customerText: { fontSize: 13, color: "#444", marginTop: 2 },
  addressText: { fontSize: 12, color: "#777", marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
    paddingBottom: 6,
  },
  itemImage: {
    width: 55,
    height: 55,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemName: { fontSize: 13, color: "#222", fontWeight: "500" },
  itemQty: { fontSize: 12, color: "#777" },
  itemPrice: { fontSize: 13, fontWeight: "bold", color: "#E53935", marginTop: 2 },
  moreText: { fontSize: 12, color: "#999", marginTop: 4, fontStyle: "italic" },
  itemUnit: { fontSize: 12, color: "#999" },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: { fontSize: 13, color: "#555" },
  totalValue: { fontSize: 14, color: "#333" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9E9E9E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  detailText: { color: "#fff", fontSize: 13, fontWeight: "600", marginLeft: 4 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deliverButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmText: { color: "#fff", fontSize: 13, fontWeight: "600", marginLeft: 4 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
