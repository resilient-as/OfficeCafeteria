import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../lib/firebaseConfig';

// ...imports unchanged

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      const selectedDateString = selectedDate.toDateString();
      filtered = filtered.filter(
        (order) => new Date(order.timestamp.seconds * 1000).toDateString() === selectedDateString
      );
    }

    setFilteredOrders(filtered);
  }, [searchQuery, selectedDate, orders]);

  // ...exportCSVNative and exportCSVWeb remain unchanged

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.cardText}>🏢 Dept: {item.department}</Text>
        <Text style={styles.cardText}>🪙 Coins Used: {item.coinsUsed}</Text>
        <Text style={styles.cardText}>
          ⏰ Order Time: {new Date(item.timestamp.seconds * 1000).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  function exportCSVWeb(filteredOrders: any[]): void {
    const headers = ['First Name', 'Last Name', 'Department', 'Coins Used', 'Order Time'];
    const rows = filteredOrders.map((order) => [
      order.firstName,
      order.lastName,
      order.department,
      order.coinsUsed,
      new Date(order.timestamp.seconds * 1000).toLocaleString(),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportCSVNative(filteredOrders: any[]): Promise<void> {
    const headers = ['First Name', 'Last Name', 'Department', 'Coins Used', 'Order Time'];
    const rows = filteredOrders.map((order) => [
      order.firstName,
      order.lastName,
      order.department,
      order.coinsUsed,
      new Date(order.timestamp.seconds * 1000).toLocaleString(),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

    const fileUri = FileSystem.documentDirectory + 'orders.csv';

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share Orders CSV',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  }

  return (
    <View style={styles.container}>
      {/* 🔍 Search + 📅 Date Filter + ⬇️ Export - Unified Row */}
      <View style={styles.filterRow}>
  {Platform.OS === 'web' ? (
    <input
      type="date"
      onChange={(e) => {
        const date = new Date(e.target.value);
        if (!isNaN(date.getTime())) setSelectedDate(date);
      }}
      value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
      style={styles.webDatePicker}
    />
  ) : (
    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.nativeDateButton}>
      <Ionicons name="calendar-outline" size={20} color="#2b4eff" />
      <Text style={styles.nativeDateText}>Pick Date</Text>
    </TouchableOpacity>
  )}

  <TextInput
    style={styles.searchInput}
    placeholder="🔍 Search by name"
    value={searchQuery}
    onChangeText={setSearchQuery}
  />

  <TouchableOpacity
    style={styles.exportButton}
    onPress={() =>
      Platform.OS === 'web'
        ? exportCSVWeb(filteredOrders)
        : exportCSVNative(filteredOrders)
    }
  >
    <Text style={styles.exportText}>⬇️ Export</Text>
  </TouchableOpacity>
</View>


      {/* ❌ Clear Date Filter */}
      {selectedDate && (
        <TouchableOpacity onPress={() => setSelectedDate(null)} style={{ marginBottom: 10 }}>
          <Text style={{ color: 'gray', textAlign: 'right' }}>❌ Clear Date Filter</Text>
        </TouchableOpacity>
      )}

      {/* 📅 Native iOS/Android Picker */}
      {showDatePicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={selectedDate || new Date()}
    mode="date"
    display="default"
    onChange={(event, date) => {
      if (event.type === 'set') {
        // User clicked "OK"
        if (date) {
          setSelectedDate(date);
        }
      }
      setShowDatePicker(false); // Close the picker in both cases
    }}
  />
)}

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 16 }}>No orders found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f8ff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconButton: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2b4eff',
  },
  webDatePicker: {
    height: 42,
    paddingHorizontal: 10,
    fontSize: 14,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  nativeDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  nativeDateText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#2b4eff',
  },
  
  exportButton: {
    backgroundColor: '#2b4eff',
    height: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2b4eff',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
});
