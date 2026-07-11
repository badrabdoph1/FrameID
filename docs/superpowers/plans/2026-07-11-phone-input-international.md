# International Phone Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain text identifier field in signup/login/forgot-password with a professional international phone input component that supports 22 Arab countries, auto-formats to E.164, and maintains email as an alternative input mode.

**Architecture:** Adapt the PhoneInput system from BadrDaawa (GitHub version) to FrameID's design system. The PhoneInput is a client component with country dropdown, search, and auto-formatting. The signup/login/forgot-password pages remain Server Components but their forms are extracted into Client Component wrappers to support PhoneInput state. The `identifier` hidden field still submits E.164 phone or email — the existing `auth-identifier.ts` and validation pipeline remain unchanged.

**Tech Stack:** Next.js 15.5 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, Zod v4, libphonenumber-js, lucide-react

## Global Constraints

- Arabic-first UI, all user-facing strings in Arabic
- RTL layout support
- Design tokens: `--color-champagne`, `--color-champagne-strong`, `--color-surface`, `--color-border`, `--color-foreground`, `--color-muted-foreground`, `--color-danger`, `--radius-control`
- Server Actions for form submission (no API routes)
- No new form libraries — plain `<form>` with server actions
- Phone numbers stored in E.164 format (e.g. `+201012345678`)
- Default country: Egypt
- Existing `auth-identifier.ts` handles E.164 parsing — do not break it

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/phone-utils.ts` | Country data, E.164 formatting, parsing, validation, placeholders |
| Create | `src/components/ui/phone-input.tsx` | Client component: country dropdown, phone number input, auto-format |
| Create | `src/components/auth/signup-form.tsx` | Client component: signup form with phone/email toggle |
| Create | `src/components/auth/login-form.tsx` | Client component: login form with phone/email toggle |
| Create | `src/components/auth/forgot-password-form.tsx` | Client component: forgot-password form with phone/email toggle |
| Modify | `src/app/(marketing)/signup/page.tsx` | Replace inline form with `<SignupForm />` |
| Modify | `src/app/(marketing)/login/page.tsx` | Replace inline form with `<LoginForm />` |
| Modify | `src/app/(marketing)/forgot-password/page.tsx` | Replace inline form with `<ForgotPasswordForm />` |
| Modify | `src/app/globals.css` | Add phone-input CSS styles adapted to FrameID tokens |
| Modify | `package.json` | Add `libphonenumber-js` dependency |

---

### Task 1: Install libphonenumber-js

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

```bash
npm install libphonenumber-js
```

- [ ] **Step 2: Verify installation**

```bash
npm ls libphonenumber-js
```

Expected: shows `libphonenumber-js@1.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add libphonenumber-js for phone input formatting"
```

---

### Task 2: Create phone-utils.ts

**Files:**
- Create: `src/lib/phone-utils.ts`

**Interfaces:**
- Produces: `CountryData`, `ARAB_COUNTRIES`, `DEFAULT_COUNTRY`, `formatToE164()`, `parseE164()`, `validatePhone()`, `getPhonePlaceholder()`

- [ ] **Step 1: Create the phone utils file**

```typescript
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";

export type CountryCode = string;

export interface CountryData {
  code: CountryCode;
  dialCode: string;
  name: string;
  flag: string;
}

