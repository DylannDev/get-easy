import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  variant?: "default" | "green";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({
  variant = "default",
  size = "lg",
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "size-6 border-2",
    md: "size-8 border-3",
    lg: "size-12 border-4",
  };

  const colorClasses = {
    default: "border-gray-300 border-t-black",
    green: "border-black border-t-green border-l-green border-r-green",
  };

  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[variant]} rounded-full animate-spin`}
      />
    </div>
  );
};
