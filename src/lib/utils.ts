import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy") {
  return format(new Date(date), pattern);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/** Format kobo/cents (minor units) to display currency */
export function formatMoney(minorUnits: number, currency = "NGN") {
  const amount = minorUnits / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;
}

export function formatDistance(km: number) {
  return km >= 1 ? `${km.toFixed(1)}km` : `${(km * 1000).toFixed(0)}m`;
}

export function truncate(str: string, length = 50) {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
