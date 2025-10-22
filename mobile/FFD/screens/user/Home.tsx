import React, { useState, useEffect, useContext } from "react";
import Swiper from "react-native-swiper";
import { Video, ResizeMode } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { Food } from "../../types/food";
import FoodCard from "../../components/FoodCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../data/FireBase";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";

const HomeScreen: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [suggestions, setSuggestions] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext)!;
  const { getTotalItems } = useContext(CartContext)!;
  const totalItems = getTotalItems();

  // 🧩 Lấy dữ liệu món ăn realtime từ Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "foods"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Food[];
      setFoods(list);
      setFilteredFoods(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🧠 Hiển thị gợi ý khi đang gõ
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matched = foods.filter((item) =>
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    setSuggestions(matched.slice(0, 5)); // chỉ hiển thị tối đa 5 gợi ý
    setShowSuggestions(true);
  };

  // ⏎ Khi nhấn Enter
  const handleSearchSubmit = () => {
    const result = foods.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFoods(result);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  // 🧍 Tên người dùng
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || "Khách";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#F58220" />
          <Text style={{ marginTop: 10 }}>Đang tải món ăn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          {/* Hàng trên: Tên người dùng + Chuông */}
          <View style={styles.headerTop}>
            {/* 👤 Tên người dùng */}
            <View style={styles.headerLeft}>
              <Ionicons name="person-circle-outline" size={32} color="white" />
              <Text style={styles.headerLoginText}>{userName}</Text>
            </View>

            {/* 🛒 Giỏ hàng + 🔔 Notification */}
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.cartIconWrapper}
                onPress={() => navigation.navigate("Cart")}
              >
                <Ionicons name="cart-outline" size={26} color="white" />
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity>
                <Ionicons name="notifications-outline" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>


          {/* 🔍 Ô tìm kiếm */}
          <View style={styles.deliveryBox}>
            <Text style={styles.deliveryTitle}>Tìm món bạn yêu thích </Text>
            <View style={styles.addressRow}>
              <Ionicons name="search-outline" size={20} color="gray" />
              <TextInput
                style={styles.addressInput}
                placeholder="Nhập tên món ăn..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchChange}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
            </View>

            {/* Gợi ý món ăn */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(item.name);
                      setShowSuggestions(false);
                      setFilteredFoods([item]);
                    }}
                  >
                    <Ionicons
                      name="fast-food-outline"
                      size={18}
                      color="#F58220"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Swiper
            autoplay
            autoplayTimeout={3}
            showsPagination
            dotStyle={{ backgroundColor: "#ccc" }}
            activeDotStyle={{ backgroundColor: "#F58220" }}
          >
            <Video
              source={require("../images/slider4.mp4")}
              style={styles.banner}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              useNativeControls={false}
            />
            <Image
              source={require("../images/slider1.png")}
              style={styles.banner}
              resizeMode="cover"
            />
            <Image
              source={require("../images/slider2.png")}
              style={styles.banner}
              resizeMode="cover"
            />
            <Image
              source={require("../images/slider3.png")}
              style={styles.banner}
              resizeMode="cover"
            />
          </Swiper>
        </View>

        {/* Danh sách món */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? "Kết quả tìm kiếm" : "Bán chạy nhất"}
          </Text>

          {filteredFoods.length === 0 ? (
            <Text>Không tìm thấy món nào phù hợp.</Text>
          ) : (
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <FoodCard
                  food={item}
                  onPress={() => navigation.navigate("FoodDetail", { food: item })}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
              snapToAlignment="center"
              decelerationRate="fast"
            />
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

export default HomeScreen;

// ===================== STYLES =====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    backgroundColor: "#F58220",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLoginText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  headerRight: {
  flexDirection: "row",
  alignItems: "center",
  gap: 16, // khoảng cách giữa giỏ hàng và chuông
},
cartIconWrapper: {
  position: "relative",
},
badge: {
  position: "absolute",
  top: -5,
  right: -8,
  backgroundColor: "red",
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
},
badgeText: {
  color: "white",
  fontSize: 11,
  fontWeight: "bold",
},

  deliveryBox: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#777",
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9e9e9e",
    paddingHorizontal: 8,
    height: 40,
  },
  addressInput: {
    flex: 1,
    marginLeft: 8,
    color: "#333",
    fontSize: 15,
  },
  suggestionBox: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 15,
    color: "#333",
  },
  sliderContainer: { height: 220, marginTop: 16 },
  banner: { width: "100%", height: "100%" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  
});
