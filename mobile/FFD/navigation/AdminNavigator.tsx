import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import UsersManage from "../screens/admin/UsersManage";
import BranchesManage from "../screens/admin/BranchesManage";
import DronesManage from "../screens/admin/DronesManage";

import AdminAccount from "../screens/admin/AdminAccount";

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
            case "Người dùng":
              iconName = focused ? "people" : "people-outline";
              break;
            case "Chi nhánh":
              iconName = focused ? "business" : "business-outline";
              break;
            case "Drone":
              iconName = focused ? "airplane" : "airplane-outline";
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
      <Tab.Screen name="Người dùng" component={UsersManage} />
      <Tab.Screen name="Chi nhánh" component={BranchesManage} />
      <Tab.Screen name="Drone" component={DronesManage} />
      <Tab.Screen name="Tài khoản" component={AdminAccount} />
    </Tab.Navigator>
  );
}
