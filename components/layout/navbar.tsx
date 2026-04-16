import Image from "next/image"
import Link from "next/link"
import { auth } from "@/auth"
import { UserButton } from "./user-button"

export async function Navbar() {
  const session = await auth()

  if (!session) {
    return null
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Image
              src="/images/logo2.png"
              alt="KidyPath Logo"
              width={32}
              height={32}
              className="object-contain w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full"
            />
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-md font-bold text-primary truncate">KB TK Putra 1</span>

                </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Mataram</span>
            </div>
          </Link>
          <UserButton />
        </div>
      </div>
    </nav>
  )
}
