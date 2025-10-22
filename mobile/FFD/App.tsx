import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./navigation/AppNavigator";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { MessageBoxProvider } from "./context/MessageBoxContext";

const App: React.FC = () => {
  return (
        <MessageBoxProvider>
    <AuthProvider>
      <CartProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
      </CartProvider>
    </AuthProvider>
        </MessageBoxProvider>
  );
};

export default App;
