import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isOpen, setIsOpen] = useState(true);

  const quickActions = [
    { icon: "fast-food-outline", label: "Thực đơn", screen: "MenuManage" },
    { icon: "receipt-outline", label: "Đơn hàng", screen: "OrderManage" },
    { icon: "bar-chart-outline", label: "Doanh thu", screen: "Revenue" },
    { icon: "notifications-outline", label: "Thông báo", screen: "Notify" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* 🟠 Header đồng bộ với Home */}
     <View style={styles.headerContainer}>
  {/* Header trên cùng */}
  <View style={styles.headerContent}>
    <View style={styles.userInfo}>
      <Ionicons name="person-circle-outline" size={30} color="#fff" />
      <Text style={styles.userName}>Kinget</Text>
    </View>

    <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
      <Ionicons name="notifications-outline" size={24} color="#fff" />
    </TouchableOpacity>
  </View>

  {/* 🏪 Thẻ trạng thái cửa hàng */}
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
      onValueChange={setIsOpen}
      trackColor={{ false: "#ccc", true: "#F58220" }}
      thumbColor="#fff"
    />
  </View>

</View>

      {/* 🔸 Nội dung chính */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* Tổng quan hôm nay */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
          <View style={styles.row}>
            <StatBox label="Đơn hàng mới" value="5" color="#FF9800" />
            <StatBox label="Đang giao" value="2" color="#2196F3" />
          </View>
          <View style={styles.row}>
            <StatBox label="Hoàn tất" value="10" color="#4CAF50" />
            <StatBox label="Doanh thu" value="3.200.000₫" color="#E91E63" />
          </View>
        </View>

        {/* Quản lý nhanh */}
        <Text style={styles.sectionTitle}>Quản lý</Text>
        <View style={styles.grid}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              onPress={() => navigation.navigate(item.screen)}
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

/* 🧩 Component nhỏ */
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

/* 🎨 Styles */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
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

userInfo: {
  flexDirection: "row",
  alignItems: "center",
},

userName: {
  color: "#fff",
  fontSize: 17,
  fontWeight: "bold",
  marginLeft: 6,
},

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

statusText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
},

statusSubText: {
  color: "#fff",
  fontSize: 13,
  marginTop: 8,
  marginLeft: 4,
},


  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F58220",
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    margin: 5,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    color: "#777",
    fontSize: 13,
    marginTop: 2,
  },
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
  gridText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  footerText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
});