export const ARAB_COUNTRIES: CountryData[] = [
  { code: "EG", dialCode: "20", name: "مصر", flag: "🇪🇬" },
  { code: "SA", dialCode: "966", name: "السعودية", flag: "🇸🇦" },
  { code: "AE", dialCode: "971", name: "الإمارات", flag: "🇦🇪" },
  { code: "KW", dialCode: "965", name: "الكويت", flag: "🇰🇼" },
  { code: "QA", dialCode: "974", name: "قطر", flag: "🇶🇦" },
  { code: "OM", dialCode: "968", name: "عمان", flag: "🇴🇲" },
  { code: "BH", dialCode: "973", name: "البحرين", flag: "🇧🇭" },
  { code: "JO", dialCode: "962", name: "الأردن", flag: "🇯🇴" },
  { code: "LB", dialCode: "961", name: "لبنان", flag: "🇱🇧" },
  { code: "IQ", dialCode: "964", name: "العراق", flag: "🇮🇶" },
  { code: "SY", dialCode: "963", name: "سوريا", flag: "🇸🇾" },
  { code: "PS", dialCode: "970", name: "فلسطين", flag: "🇵🇸" },
  { code: "YE", dialCode: "967", name: "اليمن", flag: "🇾🇪" },
  { code: "LY", dialCode: "218", name: "ليبيا", flag: "🇱🇾" },
  { code: "TN", dialCode: "216", name: "تونس", flag: "🇹🇳" },
  { code: "DZ", dialCode: "213", name: "الجزائر", flag: "🇩🇿" },
  { code: "MA", dialCode: "212", name: "المغرب", flag: "🇲🇦" },
  { code: "MR", dialCode: "222", name: "موريتانيا", flag: "🇲🇷" },
  { code: "SD", dialCode: "249", name: "السودان", flag: "🇸🇩" },
  { code: "DJ", dialCode: "253", name: "جيبوتي", flag: "🇩🇯" },
  { code: "SO", dialCode: "252", name: "الصومال", flag: "🇸🇴" },
  { code: "KM", dialCode: "269", name: "جزر القمر", flag: "🇰🇲" },
];

export const DEFAULT_COUNTRY = ARAB_COUNTRIES[0];

export function getCountryByCode(code: string): CountryData | undefined {
  return ARAB_COUNTRIES.find((c) => c.code === code);
}

