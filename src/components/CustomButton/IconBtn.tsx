import React from "react";
import { Tooltip, TooltipProps } from "@mui/material";

export interface IconBtnProps {
  icon: React.ElementType;
  danger?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  title?: React.ReactNode;
  className?: string;
  size?: number;
  placement?: TooltipProps["placement"];
  showTooltip?: boolean;
  arrow?: boolean;
  hide?: boolean;
}

export const IconBtn: React.FC<IconBtnProps> = ({
  icon: Icon,
  danger = false,
  onClick,
  disabled = false,
  title,
  className = "",
  size = 18,
  placement = "top",
  showTooltip = true,
  arrow = true,
  hide = false,
}) => {
  if (hide) return null;

  const btn = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border-primary-border flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border bg-white p-0 transition-colors ${
        danger
          ? "text-red-600 hover:border-red-200 hover:bg-red-50"
          : "text-secondary-text hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
      } ${disabled ? "cursor-default opacity-50" : "cursor-pointer"} ${className}`}
    >
      <Icon size={size} />
    </button>
  );

  if (!title || !showTooltip) return btn;

  return (
    <Tooltip title={title} arrow={arrow} placement={placement}>
      <span>{btn}</span>
    </Tooltip>
  );
};

export default IconBtn;
