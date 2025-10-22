import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

import GetStartedScreen from "../screens/auth/GetStarted";
import AuthTabs from "../screens/auth/AuthTabs";
import FoodDetailScreen from "../screens/user/FoodDetail";
import CartScreen from "../screens/user/Cart";
import AddressScreen from "../screens/user/Address";
import UserNavigator from "./UserNavigator";
import RestaurantNavigator from "./RestaurantNavigator";
import CheckoutScreen from "../screens/user/Checkout";
import OrderDetailScreen from "../screens/user/OrderDetail";

export type RootStackParamList = {
  GetStarted: undefined;
  Auth: { initialTab?: "login" | "register" };
  MainTabs: undefined;
  RestaurantTabs: undefined;
  FoodDetail: { food: any };
  Cart: undefined;
  Address: undefined;
  Checkout: undefined;
  OrderDetail: undefined;
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
      ["Home", "Menu", "Account", "Dashboard"].includes(currentRouteName);

    return {
      headerShown: true,
      headerStyle: {
        backgroundColor: "#fff",
        height: 80, // tăng nhẹ để cân đối icon + chữ
      },
      headerTitleAlign: "center",
      headerTitleStyle: {
        fontWeight: "bold",
        fontSize: 24,
        color: "#000000ff",
        marginTop: 100,
      },
      headerTintColor: "#F58220",
      headerShadowVisible: false,

      // ✅ Tùy chỉnh headerLeft cho nút back
      headerLeft: isMainTab
        ? undefined
        : () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingBottom:4 ,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // dễ bấm hơn
            >
              <Ionicons name="arrow-back" size={31} color="#F58220" />
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

      {/* Khách vãng lai (Guest) */}
      {guestMode && (
        <Stack.Screen
          name="MainTabs"
          component={UserNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* Người dùng thường */}
      {user?.role === "user" && (
        <Stack.Screen
          name="MainTabs"
          component={UserNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* Nhà hàng */}
      {user?.role === "restaurant" && (
        <Stack.Screen
          name="RestaurantTabs"
          component={RestaurantNavigator}
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
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Chi tiết đơn hàng" }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