export function formatToE164(phone: string, countryCode: string): string {
  const digits = phone.replace(/[^\d]/g, "");

  if (!digits) return "";

  if (countryCode === "EG") {
    if (digits.startsWith("010") && digits.length === 11) {
      return `+20${digits.slice(1)}`;
    }
    if (digits.startsWith("10") && digits.length === 10) {
      return `+20${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("01")) {
      return `+20${digits.slice(1)}`;
    }
    if (digits.length === 10) {
      return `+20${digits}`;
    }
  }

  try {
    const parsed = parsePhoneNumberFromString(digits, countryCode as any);
    if (parsed?.isValid()) {
      return parsed.format("E.164");
    }
  } catch {}

  const country = getCountryByCode(countryCode);
  if (country) {
    if (digits.startsWith("00")) return `+${digits.slice(2)}`;
    if (digits.startsWith(country.dialCode)) return `+${digits}`;
    return `+${country.dialCode}${digits}`;
  }

  return `+${digits}`;
}

export function parseE164(e164: string): {
  national: string;
  country: CountryData | undefined;
} {
  const cleaned = e164.replace(/[^\d+]/g, "");

  try {
    const parsed = parsePhoneNumberFromString(cleaned);
    if (parsed) {
      const country = getCountryByCode(parsed.country || "");
      return { national: parsed.format("NATIONAL"), country };
    }
  } catch {}

  const digits = cleaned.replace(/\D/g, "");
  for (const c of ARAB_COUNTRIES) {
    if (digits.startsWith(c.dialCode)) {
      const national = digits.slice(c.dialCode.length);
      return { national, country: c };
    }
  }

  return { national: cleaned, country: undefined };
}

export function validatePhone(
  phone: string,
  countryCode: string,
): { valid: boolean; e164?: string; error?: string } {
  const digits = phone.replace(/[^\d]/g, "");

  if (!digits) {
    return { valid: false, error: "رقم الهاتف مطلوب" };
  }

  if (countryCode === "EG") {
    const startsWith01 = digits.startsWith("01") && digits.length === 11;
    const startsWith1 = digits.startsWith("10") && digits.length === 10;
    if (!startsWith01 && !startsWith1) {
      return { valid: false, error: "رقم الهاتف غير صحيح" };
    }
    const e164 = digits.startsWith("10")
      ? `+20${digits}`
      : `+20${digits.slice(1)}`;
    return { valid: true, e164 };
  }

  try {
    if (isValidPhoneNumber(digits, countryCode as any)) {
      const parsed = parsePhoneNumberFromString(digits, countryCode as any);
      if (parsed) {
        return { valid: true, e164: parsed.format("E.164") };
      }
    }
    return { valid: false, error: "رقم الهاتف غير صحيح للدولة المحددة" };
  } catch {
    return { valid: false, error: "رقم الهاتف غير صحيح" };
  }
}

export function getPhonePlaceholder(countryCode: string): string {
  if (countryCode === "EG") return "1012345678";
  if (countryCode === "SA") return "501234567";
  if (countryCode === "AE") return "501234567";
  return "رقم الهاتف";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/phone-utils.ts
git commit -m "feat: add phone-utils with country data, E.164 formatting and validation"
```

---

### Task 3: Create PhoneInput component

**Files:**
- Create: `src/components/ui/phone-input.tsx`

**Interfaces:**
- Consumes: `ARAB_COUNTRIES`, `DEFAULT_COUNTRY`, `CountryData`, `formatToE164`, `parseE164`, `getPhonePlaceholder` from `@/lib/phone-utils`
- Produces: `<PhoneInput value={string} onChange={(e164) => void} error? placeholder? id? required? autoComplete? />`

- [ ] **Step 1: Create the PhoneInput component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARAB_COUNTRIES,
  DEFAULT_COUNTRY,
  type CountryData,
  formatToE164,
  parseE164,
  getPhonePlaceholder,
} from "@/lib/phone-utils";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  autoComplete?: string;
};

export function PhoneInput({
  value,
  onChange,
  error,
  placeholder,
  id,
  required,
  autoComplete,
}: PhoneInputProps) {
  const [country, setCountry] = useState<CountryData>(DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !initialized) {
      if (value.startsWith("+")) {
        const { national, country: parsedCountry } = parseE164(value);
        if (parsedCountry) setCountry(parsedCountry);
        setRawInput(national ? national.replace(/[^\d]/g, "") : "");
      } else {
        setRawInput(value.replace(/[^\d]/g, ""));
      }
      setInitialized(true);
    }
  }, [value, initialized]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleScroll() {
      setOpen(false);
    }
    window.addEventListener("wheel", handleScroll, { passive: true });
    return () => window.removeEventListener("wheel", handleScroll);
  }, [open]);

  function toggleDropdown() {
    if (open) {
      setOpen(false);
    } else {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setOpen(true);
    }
  }

  function handleInputChange(input: string) {
    const digits = input.replace(/[^\d]/g, "");
    let truncated: string;
    if (country.code === "EG") {
      const maxLen =
        digits.startsWith("1") && !digits.startsWith("01") ? 10 : 11;
      truncated = digits.slice(0, maxLen);
    } else {
      truncated = digits.slice(0, 15);
    }
    setRawInput(truncated);
    onChange(truncated ? formatToE164(truncated, country.code) : "");
  }

  function handleBlur() {
    if (rawInput) {
      onChange(formatToE164(rawInput, country.code));
    }
  }

  function selectCountry(c: CountryData) {
    setCountry(c);
    setSearchQuery("");
    setOpen(false);
    if (rawInput) {
      onChange(formatToE164(rawInput, c.code));
    }
    requestAnimationFrame(() => phoneInputRef.current?.focus());
  }

  const filteredCountries = ARAB_COUNTRIES.filter(
    (c) =>
      !searchQuery ||
      c.name.includes(searchQuery) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayPlaceholder = placeholder || getPhonePlaceholder(country.code);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="pi-group"
        role="group"
        aria-label="رقم الهاتف"
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
      >
        <div className="pi-country-wrap">
          <button
            type="button"
            className="pi-country-btn"
            onClick={toggleDropdown}
            title={country.name}
          >
            <span className="pi-flag">{country.flag}</span>
            <span className="pi-dialcode">+{country.dialCode}</span>
            <svg
              className="pi-arrow"
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              style={{
                transition: "transform 180ms ease",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {open && (
            <div ref={listRef} className="pi-dropdown" role="listbox">
              <div className="pi-search-wrap">
                <input
                  ref={searchRef}
                  className="pi-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="ابحث عن دولة..."
                  dir="auto"
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      const items =
                        listRef.current?.querySelectorAll(".pi-item");
                      (items?.[0] as HTMLElement)?.focus();
                    }
                    if (event.key === "Escape") setOpen(false);
                  }}
                />
              </div>
              <div className="pi-items">
                {filteredCountries.length === 0 ? (
                  <div className="pi-empty">لا توجد نتائج</div>
                ) : (
                  filteredCountries.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      role="option"
                      aria-selected={c.code === country.code}
                      className={`pi-item${c.code === country.code ? " active" : ""}`}
                      onClick={() => selectCountry(c)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          const next = event.currentTarget
                            .nextElementSibling as HTMLElement | null;
                          next?.focus();
                        }
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          const prev = event.currentTarget
                            .previousElementSibling as HTMLElement | null;
                          prev?.focus();
                        }
                        if (event.key === "Escape") setOpen(false);
                      }}
                    >
                      <span className="pi-item-flag">{c.flag}</span>
                      <span className="pi-item-name">{c.name}</span>
                      <span className="pi-item-dial">+{c.dialCode}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <input
          ref={phoneInputRef}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete || "tel"}
          required={required}
          className="pi-field"
          value={rawInput}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={handleBlur}
          placeholder={displayPlaceholder}
          dir="ltr"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/phone-input.tsx
