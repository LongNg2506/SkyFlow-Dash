import { CheckCircle2, Clock5, ListTodo, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { UserWithStats } from "@/modules/users/services/types/user-types"

interface StatCardsProps {
  users: UserWithStats[]
}

export function StatCards({ users }: StatCardsProps) {
  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
    },
    {
      title: "Active Users",
      value: users.filter((user) => user.status === "Active").length,
      icon: CheckCircle2,
    },
    {
      title: "Pending Users",
      value: users.filter((user) => user.status === "Pending").length,
      icon: Clock5,
    },
    {
      title: "Assigned Tasks",
      value: users.reduce((sum, user) => sum + user.assignedTasks, 0),
      icon: ListTodo,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.title}
                </p>
                <div className="mt-1 text-2xl font-bold">{stat.value}</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <stat.icon className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
