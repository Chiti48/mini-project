"use client"

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable"

import { Sidebar } from "./sidebar";
import { Toolber } from "./toolbar";
import { WorkspaceSidebar } from "./workspace-sidebar";

interface WorkspaceIdLayoutProps {
    children: React.ReactNode;
};


const WorkspaceIdLayout = ({ children }: WorkspaceIdLayoutProps) => {
    return (
        <div className="h-full">
            <Toolber />
            <div className="flex h-[calc(100vh-40px)]">
                <Sidebar />
                <ResizablePanelGroup
                    orientation="horizontal"
                    autoSave="ca-workspace-layout"
                >
                    <ResizablePanel
                        defaultSize="20%"
                        minSize="11%"
                        className="bg-[#5E2C5F]"
                    >
                        <WorkspaceSidebar />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                        minSize="11%"
                        defaultSize="80%"
                    >
                        {children}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div >
    );
};

export default WorkspaceIdLayout;