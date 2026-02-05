import { FONT_FAMILY, FONT_FAMILY_BOLD } from '@/constants/theme'
import type { BluetoothMode } from '@/types/sensor'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface ModeSelectScreenProps {
  onSelectMode: (mode: BluetoothMode) => void
}

export function ModeSelectScreen({ onSelectMode }: ModeSelectScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>블루투스 모드 선택</Text>
      <Text style={styles.desc}>연결할 기기에 맞는 방식을 선택하세요.</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => onSelectMode('classic')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>Bluetooth Classic (HC-06)</Text>
        <Text style={styles.cardDesc}>
          SPP 시리얼 방식. 페어링된 기기 목록에서 선택하여 연결합니다.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => onSelectMode('le')}
        activeOpacity={0.8}
      >
        <Text style={styles.cardTitle}>Bluetooth LE</Text>
        <Text style={styles.cardDesc}>
          BLE GATT 방식. 스캔된 기기 목록에서 선택하여 연결합니다.
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 8,
  },
  desc: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0D47A1',
  },
  cardTitle: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: '#E3F2FD',
  },
})
