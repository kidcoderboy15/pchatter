import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { rewardService, MERCH_COSTS } from '../../services/rewardService';
import { viralService } from '../../services/viralService';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

type MerchStoreScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'MerchStore'>;
};

interface MerchItem {
  id: keyof typeof MERCH_COSTS;
  name: string;
  cost: number;
  emoji: string;
  description: string;
}

const MERCH_ITEMS: MerchItem[] = [
  {
    id: 'STICKER_PACK',
    name: 'Sticker Pack',
    cost: MERCH_COSTS.STICKER_PACK,
    emoji: '🥒',
    description: '5 premium Pickle Chatter stickers',
  },
  {
    id: 'TOWEL',
    name: 'Court Towel',
    cost: MERCH_COSTS.TOWEL,
    emoji: '🧼',
    description: 'Microfiber towel with Pickle Chatter logo',
  },
  {
    id: 'WATER_BOTTLE',
    name: 'Water Bottle',
    cost: MERCH_COSTS.WATER_BOTTLE,
    emoji: '💧',
    description: '32oz insulated bottle',
  },
  {
    id: 'HAT',
    name: 'Snapback Hat',
    cost: MERCH_COSTS.HAT,
    emoji: '🧢',
    description: 'Adjustable snapback with embroidered logo',
  },
  {
    id: 'TSHIRT',
    name: 'T-Shirt',
    cost: MERCH_COSTS.TSHIRT,
    emoji: '👕',
    description: 'Soft cotton tee in sizes S-XXL',
  },
  {
    id: 'PADDLE_COVER',
    name: 'Paddle Cover',
    cost: MERCH_COSTS.PADDLE_COVER,
    emoji: '🎾',
    description: 'Protective cover for your paddle',
  },
  {
    id: 'HOODIE',
    name: 'Hoodie',
    cost: MERCH_COSTS.HOODIE,
    emoji: '🧥',
    description: 'Cozy fleece hoodie in sizes S-XXL',
  },
];

export default function MerchStoreScreen({ navigation }: MerchStoreScreenProps) {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MerchItem | null>(null);
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const bal = await rewardService.getBalance(user.id);
    setBalance(bal);
  };

  const handleSelectItem = (item: MerchItem) => {
    if (balance < item.cost) {
      Alert.alert(
        'Not Enough Tokens',
        `You need ${item.cost - balance} more tokens to redeem this item.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedItem(item);
  };

  const handleRedeem = async () => {
    if (!selectedItem) return;

    if (!shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip) {
      showToast('Please fill out all shipping information', 'error');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await viralService.haptic('heavy');

    const shippingInfo = {
      name: shippingName,
      address: shippingAddress,
      city: shippingCity,
      state: shippingState,
      zip: shippingZip,
    };

    const result = await rewardService.redeemMerch(user.id, selectedItem.id, shippingInfo);

    if (result.success) {
      await viralService.haptic('success');
      showToast(result.message, 'success');
      setSelectedItem(null);
      loadBalance();
      navigation.goBack();
    } else {
      await viralService.haptic('error');
      showToast(result.message, 'error');
    }
  };

  const renderMerchItem = ({ item }: { item: MerchItem }) => {
    const canAfford = balance >= item.cost;

    return (
      <TouchableOpacity
        style={[styles.merchCard, !canAfford && styles.merchCardDisabled]}
        onPress={() => handleSelectItem(item)}
      >
        <Text style={styles.merchEmoji}>{item.emoji}</Text>
        <View style={styles.merchInfo}>
          <Text style={styles.merchName}>{item.name}</Text>
          <Text style={styles.merchDescription}>{item.description}</Text>
          <View style={styles.merchFooter}>
            <Text style={[styles.merchCost, !canAfford && styles.merchCostDisabled]}>
              {item.cost} tokens
            </Text>
            {!canAfford && (
              <Text style={styles.needMore}>Need {item.cost - balance} more</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (selectedItem) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.checkoutHeader}>
          <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.checkoutTitle}>Checkout</Text>
        </View>

        <View style={styles.selectedItemCard}>
          <Text style={styles.selectedItemEmoji}>{selectedItem.emoji}</Text>
          <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
          <Text style={styles.selectedItemCost}>{selectedItem.cost} tokens</Text>
        </View>

        <View style={styles.shippingForm}>
          <Text style={styles.formLabel}>Shipping Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={shippingName}
            onChangeText={setShippingName}
          />

          <TextInput
            style={styles.input}
            placeholder="Street Address"
            value={shippingAddress}
            onChangeText={setShippingAddress}
          />

          <TextInput
            style={styles.input}
            placeholder="City"
            value={shippingCity}
            onChangeText={setShippingCity}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="State"
              value={shippingState}
              onChangeText={setShippingState}
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="ZIP"
              value={shippingZip}
              onChangeText={setShippingZip}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>

          <TouchableOpacity style={styles.redeemButton} onPress={handleRedeem}>
            <Text style={styles.redeemButtonText}>
              Redeem for {selectedItem.cost} Tokens
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Merch Store</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceValue}>{balance} tokens</Text>
        </View>
      </View>

      <FlatList
        data={MERCH_ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={renderMerchItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  merchCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  merchCardDisabled: {
    opacity: 0.5,
  },
  merchEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  merchInfo: {
    flex: 1,
  },
  merchName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  merchDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  merchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  merchCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
  },
  merchCostDisabled: {
    color: '#9ca3af',
  },
  needMore: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  checkoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  selectedItemCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedItemEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  selectedItemName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  selectedItemCost: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '600',
  },
  shippingForm: {
    padding: 20,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  redeemButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
