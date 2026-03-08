"use client"

import { Toolber } from "./toolbar";

interface WorkspaceLayoutProps {
    children: React.ReactNode;
};


const WorkspaceLayout = ({ children }: WorkspaceLayoutProps) => {
    return (
        <div className="h-full">
            <Toolber/>
                {children}
        </div>
    );
};

export default WorkspaceLayout;