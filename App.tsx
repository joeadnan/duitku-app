import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import NetInfo from '@react-native-community/netinfo';

import { SyncEngine } from './src/services/SyncEngine';
import { BudgetTracker } from './src/components/BudgetTracker';
import { AddTransactionModal } from './src/components/AddTransactionModal';
import { createTransaction, fetchTransactions } from './src/database/transactionRepository';
import type TransactionModel from './src/database/models/Transaction';
import type { NewTransaction } from './src/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<TransactionModel[]>([]);

  const authenticateUser = useCallback(async () => {
    setAuthError(null);
    try {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        // Perangkat tanpa biometrik/PIN/pola: tidak ada yang bisa diverifikasi.
        setIsAuthenticated(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Buka Aplikasi Duitku',
        fallbackLabel: 'Gunakan Passcode',
      });
      if (result.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError('Autentikasi dibatalkan atau gagal. Coba lagi.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError('Tidak dapat memverifikasi identitas. Coba lagi.');
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setTransactions(await fetchTransactions());
    } catch (error) {
      console.error('Gagal memuat transaksi:', error);
    }
  }, []);

  useEffect(() => {
    const stopSync = SyncEngine.initNetworkListener();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    void authenticateUser();
    void loadTransactions();

    return () => {
      stopSync();
      unsubscribe();
    };
  }, [authenticateUser, loadTransactions]);

  const handleSaveTransaction = async (newTx: NewTransaction) => {
    await createTransaction(newTx);
    await loadTransactions();
    if (isOnline) {
      void SyncEngine.performBatchSync();
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <StatusBar style="light" />
        <Text style={styles.authTitle}>Duitku</Text>
        <Text style={styles.authSub}>Pencatatan Keuangan Luring & Aman (Expo)</Text>
        {authError && <Text style={styles.authError}>{authError}</Text>}
        <TouchableOpacity style={styles.authBtn} onPress={authenticateUser}>
          <Text style={styles.authBtnText}>Buka dengan Fingerprint / Face ID</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>☁️ Mode Luring: Data tersimpan aman di memori lokal</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Duitku Dashboard</Text>
        <TouchableOpacity onPress={() => setIsAuthenticated(false)}>
          <Text style={styles.lockBtn}>🔒 Kunci</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Saldo Saat Ini</Text>
          <Text style={styles.summaryValue}>Rp 12.450.000</Text>
        </View>

        <Text style={styles.sectionTitle}>Batas Anggaran Bulanan (US-04)</Text>
        <BudgetTracker category="Makanan & Minuman" spent={1850000} limit={2000000} />
        <BudgetTracker category="Transportasi" spent={620000} limit={500000} />

        <Text style={styles.sectionTitle}>Riwayat Transaksi Terbaru</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada transaksi baru yang dicatat.</Text>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.txCard}>
              <View>
                <Text style={styles.txCategory}>
                  {tx.category} ({tx.account})
                </Text>
                <Text style={styles.txNotes}>{tx.notes || 'Tanpa catatan'}</Text>
              </View>
              <Text style={styles.txAmount}>- Rp {tx.amount.toLocaleString('id-ID')}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Catat Transaksi (&lt; 5 Detik)</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981', padding: 24 },
  authTitle: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  authSub: { fontSize: 14, color: '#D1FAE5', marginBottom: 32 },
  authError: { color: '#FEE2E2', marginBottom: 16, textAlign: 'center' },
  authBtn: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  authBtnText: { color: '#047857', fontWeight: 'bold', fontSize: 16 },
  offlineBanner: { backgroundColor: '#4B5563', padding: 8, alignItems: 'center' },
  offlineText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  lockBtn: { color: '#EF4444', fontWeight: '600' },
  content: { padding: 20, flex: 1 },
  summaryCard: { backgroundColor: '#10B981', padding: 20, borderRadius: 16, marginBottom: 20 },
  summaryLabel: { color: '#D1FAE5', fontSize: 13 },
  summaryValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#374151', marginTop: 8 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', marginBottom: 20 },
  txCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txCategory: { fontWeight: 'bold', color: '#1F2937' },
  txNotes: { color: '#6B7280', fontSize: 12 },
  txAmount: { color: '#EF4444', fontWeight: 'bold' },
  addBtn: { backgroundColor: '#10B981', padding: 16, margin: 20, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
