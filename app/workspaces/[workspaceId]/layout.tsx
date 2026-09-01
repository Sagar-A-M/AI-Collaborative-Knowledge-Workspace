import React from "react";
import { WorkspaceSidebar } from "@/components/workspaces/workspace-sidebar";
import { WorkspaceHeader } from "@/components/workspaces/workspace-header";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <WorkspaceSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <WorkspaceHeader />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
