type ContactCompletionProfile = {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
};

export function hasMeaningfulContactInfo(
  profile: ContactCompletionProfile | null,
): boolean {
  if (!profile) return false;

  const hasContactChannel = Boolean(
    clean(profile.phone) || clean(profile.whatsapp) || clean(profile.email),
  );
  const hasLocationHint = Boolean(
    clean(profile.city) || clean(profile.country) || clean(profile.address),
  );

  return hasContactChannel && hasLocationHint;
}

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}
