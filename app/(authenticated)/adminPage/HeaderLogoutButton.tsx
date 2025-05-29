import React, { useState } from 'react';
import { Platform, TouchableOpacity, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HeaderLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const confirmLogout = async () => {
    if (loading) return;

    const proceed = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        await auth.signOut();
        router.replace('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      // Use browser confirm dialog
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        await proceed();
      }
    } else {
      // Use native alert dialog
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: proceed,
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity onPress={confirmLogout} style={{ marginRight: 16 }} disabled={loading}>
      <Ionicons name="log-out-outline" size={24} color={loading ? 'gray' : 'black'} />
    </TouchableOpacity>
  );
}
