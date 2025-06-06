import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { VALIDATION } from '@/lib/constants'

const setupUsernameSchema = z.object({
  username: z
    .string()
    .min(VALIDATION.USERNAME_MIN_LENGTH)
    .max(VALIDATION.USERNAME_MAX_LENGTH)
    .regex(VALIDATION.USERNAME_PATTERN),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = setupUsernameSchema.parse(body)

    // Verify the email matches the session
    if (validatedData.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Email not authorized' },
        { status: 403 }
      )
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username }
    })

    if (existingUser && existingUser.email !== session.user.email) {
      return NextResponse.json(
        { error: 'This username is already taken' },
        { status: 409 }
      )
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update the username
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username: validatedData.username },
      select: {
        id: true,
        username: true,
        email: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error setting up username:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 