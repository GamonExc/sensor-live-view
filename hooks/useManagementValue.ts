import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = '@sensorapp/managementValue'
const DEFAULT_VALUE = 70

export function useManagementValue(): [
  number,
  (value: number) => Promise<void>,
] {
  const [value, setValueState] = useState<number>(DEFAULT_VALUE)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return
        const parsed = stored != null ? parseInt(stored, 10) : NaN
        if (!Number.isNaN(parsed) && parsed >= 0) {
          setValueState(parsed)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const setValue = useCallback(async (next: number) => {
    const clamped = Math.max(0, Math.round(next))
    setValueState(clamped)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(clamped))
    } catch {
      // ignore
    }
  }, [])

  return [value, setValue]
}
