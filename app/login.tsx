import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { auth, db } from './lib/firebaseConfig';
export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const isLargeScreen = width > 768;
  const [hideBtnAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const isAdmin = userData.role === 'admin';
          if (isAdmin) {
            router.replace('/adminPage/adminNavigator');
          } else {
            router.replace('/homeScreen');
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      Animated.timing(hideBtnAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(hideBtnAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setKeyboardVisible(false));
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const isAdmin = userData.role === 'admin';

        if (isAdmin) {
          router.replace('/adminPage/adminNavigator');
        } else {
          router.replace('/homeScreen');
        }
      } else {
        setErrorMsg('User data not found.');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setErrorMsg('User not found.');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMsg('Incorrect password.');
      } else {
        setErrorMsg('Login failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { flexDirection: isLargeScreen ? 'row' : 'column' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="auto"/>
      <View style={[styles.imageContainer, isLargeScreen ? styles.imageLarge : styles.imageMobile]}>
        <Image
          source={require('../assets/images/login_banner.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPasswordBtn}>
            <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {errorMsg !== '' && <Text style={styles.error}>{errorMsg}</Text>}

        <Text style={styles.forgot} onPress={() => router.replace('/reset-password')}>
          Forgot Password?
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <Text style={styles.link} onPress={() => router.replace('/signup')}>
            Sign Up
          </Text>
        </Text>

        <TouchableOpacity onPress={() => Linking.openURL('https://www.linkedin.com/in/sharmashutosh99/')}>
          <Text style={styles.devText}>Developed by Ashutosh Sharma</Text>
        </TouchableOpacity>

        {keyboardVisible && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              opacity: hideBtnAnim,
              transform: [
                {
                  translateY: hideBtnAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              style={{
                backgroundColor: '#2b4eff',
                padding: 10,
                borderRadius: 25,
                elevation: 5,
              }}
            >
              <Feather name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageMobile: {
    width: '100%',
    height: '40%',
  },
  imageLarge: {
    width: '50%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    flex: 6,
    padding: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2b4eff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
    borderColor: '#dbe4ff',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 10,
    top: 15,
  },
  showPasswordText: {
    color: '#2b4eff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2b4eff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2b4eff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  forgot: {
    color: '#2b4eff',
    textAlign: 'right',
    marginBottom: 20,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  link: {
    color: '#2b4eff',
    fontWeight: 'bold',
  },
  error: {
    color: '#ff4444',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  devText: {
    marginTop: 24,
    fontSize: 12,
    textAlign: 'center',
    color: '#2b4eff',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  hideKeyboardBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2b4eff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  hideKeyboardText: {
    color: 'white',
    fontWeight: '600',
  },
});
