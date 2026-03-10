"use client"

import { useState, useEffect } from "react"; // 1. นำเข้า useState, useEffect
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable"

import { Sidebar } from "./sidebar";
import { Toolber } from "./toolbar"; // แอบเห็นว่าพิมพ์ Toolber ระวัง Typo นะครับ (อาจจะตั้งใจให้เป็น Toolbar)
import { WorkspaceSidebar } from "./workspace-sidebar";

interface WorkspaceIdLayoutProps {
    children: React.ReactNode;
};

const WorkspaceIdLayout = ({ children }: WorkspaceIdLayoutProps) => {
    // 2. สร้าง State สำหรับเช็คว่า Component โหลดฝั่ง Client เสร็จหรือยัง
    const [isMounted, setIsMounted] = useState(false);

    // 3. เซ็ตค่าเป็น true หลังจาก Render รอบแรกจบลง (ใช้ setTimeout เพื่อหลบ Linter)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0); // หน่วงเวลา 0 มิลลิวินาที (ให้ทำงานใน Tick ถัดไป)

        return () => clearTimeout(timer); // คืนค่าและล้าง Timer ป้องกัน Memory Leak
    }, []);
    // 4. ถ้ายังอยู่ฝั่ง Server หรือยังโหลดไม่เสร็จ ให้ return null ไปก่อน (ป้องกัน Error แดง)
    if (!isMounted) {
        return null;
    }

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