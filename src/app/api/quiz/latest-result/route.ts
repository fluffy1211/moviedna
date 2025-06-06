import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the latest quiz result for the user
    const latestResult = await prisma.quizResult.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    if (!latestResult) {
      return NextResponse.json({ error: 'No quiz results found' }, { status: 404 })
    }

    // Regenerate recommendations based on stored preferences
    const { generateRecommendations } = await import('../complete/route')
    const recommendations = await generateRecommendations(latestResult.moviePreferences as any)

    // Return the result in the same format as the completion endpoint
    const result = {
      recommendations,
      personalityType: latestResult.personalityType,
      preferences: latestResult.moviePreferences
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching latest quiz result:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 