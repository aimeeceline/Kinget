import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { Food } from "../types/food";

// ======= Các màn hình =======
import GetStartedScreen from "../screens/auth/GetStarted";
import AuthTabs from "../screens/auth/AuthTabs";
import UserNavigator from "./UserNavigator";
import RestaurantNavigator from "./RestaurantNavigator";
import AdminNavigator from "./AdminNavigator";

// ======= Màn hình User =======
import FoodDetailScreen from "../screens/user/FoodDetail";
import CartScreen from "../screens/user/Cart";
import AddressScreen from "../screens/user/Address";
import CheckoutScreen from "../screens/user/Checkout";
import TransferScreen from "../screens/user/Transfer";
import OrderDetailScreen from "../screens/user/OrderDetail";

// ======= Màn hình Restaurant =======
import RestaurantOrderDetailScreen from "../screens/restaurant/RestaurantOrderDetail";
import MenuManage from "../screens/restaurant/MenuManage";
import RestaurantFoodDetail from "../screens/restaurant/RestaurantFoodDetail";
import OrderManage from "../screens/restaurant/OrderManage";
import AddFoodScreen from "../screens/restaurant/AddFood";

// ======= Màn hình Admin =======
import UserDetail from "../screens/admin/UserDetail";
import BranchDetail from "../screens/admin/BranchDetail";
import DroneDetail from "../screens/admin/DroneDetail";
import AdminAccount from "../screens/admin/AdminAccount";





export type RootStackParamList = {
  GetStarted: undefined;
  Auth: { initialTab?: "login" | "register" };

  MainTabs: undefined;
  RestaurantTabs: undefined;
  AdminTabs: undefined;

  FoodDetail: {
    food: Food;
    branchId?: string;
    branchName?: string;
  };
  Cart: undefined;
  Address: undefined;
  Checkout: { selectedFoods: any[]; branchId: string };
  OrderDetail: { order: any };
  Transfer: undefined;

  RestaurantOrderDetail: { order: any };
  MenuManage: undefined;
  OrderManage: undefined;
  RestaurantFoodDetail: { food: any };
  AddFood: { branchId?: string };

  UserDetail: { user: any };
  BranchDetail: { branch: any };
  DroneDetail: { drone: any };

};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, setUser, guestMode } = useAuth();
  const [loading, setLoading] = useState(true);

  // 🔄 Khôi phục đăng nhập tự động từ AsyncStorage
  useEffect(() => {
    const restoreUser = async () => {
      try {
        // 🚫 Bỏ auto-login (xóa dữ liệu cũ)
        await AsyncStorage.removeItem("FFD_USER");

        setUser(null);
      } catch (e) {
        console.log("Error clearing user:", e);
      } finally {
        setLoading(false);
      }
    };
    restoreUser();
}, []);

  // ⏳ Khi đang khôi phục user
  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => {
        const currentRouteName = getFocusedRouteNameFromRoute(route) ?? "";
        const isMainTab =
          route.name === "MainTabs" ||
          route.name === "RestaurantTabs" ||
          route.name === "AdminTabs" ||
          ["Home", "Menu", "Account", "Dashboard"].includes(currentRouteName);

        return {
          headerShown: true,
          headerStyle: { backgroundColor: "#fff", height: 80 },
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 22,
            color: "#000",
          },
          headerTintColor: "#F58220",
          headerShadowVisible: false,
          headerLeft: isMainTab
            ? undefined
            : () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={28} color="#F58220" />
                </TouchableOpacity>
              ),
        };
      }}
    >
      {/* Người chưa đăng nhập */}
      {!user && !guestMode && (
        <>
          <Stack.Screen
            name="GetStarted"
            component={GetStartedScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthTabs}
            options={{ headerShown: false }}
          />
        </>
      )}

      {/* Khách */}
      {guestMode && (
        <Stack.Screen
          name="MainTabs"
          component={UserNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* User */}
      {user?.role === "user" && (
        <Stack.Screen
          name="MainTabs"
          component={UserNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* Restaurant */}
      {user?.role === "restaurant" && (
        <Stack.Screen
          name="RestaurantTabs"
          component={RestaurantNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* Admin */}
      {user?.role === "admin" && (
        <Stack.Screen
          name="AdminTabs"
          component={AdminNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* Màn hình chung */}
      <Stack.Screen
        name="FoodDetail"
        component={FoodDetailScreen}
        options={{ title: "Chi tiết món" }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: "Giỏ hàng" }}
      />
      <Stack.Screen
        name="Address"
        component={AddressScreen}
        options={{ title: "Địa chỉ giao hàng" }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Thanh toán" }}
      />
      <Stack.Screen
        name="Transfer"
        component={TransferScreen}
        options={{ title: "Chuyển khoản" }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Chi tiết đơn hàng" }}
      />
      <Stack.Screen
        name="RestaurantOrderDetail"
        component={RestaurantOrderDetailScreen}
        options={{ title: "Chi tiết đơn hàng" }}
      />
      <Stack.Screen
        name="MenuManage"
        component={MenuManage}
        options={{ title: "Quản lý thực đơn" }}
      />
      <Stack.Screen
        name="RestaurantFoodDetail"
        component={RestaurantFoodDetail}
        options={{ title: "Chi tiết món ăn" }}
      />
      <Stack.Screen
        name="OrderManage"
        component={OrderManage}
        options={{ title: "Quản lý đơn hàng" }}
      />
      <Stack.Screen
        name="AddFood"
        component={AddFoodScreen}
        options={{ title: "Thêm món mới" }}
      />
      {/* ⚙️ Admin – Các màn hình quản lý */}
     
      <Stack.Screen
        name="UserDetail"
        component={UserDetail}
        options={{ title: "Chi tiết người dùng" }}
      />
      <Stack.Screen
        name="BranchDetail"
        component={BranchDetail}
        options={{ title: "Chi tiết chi nhánh" }}
      />
      <Stack.Screen
        name="DroneDetail"
        component={DroneDetail}
        options={{ title: "Chi tiết Drone" }}
      />


    </Stack.Navigator>
    
  );
};

export default AppNavigator;
