"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  ImageIcon,
  Loader2,
  MapPin,
  MessageSquareText,
  Pencil,
  Phone,
  User,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SocialLinksEditor,
  type SocialLinks,
} from "@/components/dashboard/social-links-editor";
import { ImageUploader } from "@/components/dashboard/image-uploader";

import {
  updateSiteInfoAction,
  uploadSiteImageAction,
  type AutosaveState,
} from "@/app/(dashboard)/dashboard/site-info/actions";

type SectionState = {
  state: AutosaveState | null;
  isPending: boolean;
};

type SiteInfoClientProps = {
  userName: string;
  userEmail: string;
  userPhone: string | null;
  studioName: string | null;
  bio: string | null;
  longDescription: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  workingHours: Record<string, string> | null;
  bookingMessageTemplate: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  snapchat: string | null;
  youtube: string | null;
  behance: string | null;
  fiveHundredPx: string | null;
  linkedin: string | null;
  telegram: string | null;
  xTwitter: string | null;
  threads: string | null;
  website: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
};

function Card({
  title,
  icon,
  children,
  status,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  status?: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(245, 234, 214, 0.08)",
        background: "rgba(255, 255, 255, 0.03)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid rgba(245, 234, 214, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              background: "rgba(243, 207, 115, 0.1)",
              color: "#f3cf73",
            }}
          >
            {icon}
          </div>
          <h3
            style={{
              color: "#fff7e8",
              fontSize: "0.9rem",
              fontWeight: 950,
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        {status}
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function AutosaveBadge({
  state,
  isPending,
}: {
  state: AutosaveState | null;
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: "0.72rem",
          color: "rgba(245, 234, 214, 0.5)",
        }}
      >
        <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
        حفظ...
      </span>
    );
  }

  if (!state) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.72rem",
        color: state.ok ? "rgba(74, 222, 128, 0.8)" : "rgba(248, 113, 113, 0.8)",
      }}
    >
      {state.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      {state.message}
    </span>
  );
}

type FormCardProps = {
  title: string;
  icon: React.ReactNode;
  formId: string;
  sectionKey: string;
  sectionStates: Record<string, SectionState>;
  onSave: (formId: string, sectionKey: string) => void;
  children: React.ReactNode;
};

function FormCard({
  title,
  icon,
  formId,
  sectionKey,
  sectionStates,
  onSave,
  children,
}: FormCardProps) {
  const s = sectionStates[sectionKey];

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formId, sectionKey);
      }}
    >
      <Card
        title={title}
        icon={icon}
        status={
          <AutosaveBadge
            state={s?.state ?? null}
            isPending={s?.isPending ?? false}
          />
        }
      >
        {children}
      </Card>
    </form>
  );
}

