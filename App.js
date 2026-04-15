import React, { useContext, useEffect, useState } from "react";
import { Text, View, Image } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, AuthContext } from "./context/AuthContext";

import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import UploadScreen from "./screens/UploadScreen";
import CompleteProfileScreen from "./screens/CompleteProfileScreen";
import TutorialScreen from "./screens/TutorialScreen";
import MyProfileScreen from "./screens/MyProfileScreen";
import ForgotPasswordScreen from "./screens/forgot-password";
import TableroScreen from "./screens/TableroScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Tutorial"
        component={TutorialScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("./assets/tutorial.png")}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? "#2563eb" : "#6b7280",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: () => (
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#2563eb",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              shadowColor: "#2563eb",
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}>
              <Image
                source={require("./assets/home.png")}
                style={{
                  width: 28,
                  height: 28,
                  tintColor: "#ffffff",
                }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Tablero"
        component={TableroScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("./assets/perfil.png")}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? "#2563eb" : "#6b7280",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, userProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user !== undefined) setLoading(false);
  }, [user]);

  const profileCompleted = !!userProfile && userProfile.profile_completed === true;

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : !profileCompleted ? (
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}