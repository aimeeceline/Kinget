import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../data/FireBase";
import { useAuth } from "../../context/AuthContext";
import { Branch } from "../../types/branch";

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(true);
  const [branchData, setBranchData] = useState<Branch | null>(null);
  const [stats, setStats] = useState({
    newOrders: 0,
    delivering: 0,
    completed: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // 🧭 Lấy thông tin chi nhánh của nhà hàng từ Firestore
useEffect(() => {
  const fetchBranch = async () => {
    setLoading(true);

    try {
      if (!user?.branchId) {
        console.warn("⚠️ User chưa có branchId, không thể lấy chi nhánh.");
        setLoading(false);
        return;
      }

      // ✅ Lấy chi nhánh theo branchId
      const branchRef = doc(db, "branches", user.branchId);
      const branchSnap = await getDoc(branchRef);

      if (branchSnap.exists()) {
        const data = { ...(branchSnap.data() as Branch), id: branchSnap.id };
        setBranchData(data);
        setIsOpen(data.isActive ?? true);
        console.log("✅ Đã tải chi nhánh:", data.name);
      } else {
        console.warn("⚠️ Không tìm thấy chi nhánh:", user.branchId);
      }
    } catch (error) {
      console.error("❌ Lỗi lấy chi nhánh:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchBranch();
}, [user?.branchId]);

  // 🔥 Lấy thống kê đơn hàng theo branchId
  useEffect(() => {
    const fetchOrderStats = async () => {
      if (!branchData?.id) return;

      try {
        const q = query(
          collection(db, "orders"),
          where("branchId", "==", branchData.id)
        );
        const snapshot = await getDocs(q);

        let newOrders = 0,
          delivering = 0,
          completed = 0,
          revenue = 0;

        snapshot.docs.forEach((docSnap) => {
          const order = docSnap.data();
          if (order.status === "processing") newOrders++;
          else if (order.status === "delivering") delivering++;
          else if (order.status === "completed") {
            completed++;
            revenue += order.total || 0;
          }
        });

        setStats({ newOrders, delivering, completed, revenue });
      } catch (error) {
        console.error("⚠️ Lỗi lấy thống kê:", error);
      }
    };

    fetchOrderStats();
  }, [branchData?.id]);

  // 🏪 Cập nhật trạng thái mở cửa
  const handleToggleOpen = async (value: boolean) => {
    setIsOpen(value);
    if (branchData?.id) {
      try {
        const branchRef = doc(db, "branches", branchData.id);
        await updateDoc(branchRef, { isActive: value });
      } catch (error) {
        console.error("❌ Lỗi cập nhật trạng thái:", error);
      }
    }
  };

  // ⚡ Danh sách quản lý nhanh
  const quickActions = [
    { icon: "fast-food-outline", label: "Thực đơn", screen: "MenuManage" },
    { icon: "receipt-outline", label: "Đơn hàng", screen: "OrderManage" },
    { icon: "bar-chart-outline", label: "Doanh thu", screen: "Revenue" },
    { icon: "notifications-outline", label: "Thông báo", screen: "Notify" },
  ];

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text style={{ marginTop: 10, color: "#555" }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 🟠 Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Ionicons name="storefront-outline" size={30} color="#fff" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.userName}>
                {branchData?.name || user?.restaurantName || "Chưa xác định"}
              </Text>
              <Text style={{ color: "#fff", fontSize: 15 }}>
                {branchData?.address || "Đang cập nhật địa chỉ..."}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("Notify")}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ⚙️ Trạng thái cửa hàng */}
        <View style={styles.statusCard}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={isOpen ? "storefront-outline" : "close-circle-outline"}
              size={24}
              color={isOpen ? "#4CAF50" : "#E53935"}
            />
            <Text style={[styles.statusText, { marginLeft: 8 }]}>
              {isOpen ? "Cửa hàng đang mở" : "Cửa hàng tạm đóng"}
            </Text>
          </View>

          <Switch
            value={isOpen}
            onValueChange={handleToggleOpen}
            trackColor={{ false: "#ccc", true: "#F58220" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 🔸 Nội dung chính */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Tổng quan */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
          <View style={styles.row}>
            <StatBox label="Đơn hàng mới" value={stats.newOrders.toString()} color="#FF9800" />
            <StatBox label="Đang giao" value={stats.delivering.toString()} color="#2196F3" />
          </View>
          <View style={styles.row}>
            <StatBox label="Hoàn tất" value={stats.completed.toString()} color="#4CAF50" />
            <StatBox
              label="Doanh thu"
              value={`${stats.revenue.toLocaleString("vi-VN")} ₫`}
              color="#E91E63"
            />
          </View>
        </View>

        {/* Quản lý nhanh */}
        <Text style={styles.sectionTitle}>Quản lý</Text>
        <View style={styles.grid}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() =>
                navigation.navigate(item.screen, {
                  branchId: branchData?.id,
                  branchName: branchData?.name,
                })
              }
            >
              <Ionicons name={item.icon as any} size={26} color="#F58220" />
              <Text style={styles.gridText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

// ========================== Sub Component ==========================
const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <View style={[styles.statBox, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ========================== Styles ==========================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: {
    backgroundColor: "#F58220",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  userName: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: { fontSize: 14, fontWeight: "600", color: "#333" },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#333" },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  statBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    margin: 5,
    borderLeftWidth: 4,
  },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#333" },
  statLabel: { color: "#777", fontSize: 13, marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridItem: {
    width: "47%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  gridText: { marginTop: 8, fontSize: 15, fontWeight: "600", color: "#333" },
});
