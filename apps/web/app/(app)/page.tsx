'use client'

import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'

export default function Home() {
  return (
    <div className='my-10'>
      <Carousel>
        <CarouselContent className='mx-[5vw]'>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem
              key={index}
              className="basis-[90vw] px-2 flex justify-center max-w-lg"
            >
              <Card className="w-full h-96 flex flex-col items-center justify-center">
                <CardContent className="flex aspect-square items-center justify-center">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
