import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/user/Home";
import MenuScreen from "../screens/user/Menu";
import OrderScreen from "../screens/user/Order";
import AccountScreen from "../screens/user/Account";


const Tab = createBottomTabNavigator();

export default function UserNavigator() {
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
            case "Menu":
              iconName = focused ? "restaurant" : "restaurant-outline";
              break;
            case "Đơn hàng":
              iconName = focused ? "receipt" : "receipt-outline";
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
      <Tab.Screen name="Trang chủ" component={HomeScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Đơn hàng" component={OrderScreen} />
      <Tab.Screen name="Tài khoản" component={AccountScreen} />
    </Tab.Navigator>
  );
}
