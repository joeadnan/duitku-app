import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  category: string;
  spent: number;
  limit: number;
}

export const BudgetTracker: React.FC<Props> = ({ category, spent, limit }) => {
  // Batas 0 (atau kosong) tidak boleh menghasilkan NaN/Infinity pada lebar bar.
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isExceeded = limit > 0 ? spent >= limit : spent > 0;
  const isNearLimit = !isExceeded && percentage >= 80;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {isExceeded && <Text style={styles.badgeDanger}>🔴 Limit Exceeded</Text>}
        {isNearLimit && <Text style={styles.badgeWarning}>⚠️ 80% Warning</Text>}
      </View>

      <Text style={styles.amountText}>
        Rp {spent.toLocaleString('id-ID')} / Rp {limit.toLocaleString('id-ID')}
      </Text>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: isExceeded ? '#EF4444' : isNearLimit ? '#F59E0B' : '#10B981',
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTitle: { fontWeight: 'bold', fontSize: 16, color: '#1F2937' },
  badgeDanger: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
  badgeWarning: { color: '#F59E0B', fontWeight: 'bold', fontSize: 12 },
  amountText: { marginVertical: 8, color: '#6B7280', fontSize: 14 },
  progressBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
});
