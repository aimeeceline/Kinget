import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NotificationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🔔 Đây là màn hình Thông báo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  text: { fontSize: 18, fontWeight: "bold" },
});

export default NotificationScreen;
