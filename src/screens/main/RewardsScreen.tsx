import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../services/supabase';

export default function RewardsScreen() {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<any[]>([]);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: balanceData } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (balanceData) setBalance(balanceData.balance);

      const { data: ledgerData } = await supabase
        .from('token_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ledgerData) setLedger(ledgerData);
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.balanceLabel}>Pickle Tokens</Text>
        <Text style={styles.balance}>{balance}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earn Tokens</Text>
        <View style={styles.earnCard}>
          <Text style={styles.earnTitle}>Play verified matches</Text>
          <Text style={styles.earnValue}>+10 tokens</Text>
        </View>
        <View style={styles.earnCard}>
          <Text style={styles.earnTitle}>Confirm results quickly</Text>
          <Text style={styles.earnValue}>+5 tokens</Text>
        </View>
        <View style={styles.earnCard}>
          <Text style={styles.earnTitle}>Weekly streak</Text>
          <Text style={styles.earnValue}>+20 tokens</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <FlatList
          data={ledger}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.ledgerItem}>
              <Text style={styles.ledgerReason}>{item.reason}</Text>
              <Text
                style={[
                  styles.ledgerDelta,
                  item.delta > 0 ? styles.ledgerPositive : styles.ledgerNegative,
                ]}
              >
                {item.delta > 0 ? '+' : ''}
                {item.delta}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No activity yet</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#22c55e',
    padding: 32,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  balance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  earnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  earnTitle: {
    fontSize: 16,
    color: '#374151',
  },
  earnValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  ledgerReason: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  ledgerDelta: {
    fontSize: 16,
    fontWeight: '600',
  },
  ledgerPositive: {
    color: '#22c55e',
  },
  ledgerNegative: {
    color: '#ef4444',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 32,
  },
});
