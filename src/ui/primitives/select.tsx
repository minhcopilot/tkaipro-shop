"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/ui/primitives/popover";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <Popover open={open && !disabled} onOpenChange={setOpen} modal={false}>
        {children}
      </Popover>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { setOpen } = React.useContext(SelectContext);

    return (
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between",
            className
          )}
          onClick={() => setOpen(true)}
          {...props}
        >
          {children}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder, className, children }: SelectValueProps) {
  const { value } = React.useContext(SelectContext);
  
  return (
    <span className={cn("truncate", className)}>
      {children || value || placeholder}
    </span>
  );
}

export function SelectContent({ children, className }: SelectContentProps) {
  return (
    <PopoverContent 
      className={cn("w-[--radix-popover-trigger-width] p-1", className)} 
      align="start"
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <div 
        className="space-y-1 max-h-[300px] overflow-y-auto"
      >
        {children}
      </div>
    </PopoverContent>
  );
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handleSelect = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🟢 SelectItem handleSelect - value:", value);
    console.log("🟢 SelectItem - onValueChange exists?", !!onValueChange);
    console.log("🟢 SelectItem - calling onValueChange with:", value);
    
    // gọi onValueChange trước
    if (onValueChange) {
      onValueChange(value);
    }
    
    // delay một chút trước khi đóng để đảm bảo state được update
    console.log("🟢 SelectItem - scheduling close");
    setTimeout(() => {
      console.log("🟢 SelectItem - closing dropdown now");
      setOpen(false);
    }, 50);
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onMouseDown={(e) => {
        console.log("🟡 SelectItem button - onMouseDown");
        handleSelect(e);
      }}
      onClick={(e) => {
        console.log("🟡 SelectItem button - onClick");
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleSelect(e);
        }
      }}
      role="option"
      aria-selected={isSelected}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
      {children}
    </button>
  );
} 