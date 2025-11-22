import { AlertCircle, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from "@/components/ui/badge"


export function getSeverityIcon(severity: string) {
  switch (severity) {
    case "Blocker":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "Critical":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case "Major":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-blue-500" />
  }
}
export function getSeverityColor(severity: string) {
  switch (severity) {
    case "Blocker":
      return "destructive"
    case "Critical":
      return "default"
    case "Major":
      return "secondary"
    default:
      return "outline"
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "Resolved":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      )
    case "In Progress":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          {status}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          {status}
        </Badge>
      )
  }
}
