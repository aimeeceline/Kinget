import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../data/FireBase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

const MenuManageScreen: React.FC<any> = ({ navigation }) => {
  const [foods, setFoods] = useState<any[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");

  const categories = ["Tất cả", "Pizza", "Burger", "Combo", "Nước"];

  // 🟠 Lấy dữ liệu món ăn từ Firestore
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const snap = await getDocs(collection(db, "foods"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFoods(data);
        setFilteredFoods(data);
      } catch (error) {
        console.error("Lỗi tải món ăn:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // 🔍 Lọc món theo tên & danh mục
  useEffect(() => {
    let list = foods;
    if (category !== "Tất cả") {
      list = list.filter((f) => f.category === category);
    }
    if (search.trim() !== "") {
      list = list.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredFoods(list);
  }, [search, category, foods]);

  // 🗑 Xoá món
  const handleDelete = async (id: string) => {
    Alert.alert("Xác nhận xoá", "Bạn có chắc muốn xoá món này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "foods", id));
          setFoods((prev) => prev.filter((f) => f.id !== id));
        },
      },
    ]);
  };

  // 🔄 Bật/tắt trạng thái còn bán
  const toggleAvailability = async (id: string, available: boolean) => {
    await updateDoc(doc(db, "foods", id), { available: !available });
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, available: !available } : f))
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text style={{ color: "#555", marginTop: 10 }}>Đang tải thực đơn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F58220" />

      {/* 🧡 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍔 Quản lý thực đơn</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddFood")}>
          <Ionicons name="add-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 🔍 Thanh tìm kiếm */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm món ăn..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 🏷️ Bộ lọc danh mục */}
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryBtn,
              category === cat && styles.activeCategoryBtn,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                category === cat && styles.activeCategoryText,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📦 Danh sách món */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.image || "https://via.placeholder.com/80" }}
              style={styles.image}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>
                {item.price?.toLocaleString("vi-VN")}₫
              </Text>
              <Text style={styles.category}>{item.category}</Text>
              <Text
                style={{
                  color: item.available ? "#4CAF50" : "#E53935",
                  fontWeight: "600",
                }}
              >
                {item.available ? "Đang bán" : "Hết hàng"}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  toggleAvailability(item.id, item.available ?? true)
                }
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color="#2196F3"
                  style={{ marginBottom: 8 }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("EditFood", { food: item })}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color="#F58220"
                  style={{ marginBottom: 8 }}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </SafeAreaView>
  );
};

export default MenuManageScreen;

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#F58220",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 18 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    margin: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: { marginLeft: 6, flex: 1, fontSize: 14 },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 4,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
  },
  activeCategoryBtn: { backgroundColor: "#F58220" },
  categoryText: { fontSize: 13, color: "#333", fontWeight: "600" },
  activeCategoryText: { color: "#fff" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: 70, height: 70, borderRadius: 8 },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  price: { fontSize: 14, fontWeight: "bold", color: "#E53935" },
  category: { fontSize: 12, color: "#777", marginBottom: 2 },
  actions: { justifyContent: "center", alignItems: "center", marginLeft: 6 },

  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
