import { useEffect, useState } from "react"
import SubscribeForm from "./suscribeForm"
import PersonalizedNews from "./personalizedNews"

export default function NewsPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [sector, setSector] = useState<string | null>(null)

  // Cargar preferencias desde localStorage al montar
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail")
    const storedCountry = localStorage.getItem("userCountry")
    const storedSector = localStorage.getItem("userSector")

    if (storedEmail && storedCountry && storedSector) {
      setEmail(storedEmail)
      setCountry(storedCountry)
      setSector(storedSector)
    }
  }, [])

  // Callback que recibe los datos desde SubscribeForm y actualiza estado
  const handleSuccess = (newEmail: string, newCountry: string, newSector: string) => {
    setEmail(newEmail)
    setCountry(newCountry)
    setSector(newSector)
  }

  const isSubscribed = email && country && sector

  return (
    <>
      {isSubscribed ? (
        <PersonalizedNews key={`${country}-${sector}`} country={country!} sector={sector!} />
      ) : (
        <SubscribeForm onSuccess={handleSuccess} />
      )}
    </>
  )
}
