'use client'

import { useCallback, useState } from 'react'

interface UseIpfsUploadReturn {
  upload: (agentCard: Record<string, unknown>) => Promise<string>
  isUploading: boolean
  error: Error | null
}

/**
 * Upload an agent card JSON to IPFS via the server-side API route.
 * Returns the IPFS URI or data URI fallback.
 */
export function useIpfsUpload(): UseIpfsUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const upload = useCallback(async (agentCard: Record<string, unknown>): Promise<string> => {
    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentCard),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }

      const data = await response.json() as { uri: string }
      return data.uri
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Upload failed')
      setError(err)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { upload, isUploading, error }
}
