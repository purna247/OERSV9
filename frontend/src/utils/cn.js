import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes conditionally and safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
