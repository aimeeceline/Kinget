import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../data/FireBase";
import BottomSheet from "../../components/BottomSheet";
import { TextInput } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";


const BranchesManage = () => {

  const navigation = useNavigation<any>();

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      const snap = await getDocs(collection(db, "branches"));
      setBranches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchBranches();
  }, []);

  const handleSave = async () => {
    if (!editData) return;
    await updateDoc(doc(db, "branches", editData.id), {
      name: editData.name,
      address: editData.address,
      phone: editData.phone,
    });
    setBranches((prev) => prev.map((b) => (b.id === editData.id ? editData : b)));
    setSelected(null);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#F58220" size="large" />;

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Text style={styles.header}>Danh sách chi nhánh</Text>
      <FlatList
        data={branches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}                            
                            onPress={() => navigation.navigate("BranchDetail", { branch: item })}
          >
            <Ionicons name="business-outline" size={36} color="#F58220"  style={{ marginRight: 10 }}/>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title="Chi tiết chi nhánh">
        <Text>Tên chi nhánh</Text>
        <TextInput style={styles.input} value={selected?.name} onChangeText={(v) => setEditData({ ...selected, name: v })} />
        <Text>Địa chỉ</Text>
        <TextInput style={styles.input} value={selected?.address} onChangeText={(v) => setEditData({ ...selected, address: v })} />
        <Text>Số điện thoại</Text>
        <TextInput style={styles.input} value={selected?.phone} onChangeText={(v) => setEditData({ ...selected, phone: v })} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  </SafeAreaView>
    
  );
};

export default BranchesManage;

const styles = StyleSheet.create({
   safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
  header: { fontWeight: "bold", fontSize: 18, marginBottom: 15 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 8, marginBottom: 15, borderWidth:1, borderColor: "#F58220" },
  name: { fontSize: 16, fontWeight: "600", },
  sub: { fontSize: 13, color: "#777" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginBottom: 10, padding: 8 },
  saveBtn: { backgroundColor: "#F58220", padding: 10, borderRadius: 8, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
