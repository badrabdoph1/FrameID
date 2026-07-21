"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Check, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { ThemeBookingFAB } from "@/components/themes/theme-booking-fab";
import { createTemplateBookingHref, formatTemplatePrice } from "@/modules/themes/template-contract";

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

export function PackageSelectButton({ id, variant }: { id: string; variant: "noir" | "rose" | "luxe" | "prestige" }) {
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
          : variant === "luxe"
            ? selected ? "border-[#ff00ff] bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-white ring-offset-[#0a0a0f]" : "border-[#ff00ff]/30 bg-white/[0.05] text-white hover:border-[#ff00ff] ring-[#ff00ff] ring-offset-[#0a0a0f]"
            : variant === "prestige"
              ? selected ? "border-[#d4a574] bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] text-black ring-offset-[#0a0a0a]" : "border-[#d4a574]/30 bg-white/[0.05] text-white hover:border-[#d4a574] ring-[#d4a574] ring-offset-[#0a0a0a]"
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
  variant: "noir" | "rose" | "luxe" | "prestige";
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
        variant === "noir" ? "bg-[#e5c07b] text-black ring-[#e5c07b] ring-offset-black" : variant === "luxe" ? "bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-white shadow-[0_0_30px_rgba(255,0,255,0.3)] ring-[#ff00ff] ring-offset-[#0a0a0f]" : variant === "prestige" ? "bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] text-black shadow-[0_0_30px_rgba(212,165,116,0.3)] ring-[#d4a574] ring-offset-[#0a0a0a]" : "bg-[#d48a9e] text-white ring-[#d48a9e] ring-offset-[#fff8f4]",
      )}
    >
      <MessageCircle className="size-4" aria-hidden />
      {selected ? label : "اختر باقة للحجز"}
    </a>
  );
}

export function BookingSummaryCard({ variant }: { variant: "noir" | "rose" | "luxe" | "prestige" }) {
  const booking = useBooking();
  const selectedPackage = booking.packages.find((item) => item.id === booking.selectedPackageId);
  const selectedExtras = booking.extras.filter((item) => booking.selectedExtraIds.includes(item.id));
  const total = selectedPackage
    ? selectedPackage.priceAmount + selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0)
    : 0;

  return (
    <div className={cn(
      "rounded-[1.35rem] border p-4 text-start",
      variant === "noir"
        ? "border-white/9 bg-white/[.045]"
        : variant === "luxe"
          ? "border-white/10 bg-white/[.055]"
          : variant === "prestige"
            ? "border-white/10 bg-white/[.055]"
            : "border-[#eaddd4] bg-white",
    )}>
      <p className={cn(
        "text-xs font-black",
        variant === "noir" ? "text-[#e5c07b]" : variant === "luxe" ? "text-[#ff00ff]" : variant === "prestige" ? "text-[#d4a574]" : "text-[#d48a9e]",
      )}>ملخص الحجز</p>
      <h3 className={cn(
        "mt-2 text-xl font-black",
        variant === "rose" ? "text-[#2c1810]" : "text-white",
      )}>تفاصيل الحجز</h3>

      {selectedPackage ? (
        <div className={cn(
          "mt-4 space-y-3 rounded-[1.1rem] p-4",
          variant === "noir" ? "bg-black/26" : variant === "luxe" ? "bg-black/20" : variant === "prestige" ? "bg-black/20" : "bg-[#fff8f4]",
        )}>
          <div className={cn(
            "flex items-start justify-between gap-4 border-b pb-3",
            variant === "rose" ? "border-[#eaddd4]" : "border-white/10",
          )}>
            <span className={cn("text-sm font-bold", variant === "rose" ? "text-[#8c7a74]" : "text-white/55")}>الباقة</span>
            <div className="text-left">
              <strong className={cn("block", variant === "rose" ? "text-[#2c1810]" : "text-white")}>{selectedPackage.name}</strong>
              <span className={cn("text-xs font-black", variant === "noir" ? "text-[#e5c07b]" : variant === "luxe" ? "text-[#00ffff]" : variant === "prestige" ? "text-[#d4a574]" : "text-[#d48a9e]")}>{selectedPackage.price}</span>
            </div>
          </div>
          {selectedExtras.length ? (
            <div className={cn(
              "space-y-2 border-b pb-3",
              variant === "rose" ? "border-[#eaddd4]" : "border-white/10",
            )}>
              {selectedExtras.map((extra) => (
                <div key={extra.id} className="flex justify-between gap-4 text-sm">
                  <span className={variant === "rose" ? "text-[#8c7a74]" : "text-white/58"}>{extra.name}</span>
                  <span className={cn("font-bold", variant === "noir" ? "text-[#e5c07b]" : variant === "luxe" ? "text-[#00ffff]" : variant === "prestige" ? "text-[#d4a574]" : "text-[#d48a9e]")}>{extra.price}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <span className={cn("font-black", variant === "rose" ? "text-[#2c1810]" : "text-white")}>الإجمالي التقريبي</span>
            <span className={cn("text-lg font-black", variant === "noir" ? "text-[#e5c07b]" : variant === "luxe" ? "text-[#00ffff]" : variant === "prestige" ? "text-[#d4a574]" : "text-[#d48a9e]")}>{formatTemplatePrice(total, selectedPackage.currency)}</span>
          </div>
        </div>
      ) : (
        <div className={cn(
          "mt-4 rounded-[1.1rem] border border-dashed p-5 text-center text-sm font-bold leading-7",
          variant === "rose"
            ? "border-[#eaddd4] bg-[#fff8f4] text-[#8c7a74]"
            : "border-white/14 bg-black/18 text-white/50",
        )}>
          اختر باقة من قسم الأسعار ليظهر ملخص الحجز هنا.
        </div>
      )}
    </div>
  );
}

export function BookingFAB({ variant }: { variant: "noir" | "rose" | "luxe" | "prestige" }) {
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
