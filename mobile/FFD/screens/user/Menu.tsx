import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../data/FireBase";
import { Food } from "../../types/food";
import FoodCard from "../../components/FoodCard";

const categories = ["Tất cả", "Pizza", "Burger", "Drink"];

const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Tất cả món (foods) và món đã lọc để hiển thị
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);

  // Chi nhánh & branchFoods
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeBranch, setActiveBranch] = useState<string | undefined>(undefined);
  const [branchKeys, setBranchKeys] = useState<Set<string>>(new Set()); // chứa id hoặc name món hợp lệ của chi nhánh

  // Category
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  // Loading
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingBranchFoods, setLoadingBranchFoods] = useState(true);

  // ===== Lấy danh sách chi nhánh (realtime)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "branches"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as any).name,
      }));
      setBranches(list);
      // chọn mặc định chi nhánh đầu tiên nếu chưa có
      if (!activeBranch && list.length > 0) setActiveBranch(list[0].id);
      setLoadingBranches(false);
    });
    return unsub;
  }, []);

  // ===== Lấy tất cả foods (realtime)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "foods"), (snap) => {
      const list: Food[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Food, "id">),
      }));
      setFoods(list);
      setLoadingFoods(false);
    });
    return unsub;
  }, []);

  // ===== Lấy branchFoods theo chi nhánh (realtime)
  useEffect(() => {
    if (!activeBranch) return;
    setLoadingBranchFoods(true);

    const unsub = onSnapshot(
      collection(db, `branches/${activeBranch}/branchFoods`),
      (snap) => {
        // gom các khóa (id hoặc name) của món được bật
        const keys = new Set<string>();
        snap.forEach((d) => {
          const data = d.data() as any;
          const enabled =
            data?.isAvailable === true ||
            data?.isAvailable === "true" ||
            data?.isAvailable === 1;
          if (!enabled) return;

          if (data.foodId) keys.add(String(data.foodId));
          if (data.foodName) keys.add(String(data.foodName));
        });
        setBranchKeys(keys);
        setLoadingBranchFoods(false);
      }
    );

    return unsub;
  }, [activeBranch]);

  // ===== Tính danh sách hiển thị cuối cùng
  useEffect(() => {
    // Khi chưa có foods hoặc chưa có branchKeys thì không lọc vội
    if (loadingFoods || loadingBranches || loadingBranchFoods) return;

    let base = foods;

    if (activeBranch) {
      // Lọc theo chi nhánh: hỗ trợ match theo id hoặc theo name
      base = foods.filter(
        (f) => branchKeys.has(f.id) || branchKeys.has(f.name)
      );
    }

    // Lọc theo category
    if (activeCategory !== "Tất cả") {
      base = base.filter((f) => f.category === activeCategory);
    }

    setFilteredFoods(base);
  }, [
    foods,
    branchKeys,
    activeBranch,
    activeCategory,
    loadingFoods,
    loadingBranches,
    loadingBranchFoods,
  ]);

  const isLoading = loadingFoods || loadingBranches || loadingBranchFoods;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text>Đang tải menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== Tabs chi nhánh ===== */}
      <View style={styles.tabSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.tabButton,
                activeBranch === b.id && styles.activeTab,
              ]}
              onPress={() => setActiveBranch(b.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeBranch === b.id && styles.activeTabText,
                ]}
              >
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Tabs category ===== */}
      <View style={styles.tabSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.tabButton,
                activeCategory === cat && styles.activeTab,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === cat && styles.activeTabText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ===== Danh sách món ===== */}
      <FlatList
        data={filteredFoods}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FoodCard
            food={item}
            onPress={() =>
              navigation.navigate("FoodDetail", {
                food: item,
                branchId: activeBranch ?? undefined,                 
                branchName: branches.find(b => b.id === activeBranch)?.name || undefined,
              })
            }
/>

        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40, color: "#777" }}>
            Chi nhánh này chưa có món ăn khả dụng.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  tabSection: { marginBottom: 6 },
  tabScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
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
});
