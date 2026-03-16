"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { EDEBATTE_PACKAGES_WITH_NONE } from "@/config/edebatte";
import { canEditTopTopics } from "@features/account/capabilities";
import {
  EDEBATTE_PACKAGES_DE,
  getPackagesByIds,
  PRIVATE_PACKAGE_IDS,
  type EDebattePackageDefinition,
} from "@features/pricing";
import type { AccountFeatureInterestKey } from "@features/account/types";
import { TOPIC_CHOICES, type TopicKey } from "@features/interests/topics";
import type { UserRole } from "@/types/user";
import type { EngagementLevel } from "@features/user/engagement";
import {
  FiCheckCircle,
  FiCopy,
  FiCreditCard,
  FiEdit2,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiNavigation,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiSliders,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";

// Shared button primitives for consistent contrast across light/dark.
const primaryButtonClass =
  "btn-primary inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold";

const primaryButtonSmallClass =
  "btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold";

const secondaryLightButtonClass =
  "btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold";

const ghostDarkButtonClass =
  "btn-ghost inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold";

const subtleLinkClass =
  "text-[11px] font-medium text-[rgb(var(--muted))] underline-offset-2 hover:text-[rgb(var(--fg))] hover:underline";

const selectedSurfaceClass =
  "border-sky-300/60 bg-sky-100 text-sky-900 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.45)] dark:border-sky-400/40 dark:bg-sky-500/18 dark:text-sky-100";

const selectedChipClass =
  "bg-sky-100 text-sky-900 ring-1 ring-sky-300/60 dark:bg-sky-500/18 dark:text-sky-100 dark:ring-sky-400/40";

const subtleWarningClass =
  "rounded-xl border border-amber-300/55 bg-amber-100/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-100";

const EURO = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function formatEuro(amount?: number | null) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return null;
  return EURO.format(amount);
}

/**
 * Typen – können bei Bedarf mit getAccountOverview harmonisiert werden.
 */

export type ProfileData = {
  id: string;
  displayName: string;
  email: string;
  preferredLocale: string;
  newsletterOptIn: boolean;
  avatarUrl?: string | null;
  coverUrl?: string | null;
};

export type PublicProfileData = {
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  bio?: string | null;
  tagline?: string | null;
  avatarStyle?: "initials" | "abstract" | "emoji";
  avatarUrl?: string | null;
  coverUrl?: string | null;
  topTopics?: Array<{
    key: TopicKey;
    title: string;
    statement?: string | null;
  }>;
  engagementLevel?: EngagementLevel | null;
  showRealName: boolean;
  showCity: boolean;
  showStats: boolean;
  showJoinDate: boolean;
  showEngagementLevel: boolean;
  showMembership: boolean;
  shareId?: string | null;
};

export type EDebattePackage =
  | "basis"
  | "start"
  | "pro"
  | "b2b_basis"
  | "b2b_pro"
  | "b2g_basis"
  | "b2g_pro"
  | "none";

export type EDebattePackageInfo = {
  package: EDebattePackage;
  status: "none" | "preorder" | "active" | "canceled";
  billingInterval?: "monthly" | "yearly";
  nextBillingDate?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  pledgeAmount?: number | null;
  pledgeInterval?: "once" | "monthly" | "yearly" | null;
  pledgeReference?: string | null;
  pledgeConfirmedAt?: string | null;
  commitmentMonths?: number | null;
  commitmentStartsAt?: string | null;
  commitmentEndsAt?: string | null;
};

export type UsageInfo = {
  swipesThisMonth: number;
  swipeLimit?: number | null;
  xpLevelLabel?: string | null;
};

export type MembershipInfo = {
  isMember: boolean;
  label?: string;
  statusLabel?: string;
  contributionLabel?: string;
};

export type RoleInfo = {
  id: string;
  label: string;
  description?: string;
  badge?: string;
  role?: UserRole;
};

export type SecurityInfo = {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  verificationLevel?: string | null;
  lastLoginAt?: string | null;
  loginHint?: string | null;
};

export type PaymentInfo = {
  ibanMasked?: string | null;
  bic?: string | null;
  accountHolder?: string | null;
  note?: string | null;
};

export type SignatureInfo = {
  hasSignature: boolean;
  updatedAt?: string | null;
};

type IdentityDocumentInfo = {
  documentType: "id_card" | "passport";
  frontImage: string;
  backImage?: string | null;
  updatedAt?: string | null;
};

export type FeatureFlags = {
  streamsEnabled: boolean;
  hostRightsEnabled: boolean;
  chatEnabled: boolean;
};

const FEATURE_INTEREST_OPTIONS: Array<{
  key: AccountFeatureInterestKey;
  title: string;
  description: string;
}> = [
  {
    key: "streams",
    title: "Streams & Sessions",
    description: "Eigene Streams und thematische Sessions für deine Community.",
  },
  {
    key: "hostRights",
    title: "Host-Rechte",
    description: "Moderation und Host-Freigabe für größere oder wiederkehrende Formate.",
  },
  {
    key: "chat",
    title: "Chat & Kollaboration",
    description: "Erweiterte Chat-Funktionen und kollaborative Arbeitsräume.",
  },
];

export type AccountOverview = {
  profile: ProfileData;
  publicProfile: PublicProfileData;
  edebatte: EDebattePackageInfo;
  usage: UsageInfo;
  membership: MembershipInfo;
  vogMembershipStatus?: string | null;
  hasVogMembership: boolean;
  membershipSnapshot?: {
    status?: string | null;
    paymentReference?: string | null;
    paymentInfo?: {
      mandateStatus?: string | null;
    } | null;
  } | null;
  roles: RoleInfo[];
  security: SecurityInfo;
  payment: PaymentInfo;
  signature: SignatureInfo;
  features: FeatureFlags;
  featureInterests: AccountFeatureInterestKey[];
};

type NormalizedOverview = AccountOverview;

export type AccountClientProps = {
  initialData: any;
  membershipNotice: boolean;
  preorderNotice: boolean;
  welcomeNotice: boolean;
};

export function AccountClient({ initialData, membershipNotice, preorderNotice, welcomeNotice }: AccountClientProps) {
  const [data, setData] = useState<NormalizedOverview>(normalizeOverview(initialData));
  const pendingMicroTransfer =
    data.membershipSnapshot?.status === "waiting_payment" &&
    data.membershipSnapshot?.paymentInfo?.mandateStatus === "pending_microtransfer";
  const identityPending = data.security.verificationLevel
    ? !["soft", "strong"].includes(data.security.verificationLevel)
    : !data.security.twoFactorEnabled;

  async function refreshOverview() {
    try {
      const res = await fetch("/api/account/overview", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.overview) {
        setData(normalizeOverview(body.overview));
      }
    } catch (err) {
      console.warn("[account] refresh overview failed", err);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {welcomeNotice && <WelcomeBanner />}
      {identityPending && <IdentityPendingBanner />}
      {membershipNotice && <MembershipBanner />}
      {pendingMicroTransfer && (
        <MicroTransferBanner paymentReference={data.membershipSnapshot?.paymentReference} />
      )}
      {preorderNotice && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-100">
          Vormerkung gespeichert. Wenn du eine E-Mail angegeben hast, senden wir dir eine Bestätigung. Die Vormerkung
          erscheint unten in deiner Übersicht.
        </div>
      )}

      <CompactProfileHubSection
        profile={data.profile}
        publicProfile={data.publicProfile}
        security={data.security}
        edebatte={data.edebatte}
        chatEnabled={data.features.chatEnabled}
        onRefresh={refreshOverview}
      />
    </div>
  );
}

export default AccountClient;

type SectionHeadingProps = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
};

function SectionHeading({ id, title, description, icon: Icon }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[rgb(var(--fg))]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-300/30">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>{title}</span>
      </h2>
      <p className="text-xs text-[rgb(var(--muted))]">{description}</p>
    </div>
  );
}

type CompactProfileHubSectionProps = {
  profile: ProfileData;
  publicProfile: PublicProfileData;
  security: SecurityInfo;
  edebatte: EDebattePackageInfo;
  chatEnabled: boolean;
  onRefresh: () => void;
};

type SocialFriendRequestItem = {
  id: string;
  fromLabel: string;
  message?: string | null;
  createdAt?: string | null;
};

type SocialMessageItem = {
  id: string;
  fromLabel: string;
  text: string;
  kind?: string;
  createdAt?: string | null;
  read: boolean;
};

type SocialSummary = {
  pendingRequestCount: number;
  unreadMessageCount: number;
  friendRequests: SocialFriendRequestItem[];
  recentMessages: SocialMessageItem[];
};

type SocialSummaryMeta = {
  store: "core";
  founderFlow:
    | "ensured"
    | "already_present"
    | "founder_not_found_fallback"
    | "target_is_founder"
    | "failed";
};

type AccountMatchItem = {
  id: string;
  displayName: string;
  sharedTopics: string[];
  locationLabel?: string | null;
  score: number;
};

type NameDisplayMode = "real_name" | "nickname";
type PersonalIdentityData = {
  givenName: string;
  familyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  displayMode: NameDisplayMode;
  nickname: string;
  inviteToken: string;
  referralCode: string;
  successfulInvites: number;
  rewardAnalysisStarts: number;
  lastReferralSuccessAt: string;
};
type AccountHubTab = "interests" | "inbox" | "profile";

const ACCOUNT_HUB_TABS: Array<{ key: AccountHubTab; label: string; icon: IconType }> = [
  { key: "interests", label: "Interessen", icon: FiSliders },
  { key: "inbox", label: "Inbox", icon: FiMessageCircle },
  { key: "profile", label: "Profil", icon: FiUser },
];

const MOBILE_QUICK_ACTIONS: Array<{ key: AccountHubTab | "invite"; label: string; icon: IconType }> = [
  { key: "interests", label: "Interessen", icon: FiSliders },
  { key: "inbox", label: "Inbox", icon: FiMessageCircle },
  { key: "profile", label: "Profil", icon: FiUser },
  { key: "invite", label: "Einladen", icon: FiSend },
];

const TOPIC_ICON_BY_KEY: Record<TopicKey, IconType> = {
  democracy: FiUsers,
  budget: FiCreditCard,
  economy: FiPackage,
  social: FiUserPlus,
  education: FiSearch,
  health: FiShield,
  climate: FiGlobe,
  energy: FiSliders,
  mobility: FiNavigation,
  interior: FiShield,
  justice: FiCheckCircle,
  migration: FiUsers,
  digital: FiMessageCircle,
  europe: FiGlobe,
  local: FiNavigation,
};

