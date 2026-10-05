import React, { forwardRef } from "react";
import { TextField, type TextFieldProps, InputAdornment } from "@mui/material";

export type CustomTextFieldProps = Omit<TextFieldProps, "variant"> & {
  variant?: "outlined" | "standard" | "filled";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  readOnly?: boolean;
  errorText?: React.ReactNode;
  InputProps?: Partial<import("@mui/material").OutlinedInputProps>;
};

const CustomTextField = forwardRef<HTMLDivElement, CustomTextFieldProps>(
  (
    {
      variant = "outlined",
      size = "small",
      fullWidth = true,
      startIcon,
      endIcon,
      readOnly,
      InputProps,
      sx,
      error,
      helperText,
      errorText,
      ...props
    },
    ref,
  ) => {
    const { label, required, ...restProps } = props;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="mt-1 mb-1 block text-[13px] leading-[21px] font-semibold tracking-[0] text-[#2D3E4F] md:text-left">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <TextField
          ref={ref}
          onWheel={(e) => {
            if (props.type === "number") {
              (e.target as HTMLInputElement).blur();
            }
            props.onWheel?.(e);
          }}
          onKeyDown={(e) => {
            if (
              props.type === "number" &&
              (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+")
            ) {
              e.preventDefault();
            } else if (props.type === "time") {
              e.preventDefault();
            }
            props.onKeyDown?.(e);
          }}
          {...({
            variant,
            size,
            fullWidth,
            error,
            required,
            slotProps: {
              input: {
                ...InputProps,
                readOnly: readOnly || InputProps?.readOnly,
                startAdornment: startIcon ? (
                  <InputAdornment position="start">{startIcon}</InputAdornment>
                ) : (
                  InputProps?.startAdornment
                ),
                endAdornment: endIcon ? (
                  <InputAdornment position="end">{endIcon}</InputAdornment>
                ) : (
                  InputProps?.endAdornment
                ),
              },
            },
            sx: {
              "& .MuiOutlinedInput-root": {
                minHeight: props.multiline ? "auto" : "34px !important",
                height: props.multiline ? "auto" : "34px !important",
                borderRadius: "4px",
                backgroundColor: "white",
                "& input": {
                  fontSize: "13px",
                  padding: `0 ${endIcon || InputProps?.endAdornment ? 0 : "12px"} 0 ${startIcon || InputProps?.startAdornment ? 0 : "12px"}`,
                  color: "black",
                  height: "100%",
                  "&::placeholder": {
                    color: "var(--color-secondary-text)",
                    opacity: 1,
                  },
                  "&[type=number]::-webkit-outer-spin-button, &[type=number]::-webkit-inner-spin-button":
                    {
                      WebkitAppearance: "none",
                      margin: 0,
                    },
                  "&[type=number]": {
                    MozAppearance: "textfield",
                  },
                },
                "& textarea": {
                  fontSize: "13px",
                  color: "black",
                  padding: "0px",
                  "&::placeholder": {
                    color: "var(--color-secondary-text)",
                    opacity: 1,
                  },
                },
                "& fieldset": {
                  borderColor: error ? "#EF4444" : "#CBD6E2",
                },
                "&:hover fieldset": {
                  borderColor: error ? "#EF4444" : "#CBD6E2",
                },
                "&.Mui-focused fieldset": {
                  border: error ? "1px solid #ef4444" : "2px solid #60A5FA",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#f9fafb",
                  "& fieldset": {
                    borderColor: error ? "#EF4444 !important" : "#CBD6E2 !important",
                  },
                  "& input, & textarea": {
                    WebkitTextFillColor: "#9ca3af",
                  },
                },
                ...((readOnly || InputProps?.readOnly) && {
                  backgroundColor: "#f9fafb",
                  "&.Mui-focused fieldset": {
                    border: "1px solid #CBD6E2",
                  },
                }),
              },
              ...sx,
            },
          } as Partial<TextFieldProps>)}
          {...restProps}
        />
        {(errorText || helperText) && (
          <span
            className={`mt-1 block text-[12px] ${error || errorText ? "text-red-400" : "text-gray-500"}`}
          >
            {errorText || helperText}
          </span>
        )}
      </div>
    );
  },
);

CustomTextField.displayName = "CustomTextField";

export default CustomTextField;
