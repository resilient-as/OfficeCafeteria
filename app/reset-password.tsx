import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './lib/firebaseConfig'; // adjust path
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Success',
        'Password reset email sent. Check your inbox.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.log('Reset error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('No user found with this email.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid email format.');
      } else {
        Alert.alert('Error sending reset email.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#2b4eff" />
          </TouchableOpacity>
        </View>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email address below</Text>

      <TextInput
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Email</Text>
      </TouchableOpacity>

      <Text style={styles.link} onPress={() => router.replace('/login')}>
        ← Back to Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f8ff' },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2b4eff',
    marginBottom: 10,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dbe4ff',
  },
  button: {
    backgroundColor: '#2b4eff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    color: '#2b4eff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});
