import { FONT_FAMILY_BOLD } from '@/constants/theme'
import type { SensorData } from '@/types/sensor'
import React from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'

const INSTALL_DATE_FIXED = '2026-01-16'

export interface DetailScreenProps {
  sensorData: SensorData
  ventNumber?: number
  managementValue?: number
  onBack: () => void
}

export function DetailScreen({
  sensorData,
  ventNumber = 15,
  managementValue = 70,
  onBack,
}: DetailScreenProps) {
  const ch1Raw = sensorData.sensorCh.length > 0 ? sensorData.sensorCh[0] : ''
  const ch1Num = typeof ch1Raw === 'string' ? parseFloat(ch1Raw) : NaN
  const hasValue = !Number.isNaN(ch1Num) && ch1Raw !== ''
  const digitsDisplay: string = hasValue
    ? String(Math.round(ch1Num)).padStart(3, '0').slice(-3)
    : '---'
  const digits = digitsDisplay.split('')
  const isDanger = hasValue && ch1Num > managementValue
  const statusColor = isDanger ? '#FF0000' : '#4CAF50'
  const statusText = isDanger ? '위험' : '안전'

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.digitalBox}>
        <View style={styles.digitRow}>
          {digits.map((char, index) => (
            <View key={index} style={styles.digitCell}>
              <Text style={styles.digitalText}>{char}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={[styles.statusLabel, { color: statusColor }]}>
        {statusText}
      </Text>
      <View style={styles.divider} />
      <Text style={styles.location}>POSCO 광양 2고로{'\n'}송풍지관</Text>
      <Text style={styles.location}>풍구 감시 카메라</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellLabel]}>번호</Text>
          <Text style={[styles.tableCell, styles.tableCellValue]}>
            {ventNumber}
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellLabel]}>관리</Text>
          <Text style={[styles.tableCell, styles.tableCellValue]}>
            {managementValue} °C
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellLabel]}>설치</Text>
          <Text style={[styles.tableCell, styles.tableCellValue]}>
            {INSTALL_DATE_FIXED}
          </Text>
        </View>
      </View>
      <Button title="뒤로" onPress={onBack} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    padding: 20,
    backgroundColor: '#040000',
  },
  statusRow: { marginBottom: 10 },
  statusDot: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignSelf: 'center',
    // borderWidth: 3,
    // borderColor: '#ffffff',
  },
  digitalBox: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'stretch',
    minHeight: 200,
  },
  digitRow: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 168,
    width: '100%',
  },
  digitCell: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#0D47A1',
    borderWidth: 2,
    borderColor: '#00A5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitalText: {
    fontSize: 130,
    lineHeight: 130,
    fontFamily: FONT_FAMILY_BOLD,
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    transform: [{ translateY: -8 }],
  },
  statusLabel: {
    fontSize: 48,
    fontFamily: FONT_FAMILY_BOLD,
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    height: 3,
    backgroundColor: '#00A5E5',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 25,
    marginBottom: 4,
    color: '#ffffff',
    textAlign: 'right',
    fontFamily: FONT_FAMILY_BOLD,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    fontFamily: FONT_FAMILY_BOLD,
    borderWidth: 1,
    borderColor: '#00A5E5',
    backgroundColor: '#000000',
  },
  tableCellLabel: {
    color: '#00A5E5',
  },
  tableCellValue: {
    color: '#ffffff',
  },
})
