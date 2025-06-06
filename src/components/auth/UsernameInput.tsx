'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Check, X, Loader2 } from 'lucide-react'
import { VALIDATION } from '@/lib/constants'
import { useDebounce } from '@/hooks/useDebounce'

interface UsernameInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}

export function UsernameInput({ value, onChange, disabled, error }: UsernameInputProps) {
  const [availability, setAvailability] = useState<{
    available: boolean | null
    checking: boolean
  }>({ available: null, checking: false })

  const debouncedUsername = useDebounce(value, 500)

  const checkAvailability = useCallback(async (username: string) => {
    if (!username || username.length < VALIDATION.USERNAME_MIN_LENGTH) {
      setAvailability({ available: null, checking: false })
      return
    }

    if (!VALIDATION.USERNAME_PATTERN.test(username)) {
      setAvailability({ available: null, checking: false })
      return
    }

    setAvailability({ available: null, checking: true })

    try {
      const response = await fetch('/api/user/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })

      const result = await response.json()

      if (response.ok) {
        setAvailability({ available: result.available, checking: false })
      } else {
        setAvailability({ available: null, checking: false })
      }
    } catch (error) {
      console.error('Error checking username availability:', error)
      setAvailability({ available: null, checking: false })
    }
  }, [])

  useEffect(() => {
    checkAvailability(debouncedUsername)
  }, [debouncedUsername, checkAvailability])

  const getAvailabilityIcon = () => {
    if (availability.checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    }
    if (availability.available === true) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    if (availability.available === false) {
      return <X className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const getAvailabilityMessage = () => {
    if (availability.checking) {
      return "Checking availability..."
    }
    if (availability.available === true) {
      return "✓ Username available"
    }
    if (availability.available === false) {
      return "✗ This username is already taken"
    }
    return null
  }

  return (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            placeholder="your_username"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`pr-10 ${
              availability.available === false ? 'border-red-500' : 
              availability.available === true ? 'border-green-500' : ''
            }`}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getAvailabilityIcon()}
          </div>
        </div>
      </FormControl>
      <FormDescription>
        {VALIDATION.USERNAME_MIN_LENGTH}-{VALIDATION.USERNAME_MAX_LENGTH} characters. 
        Letters, numbers, hyphens and underscores only.
      </FormDescription>
      {getAvailabilityMessage() && (
        <p className={`text-sm ${
          availability.available === true ? 'text-green-600' : 
          availability.available === false ? 'text-red-600' : 
          'text-gray-500'
        }`}>
          {getAvailabilityMessage()}
        </p>
      )}
      <FormMessage />
    </FormItem>
  )
} 