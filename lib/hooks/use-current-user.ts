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
  isCurriculumCoordinator?: boolean
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
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    // Early return if still loading
    if (status === "loading") {
      return
    }
    
    // If no session, just update loading state
    if (!session?.user) {
      setLoading(false)
      setHasFetched(true)
      return
    }

    // Skip if already fetched for this user
    if (hasFetched && data?.user?.id === session.user.id) {
      return
    }

    const abortController = new AbortController()

    const fetchUserData = async () => {
      let wasAborted = false
      try {
        const response = await fetch("/api/auth/me", {
          signal: abortController.signal,
          cache: 'no-store',
        })
        if (response.ok) {
          const userData = await response.json()
          setData(userData)
          setError(null)
          setHasFetched(true)
        } else {
          setError("Failed to fetch user data")
        }
      } catch (err) {
        // Ignore abort errors — do NOT set loading=false so the second
        // Strict Mode effect run can complete the fetch cleanly.
        if (err instanceof Error && err.name === 'AbortError') {
          wasAborted = true
          return
        }
        setError("An error occurred while fetching user data")
        console.error("Error fetching user data:", err)
      } finally {
        if (!wasAborted) {
          setLoading(false)
        }
      }
    }

    fetchUserData()

    // Cleanup: abort fetch if component unmounts or dependencies change
    return () => {
      abortController.abort()
    }
  }, [session?.user?.id, status, hasFetched, data?.user?.id])

  const refetch = async () => {
    setLoading(true)
    setHasFetched(false) // Reset to allow refetch
    try {
      const response = await fetch("/api/auth/me", {
        cache: 'no-store', // Force fresh data on manual refetch
      })
      if (response.ok) {
        const userData = await response.json()
        setData(userData)
        setError(null)
        setHasFetched(true)
      }
    } catch (err) {
      setError("An error occurred while fetching user data")
    } finally {
      setLoading(false)
    }
  }

  return {
    user: data?.user || null,
    classrooms: data?.classrooms || [],
    children: data?.children || [],
    isCurriculumCoordinator: data?.user?.isCurriculumCoordinator, // Placeholder, can be derived from user role if needed
    loading,
    error,
    refetch,
  }
}
