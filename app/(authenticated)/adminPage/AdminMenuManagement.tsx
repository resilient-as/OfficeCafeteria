// MenuManagementScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../lib/firebaseConfig';

export default function AdminMenuManagement() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<any>({ name: '', emoji: '', tagline: '', price: '' });
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMenuItems(fetchedItems);
      setFilteredItems(fetchedItems);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredItems(menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setFilteredItems(menuItems);
    }
  }, [searchQuery, menuItems]);

  const handleAddItem = async () => {
    if (newItem.name && newItem.emoji && newItem.tagline && newItem.price) {
      const newDocRef = doc(collection(db, 'menuItems'));
      await setDoc(newDocRef, { ...newItem, price: parseFloat(newItem.price) });
      setShowModal(false);
      setNewItem({ name: '', emoji: '', tagline: '', price: '' });
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const handleEditItem = async () => {
    if (editingItem) {
      await setDoc(doc(db, 'menuItems', editingItem.id), {
        name: editingItem.name,
        emoji: editingItem.emoji,
        tagline: editingItem.tagline,
        price: parseFloat(editingItem.price),
      });
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (Platform.OS === 'web') {
      // Use browser confirm dialog on web
      const confirmed = window.confirm('Are you sure you want to delete this item?');
      if (confirmed) {
        deleteDoc(doc(db, 'menuItems', id));
      }
    } else {
      // Use native alert on mobile
      Alert.alert('Confirm Deletion', 'Are you sure you want to delete this item?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'menuItems', id));
          },
        },
      ]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editingItem) {
      setEditingItem((prev: any) => ({ ...prev, [field]: value }));
    } else {
      setNewItem((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{item.emoji} {item.name}</Text>
        <Text style={styles.cardText}>💬 {item.tagline}</Text>
        <Text style={styles.cardText}>💰 ₹{item.price}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => setEditingItem(item)}>
          <Ionicons name="pencil" size={22} color="#2b4eff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
          <Ionicons name="trash" size={22} color="#ff4d4f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>      
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search menu items"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 16 }}>No menu items found.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>➕ Add Item</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal || editingItem !== null}
        animationType="slide"
        onRequestClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editingItem ? '✏️ Edit' : '➕ Add'} Item</Text>

          {['name', 'emoji', 'tagline', 'price'].map((field) => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              keyboardType={field === 'price' ? 'numeric' : 'default'}
              value={editingItem ? String(editingItem[field]) : String(newItem[field] || '')}
              onChangeText={(value) => handleInputChange(field, value)}
            />
          ))}

          <View style={styles.modalActions}>
            <Button title={editingItem ? 'Save' : 'Add'} onPress={editingItem ? handleEditItem : handleAddItem} />
            <Button title="Cancel" color="gray" onPress={() => {
              setShowModal(false);
              setEditingItem(null);
            }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f8ff',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2b4eff',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  cardActions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#2b4eff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2b4eff',
  },
  input: {
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccd6ff',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
