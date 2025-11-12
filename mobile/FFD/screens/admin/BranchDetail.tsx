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

const BranchDetail = ({ route, navigation }: any) => {
  const { branch } = route.params || {};
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(branch || {});

  if (!branch) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>Không có dữ liệu chi nhánh để hiển thị.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "branches", form.id), {
        name: form.name || "",
        phone: form.phone || "",
        address: form.address || "",
        isActive: form.isActive ?? true,
      });
      Alert.alert("✅ Thành công", "Đã lưu thay đổi chi nhánh.");
      setEditMode(false);
    } catch (err) {
      console.error("❌ Lỗi cập nhật chi nhánh:", err);
      Alert.alert("Lỗi", "Không thể lưu thay đổi.");
    }
  };

  const handleCancelEdit = () => {
    setForm(branch); // quay lại dữ liệu gốc
    setEditMode(false);
  };

  return (
    <ScrollView style={styles.container}>
      {!editMode ? (
        <View style={styles.content}>
          <InfoRow label="Tên chi nhánh" value={form.name} />
          <InfoRow label="Số điện thoại" value={form.phone} />
          <InfoRow label="Địa chỉ" value={form.address} />
          <InfoRow
            label="Trạng thái"
            value={form.isActive ? "Đang hoạt động" : "Tạm ngưng"}
          />

          <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Input
            label="Tên chi nhánh"
            value={form.name || ""}
            onChange={(v: string) => setForm({ ...form, name: v })}
          />
          <Input
            label="Số điện thoại"
            value={form.phone || ""}
            onChange={(v: string) => setForm({ ...form, phone: v })}
          />
          <Input
            label="Địa chỉ"
            value={form.address || ""}
            onChange={(v: string) => setForm({ ...form, address: v })}
            multiline
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
              <Ionicons name="arrow-undo-outline" size={18} color="#F58220" />
              <Text style={styles.cancelText}>Quay lại</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BranchDetail;

/* 🔹 Component phụ trợ */
const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
  </View>
);

const Input = ({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) => (
  <View style={{ marginVertical: 8 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      style={[
        styles.input,
        multiline && { height: 90, textAlignVertical: "top" },
      ]}
      placeholder={`Nhập ${label.toLowerCase()}`}
      multiline={multiline}
    />
  </View>
);

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F58220",
    padding: 16,
    gap: 12,
  },
  title: { color: "#fff", fontWeight: "bold", fontSize: 18 },
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  cancelText: { color: "#F58220", fontWeight: "bold", marginLeft: 6 },
  saveBtn: {
    flex: 1,
    backgroundColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
  },
  saveText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
