"use client";

import {
  useCallback,
  useId,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Camera,
  Facebook,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Video,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  snapchat?: string;
  youtube?: string;
  behance?: string;
  fiveHundredPx?: string;
  linkedin?: string;
  telegram?: string;
  xTwitter?: string;
  threads?: string;
  website?: string;
  whatsapp?: string;
};

type SocialLinksEditorProps = {
  links: SocialLinks;
  onChange: (links: SocialLinks) => void;
  disabled?: boolean;
};

type PlatformDef = {
  key: keyof SocialLinks;
  label: string;
  icon: ReactNode;
  placeholder: string;
  group: "social" | "professional" | "messaging";
};

const PLATFORMS: PlatformDef[] = [
  {
    key: "instagram",
    label: "إنستغرام",
    icon: <Instagram className="size-4" />,
    placeholder: "https://instagram.com/...",
    group: "social",
  },
  {
    key: "facebook",
    label: "فيسبوك",
    icon: <Facebook className="size-4" />,
    placeholder: "https://facebook.com/...",
    group: "social",
  },
  {
    key: "xTwitter",
    label: "X (تويتر)",
    icon: <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    placeholder: "https://x.com/...",
    group: "social",
  },
  {
    key: "tiktok",
    label: "تيك توك",
    icon: <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
    placeholder: "https://tiktok.com/@...",
    group: "social",
  },
  {
    key: "snapchat",
    label: "سناب شات",
    icon: <Camera className="size-4" />,
    placeholder: "https://snapchat.com/add/...",
    group: "social",
  },
  {
    key: "threads",
    label: "ثريدز",
    icon: <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16.103 11.064c-.232-.914-.772-1.662-1.633-2.232-.774-.514-1.767-.78-2.946-.792-.259-.002-.521.005-.78.014 0 0 .002-.005 0 0 .283-.03.564-.05.842-.061 1.075-.041 2.028.133 2.858.523 1.37.643 2.167 1.767 2.39 3.29.034.231.047.474.048.72.003 1.284-.126 2.427-.383 3.426-.448 1.745-1.355 2.915-2.825 3.494-.728.287-1.506.432-2.341.432-1.277 0-2.326-.412-3.147-1.238-.858-.862-1.3-2.065-1.326-3.607-.023-1.374.338-2.484 1.076-3.3.445-.492.969-.856 1.572-1.092.009-.004.018-.006.027-.01.596-.25 1.213-.388 1.838-.417.559-.026 1.076.072 1.536.293.328.158.596.366.8.609.184.219.322.475.411.758.16.51.082 1.028-.233 1.46-.213.291-.528.512-.914.619-.312.087-.631.078-.928-.032-.143-.053-.264-.14-.363-.242-.097-.1-.162-.216-.202-.334-.068-.201-.033-.395.095-.557.015-.019.031-.037.048-.054.155-.158.373-.254.617-.262.131-.004.26.001.387.019.144.02.274.059.391.117.154.077.272.187.353.32.103.17.13.355.086.521-.018.067-.048.125-.093.172-.148.155-.468.207-.728.107-.108-.041-.213-.109-.277-.196-.09-.123-.064-.24.004-.317.007-.008.014-.015.022-.022.02-.017.04-.027.04-.027.017-.01.035-.016.054-.021.007 0 .013-.003.02-.005.007 0 .015-.001.023-.001.002 0 .005 0 .007.001v-.001c-.006.001-.012.003-.017.005l.006-.002s-.003.001-.004.001c-.001.001-.003.001-.004.002l.014-.004s.003.001.005.001c-.090.003-.178.02-.262.05-.049.017-.095.04-.138.067.008-.004.017-.008.025-.011l-.035.017c-.031.016-.06.035-.087.056-.025.02-.048.041-.069.064.019-.021.04-.04.063-.058l-.026.023c-.05.046-.092.099-.127.158-.045.077-.073.163-.084.255-.004.032-.005.064-.004.096l.003-.049c-.001.032.001.064.005.095.079.648.403 1.177.94 1.545.338.231.732.371 1.155.398.43.028.872-.039 1.288-.196.013-.005.026-.01.039-.016.211-.087.397-.203.563-.345.017-.014.033-.028.049-.043l.008-.008c.324-.29.557-.645.708-1.05.15-.402.214-.836.195-1.277-.002-.055-.006-.11-.011-.165v.008c-.011-.136-.03-.27-.058-.402l.006.033c-.157-.757-.56-1.373-1.2-1.852-.667-.5-1.481-.78-2.434-.837a14.07 14.07 0 0 0-.838-.032v.001c-.838.014-1.633.166-2.359.454l.037-.015c-.625.258-1.17.619-1.625 1.066l.003-.003c-.884.901-1.384 2.155-1.403 3.624-.019 1.497.463 2.778 1.397 3.734.998 1.022 2.35 1.544 3.978 1.544 1.281 0 2.415-.287 3.429-.867 1.31-.751 2.215-1.941 2.742-3.533.309-.933.471-1.999.491-3.164.001-.034.001-.068 0-.102-.003-.34-.026-.676-.069-1.007zM9.72 9.878c.523-.041 1.037.046 1.496.263.392.185.713.453.949.783.175.245.295.52.355.808.022.103.036.208.042.314-.443-.253-.98-.395-1.562-.403h-.007c-.548-.007-1.065.096-1.534.293l.031-.013c-.379.158-.703.38-.97.654l-.006.007c.012-.086.028-.171.048-.254.078-.336.262-.614.536-.814.274-.2.618-.323 1.004-.37.087-.01.174-.016.262-.018.038-.001.076-.001.114 0z"/></svg>,
    placeholder: "https://threads.net/@...",
    group: "social",
  },
  {
    key: "youtube",
    label: "يوتيوب",
    icon: <Video className="size-4" />,
    placeholder: "https://youtube.com/@...",
    group: "professional",
  },
  {
    key: "behance",
    label: "بيهانس",
    icon: <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/></svg>,
    placeholder: "https://behance.net/...",
    group: "professional",
  },
  {
    key: "fiveHundredPx",
    label: "500px",
    icon: <Camera className="size-4" />,
    placeholder: "https://500px.com/...",
    group: "professional",
  },
  {
    key: "linkedin",
    label: "لينكد إن",
    icon: <Linkedin className="size-4" />,
    placeholder: "https://linkedin.com/in/...",
    group: "professional",
  },
  {
    key: "website",
    label: "موقع إلكتروني",
    icon: <Globe className="size-4" />,
    placeholder: "https://...",
    group: "professional",
  },
  {
    key: "whatsapp",
    label: "واتساب",
    icon: <MessageCircle className="size-4" />,
    placeholder: "https://wa.me/...",
    group: "messaging",
  },
  {
    key: "telegram",
    label: "تيليغرام",
    icon: <Send className="size-4" />,
    placeholder: "https://t.me/...",
    group: "messaging",
  },
];

