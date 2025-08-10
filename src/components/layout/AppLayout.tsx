import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function AppLayout({ children, headerRight }: { children: ReactNode; headerRight?: ReactNode }) {
  return (
    <SidebarProvider>
      <header className="h-14 flex items-center border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <SidebarTrigger className="ml-2" />
        <h1 className="ml-3 font-head text-lg">Green Path Trade</h1>
        <div className="ml-auto mr-3">{headerRight}</div>
      </header>
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
        {children}
      </div>
    </SidebarProvider>
  );
}
