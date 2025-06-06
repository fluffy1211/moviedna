import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { VALIDATION } from '@/lib/constants'

const checkUsernameSchema = z.object({
  username: z
    .string()
    .min(VALIDATION.USERNAME_MIN_LENGTH)
    .max(VALIDATION.USERNAME_MAX_LENGTH)
    .regex(VALIDATION.USERNAME_PATTERN)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = checkUsernameSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })

    return NextResponse.json({
      available: !existingUser,
      username
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid username', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error checking username availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 