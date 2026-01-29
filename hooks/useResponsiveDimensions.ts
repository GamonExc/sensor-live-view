import { useWindowDimensions } from 'react-native'

/**
 * React Native 반응형: 웹의 vw/vh처럼 화면 크기 비율로 계산
 * - width, height: 현재 창 크기 (폴드·회전 시 갱신)
 * - vw(n): 화면 가로의 n%
 * - vh(n): 화면 세로의 n%
 * - rem(n): 짧은 쪽 기준 n% (정사각형에 가깝게 쓸 때)
 */
export function useResponsiveDimensions() {
  const { width, height } = useWindowDimensions()

  const vw = (percent: number) => (width * percent) / 100
  const vh = (percent: number) => (height * percent) / 100
  const minSide = Math.min(width, height)
  const rem = (percent: number) => (minSide * percent) / 100

  return { width, height, vw, vh, minSide, rem }
}
