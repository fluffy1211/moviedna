'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MovieRecommendations from '@/components/quiz/MovieRecommendations'
import { QuizCompletionResult } from '@/lib/types'

export default function QuizResultsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [result, setResult] = useState<QuizCompletionResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }

    fetchLatestQuizResult()
  }, [session, router])

  const fetchLatestQuizResult = async () => {
    try {
      const response = await fetch('/api/quiz/latest-result')
      if (response.ok) {
        const data = await response.json()
        console.log('Quiz result data:', data) // Debug log
        
        // Validate the data structure
        if (data && data.recommendations && Array.isArray(data.recommendations)) {
          setResult(data)
        } else {
          console.error('Invalid quiz result structure:', data)
          // Try to fetch again or redirect to quiz
          router.push('/quiz')
        }
      } else {
        const errorText = await response.text()
        console.error('API error response:', response.status, errorText)
        // No quiz result found, redirect to quiz
        router.push('/quiz')
      }
    } catch (error) {
      console.error('Error fetching quiz result:', error)
      router.push('/quiz')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="p-8 min-h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </main>
    )
  }

  if (!result) {
    return (
      <main className="p-8 min-h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Quiz Results Found</h1>
          <p className="text-gray-600 mb-6">
            It looks like you haven&apos;t completed the MovieDNA quiz yet.
          </p>
          <button 
            onClick={() => router.push('/quiz')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Take the Quiz
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-160px)] bg-gray-50">
      <MovieRecommendations result={result} />
    </main>
  )
} 