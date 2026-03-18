import { Menu, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface MobileSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const MobileSidebarToggle = ({ isOpen, onToggle, className }: MobileSidebarToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      className={cn(
        "lg:hidden",
        "h-9 w-9 p-0",
        "hover:bg-white/10 active:bg-white/20",
        "transition-colors duration-200",
        className
      )}
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        <Menu 
          className={cn(
            "absolute transition-all duration-300 ease-in-out",
            isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} 
        />
        <X 
          className={cn(
            "absolute transition-all duration-300 ease-in-out",
            isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )} 
        />
      </div>
    </Button>
  );
};