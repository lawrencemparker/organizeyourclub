import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Sidebar - Left Alone per request */}
      <Sidebar />
      
      {/* Main Content Area 
        FIX: Removed 'lg:pl-64' because the Sidebar is already in the flex flow.
        FIX: Ensure 'w-full' and 'flex-1' so content fills the space.
      */}
      <main className="flex-1 min-h-screen w-full flex flex-col overflow-x-hidden">
        {/* Content Wrapper 
          REMOVED: Internal padding (lg:p-8) to avoid double-padding with Page components.
        */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}