"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import { 
  Users, MessageSquare, CheckSquare, Calendar, Paperclip, 
  Home, ChevronRight, Code, Database, Cloud, Shield, Cpu, 
  CheckCircle, ArrowLeft, KanbanSquare, Layers, Sparkles
} from "lucide-react";
import Link from "next/link";

// ============================================
// 1. 3D Card Flip - Workspace Management
// ============================================
function FeatureCardFlip() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="perspective-1000">
      <motion.div
        className="relative w-64 h-80 cursor-pointer group"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side - Brand Identity */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#337f37] to-emerald-600 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white p-6 border border-white/10 group-hover:shadow-2xl transition-shadow"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2 tracking-wide">Workspaces</h3>
          <p className="text-sm text-center text-emerald-50">ศูนย์กลางการทำงานของคุณ</p>
          <div className="mt-6 text-xs bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> แตะเพื่อดูด้านหลัง
          </div>
        </div>

        {/* Back Side - Collaboration */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white p-6 border border-slate-700"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-600">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold mb-2 tracking-wide">Team Sync</h3>
          <p className="text-sm text-center text-slate-400">เชิญทีมงานด้วย Invite Code ที่ปลอดภัย</p>
          <div className="mt-6 text-xs bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20">
            👥 รองรับการทำงานเป็นทีม
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// 2. 3D Tilt Component - Messaging System
// ============================================
function MessagingTiltCard() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

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

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative w-64 h-80 bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200 cursor-pointer group"
    >
      <div
        className="absolute inset-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex flex-col p-5 border border-slate-200/60 overflow-hidden"
        style={{ transform: "translateZ(30px)" }}
      >
        {/* Mock Chat UI */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-md bg-[#337f37]/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[#337f37]" />
          </div>
          <div className="font-semibold text-sm text-slate-800"># general</div>
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-emerald-500 shrink-0" />
            <div className="bg-white p-2 rounded-r-lg rounded-bl-lg shadow-sm border border-slate-100 text-[10px] text-slate-600 w-3/4">
              อัปเดตระบบ Real-time เสร็จแล้วครับ 🚀
            </div>
          </div>
          <div className="flex gap-2 items-start flex-row-reverse">
            <div className="w-6 h-6 rounded-full bg-slate-800 shrink-0" />
            <div className="bg-[#337f37] p-2 rounded-l-lg rounded-br-lg shadow-sm text-[10px] text-white w-2/3">
              เยี่ยมเลย! ลื่นไหลมาก ✨
            </div>
          </div>
        </div>

        <div className="mt-auto pt-3 flex gap-2 text-[10px] font-medium text-slate-500 justify-center">
          <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">Threads</span>
          <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">Reactions</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// 3. Parallax Depth - Task Management
// ============================================
function TaskParallaxDepth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePosition({ x, y });
  };

  // จำลองการ์ด Kanban ที่ลอยอยู่
  const layers = [
    { bg: "bg-white", size: "w-40 h-24", depth: 15, delay: 0, title: "Design UI", label: "bg-purple-500" },
    { bg: "bg-white", size: "w-36 h-20", depth: 30, delay: 0.1, title: "Setup Convex", label: "bg-[#337f37]" },
    { bg: "bg-white", size: "w-32 h-16", depth: 45, delay: 0.2, title: "Fix Bugs", label: "bg-rose-500" },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
      className="relative w-64 h-80 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden cursor-pointer flex items-center justify-center border border-slate-800"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black" />

      {layers.map((layer, index) => (
        <motion.div
          key={index}
          className={`absolute ${layer.size} ${layer.bg} rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.3)] p-3 border border-slate-200/50 flex flex-col gap-2`}
          style={{
            zIndex: layers.length - index,
            marginTop: `${index * 40}px`,
          }}
          animate={{
            x: mousePosition.x * layer.depth,
            y: mousePosition.y * layer.depth,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 15, delay: layer.delay }}
        >
          <div className={`w-8 h-1.5 rounded-full ${layer.label}`} />
          <span className="text-xs font-semibold text-slate-800">{layer.title}</span>
          <div className="mt-auto flex justify-between items-center">
            <Paperclip className="w-3 h-3 text-slate-400" />
            <div className="w-4 h-4 rounded-full bg-slate-200" />
          </div>
        </motion.div>
      ))}

      <div className="absolute bottom-5 text-center w-full z-10">
        <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/10">
          <KanbanSquare className="w-3.5 h-3.5" />
          <span>Drag & Drop Board</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 4. Perspective Transform - Technical Stack
// ============================================
function TechStackPerspective() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const techStack = [
    { icon: <Layers className="w-5 h-5" />, label: "Next.js 16" },
    { icon: <Database className="w-5 h-5" />, label: "Convex" },
    { icon: <Cloud className="w-5 h-5" />, label: "Live Sync" },
    { icon: <Shield className="w-5 h-5" />, label: "Auth" },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="perspective-1000">
        <motion.div
          className="w-56 h-56 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing border border-slate-700/50"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateX: rotation.x, rotateY: rotation.y }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDrag={(_, info) => {
            setRotation({ x: -info.offset.y / 3, y: info.offset.x / 3 });
          }}
          onDragEnd={() => setRotation({ x: 0, y: 0 })}
        >
          <div className="text-center flex flex-col items-center" style={{ transform: "translateZ(50px)" }}>
            <div className="w-16 h-16 bg-[#337f37]/20 rounded-xl flex items-center justify-center mb-3 border border-[#337f37]/30 shadow-[0_0_15px_rgba(51,127,55,0.3)]">
              <Cpu className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white tracking-wide">Tech Stack</h3>
            <p className="text-[10px] text-slate-400 mt-1">ลากเพื่อหมุน 3D</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
        {techStack.map((tech, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200 flex items-center gap-2"
          >
            <div className="text-[#337f37]">{tech.icon}</div>
            <span className="text-[11px] font-semibold text-slate-700">{tech.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Page - CT Workspace Documentation
// ============================================
export default function DocumentationPage() {
  const sections = [
    {
      title: "Workspace & Member Management",
      description: "เริ่มต้นง่ายๆ ด้วยการสร้าง Workspace ของทีมคุณ เชิญสมาชิกเข้าร่วมผ่าน Invite Code และจัดการสิทธิ์การเข้าถึงได้อย่างปลอดภัย",
      features: [
        "สร้างพื้นที่ทำงานแยกตามโปรเจกต์",
        "ระบบ Invite Code รัดกุม",
        "กำหนดสิทธิ์ Admin และ Member",
      ],
      component: <FeatureCardFlip />,
      icon: <Home className="w-5 h-5 text-[#337f37]" />,
      badge: "Foundation"
    },
    {
      title: "Real-time Communication",
      description: "คุยงานลื่นไหลไม่มีสะดุด แยกหมวดหมู่การสนทนาด้วย Channels หรือส่ง Direct Message คุยส่วนตัว พร้อมระบบแจ้งเตือนแบบทันที",
      features: [
        "แยกห้องสนทนาด้วย Channels",
        "ตอบกลับย่อยด้วยระบบ Threads",
        "แสดงอารมณ์ด้วย Emoji Reactions",
      ],
      component: <MessagingTiltCard />,
      icon: <MessageSquare className="w-5 h-5 text-[#337f37]" />,
      badge: "Core Feature"
    },
    {
      title: "Kanban Task Board",
      description: "จัดการโปรเจกต์ให้เป็นระบบด้วย Drag & Drop Board อัปเดตสถานะงานเรียลไทม์ พร้อมระบบจัดการไฟล์แนบและการตั้งเวลา",
      features: [
        "ลากวางการ์ดได้อย่างอิสระ",
        "จัดกลุ่มด้วยสี (Labels)",
        "แนบไฟล์เอกสารและรูปภาพ",
      ],
      component: <TaskParallaxDepth />,
      icon: <KanbanSquare className="w-5 h-5 text-[#337f37]" />,
      badge: "Productivity"
    },
    {
      title: "Modern Architecture",
      description: "เบื้องหลังความเร็วระดับเสี้ยววินาที คือสถาปัตยกรรมระบบที่ออกแบบมาอย่างพิถีพิถัน รองรับการขยายสเกลในอนาคต",
      features: [
        "Next.js 16 (App Router)",
        "Convex Backend (Real-time DB)",
        "Tailwind CSS + Framer Motion",
      ],
      component: <TechStackPerspective />,
      icon: <Cpu className="w-5 h-5 text-[#337f37]" />,
      badge: "Technology"
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-[#337f37]/20 selection:text-[#337f37]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#337f37] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">CT Workspace</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#337f37] transition-colors bg-slate-100 hover:bg-emerald-50 px-4 py-2 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
            เข้าสู่แอปพลิเคชัน
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/50 text-[#337f37] font-medium text-sm mb-6 border border-emerald-200/50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Documentation</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6"
          >
            ระบบบริหารจัดการงาน <br className="hidden md:block" />
            <span className="text-[#337f37]">แบบ Real-time แห่งอนาคต</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 leading-relaxed"
          >
            CT Workspace ไม่ใช่แค่แอปแชทหรือกระดานงาน แต่คือศูนย์รวมการทำงานของทีมที่ออกแบบมาให้ลื่นไหล รวดเร็ว และสวยงาม 
            เชิญสัมผัสประสบการณ์ใช้งานผ่าน Interactive Demo ด้านล่าง
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col h-full">
                {/* Visual Area (3D Components) */}
                <div className="p-8 bg-slate-50/50 flex items-center justify-center min-h-[380px] border-b border-slate-100 relative overflow-hidden">
                  {/* Decorative background blur */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-200/30 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative z-10">
                    {section.component}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 lg:p-10 flex-1 flex flex-col bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      {section.badge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{section.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-8 flex-1">
                    {section.description}
                  </p>
                  
                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {section.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <CheckCircle className="w-5 h-5 text-[#337f37] shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-slate-200 pt-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mb-6">
            <Layers className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">CT Workspace</h4>
          <p className="text-slate-500 text-sm">Real-time Collaboration Platform</p>
          <p className="text-slate-400 text-xs mt-6 font-medium tracking-wide uppercase">
            Built with Next.js & Convex
          </p>
        </footer>
      </section>
    </div>
  );
}