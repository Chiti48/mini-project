/* eslint-disable @next/next/no-img-element */
"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [, setOpen] = useCreateWorkspaceModal();
  const { data, isLoading } = useGetWorkspaces();
  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  // ==========================================
  // 3D Tilt Logic
  // ==========================================
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // ใช้ Spring เพื่อให้การหมุนสมูทและเด้งแบบธรรมชาติ
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  
  // แปลงค่าพิกัดเมาส์เป็นองศาการเอียงของการ์ด (เอียงสูงสุด 12 องศา)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0); // กลับสู่ตำแหน่ง 0 องศาเมื่อเอาเมาส์ออก
    y.set(0);
  };

  useEffect(() => {
    if (isLoading) return;

    if (workspaceId) {
      router.replace(`/workspace/${workspaceId}`);
    }
  }, [workspaceId, isLoading, router]);

  // Empty state when no workspaces
  if (!isLoading && !workspaceId) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#129a77] via-[#0a7055] to-[#044f3b] p-4 overflow-hidden perspective-1000">
        
        {/* Animated Background Orbs for Depth (แสงลอยในพื้นหลัง) */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#337f37]/30 rounded-full blur-3xl pointer-events-none"
        />

        {/* Floating Logo Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-12 z-10"
        >
          {/* ทำให้โลโก้ลอยขึ้นลงเบาๆ ตลอดเวลา */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/20"
          >
            <img src="/Logo-Ct25.png" alt="Logo" className="w-14 h-14 drop-shadow-xl" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            CT Workspace
          </h1>
          <div className="flex items-center gap-2 mt-4 bg-black/20 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-50 text-sm font-medium">แพลตฟอร์มการทำงานของคนรุ่นใหม่</span>
          </div>
        </motion.div>

        {/* 3D Tilt Card Component */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative w-full max-w-md z-10"
        >
          {/* ตัวการ์ดใช้ translateZ(30px) เพื่อให้ลอยออกมาจากฐานหลัง */}
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 md:p-10 text-center border border-white/50"
            style={{ transform: "translateZ(30px)" }}
          >
            {/* ไอคอนโฟลเดอร์ให้ลอยเด้งออกมาอีกชั้น (translateZ 20px) */}
            <div 
              className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100"
              style={{ transform: "translateZ(20px)" }}
            >
              <FolderPlus className="w-10 h-10 text-emerald-600" />
            </div>
            
            <h2 
              className="text-2xl font-bold text-slate-900 mb-3 tracking-tight" 
              style={{ transform: "translateZ(10px)" }}
            >
              No Workspace Found
            </h2>
            
            <p 
              className="text-slate-500 mb-8 text-sm leading-relaxed" 
              style={{ transform: "translateZ(5px)" }}
            >
              คุณยังไม่ได้เข้าร่วมพื้นที่ทำงานใดๆ สร้าง Workspace แรกของคุณเพื่อเริ่มต้นจัดการโปรเจกต์และทำงานร่วมกับทีมได้เลย
            </p>

            {/* ปุ่มกดเด้งสู้มือ */}
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              style={{ transform: "translateZ(25px)" }}
            >
              <Button 
                onClick={() => setOpen(true)}
                size="lg"
                className="w-full bg-[#129a77] hover:bg-[#0a7055] text-white rounded-xl py-6 text-base font-semibold transition-all shadow-lg hover:shadow-xl border border-transparent hover:border-white/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Workspace
              </Button>
            </motion.div>
          </div>

          {/* 3D Shadow: เงาจำลองด้านหลังการ์ด ทำให้ดูเหมือนการ์ดลอยอยู่กลางอากาศจริงๆ */}
          <div 
            className="absolute -inset-4 bg-black/20 blur-2xl rounded-[3rem] -z-10"
            style={{ transform: "translateZ(-20px)" }}
          />
        </motion.div>

      </div>
    );
  }

  // Fallback Loading/Redirect state
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#129a77] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Loading your workspace...</p>
      </div>
      <div className="hidden"><UserButton /></div>
    </div>
  );
}