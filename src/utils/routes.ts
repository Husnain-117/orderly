export type UserRole = "distributor" | "shopkeeper" | "salesperson" | "";

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "distributor":
      return "/wholesale/dashboard";
    case "shopkeeper":
      return "/shop/dashboard";
    case "salesperson":
      return "/sales/dashboard";
    default:
      return "/login";
  }
}

export function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
  if (!pathname) return false;
  if (role === "distributor") return pathname.startsWith("/wholesale");
  if (role === "shopkeeper") return pathname.startsWith("/shop");
  if (role === "salesperson") return pathname.startsWith("/sales");
  return false;
}