git commit -m "feat: add PhoneInput component with country dropdown and E.164 formatting"
```

---

### Task 4: Add PhoneInput CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: CSS custom properties `--color-border`, `--color-surface`, `--color-foreground`, `--color-muted-foreground`, `--color-champagne`, `--color-champagne-strong`, `--color-danger`, `--radius-control`

- [ ] **Step 1: Append phone input styles to globals.css**

Add the following block at the end of `src/app/globals.css` (after the last `@utility` block):

```css
/* ── Phone Input ── */

.pi-group {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.pi-group:focus-within {
  border-color: var(--color-champagne);
  box-shadow: 0 0 0 3px rgb(216 180 106 / 0.18);
}

.pi-group[aria-invalid="true"] {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgb(186 45 45 / 0.08);
}

.pi-country-wrap {
  position: relative;
  flex-shrink: 0;
}

.pi-country-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px 0 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  color: inherit;
  white-space: nowrap;
  border-inline-end: 1px solid var(--color-border);
  transition: background 140ms ease;
  border-radius: var(--radius-control) 0 0 var(--radius-control);
  min-height: 100%;
}

.pi-country-btn:hover {
  background: rgb(0 0 0 / 0.03);
}

.pi-flag {
  font-size: 1rem;
  line-height: 1;
}

.pi-dialcode {
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 0.7;
  direction: ltr;
}

.pi-arrow {
  opacity: 0.4;
  flex-shrink: 0;
}

.pi-field {
  width: 100%;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  padding: 0 10px;
  font-size: inherit;
  font-family: inherit;
  color: inherit;
  box-shadow: none !important;
  min-height: inherit;
}

.pi-field::placeholder {
  color: var(--color-muted-foreground);
  opacity: 0.6;
}

/* ── Country dropdown ── */

.pi-dropdown {
  position: absolute;
  bottom: calc(100% + 3px);
  inset-inline-end: 0;
  z-index: 200;
  width: 100%;
  min-width: 13rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  animation: pi-dropdown-in 140ms ease both;
  transform-origin: bottom center;
}

