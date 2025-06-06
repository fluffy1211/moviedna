'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UsernameInput } from '@/components/auth/UsernameInput'
import { VALIDATION } from '@/lib/constants'

const usernameSchema = z.object({
  username: z
    .string()
    .min(VALIDATION.USERNAME_MIN_LENGTH, `Username must contain at least ${VALIDATION.USERNAME_MIN_LENGTH} characters`)
    .max(VALIDATION.USERNAME_MAX_LENGTH, `Username cannot exceed ${VALIDATION.USERNAME_MAX_LENGTH} characters`)
    .regex(VALIDATION.USERNAME_PATTERN, 'Username can only contain letters, numbers, hyphens and underscores')
})

type UsernameFormData = z.infer<typeof usernameSchema>

export default function UsernameSetupPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: ''
    }
  })

  const onSubmit = async (data: UsernameFormData) => {
    if (!session?.user?.email) {
      setError('Session invalid. Please log in again.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/setup-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: session.user.email
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error setting up username')
      }

      // Update the session with the new username
      await update({
        ...session,
        user: {
          ...session.user,
          username: data.username
        }
      })

      // Redirect to profile or home page
      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect if user already has username
  if (session?.user?.username) {
    router.push('/profile')
    return null
  }

  // Show loading if session is loading
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-center">
            Choose a username for your MovieDNA profile
          </CardTitle>
                      <CardDescription>
              Choose a unique username to personalize your movie experience
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Logged in as:</strong><br />
              {session.user.name} ({session.user.email})
            </p>
          </div>

          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field, fieldState }) => (
                  <UsernameInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting up...' : 'Confirm Username'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}