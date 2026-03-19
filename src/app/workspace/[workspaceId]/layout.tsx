"use client"

import { useState, useEffect } from "react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable"
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { usePanel } from "@/hooks/use-panel";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { Loader } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { Thread } from "@/features/messages/components/thread";
import { Profile } from "@/features/members/components/profile";
import { cn } from "@/lib/utils";

interface WorkspaceIdLayoutProps {
    children: React.ReactNode;
};

const WorkspaceIdLayout = ({ children }: WorkspaceIdLayoutProps) => {
    const { parentMessageId, profileMemberId, onClose } = usePanel();
    const { isOpen: isSidebarOpen, isMobile, close: closeSidebar } = useMobileSidebar();

    const showPanel = !!parentMessageId || !!profileMemberId;

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <div className="h-full">
            <Toolbar />
            {/* เพิ่ม relative และ overflow-hidden เพื่อกักบริเวณเมนูสไลด์ */}
            <div className="flex h-[calc(100vh-40px)] relative overflow-hidden">

                {/* 1. Thin Sidebar หลัก (ต้องมี z-50 เพื่อให้อยู่เหนือ Backdrop และกดปุ่มปิดได้) */}
                <div className="z-50 flex-none">
                    <Sidebar />
                </div>

                {/* 2. Mobile Backdrop (จางๆ สีดำ) */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/60 z-40 lg:hidden"
                        onClick={closeSidebar}
                    />
                )}

                {/* 3. Mobile WorkspaceSidebar (Drawer แบบสไลด์) */}
                {isMobile && (
                    <div
                        className={cn(
                            "absolute left-[70px] top-0 bottom-0 z-40 w-64 bg-[#337f37] transition-transform duration-300 ease-in-out lg:hidden",
                            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        <WorkspaceSidebar />
                    </div>
                )}

                {/* 4. Desktop Layout (ใช้ ResizablePanel ตามปกติ) */}
                <ResizablePanelGroup
                    orientation="horizontal"
                    autoSave="ca-workspace-layout"
                    className="flex-1"
                >
                    {/* ซ่อน Panel ซ้ายเมื่อเป็นมือถือ */}
                    {!isMobile && (
                        <>
                            <ResizablePanel
                                defaultSize={20}
                                minSize={11}
                                className="bg-[#337f37]"
                            >
                                <WorkspaceSidebar />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                        </>
                    )}

                    {/* Main Content (ห้องแชท) */}
                    <ResizablePanel
                        minSize={11}
                        defaultSize={80}
                    >
                        {children}
                    </ResizablePanel>

                    {/* Thread / Profile Panel */}
                    {showPanel && (
                        <>
                            <ResizableHandle withHandle />
                            <ResizablePanel minSize={20} defaultSize={29}>
                                {parentMessageId ? (
                                    <Thread
                                        messageId={parentMessageId as Id<"messages">}
                                        onClose={onClose}
                                    />
                                ) : profileMemberId ? (
                                    <Profile
                                        memberId={profileMemberId as Id<"members">}
                                        onClose={onClose}
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            </div>
        </div>
    );
};

export default WorkspaceIdLayout;