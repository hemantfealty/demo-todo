import { auth } from "@/lib/auth";
import { TodoList } from "@/components/todos/TodoList";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">Manage your tasks and stay productive.</p>
      </div>
      <TodoList />
    </div>
  );
}
