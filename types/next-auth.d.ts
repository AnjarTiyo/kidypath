import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      isCurriculumCoordinator?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    isCurriculumCoordinator?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    id: string
    isCurriculumCoordinator?: boolean
  }
}
