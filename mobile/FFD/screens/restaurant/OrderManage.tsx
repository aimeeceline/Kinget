// src/screens/Restaurant/RestaurantOrderScreen.tsx
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
import { useNavigation, NavigationProp } from "@react-navigation/native";

import { RootStackParamList } from "../../navigation/AppNavigator";
import { db } from "../../data/FireBase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

// ======================== Tabs trạng thái ========================
const statusTabs = [
  { key: "processing", label: "Chờ xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

const RestaurantOrderScreen: React.FC<{
  navigation: NavigationProp<RootStackParamList>;
}> = ({ navigation }) => {
  const { user } = useAuth(); // ✅ lấy user đang đăng nhập (restaurant)
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("processing");
  const [loading, setLoading] = useState(true);

  // 🔄 Lấy danh sách đơn hàng realtime, lọc theo chi nhánh của user
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const run = async () => {
      // chưa login / không phải restaurant / không có branchId
      if (!user || user.role !== "restaurant" || !user.branchId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const baseCol = collection(db, "orders");
        const q = query(
          baseCol,
          where("branchId", "==", user.branchId),
          orderBy("createdAt", "desc")
        );

        unsub = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map((docSnap) => {
              const raw: any = docSnap.data();
              const createdAt = raw.createdAt?.toDate?.() || new Date();

              const items = (raw.items || []).map((it: any) => {
                const toppingTotal = Array.isArray(it?.selectedTopping)
                  ? it.selectedTopping.reduce(
                      (s: number, t: any) => s + (t.price || 0),
                      0
                    )
                  : 0;

                const addOnTotal = Array.isArray(it?.selectedAddOn)
                  ? it.selectedAddOn.reduce(
                      (s: number, a: any) => s + (a.price || 0),
                      0
                    )
                  : 0;

                const unit =
                  Number(it?.price) ||
                  Number(it?.selectedSize?.price || 0) +
                    Number(it?.selectedBase?.price || 0) +
                    Number(toppingTotal) +
                    Number(addOnTotal);

                const qty = Number(it?.quantity || 1);

                return {
                  name: it?.name || "",
                  image: it?.image || "",
                  quantity: qty,
                  unitPrice: unit,
                  linePrice: unit * qty,
                  selectedSize: it?.selectedSize || null,
                  selectedBase: it?.selectedBase || null,
                  selectedTopping: Array.isArray(it?.selectedTopping)
                    ? it.selectedTopping
                    : [],
                  selectedAddOn: Array.isArray(it?.selectedAddOn)
                    ? it.selectedAddOn
                    : [],
                  note: it?.note || "",
                };
              });

              const subtotal = items.reduce(
                (s: number, it: any) => s + Number(it.linePrice || 0),
                0
              );
              const shippingFee = Number(raw?.shippingFee ?? 15000);
              const total = subtotal + shippingFee;

              return {
                id: docSnap.id,
                date: createdAt.toLocaleString("vi-VN"),
                status: raw.status || "processing",
                receiverAddress:
                  raw.orderAddress ||
                  raw.receiverAddress ||
                  "Không có địa chỉ",
                shippingMethod: raw.shippingMethod || "other",
                items,
                subtotal,
                shippingFee,
                total,
              };
            });

            setOrders(data);
            setLoading(false);
          },
          (err) => {
            console.error("🔥 Lỗi khi listen orders:", err);
            setLoading(false);
          }
        );
      } catch (e) {
        console.error("🔥 Lỗi khi load orders:", e);
        setLoading(false);
      }
    };

    run();

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // ✅ Cập nhật trạng thái (restaurant chỉ đi tới shipping)
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
        <Text style={{ marginTop: 10, color: "#555" }}>
          Đang tải đơn hàng...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <Ionicons name="receipt-outline" size={30} color="#fff" />
      </View>
      <StatusBar barStyle="light-content" backgroundColor="#F58220" />

      {/* Tabs */}
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

      {/* Danh sách đơn */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onConfirm={() => handleUpdateStatus(item.id, "preparing")}
            onDeliver={() => handleUpdateStatus(item.id, "shipping")}
            onReject={() => handleUpdateStatus(item.id, "cancelled")}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-outline" size={48} color="#aaa" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default RestaurantOrderScreen;

/* ======================== Card hiển thị từng đơn ======================== */
const OrderCard = ({
  order,
  onConfirm,
  onDeliver,
  onReject,
}: {
  order: any;
  onConfirm: () => void;
  onDeliver: () => void;
  onReject: () => void;
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "#F9A825";
      case "preparing":
        return "#E040FB";
      case "shipping":
        return "#2196F3";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#E53935";
      default:
        return "#333";
    }
  };

  const getShippingLabel = (method?: string) => {
    switch (method) {
      case "drone":
        return "Drone";
      case "motorbike":
        return "Xe máy";
      default:
        return "Khác";
    }
  };

  return (
    <TouchableOpacity
      style={styles.orderCardContainer}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate("RestaurantOrderDetail", { order: order })
      }
    >
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={styles.mallBadge}>
            <Text style={styles.mallText}>Delivery by</Text>
          </View>
          <Text style={[styles.branchName, { marginLeft: 6, flexShrink: 1 }]}>
            {getShippingLabel(order.shippingMethod)}
          </Text>
        </View>
        <Text
          style={[styles.orderStatus, { color: getStatusColor(order.status) }]}
        >
          {statusTabs.find((t) => t.key === order.status)?.label}
        </Text>
      </View>

      {/* Items */}
      {order.items.map((item: any, idx: number) => (
        <View key={idx} style={styles.itemRow}>
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
              {Number(
                item.unitPrice ??
                  item.price ??
                  (item.selectedSize?.price || 0) +
                    (item.selectedBase?.price || 0)
              ).toLocaleString("vi-VN")}
              ₫
            </Text>
          </View>
        </View>
      ))}

      {/* Tổng tiền */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          Tổng số tiền ({order.items.length} sản phẩm):
        </Text>
        <Text style={styles.totalValue}>
          {Number(order.total).toLocaleString("vi-VN")}₫
        </Text>
      </View>

      {/* Footer hành động */}
      <View style={styles.cardFooter}>
        {order.status === "processing" && (
          <>
            <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.confirmText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Ionicons name="checkmark-outline" size={16} color="#fff" />
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </>
        )}

        {order.status === "preparing" && (
          <TouchableOpacity style={styles.deliverButton} onPress={onDeliver}>
            <Ionicons name="bicycle-outline" size={16} color="#fff" />
            <Text style={styles.confirmText}>Giao hàng</Text>
          </TouchableOpacity>
        )}

        {/* shipping: không có nút Hoàn thành – khách sẽ tự bấm bên app/user */}
      </View>
    </TouchableOpacity>
  );
};

/* ======================== Styles ======================== */
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

  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#777", fontSize: 14, marginTop: 8 },

  orderCardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
    marginHorizontal: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    width: "100%",
    alignSelf: "center",
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

  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
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
  confirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
