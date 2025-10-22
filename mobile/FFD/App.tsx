import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { MessageBoxProvider } from "./context/MessageBoxContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <MessageBoxProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </MessageBoxProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
