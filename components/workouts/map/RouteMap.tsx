'use client'

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import polyline from '@mapbox/polyline'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet のマーカーアイコンの型エラー回避
const startIcon = new L.DivIcon({
  html: '<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})
const endIcon = new L.DivIcon({
  html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

interface Props {
  /** Strava 圧縮ポリライン */
  polylineStr?: string | null
  /** 詳細座標配列 (latlng streams) */
  latlngs?: [number, number][] | null
  height?: string
}

export function RouteMap({ polylineStr, latlngs: latlngsProp, height = '300px' }: Props) {
  const decoded = latlngsProp
    ? latlngsProp
    : polylineStr
      ? polyline.decode(polylineStr)
      : []

  if (decoded.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-lg bg-slate-950 text-sm text-slate-500"
      >
        GPS データがありません
      </div>
    )
  }

  // 中心と境界を計算
  const lats = decoded.map((p) => p[0])
  const lngs = decoded.map((p) => p[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const center: [number, number] = [(minLat + maxLat) / 2, (minLng + maxLng) / 2]

  return (
    <div
      style={{ height }}
      className="overflow-hidden rounded-lg border border-slate-700"
    >
      <MapContainer
        center={center}
        zoom={13}
        bounds={[
          [minLat, minLng],
          [maxLat, maxLng],
        ]}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={decoded} color="#22d3ee" weight={4} opacity={0.9} />
        <Marker position={decoded[0]} icon={startIcon}>
          <Popup>スタート</Popup>
        </Marker>
        <Marker position={decoded[decoded.length - 1]} icon={endIcon}>
          <Popup>ゴール</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
