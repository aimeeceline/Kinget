import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../data/FireBase";

const UserDetail = ({ route, navigation }: any) => {
  const { user } = route.params || {};
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(user || {});

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>
          Không có dữ liệu người dùng để hiển thị.
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", form.id), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        isActive: form.isActive,
      });
      Alert.alert("✅ Thành công", "Đã lưu thay đổi thông tin người dùng.");
      setEditMode(false);
    } catch (err) {
      console.error("❌ Lỗi cập nhật user:", err);
      Alert.alert("Lỗi", "Không thể lưu thay đổi.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!editMode ? (
        <View style={styles.content}>
          <InfoRow label="Họ" value={form.lastName} />
          <InfoRow label="Tên" value={form.firstName} />
          <InfoRow label="Email" value={form.email} />
          <InfoRow label="Số điện thoại" value={form.phone} />
          <InfoRow label="Quyền" value={form.role} />

          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Input
            label="Họ"
            value={form.lastName || ""}
            onChange={(v: string) => setForm({ ...form, lastName: v })}
          />
          <Input
            label="Tên"
            value={form.firstName || ""}
            onChange={(v: string) => setForm({ ...form, firstName: v })}
          />
          <Input
            label="Email"
            value={form.email || ""}
            onChange={(v: string) => setForm({ ...form, email: v })}
          />
          <Input
            label="Số điện thoại"
            value={form.phone || ""}
            onChange={(v: string) => setForm({ ...form, phone: v })}
          />

          {/* 🔥 Nút Lưu full width */}
          <TouchableOpacity style={styles.saveBtnFull} onPress={handleSave}>
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default UserDetail;

/* 🧾 Info row */
const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
  </View>
);

/* 🧩 Input */
const Input = ({ label, value, onChange }: any) => (
  <View style={{ marginVertical: 8 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={`Nhập ${label.toLowerCase()}`}
    />
  </View>
);

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  content: { padding: 16 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
  },

  infoLabel: { color: "#333", fontWeight: "600" },
  infoValue: { color: "#555", flexShrink: 1, textAlign: "right" },

  editBtn: {
    backgroundColor: "#F58220",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
    paddingVertical: 10,
  },
  editText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },

  inputLabel: { color: "#555", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },

  /* 🔥 Nút Lưu full width */
  saveBtnFull: {
    backgroundColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  saveText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
});
