"use client"

import { Sidebar } from "./sidebar";
import { Toolber } from "./toolbar";

interface WorkspaceLayoutProps {
    children: React.ReactNode;
};


const WorkspaceLayout = ({ children }: WorkspaceLayoutProps) => {
    return (
        <div className="h-full">
            <Toolber />
            <div className="flex h-[calc(100vh-40px)]">
                <Sidebar/>
                {children}
            </div>
        </div>
    );
};

export default WorkspaceLayout;