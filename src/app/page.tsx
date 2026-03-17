/* eslint-disable @next/next/no-img-element */
"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [, setOpen] = useCreateWorkspaceModal();
  const { data, isLoading } = useGetWorkspaces();
  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  useEffect(() => {
    if (isLoading) return;

    if (workspaceId) {
      router.replace(`/workspace/${workspaceId}`);
    }
  }, [workspaceId, isLoading, router]);

  // Empty state when no workspaces
  if (!isLoading && !workspaceId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-[#129a77] to-[#044f3b] p-4">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#27443a] rounded-full flex items-center justify-center mb-4 shadow-lg border-2 border-white/10">
            <img src="/logo-Ct25.png" alt="Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
            Welcome to CT Workspace
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-10 text-center">
          
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderPlus className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            No Workspace Found
          </h2>
          
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            You aren&apos;t in any workspace yet. Create your first workspace to get started with team collaboration and manage your projects.
          </p>

          <Button 
            onClick={() => setOpen(true)}
            size="lg"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 text-base font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Workspace
          </Button>
          
        </div>

      </div>
    );
  }

  return (
    <div>
      <UserButton />
    </div>
  );
}