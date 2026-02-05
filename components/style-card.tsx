'use client'

import { memo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

interface StyleCardProps {
    id: string
    name: string
    description: string
    coverImage: string
    onSelect: (id: string) => void
}

// Memoized to prevent unnecessary re-renders
export const StyleCard = memo(function StyleCard({ id, name, description, coverImage, onSelect }: StyleCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)

    return (
        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-border">
            <div className="relative aspect-square overflow-hidden bg-muted">
                {!imageLoaded && !imageError && (
                    <Skeleton className="absolute inset-0" />
                )}
                {coverImage && !imageError ? (
                    <Image
                        src={coverImage}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4="
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Preview
                    </div>
                )}
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
                <Button
                    onClick={() => onSelect(id)}
                    className="w-full"
                    size="sm"
                >
                    Use Style
                </Button>
            </CardContent>
        </Card>
    )
})

// Skeleton loader for StyleCard
export function StyleCardSkeleton() {
    return (
        <Card className="overflow-hidden border-border">
            <div className="relative aspect-square">
                <Skeleton className="absolute inset-0" />
            </div>
            <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
            </CardContent>
        </Card>
    )
}
