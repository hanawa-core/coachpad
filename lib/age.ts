/**
 * 生年月日（YYYY-MM-DD）から満年齢を計算する。
 * 無効・未設定は null。
 */
export function calculateAge(birthDate?: string | null, ref: Date = new Date()): number | null {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return null
  let age = ref.getFullYear() - b.getFullYear()
  const m = ref.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--
  return age >= 0 && age < 150 ? age : null
}
