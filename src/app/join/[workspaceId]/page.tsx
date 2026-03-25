"use client"

import VerificationInput from "react-verification-input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspaceInfo } from "@/features/workspaces/api/use-get-workspace-info";
import { Loader } from "lucide-react";
import { useJoin } from "@/features/workspaces/api/use-join";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";

const JoinPage = () => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();

    const { mutate, isPending } = useJoin();
    const { data, isLoading } = useGetWorkspaceInfo({ id: workspaceId });

    const isMember = useMemo(() => data?.isMember, [data?.isMember]);

    useEffect(() => {
        if (isMember) {
            router.push(`/workspace/${workspaceId}`);
        }
    }, [isMember, router, workspaceId]);

    const handleComplete = (value: string) => {
        mutate({ workspaceId, joinCode: value }, {
            onSuccess: (id) => {
                router.replace(`/workspace/${id}`);
                toast.success("Workspace joined");
            },
            onError: () => {
                toast.error("Failed to join workspace")
            }
        })
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <Loader className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border flex flex-col items-center gap-y-8">
                
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-y-4">
                    <div className="bg-[oklch(35.5%_0.07_142)] p-3 rounded-full">
                        <Image src="/Logo-Ct25.png" width={64} height={64} alt="Logo" className="object-contain" />
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Join Workspace
                        </h1>
                        <p className="text-sm text-slate-500">
                            Enter the 6-digit code for <span className="font-semibold text-slate-700">{data?.name || "this workspace"}</span>
                        </p>
                    </div>
                </div>

                {/* Input Section */}
                <div className="w-full flex justify-center">
                    <VerificationInput
                        onComplete={handleComplete}
                        length={6}
                        classNames={{
                            container: cn("flex gap-x-2", isPending && "opacity-50 cursor-not-allowed pointer-events-none"),
                            character: "uppercase h-14 w-12 rounded-lg border-2 border-slate-200 flex items-center justify-center text-xl font-bold text-slate-700 transition-all duration-200",
                            characterInactive: "bg-slate-50",
                            characterSelected: "border-primary bg-white text-primary outline-none ring-2 ring-primary/20",
                            characterFilled: "bg-white border-slate-300 text-slate-900"
                        }}
                        autoFocus
                    />
                </div>

                {/* Footer Section */}
                <div className="w-full pt-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        asChild
                    >
                        <Link href="/">
                            Back to home
                        </Link>
                    </Button>
                </div>

            </div>
        </div>
    );
}

export default JoinPage;