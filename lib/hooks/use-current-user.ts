"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Classroom {
  id: string
  name: string
  academicYear: string
  createdAt?: string
}

interface Student {
  id: string
  fullName: string
  classroomId: string | null
  birthDate: string | null
  gender: string | null
}

interface UserData {
  id: string
  name: string | null
  email: string | null
  role: string | null
  createdAt?: string
}

interface MeResponse {
  user: UserData
  classrooms?: Classroom[]
  children?: Student[]
}

export function useCurrentUser() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "loading") return
      
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setData(userData)
          setError(null)
        } else {
          setError("Failed to fetch user data")
        }
      } catch (err) {
        setError("An error occurred while fetching user data")
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [session, status])

  return {
    user: data?.user || null,
    classrooms: data?.classrooms || [],
    children: data?.children || [],
    loading,
    error,
    refetch: async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setData(userData)
          setError(null)
        }
      } catch (err) {
        setError("An error occurred while fetching user data")
      } finally {
        setLoading(false)
      }
    },
  }
}
