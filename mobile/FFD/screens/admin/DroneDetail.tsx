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

const DroneDetail = ({ route }: any) => {
  const { drone } = route.params || {};
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(drone || {});

  if (!drone) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>
          Không có dữ liệu drone để hiển thị.
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "drones", form.id), {
        name: form.name || "",
        status: form.status || "",
        battery: form.battery ?? 0,
        branchId: form.branchId || "",
      });

      Alert.alert("✅ Thành công", "Đã lưu thay đổi drone.");
      setEditMode(false);
    } catch (err) {
      console.error("❌ Lỗi cập nhật drone:", err);
      Alert.alert("Lỗi", "Không thể lưu thay đổi.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!editMode ? (
        <View style={styles.content}>
          <InfoRow label="Tên Drone" value={form.name} />
          <InfoRow label="Tình trạng" value={form.status} />
          <InfoRow label="Pin (%)" value={String(form.battery ?? 0)} />
          <InfoRow label="Chi nhánh" value={form.branchId} />

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create-outline" size={18} color="#fff"  />
            <Text style={styles.editText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Input
            label="Tên Drone"
            value={form.name || ""}
            onChange={(v: string) => setForm({ ...form, name: v })}
          />
          <Input
            label="Tình trạng"
            value={form.status || ""}
            onChange={(v: string) => setForm({ ...form, status: v })}
          />
          <Input
            label="Pin (%)"
            value={String(form.battery ?? "")}
            onChange={(v: string) =>
              setForm({ ...form, battery: Number(v) || 0 })
            }
          />
          <Input
            label="Chi nhánh"
            value={form.branchId || ""}
            onChange={(v: string) => setForm({ ...form, branchId: v })}
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

export default DroneDetail;

/* ==================== COMPONENT PHỤ ==================== */

const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
  </View>
);

const Input = ({ label, value, onChange }: any) => (
  <View style={{ marginVertical: 8 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      style={styles.input}
      placeholder={`Nhập ${label.toLowerCase()}`}
    />
  </View>
);

/* ==================== STYLE ==================== */

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

  /* 🔥 Lưu full width */
  saveBtnFull: {
    backgroundColor: "#F58220",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
