import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import type { AccountType, NewTransaction } from '../types';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: NewTransaction) => void | Promise<void>;
}

export const AddTransactionModal: React.FC<ModalProps> = ({ visible, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [account, setAccount] = useState<AccountType>('Cash');
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const handleCaptureReceipt = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Izin kamera', 'Izin kamera diperlukan untuk mengambil gambar struk.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  const handleSave = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Nominal tidak valid', 'Masukkan nominal lebih dari 0.');
      return;
    }
    try {
      await onSave({
        amount: value,
        type: 'expense',
        category,
        account,
        notes: notes || undefined,
        receiptUri: receiptUri ?? undefined,
        timestamp: Date.now(),
        synced: false,
      });
    } catch (err) {
      console.error('Gagal menyimpan transaksi:', err);
      Alert.alert('Gagal menyimpan', 'Transaksi belum tersimpan. Silakan coba lagi.');
      return;
    }
    setAmount('');
    setNotes('');
    setReceiptUri(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { paddingBottom: 24 + insets.bottom }]}>
          <Text style={styles.title}>Catat Transaksi Instan</Text>
          
          <TextInput
            style={styles.inputAmount}
            placeholder="Rp 0"
            keyboardType="numeric"
            value={amount}
            // Hanya angka: mencegah "10.000" terbaca sebagai 10 oleh parser desimal.
            onChangeText={text => setAmount(text.replace(/[^0-9]/g, ''))}
            autoFocus
          />

          <View style={styles.presetRow}>
            {[10000, 20000, 50000].map(val => (
              <TouchableOpacity key={val} style={styles.chip} onPress={() => setAmount(val.toString())}>
                <Text style={styles.chipText}>+{val / 1000}k</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Catatan Singkat (Opsional)"
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity style={styles.cameraBtn} onPress={handleCaptureReceipt}>
            <Text style={styles.cameraBtnText}>
              {receiptUri ? '✓ Struk Terlampir' : '📷 Ambil Foto Struk (US-06)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Simpan Transaksi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1F2937' },
  inputAmount: { fontSize: 32, fontWeight: 'bold', color: '#10B981', marginBottom: 12 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  chipText: { color: '#047857', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, color: '#1F2937' },
  cameraBtn: { padding: 12, backgroundColor: '#E0E7FF', borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  cameraBtnText: { color: '#4338CA', fontWeight: '600' },
  saveBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#6B7280', fontWeight: '500' }
});
