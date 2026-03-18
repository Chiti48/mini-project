import { useEffect } from "react";
import { atom, useAtom } from "jotai";

// 1. สร้าง State (Atom) ไว้ด้านนอก Hook เพื่อให้แชร์ค่ากันได้ทั้งโปรเจกต์
const mobileSidebarOpenAtom = atom(false);
const isMobileAtom = atom(false);

export const useMobileSidebar = () => {
  // 2. เปลี่ยนจาก useState เป็น useAtom
  const [isOpen, setIsOpen] = useAtom(mobileSidebarOpenAtom);
  const [isMobile, setIsMobile] = useAtom(isMobileAtom);

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(newIsMobile);
      
      // Close sidebar when switching to desktop
      if (!newIsMobile) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile, setIsOpen]);

  // 3. ปรับฟังก์ชัน Toggle ให้ใช้ค่า prev เพื่อความแม่นยำ
  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return {
    isOpen,
    isMobile,
    toggle,
    close,
    open,
  };
};