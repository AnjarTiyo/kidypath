import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      isCurriculumCoordinator: boolean
      avatarUrl?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    isCurriculumCoordinator?: boolean
    avatarUrl?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
    isCurriculumCoordinator?: boolean
    avatarUrl?: string | null
  }
}
