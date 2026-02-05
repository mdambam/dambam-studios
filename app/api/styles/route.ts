import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { getStylesCache, invalidateStylesCache, setStylesCache } from '@/lib/styles-cache'

const CACHE_TTL = 60000 // 60 seconds

function isDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:')
}

// GET /api/styles - List styles (summary by default)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const returnFull = searchParams.get('full') === '1'

    // Check in-memory cache first
    const now = Date.now()
    const cachedSummary = getStylesCache('summary')
    const cachedFull = getStylesCache('full')

    let cachedSummaryData = cachedSummary.data
    let cachedFullData = cachedFull.data

    // Guard: drop stale heavy cache payloads from before we introduced the summary endpoint.
    const summaryLooksHeavy =
      Array.isArray(cachedSummary.data) &&
      cachedSummary.data.some((s: any) =>
        typeof s?.referenceImage === 'string' ||
        typeof s?.exampleBeforeImage === 'string' ||
        typeof s?.exampleAfterImage === 'string'
      )

    if (summaryLooksHeavy) {
      invalidateStylesCache()
      cachedSummaryData = null
      cachedFullData = null
    }

    if (!returnFull && cachedSummaryData && (now - cachedSummary.ts) < CACHE_TTL) {
      return NextResponse.json(
        { status: 'success', data: cachedSummaryData },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT',
          },
        }
      )
    }

    if (returnFull && cachedFullData && (now - cachedFull.ts) < CACHE_TTL) {
      return NextResponse.json(
        { status: 'success', data: cachedFullData },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT',
          },
        }
      )
    }

    const styles = await prisma.style.findMany({
      orderBy: { createdAt: 'desc' },
      ...(returnFull
        ? {}
        : {
            select: {
              id: true,
              name: true,
              description: true,
              coverImage: true,
              styleType: true,
              requiresFabricUpload: true,
              requiresLogoUpload: true,
              requiresCustomInstructions: true,
              requiresMannequinReference: true,
              allowsResolutionSelection: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
    })

    const normalizedStyles = returnFull
      ? (styles as any[]).map((style) => {
          const coverImage = isDataUrl(style.coverImage) ? '' : style.coverImage
          return {
            ...style,
            coverImage,
          }
        })
      : (styles as any[])

    // Update cache
    if (returnFull) {
      setStylesCache('full', normalizedStyles)
    } else {
      setStylesCache('summary', normalizedStyles)
    }

    return NextResponse.json(
      { status: 'success', data: normalizedStyles },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'MISS',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching styles:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to fetch styles' }, { status: 500 })
  }
}

// POST /api/styles - Create a new style (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      name, 
      description, 
      coverImage, 
      referenceImage, 
      prompt, 
      nanoBananaPrompt,
      styleType,
      requiresFabricUpload,
      requiresLogoUpload,
      requiresCustomInstructions,
      requiresMannequinReference,
      allowsResolutionSelection
    } = body

    if (!name || !coverImage || !referenceImage || !prompt) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 })
    }

    const finalCover = coverImage || referenceImage
    const finalBefore = referenceImage
    const finalAfter = referenceImage

    const newStyle = await prisma.style.create({
      data: {
        name,
        description: description || '',
        coverImage: finalCover,
        referenceImage,
        prompt,
        exampleBeforeImage: finalBefore,
        exampleAfterImage: finalAfter,
        nanoBananaPrompt: nanoBananaPrompt || null,
        styleType: styleType || 'fabric-mockup',
        requiresFabricUpload: requiresFabricUpload ?? true,
        requiresLogoUpload: requiresLogoUpload ?? true,
        requiresCustomInstructions: requiresCustomInstructions ?? true,
        requiresMannequinReference: requiresMannequinReference ?? true,
        allowsResolutionSelection: allowsResolutionSelection ?? true,
      },
    })
    
    // Invalidate cache after creating a new style
    invalidateStylesCache()

    return NextResponse.json({ status: 'success', data: newStyle }, { status: 201 })

  } catch (error) {
    console.error('Error creating style:', error)
    return NextResponse.json({ status: 'error', message: 'Failed to create style' }, { status: 500 })
  }
}
