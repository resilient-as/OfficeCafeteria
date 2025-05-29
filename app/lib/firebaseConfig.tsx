// firebase.js
import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
// Add these imports:
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth/react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxndI-D5y3Dh3PCjDfc6R-2oEdsPb7Bms",
  authDomain: "getyourfoodhella.firebaseapp.com",
  databaseURL: "https://getyourfoodhella-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "getyourfoodhella",
  storageBucket: "getyourfoodhella.firebasestorage.app",
  messagingSenderId: "1033028118527",
  appId: "1:1033028118527:web:cbe312f780d1e54bc4e9ca",
  measurementId: "G-GDJJVYCS4P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use React Native persistence for auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Single export line — no duplicates
export { addDoc, collection, db };

