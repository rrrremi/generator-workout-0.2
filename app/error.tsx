'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
      <p className="mb-8 max-w-md">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Link href="/" passHref>
          <Button variant="outline">
            Return home
          </Button>
        </Link>
      </div>
    </div>
  )
}
