import { FONT_FAMILY, FONT_FAMILY_BOLD } from '@/constants/theme'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

export function SplashScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>TS Monitiring App</Text>
      <ActivityIndicator size="large" color="blue" />
      <Text style={styles.subtitle}>블루투스 준비 중...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: FONT_FAMILY_BOLD, marginBottom: 20 },
  subtitle: { marginTop: 10, fontFamily: FONT_FAMILY },
})
