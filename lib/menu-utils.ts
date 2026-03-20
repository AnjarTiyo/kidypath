import { MenuCardProps } from "@/components/layout/menu-card"

/**
 * User roles available in the system
 */
export type UserRole = "admin" | "teacher" | "parent" | "student"

/**
 * Filters menu items based on user role
 * @param menus - Array of menu items
 * @param userRole - Current user's role
 * @returns Filtered array of menus accessible to the user
 */
export function filterMenusByRole(
  menus: MenuCardProps[],
  userRole: string | null | undefined
): MenuCardProps[] {
  if (!userRole) return []
  
  return menus.filter((menu) => {
    // If no roles specified, menu is accessible to all
    if (!menu.roles || menu.roles.length === 0) return true
    
    // Check if user's role is in the allowed roles
    return menu.roles.includes(userRole)
  })
}

/**
 * Checks if a user has access to a specific menu item
 * @param menu - Menu item to check
 * @param userRole - Current user's role
 * @returns true if user has access, false otherwise
 */
export function hasMenuAccess(
  menu: MenuCardProps,
  userRole: string | null | undefined
): boolean {
  if (!userRole) return false
  if (!menu.roles || menu.roles.length === 0) return true
  return menu.roles.includes(userRole)
}

/**
 * Groups menus by their required roles
 * @param menus - Array of menu items
 * @returns Object with roles as keys and arrays of menus as values
 */
export function groupMenusByRole(
  menus: MenuCardProps[]
): Record<string, MenuCardProps[]> {
  const grouped: Record<string, MenuCardProps[]> = {}
  
  menus.forEach((menu) => {
    if (!menu.roles || menu.roles.length === 0) {
      // Add to "all" group if no roles specified
      if (!grouped["all"]) grouped["all"] = []
      grouped["all"].push(menu)
    } else {
      menu.roles.forEach((role) => {
        if (!grouped[role]) grouped[role] = []
        grouped[role].push(menu)
      })
    }
  })
  
  return grouped
}
