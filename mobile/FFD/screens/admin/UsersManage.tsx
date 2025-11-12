import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../data/FireBase";
import BottomSheet from "../../components/BottomSheet";
import { TextInput } from "react-native-gesture-handler";

const UsersManage = ({ navigation }: any) => {  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    await updateDoc(doc(db, "users", editing.id), {
      email: editing.email,
      phone: editing.phone,
      isActive: editing.isActive,
    });
    setUsers((prev) => prev.map((u) => (u.id === editing.id ? editing : u)));
    setEditing(null);
    setSelected(null);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F58220" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>👥 Danh sách người dùng</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} 
                            onPress={() => navigation.navigate("UserDetail", { user: item })}
            >
            <Ionicons name="person-circle-outline" size={40} color="#F58220" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.sub}>{item.email}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
      />

      {/* BottomSheet chỉnh sửa */}
      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title="Chi tiết người dùng">
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          value={editing?.email ?? selected?.email}
          onChangeText={(v) => setEditing({ ...selected, email: v })}
        />
        <Text>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={editing?.phone ?? selected?.phone}
          onChangeText={(v) => setEditing({ ...selected, phone: v })}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
};

export default UsersManage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
  },
  name: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 13, color: "#777" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginBottom: 10, padding: 8 },
  saveBtn: { backgroundColor: "#F58220", padding: 10, borderRadius: 8, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
