import {
  Button,
  type ButtonOwnProps,
  type SxProps,
  type Theme,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

export interface CustomButtonProps {
  label?: string;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
  variant?: ButtonOwnProps["variant"];
  color?: ButtonOwnProps["color"];
  size?: ButtonOwnProps["size"];
  loading?: boolean;
  disabled?: boolean;
  hide?: boolean;
  tooltipValue?: string;
  toolTipEnabled?: boolean;
  startIcon?: React.ElementType;
  endIcon?: React.ElementType;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  isDelete?: boolean;
  dotLoader?: boolean;
}

interface StyledButtonProps {
  isDelete?: boolean;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isDelete",
})<StyledButtonProps>(({ variant, isDelete }) => {
  const isContained = variant === "contained";
  return {
    height: "34px !important",
    maxHeight: "34px !important",
    textTransform: "none",
    fontSize: "13px",
    fontWeight: 500,
    borderRadius: "4px",
    boxShadow: "none !important",
    textWrap: "nowrap !important",

    "&.Mui-disabled": {
      opacity: 0.7,
      color: isContained
        ? "#FFFFFF !important"
        : isDelete
          ? "#DC2626 !important"
          : "var(--color-primary-text, #0f172a) !important",
      background: isContained
        ? isDelete
          ? "#DC2626 !important"
          : "var(--project-primary-color, #2563eb) !important"
        : "#FFFFFF !important",
      border: isContained
        ? "none"
        : isDelete
          ? "1px solid #DC2626 !important"
          : "1px solid var(--color-primary-border) !important",
    },

    ...(isContained
      ? {
          background: isDelete ? "#DC2626" : "var(--project-primary-color, #2563eb)",
          color: "#FFFFFF",
          "&:hover": {
            background: isDelete ? "#B91C1C" : "var(--project-primary-color, #2563eb)",
          },
        }
      : {
          color: isDelete ? "#DC2626" : "var(--color-primary-text, #0f172a)",
          border: isDelete ? "1px solid #DC2626" : "1px solid var(--color-primary-border)",
          background: "#FFFFFF",
          "&:hover": {
            background: isDelete ? "#FEF2F2" : "#F8FAFC",
            border: isDelete ? "1px solid #DC2626" : "1px solid var(--color-primary-border)",
          },
        }),
  };
});

const CustomButton: React.FC<CustomButtonProps> = ({
  label,
  children,
  hide,
  loading,
  disabled,
  tooltipValue,
  toolTipEnabled,
  variant,
  size,
  startIcon: StartIcon,
  endIcon: EndIcon,
  isDelete,
  dotLoader,
  ...rest
}) => {
  if (hide) return null;
  return (
    <Tooltip title={toolTipEnabled && tooltipValue ? tooltipValue : ""} arrow placement="top">
      <span>
        <StyledButton
          disabled={disabled || loading}
          variant={variant}
          size={size}
          isDelete={isDelete}
          startIcon={!loading && StartIcon ? <StartIcon size={16} /> : undefined}
          endIcon={!loading && EndIcon ? <EndIcon size={16} /> : undefined}
          {...rest}
        >
          <span style={{ visibility: loading ? "hidden" : "visible", display: "inherit" }}>
            {children || label}
          </span>
          {loading && (
            <>
              {dotLoader ? (
                <div className="dot-loader-container">
                  <div className="loader"></div>
                </div>
              ) : (
                <CircularProgress
                  size={20}
                  thickness={4}
                  color="inherit"
                  sx={{ position: "absolute", top: "50%", left: "50%", mt: "-10px", ml: "-10px" }}
                />
              )}
            </>
          )}
        </StyledButton>
      </span>
    </Tooltip>
  );
};

export default CustomButton;
