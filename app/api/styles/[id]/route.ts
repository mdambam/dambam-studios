import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'
import { invalidateStylesCache } from '@/lib/styles-cache'

// GET /api/styles/[id] - Get single style
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const style = await prisma.style.findUnique({
            where: { id },
        })

        if (!style) {
            return NextResponse.json({ status: 'error', message: 'Style not found' }, { status: 404 })
        }

        return NextResponse.json({ status: 'success', data: style })
    } catch (error) {
        console.error('Error fetching style:', error)
        return NextResponse.json({ status: 'error', message: 'Failed to fetch style' }, { status: 500 })
    }
}

// PUT /api/styles/[id] - Update style (Admin only)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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
            allowsResolutionSelection,
        } = body

        // Check if style exists
        const existingStyle = await prisma.style.findUnique({
            where: { id },
        })

        if (!existingStyle) {
            return NextResponse.json({ status: 'error', message: 'Style not found' }, { status: 404 })
        }

        // Update the style
        const updatedStyle = await prisma.style.update({
            where: { id },
            data: {
                name: name ?? existingStyle.name,
                description: description ?? existingStyle.description,
                coverImage: coverImage ?? existingStyle.coverImage,
                referenceImage: referenceImage ?? existingStyle.referenceImage,
                prompt: prompt ?? existingStyle.prompt,
                nanoBananaPrompt: nanoBananaPrompt ?? existingStyle.nanoBananaPrompt,
                styleType: styleType ?? existingStyle.styleType,
                requiresFabricUpload: requiresFabricUpload ?? existingStyle.requiresFabricUpload,
                requiresLogoUpload: requiresLogoUpload ?? existingStyle.requiresLogoUpload,
                requiresCustomInstructions: requiresCustomInstructions ?? existingStyle.requiresCustomInstructions,
                requiresMannequinReference: requiresMannequinReference ?? existingStyle.requiresMannequinReference,
                allowsResolutionSelection: allowsResolutionSelection ?? existingStyle.allowsResolutionSelection,
            },
        })

        invalidateStylesCache()

        return NextResponse.json({ status: 'success', data: updatedStyle })
    } catch (error) {
        console.error('Error updating style:', error)
        return NextResponse.json({ status: 'error', message: 'Failed to update style' }, { status: 500 })
    }
}

// DELETE /api/styles/[id] - Delete style (Admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getSessionUser(req)

        if (!user || !user.isAdmin) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 })
        }

        await prisma.style.delete({
            where: { id },
        })

        invalidateStylesCache()

        return NextResponse.json({ status: 'success', message: 'Style deleted' })
    } catch (error) {
        console.error('Error deleting style:', error)
        return NextResponse.json({ status: 'error', message: 'Failed to delete style' }, { status: 500 })
    }
}
