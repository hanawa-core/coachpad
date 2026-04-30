import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* グリッド横線 */}
          <line x1="12" y1="30" x2="88" y2="30" stroke="#1E293B" strokeWidth="1" />
          <line x1="12" y1="45" x2="88" y2="45" stroke="#1E293B" strokeWidth="1" />
          <line x1="12" y1="60" x2="88" y2="60" stroke="#1E293B" strokeWidth="1" />
          <line x1="12" y1="75" x2="88" y2="75" stroke="#1E293B" strokeWidth="1" />
          {/* グリッド縦線 */}
          <line x1="12" y1="25" x2="12" y2="80" stroke="#1E293B" strokeWidth="1" />
          <line x1="30" y1="25" x2="30" y2="80" stroke="#1E293B" strokeWidth="1" />
          <line x1="48" y1="25" x2="48" y2="80" stroke="#1E293B" strokeWidth="1" />
          <line x1="66" y1="25" x2="66" y2="80" stroke="#1E293B" strokeWidth="1" />
          <line x1="84" y1="25" x2="84" y2="80" stroke="#1E293B" strokeWidth="1" />
          {/* ECG ライン */}
          <polyline
            points="12,52 22,52 25,52 27,30 29,52 31,68 35,52 44,52 54,52 58,52 62,26 64,52 66,62 70,52 80,52 88,52"
            stroke="#10B981"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* ピーク強調ドット */}
          <circle cx="62" cy="26" r="3.5" fill="#FBBF24" />
          {/* 右端グロー */}
          <circle cx="88" cy="52" r="5" fill="#10B981" fillOpacity="0.2" />
          <circle cx="88" cy="52" r="2.5" fill="#10B981" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
