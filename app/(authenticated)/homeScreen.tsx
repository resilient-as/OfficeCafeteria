import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CameraView } from "expo-camera";
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { db } from '../lib/firebaseConfig';

export default function HomeScreen() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [coins, setCoins] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Share Coins Modal State
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [receiverCode, setReceiverCode] = useState('');
  const [shareAmount, setShareAmount] = useState('');
  const router = useRouter();
  // Camera State
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);


  const isNewDay = (lastReset: Timestamp) => {
    const today = new Date().toDateString();
    const last = lastReset.toDate().toDateString();
    return today !== last;
  };

  const fetchUserData = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUserId(user.uid);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const lastReset = userData.lastReset;
        const currentCoins = userData.coins ?? 0;

        const shouldReset =
          !lastReset || !(lastReset instanceof Timestamp) || isNewDay(lastReset);

        if (shouldReset) {
          await updateDoc(userRef, {
            coins: 75,
            lastReset: Timestamp.now(),
          });
          setCoins(75);
        } else {
          setCoins(currentCoins);
        }
        setUserData(userData);
      }
    }
  };

  // Refresh user data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenuItems(items);

      const initialQuantities: { [key: string]: number } = {};
      items.forEach((item) => (initialQuantities[item.id] = 0));
      setQuantities(initialQuantities);
    });

    fetchUserData();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const total = menuItems.reduce((sum, item) => {
      const qty = quantities[item.id] || 0;
      return sum + qty * item.price;
    }, 0);

    setTotalPrice(total);
  }, [quantities, menuItems]);

  const handleQuantityChange = (id: string, change: number) => {
    setQuantities((prev) => {
      const newQty = (prev[id] || 0) + change;
      return {
        ...prev,
        [id]: newQty >= 0 ? newQty : 0,
      };
    });
  };

  const handleOrder = () => {
    if (totalPrice === 0) {
      Alert.alert('Empty Cart', 'Please add something to your cart before placing the order.', [{ text: 'OK' }]);
    } else {
      const selectedItems = menuItems.filter((item) => quantities[item.id] > 0);
      router.push({
        pathname: '/OrderSummary',        
        params: {
          selectedItems: JSON.stringify(selectedItems),
          quantities: JSON.stringify(quantities),
          total: totalPrice.toString(),
          coins: coins.toString(),
          userId,
        },
      });
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
  
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        auth.signOut();
        router.replace('/login');
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            auth.signOut();
            router.replace('/login');
          },
        },
      ]);
    }
  };

  const handleShareCoins = async () => {
    const amount = parseInt(shareAmount);
    if (!receiverCode || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid receiver Emp Code and amount.');
      return;
    }

    if (amount > coins) {
      Alert.alert('Insufficient Coins', 'You do not have enough coins to share this amount.');
      return;
    }

    try {
      const receiverQuery = query(collection(db, 'users'), where('empCode', '==', receiverCode));
      const receiverSnapshot = await getDocs(receiverQuery);

      if (receiverSnapshot.empty) {
        Alert.alert('User Not Found', 'No user found with this Emp Code.');
        return;
      }

      const receiverDoc = receiverSnapshot.docs[0];
      const receiverRef = receiverDoc.ref;
      const receiverData = receiverDoc.data();

      // Update both users' coins
      const senderRef = doc(db, 'users', userId!);

      await updateDoc(senderRef, { coins: coins - amount });
      await updateDoc(receiverRef, { coins: (receiverData.coins || 0) + amount });

      setCoins((prev) => prev - amount);
      setReceiverCode('');
      setShareAmount('');
      setShareModalVisible(false);

      Alert.alert('Success', 'Coins shared successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while sharing coins.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuName}>{item.emoji} {item.name}</Text>
        <Text style={styles.menuTag}>{item.tagline}</Text>
      </View>
      <View style={styles.priceQuantityContainer}>
        <Text style={styles.menuPrice}>₹{item.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(item.id, -1)}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantities[item.id] || 0}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={() => handleQuantityChange(item.id, 1)}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
  {/* Left side - Welcome Text */}
  <View style={styles.leftContainer}>
    <Text style={styles.welcome}>Welcome to</Text>
    <Text style={styles.appName}>Forvia Hella Lunch</Text>
    <Text style={styles.tagline}>Your daily lunch companion 🍽️</Text>
  </View>

  {/* Right side - Coins and Icons */}
  <View style={styles.rightContainer}>
    {/* Coins at top right */}
    <View style={styles.coinsWrapper}>
  <FontAwesome5 name="coins" size={24} color="#2b4eff" style={{ marginRight: 6 }} />
  <Text style={styles.coinsOnlyText}>{coins}</Text>
</View>



    {/* Icons below */}

    <View style={styles.iconsRow}>
      
      <TouchableOpacity style={styles.iconContainer} onPress={() => setModalVisible(true)}>
        <Text style={styles.iconEmoji}>👤</Text>
      </TouchableOpacity>
      
    
      <TouchableOpacity style={styles.iconContainer} onPress={handleLogout}>
        <Text style={styles.iconEmoji}>🔓</Text>
      </TouchableOpacity>

    </View>


    <View style={styles.iconsRow}>

      <TouchableOpacity style={styles.iconContainer} onPress={() => setShareModalVisible(true)}>
        <Text style={styles.iconEmoji}>🤝</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconContainer} onPress={() => setQrCodeModalVisible(true)}>
        <MaterialIcons name="qr-code" size={24} color="#2b4eff" />
      </TouchableOpacity>
      
    </View>
  </View>
</View>

<FlatList
  data={menuItems}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.contentWrapper}
  showsVerticalScrollIndicator={false}
