// UserManagementScreen.tsx
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

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(users.filter(user => 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleEditUser = async () => {
    if (editingUser) {
      await setDoc(doc(db, 'users', editingUser.id), editingUser);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (Platform.OS === 'web') {
      // Use browser confirm dialog on web
      const confirmed = window.confirm('Are you sure you want to delete this user?');
      if (confirmed) {
        deleteDoc(doc(db, 'users', userId));
      }
    } else {
      // Use native alert on mobile
      Alert.alert('Confirm Deletion', 'Are you sure you want to delete this user?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'users', userId));
          },
        },
      ]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editingUser) {
      setEditingUser((prevUser: any) => ({ ...prevUser, [field]: value }));
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.cardText}>👨‍💼 Emp Code: {item.empCode}</Text>
        <Text style={styles.cardText}>🏢 Dept: {item.department}</Text>
        <Text style={styles.cardText}>🪙 Coins: {item.coins}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => setEditingUser(item)}>
          <Ionicons name="pencil" size={22} color="#2b4eff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteUser(item.id)}>
          <Ionicons name="trash" size={22} color="#ff4d4f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>      
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 16 }}>No users found.</Text>}
      />

      <Modal
        visible={editingUser !== null}
        animationType="slide"
        onRequestClose={() => {
          setEditingUser(null);
        }}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>✏️ Edit User</Text>

          {(['firstName', 'lastName', 'empCode', 'department', 'coins'] as Array<keyof typeof editingUser>).map((field) => (
            <TextInput
              key={String(field)}
              style={styles.input}
              placeholder={(field as string).charAt(0).toUpperCase() + (field as string).slice(1)}
              keyboardType={field === 'coins' ? 'numeric' : 'default'}
              value={editingUser ? String(editingUser[field]) : ''}
              onChangeText={(value) => handleInputChange(field as string, value)}
            />
          ))}

          <View style={styles.modalActions}>
            <Button title="Save" onPress={handleEditUser} />
            <Button title="Cancel" color="gray" onPress={() => setEditingUser(null)} />
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
