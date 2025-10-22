import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const AddressScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ nhận hàng</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.activeTab]}>Giao tận nơi</Text>
        <Text style={styles.tab}>Tự đến lấy</Text>
      </View>

      {/* Input */}
      <View style={styles.inputBox}>
        <Ionicons name="search-outline" size={20} color="gray" />
        <TextInput style={styles.input} placeholder="Nhập địa chỉ của bạn" />
      </View>

      {/* Use current location */}
      <TouchableOpacity style={styles.locationBtn}>
        <Ionicons name="location-outline" size={20} color="black" />
        <Text style={styles.locationText}>Sử dụng vị trí hiện tại của tôi</Text>
      </TouchableOpacity>

      {/* Saved addresses */}
      <Text style={styles.savedTitle}>Địa điểm đã lưu</Text>
      <TouchableOpacity style={styles.addBtn}>
        <Ionicons name="add-circle" size={24} color="#FF6600" />
        <Text style={styles.addText}>Thêm</Text>
      </TouchableOpacity>
      <Text style={styles.subText}>Lưu làm địa chỉ thân quen</Text>
    </View>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 12 },
  tabs: { flexDirection: "row", marginBottom: 16 },
  tab: { flex: 1, textAlign: "center", padding: 8, color: "#666" },
  activeTab: { color: "#FF6600", borderBottomWidth: 2, borderBottomColor: "#FF6600" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  input: { flex: 1, marginLeft: 6 },
  locationBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  locationText: { marginLeft: 8, fontSize: 16 },
  savedTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  addBtn: { flexDirection: "row", alignItems: "center" },
  addText: { marginLeft: 6, color: "#FF6600", fontSize: 16 },
  subText: { color: "gray", marginLeft: 32 },
});