/>

{/* Fixed Bottom Total and Order Now Button */}
<View style={styles.fixedBottomContainer}>
  <View style={styles.totalContainer}>
    <Text style={styles.totalText}>Total: ₹{totalPrice.toFixed(2)}</Text>
  </View>
  <TouchableOpacity
    style={[styles.orderNowButton, totalPrice === 0 && styles.disabledButton]}
    onPress={handleOrder}
    disabled={totalPrice === 0}
  >
    <Text style={styles.orderNowButtonText}>Order Now</Text>
  </TouchableOpacity>
</View>

{/* QR Code Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={qrCodeModalVisible}
  onRequestClose={() => setQrCodeModalVisible(false)}
>
  <View style={styles.qrModalOverlay}>
    <View style={styles.qrModalContent}>
      {/* Close Button with X Icon */}
      <TouchableOpacity
        style={styles.closeIconContainer}
        onPress={() => setQrCodeModalVisible(false)}
      >
        <MaterialIcons name="close" size={24} color="#444" />
      </TouchableOpacity>

      {/* QR Code */}
      
      <View style={styles.qrCodeContainer}>
        <QRCode
          value={userData?.empCode || userId || 'N/A'}
          size={250} // Increased size of the QR code                    
          color="black"              
        />
      </View>
    </View>
  </View>
</Modal>

<Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { paddingHorizontal: 24, paddingBottom: 20 }]}>
      {userData && (
        <>
          <Text style={styles.modalTitle}>👤 Profile</Text>

          <View style={{ marginVertical: 10 }}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>First Name:</Text>
              <Text style={styles.profileValue}>{userData.firstName}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Last Name:</Text>
              <Text style={styles.profileValue}>{userData.lastName}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Emp Code:</Text>
              <Text style={styles.profileValue}>{userData.empCode}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Department:</Text>
              <Text style={styles.profileValue}>{userData.department}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Coins:</Text>
              <Text style={styles.profileValue}>{coins}</Text>
            </View>
          </View>
        </>
      )}

      {/* Centered Close Button */}
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <TouchableOpacity style={[styles.actionButton, { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setModalVisible(false)}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

{/* Share Coins Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={shareModalVisible}
  onRequestClose={() => setShareModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Share Coins</Text>

      {/* Receiver Emp Code + Camera */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Enter Receiver Emp Code"
          value={receiverCode}
          onChangeText={setReceiverCode}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status === 'granted') {
              setCameraVisible(true);
            } else {
              Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
            }
          }}
        >
          <MaterialIcons name="camera-alt" size={24} color="#2b4eff" />
        </TouchableOpacity>
      </View>

      {/* Amount to Share */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Amount to Share"
          keyboardType="numeric"
          value={shareAmount}
          onChangeText={setShareAmount}
          style={styles.input}
        />
      </View>

      {/* Centered Buttons */}
      <View style={styles.centeredButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ccc' }]}
          onPress={() => setShareModalVisible(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShareCoins}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


  
  {/* Camera Modal for QR Code Scanning */}
  <Modal
  animationType="slide"
  transparent={false}
  visible={cameraVisible}
  onRequestClose={() => {
    setCameraVisible(false);
    setHasPermission(null);
  }}
>
  <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
    {hasPermission === null ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>Requesting Camera Permission...</Text>
      </View>
    ) : hasPermission === false ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>No access to camera</Text>
      </View>
    ) : (
      <>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={(scanningResult) => {
            if (scanningResult) {
              const { data } = scanningResult;
              setReceiverCode(data);
              setCameraVisible(false);
            }
          }}
        />

        {/* Overlay with transparent center */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.centerRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea} />
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay} />
        </View>

        {/* Close Button */}
        <Pressable
      style={{
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 20,
      }}
      onPress={() => {
        setCameraVisible(false);
        setHasPermission(null);
      }}
    >
      <Text style={{ color: 'black', fontWeight: 'bold' }}>Close</Text>
    </Pressable>

        {/* Instruction Text */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>Align QR Code inside the frame</Text>
        </View>
      </>
    )}
  </SafeAreaView>
</Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    paddingBottom: 4,
  },
  
  profileLabel: {
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  
  profileValue: {
    textAlign: 'right',
    color: '#555',
    flex: 1,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
  },
  iconButton: {
    marginLeft: 10,
    backgroundColor: '#e0e7ff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#2b4eff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
 
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  centerRow: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderColor: '#00FF00',
    borderWidth: 2,
    borderRadius: 20,
  },
  bottomOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  instructionContainer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  qrModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
  },
  qrModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
    position: 'relative', // For positioning the close icon
  },
  closeIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 5,
    elevation: 3, // Shadow for Android
  },
  qrCodeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },

  fixedBottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0,
    borderColor: '#eee',
    //background color like rest of the screen
    backgroundColor: '#f5f8ff',
  },
  
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  
  leftContainer: {
    flex: 1,
  },
  
  rightContainer: {
    alignItems: 'flex-end',
  },
  
  welcome: {
    fontSize: 20,
    color: '#444',
    marginTop: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2b4eff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  
  iconsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  
  iconContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginRight: 10,  
    //the share coins icon, qr-code having now gap between menu items
      
  },
  
  coinsWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,     // Increased vertical padding
    paddingHorizontal: 16,   // Increased horizontal padding
    borderRadius: 30,        // Bigger, more rounded
    borderWidth: 1,
    borderColor: '#e0e7ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // slightly deeper shadow
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,             // More "pop"
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  
  styledModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderColor: '#e0e0e0', // Light gray border
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, // Softer shadow
    shadowRadius: 8,
    elevation: 5, // Android shadow
    width: '85%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },

  disabledButton: {
    backgroundColor: '#e0e7ff',
  },
  container: {
    backgroundColor: '#f5f8ff',
    flex: 1,
  },
  rightIcons: {
    alignItems: 'flex-end', // Align the container to the right
    marginRight: 16, // Add margin to the right
    marginTop: 10, // Add margin to the top
  },
  iconGrid: {
    flexDirection: 'row', // Arrange icons in a row
    flexWrap: 'wrap', // Allow wrapping to create a grid
    justifyContent: 'space-between', // Add space between icons
    gap: 16, // Add spacing between icons
    width: 120, // Set a fixed width for the grid
    marginTop: 10, // Add margin to separate from the coins icon
  },
  
  
  
  iconEmoji: {
    fontSize: 18,
    color: '#2b4eff',
    fontWeight: '600',
  },
  
  iconLabel: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#2b4eff',
  },
  


  modalText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#444',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#2b4eff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 5,
    marginBottom: 16,
  },
  topBarLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconText: {
    fontSize: 18,
  },
  coinsOnlyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b4eff',
  },
  contentWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    width: '100%',
  },
  
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 10,
  },
  

  menuTextContainer: {
    flex: 3,
    paddingRight: 10,
  },
  priceQuantityContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b4eff',
  },
  menuTag: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    flexShrink: 1,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2b4eff',
    marginTop: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    backgroundColor: '#2b4eff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  quantityButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginHorizontal: 10,
  },
  totalContainer: {
    marginTop: 24,
    paddingVertical: 10,
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2b4eff',
  },
  orderNowButton: {
    backgroundColor: '#2b4eff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 0,
    elevation: 10,
  },
  orderNowButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});