const PLATFORM_GROUPS = [
  { key: "social" as const, label: "وسائل التواصل" },
  { key: "professional" as const, label: "مهني" },
  { key: "messaging" as const, label: "مراسلة" },
];

function detectPlatform(url: string): keyof SocialLinks | null {
  const u = url.toLowerCase().trim();
  if (u.includes("instagram") || u.includes("instagr")) return "instagram";
  if (u.includes("facebook") || u.includes("fb.com")) return "facebook";
  if (u.includes("tiktok")) return "tiktok";
  if (u.includes("snapchat")) return "snapchat";
  if (u.includes("youtube") || u.includes("youtu.be")) return "youtube";
  if (u.includes("behance")) return "behance";
  if (u.includes("500px")) return "fiveHundredPx";
  if (u.includes("linkedin")) return "linkedin";
  if (u.includes("t.me") || u.includes("telegram")) return "telegram";
  if (u.includes("x.com") || u.includes("twitter")) return "xTwitter";
  if (u.includes("threads")) return "threads";
  if (u.includes("wa.me") || u.includes("whatsapp")) return "whatsapp";
  return null;
}

export function SocialLinksEditor({
  links,
  onChange,
  disabled,
}: SocialLinksEditorProps) {
  const [showAll, setShowAll] = useState(false);
  const uid = useId();

  const activePlatforms = PLATFORMS.filter(
    (p) => showAll || links[p.key],
  );

  const hiddenCount = PLATFORMS.length - activePlatforms.length;

  const updateLink = useCallback(
    (key: keyof SocialLinks, value: string) => {
      onChange({ ...links, [key]: value || undefined });
    },
    [links, onChange],
  );

  const removeLink = useCallback(
    (key: keyof SocialLinks) => {
      const next = { ...links };
      delete next[key];
      onChange(next);
    },
    [links, onChange],
  );

  const handleBlur = useCallback(
    (key: keyof SocialLinks, value: string) => {
      if (!value) return;
      const detected = detectPlatform(value);
      if (detected && detected !== key) {
        const next = { ...links };
        next[detected] = value;
        delete next[key];
        onChange(next);
      }
    },
    [links, onChange],
  );

  return (
    <div className="space-y-5" role="group" aria-label="روابط التواصل الاجتماعي">
      {PLATFORM_GROUPS.map((group) => {
        const groupPlatforms = activePlatforms.filter(
          (p) => p.group === group.key,
        );
        if (groupPlatforms.length === 0) return null;

        return (
          <div key={group.key}>
            <h4 className="mb-2 text-[13px] font-semibold text-muted-foreground">
              {group.label}
            </h4>
            <div className="space-y-1.5">
              {groupPlatforms.map((platform) => (
                <div
                  key={platform.key}
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)]",
                      links[platform.key]
                        ? "bg-champagne/10 text-champagne"
                        : "bg-surface text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {platform.icon}
                  </span>
                  <div className="relative flex-1">
                    <Input
                      id={`${uid}-${platform.key}`}
                      value={links[platform.key] ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateLink(platform.key, e.target.value)
                      }
                      onBlur={() =>
                        handleBlur(platform.key, links[platform.key] ?? "")
                      }
                      placeholder={platform.placeholder}
                      disabled={disabled}
                      dir="ltr"
                      className="min-h-9 pl-8 text-sm"
                      aria-label={platform.label}
                    />
                    {!links[platform.key] && (
                      <Link2 className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/40" />
                    )}
                  </div>
                  {links[platform.key] && (
                    <button
                      type="button"
                      onClick={() => removeLink(platform.key)}
                      disabled={disabled}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-danger/10 hover:text-danger",
                        disabled && "pointer-events-none opacity-50",
                      )}
                      aria-label={`حذف ${platform.label}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!showAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-sm text-champagne transition hover:text-champagne/80"
        >
          <Plus className="size-3.5" />
          ضيف منصة ({hiddenCount})
        </button>
      )}
    </div>
  );
}
