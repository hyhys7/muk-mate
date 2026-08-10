'use client'

import { useEffect, useState } from 'react'

/** 위치 권한 허용 시에만 값이 채워진다. 거부/미지원이면 계속 null — 호출부는 활동 지역 기준으로 폴백한다. */
export function useUserCoords(): { lat: number; lng: number } | null {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    )
  }, [])

  return coords
}
