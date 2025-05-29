// AdminNavigator.tsx
import { MaterialIcons } from '@expo/vector-icons'; // <-- Make sure this is installed
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import HomeScreen from '../homeScreen';
import AdminMenuManagement from './AdminMenuManagement';
import AdminOrderManagement from './AdminOrderManagement';
import AdminUserManagement from './AdminUserManagement';
import HeaderLogoutButton from './HeaderLogoutButton';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false, // <-- hide text labels
        tabBarActiveTintColor: '#2b4eff', // <-- color when active
        tabBarInactiveTintColor: '#9ca3af', // <-- color when inactive
      }}
    >
      <Tab.Screen
        name="UserManagement"
        component={AdminUserManagement}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="group" size={size} color={color} />
          ),
          headerRight: () => <HeaderLogoutButton />,
        }}
      />
      <Tab.Screen
        name="MenuManagement"
        component={AdminMenuManagement}
        options={{
          tabBarIcon: ({ color, size }) => (
           //material icon like restaurant menu
          <MaterialIcons name="restaurant-menu" size={size} color={color} />
          ),
          headerRight: () => <HeaderLogoutButton />,
        }}
      />
      <Tab.Screen
        name="OrderManagement"
        component={AdminOrderManagement}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="description" size={size} color={color} />
          ),
          headerRight: () => <HeaderLogoutButton />,
        }}
      />
      <Tab.Screen
        name="OrderLunch"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="lunch-dining" size={size} color={color} />
          ),
        }}
      />
      {/*<Tab.Screen
        name="OfficeLocation"
        component={AdminLocationSettings}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="location-on" size={size} color={color} />
          ),
          headerRight: () => <HeaderLogoutButton />,
        }}
      />*/}
    </Tab.Navigator>
  );
}
