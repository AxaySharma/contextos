import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind conflict resolution.
 * Use this everywhere instead of template literals for class names.
 * Example: cn("px-4 py-2", isActive && "bg-gold-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
