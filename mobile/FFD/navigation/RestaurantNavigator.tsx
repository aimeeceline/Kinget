import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import RestaurantScreen from "../screens/restaurant/Dashboard";
import OrderManage from "../screens/restaurant/OrderManage";
import StoreManage from "../screens/restaurant/StoreManage";
import AccountScreen from "../screens/restaurant/Account";

const Tab = createBottomTabNavigator();

export default function RestaurantNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: "white",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        },
        tabBarLabelStyle: { fontSize: 14 },
        tabBarIcon: ({ focused, color }) => {
          let iconName = "";
          switch (route.name) {
            case "Trang chủ":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Đơn hàng":
              iconName = focused ? "receipt" : "receipt-outline";
              break;
            case "Nhà hàng":
              iconName = focused ? "storefront" : "storefront-outline";
              break;
            case "Tài khoản":
              iconName = focused ? "person" : "person-outline";
              break;
          }
          return <Ionicons name={iconName as any} size={24} color={color} />;
        },
        tabBarActiveTintColor: "#F58220",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Trang chủ" component={RestaurantScreen} />
      <Tab.Screen name="Đơn hàng" component={OrderManage} />
      <Tab.Screen name="Nhà hàng" component={StoreManage} />
      <Tab.Screen name="Tài khoản" component={AccountScreen} />
    </Tab.Navigator>
  );
}