@keyframes pi-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(3px) scaleY(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}

.pi-search-wrap {
  padding: 5px 5px 3px;
}

.pi-search {
  width: 100%;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: rgb(0 0 0 / 0.02);
  padding: 0 8px;
  font-size: 0.78rem;
  font-family: inherit;
  color: var(--color-foreground);
  outline: none;
  transition: border-color 140ms ease;
  -webkit-appearance: none;
}

.pi-search:focus {
  border-color: var(--color-champagne);
}

.pi-search::placeholder {
  color: var(--color-muted-foreground);
  opacity: 0.5;
}

.pi-items {
  max-height: 13rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.pi-items::-webkit-scrollbar {
  width: 4px;
}

.pi-items::-webkit-scrollbar-track {
  background: transparent;
}

.pi-items::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.pi-empty {
  padding: 14px 8px;
  text-align: center;
  color: var(--color-muted-foreground);
  font-size: 0.78rem;
  font-weight: 600;
}

.pi-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 42px;
  padding: 0 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.82rem;
  font-family: inherit;
  text-align: left;
  color: var(--color-foreground);
  transition: background 80ms ease;
  direction: rtl;
}

.pi-item:hover,
.pi-item:focus-visible {
  background: rgb(0 0 0 / 0.03);
  outline: none;
}

.pi-item.active {
  background: rgb(216 180 106 / 0.12);
  font-weight: 700;
  color: var(--color-champagne-strong);
}

