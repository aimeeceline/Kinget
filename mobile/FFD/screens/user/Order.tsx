import React, { useEffect, useState, useRef } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { db } from "../../data/FireBase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

// ======================== Kiểu dữ liệu ========================
interface OrderItem {
  id: string;
  date: string;
  total: number;
  subtotal: number;
  status:
    | "processing"
    | "preparing"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled";
  branchId?: string;
  branchName?: string;
  orderAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingFee?: number;
  items: {
    name: string;
    image?: string;
    price?: number;
    quantity: number;
    selectedSize?: { label: string; price: number } | null;
    selectedBase?: { label: string; price: number } | null;
    selectedTopping?: { label: string; price: number }[] | null;
    selectedAddOn?: { label: string; price: number }[] | null;
  }[];
}

// ======================== Tabs ========================
const statusTabs = [
  { key: "processing", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "delivering", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

// ======================== Màn hình chính ========================
const OrderScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OrderItem["status"]>("processing");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const branchCache = useRef<Record<string, string>>({});

  // 🔄 Lấy danh sách đơn hàng realtime
  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const tempOrders: OrderItem[] = [];

        // Cache danh sách chi nhánh
        const branchSnap = await getDocs(collection(db, "branches"));
        branchSnap.forEach((b) => {
          branchCache.current[b.id] = (b.data() as any).name || "Không rõ chi nhánh";
        });

        snapshot.docs.forEach((docSnap) => {
          const order = docSnap.data();
          const createdAt = order.createdAt?.toDate?.() || new Date();

          tempOrders.push({
            id: docSnap.id,
            date: createdAt.toLocaleString("vi-VN"),
            total: order.total || 0,
            subtotal: order.subtotal || 0,
            status: order.status || "processing",
            branchId: order.branchId,
            branchName:
              branchCache.current[order.branchId] || "Không rõ chi nhánh",
            orderAddress: order.orderAddress || "Không có địa chỉ",
            receiverName: order.receiverName || "Khách hàng",
            receiverPhone: order.receiverPhone || "",
            paymentMethod: order.paymentMethod || "cash",
            shippingMethod: order.shippingMethod || "motorbike",
            shippingFee: order.shippingFee || 0,
            items: order.items || [],
          });
        });

        setOrders(tempOrders);
        setLoading(false);
      } catch (err) {
        console.error("🔥 Lỗi khi load đơn hàng:", err);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  // ======================== Hiển thị ========================
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text style={{ color: "#555", marginTop: 10 }}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 🟠 Tabs lọc trạng thái */}
      <View style={styles.tabWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.key as any)}
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
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-outline" size={48} color="#aaa" />
          <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} navigation={navigation} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default OrderScreen;

// ======================== Card đơn hàng ========================
const OrderCard = ({ order, navigation }: { order: OrderItem; navigation: any }) => {
  const getStatusColor = (status: OrderItem["status"]) => {
    switch (status) {
      case "processing":
        return "#F9A825";
      case "preparing":
        return "#db00da";
      case "delivering":
        return "#2196F3";
      case "delivered":
        return "#b39ddb";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#E53935";
      default:
        return "#333";
    }
  };

  return (
    <TouchableOpacity
      style={styles.orderCardContainer}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("OrderDetail", { order })}
    >
      {/* 🔹 Header */}
      <View style={styles.orderHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={styles.mallBadge}>
            <Text style={styles.mallText}>Mall</Text>
          </View>
          <Text style={styles.branchName}>
            {" "}
            {order.branchName || "Chi nhánh chưa xác định"}
          </Text>
        </View>
        <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
          {statusTabs.find((t) => t.key === order.status)?.label}
        </Text>
      </View>

      {/* 🍔 Danh sách sản phẩm */}
      {order.items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <Image
            source={{ uri: item.image || "https://via.placeholder.com/80" }}
            style={styles.itemImage}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text numberOfLines={1} style={styles.itemName}>
              {item.name}
            </Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              {(
                item.price ||
                (item.selectedSize?.price || 0) +
                  (item.selectedBase?.price || 0) +
                  (item.selectedTopping?.reduce((s, t) => s + (t.price || 0), 0) || 0) +
                  (item.selectedAddOn?.reduce((s, a) => s + (a.price || 0), 0) || 0)
              ).toLocaleString("vi-VN")}
              ₫
            </Text>
          </View>
        </View>
      ))}

      {/* 💰 Tổng tiền */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          Tổng số tiền ({order.items.length} món):
        </Text>
        <Text style={styles.totalValue}>{order.total.toLocaleString("vi-VN")}₫</Text>
      </View>
    </TouchableOpacity>
  );
};

// ======================== Styles ========================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabWrapper: { marginBottom: 10 },
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

  orderCardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mallBadge: {
    backgroundColor: "#D32F2F",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mallText: { color: "#fff", fontWeight: "bold", fontSize: 11 },
  branchName: { fontWeight: "600", fontSize: 14, color: "#222" },
  orderStatus: { fontWeight: "bold", fontSize: 13 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#f5f5f5",
  },
  itemName: { fontSize: 13, color: "#333", fontWeight: "500" },
  itemQty: { fontSize: 12, color: "#777", marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: "bold", color: "#E53935", marginTop: 2 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  totalLabel: { fontSize: 13, color: "#555" },
  totalValue: { fontSize: 14, fontWeight: "bold", color: "#E53935" },

  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { color: "#777", fontSize: 14, marginTop: 8 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
