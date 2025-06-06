import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@/generated/prisma'
import { MovieStatus } from '@/lib/types'

const prisma = new PrismaClient()

// GET - Fetch user's movies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as MovieStatus | null

    const where = {
      userId: session.user.id,
      ...(status && { status })
    }

    const movies = await prisma.userMovie.findMany({
      where,
      orderBy: { addedAt: 'desc' }
    })

    return NextResponse.json(movies)
  } catch (error) {
    console.error('Error fetching user movies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Add movie to user's collection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tmdbId, title, posterPath, overview, releaseDate, status = MovieStatus.WATCHLIST } = await request.json()

    if (!tmdbId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if movie already exists for this user
    const existingMovie = await prisma.userMovie.findUnique({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId: tmdbId
        }
      }
    })

    if (existingMovie) {
      return NextResponse.json({ error: 'Movie already in your collection' }, { status: 400 })
    }

    const userMovie = await prisma.userMovie.create({
      data: {
        userId: session.user.id,
        tmdbId,
        title,
        posterPath,
        overview,
        releaseDate,
        status
      }
    })

    return NextResponse.json(userMovie, { status: 201 })
  } catch (error) {
    console.error('Error adding movie:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH - Update movie (status, rating, heart)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { movieId, status, rating, isHearted } = await request.json()

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID required' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status
      if (status === MovieStatus.WATCHED) {
        updateData.watchedAt = new Date()
      }
    }
    
    if (rating !== undefined) {
      updateData.rating = rating
    }
    
    if (isHearted !== undefined) {
      updateData.isHearted = isHearted
    }

    const userMovie = await prisma.userMovie.update({
      where: {
        id: movieId,
        userId: session.user.id // Ensure user owns this movie
      },
      data: updateData
    })

    return NextResponse.json(userMovie)
  } catch (error) {
    console.error('Error updating movie:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Remove movie from user's collection
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')

    if (!movieId) {
      return NextResponse.json({ error: 'Movie ID required' }, { status: 400 })
    }

    await prisma.userMovie.delete({
      where: {
        id: movieId,
        userId: session.user.id // Ensure user owns this movie
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 