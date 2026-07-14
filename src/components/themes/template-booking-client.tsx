"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Check, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { ThemeBookingFAB } from "@/components/themes/theme-booking-fab";
import { createTemplateBookingHref } from "@/modules/themes/template-contract";

type BookingPackage = {
  id: string;
  name: string;
  price: string;
  priceAmount: number;
  currency: string;
};
type BookingExtra = { id: string; name: string; price: string; priceAmount: number };
type BookingContextValue = {
  packages: BookingPackage[];
  extras: BookingExtra[];
  selectedPackageId: string | null;
  selectedExtraIds: string[];
  selectPackage: (id: string) => void;
  toggleExtra: (id: string) => void;
  bookingHref: string;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function TemplateBookingProvider({
  children,
  packages,
  extras,
  siteName,
  whatsapp,
  email,
}: {
  children: ReactNode;
  packages: BookingPackage[];
  extras: BookingExtra[];
  siteName: string;
  whatsapp: string | null;
  email: string | null;
}) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const selectedPackage = packages.find((item) => item.id === selectedPackageId);
  const selectedExtras = extras.filter((item) => selectedExtraIds.includes(item.id));
  const bookingHref = createTemplateBookingHref({ siteName, whatsapp, email, selectedPackage, selectedExtras });

  return (
    <BookingContext.Provider value={{
      packages,
      extras,
      selectedPackageId,
      selectedExtraIds,
      selectPackage: setSelectedPackageId,
      toggleExtra: (id) => setSelectedExtraIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
      bookingHref,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function PackageSelectButton({ id, variant }: { id: string; variant: "noir" | "rose" }) {
  const booking = useBooking();
  const selected = booking.selectedPackageId === id;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => booking.selectPackage(id)}
      className={cn(
        "mt-5 min-h-12 w-full rounded-2xl border px-4 text-sm font-black outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "noir"
          ? selected ? "border-[#e5c07b] bg-[#e5c07b] text-black ring-offset-[#111]" : "border-white/14 bg-white/[0.05] text-white hover:border-[#e5c07b] ring-[#e5c07b] ring-offset-[#111]"
          : selected ? "border-[#d48a9e] bg-[#d48a9e] text-white ring-offset-white" : "border-[#eaddd4] bg-white text-[#2c1810] hover:border-[#d48a9e] ring-[#d48a9e] ring-offset-white",
      )}
    >
      {selected ? "تم اختيار الباقة" : "اختر الباقة"}
    </button>
  );
}

export function ExtraToggleButton({ id, variant }: { id: string; variant: "noir" | "rose" }) {
  const booking = useBooking();
  const selected = booking.selectedExtraIds.includes(id);
  return (
    <button
      type="button"
      aria-label={selected ? "إزالة الإضافة" : "اختيار الإضافة"}
      aria-pressed={selected}
      onClick={() => booking.toggleExtra(id)}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2",
        variant === "noir"
          ? selected ? "border-[#e5c07b] bg-[#e5c07b] text-black" : "border-white/15 bg-white/[0.05] text-[#e5c07b]"
          : selected ? "border-[#8fb89a] bg-[#8fb89a] text-white" : "border-[#eaddd4] bg-white text-[#d48a9e]",
      )}
    >
      <Check className={cn("size-4", !selected && "opacity-35")} aria-hidden />
    </button>
  );
}

export function BookingAction({
  label,
  variant,
  sticky = false,
}: {
  label: string;
  variant: "noir" | "rose";
  sticky?: boolean;
}) {
  const booking = useBooking();
  const selected = Boolean(booking.selectedPackageId);
  return (
    <a
      href={booking.bookingHref}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2",
        sticky ? "w-full shadow-[0_15px_50px_rgba(0,0,0,.25)]" : "w-full",
        variant === "noir" ? "bg-[#e5c07b] text-black ring-[#e5c07b] ring-offset-black" : "bg-[#d48a9e] text-white ring-[#d48a9e] ring-offset-[#fff8f4]",
      )}
    >
      <MessageCircle className="size-4" aria-hidden />
      {selected ? label : "اختر باقة للحجز"}
    </a>
  );
}

export function BookingFAB({ variant }: { variant: "noir" | "rose" }) {
  const booking = useBooking();
  const hasSelection = Boolean(booking.selectedPackageId) || booking.selectedExtraIds.length > 0;

  function scrollToContact() {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ThemeBookingFAB
      visible={hasSelection}
      onConfirm={scrollToContact}
      variant={variant}
    />
  );
}

export function useBooking() {
  const value = useContext(BookingContext);
  if (!value) throw new Error("Booking controls must be rendered inside TemplateBookingProvider");
  return value;
}
