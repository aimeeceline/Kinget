import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../data/FireBase";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";

const categories = ["Tất cả", "Pizza", "Burger", "Drink"];
const statusTabs = ["Tất cả", "Đang bán", "Tạm ngưng"];

const MenuManage: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [foods, setFoods] = useState<any[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [activeStatus, setActiveStatus] = useState("Tất cả");

  useEffect(() => {
    const fetchData = async () => {
      console.log("👤 User info:", user);

      // 🔹 Nếu user chưa có branchId → không thể load chi nhánh
      if (!user?.branchId) {
        console.warn("⚠️ User chưa có branchId, không thể lấy menu theo chi nhánh.");
        setLoading(false);
        return;
      }

      try {
        // 🔥 Tham chiếu tới collection branchFoods của chi nhánh
        const branchFoodsRef = collection(db, `branches/${user.branchId}/branchFoods`);
        const foodsSnap = await getDocs(collection(db, "foods"));
        const allFoods = foodsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // 🔄 Lắng nghe realtime menu chi nhánh
        const unsubscribe = onSnapshot(branchFoodsRef, (snapshot) => {
          const branchList = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));

          console.log("🔥 Cập nhật branchFoods:", branchList.length);

          // 🧩 Gộp dữ liệu giữa foods và branchFoods
          const merged = branchList.map((bf) => {
  // ✅ Ưu tiên tìm theo foodId vì đây là ID thực của món trong "foods"
  const foodMatch =
    allFoods.find((f) => f.id === bf.foodId) ||
    allFoods.find(
      (f) =>
        f.name?.trim()?.toLowerCase() ===
        bf.foodName?.trim()?.toLowerCase()
    );

  return {
    id: bf.id, // ID document trong branchFoods
    foodId: bf.foodId, // Lưu luôn ID gốc để truy cập nhanh
    name: bf.foodName || foodMatch?.name || "Món chưa xác định",
    image: foodMatch?.image || bf.image || "",
    category: foodMatch?.category || "Khác", // ✅ Đọc category từ foods
    price:
      foodMatch?.price ??
      (foodMatch?.sizes?.[0]?.price ?? bf.price ?? 0), // lấy giá đúng nhất
    isAvailable: bf.isAvailable ?? true,
    stock: bf.stock ?? 0,
  };
});



          setFoods(merged);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error("❌ Lỗi lấy dữ liệu menu:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.branchId]);

  // 🔸 Lọc theo danh mục + trạng thái
  useEffect(() => {
    let base = foods;

    if (activeCategory !== "Tất cả") {
      base = base.filter(
        (f) => f.category?.trim()?.toLowerCase() === activeCategory.toLowerCase()
      );
    }


    if (activeStatus === "Đang bán") {
      base = base.filter((f) => f.isAvailable);
    } else if (activeStatus === "Tạm ngưng") {
      base = base.filter((f) => !f.isAvailable);
    }

    setFilteredFoods(base);
  }, [foods, activeCategory, activeStatus]);

  // ✅ Toggle trạng thái bán / ngưng món
  const toggleAvailability = async (foodId: string, current: boolean) => {
  try {
    // 🧩 Cập nhật UI ngay lập tức để mượt
    setFoods((prev) =>
      prev.map((f) =>
        f.id === foodId ? { ...f, isAvailable: !current } : f
      )
    );

    // ⏳ Đồng bộ Firestore (nền)
    if (!user?.branchId) return;
    const foodRef = doc(db, `branches/${user.branchId}/branchFoods`, foodId);
    await updateDoc(foodRef, { isAvailable: !current });
  } catch (err) {
    console.error("⚠️ Lỗi cập nhật trạng thái bán:", err);
  }
};


  return (
    <SafeAreaView style={styles.container}>
      {/* 🔶 Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thực đơn chi nhánh</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AddFood", { branchId: user?.branchId })
          }
        >
          <Ionicons name="add-circle-outline" size={30} color="#fff" />
        </TouchableOpacity>

      </View>

      {/* 🔸 Tabs trạng thái */}
      <View style={styles.tabSection}>
        <FlatList
          horizontal
          data={statusTabs}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeStatus === item && styles.activeTab,
              ]}
              onPress={() => setActiveStatus(item)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeStatus === item && styles.activeTabText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 🔸 Tabs danh mục */}
      <View style={styles.tabSection}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeCategory === item && styles.activeTab,
              ]}
              onPress={() => setActiveCategory(item)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === item && styles.activeTabText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 📋 Danh sách món ăn */}
      {filteredFoods.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="fast-food-outline" size={48} color="#aaa" />
          <Text style={styles.emptyText}>Không có món nào phù hợp</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              // ✅ Bấm vào toàn bộ card (trừ Switch) để xem chi tiết
              onPress={async () => {
                try {
                  const foodId = item.foodId || item.id;
                  const docRef = doc(db, "foods", foodId);
                  const docSnap = await getDoc(docRef);

                  let fullData = item;
                  if (docSnap.exists()) {
                    fullData = { ...item, ...docSnap.data(), id: foodId };
                  } else {
                    console.warn("⚠️ Không tìm thấy dữ liệu món ăn trong foods:", foodId);
                  }

                  navigation.navigate("RestaurantFoodDetail", { food: fullData });
                } catch (err) {
                  console.error("❌ Lỗi load chi tiết món:", err);
                }
              }}
            >
              <Image
                source={{
                  uri: item.image?.startsWith("http")
                    ? item.image
                    : "https://via.placeholder.com/100",
                }}
                style={styles.image}
              />

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text
                  style={{
                    color: item.isAvailable ? "#4CAF50" : "#E53935",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {item.isAvailable ? "Đang bán" : "Tạm ngưng"}
                </Text>
              </View>
              {/* ✅ Switch được bọc để chặn sự kiện lan */}
              <View
                onStartShouldSetResponder={() => true}
                onTouchStart={(e) => e.stopPropagation()}
              ></View>

              {/* ✅ Switch: ngăn sự kiện lan lên TouchableOpacity */}
              <Switch
                value={item.isAvailable ?? true}
                onValueChange={(value) => {
                  // Ngăn chặn sự kiện lan lên onPress
                  // (Khi user chạm vào Switch, không bị trigger navigation)
                  toggleAvailability(item.id, item.isAvailable);
                }}
                trackColor={{ false: "#ccc", true: "#F58220" }}
                thumbColor="#fff"
                style={{ transform: [{ scale: 0.9 }] }}
              />
            </TouchableOpacity>
          )}
        />

      )}
    </SafeAreaView>
  );
};

export default MenuManage;

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#F58220",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  tabSection: { marginTop: 15 },
  tabScroll: { paddingHorizontal: 16 },
  tabButton: {
    backgroundColor: "#EDECEC",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: { backgroundColor: "#F58220" },
  tabText: { fontSize: 15, color: "#333", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  name: { fontWeight: "bold", fontSize: 15, color: "#333" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#777", marginTop: 8 },
});
