import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

//import AdminDashboard from "../screens/admin/Dashboard";
// import ManageUsers from "../screens/admin/ManageUsers";
// import ManageOrders from "../screens/admin/ManageOrders";
// import AdminAccount from "../screens/admin/Account";

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: "white",
        },
        tabBarIcon: ({ focused, color }) => {
          let icon = "home-outline";
          if (route.name === "Dashboard") icon = focused ? "home" : "home-outline";
          if (route.name === "Quản lý người dùng") icon = focused ? "people" : "people-outline";
          if (route.name === "Quản lý đơn hàng") icon = focused ? "list" : "list-outline";
          if (route.name === "Tài khoản") icon = focused ? "person" : "person-outline";
          return <Ionicons name={icon as any} size={24} color={color} />;
        },
        tabBarActiveTintColor: "#F58220",
        tabBarInactiveTintColor: "gray",
      })}
    >
      {/* <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Quản lý người dùng" component={ManageUsers} />
      <Tab.Screen name="Quản lý đơn hàng" component={ManageOrders} />
      <Tab.Screen name="Tài khoản" component={AdminAccount} /> */}
    </Tab.Navigator>
  );
}
