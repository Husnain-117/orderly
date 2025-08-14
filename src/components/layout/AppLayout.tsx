import { ReactNode } from "react";

export default function AppLayout({ children, headerRight }: { children: ReactNode; headerRight?: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {children}
    </div>
  );
}
