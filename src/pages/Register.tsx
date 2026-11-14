import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Halaman /register lama sudah tidak dipakai (insert ke kolom `phone`
 * yang tidak ada di tabel customers, dan tidak dilink dari mana pun).
 * Sekarang langsung diarahkan ke home.
 */
export default function Register() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/', { replace: true })
  }, [navigate])

  return null
}
