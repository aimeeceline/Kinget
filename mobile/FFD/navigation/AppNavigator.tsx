import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Food } from "../types/food";


// ======= Các màn hình =======
import GetStartedScreen from "../screens/auth/GetStarted";
import AuthTabs from "../screens/auth/AuthTabs";
import UserNavigator from "./UserNavigator";
import RestaurantNavigator from "./RestaurantNavigator";
import AdminNavigator from "./AdminNavigator"; // 🆕 Thêm navigator cho admin

// ======= Màn hình chung =======
import FoodDetailScreen from "../screens/user/FoodDetail";
import CartScreen from "../screens/user/Cart";
import AddressScreen from "../screens/user/Address";
import CheckoutScreen from "../screens/user/Checkout";
import TransferScreen from "../screens/user/Transfer";
import OrderDetailScreen from "../screens/user/OrderDetail";

export type RootStackParamList = {
  GetStarted: undefined;
  Auth: { initialTab?: "login" | "register" };
  MainTabs: undefined;
  RestaurantTabs: undefined;
  AdminTabs: undefined; // 🆕 thêm route admin
  FoodDetail: {
      food: Food;
      branchId?: string;   // ✅ thêm dòng này
      branchName?: string; // ✅ thêm dòng này
    };  
  Cart: undefined;
  Address: undefined;
  Checkout: { selectedFoods: any[]; branchId: string };
  OrderDetail: { order: any };
  Transfer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, guestMode } = useAuth();

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
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ title: "Chi tiết món" }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Giỏ hàng" }} />
      <Stack.Screen name="Address" component={AddressScreen} options={{ title: "Địa chỉ giao hàng" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Thanh toán" }} />
      <Stack.Screen name="Transfer" component={TransferScreen} options={{ title: "Chuyển khoản" }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Chi tiết đơn hàng" }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
