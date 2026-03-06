import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeError() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-foreground">
                        Authentication Error
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        There was an issue signing you in. This link may have expired or is invalid.
                    </p>
                </div>
                <div className="mt-8 space-y-4">
                    <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">
                            Please try signing in again.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Link href="/login" className="w-full">
                            <Button className="w-full">
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
