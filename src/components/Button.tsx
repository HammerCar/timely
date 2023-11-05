import clsx from "clsx";
import React from "react";

const baseButtonStyles = "font-bold rounded flex gap-2 items-center";
const disabledButtonStyles = "bg-gray-500 text-gray-700 hover:bg-gray-500";
const loadingButtonStyles = "bg-blue-500 text-blue-700 cursor-wait";
const variantStyles = {
  primary: "bg-blue-500 hover:bg-blue-700 text-white",
};
const sizeStyles = {
  icon: "py-2 px-2.5",
  md: "py-2 px-4",
};

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  disabled?: boolean;
  loading?: boolean;
}

export default function Button(props: React.PropsWithChildren<ButtonProps>) {
  const { children, className, variant, size, disabled, loading, ...rest } =
    props;

  return (
    <button
      className={clsx(
        baseButtonStyles,
        variantStyles[variant ?? "primary"],
        sizeStyles[size ?? "md"],
        disabled && disabledButtonStyles,
        loading && loadingButtonStyles,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
