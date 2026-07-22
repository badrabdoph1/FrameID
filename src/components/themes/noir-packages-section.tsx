"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { PackageSelectButton } from "@/components/themes/template-booking-client";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { cn } from "@/lib/utils/cn";

interface NoirPackagesSectionProps {
  section: {
    title: string;
    description?: string | null;
    settings: Record<string, string | number>;
  };
  site: PublicSiteViewModel;
}

export function NoirPackagesSection({ section, site }: NoirPackagesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.84;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(index, site.packages.length - 1));

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {}, 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [site.packages.length]);

  const scrollToPackage = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.offsetWidth * 0.84;
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  return (
    <section id="packages" data-template-section="packages" className="scroll-mt-16 py-14 md:py-24 border-y border-white/6 bg-[#050505]">
      <div className="mx-auto max-w-[1180px]">
        {/* Header with staggered animation */}
        <div className="px-4 md:px-0">
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#e5c07b] animate-[fadeInUp_0.6s_ease-out]">
            {String(section.settings.eyebrow ?? "باقات التصوير")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            {section.title}
          </h2>
          {section.description ? (
            <p className="mt-3 text-sm font-bold leading-7 text-white/52 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              {section.description}
            </p>
          ) : null}
        </div>

        {/* Horizontal Scroll Container */}
        <div className="mt-8 relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide md:px-0"
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
            }}
          >
            {site.packages.map((item, index) => {
              const isActive = index === activeIndex;
              const imageUrl = item.imageUrl ?? site.gallery[index % Math.max(site.gallery.length, 1)]?.url;
              
              return (
                <article
                  key={item.id}
                  className={cn(
                    "relative flex-shrink-0 w-[84vw] md:w-auto md:flex-1",
                    "flex flex-col overflow-hidden rounded-[1.6rem] border border-white/9 bg-[#101010]",
                    "transition-all duration-500 ease-out",
                    "snap-center",
                    isActive 
                      ? "scale-100 opacity-100 shadow-2xl shadow-[#e5c07b]/10" 
                      : "scale-[0.95] opacity-70"
                  )}
                  style={{ scrollSnapAlign: "center" }}
                >
                  {/* Highlight Badge */}
                  {item.isHighlighted && (
                    <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 animate-[fadeInDown_0.4s_ease-out]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#e5c07b] px-3 py-1 text-xs font-black text-black shadow-lg">
                        <Star className="size-3 fill-current" aria-hidden />
                        الأكثر طلباً
                      </span>
                    </div>
                  )}

                  {/* Image with zoom effect */}
                  {imageUrl && (
                    <div className="relative -mx-4 -mt-4 mb-4 aspect-[16/10] overflow-hidden rounded-t-[1.6rem] group">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(min-width: 768px) 30vw, 84vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex items-start justify-between gap-3 px-4 pt-4">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-white">{item.name}</h3>
                      {item.subtitle && (
                        <p className="mt-1 text-xs font-bold text-white/48">{item.subtitle}</p>
                      )}
                    </div>
                    <span
                      className="shrink-0 rounded-xl bg-[#e5c07b]/12 px-3 py-2 text-xs font-black text-[#e5c07b] animate-[scaleIn_0.4s_ease-out]"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {item.price}
                    </span>
                  </div>

                  {/* Features List with stagger */}
                  <ul className="mt-4 flex-1 space-y-2 px-4 pb-4 text-xs leading-6 text-white/62">
                    {item.features.map((feature, idx) => (
                      <li
                        key={feature}
                        className="animate-[fadeInRight_0.3s_ease-out_both]"
                        style={{ animationDelay: `${index * 0.1 + idx * 0.05}s` }}
                      >
                        • {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="px-4 pb-4">
                    <PackageSelectButton id={item.id} variant="noir" />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Animated Dots Indicator */}
          {site.packages.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {site.packages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToPackage(index)}
                  className={cn(
                    "rounded-full transition-all duration-500 ease-out",
                    index === activeIndex
                      ? "h-2 w-8 bg-[#e5c07b] shadow-lg shadow-[#e5c07b]/50"
                      : "h-2 w-2 bg-white/30 hover:bg-white/60 hover:scale-125"
                  )}
                  aria-label={`انتقل إلى باقة ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
}
