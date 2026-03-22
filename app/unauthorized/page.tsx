import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"

export default async function UnauthorizedPage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">403 - Unauthorized</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">Go to Dashboard</Link>
          </Button>
          {!session?.user && (
            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
