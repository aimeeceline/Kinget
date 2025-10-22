import React, { useEffect, useState } from "react";
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
import { RootStackParamList } from "../../navigation/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../data/FireBase";
import { Food } from "../../types/food";
import FoodCard from "../../components/FoodCard"; // ✅ dùng lại component chung

const categories = ["Tất cả", "Pizza", "Burger", "Combo", "Nước"];

const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(true);

  // 🔥 Lấy dữ liệu realtime từ Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "foods"), (snapshot) => {
      const list: Food[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Food, "id">),
      }));
      setFoods(list);
      setFilteredFoods(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🧩 Lọc món ăn theo danh mục
  const filterByCategory = (category: string) => {
    setActiveCategory(category);
    if (category === "Tất cả") {
      setFilteredFoods(foods);
    } else {
      setFilteredFoods(foods.filter((item) => item.category === category));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F58220" />
        <Text>Đang tải món ăn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Thanh danh mục */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                activeCategory === cat && styles.activeCategory,
              ]}
              onPress={() => filterByCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.activeCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Danh sách món */}
      <FlatList
        data={filteredFoods}
        numColumns={2}
        columnWrapperStyle={{ 
          justifyContent: "space-between", // ✅ tạo khoảng cách giữa 2 cột
          paddingHorizontal: 16, // ✅ thêm padding hai bên lề
        }}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FoodCard
            food={item}
            onPress={() => navigation.navigate("FoodDetail", { food: item })}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // 🟠 Thanh lọc danh mục
  categoryWrapper: { marginBottom: 10 },
  categoryScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  categoryButton: {
    backgroundColor: "#edececff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategory: {
    backgroundColor: "#F58220",
  },
  categoryText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  activeCategoryText: {
    color: "#fff",
  },
});
