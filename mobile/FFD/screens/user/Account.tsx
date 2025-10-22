import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth} from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const AccountScreen: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigation = useNavigation<any>();

  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "Khách";

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          setUser(null);
          navigation.navigate("Auth");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F58220" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header người dùng */}
        <View style={styles.header}>
          <Image
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require("../images/avatar.jpg")
            }
            style={styles.avatar}
          />
          <Text style={styles.name}>{userName || "Người dùng"}</Text>
          <Text style={styles.phone}>{user?.phone || "+84 000 000 000"}</Text>
        </View>

        {/* Các tùy chọn tài khoản */}
        <View style={styles.menu}>
          <OptionItem
            icon="person-outline"
            title="Thông tin tài khoản"
            onPress={() => navigation.navigate("Profile")}
          />
          <OptionItem
            icon="location-outline"
            title="Thông tin giao hàng"
            onPress={() => navigation.navigate("Address")}
          />
          <OptionItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            onPress={() => navigation.navigate("ChangePassword")}
          />

          <View style={styles.divider} />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#F44336" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountScreen;

/* Component con - mỗi dòng menu */
const OptionItem = ({
  icon,
  title,
  onPress,
}: {
  icon: any;
  title: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <View style={styles.optionLeft}>
      <Ionicons name={icon} size={22} color="#555" />
      <Text style={styles.optionText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#ccc" />
  </TouchableOpacity>
);

/* 🎨 Style */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#F58220",
    alignItems: "center",
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  phone: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 14,
  },
  menu: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionText: {
    fontSize: 15,
    color: "#333",
  },
  divider: {
    height: 10,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F44336",
    marginTop: 8,
    marginBottom: 4,
  },
  logoutText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
