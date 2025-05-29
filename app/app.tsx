// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import AdminTabs from './(authenticated)/adminPage/adminNavigator'; // Adjust the path according to where your AdminTabs.tsx is located
export default function App() {
  return (
    <NavigationContainer>
      <AdminTabs /> {/* Use the AdminTabs component to show the tab navigation */}
    </NavigationContainer>
  );
}