.pi-item-flag {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.pi-item-name {
  flex: 1;
  text-align: right;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pi-item-dial {
  font-size: 0.76rem;
  opacity: 0.5;
  direction: ltr;
  font-weight: 600;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add phone input CSS styles with FrameID design tokens"
```

---

### Task 5: Create SignupForm client component

**Files:**
- Create: `src/components/auth/signup-form.tsx`

**Interfaces:**
- Consumes: `<PhoneInput>` from `@/components/ui/phone-input`, `<Button>` from `@/components/ui/button`, `<Input>` from `@/components/ui/input`, `<Label>` from `@/components/ui/label`
- Produces: `<SignupForm template? error? />` — renders the full signup form, submits to `signupAction`

- [ ] **Step 1: Create the SignupForm component**

```tsx
"use client";

import { useState } from "react";

import { signupAction } from "@/app/(marketing)/signup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

type SignupFormProps = {
  template?: string;
  error?: string;
};

export function SignupForm({ template, error }: SignupFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-6 text-foreground">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "phone"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          رقم الهاتف
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "email"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          البريد الإلكتروني
        </button>
      </div>

      <form action={signupAction} className="space-y-4">
        <input
          name="selectedTemplateCode"
          type="hidden"
          value={template ?? ""}
        />

        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        <div className="space-y-2">
          <Label htmlFor="name">اسمك أو اسم الاستوديو</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>

        {mode === "phone" ? (
          <div className="space-y-2">
            <Label htmlFor="phone-input">رقم الهاتف</Label>
            <PhoneInput
              id="phone-input"
              value={phoneValue}
              onChange={setPhoneValue}
              required
              autoComplete="tel"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              يمكنك التسجيل بأي رقم هاتف من أي دولة عربية.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="identifier">البريد الإلكتروني</Label>
            <Input
              id="identifier"
              name="identifier"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            اكتب 8 أحرف على الأقل. يمكنك استخدام حروف وأرقام ورموز.
          </p>
        </div>

        <Button type="submit" variant="luxury" className="w-full">
          إنشاء موقعي
        </Button>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/signup-form.tsx
git commit -m "feat: add SignupForm client component with phone/email toggle"
```

---

### Task 6: Update signup page to use SignupForm

**Files:**
- Modify: `src/app/(marketing)/signup/page.tsx`

**Interfaces:**
- Consumes: `<SignupForm template? error? />` from `@/components/auth/signup-form`

- [ ] **Step 1: Replace the signup page content**

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابك على FrameID وابدأ تجهيز موقعك ورابطك الخاص.",
  robots: {
    index: false,
    follow: false
  }
};

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    template?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, template } = await searchParams;

  return (
    <AuthShell
      title="أنشئ حسابك"
      description="هنجهز الحساب والموقع والرابط تلقائيًا بعد التسجيل."
    >
      <SignupForm error={error} template={template} />
      <p className="mt-6 text-sm text-muted-foreground">
        عندك حساب؟{" "}
        <Link href="/login" className="font-semibold text-foreground">
          سجل دخول
        </Link>
      </p>
    </AuthShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(marketing\)/signup/page.tsx
git commit -m "refactor: signup page uses SignupForm client component"
```

---

### Task 7: Create LoginForm client component

**Files:**
- Create: `src/components/auth/login-form.tsx`

**Interfaces:**
- Consumes: `<PhoneInput>` from `@/components/ui/phone-input`, `<Button>` from `@/components/ui/button`, `<Input>` from `@/components/ui/input`, `<Label>` from `@/components/ui/label`
- Produces: `<LoginForm error? message? />` — renders the full login form, submits to `loginAction`

- [ ] **Step 1: Create the LoginForm component**

```tsx
"use client";

import { useState } from "react";

import { loginAction } from "@/app/(marketing)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

type LoginFormProps = {
  error?: string;
  message?: string;
};

export function LoginForm({ error, message }: LoginFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");

  return (
    <>
      {message ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "phone"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          رقم الهاتف
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "email"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          البريد الإلكتروني
        </button>
      </div>

      <form action={loginAction} className="space-y-4">
        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        {mode === "phone" ? (
          <div className="space-y-2">
            <Label htmlFor="phone-input">رقم الهاتف</Label>
            <PhoneInput
              id="phone-input"
              value={phoneValue}
              onChange={setPhoneValue}
              required
              autoComplete="tel"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="identifier">البريد الإلكتروني</Label>
            <Input
              id="identifier"
              name="identifier"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          تسجيل الدخول
        </Button>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/login-form.tsx
git commit -m "feat: add LoginForm client component with phone/email toggle"
```

---

### Task 8: Update login page to use LoginForm

**Files:**
- Modify: `src/app/(marketing)/login/page.tsx`

**Interfaces:**
- Consumes: `<LoginForm error? message? />` from `@/components/auth/login-form`

- [ ] **Step 1: Replace the login page content**

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "ادخل لإدارة موقعك وصورك وباقاتك من لوحة تحكم FrameID.",
  robots: {
    index: false,
    follow: false
  }
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="تسجيل الدخول"
      description="ادخل برقم الهاتف أو البريد عشان تدير موقعك، صورك، وباقاتك."
    >
      <LoginForm error={error} message={message} />
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          نسيت كلمة السر؟
        </Link>
        <Link href="/signup" className="font-semibold">
          إنشاء حساب جديد
        </Link>
      </div>
    </AuthShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(marketing\)/login/page.tsx
git commit -m "refactor: login page uses LoginForm client component"
```

---

### Task 9: Create ForgotPasswordForm client component

**Files:**
- Create: `src/components/auth/forgot-password-form.tsx`

**Interfaces:**
- Consumes: `<PhoneInput>` from `@/components/ui/phone-input`, `<Button>` from `@/components/ui/button`, `<Input>` from `@/components/ui/input`, `<Label>` from `@/components/ui/label`
- Produces: `<ForgotPasswordForm sent? error? />` — renders the forgot-password form, submits to `requestPasswordResetAction`

- [ ] **Step 1: Create the ForgotPasswordForm component**

```tsx
"use client";

import { useState } from "react";

import { requestPasswordResetAction } from "@/app/(marketing)/forgot-password/actions";
import { PasswordRecoverySupportCard } from "@/components/auth/password-recovery-support-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

type ForgotPasswordFormProps = {
  sent?: string;
  error?: string;
};

export function ForgotPasswordForm({ sent, error }: ForgotPasswordFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");

  return (
    <>
      {sent ? (
        <div className="mb-4 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          لو الحساب مسجل ببريد إلكتروني، تم إرسال رابط الاستعادة.
        </div>
      ) : null}
      {error ? <PasswordRecoverySupportCard /> : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "phone"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          رقم الهاتف
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "email"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          البريد الإلكتروني
        </button>
      </div>

      <form action={requestPasswordResetAction} className="space-y-4">
        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        {mode === "phone" ? (
          <div className="space-y-2">
            <Label htmlFor="phone-input">رقم الهاتف</Label>
            <PhoneInput
              id="phone-input"
              value={phoneValue}
              onChange={setPhoneValue}
              required
              autoComplete="tel"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="identifier">البريد الإلكتروني</Label>
            <Input
              id="identifier"
              name="identifier"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>
        )}

        <Button type="submit" className="w-full">
          أرسل رابط الاستعادة
        </Button>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/forgot-password-form.tsx
git commit -m "feat: add ForgotPasswordForm client component with phone/email toggle"
```

---

### Task 10: Update forgot-password page to use ForgotPasswordForm

**Files:**
- Modify: `src/app/(marketing)/forgot-password/page.tsx`

**Interfaces:**
- Consumes: `<ForgotPasswordForm sent? error? />` from `@/components/auth/forgot-password-form`

- [ ] **Step 1: Replace the forgot-password page content**

```tsx
import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "نسيت كلمة السر",
  description: "استعادة الوصول إلى حساب FrameID.",
  robots: {
    index: false,
    follow: false
  }
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const { sent, error } = await searchParams;

  return (
    <AuthShell
      title="نسيت كلمة السر"
      description="ادخل رقم الهاتف أو البريد. لو الحساب مربوط بريد، هنرسل رابط استعادة آمن."
    >
      <ForgotPasswordForm sent={sent} error={error} />
    </AuthShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(marketing\)/forgot-password/page.tsx
git commit -m "refactor: forgot-password page uses ForgotPasswordForm client component"
```

---

### Task 11: Verify build and typecheck

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Run Next.js build**

```bash
npm run build
```

Expected: Build succeeds without errors

- [ ] **Step 3: Run dev server and manual test**

```bash
npm run dev
```

Then visit:
- `http://localhost:3000/signup` — verify phone input appears, country dropdown opens, numbers format to E.164, email toggle works
- `http://localhost:3000/login` — same verification
- `http://localhost:3000/forgot-password` — same verification

- [ ] **Step 4: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: typecheck and build fixes for phone input"
```

---

## Summary of Changes

| What | Why |
|------|-----|
| `libphonenumber-js` dependency | Industry-standard phone parsing for 22+ countries |
| `phone-utils.ts` | Country data, E.164 formatting, validation — shared across all auth pages |
| `phone-input.tsx` | Professional phone input with country dropdown, search, auto-format |
| `signup-form.tsx` | Client wrapper for signup form (phone/email toggle) |
| `login-form.tsx` | Client wrapper for login form (phone/email toggle) |
| `forgot-password-form.tsx` | Client wrapper for forgot-password form (phone/email toggle) |
| Updated `globals.css` | Phone input styles using FrameID design tokens |
| Updated 3 page files | Server Components now render Client Component form wrappers |

## What Stays the Same

- `auth-identifier.ts` — no changes needed, already handles E.164 format
- `signup-validation.ts` — no changes needed, validation happens in `auth-identifier.ts`
- `login-validation.ts` — no changes needed
- Server actions (`signupAction`, `loginAction`, `requestPasswordResetAction`) — no changes needed, they receive `identifier` as a string just like before
- Prisma schema — phone numbers still stored in E.164 format
