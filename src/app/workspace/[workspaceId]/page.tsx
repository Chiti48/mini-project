interface WorkspaceIdPageProps {
    // 1. เปลี่ยน Type ให้ครอบด้วย Promise
    params: Promise<{
        workspaceId: string;
    }>;
};

// 2. เติม async
const WorkspaceIdPage = async ({ params }: WorkspaceIdPageProps) => {
    // 3. แกะค่าด้วย await
    const resolvedParams = await params; 

    return (
        <div>
            {/* 4. เรียกใช้ค่าที่แกะแล้ว */}
            ID: {resolvedParams.workspaceId}
        </div>
    );
}

export default WorkspaceIdPage;