function truncateText(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function messageKindLabel(kind?: string) {
  if (kind === "founder_welcome") return "Founder";
  if (kind === "referral_signup") return "Referral";
  if (kind === "system_onboarding") return "Onboarding";
  return "Direkt";
}

const EMPTY_PERSONAL_IDENTITY: PersonalIdentityData = {
  givenName: "",
  familyName: "",
  street: "",
  postalCode: "",
  city: "",
  country: "DE",
  displayMode: "real_name",
  nickname: "",
  inviteToken: "",
  referralCode: "",
  successfulInvites: 0,
  rewardAnalysisStarts: 0,
  lastReferralSuccessAt: "",
};

function mapPersonalIdentity(value: any): PersonalIdentityData {
  return {
    givenName: typeof value?.givenName === "string" ? value.givenName : "",
    familyName: typeof value?.familyName === "string" ? value.familyName : "",
    street: typeof value?.street === "string" ? value.street : "",
    postalCode: typeof value?.postalCode === "string" ? value.postalCode : "",
    city: typeof value?.city === "string" ? value.city : "",
    country: typeof value?.country === "string" ? value.country : "DE",
    displayMode: value?.displayMode === "nickname" ? "nickname" : "real_name",
    nickname: typeof value?.nickname === "string" ? value.nickname : "",
    inviteToken: typeof value?.inviteToken === "string" ? value.inviteToken : "",
    referralCode: typeof value?.referralCode === "string" ? value.referralCode : "",
    successfulInvites: Number(value?.successfulInvites ?? 0) || 0,
    rewardAnalysisStarts: Number(value?.rewardAnalysisStarts ?? 0) || 0,
    lastReferralSuccessAt: typeof value?.lastReferralSuccessAt === "string" ? value.lastReferralSuccessAt : "",
  };
}

function normalizedPersonalIdentity(value: PersonalIdentityData) {
  return {
    givenName: value.givenName.trim(),
    familyName: value.familyName.trim(),
    street: value.street.trim(),
    postalCode: value.postalCode.trim(),
    city: value.city.trim(),
    country: value.country.trim().toUpperCase(),
    displayMode: value.displayMode,
    nickname: value.nickname.trim(),
    inviteToken: value.inviteToken.trim(),
    referralCode: value.referralCode.trim(),
  };
}

function CompactProfileHubSection({
  profile,
  publicProfile,
  security,
  edebatte,
  chatEnabled,
  onRefresh,
}: CompactProfileHubSectionProps) {
  const [activeTab, setActiveTab] = useState<AccountHubTab>("interests");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [tagline, setTagline] = useState(publicProfile.tagline ?? "");
  const [bio, setBio] = useState(publicProfile.bio ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<TopicKey[]>((publicProfile.topTopics ?? []).map((topic) => topic.key));
  const [profileSaving, setProfileSaving] = useState(false);
  const [interestsSaving, setInterestsSaving] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [interestMsg, setInterestMsg] = useState<string | null>(null);
  const [personalMsg, setPersonalMsg] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [personalInitial, setPersonalInitial] = useState<PersonalIdentityData>(EMPTY_PERSONAL_IDENTITY);
  const [personalDraft, setPersonalDraft] = useState<PersonalIdentityData>(EMPTY_PERSONAL_IDENTITY);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialSummary, setSocialSummary] = useState<SocialSummary>({
    pendingRequestCount: 0,
    unreadMessageCount: 0,
    friendRequests: [],
    recentMessages: [],
  });
  const [socialMeta, setSocialMeta] = useState<SocialSummaryMeta>({
    store: "core",
    founderFlow: "already_present",
  });
  const [socialError, setSocialError] = useState<string | null>(null);
  const [matches, setMatches] = useState<AccountMatchItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const invitePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "profil" || hash === "profile") {
      setActiveTab("profile");
      return;
    }
    if (hash === "interessen" || hash === "interests") {
      setActiveTab("interests");
      return;
    }
    if (hash === "inbox" || hash === "social") {
      setActiveTab("inbox");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = activeTab === "profile" ? "profil" : activeTab === "interests" ? "interessen" : "inbox";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${hash}`);
  }, [activeTab]);

  useEffect(() => {
    setDisplayName(profile.displayName ?? "");
    setTagline(publicProfile.tagline ?? "");
    setBio(publicProfile.bio ?? "");
    setAvatarPreview(profile.avatarUrl ?? null);
    setSelectedTopics((publicProfile.topTopics ?? []).map((topic) => topic.key));
  }, [profile.displayName, publicProfile.tagline, publicProfile.bio, publicProfile.topTopics]);

  useEffect(() => {
    let active = true;
    async function loadPersonalIdentity() {
      setPersonalLoading(true);
      try {
        const res = await fetch("/api/account/personal", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!active || !res.ok) return;
        const next = mapPersonalIdentity(body?.personal);
        setPersonalInitial(next);
        setPersonalDraft(next);
      } catch {
        if (!active) return;
      } finally {
        if (active) setPersonalLoading(false);
      }
    }
    void loadPersonalIdentity();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!copyMsg) return;
    const timeout = window.setTimeout(() => setCopyMsg(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyMsg]);

  const initialDisplayName = profile.displayName ?? "";
  const initialTagline = publicProfile.tagline ?? "";
  const initialBio = publicProfile.bio ?? "";
  const initialTopicKeyString = (publicProfile.topTopics ?? [])
    .map((topic) => topic.key)
    .join("|");
  const nextTopicKeyString = selectedTopics.join("|");

  const profileDirty =
    displayName.trim() !== initialDisplayName.trim() ||
    tagline.trim() !== initialTagline.trim() ||
    bio.trim() !== initialBio.trim();
  const interestsDirty = nextTopicKeyString !== initialTopicKeyString;

  const personalName = `${personalDraft.givenName} ${personalDraft.familyName}`.trim();
  const identityPublicName =
    personalDraft.displayMode === "nickname" ? personalDraft.nickname.trim() : personalName;
  const referralRewardsActive = personalDraft.rewardAnalysisStarts > 0;
  const inviteHandle =
    personalDraft.inviteToken.trim() ||
    personalDraft.referralCode.trim() ||
    publicProfile.shareId ||
    (profile.id ? `member-${profile.id.slice(-10)}` : "member");
  const invitePath = `/register?invite=${encodeURIComponent(inviteHandle)}`;
  const inviteText = inviteUrl || invitePath;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInviteUrl(`${window.location.origin}${invitePath}`);
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [invitePath]);

  const selectedTopicLabels = selectedTopics
    .map((key) => TOPIC_CHOICES.find((topic) => topic.key === key)?.label)
    .filter((label): label is string => Boolean(label));

  const displayNamePreview = displayName.trim() || "Dein Anzeigename";
  const taglinePreview = tagline.trim() || "Kurzprofil hinzufügen";
  const bioPreview = bio.trim()
    ? truncateText(bio.trim(), 130)
    : "Beschreibe kurz, wofür du dich politisch oder lokal einsetzt.";
  const hasPendingRequests = socialSummary.pendingRequestCount > 0;
  const hasUnreadMessages = socialSummary.unreadMessageCount > 0;
  const hasSelectedInterests = selectedTopics.length > 0;
  const hasEnoughInterests = selectedTopics.length >= 3;
  const inboxIsEmpty =
    !socialLoading && socialSummary.friendRequests.length === 0 && socialSummary.recentMessages.length === 0;
  const personalDirty =
    JSON.stringify(normalizedPersonalIdentity(personalDraft)) !==
    JSON.stringify(normalizedPersonalIdentity(personalInitial));

  const verificationLabel = security.verificationLevel
    ? security.verificationLevel === "strong"
      ? "Verifiziert"
      : "Basis-Verifikation"
    : security.twoFactorEnabled
      ? "2FA aktiv"
      : "Verifikation offen";
  const packageLabel =
    edebatte.status === "none"
      ? "Kein Paket"
      : edebatte.status === "active"
        ? getEDebatteLabel(edebatte.package)
        : "Paket vorgemerkt";
  const visibilityLabel =
    publicProfile.showRealName || publicProfile.showCity || publicProfile.showStats ? "Teilweise öffentlich" : "Privat";

  const formatDateLabel = (iso?: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const loadSocialSummary = useCallback(async () => {
    setSocialLoading(true);
    setSocialError(null);
    try {
      const res = await fetch("/api/account/social-summary", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok || !body?.summary) {
        throw new Error(body?.error || "social_summary_failed");
      }
      setSocialSummary({
        pendingRequestCount: Number(body.summary.pendingRequestCount ?? 0),
        unreadMessageCount: Number(body.summary.unreadMessageCount ?? 0),
        friendRequests: Array.isArray(body.summary.friendRequests) ? body.summary.friendRequests : [],
        recentMessages: Array.isArray(body.summary.recentMessages) ? body.summary.recentMessages : [],
      });
      setSocialMeta({
        store: "core",
        founderFlow:
          body?.meta?.founderFlow === "ensured" ||
          body?.meta?.founderFlow === "already_present" ||
          body?.meta?.founderFlow === "founder_not_found_fallback" ||
          body?.meta?.founderFlow === "target_is_founder"
            ? body.meta.founderFlow
            : "failed",
      });
    } catch (error: any) {
      setSocialSummary({
        pendingRequestCount: 0,
        unreadMessageCount: 0,
        friendRequests: [],
        recentMessages: [],
      });
      setSocialMeta({
        store: "core",
        founderFlow: "failed",
      });
      setSocialError(error?.message || "Social-Core aktuell nicht erreichbar.");
    } finally {
      setSocialLoading(false);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true);
    try {
      const res = await fetch("/api/account/matches", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "matches_failed");
      setMatches(Array.isArray(body.matches) ? body.matches : []);
    } catch {
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSocialSummary();
  }, [loadSocialSummary]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    const onFocus = () => {
      void loadSocialSummary();
      void loadMatches();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadMatches, loadSocialSummary]);

  const toggleTopic = (key: TopicKey) => {
    setSelectedTopics((prev) => {
      if (prev.includes(key)) return prev.filter((entry) => entry !== key);
      return [...prev, key];
    });
    setInterestMsg(null);
  };

  const copyInviteLink = async () => {
    if (!inviteText) return;
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopyMsg("Einladungslink kopiert");
    } catch {
      setCopyMsg("Kopieren nicht möglich");
    }
  };

  const shareInvite = async () => {
    if (!inviteText || typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    try {
      await navigator.share({
        title: "eDebatte Einladung",
        text: "Komm zu eDebatte",
        url: inviteText.startsWith("http") ? inviteText : undefined,
      });
    } catch {
      // user cancelled
    }
  };

  const openMailInvite = () => {
    const subject = encodeURIComponent("Komm zu eDebatte");
    const body = encodeURIComponent(
      `Hi,\n\nich lade dich zu eDebatte ein. Hier ist mein Profil bzw. Einstieg:\n${inviteText}\n\nBis bald!`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const openInviteQuickAccess = () => {
    setActiveTab("inbox");
    window.setTimeout(() => {
      invitePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 70);
  };

  const openAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("avatar_read_failed"));
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl.startsWith("data:image/")) {
        throw new Error("Bitte ein gültiges Bild auswählen.");
      }
      setAvatarPreview(dataUrl);
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Profilfoto konnte nicht gespeichert werden.");
      }
      setProfileMsg("Profilfoto aktualisiert");
      onRefresh();
    } catch (error: any) {
      setProfileMsg(error?.message || "Profilfoto konnte nicht gespeichert werden.");
    } finally {
      event.target.value = "";
      setAvatarUploading(false);
    }
  };

  const cancelProfileEdit = () => {
    setDisplayName(initialDisplayName);
    setTagline(initialTagline);
    setBio(initialBio);
    setProfileMsg(null);
    setProfileEditorOpen(false);
  };

  const saveProfile = async () => {
    if (!profileDirty) {
      setProfileMsg("Keine Änderung");
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      if (displayName.trim() !== initialDisplayName.trim()) {
        const settingsRes = await fetch("/api/account/settings", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ displayName: displayName.trim() }),
        });
        if (!settingsRes.ok) {
          const body = await settingsRes.json().catch(() => ({}));
          throw new Error(body?.error || "Anzeigename konnte nicht gespeichert werden.");
        }
      }

      if (tagline.trim() !== initialTagline.trim() || bio.trim() !== initialBio.trim()) {
        const profileRes = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            tagline: tagline.trim(),
            bio: bio.trim(),
          }),
        });
        if (!profileRes.ok) {
          const body = await profileRes.json().catch(() => ({}));
          throw new Error(body?.error || "Profil konnte nicht gespeichert werden.");
        }
      }

      setProfileMsg("Profil gespeichert");
      setProfileEditorOpen(false);
      onRefresh();
    } catch (error: any) {
      setProfileMsg(error?.message || "Speichern fehlgeschlagen");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveInterests = async () => {
    if (selectedTopics.length < 3) {
      setInterestMsg("Wähle mindestens 3 Interessen.");
      return;
    }
    if (!interestsDirty) {
      setInterestMsg("Keine Änderung");
      return;
    }

    setInterestsSaving(true);
    setInterestMsg(null);
    try {
      const profileRes = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topTopics: selectedTopics.map((key) => ({ key })),
        }),
      });
      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({}));
        throw new Error(body?.error || "Interessen konnten nicht gespeichert werden.");
      }
      setInterestMsg("Interessen gespeichert");
      void loadMatches();
      onRefresh();
    } catch (error: any) {
      setInterestMsg(error?.message || "Speichern fehlgeschlagen");
    } finally {
      setInterestsSaving(false);
    }
  };

  const savePersonalIdentity = async () => {
    const nickname = personalDraft.nickname.trim();
    if (personalDraft.displayMode === "nickname" && nickname.length < 2) {
      setPersonalMsg("Bitte gib einen Nickname mit mindestens 2 Zeichen an.");
      return;
    }
    if (!personalDirty) {
      setPersonalMsg("Keine Änderung");
      return;
    }

    setPersonalSaving(true);
    setPersonalMsg(null);
    try {
      const res = await fetch("/api/account/personal", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          givenName: personalDraft.givenName.trim(),
          familyName: personalDraft.familyName.trim(),
          street: personalDraft.street.trim(),
          postalCode: personalDraft.postalCode.trim(),
          city: personalDraft.city.trim(),
          country: personalDraft.country.trim().toUpperCase(),
          displayMode: personalDraft.displayMode,
          nickname,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Identität konnte nicht gespeichert werden.");
      }
      const next = mapPersonalIdentity(body?.personal);
      setPersonalDraft(next);
      setPersonalInitial(next);
      setPersonalMsg("Identität gespeichert");
    } catch (error: any) {
      setPersonalMsg(error?.message || "Speichern fehlgeschlagen");
    } finally {
      setPersonalSaving(false);
    }
  };

  return (
    <section className="space-y-3 pb-[calc(env(safe-area-inset-bottom)+5.8rem)] md:pb-4">
      <article className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3.5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] sm:p-5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={avatarUploading}
              aria-label="Profilfoto ändern"
              className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-emerald-500 text-base font-semibold text-white ring-1 ring-sky-300/35 transition hover:brightness-105 disabled:opacity-70"
            >
              {avatarPreview ? (
                <Image src={avatarPreview} alt={displayNamePreview} fill sizes="56px" className="object-cover" />
              ) : (
                <span>{displayNamePreview.slice(0, 2).toUpperCase()}</span>
              )}
              <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--card))] text-sky-400 ring-1 ring-[rgb(var(--border))]">
                <FiEdit2 className="h-2.5 w-2.5" aria-hidden />
              </span>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            <div className="min-w-0">
              <p className="truncate text-[1.02rem] font-semibold text-[rgb(var(--fg))]">{displayNamePreview}</p>
              <p className="truncate text-[12px] text-[rgb(var(--muted))]">{taglinePreview}</p>
              <p className="mt-0.5 text-[10px] text-[rgb(var(--muted))]">
                {avatarUploading ? "Profilfoto wird aktualisiert …" : "Profilfoto ändern"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-2 py-1 text-[10px] font-medium text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]">
            Konto-Überblick
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-2">
            <p className="inline-flex items-center gap-1 text-[10px] text-[rgb(var(--muted))]">
              <FiSliders className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Interessen
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-[rgb(var(--fg))]">{selectedTopics.length}</p>
          </div>
          <div
            className={`rounded-xl border px-2.5 py-2 ${
              hasPendingRequests
                ? "border-emerald-400/45 bg-emerald-500/10"
                : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            }`}
          >
            <p className="inline-flex items-center gap-1 text-[10px] text-[rgb(var(--muted))]">
              <FiUserPlus className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Anfragen
            </p>
            <p
              className={`mt-0.5 text-[15px] font-semibold ${
                hasPendingRequests ? "text-emerald-800 dark:text-emerald-100" : "text-[rgb(var(--fg))]"
              }`}
            >
              {socialLoading ? "…" : socialSummary.pendingRequestCount}
            </p>
          </div>
          <div
            className={`rounded-xl border px-2.5 py-2 ${
              hasUnreadMessages
                ? "border-sky-400/45 bg-sky-500/10"
                : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            }`}
          >
            <p className="inline-flex items-center gap-1 text-[10px] text-[rgb(var(--muted))]">
              <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Ungelesen
            </p>
            <p
              className={`mt-0.5 text-[15px] font-semibold ${
                hasUnreadMessages ? "text-sky-800 dark:text-sky-100" : "text-[rgb(var(--fg))]"
              }`}
            >
              {socialLoading ? "…" : socialSummary.unreadMessageCount}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--bg))] px-2.5 py-1 text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]">
            <FiShield className="h-3.5 w-3.5 text-sky-500" aria-hidden />
            {verificationLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--bg))] px-2.5 py-1 text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]">
            <FiGlobe className="h-3.5 w-3.5 text-sky-500" aria-hidden />
            {visibilityLabel}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-[rgb(var(--muted))]">Paketstatus: {packageLabel}</p>
        <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
          Start mit Interessen, dann Inbox. Profilpflege findest du im dritten Tab.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("interests")}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              activeTab === "interests" ? selectedSurfaceClass : secondaryLightButtonClass
            }`}
          >
            Interessen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              activeTab === "inbox" ? selectedSurfaceClass : secondaryLightButtonClass
            }`}
          >
            Inbox
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("profile");
              setProfileEditorOpen(true);
            }}
            className={primaryButtonSmallClass}
          >
            Profil bearbeiten
          </button>
        </div>
        {profileMsg && !profileEditorOpen ? (
          <p className="mt-2 text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
            {profileMsg}
          </p>
        ) : null}
      </article>

      <nav
        aria-label="Profil-Navigation"
        className="sticky top-2 z-20 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 p-0.5 backdrop-blur"
      >
        <div className="grid grid-cols-3 gap-0.5 rounded-xl bg-[rgb(var(--bg))]/80 p-0.5">
          {ACCOUNT_HUB_TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={active}
                className={`inline-flex min-h-[40px] items-center justify-center gap-1 rounded-[10px] px-1.5 text-[11px] font-semibold transition ${
                  active
                    ? selectedSurfaceClass
                    : "text-[rgb(var(--muted))] hover:bg-white/5 hover:text-[rgb(var(--fg))]"
                }`}
              >
                <tab.icon className={`h-3.5 w-3.5 ${active ? "text-sky-700 dark:text-sky-200" : "text-sky-500/90"}`} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === "profile" ? (
        <div className="space-y-3">
          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  <FiUser className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                  Profil-Vorschau
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Öffentliche Ansicht mit explizitem Edit-Modus. Änderungen an Name, Kurzprofil und Bio nur über „Profil bearbeiten“.
                </p>
              </div>
              <button type="button" onClick={() => setProfileEditorOpen(true)} className={primaryButtonSmallClass}>
                <FiEdit2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Profil bearbeiten
              </button>
            </div>
            <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Kurzprofil</p>
              <p className="mt-1 text-sm text-[rgb(var(--fg))]">{taglinePreview || "Noch kein Kurzprofil gesetzt."}</p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Selbstdarstellung</p>
              <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--fg))]">{bioPreview || "Noch keine Selbstdarstellung hinterlegt."}</p>
              {hasSelectedInterests ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedTopicLabels.slice(0, 5).map((label) => (
                    <span
                      key={`profile-interest-${label}`}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] ${selectedChipClass}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={`mt-3 ${subtleWarningClass}`}>
                  <p>Wähle mindestens 3 Interessen, damit Debatten und passende Menschen für dich priorisiert werden.</p>
                  <button type="button" onClick={() => setActiveTab("interests")} className={`${secondaryLightButtonClass} mt-2`}>
                    Jetzt Interessen wählen
                  </button>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              <FiMapPin className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Identität & Darstellung (direkt editierbar)
            </p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Diese Felder sind direkt editierbar. Registrierungsdaten (intern) und öffentliche Namensdarstellung sind getrennt.
              Stadt/Region helfen bei passender lokaler Priorisierung.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[11px] text-[rgb(var(--muted))]">Vorname</span>
                <input
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={personalDraft.givenName}
                  onChange={(event) =>
                    setPersonalDraft((prev) => ({ ...prev, givenName: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-[rgb(var(--muted))]">Nachname</span>
                <input
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={personalDraft.familyName}
                  onChange={(event) =>
                    setPersonalDraft((prev) => ({ ...prev, familyName: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="mt-2 grid gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-[rgb(var(--muted))]">Anschrift</span>
                <input
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Straße und Hausnummer"
                  value={personalDraft.street}
                  onChange={(event) =>
                    setPersonalDraft((prev) => ({ ...prev, street: event.target.value }))
                  }
                />
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="PLZ"
                  value={personalDraft.postalCode}
                  onChange={(event) =>
                    setPersonalDraft((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                />
                <input
                  className="col-span-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Stadt"
                  value={personalDraft.city}
                  onChange={(event) =>
                    setPersonalDraft((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
                <input
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm uppercase text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Land"
                  value={personalDraft.country}
                  onChange={(event) =>
                    setPersonalDraft((prev) => ({ ...prev, country: event.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-[11px] font-medium text-[rgb(var(--muted))]">Öffentliche Namensdarstellung</p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[rgb(var(--card))] p-1 ring-1 ring-[rgb(var(--border))]">
                <button
                  type="button"
                  onClick={() => setPersonalDraft((prev) => ({ ...prev, displayMode: "real_name" }))}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                    personalDraft.displayMode === "real_name"
                      ? selectedSurfaceClass
                      : "text-[rgb(var(--muted))]"
                  }`}
                >
                  Klarname
                </button>
                <button
                  type="button"
                  onClick={() => setPersonalDraft((prev) => ({ ...prev, displayMode: "nickname" }))}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                    personalDraft.displayMode === "nickname"
                      ? selectedSurfaceClass
                      : "text-[rgb(var(--muted))]"
                  }`}
                >
                  Nickname
                </button>
              </div>
              {personalDraft.displayMode === "nickname" ? (
                <label className="mt-2 block space-y-1">
                  <span className="text-[11px] text-[rgb(var(--muted))]">Nickname</span>
                  <input
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    value={personalDraft.nickname}
                    onChange={(event) =>
                      setPersonalDraft((prev) => ({ ...prev, nickname: event.target.value }))
                    }
                    placeholder="Dein öffentlicher Name"
                  />
                </label>
              ) : null}
              <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                Öffentlich sichtbar als:{" "}
                <span className="font-semibold text-[rgb(var(--fg))]">{identityPublicName || "Noch nicht gesetzt"}</span>
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={savePersonalIdentity}
                disabled={personalLoading || personalSaving || !personalDirty}
                className={`${primaryButtonClass} w-full sm:w-auto`}
              >
                <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {personalSaving ? "Speichert …" : "Identität speichern"}
              </button>
              {personalMsg ? (
                <p className="text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
                  {personalMsg}
                </p>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === "interests" ? (
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              <FiSliders className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Interessen (mind. 3)
            </p>
            <span className="inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]">
              {selectedTopics.length} gewählt
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2.5">
            <p className="text-xs text-[rgb(var(--fg))]">
              Interessen steuern Vorschläge in Debatten, Matching in der Inbox und deine Community-Priorisierung.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("inbox")}
                disabled={!hasEnoughInterests}
                className={secondaryLightButtonClass}
              >
                Weiter zur Inbox
              </button>
              <button type="button" onClick={() => setActiveTab("profile")} className={ghostDarkButtonClass}>
                Profil ansehen
              </button>
            </div>
          </div>

          <div className="mt-3 flex min-h-[36px] flex-wrap gap-1.5">
            {selectedTopicLabels.length > 0 ? (
              selectedTopicLabels.map((label) => (
                <span
                  key={label}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${selectedChipClass}`}
                >
                  {label}
                </span>
              ))
            ) : (
              <div className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                <p className="inline-flex items-center gap-1.5">
                  <FiSliders className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                  Wähle mindestens 3 Themen, damit passende Debatten und Kontakte sichtbarer werden.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TOPIC_CHOICES.map((topic) => {
              const active = selectedTopics.includes(topic.key);
              const TopicIcon = TOPIC_ICON_BY_KEY[topic.key] ?? FiSliders;
              return (
                <button
                  key={topic.key}
                  type="button"
                  onClick={() => toggleTopic(topic.key)}
                  className={`inline-flex min-h-[52px] items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition ${
                    active
                      ? selectedSurfaceClass
                      : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                  }`}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950/40 text-sky-400 ring-1 ring-sky-400/30">
                    <TopicIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="flex-1 leading-tight">{topic.label}</span>
                  {active ? <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
          {!hasEnoughInterests ? (
            <p className="mt-2 text-xs text-amber-900 dark:text-amber-100">
              Wähle mindestens 3 Interessen. Mehr Themen verbessern Matching und Relevanz.
            </p>
          ) : (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Du kannst 3 oder mehr Interessen auswählen.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={saveInterests}
              disabled={interestsSaving || !interestsDirty || !hasEnoughInterests}
              className={`${primaryButtonClass} w-full`}
            >
              <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {interestsSaving ? "Speichert …" : "Interessen speichern"}
            </button>
            {hasEnoughInterests ? (
              <button type="button" onClick={() => setActiveTab("inbox")} className={`${secondaryLightButtonClass} w-full`}>
                Zur Inbox wechseln
              </button>
            ) : null}
            {interestMsg ? (
              <p className="text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
                {interestMsg}
              </p>
            ) : null}
          </div>
        </article>
      ) : null}

      {activeTab === "inbox" ? (
        <article className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Freundschaftsanfragen & Nachrichten
            </p>
            <button
              type="button"
              onClick={() => void loadSocialSummary()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--bg))] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))] transition hover:text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-sky-200"
              aria-label="Inbox aktualisieren"
            >
              <FiRefreshCw className="h-3.5 w-3.5 text-sky-500" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className={`rounded-2xl border px-3 py-2 ${
                hasPendingRequests
                  ? "border-emerald-400/50 bg-emerald-500/10"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Anfragen</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  hasPendingRequests ? "text-emerald-800 dark:text-emerald-100" : "text-[rgb(var(--fg))]"
                }`}
              >
                {socialLoading ? "…" : socialSummary.pendingRequestCount}
              </p>
            </div>
            <div
              className={`rounded-2xl border px-3 py-2 ${
                hasUnreadMessages
                  ? "border-sky-400/50 bg-sky-500/10"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Ungelesen</p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  hasUnreadMessages ? "text-sky-800 dark:text-sky-100" : "text-[rgb(var(--fg))]"
                }`}
              >
                {socialLoading ? "…" : socialSummary.unreadMessageCount}
              </p>
            </div>
          </div>

          {socialError ? (
            <div className="rounded-2xl border border-rose-300/55 bg-rose-100/80 px-3 py-2 text-xs text-rose-900 dark:border-rose-500/35 dark:bg-rose-500/14 dark:text-rose-100">
              Social-Core Status: {socialError}
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
              Core-Social aktiv · Founder-Flow:{" "}
              <span className="font-semibold text-[rgb(var(--fg))]">
                {socialMeta.founderFlow === "ensured"
                  ? "neu gesichert"
                  : socialMeta.founderFlow === "already_present"
                    ? "bereits vorhanden"
                    : socialMeta.founderFlow === "founder_not_found_fallback"
                      ? "Fallback aktiv"
                      : socialMeta.founderFlow === "target_is_founder"
                        ? "Founder-Konto"
                        : "Fehler"}
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                <FiUserPlus className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                Neueste Anfragen
              </p>
              <span className="text-[11px] text-[rgb(var(--muted))]">
                {socialLoading ? "…" : socialSummary.pendingRequestCount}
              </span>
            </div>
            {socialLoading ? (
              <p className="text-xs text-[rgb(var(--muted))]">Lade Inbox …</p>
            ) : socialSummary.friendRequests.length > 0 ? (
              <div className="space-y-2">
                {socialSummary.friendRequests.map((request) => (
                  <div key={request.id} className="flex items-start justify-between gap-2 text-xs">
                    <p className="min-w-0 text-[rgb(var(--fg))]">
                      <span className="font-semibold">{request.fromLabel}</span>
                      {request.message ? ` · ${truncateText(request.message, 54)}` : ""}
                    </p>
                    <span className="shrink-0 text-[10px] text-[rgb(var(--muted))]">{formatDateLabel(request.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[rgb(var(--muted))]">
                Noch keine offenen Anfragen. Lade Kontakte ein, damit hier neue Verbindungen erscheinen.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                Letzte Nachrichten
              </p>
              <span className="text-[11px] text-[rgb(var(--muted))]">
                {chatEnabled ? "Nachrichten lesen aktiv" : "Direktnachrichten noch im Ausbau"}
              </span>
            </div>
            {socialLoading ? (
              <p className="text-xs text-[rgb(var(--muted))]">Lade Nachrichten …</p>
            ) : socialSummary.recentMessages.length > 0 ? (
              <div className="space-y-2">
                {socialSummary.recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="min-w-0 text-[rgb(var(--fg))]">
                        <span className="font-semibold">{message.fromLabel}:</span> {truncateText(message.text, 56)}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                        {messageKindLabel(message.kind)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-[rgb(var(--muted))]">{formatDateLabel(message.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[rgb(var(--muted))]">
                Noch keine neuen Nachrichten. Wenn du Freunde hinzufügst, startet hier deine Inbox.
              </p>
            )}
            <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
              Direktnachrichten senden ist noch nicht freigeschaltet. Aktuell zeigt die Inbox empfangene System-/Founder-Nachrichten und Verbindungsstatus.
            </p>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                <FiUsers className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                Gleichgesinnte finden
              </p>
              <span className="text-[11px] text-[rgb(var(--muted))]">Interessen + Region</span>
            </div>
            {matchesLoading ? (
              <p className="text-xs text-[rgb(var(--muted))]">Suche passende Menschen …</p>
            ) : matches.length > 0 ? (
              <div className="space-y-2">
                {matches.slice(0, 5).map((match) => (
                  <div key={match.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs">
                    <p className="font-semibold text-[rgb(var(--fg))]">{match.displayName}</p>
                    <p className="mt-0.5 text-[rgb(var(--muted))]">
                      Gemeinsam: {match.sharedTopics.join(", ")}
                      {match.locationLabel ? ` · ${match.locationLabel}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[rgb(var(--muted))]">
                Noch keine Matches sichtbar. Mit mindestens 3 Interessen und Ortsangabe steigen die Treffer.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTab("interests")} className={secondaryLightButtonClass}>
                Interessen schärfen
              </button>
              <Link href="/community" className={ghostDarkButtonClass}>
                Community-Hub
              </Link>
            </div>
          </div>

          {inboxIsEmpty ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))]">
              <p className="inline-flex items-center gap-1.5 font-medium text-[rgb(var(--fg))]">
                <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                Deine Inbox ist startklar.
              </p>
              <p className="mt-1">Lade Freund:innen ein oder schau in die Community, um erste Kontakte und Nachrichten zu erhalten.</p>
            </div>
          ) : null}

          <div ref={invitePanelRef} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              <FiSend className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Freunde einladen
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Dein persönlicher Einladungslink. Bei Registrierung über diesen Link wird die Verbindung direkt hergestellt.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div
                className={`rounded-xl border px-3 py-2 ${
                  personalDraft.successfulInvites > 0
                    ? "border-emerald-400/50 bg-emerald-500/10"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Erfolgreich</p>
                <p
                  className={`mt-1 text-base font-semibold ${
                    personalDraft.successfulInvites > 0 ? "text-emerald-800 dark:text-emerald-100" : "text-[rgb(var(--fg))]"
                  }`}
                >
                  {personalDraft.successfulInvites}
                </p>
              </div>
              <div
                className={`rounded-xl border px-3 py-2 ${
                  referralRewardsActive
                    ? "border-sky-400/50 bg-sky-500/10"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Bonus-Starts</p>
                <p
                  className={`mt-1 text-base font-semibold ${
                    referralRewardsActive ? "text-sky-800 dark:text-sky-100" : "text-[rgb(var(--fg))]"
                  }`}
                >
                  {personalDraft.rewardAnalysisStarts}
                </p>
              </div>
            </div>
            {personalDraft.lastReferralSuccessAt ? (
              <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                Letzte erfolgreiche Einladung: {formatDateLabel(personalDraft.lastReferralSuccessAt)}
              </p>
            ) : null}
            <p className="mt-2 truncate rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
              {inviteText}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={copyInviteLink} className={`${secondaryLightButtonClass} w-full`}>
                <FiCopy className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
                Link kopieren
              </button>
              {canNativeShare ? (
                <button type="button" onClick={shareInvite} className={`${primaryButtonSmallClass} w-full`}>
                  <FiSend className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Teilen
                </button>
              ) : (
                <button type="button" onClick={openMailInvite} className={`${primaryButtonSmallClass} w-full`}>
                  <FiMail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Per E-Mail
                </button>
              )}
              <Link href="/community" className={`${ghostDarkButtonClass} w-full`}>
                <FiUsers className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
                Community beitreten
              </Link>
            </div>
            {canNativeShare ? (
              <button type="button" onClick={openMailInvite} className={`${secondaryLightButtonClass} mt-2 w-full`}>
                <FiMail className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
                Per E-Mail einladen
              </button>
            ) : null}
            {copyMsg ? <p className="mt-2 text-xs text-[rgb(var(--muted))]">{copyMsg}</p> : null}
          </div>
        </article>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 px-3 py-2 pb-[max(env(safe-area-inset-bottom),0.65rem)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
          {MOBILE_QUICK_ACTIONS.map((action) => {
            const active = action.key !== "invite" && activeTab === action.key;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => {
                  if (action.key === "invite") {
                    openInviteQuickAccess();
                    return;
                  }
                  setActiveTab(action.key);
                }}
                className={`inline-flex min-h-[42px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 text-[10px] font-semibold ${
                  active
                    ? selectedSurfaceClass
                    : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                }`}
              >
                <action.icon className="h-3.5 w-3.5" aria-hidden />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {profileEditorOpen ? (
        <div className="fixed inset-0 z-[95] bg-slate-950/65 p-3 backdrop-blur-[2px] sm:p-5" onClick={cancelProfileEdit}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-hidden rounded-t-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[0_28px_70px_rgba(2,6,23,0.65)] sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[560px] sm:max-w-[calc(100vw-2.5rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                <FiUser className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                Profil bearbeiten
              </p>
              <button type="button" onClick={cancelProfileEdit} className={secondaryLightButtonClass}>
                Abbrechen
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-4 py-4">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[rgb(var(--muted))]">Anzeigename</span>
                <input
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[rgb(var(--muted))]">Kurzprofil</span>
                <input
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value)}
                  placeholder="z. B. Studentin, Lokaljournalist, Klima-Aktiv"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[rgb(var(--muted))]">Selbstdarstellung</span>
                <textarea
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Was treibt dich politisch oder lokal an?"
                />
              </label>
            </div>

            <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={cancelProfileEdit} className={`${secondaryLightButtonClass} w-full`}>
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving || !profileDirty}
                  className={`${primaryButtonClass} w-full`}
                >
                  <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {profileSaving ? "Speichert …" : "Speichern"}
                </button>
              </div>
              {profileMsg ? (
                <p className="mt-2 text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
                  {profileMsg}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function normalizeOverview(src: any): AccountOverview {
  const paymentProfile = src?.paymentProfile ?? null;
  const profileFlags = src?.profile?.publicFlags ?? {};
  const publicProfileSource = src?.publicProfile ?? {};
  const publicLocation = src?.profile?.publicLocation ?? {};
  const topTopicsSource = publicProfileSource?.topTopics ?? src?.profile?.topTopics ?? [];
  const topTopics: PublicProfileData["topTopics"] = Array.isArray(topTopicsSource)
    ? topTopicsSource
        .map((topic: any) => {
          if (!topic) return null;
          const candidateKey = String(typeof topic === "string" ? topic : topic.key ?? topic.title ?? "")
            .trim()
            .toLowerCase();
          const known = TOPIC_CHOICES.find(
            (entry) => entry.key === candidateKey || entry.label.toLowerCase() === candidateKey,
          );
          if (!known) return null;
          const statement =
            typeof topic === "object" && typeof topic.statement === "string"
              ? topic.statement.trim().slice(0, 140)
              : null;
          return {
            key: known.key,
            title: known.label,
            statement: statement && statement.length > 0 ? statement : null,
          };
        })
        .filter(
          (topic): topic is { key: TopicKey; title: string; statement: string | null } => Boolean(topic),
        )
    : [];

  const profile: ProfileData = {
    id: src?.profile?.id ?? src?.id ?? "",
    displayName: src?.profile?.displayName ?? src?.displayName ?? "Dein Anzeigename",
    email: src?.profile?.email ?? src?.email ?? "",
    preferredLocale: src?.profile?.preferredLocale ?? src?.preferredLocale ?? "de",
    newsletterOptIn: Boolean(src?.profile?.newsletterOptIn ?? src?.newsletterOptIn),
    avatarUrl: src?.profile?.avatarUrl ?? null,
    coverUrl: src?.profile?.coverUrl ?? null,
  };

  const publicProfile: PublicProfileData = {
    city: publicProfileSource?.city ?? publicLocation.city ?? null,
    region: publicProfileSource?.region ?? publicLocation.region ?? null,
    countryCode: publicProfileSource?.countryCode ?? publicLocation.countryCode ?? null,
    bio: publicProfileSource?.bio ?? src?.profile?.bio ?? "",
    tagline: publicProfileSource?.tagline ?? src?.profile?.tagline ?? "",
    avatarStyle: publicProfileSource?.avatarStyle ?? src?.profile?.avatarStyle ?? "initials",
    avatarUrl: publicProfileSource?.avatarUrl ?? src?.profile?.avatarUrl ?? null,
    coverUrl: publicProfileSource?.coverUrl ?? src?.profile?.coverUrl ?? null,
    topTopics,
    engagementLevel: src?.stats?.engagementLevel ?? null,
    showRealName: Boolean(publicProfileSource?.showRealName ?? profileFlags.showRealName),
    showCity: Boolean(publicProfileSource?.showCity ?? profileFlags.showCity),
    showStats: Boolean(publicProfileSource?.showStats ?? profileFlags.showStats),
    showJoinDate: Boolean(publicProfileSource?.showJoinDate ?? profileFlags.showJoinDate),
    showEngagementLevel: Boolean(publicProfileSource?.showEngagementLevel ?? profileFlags.showEngagementLevel),
    showMembership: Boolean(publicProfileSource?.showMembership ?? profileFlags.showMembership),
    shareId: publicProfileSource?.shareId ?? src?.profile?.publicShareId ?? null,
  };

  const edebatte: EDebattePackageInfo = {
    package: src?.edebatte?.package ?? "none",
    status: src?.edebatte?.status ?? "none",
    billingInterval: src?.edebatte?.billingInterval,
    nextBillingDate: src?.edebatte?.nextBillingDate ?? null,
    validFrom: src?.edebatte?.validFrom ?? null,
    validTo: src?.edebatte?.validTo ?? null,
    pledgeAmount: src?.edebatte?.pledgeAmount ?? null,
    pledgeInterval: src?.edebatte?.pledgeInterval ?? null,
    pledgeReference: src?.edebatte?.pledgeReference ?? null,
    pledgeConfirmedAt: src?.edebatte?.pledgeConfirmedAt ?? null,
    commitmentMonths: src?.edebatte?.commitmentMonths ?? null,
    commitmentStartsAt: src?.edebatte?.commitmentStartsAt ?? null,
    commitmentEndsAt: src?.edebatte?.commitmentEndsAt ?? null,
  };

  const usage: UsageInfo = {
    swipesThisMonth: src?.usage?.swipesThisMonth ?? 0,
    swipeLimit: src?.usage?.swipeLimit ?? null,
    xpLevelLabel: src?.usage?.xpLevelLabel ?? null,
  };

  const membership: MembershipInfo = {
    isMember: Boolean(src?.membership?.isMember),
    label: src?.membership?.label,
    statusLabel: src?.membership?.statusLabel,
    contributionLabel: src?.membership?.contributionLabel,
  };

  const vogMembershipStatus = src?.vogMembershipStatus ?? src?.membershipSnapshot?.status ?? null;
  const hasVogMembership = Boolean(src?.hasVogMembership ?? vogMembershipStatus === "active");

  const roles: RoleInfo[] = Array.isArray(src?.roles)
    ? src.roles.map((r: any, idx: number) =>
        typeof r === "string"
          ? { id: String(idx), label: r, role: r as UserRole }
          : {
              id: r.id ?? String(idx),
              label: r.label ?? r.role ?? "Rolle",
              description: r.description,
              badge: r.badge,
              role: r.role,
            },
      )
    : [];

  const security: SecurityInfo = {
    emailVerified: Boolean(src?.security?.emailVerified ?? src?.emailVerified ?? src?.verifiedEmail ?? src?.verification?.email),
    twoFactorEnabled: Boolean(
      src?.security?.twoFactorEnabled ??
        src?.security?.twoFactor ??
        src?.verification?.twoFA?.enabled ??
        src?.verification?.twoFA?.secret,
    ),
    verificationLevel: src?.verificationLevel ?? src?.verification?.level ?? null,
    lastLoginAt: src?.security?.lastLoginAt
      ? String(src.security.lastLoginAt)
      : src?.lastLoginAt
      ? String(src.lastLoginAt)
      : null,
    loginHint: src?.security?.loginHint ?? null,
  };

  const payment: PaymentInfo = {
    ibanMasked: src?.payment?.ibanMasked ?? paymentProfile?.ibanMasked ?? src?.membership?.paymentInfo?.bankIbanMasked ?? null,
    bic: src?.payment?.bic ?? paymentProfile?.bic ?? src?.membership?.paymentInfo?.bankBic ?? null,
    accountHolder: src?.payment?.accountHolder ?? paymentProfile?.holderName ?? src?.membership?.paymentInfo?.bankRecipient ?? null,
    note: src?.payment?.note ?? src?.membership?.paymentInfo?.reference ?? null,
  };

  const signature: SignatureInfo = {
    hasSignature: Boolean(src?.signature?.hasSignature),
    updatedAt: src?.signature?.updatedAt ?? null,
  };

  const features: FeatureFlags = {
    streamsEnabled: Boolean(src?.features?.streamsEnabled),
    hostRightsEnabled: Boolean(src?.features?.hostRightsEnabled),
    chatEnabled: Boolean(src?.features?.chatEnabled),
  };
  const featureInterests = Array.isArray(src?.featureInterests)
    ? src.featureInterests
        .map((value: unknown) => String(value ?? "").trim())
        .filter((value: string): value is AccountFeatureInterestKey =>
          FEATURE_INTEREST_OPTIONS.some((option) => option.key === value),
        )
    : [];

  return {
    profile,
    publicProfile,
    edebatte,
    usage,
    membership,
    vogMembershipStatus,
    hasVogMembership,
    membershipSnapshot: src?.membershipSnapshot ?? null,
    roles,
    security,
    payment,
    signature,
    features,
    featureInterests,
  };
}

/* -------------------------------------------------------
 * Banner nach erfolgreicher eDebatte-Bestellung
 * ---------------------------------------------------- */

function MembershipBanner() {
  return (
    <section
      aria-label="Bestätigung eDebatte-Paket"
      className="rounded-3xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-100"
    >
      <p className="font-medium">Vielen Dank für deine Vormerkung von eDebatte!</p>
      <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
        Dein eDebatte-Paket ist in deinem Konto hinterlegt. Sobald eDebatte startet, erhältst du eine separate Bestätigung mit allen Details per
        E-Mail.
      </p>
    </section>
  );
}

function WelcomeBanner() {
  return (
    <section
      aria-label="Willkommen"
      className="rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-sm dark:border-sky-500/35 dark:bg-sky-500/12 dark:text-sky-100"
    >
      <p className="font-medium">Herzlich willkommen! Dein Konto ist jetzt vollständig eingerichtet.</p>
      <p className="mt-1 text-xs text-sky-800 dark:text-sky-200">
        Du kannst dein Profil anpassen, Benachrichtigungen einstellen und dein eDebatte-Paket auswählen.
      </p>
    </section>
  );
}

function IdentityPendingBanner() {
  const resumeUrl = "/register/identity?next=%2Faccount%3Fwelcome%3D1";
  return (
    <section
      aria-label="Identitätsprüfung offen"
      className="rounded-3xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-100"
    >
      <p className="font-medium">Identitätsprüfung noch offen.</p>
      <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
        Für verifizierte Aktionen brauchst du noch den Authenticator-Schritt. Das dauert nur eine Minute.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={resumeUrl} className={primaryButtonSmallClass}>
          Jetzt verifizieren
        </Link>
        <Link href="/account/security" className={secondaryLightButtonClass}>
          Sicherheitsprofil
        </Link>
      </div>
    </section>
  );
}

function MicroTransferBanner({ paymentReference }: { paymentReference?: string | null }) {
  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900 shadow-[0_16px_50px_rgba(14,116,144,0.12)] dark:border-sky-500/35 dark:bg-sky-500/12 dark:text-sky-100">
      <p className="font-semibold">Deine Mitgliedschaft wartet auf die 0,01 €-Verifikation.</p>
      <p className="mt-1 text-xs text-sky-800 dark:text-sky-200">
        Sobald der TAN-Code aus der 0,01 €-Überweisung vorliegt, kannst du ihn im Zahlungsprofil
        eingeben.
      </p>
      {paymentReference && (
        <p className="mt-2 text-[11px] text-sky-700 dark:text-sky-200">
          Beitrags-Verwendungszweck: <span className="font-semibold">{paymentReference}</span>
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/account/payment" className={primaryButtonSmallClass}>
          TAN-Code eingeben
        </Link>
        <Link href="/account/payment" className={secondaryLightButtonClass}>
          Zahlungsprofil öffnen
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
 * Section A: Profil & eDebatte-Paket
 * ---------------------------------------------------- */

type ProfileAndPackageSectionProps = {
  profile: ProfileData;
  edebatte: EDebattePackageInfo;
  usage: UsageInfo;
  onRefresh: () => void;
};

function ProfileAndPackageSection({ profile, edebatte, usage, onRefresh }: ProfileAndPackageSectionProps) {
  return (
    <section aria-labelledby="account-core-heading" className="space-y-4">
      <SectionHeading
        id="account-core-heading"
        title="Profil & eDebatte-Paket"
        description="Passe dein Profil an und behalte dein gewähltes eDebatte-Paket im Blick."
        icon={FiUser}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.6fr)]">
        <ProfileCard profile={profile} onRefresh={onRefresh} />
        <EDebattePackageCard edebatte={edebatte} usage={usage} onRefresh={onRefresh} />
      </div>
    </section>
  );
}

/* -------------------------------------------------------
 * Profilkarte mit Avatar & Cover à la LinkedIn/Facebook
 * ---------------------------------------------------- */

type ProfileCardProps = {
  profile: ProfileData;
  onRefresh: () => void;
};

function ProfileCard({ profile, onRefresh }: ProfileCardProps) {
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);
  const coverPreviewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
      if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
    };
  }, []);

  const hasChanges =
    draft.displayName !== profile.displayName ||
    draft.preferredLocale !== profile.preferredLocale ||
    draft.newsletterOptIn !== profile.newsletterOptIn;

  const handleFieldChange = (patch: Partial<ProfileData>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const uploadProfileImage = async (kind: "avatarUrl" | "coverUrl", file: File) => {
    if (file.size > 600_000) {
      setSaveMsg("Bild zu groß. Bitte unter 600 KB bleiben.");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setSaving(false);
        setSaveMsg("Bild konnte nicht geladen werden.");
        return;
      }
      setDraft((prev) => ({ ...prev, [kind]: dataUrl }));
      try {
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ [kind]: dataUrl }),
        });
        if (!res.ok) throw new Error("Upload fehlgeschlagen");
        setSaveMsg(kind === "avatarUrl" ? "Profilfoto aktualisiert." : "Titelbild aktualisiert.");
        onRefresh();
      } catch (err) {
        console.warn("[account] upload failed", err);
        setSaveMsg("Upload fehlgeschlagen. Bitte erneut versuchen.");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
    avatarPreviewUrlRef.current = previewUrl;
    setDraft((prev) => ({ ...prev, avatarUrl: previewUrl }));
    void uploadProfileImage("avatarUrl", file);
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (coverPreviewUrlRef.current) URL.revokeObjectURL(coverPreviewUrlRef.current);
    coverPreviewUrlRef.current = previewUrl;
    setDraft((prev) => ({ ...prev, coverUrl: previewUrl }));
    void uploadProfileImage("coverUrl", file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasChanges) {
      setSaveMsg("Keine Aenderung");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: draft.displayName,
        preferredLocale: draft.preferredLocale,
        newsletterOptIn: draft.newsletterOptIn,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Speichern fehlgeschlagen");
        setSaveMsg("Gespeichert");
        onRefresh();
      })
      .catch((err) => {
        console.warn("[account] settings update failed", err);
        setSaveMsg("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      })
      .finally(() => setSaving(false));
  };

  const initials =
    draft.displayName
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || "VO";

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl bg-[rgb(var(--card))] shadow-[0_22px_65px_rgba(15,23,42,0.10)] ring-1 ring-[rgb(var(--border))]">
      {/* Cover / Hintergrund */}
      <div className="relative h-28 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500">
        {draft.coverUrl && <Image src={draft.coverUrl} alt="Profil-Hintergrundbild" fill sizes="100vw" className="object-cover" />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

        <div className="absolute right-4 bottom-3">
          <button
            type="button"
            onClick={handleCoverClick}
            className="pointer-events-auto inline-flex items-center rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            Titelbild ändern
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" onChange={handleCoverChange} />
        </div>
      </div>

      {/* Inhalt */}
      <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
        {/* Avatar + Name */}
        <div className="-mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[rgb(var(--bg))] text-lg font-semibold text-[rgb(var(--muted))] shadow-[0_12px_35px_rgba(15,23,42,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              aria-label="Profilfoto ändern"
            >
              {draft.avatarUrl ? (
                <Image src={draft.avatarUrl} alt={draft.displayName || "Profilfoto"} fill sizes="80px" className="rounded-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
              <span className="pointer-events-none absolute bottom-0 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-[11px] font-bold text-white ring-2 ring-white">
                +
              </span>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[rgb(var(--muted))]">Profil</p>
              <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{draft.displayName || "Dein Anzeigename"}</h3>
              <p className="text-xs text-[rgb(var(--muted))]">{draft.email}</p>
            </div>
          </div>
        </div>

        {/* Form-Felder */}
        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="displayName" className="text-xs font-medium text-[rgb(var(--muted))]">
              Anzeigename
            </label>
            <input
              id="displayName"
              name="displayName"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-inner focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={draft.displayName}
              onChange={(event) => handleFieldChange({ displayName: event.target.value })}
            />
            <p className="text-[11px] text-[rgb(var(--muted))]">So wirst du in der Plattform und in öffentlichen Profilen angezeigt.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[rgb(var(--muted))]">E-Mail-Adresse</span>
              <p className="truncate text-sm text-[rgb(var(--muted))]">{draft.email}</p>
              <p className="text-[11px] text-[rgb(var(--muted))]">Änderungen der E-Mail-Adresse sind aus Sicherheitsgründen nur über den Support möglich.</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="preferredLocale" className="text-xs font-medium text-[rgb(var(--muted))]">
                Bevorzugte Sprache
              </label>
              <select
                id="preferredLocale"
                name="preferredLocale"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={draft.preferredLocale}
                onChange={(event) => handleFieldChange({ preferredLocale: event.target.value })}
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-start gap-2 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
            <input
              type="checkbox"
              className="mt-[2px] h-4 w-4 rounded border-[rgb(var(--border))] text-sky-600 focus:ring-sky-500"
              checked={draft.newsletterOptIn}
              onChange={(event) => handleFieldChange({ newsletterOptIn: event.target.checked })}
            />
            <span>Ich möchte gelegentlich Updates zur Plattform, neuen Funktionen und Einladungen zu Streams erhalten.</span>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button type="submit" className={`${primaryButtonClass} w-full sm:w-auto`} disabled={saving || !hasChanges}>
            <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {saving ? "Speichert …" : "Änderungen speichern"}
          </button>
          {saveMsg && (
            <p className="text-xs text-[rgb(var(--muted))] sm:ml-1" role="status" aria-live="polite">
              {saveMsg}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------
 * eDebatte-Paket-Karte
 * ---------------------------------------------------- */

type EDebattePackageCardProps = {
  edebatte: EDebattePackageInfo;
  usage: UsageInfo;
  onRefresh: () => void;
};

function getEDebatteLabel(pkg: EDebattePackage): string {
  if (pkg === "none") return "Noch kein eDebatte-Paket";
  const found = EDEBATTE_PACKAGES_DE.find((plan) => plan.id === pkg);
  return found?.titel ?? "Noch kein eDebatte-Paket";
}

function getEDebatteStatusLabel(info: EDebattePackageInfo): string {
  switch (info.status) {
    case "preorder":
      return "Vorgemerkt – unverbindlich, ohne Zahlung. Wir informieren dich zum Start.";
    case "active":
      return "Aktiv";
    case "canceled":
      return "Beendet – Zugriff läuft zum angegebenen Datum aus.";
    case "none":
    default:
      return "Du kannst jederzeit ein eDebatte-Paket wählen.";
  }
}

function EDebattePackageCard({ edebatte, usage, onRefresh }: EDebattePackageCardProps) {
  const [showModal, setShowModal] = useState(false);

  const isNone = edebatte.status === "none";

  const label = getEDebatteLabel(edebatte.package);
  const statusLabel = getEDebatteStatusLabel(edebatte);
  const pledgeAmount = formatEuro(edebatte.pledgeAmount);
  const pledgeIntervalLabel =
    edebatte.pledgeInterval === "yearly"
      ? "Jahr"
      : edebatte.pledgeInterval === "once"
        ? "einmalig"
        : "Monat";

  const swipeLimitText =
    typeof usage.swipeLimit === "number"
      ? `${usage.swipesThisMonth} / ${usage.swipeLimit} Swipes in diesem Monat`
      : `${usage.swipesThisMonth} Swipes in diesem Monat`;

  const primaryCtaLabel = isNone ? "Paket auswählen" : "Paket wechseln";

  return (
    <>
      <section className="flex h-full flex-col justify-between rounded-3xl bg-slate-900 text-slate-50 shadow-[0_22px_65px_rgba(15,23,42,0.65)] ring-1 ring-[rgb(var(--border))]">
        <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                <FiPackage className="h-3.5 w-3.5" aria-hidden />
                <span>eDebatte-Paket</span>
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{isNone ? "Noch kein eDebatte-Paket" : label}</h3>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-400/40">
              <FiCheckCircle className="h-3.5 w-3.5" aria-hidden />
              {isNone
                ? "Noch nicht aktiviert"
                : edebatte.status === "preorder"
                ? "Vorgemerkt"
                : edebatte.status === "active"
                ? "Aktiv"
                : "Gekündigt"}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {isNone ? "Du kannst jederzeit ein eDebatte-Paket wählen – vom kostenlosen Einstieg (Basis) bis zum Pro-Paket." : statusLabel}
          </p>
          {(pledgeAmount || edebatte.commitmentMonths || edebatte.pledgeReference) && (
            <p className="text-[11px] text-[rgb(var(--muted))]">
              {pledgeAmount ? `Gebucht: ${pledgeAmount} / ${pledgeIntervalLabel}` : null}
              {edebatte.commitmentMonths ? ` · Laufzeit: ${edebatte.commitmentMonths} Monate` : null}
              {edebatte.pledgeReference ? ` · Ref: ${edebatte.pledgeReference}` : null}
            </p>
          )}

          <div className="mt-3 rounded-2xl bg-slate-800/70 p-3 text-xs">
            {isNone ? (
              <p className="text-slate-200">Sobald du startest, siehst du hier deine Swipes, Limits und dein Engagement-Level.</p>
            ) : (
              <>
                <p className="text-slate-200">{swipeLimitText}</p>
                {usage.xpLevelLabel && (
                  <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                    Engagement-Level: <span className="font-semibold">{usage.xpLevelLabel}</span>
                  </p>
                )}
              </>
            )}

            {!isNone && (edebatte.nextBillingDate || edebatte.validFrom || edebatte.validTo) && (
              <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                {edebatte.validFrom && (
                  <>
                    gültig ab <span className="font-medium">{edebatte.validFrom}</span>
                  </>
                )}
                {edebatte.validTo && (
                  <>
                    {" · "}endet spätestens am <span className="font-medium">{edebatte.validTo}</span>
                  </>
                )}
                {edebatte.nextBillingDate && (
                  <>
                    {" · "}nächste Abrechnung: <span className="font-medium">{edebatte.nextBillingDate}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[rgb(var(--border))] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <button type="button" onClick={() => setShowModal(true)} className={`${primaryButtonSmallClass} w-full sm:w-auto`}>
              <FiPackage className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {primaryCtaLabel}
            </button>
            <Link href="/faq#edebatte" className={`${secondaryLightButtonClass} w-full sm:w-auto`}>
              <FiSearch className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
              Details zu eDebatte
            </Link>
          </div>
        </div>
      </section>

      {showModal && <EDebattePackageModal currentPackage={edebatte} onClose={() => setShowModal(false)} onRefresh={onRefresh} />}
    </>
  );
}

type EDebattePackageModalProps = {
  currentPackage: EDebattePackageInfo;
  onClose: () => void;
  onRefresh: () => void;
};

type EDebatteChoice = {
  id: EDebattePackage;
  name: string;
  priceLabel: string;
  description: string;
};

type PrivatePackageId = (typeof PRIVATE_PACKAGE_IDS)[number];

function isPrivatePackage(
  pkg: EDebattePackageDefinition,
): pkg is EDebattePackageDefinition & { id: PrivatePackageId } {
  return pkg.id === "basis" || pkg.id === "start" || pkg.id === "pro";
}

const EDEBATTE_CHOICES: EDebatteChoice[] = getPackagesByIds(PRIVATE_PACKAGE_IDS)
  .filter(isPrivatePackage)
  .map((pkg) => {
  const priceLabel =
    pkg.preisMonat === 0
      ? "Kostenfrei"
      : pkg.preisMonat != null
        ? `${formatEuro(pkg.preisMonat)} / Monat`
        : "Preis folgt";
  return {
    id: pkg.id,
    name: pkg.titel,
    priceLabel,
    description: pkg.beschreibungKurz,
  };
});

function EDebattePackageModal({ currentPackage, onClose, onRefresh }: EDebattePackageModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleSelect = (choiceId: EDebattePackage) => {
    if (choiceId !== "basis") {
      const next = encodeURIComponent("/account");
      window.location.assign(`/register/preorder?plan=${choiceId}&next=${next}`);
      return;
    }
    fetch("/api/edebatte/package", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ package: choiceId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json().catch(() => ({}));
      })
      .then(() => {
        onClose();
        onRefresh?.();
      })
      .catch((err) => {
        console.warn("[edebatte] paketwahl fehlgeschlagen", err);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edebatte-package-modal-title"
        aria-describedby="edebatte-package-modal-description"
        className="w-full max-w-lg rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--border))] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">eDebatte-Paket wählen</p>
            <h3 id="edebatte-package-modal-title" className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
              Welches Paket möchtest du nutzen?
            </h3>
            <p id="edebatte-package-modal-description" className="mt-1 text-[11px] text-[rgb(var(--muted))]">
              Hier siehst du, welche Pakete bereits beauftragt sind, was vorgemerkt ist und was du zusätzlich buchen kannst.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--bg))] text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-sky-200"
            aria-label="Auswahl schließen"
          >
            ✕
          </button>
        </header>

        <div className="mt-4 space-y-3">
          {EDEBATTE_CHOICES.map((choice) => {
            const isCurrent = currentPackage.package === choice.id && (currentPackage.status === "active" || currentPackage.status === "preorder");
            const isCanceled = currentPackage.package === choice.id && currentPackage.status === "canceled";

            let statusText: string | null = null;
            let statusClass =
              "inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]";

            if (isCurrent && currentPackage.status === "active") {
              statusText = "Aktuelles Paket";
              statusClass = "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200";
            } else if (isCurrent && currentPackage.status === "preorder") {
              statusText = "Vorgemerkt";
              statusClass = "inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200";
            } else if (isCanceled) {
              statusText = "Zuletzt gekündigt";
              statusClass = "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200";
            }

            const disabled = isCurrent;

            return (
              <article key={choice.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--bg))] px-3 py-3 ring-1 ring-[rgb(var(--border))] sm:px-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">{choice.name}</p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{choice.description}</p>
                  <p className="text-[11px] font-medium text-[rgb(var(--fg))]">{choice.priceLabel}</p>
                  {statusText && (
                    <div className="mt-1">
                      <span className={statusClass}>{statusText}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => !disabled && handleSelect(choice.id)}
                    disabled={disabled}
                    className={
                      disabled
                        ? "inline-flex items-center justify-center rounded-full bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] cursor-default"
                        : primaryButtonSmallClass
                    }
                  >
                    {disabled ? "Ausgewählt" : "Dieses Paket wählen"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={secondaryLightButtonClass}>
            Auswahl schließen
          </button>
        </footer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
 * Section B: Öffentliches Profil
 * ---------------------------------------------------- */

type PublicProfileSectionProps = {
  publicProfile: PublicProfileData;
  onRefresh: () => void;
};

function PublicProfileSection({ publicProfile, onRefresh }: PublicProfileSectionProps) {
  return (
    <section aria-labelledby="account-public-heading" className="space-y-4">
      <SectionHeading
        id="account-public-heading"
        title="Öffentliches Profil & Privatsphäre"
        description="Steuere, wie du in öffentlichen Übersichten, Diskussionen und Streams angezeigt wirst."
        icon={FiGlobe}
      />

      <PublicProfileCard initial={publicProfile} onRefresh={onRefresh} />
    </section>
  );
}

type PublicProfileCardProps = {
  initial: PublicProfileData;
  onRefresh: () => void;
};

function PublicProfileCard({ initial, onRefresh }: PublicProfileCardProps) {
  const [draft, setDraft] = useState<PublicProfileData>(initial);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const canShowTopTopics = canEditTopTopics(draft.engagementLevel ?? "interessiert");

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const handleFieldChange = (patch: Partial<PublicProfileData>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const selectedTopTopicKeys = (draft.topTopics ?? []).map((topic) => topic.key);
  const updateTopTopics = (keys: TopicKey[]) => {
    const nextTopics = keys.map((key) => {
      const current = draft.topTopics?.find((topic) => topic.key === key);
      const option = TOPIC_CHOICES.find((topic) => topic.key === key);
      return {
        key,
        title: option?.label ?? current?.title ?? key,
        statement: current?.statement ?? null,
      };
    });
    handleFieldChange({ topTopics: nextTopics });
  };

  const toggleTopTopic = (key: TopicKey, checked: boolean) => {
    if (!checked) {
      updateTopTopics(selectedTopTopicKeys.filter((topicKey) => topicKey !== key));
      return;
    }
    if (selectedTopTopicKeys.includes(key)) return;
    if (selectedTopTopicKeys.length >= 3) return;
    updateTopTopics([...selectedTopTopicKeys, key]);
  };

  const createProfilePayload = (profile: PublicProfileData) => ({
    bio: profile.bio ?? "",
    tagline: profile.tagline ?? "",
    city: profile.city ?? null,
    region: profile.region ?? null,
    countryCode: profile.countryCode ?? null,
    showRealName: profile.showRealName,
    showCity: profile.showCity,
    showStats: profile.showStats,
    showJoinDate: profile.showJoinDate,
    showEngagementLevel: profile.showEngagementLevel,
    showMembership: profile.showMembership,
    topTopics: canShowTopTopics ? (profile.topTopics ?? []).slice(0, 3).map((topic) => ({ key: topic.key })) : undefined,
  });

  const hasChanges = JSON.stringify(createProfilePayload(draft)) !== JSON.stringify(createProfilePayload(initial));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasChanges) {
      setSaveMsg("Keine Aenderung");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    const payload = createProfilePayload(draft);
    fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Speichern fehlgeschlagen");
        setSaveMsg("Gespeichert");
        onRefresh();
      })
      .catch((err) => {
        console.warn("[account] public profile update failed", err);
        setSaveMsg("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      })
      .finally(() => setSaving(false));
  };

  const locationSummary = [draft.city, draft.region, draft.countryCode].filter(Boolean).join(" · ");

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-6">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="public-bio" className="text-xs font-medium text-[rgb(var(--muted))]">
              Kurzbeschreibung für dein öffentliches Profil
            </label>
            <textarea
              id="public-bio"
              rows={4}
              className="w-full resize-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={draft.bio ?? ""}
              onChange={(event) => handleFieldChange({ bio: event.target.value })}
              placeholder="Zum Beispiel: Engagiert mich für bezahlbaren Wohnraum und konsequenten Klimaschutz in meiner Stadt."
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="public-tagline" className="text-xs font-medium text-[rgb(var(--muted))]">
              Optionaler Zusatz (z.B. Beruf, Rolle)
            </label>
            <input
              id="public-tagline"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={draft.tagline ?? ""}
              onChange={(event) => handleFieldChange({ tagline: event.target.value })}
              placeholder="z.B. Pflegekraft, Student, Kommunalpolitikerin"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[rgb(var(--muted))]">Sichtbarkeit</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <ToggleRow label="Realnamen in öffentlichen Profilen anzeigen" checked={draft.showRealName} onChange={(value) => handleFieldChange({ showRealName: value })} />
              <ToggleRow label="Stadt / Region anzeigen" checked={draft.showCity} onChange={(value) => handleFieldChange({ showCity: value })} />
              <ToggleRow label="Anonymisierte Statistiken anzeigen" checked={draft.showStats} onChange={(value) => handleFieldChange({ showStats: value })} />
              <ToggleRow label="Beitrittsdatum anzeigen" checked={draft.showJoinDate} onChange={(value) => handleFieldChange({ showJoinDate: value })} />
              <ToggleRow label="Engagement-Level anzeigen" checked={draft.showEngagementLevel} onChange={(value) => handleFieldChange({ showEngagementLevel: value })} />
              <ToggleRow label="Mitgliedschaft bei eDebatte anzeigen" checked={draft.showMembership} onChange={(value) => handleFieldChange({ showMembership: value })} />
            </div>
          </fieldset>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[rgb(var(--muted))]">Ort (für öffentliche Anzeige)</p>
            <p className="text-sm text-[rgb(var(--fg))]">{locationSummary || "Noch kein öffentlicher Ort hinterlegt."}</p>
            <p className="text-[11px] text-[rgb(var(--muted))]">Die genaue Anschrift wird nie öffentlich angezeigt – nur Stadt, Region und Land, sofern du das möchtest.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="public-city" className="text-xs font-medium text-[rgb(var(--muted))]">
                Stadt
              </label>
              <input
                id="public-city"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={draft.city ?? ""}
                onChange={(event) => handleFieldChange({ city: event.target.value })}
                placeholder="z. B. Köln"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="public-region" className="text-xs font-medium text-[rgb(var(--muted))]">
                Region / Bundesland
              </label>
              <input
                id="public-region"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={draft.region ?? ""}
                onChange={(event) => handleFieldChange({ region: event.target.value })}
                placeholder="z. B. NRW"
              />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label htmlFor="public-country" className="text-xs font-medium text-[rgb(var(--muted))]">
                Land (Code)
              </label>
              <input
                id="public-country"
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm uppercase text-[rgb(var(--fg))] focus:border-sky-400 focus:bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-sky-100"
                value={draft.countryCode ?? ""}
                onChange={(event) => handleFieldChange({ countryCode: event.target.value.toUpperCase() })}
                placeholder="DE"
                maxLength={8}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[rgb(var(--muted))]">Top-Themen (max. 3)</legend>
            {canShowTopTopics ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TOPIC_CHOICES.map((topic) => {
                    const checked = selectedTopTopicKeys.includes(topic.key);
                    const limitReached = selectedTopTopicKeys.length >= 3;
                    const disabled = !checked && limitReached;
                    return (
                      <label
                        key={topic.key}
                        className={`inline-flex items-start gap-2 rounded-2xl px-3 py-2 text-[11px] ring-1 ${
                          checked
                            ? "bg-sky-50 text-sky-800 ring-sky-100"
                            : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] ring-[rgb(var(--border))]"
                        } ${disabled ? "opacity-60" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-[2px] h-4 w-4 rounded border-[rgb(var(--border))] text-sky-600 focus:ring-sky-500"
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) => toggleTopTopic(topic.key, event.target.checked)}
                        />
                        <span>{topic.label}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[rgb(var(--muted))]">{selectedTopTopicKeys.length} von 3 Themen gewählt.</p>
              </>
            ) : (
              <p className="text-[11px] text-[rgb(var(--muted))]">Top-Themen werden erst ab Engagement-Level „engagiert“ freigeschaltet.</p>
            )}
          </fieldset>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button type="submit" className={`${primaryButtonClass} w-full sm:w-auto`} disabled={saving || !hasChanges}>
            <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {saving ? "Speichert …" : "Öffentliches Profil speichern"}
          </button>
          {saveMsg && (
            <p className="text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
              {saveMsg}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="inline-flex items-start gap-2 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
      <input
        type="checkbox"
        className="mt-[2px] h-4 w-4 rounded border-[rgb(var(--border))] text-sky-600 focus:ring-sky-500"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/* -------------------------------------------------------
 * Section C: Mitgliedschaft & Rollen
 * ---------------------------------------------------- */

type MembershipAndRolesSectionProps = {
  membership: MembershipInfo;
  roles: RoleInfo[];
  membershipStatus?: string | null;
  paymentReference?: string | null;
};

function MembershipAndRolesSection({ membership, roles, membershipStatus, paymentReference }: MembershipAndRolesSectionProps) {
  return (
    <section aria-labelledby="account-membership-heading" className="space-y-4">
      <SectionHeading
        id="account-membership-heading"
        title="Mitgliedschaft & Rollen"
        description="Überblick über deine Rolle bei eDebatte und deine Mitgliedschaft."
        icon={FiUsers}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <VOGMembershipCard membership={membership} membershipStatus={membershipStatus} paymentReference={paymentReference} />
        <RolesCard roles={roles} />
      </div>
    </section>
  );
}

type VOGMembershipCardProps = {
  membership: MembershipInfo;
  membershipStatus?: string | null;
  paymentReference?: string | null;
};

function VOGMembershipCard({ membership, membershipStatus, paymentReference }: VOGMembershipCardProps) {
  const title = membership.label || "Mitgliedschaft eDebatte";
  const status = membership.statusLabel || (membership.isMember ? "Aktiv" : "Noch nicht Mitglied");
  const isWaitingPayment = membershipStatus === "waiting_payment";
  const paymentHint = paymentReference ? `Verwendungszweck: ${paymentReference}` : null;
  const badgeClass = membership.isMember
    ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200"
    : "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200";

  return (
    <section className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-6">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
        <FiUsers className="h-3.5 w-3.5" aria-hidden />
        <span>Mitgliedschaft</span>
      </p>
      <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{title}</h3>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-[rgb(var(--muted))]">{status}</span>
        <span className={badgeClass}>{membership.isMember ? "aktiv" : "optional"}</span>
      </div>
      {membership.contributionLabel && <p className="mt-1 text-xs text-[rgb(var(--muted))]">Beitrag: {membership.contributionLabel}</p>}

      {isWaitingPayment && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200">
          Zahlung ausstehend. Bitte prüfe dein Zahlungsprofil und die Beitragsreferenz.
          {paymentHint ? <p className="mt-1 font-semibold">{paymentHint}</p> : null}
        </div>
      )}

      <p className="mt-3 text-[11px] text-[rgb(var(--muted))]">
        eDebatte finanziert sich unabhängig durch viele kleine Beiträge. Details findest du im Transparenzbericht.
      </p>

      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <Link href="/pricing" className={`${primaryButtonSmallClass} w-full sm:w-auto`}>
          <FiPackage className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {membership.isMember ? "Paket & Preise" : "Paket wählen"}
        </Link>
        {isWaitingPayment && (
          <Link href="/account/payment" className={`${secondaryLightButtonClass} w-full sm:w-auto`}>
            <FiCreditCard className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
            Zahlungsprofil öffnen
          </Link>
        )}
        <Link href="/transparenz" className={`${secondaryLightButtonClass} w-full sm:w-auto`}>
          <FiSearch className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
          Transparenzbericht
        </Link>
      </div>
    </section>
  );
}

type RolesCardProps = {
  roles: RoleInfo[];
};

function RolesCard({ roles }: RolesCardProps) {
  const hasSuperadmin = roles.some((r) => r.role === "superadmin" || r.label === "superadmin");

  return (
    <section className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Rollen &amp; Zugänge</p>
      <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Aktive Rollen</h3>

      <div className="mt-3 space-y-2">
        {roles && roles.length > 0 ? (
          roles.map((role) => (
            <div key={role.id} className="flex items-start justify-between gap-3 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2">
              <div>
                <p className="text-xs font-medium text-[rgb(var(--fg))]">{role.label}</p>
                {role.description && <p className="text-[11px] text-[rgb(var(--muted))]">{role.description}</p>}
                {role.role && (
                  <p className="text-[10px] text-[rgb(var(--muted))]">
                    Systemrolle: <span className="font-semibold">{role.role}</span>
                  </p>
                )}
              </div>
              {role.badge && (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100">
                  {role.badge}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
            Noch keine Sonderrolle hinterlegt. Hinterlege unten bei „Erweiterte Funktionen“ deine
            Interessen, damit passende Freigaben in deinem Profil vorgemerkt werden.
          </div>
        )}
        {hasSuperadmin && (
          <div className="rounded-2xl bg-emerald-50/70 px-3 py-2 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
            Superadmin aktiv
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------
 * Section D: Sicherheit & Zahlung
 * ---------------------------------------------------- */

type SecurityAndPaymentSectionProps = {
  security: SecurityInfo;
  payment: PaymentInfo;
  signature: SignatureInfo;
  membership?: MembershipInfo;
};

function SecurityAndPaymentSection({ security, payment, signature, membership }: SecurityAndPaymentSectionProps) {
  return (
    <section aria-labelledby="account-security-heading" className="space-y-4">
      <SectionHeading
        id="account-security-heading"
        title="Sicherheit & Zahlung"
        description="Login-Schutz, Zahlungsdaten und digitale Unterschrift im Überblick."
        icon={FiShield}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SecurityCard security={security} />
        <PaymentAndSignatureCard payment={payment} signature={signature} membership={membership} />
        <IdentityCheckCard />
      </div>
    </section>
  );
}

type SecurityCardProps = {
  security: SecurityInfo;
};

function SecurityCard({ security }: SecurityCardProps) {
  const identPilot = "Zusätzliche Ident (Bank-Check / eID) in Pilotphase – schalten wir bald frei.";
  const emailOk = security.emailVerified === undefined ? true : Boolean(security.emailVerified);
  const twoFaOk = security.twoFactorEnabled === undefined ? true : Boolean(security.twoFactorEnabled);
  return (
    <section className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-6">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
        <FiShield className="h-3.5 w-3.5 text-sky-500" aria-hidden />
        <span>Sicherheit</span>
      </p>
      <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Aktueller Zustand</h3>

      <div className="mt-3 space-y-2 text-xs">
        <StatusRow label="E-Mail verifiziert" positive={emailOk} />
        <StatusRow label="2-Faktor-Authentifizierung" positive={twoFaOk} />
        {security.lastLoginAt && (
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Letzter Login: <span className="font-medium">{security.lastLoginAt}</span>
          </p>
        )}
        {security.loginHint && <p className="text-[11px] text-[rgb(var(--muted))]">{security.loginHint}</p>}
        <p className="text-[11px] text-[rgb(var(--muted))]">{identPilot}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <Link href="/account/security" className={`${primaryButtonSmallClass} w-full sm:w-auto`}>
          <FiShield className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Sicherheitseinstellungen öffnen
        </Link>
      </div>
    </section>
  );
}

function IdentityCheckCard() {
  const MAX_FILE_BYTES = 900_000;
  const MAX_FILE_LABEL = "900 KB";
  const [doc, setDoc] = useState<IdentityDocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [docType, setDocType] = useState<IdentityDocumentInfo["documentType"]>("id_card");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const docTypeLabel = docType === "passport" ? "Reisepass" : "Personalausweis";
  const requiresBack = docType === "id_card";
  const hasDoc = Boolean(doc);
  const badgeClass = hasDoc
    ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200"
    : "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200";

  const updatedAtLabel = doc?.updatedAt
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(doc.updatedAt),
      )
    : null;

  const formatBytes = (value: number) => {
    if (!value) return "0 B";
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  };

  useEffect(() => {
    let mounted = true;
    async function loadDoc() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/account/identity-document", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) throw new Error(body?.error || "Laden fehlgeschlagen");
        if (mounted) {
          setDoc(body?.doc ?? null);
          if (body?.doc?.documentType) {
            setDocType(body.doc.documentType);
          }
        }
      } catch (err: any) {
        if (mounted) setMessage(err?.message ?? "Identitätsdaten konnten nicht geladen werden.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDoc();
    return () => {
      mounted = false;
    };
  }, []);

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) reject(new Error("Bild konnte nicht gelesen werden."));
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload() {
    setMessage(null);
    if (!frontFile) {
      setMessage("Bitte die Vorderseite auswählen.");
      return;
    }
    if (requiresBack && !backFile && !doc?.backImage) {
      setMessage("Bitte die Rückseite auswählen.");
      return;
    }
    if (frontFile.size > MAX_FILE_BYTES || (backFile && backFile.size > MAX_FILE_BYTES)) {
      setMessage(`Bild zu groß. Bitte je Datei unter ${MAX_FILE_LABEL} bleiben.`);
      return;
    }
    setSaving(true);
    try {
      const frontImage = await fileToDataUrl(frontFile);
      const backImage = backFile
        ? await fileToDataUrl(backFile)
        : requiresBack
          ? doc?.backImage ?? null
          : null;
      const res = await fetch("/api/account/identity-document", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          frontImage,
          backImage,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "Upload fehlgeschlagen");
      }
      setDoc({
        documentType: docType,
        frontImage,
        backImage,
        updatedAt: body?.doc?.updatedAt ?? new Date().toISOString(),
      });
      setFrontFile(null);
      setBackFile(null);
      setMessage("Identitätsdokument gespeichert.");
    } catch (err: any) {
      setMessage(err?.message ?? "Upload fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/identity-document", { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "Löschen fehlgeschlagen");
      setDoc(null);
      setMessage("Dokument entfernt.");
    } catch (err: any) {
      setMessage(err?.message ?? "Löschen fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">
            <FiUser className="h-3.5 w-3.5" aria-hidden />
            <span>Identity Check</span>
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Ausweis / Pass hinterlegen</h3>
        </div>
        <span className={badgeClass}>{hasDoc ? "hochgeladen" : "offen"}</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3 text-xs text-[rgb(var(--muted))]">
          {loading ? (
            <p className="text-[11px] text-[rgb(var(--muted))]">Status wird geladen …</p>
          ) : (
            <>
              <p className="text-[11px] text-[rgb(var(--muted))]">
                Wir speichern dein Dokument ausschließlich für die Stream-Verifizierung. Öffentliche Profile zeigen nur
                einen Status, keine Bilder.
              </p>
              {updatedAtLabel && (
                <p className="text-[11px] text-[rgb(var(--muted))]">Zuletzt aktualisiert: {updatedAtLabel}</p>
              )}
              {doc ? (
                <div className="flex flex-wrap gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-[rgb(var(--muted))]">Vorderseite</p>
                    <div className="relative">
                      <img
                        src={doc.frontImage}
                        alt="Ausweis Vorderseite"
                        className="h-20 w-32 rounded-lg border border-[rgb(var(--border))] object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgb(var(--card))] text-[9px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Vorschau
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-[rgb(var(--muted))]">
                      Rückseite {doc.documentType === "passport" ? "(optional)" : ""}
                    </p>
                    {doc.backImage ? (
                      <div className="relative">
                        <img
                          src={doc.backImage}
                          alt="Ausweis Rückseite"
                          className="h-20 w-32 rounded-lg border border-[rgb(var(--border))] object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgb(var(--card))] text-[9px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                          Vorschau
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[10px] text-[rgb(var(--muted))]">
                        nicht hinterlegt
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  Hinterlege einen Personalausweis oder Reisepass, damit deine Streams freigegeben werden können.
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[rgb(var(--fg))]">Dokumenttyp</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2 text-[11px] ${
                  docType === "id_card"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
                }`}
              >
                <input
                  type="radio"
                  name="docType"
                  className="sr-only"
                  value="id_card"
                  checked={docType === "id_card"}
                  onChange={() => setDocType("id_card")}
                  disabled={saving}
                />
                <p className="font-semibold text-[rgb(var(--fg))]">Personalausweis</p>
                <p className="text-[10px] text-[rgb(var(--muted))]">Vorder- & Rückseite</p>
              </label>
              <label
                className={`cursor-pointer rounded-xl border px-3 py-2 text-[11px] ${
                  docType === "passport"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))]"
                }`}
              >
                <input
                  type="radio"
                  name="docType"
                  className="sr-only"
                  value="passport"
                  checked={docType === "passport"}
                  onChange={() => setDocType("passport")}
                  disabled={saving}
                />
                <p className="font-semibold text-[rgb(var(--fg))]">Reisepass</p>
                <p className="text-[10px] text-[rgb(var(--muted))]">Vorderseite reicht</p>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[rgb(var(--fg))]">
              Vorderseite
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full text-[11px] text-[rgb(var(--muted))]"
                onChange={(event) => setFrontFile(event.target.files?.[0] ?? null)}
                disabled={saving}
              />
            </label>
            {frontFile && (
              <p className="text-[10px] text-[rgb(var(--muted))]">
                Ausgewählt: {frontFile.name} · {formatBytes(frontFile.size)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[rgb(var(--fg))]">
              Rückseite {requiresBack ? "" : "(optional)"}
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full text-[11px] text-[rgb(var(--muted))]"
                onChange={(event) => setBackFile(event.target.files?.[0] ?? null)}
                disabled={saving}
              />
            </label>
            {backFile && (
              <p className="text-[10px] text-[rgb(var(--muted))]">
                Ausgewählt: {backFile.name} · {formatBytes(backFile.size)}
              </p>
            )}
          </div>

          <p className="text-[10px] text-[rgb(var(--muted))]">
            Akzeptiert: JPG/PNG · max {MAX_FILE_LABEL} pro Datei · {docTypeLabel}
          </p>

          {message && <p className="text-[11px] text-[rgb(var(--muted))]">{message}</p>}

          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={handleUpload}
              className={`${primaryButtonSmallClass} w-full sm:w-auto`}
              disabled={saving}
            >
              <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {saving ? "Speichere …" : hasDoc ? "Dokument aktualisieren" : "Dokument speichern"}
            </button>
            {doc ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`${secondaryLightButtonClass} w-full sm:w-auto`}
                disabled={saving}
              >
                Entfernen
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

type StatusRowProps = {
  label: string;
  positive: boolean;
};

function StatusRow({ label, positive }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2">
      <span className="text-[11px] text-[rgb(var(--muted))]">{label}</span>
      <span
        className={
          positive
            ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200"
            : "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200"
        }
      >
        {positive ? "aktiv" : "empfohlen"}
      </span>
    </div>
  );
}

type PaymentAndSignatureCardProps = {
  payment: PaymentInfo;
  signature: SignatureInfo;
  membership?: MembershipInfo;
};

function PaymentAndSignatureCard({ payment, signature, membership }: PaymentAndSignatureCardProps) {
  const hasIban = Boolean(payment.ibanMasked);
  const contribution =
    (membership && (membership.contributionLabel || membership.statusLabel)) || null;

  return (
    <section className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-6">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
        <FiCreditCard className="h-3.5 w-3.5 text-sky-500" aria-hidden />
        <span>Zahlung &amp; Unterschrift</span>
      </p>
      <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Standardkonto &amp; digitale Unterschrift</h3>

      <div className="mt-3 space-y-3 text-xs">
        <div className="space-y-1 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2">
          <p className="text-[11px] font-medium text-[rgb(var(--muted))]">Standardkonto für Beiträge</p>
          <p className="text-[11px] text-[rgb(var(--muted))]">{hasIban ? `${payment.accountHolder ?? ""} · ${payment.ibanMasked}` : "Noch kein Konto hinterlegt."}</p>
          {(payment.note || contribution) && (
            <p className="text-[11px] text-[rgb(var(--muted))]">
              {contribution ? `Aktuelle Rate: ${contribution}` : null}
              {payment.note ? ` · ${payment.note}` : null}
            </p>
          )}
        </div>

        <div className="space-y-1 rounded-2xl bg-[rgb(var(--bg))] px-3 py-2">
          <p className="text-[11px] font-medium text-[rgb(var(--muted))]">Digitale Unterschrift</p>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            {signature.hasSignature ? `Hinterlegt · zuletzt aktualisiert am ${signature.updatedAt ?? "–"}` : "Noch keine digitale Unterschrift hinterlegt."}
          </p>
          <p className="text-[11px] text-[rgb(var(--muted))]">
            Pilot: Auf Mobilgeräten kannst du deine Unterschrift direkt erfassen (Finger/Tablet). Für bestimmte Abstimmungen oder Mandatsvergaben kann sie hilfreich sein. Ident (Bank-Check / eID) rüsten wir gerade nach, damit du dich ohne Papieraufwand legitimieren kannst.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <Link href="/account/payment" className={`${primaryButtonSmallClass} w-full sm:w-auto`}>
          <FiCreditCard className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Zahlungsprofil bearbeiten
        </Link>
        <Link href="/account/signature" className={`${secondaryLightButtonClass} w-full sm:w-auto`}>
          <FiCheckCircle className="mr-1.5 h-3.5 w-3.5 text-sky-500" aria-hidden />
          Digitale Unterschrift verwalten
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
 * Section E: Erweiterte Funktionen (Pilotphase)
 * ---------------------------------------------------- */

type AdvancedFeaturesSectionProps = {
  features: FeatureFlags;
  featureInterests: AccountFeatureInterestKey[];
  onRefresh: () => void;
};

function AdvancedFeaturesSection({ features, featureInterests, onRefresh }: AdvancedFeaturesSectionProps) {
  const [draftInterests, setDraftInterests] = useState<AccountFeatureInterestKey[]>(featureInterests);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    setDraftInterests(featureInterests);
  }, [featureInterests]);

  const toggleInterest = (key: AccountFeatureInterestKey, checked: boolean) => {
    setDraftInterests((prev) => {
      if (checked) {
        return Array.from(new Set<AccountFeatureInterestKey>([...prev, key]));
      }
      return prev.filter((item) => item !== key);
    });
  };

  const saveInterests = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ featureInterests: draftInterests }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      setSaveMsg("Interessen gespeichert");
      onRefresh();
    } catch (error) {
      console.warn("[account] feature interests update failed", error);
      setSaveMsg("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="account-advanced-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="account-advanced-heading" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[rgb(var(--fg))]">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-300/30">
            <FiSliders className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span>Erweiterte Funktionen (Pilotphase)</span>
        </h2>
        <span className="inline-flex items-center rounded-full bg-brand-grad px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
          Early Access
        </span>
      </div>
      <p className="text-xs text-[rgb(var(--muted))]">
        Hinterlege hier direkt im Profil, für welche Pilot-Funktionen du dich vormerken möchtest.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {FEATURE_INTEREST_OPTIONS.map((feature) => (
          <FeatureCard
            key={feature.key}
            title={feature.title}
            description={feature.description}
            enabled={
              feature.key === "streams"
                ? features.streamsEnabled
                : feature.key === "hostRights"
                  ? features.hostRightsEnabled
                  : features.chatEnabled
            }
            interested={draftInterests.includes(feature.key)}
            onInterestChange={(checked) => toggleInterest(feature.key, checked)}
          />
        ))}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button type="button" className={`${primaryButtonClass} w-full sm:w-auto`} disabled={saving} onClick={saveInterests}>
          <FiCheckCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {saving ? "Speichert …" : "Interessen speichern"}
        </button>
        {saveMsg && (
          <p className="text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
            {saveMsg}
          </p>
        )}
      </div>
    </section>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  enabled: boolean;
  interested: boolean;
  onInterestChange: (checked: boolean) => void;
};

function FeatureCard({ title, description, enabled, interested, onInterestChange }: FeatureCardProps) {
  const checkboxId = `feature-interest-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl bg-[rgb(var(--card))] p-4 text-xs shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] sm:p-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[rgb(var(--fg))]">{title}</p>
        <p className="text-[11px] text-[rgb(var(--muted))]">{description}</p>
        <label htmlFor={checkboxId} className="mt-2 inline-flex items-start gap-2 text-[11px] text-[rgb(var(--muted))]">
          <input
            id={checkboxId}
            type="checkbox"
            className="mt-[2px] h-4 w-4 rounded border-[rgb(var(--border))] text-sky-600 focus:ring-sky-500"
            checked={interested}
            onChange={(event) => onInterestChange(event.target.checked)}
          />
          <span>Für mein Profil vormerken</span>
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={
            enabled
              ? "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200"
              : "inline-flex items-center rounded-full bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))] ring-1 ring-[rgb(var(--border))]"
          }
        >
          {enabled ? "freigeschaltet" : "Pilot / bald verfügbar"}
        </span>
        <span className="text-[10px] font-semibold text-[rgb(var(--muted))]">{interested ? "vorgemerkt" : "optional"}</span>
      </div>
    </article>
  );
}
