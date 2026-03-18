"use client";

// 1. นำเข้า Icon ใหม่ที่สื่อความหมายชัดเจนขึ้น
import { X, Activity, MessageSquareText, Pencil, Trash2, Copy, FilePlus2, MinusCircle, ArrowRightLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useGetWorkspaceActivityLogs } from "@/features/tasks/api/use-get-workspace-activity-logs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActivityLog {
    _id: string;
    action: string;
    details?: string;
    _creationTime: number;
    user?: {
        name?: string;
        image?: string;
    };
    fromList?: {
        name?: string;
    };
    toList?: {
        name?: string;
    };
}

interface ActivityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: Id<"workspaces">;
}

export const ActivityModal = ({ open, onOpenChange, workspaceId }: ActivityModalProps) => {
    const activityLogs = useGetWorkspaceActivityLogs(workspaceId, 50);

    // 2. ปรับ Icon และจับคู่สีตามหลัก UX
    const getActionIcon = (action: string) => {
        switch (action) {
            case "created":
                return <FilePlus2 className="h-4 w-4 text-emerald-400" />; // สร้างใหม่ = สีเขียว (Success)
            case "copied":
                return <Copy className="h-4 w-4 text-blue-400" />; // คัดลอก = สีฟ้า (Info)
            case "updated":
            case "edited":
                return <Pencil className="h-4 w-4 text-amber-400" />; // แก้ไข = สีส้ม/เหลือง (Warning/Modify)
            case "deleted":
                return <Trash2 className="h-4 w-4 text-rose-500" />; // ลบทิ้ง = สีแดง (Destructive)
            case "removed":
                return <MinusCircle className="h-4 w-4 text-rose-400" />; // เอาออก (แต่ไม่ได้ลบถาวร) = สีแดงอ่อน
            case "commented":
                return <MessageSquareText className="h-4 w-4 text-sky-400" />; // พูดคุย = สีฟ้าสว่าง (Communication)
            case "moved":
                return <ArrowRightLeft className="h-4 w-4 text-purple-400" />; // ย้ายตำแหน่ง = สีม่วง (Process/Flow)
            default:
                return <Activity className="h-4 w-4 text-slate-400" />;
        }
    };

    const getActionText = (action: string, log?: ActivityLog) => {
        switch (action) {
            case "created": return "created a task";
            case "updated": return "updated task details";
            case "deleted": return "deleted a task";
            case "copied": return "copied a task";
            case "commented": return "commented on";
            case "moved": {
                const fromName = log?.fromList?.name || "unknown list";
                const toName = log?.toList?.name || "unknown list";
                return `moved from "${fromName}" to "${toName}"`;
            }
            case "removed": return "removed";
            default: return action;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 text-slate-100 p-0 overflow-hidden shadow-xl rounded-xl">
                <DialogDescription className="sr-only">
                    Task board activity
                </DialogDescription>
                
                <DialogHeader className="border-b border-slate-800 p-5 bg-slate-900/90 backdrop-blur-md z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold tracking-wide text-slate-100">
                            <div className="p-2 bg-[#337f37]/20 rounded-lg border border-[#337f37]/30">
                                <Activity className="h-5 w-5 text-emerald-400" />
                            </div>
                            Task Board Activity
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-5 space-y-3
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-slate-700
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    hover:[&::-webkit-scrollbar-thumb]:bg-slate-600
                ">
                    {activityLogs === undefined ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400"></div>
                        </div>
                    ) : !activityLogs || activityLogs.page.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-slate-800 p-4 rounded-full mb-4 border border-slate-700">
                                <Activity className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-300 font-medium text-lg">No recent activity</p>
                            <p className="text-slate-500 text-sm mt-1">Activity will show up here once team members start interacting.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activityLogs.page.map((log) => (
                                <div
                                    key={log._id}
                                    className="group flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700 hover:bg-slate-800 hover:border-[#337f37]/50 transition-all duration-300 hover:shadow-[0_0_12px_rgba(51,127,55,0.08)]"
                                >
                                    <div className="shrink-0 mt-0.5 p-2 bg-slate-900 rounded-full border border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                                        {/* วาง Icon ที่เราตั้งค่าไว้ */}
                                        {getActionIcon(log.action)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <Avatar className="h-6 w-6 ring-2 ring-slate-800 shadow-sm">
                                                <AvatarImage src={log.user?.image} />
                                                <AvatarFallback className="bg-sky-500 text-white text-[10px] font-medium">
                                                    {log.user?.name?.charAt(0)?.toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-1.5">
                                                <span className="font-medium text-sm text-slate-200 truncate">
                                                    {log.user?.name || "Unknown"}
                                                </span>
                                                <span className="text-slate-400 text-sm">
                                                    {getActionText(log.action, log as ActivityLog)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {log.details && (
                                            <div className="mt-2 mb-2 p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-300 text-sm leading-relaxed">
                                                {log.details}
                                            </div>
                                        )}
                                        
                                        <p className="text-slate-500 text-[11px] font-medium tracking-wide uppercase mt-1">
                                            {format(log._creationTime, "MMM d, yyyy • h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};