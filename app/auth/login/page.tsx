import Image from "next/image"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginForm } from "@/components/auth/login-form"

function LoginSkeleton() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex items-center gap-2 self-center">
        <Skeleton className="h-[50px] w-[50px] rounded-full" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-4 sm:gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={50}
            height={50}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-[50px] md:h-[50px]"
          />
        </a>
        <Suspense fallback={<LoginSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
