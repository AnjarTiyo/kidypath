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
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/images/logo.png"
              alt="KidyPath Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-md font-bold text-primary">KidyPath</span>
                <Image
                  src="/images/path.svg"
                  alt="KidyPath Logo"
                  width={18}
                  height={18}
                  className="object-contain"
                />
                </div>
              <span className="text-xs text-muted-foreground">TK Putra 1 Mataram</span>
            </div>
          </Link>

          <UserButton />
        </div>
      </div>
    </nav>
  )
}
