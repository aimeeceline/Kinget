import React from "react";
import { View, Text, StyleSheet } from "react-native";


const AccountScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài khoản Nhà hàng</Text>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: "#F58220" },
});
