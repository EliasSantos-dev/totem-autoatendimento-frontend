import React, { ButtonHTMLAttributes } from "react";

interface PopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "warning" | "neutral";
  fullWidth?: boolean;
}

export function PopButton({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: PopButtonProps) {
  const baseClasses = `
    flex items-center justify-center gap-2
    px-8 py-5 rounded-2xl
    border-[4px] border-popBlack
    text-[1.5rem] uppercase font-black font-nunito tracking-wider
    shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1
    active:shadow-none active:translate-y-[6px] active:translate-x-[6px]
    transition-all duration-150 ease-out select-none
  `;

  const variants = {
    primary: "bg-popRed text-popYellow",
    secondary: "bg-popYellow text-popRed",
    warning: "bg-orange-500 text-white",
    neutral: "bg-popWhite text-popBlack",
  };

  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
