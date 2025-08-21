"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Error Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-sm">
            Error 404
          </Badge>
        </div>
        
        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-6xl lg:text-8xl font-bold tracking-tight">
              <span className="text-primary">404</span>
            </h1>
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button asChild size="lg" className="group">
              <Link href="/">
                <svg
                  className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