export function SiteInfoClient(props: SiteInfoClientProps) {
  const [, startTransition] = useTransition();
  const [sectionStates, setSectionStates] = useState<
    Record<string, SectionState>
  >({});

  const updateSectionState = useCallback(
    (key: string, state: AutosaveState) => {
      setSectionStates((prev) => ({
        ...prev,
        [key]: { state, isPending: false },
      }));
    },
    [],
  );

  const saveForm = useCallback(
    (formId: string, sectionKey: string) => {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      if (!form) return;

      const formData = new FormData(form);

      setSectionStates((prev) => ({
        ...prev,
        [sectionKey]: { ...prev[sectionKey], isPending: true },
      }));

      startTransition(async () => {
        const result = await updateSiteInfoAction(formData);
        updateSectionState(sectionKey, result);
      });
    },
    [startTransition, updateSectionState],
  );

  const makeBlurHandler = useCallback(
    (formId: string, sectionKey: string) => () => {
      saveForm(formId, sectionKey);
    },
    [saveForm],
  );

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: props.instagram ?? undefined,
    facebook: props.facebook ?? undefined,
    tiktok: props.tiktok ?? undefined,
    snapchat: props.snapchat ?? undefined,
    youtube: props.youtube ?? undefined,
    behance: props.behance ?? undefined,
    fiveHundredPx: props.fiveHundredPx ?? undefined,
    linkedin: props.linkedin ?? undefined,
    telegram: props.telegram ?? undefined,
    xTwitter: props.xTwitter ?? undefined,
    threads: props.threads ?? undefined,
    website: props.website ?? undefined,
    whatsapp: props.whatsapp ?? undefined,
  });

  const socialFormRef = useRef<HTMLFormElement>(null);
  const socialTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [socialState, setSocialState] = useState<AutosaveState | null>(null);
  const [socialPending, setSocialPending] = useState(false);

  useEffect(() => {
    return () => {
      if (socialTimerRef.current) clearTimeout(socialTimerRef.current);
    };
  }, []);

  const handleSocialChange = useCallback(
    (links: SocialLinks) => {
      setSocialLinks(links);

      if (socialTimerRef.current) clearTimeout(socialTimerRef.current);

      socialTimerRef.current = setTimeout(() => {
        const form = socialFormRef.current;
        if (!form) return;

        const formData = new FormData(form);
        setSocialPending(true);
        setSocialState(null);

        startTransition(async () => {
          const result = await updateSiteInfoAction(formData);
          setSocialState(result);
          setSocialPending(false);
        });
      }, 1500);
    },
    [startTransition],
  );

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    props.avatarUrl,
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(
    props.coverUrl,
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const handleImageUpload = useCallback(
    (field: "avatarAssetId" | "coverAssetId") =>
      async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        const setUploading =
          field === "avatarAssetId" ? setAvatarUploading : setCoverUploading;
        const setPreview =
          field === "avatarAssetId" ? setAvatarPreview : setCoverPreview;

        setUploading(true);
        try {
          const fd = new FormData();
          fd.append("image", file);
          fd.append("field", field);

          const result = await uploadSiteImageAction(fd);
          if (result.ok) {
            setPreview(URL.createObjectURL(file));
          }
        } finally {
          setUploading(false);
        }
      },
    [],
  );

  const fieldAttrs = (formId: string, sectionKey: string) => ({
    onBlur: makeBlurHandler(formId, sectionKey),
  });

  return (
    <main
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}
    >
      <section>
        <h1
          style={{
            color: "#fff7e8",
            fontSize: "1.4rem",
            fontWeight: 950,
            margin: 0,
          }}
        >
          معلومات الموقع
        </h1>
        <p
          style={{
            color: "rgba(245, 234, 214, 0.55)",
            fontSize: "0.82rem",
            margin: "4px 0 0",
          }}
        >
          اسم الاستوديو، معلومات الاتصال، وروابط التواصل الاجتماعي.
        </p>
      </section>

      {/* Photographer Info */}
      <FormCard
        title="معلومات المصور"
        icon={<User size={16} />}
        formId="profile-form"
        sectionKey="profile"
        sectionStates={sectionStates}
        onSave={saveForm}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: "rgba(245, 234, 214, 0.6)",
                }}
              >
                الاسم
              </Label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 44,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(245, 234, 214, 0.06)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "rgba(245, 234, 214, 0.45)",
                  fontSize: "0.85rem",
                }}
              >
                <User size={14} style={{ opacity: 0.4 }} />
                {props.userName}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label
                htmlFor="studioName"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: "rgba(245, 234, 214, 0.6)",
                }}
              >
                اسم الاستوديو
              </Label>
              <Input
                id="studioName"
                name="studioName"
                defaultValue={props.studioName ?? ""}
                placeholder="استوديو فهد للتصوير"
                {...fieldAttrs("profile-form", "profile")}
              />
            </div>
          </div>
        </div>
      </FormCard>

      {/* Bio */}
      <FormCard
        title="السيرة الشخصية"
        icon={<Pencil size={16} />}
        formId="bio-form"
        sectionKey="bio"
        sectionStates={sectionStates}
        onSave={saveForm}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="bio"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              نبذة مختصرة
            </Label>
            <Input
              id="bio"
              name="bio"
              defaultValue={props.bio ?? ""}
              placeholder="مصور فوتوغرافي متخصص في..."
              {...fieldAttrs("bio-form", "bio")}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="longDescription"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              الوصف الطويل
            </Label>
            <Textarea
              id="longDescription"
              name="longDescription"
              defaultValue={props.longDescription ?? ""}
              placeholder="اكتب نبذة أوسع عن خبراتك وأعمالك..."
              rows={5}
              {...fieldAttrs("bio-form", "bio")}
            />
          </div>
        </div>
      </FormCard>

      {/* Contact Info */}
      <FormCard
        title="معلومات الاتصال"
        icon={<Phone size={16} />}
        formId="contact-form"
        sectionKey="contact"
        sectionStates={sectionStates}
        onSave={saveForm}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label
                htmlFor="phone"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: "rgba(245, 234, 214, 0.6)",
                }}
              >
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={props.phone ?? ""}
                placeholder="+20 100 000 0000"
                {...fieldAttrs("contact-form", "contact")}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label
                htmlFor="whatsapp"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: "rgba(245, 234, 214, 0.6)",
                }}
              >
                واتساب
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={props.whatsapp ?? ""}
                placeholder="https://wa.me/201000000000"
                dir="ltr"
                {...fieldAttrs("contact-form", "contact")}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="email"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={props.email ?? ""}
              placeholder="photographer@example.com"
              {...fieldAttrs("contact-form", "contact")}
            />
          </div>
        </div>
      </FormCard>

      {/* Location */}
      <FormCard
        title="الموقع"
        icon={<MapPin size={16} />}
        formId="location-form"
        sectionKey="location"
        sectionStates={sectionStates}
        onSave={saveForm}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label
                htmlFor="city"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: "rgba(245, 234, 214, 0.6)",
                }}
              >
                المدينة
              </Label>
              <Input
                id="city"
                name="city"
                defaultValue={props.city ?? ""}
                placeholder="الرياض"
                {...fieldAttrs("location-form", "location")}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label
                htmlFor="country"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 950,
                  color: "rgba(245, 234, 214, 0.6)",
                }}
              >
                الدولة
              </Label>
              <Input
                id="country"
                name="country"
                defaultValue={props.country ?? ""}
                placeholder="السعودية"
                {...fieldAttrs("location-form", "location")}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="address"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              العنوان
            </Label>
            <Input
              id="address"
              name="address"
              defaultValue={props.address ?? ""}
              placeholder="شارع الملك فهد، حي العليا"
              {...fieldAttrs("location-form", "location")}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="googleMapsUrl"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              رابط خرائط Google
            </Label>
            <Input
              id="googleMapsUrl"
              name="googleMapsUrl"
              type="url"
              defaultValue={props.googleMapsUrl ?? ""}
              placeholder="https://maps.google.com/?q=..."
              dir="ltr"
              {...fieldAttrs("location-form", "location")}
            />
          </div>
        </div>
      </FormCard>

      {/* Working Hours */}
      <FormCard
        title="مواعيد العمل"
        icon={<Clock size={16} />}
        formId="hours-form"
        sectionKey="hours"
        sectionStates={sectionStates}
        onSave={saveForm}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="workingHours"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              JSON
            </Label>
            <Textarea
              id="workingHours"
              name="workingHours"
              defaultValue={
                props.workingHours
                  ? JSON.stringify(props.workingHours, null, 2)
                  : ""
              }
              placeholder='{"السبت": "9:00 - 17:00", "الأحد": "مغلق"}'
              rows={5}
              dir="ltr"
              {...fieldAttrs("hours-form", "hours")}
            />
          </div>
          <p
            style={{
              fontSize: "0.72rem",
              color: "rgba(245, 234, 214, 0.4)",
              margin: 0,
            }}
          >
            استخدم صيغة JSON: {`{"اليوم": "ساعات العمل"}`}
          </p>
        </div>
      </FormCard>

      {/* Booking Button */}
      <FormCard
        title="زر الحجز"
        icon={<MessageSquareText size={16} />}
        formId="booking-form"
        sectionKey="booking"
        sectionStates={sectionStates}
        onSave={saveForm}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label
              htmlFor="bookingMessageTemplate"
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
              }}
            >
              نص زر الحجز
            </Label>
            <Input
              id="bookingMessageTemplate"
              name="bookingMessageTemplate"
              defaultValue={props.bookingMessageTemplate ?? ""}
              placeholder="احجز موعدك الآن"
              {...fieldAttrs("booking-form", "booking")}
            />
          </div>
        </div>
      </FormCard>

      {/* Social Links */}
      <Card
        title="روابط التواصل الاجتماعي"
        icon={<Globe size={16} />}
        status={
          <AutosaveBadge state={socialState} isPending={socialPending} />
        }
      >
        <form ref={socialFormRef} id="social-form">
          {(
            [
              "instagram",
              "facebook",
              "tiktok",
              "snapchat",
              "youtube",
              "behance",
              "fiveHundredPx",
              "linkedin",
              "telegram",
              "xTwitter",
              "threads",
              "website",
              "whatsapp",
            ] as const
          ).map((key) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={socialLinks[key] ?? ""}
            />
          ))}
        </form>
        <SocialLinksEditor
          links={socialLinks}
          onChange={handleSocialChange}
        />
      </Card>

      {/* Images */}
      <Card title="صور الموقع" icon={<ImageIcon size={16} />}>
        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <Label
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
                marginBottom: 8,
                display: "block",
              }}
            >
              صورة الغلاف
            </Label>
            {coverPreview && (
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 9",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 12,
                  border: "1px solid rgba(245, 234, 214, 0.08)",
                }}
              >
                <img
                  src={coverPreview}
                  alt="الغلاف"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <ImageUploader
              onUpload={handleImageUpload("coverAssetId")}
              multiple={false}
              maxFiles={1}
              disabled={coverUploading}
            >
              {coverUploading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.82rem",
                    color: "#f3cf73",
                  }}
                >
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  جاري رفع الصورة...
                </div>
              )}
            </ImageUploader>
          </div>

          <div>
            <Label
              style={{
                fontSize: "0.78rem",
                fontWeight: 950,
                color: "rgba(245, 234, 214, 0.6)",
                marginBottom: 8,
                display: "block",
              }}
            >
              الصورة الشخصية
            </Label>
            {avatarPreview && (
              <div
                style={{
                  position: "relative",
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  overflow: "hidden",
                  marginBottom: 12,
                  border: "2px solid rgba(243, 207, 115, 0.2)",
                }}
              >
                <img
                  src={avatarPreview}
                  alt="الصورة الشخصية"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <ImageUploader
              onUpload={handleImageUpload("avatarAssetId")}
              multiple={false}
              maxFiles={1}
              disabled={avatarUploading}
            >
              {avatarUploading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.82rem",
                    color: "#f3cf73",
                  }}
                >
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  جاري رفع الصورة...
                </div>
              )}
            </ImageUploader>
          </div>
        </div>
      </Card>
    </main>
  );
}
