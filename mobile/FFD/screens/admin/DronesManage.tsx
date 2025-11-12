import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../data/FireBase";
import BottomSheet from "../../components/BottomSheet";
import { TextInput } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


const DronesManage = () => {
  const navigation = useNavigation<any>();

  const [drones, setDrones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  

  useEffect(() => {
    const fetchDrones = async () => {
      const snap = await getDocs(collection(db, "drones"));
      setDrones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchDrones();
  }, []);

  const handleSave = async () => {
    if (!editData) return;
    await updateDoc(doc(db, "drones", editData.id), editData);
    setDrones((prev) => prev.map((dr) => (dr.id === editData.id ? editData : dr)));
    setSelected(null);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#F58220" size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚁 Danh sách Drone</Text>
      <FlatList
        data={drones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}                            
                            onPress={() => navigation.navigate("DroneDetail", { drone: item })}
          >
            <Ionicons name="airplane-outline" size={40} color="#F58220" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || "Drone chưa đặt tên"}</Text>
              <Text style={styles.sub}>Trạng thái: {item.status || "Không rõ"}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title="Chi tiết Drone">
        <Text>Tên Drone</Text>
        <TextInput style={styles.input} value={selected?.name} onChangeText={(v) => setEditData({ ...selected, name: v })} />
        <Text>Trạng thái</Text>
        <TextInput style={styles.input} value={selected?.status} onChangeText={(v) => setEditData({ ...selected, status: v })} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
};

export default DronesManage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", padding: 12, borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 13, color: "#777" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginBottom: 10, padding: 8 },
  saveBtn: { backgroundColor: "#F58220", padding: 10, borderRadius: 8, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
