/* eslint-disable @next/next/no-img-element */
"use client";

import { UserButton } from "@/features/auth/components/user-button";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/use-create-workspace-modal";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderPlus, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [, setOpen] = useCreateWorkspaceModal();
  const { data, isLoading } = useGetWorkspaces();
  const workspaceId = useMemo(() => data?.[0]?._id, [data]);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // EXTREME 3D Tilt Logic
  // ==========================================
  // 🟢 กฎของ React: Hook ทุกตัวต้องอยู่ด้านบนสุด ห้ามอยู่ใน if-else
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });
  
  // องศาการเอียงของการ์ดหลัก (20 องศา)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["20deg", "-20deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-20deg", "20deg"]);

  // แสงเงาสะท้อน (Glossy effect)
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  // องศาการเอียงของ Logo (6 องศา ให้ขยับน้อยกว่าการ์ดหลัก)
  const logoRotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const logoRotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

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
    x.set(0); 
    y.set(0);
  };

  useEffect(() => {
    if (isLoading || !isHydrated) return;

    if (workspaceId) {
      router.replace(`/workspace/${workspaceId}`);
    }
  }, [workspaceId, isLoading, router, isHydrated]);

  // Empty state when no workspaces
  if (!isLoading && !workspaceId && isHydrated) {
    return (
      <div 
        className="relative min-h-screen flex flex-col items-center justify-center bg-[#0a1a14] p-4 overflow-hidden perspective-[1500px]"
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Deep Space Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,154,119,0.2)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

        {/* Floating Logo Header */}
        <motion.div 
          style={{ 
            rotateX: logoRotateX, // 🟢 เรียกใช้ตัวแปรที่ดึงขึ้นไปด้านบนแล้ว
            rotateY: logoRotateY, // 🟢 เรียกใช้ตัวแปรที่ดึงขึ้นไปด้านบนแล้ว
            transformStyle: "preserve-3d" 
          }}
          className="flex flex-col items-center mb-16 z-10"
        >
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(18,154,119,0.4)] border border-emerald-500/30"
            style={{ transform: "translateZ(80px)" }} 
          >
            <img src="/Logo-Ct25.png" alt="Logo" className="w-14 h-14 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          </motion.div>
          
          <h1 
            className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-200 tracking-tight"
            style={{ transform: "translateZ(40px)" }}
          >
            CT Workspace
          </h1>
        </motion.div>

        {/* ======================= MAIN 3D CARD ======================= */}
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative w-full max-w-md z-10 group"
        >
          {/* Card Body */}
          <div 
            className="relative bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 text-center border border-white/20 overflow-hidden"
            style={{ 
              transform: "translateZ(50px)", 
              boxShadow: "0 30px 60px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
          >
            {/* Glossy Reflection */}
            <motion.div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: "radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 60%)",
                left: `calc(${glareX} - 50%)`,
                top: `calc(${glareY} - 50%)`,
                width: "200%",
                height: "200%",
                transform: "translateZ(1px)" 
              }}
            />

            {/* Icon ลอยเด่น */}
            <div 
              className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-[#129a77] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_20px_40px_rgba(18,154,119,0.4)] border border-white/20 relative"
              style={{ transform: "translateZ(60px)" }}
            >
              <FolderPlus className="w-12 h-12 text-white drop-shadow-md" />
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-[#129a77]" style={{ transform: "translateZ(30px)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h2 
              className="text-2xl font-bold text-white mb-4 tracking-tight" 
              style={{ transform: "translateZ(40px)" }} 
            >
              Start Your Journey
            </h2>
            
            <p 
              className="text-emerald-100/70 mb-10 text-sm leading-relaxed" 
              style={{ transform: "translateZ(20px)" }} 
            >
              คุณยังไม่มีพื้นที่ทำงานส่วนตัว สร้าง Workspace ใหม่เพื่อเชื่อมต่อกับทีมและเริ่มสร้างสรรค์โปรเจกต์ได้เลย
            </p>

            {/* ปุ่มกด */}
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              style={{ transform: "translateZ(80px)" }}
            >
              <Button 
                onClick={() => setOpen(true)}
                size="lg"
                className="w-full relative overflow-hidden bg-white text-[#129a77] hover:bg-emerald-50 rounded-2xl py-7 text-lg font-bold transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Plus className="w-6 h-6 mr-2 stroke-[3]" />
                  Create Workspace
                </span>
              </Button>
            </motion.div>
          </div>

          {/* Deep Shadow ด้านหลังสุด */}
          <div 
            className="absolute -inset-10 bg-slate-black/40 blur-3xl rounded-[4rem] -z-10"
            style={{ transform: "translateZ(-50px)" }}
          />
        </motion.div>

        {/* Floating Particles */}
        <motion.div 
          className="absolute left-[15%] top-[30%] text-emerald-500/20 pointer-events-none"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d", transform: "translateZ(-100px)" }}
        >
          <Layers className="w-32 h-32" />
        </motion.div>
        
      </div>
    );
  }

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