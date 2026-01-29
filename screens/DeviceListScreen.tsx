import { FONT_FAMILY, FONT_FAMILY_BOLD } from '@/constants/theme'
import type { BluetoothDeviceLike } from '@/hooks/useBluetooth'
import React from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export interface DeviceListScreenProps {
  deviceList: BluetoothDeviceLike[]
  onRefresh: () => void
  onSelectDevice: (device: BluetoothDeviceLike) => void
  onDevBypass?: () => void
}

export function DeviceListScreen({
  deviceList,
  onRefresh,
  onSelectDevice,
  onDevBypass,
}: DeviceListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>기기 선택</Text>
      <Text style={styles.desc}>블루투스 설정에서 먼저 페어링 해주세요.</Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
        <Text style={styles.refreshBtnText}>목록 새로고침</Text>
      </TouchableOpacity>
      {/* 테스트용 이동 (연결 없이) - 배포 시 비노출
      {typeof __DEV__ !== 'undefined' && __DEV__ && onDevBypass && (
        <TouchableOpacity style={styles.devBypassBtn} onPress={onDevBypass}>
          <Text style={styles.devBypassText}>테스트용 이동 (연결 없이)</Text>
        </TouchableOpacity>
      )}
      */}
      <FlatList
        data={deviceList}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelectDevice(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAddress}>{item.address}</Text>
          </TouchableOpacity>
        )}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>페어링된 기기가 없습니다.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#040000',
  },
  header: {
    fontSize: 22,
    fontFamily: FONT_FAMILY_BOLD,
    marginBottom: 8,
    color: '#ffffff',
  },
  desc: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00A5E5',
  },
  refreshBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 16,
  },
  /* devBypassBtn: {
    backgroundColor: '#ff9800',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  devBypassText: { color: '#fff', fontFamily: FONT_FAMILY_BOLD, fontSize: 14 },
  */
  list: { flex: 1, marginTop: 8 },
  item: {
    backgroundColor: '#0D47A1',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00A5E5',
  },
  itemName: {
    fontSize: 18,
    fontFamily: FONT_FAMILY_BOLD,
    color: '#ffffff',
    marginBottom: 4,
  },
  itemAddress: {
    fontSize: 12,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: FONT_FAMILY,
    color: '#90caf9',
    textAlign: 'center',
    marginTop: 24,
  },
})
