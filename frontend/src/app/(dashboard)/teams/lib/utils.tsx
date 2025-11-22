import { Crown, Shield, UserIcon } from "lucide-react"

export function getRoleIcon(role: string) {
  switch (role) {
    case "Owner":
      return <Crown className="h-3 w-3" />
    case "Admin":
      return <Shield className="h-3 w-3" />
    default:
      return <UserIcon className="h-3 w-3" />
  }
}

export function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "Owner":
      return "default"
    case "Admin":
      return "secondary"
    default:
      return "outline"
  }
}

export const teamMembers = [
  { id: 1, name: "John Doe", email: "john@marprojects.com", role: "Owner", avatar: "JD" },
  { id: 2, name: "Jane Smith", email: "jane@marprojects.com", role: "Admin", avatar: "JS" },
  { id: 3, name: "Mike Johnson", email: "mike@marprojects.com", role: "Member", avatar: "MJ" },
  { id: 4, name: "Sarah Williams", email: "sarah@marprojects.com", role: "Member", avatar: "SW" },
  { id: 5, name: "Tom Brown", email: "tom@marprojects.com", role: "Member", avatar: "TB" },
]