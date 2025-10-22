import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StoreManage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý cửa hàng / Thực đơn</Text>
    </View>
  );
};

export default StoreManage;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "#F58220" },
});
