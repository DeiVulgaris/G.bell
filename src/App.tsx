/// <reference types="google.maps" />
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import {
  Search,
  Sparkles,
  User,
  List,
  X,
  MapPin,
  SlidersHorizontal,
  Compass,
  Check,
  Navigation,
  ChevronDown,
  ChevronUp,
  Settings,
  MessageSquare,
  Phone,
  Video,
  Send,
  ShieldCheck,
  PhoneOff,
  Rocket,
} from 'lucide-react';
import {GoBellEliteGame, GoBellMissionSeed} from './components/GoBellEliteGame';
import {
  FilterCategory,
  ProfileCategory,
  ActiveProfileItem,
  ProPictogramType,
} from './types/app';
import {
  DEFAULT_CENTER,
  INITIAL_PROFILES,
  AI_SEMANTIC_SYNONYMS,
  MAX_FREE_DESCRIPTION_WORDS,
  MAX_FREE_GROUP_SLOTS,
  KNOWN_GROUPS_CATALOG,
  GroupCatalogInfo,
  countWords,
  limitWords,
  censorProfanityText,
  extractWordTags,
  getDistanceMeters,
  formatDistance,
} from './data/mockProfiles';
import savedDemoDataRaw from './data/savedDemoData.json';

const savedDemoData = savedDemoDataRaw as {
  updatedAt?: number;
  activeDemoCommunityId?: string;
  activeDemoProfileId?: string;
  searchCenter?: {lat: number; lng: number} | null;
  demoCommunities?: DemoCommunityItem[];
  demoProfiles?: DemoUserProfile[];
};

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const CATEGORY_META: Record<
  FilterCategory,
  {label: string; badgeClass: string; activeBtnClass: string; pinColor: string}
> = {
  ALL: {
    label: 'ALL',
    badgeClass: 'text-sky-300',
    activeBtnClass: 'bg-sky-500 text-slate-950 border-sky-400 font-semibold shadow-sm',
    pinColor: '#0ea5e9',
  },
  GROUPS: {
    label: 'GROUPS',
    badgeClass: 'text-emerald-300',
    activeBtnClass: 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold shadow-sm',
    pinColor: '#10b981',
  },
  ADVERT: {
    label: 'ADVERT',
    badgeClass: 'text-amber-300',
    activeBtnClass: 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm',
    pinColor: '#f59e0b',
  },
  BUSINESS: {
    label: 'BUSINESS',
    badgeClass: 'text-indigo-300',
    activeBtnClass: 'bg-indigo-500 text-white border-indigo-400 font-semibold shadow-sm',
    pinColor: '#6366f1',
  },
  SOS: {
    label: 'SOS',
    badgeClass: 'text-rose-300',
    activeBtnClass: 'bg-rose-600 text-white border-rose-400 font-semibold shadow-sm',
    pinColor: '#e11d48',
  },
};

function checkQuotaError(err: unknown) {
  const msg = String(err instanceof Error ? err.message : err);
  if (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('429')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

/**
 * Draws the search radius on the map with a light blue mask and defined border.
 * Forwards clicks inside the circle to update the search center.
 */
function SearchRadiusOverlay({
  center,
  radiusMeters,
  onSelectCenter,
}: {
  center: google.maps.LatLngLiteral;
  radiusMeters: number;
  onSelectCenter: (latLng: google.maps.LatLngLiteral) => void;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const callbackRef = useRef(onSelectCenter);
  callbackRef.current = onSelectCenter;

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius: radiusMeters,
      fillColor: '#38bdf8', // легкая голубая маска
      fillOpacity: 0.18,
      strokeColor: '#0284c7', // очерченная голубая граница
      strokeOpacity: 0.95,
      strokeWeight: 2,
      clickable: true,
    });

    const clickListener = circle.addListener('click', (ev: google.maps.MapMouseEvent) => {
      if (ev.latLng) {
        callbackRef.current({
          lat: ev.latLng.lat(),
          lng: ev.latLng.lng(),
        });
      }
    });

    circleRef.current = circle;

    return () => {
      clickListener.remove();
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusMeters);
    }
  }, [center, radiusMeters]);

  return null;
}

interface EnrichedProfileResult {
  profile: ActiveProfileItem;
  distanceMeters: number;
  activeTags: string[];
  matchedTags: string[];
}

interface ContactRequestItem {
  id: string;
  senderId: string;
  senderName: string;
  senderKarmaPlus?: number;
  senderKarmaMinus?: number;
  senderCategory?: ProfileCategory;
  note: string;
  createdAt: string;
  closedGroupTag?: string; // Если запрос отправлен для вступления в закрытую группу (GC-...)
  requesterProfileId?: string; // ID профиля пользователя, который запросил вступление в закрытую группу
}

interface ChatMessageItem {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  time: string;
}

interface ActiveChatSession {
  partnerId: string;
  partnerName: string;
  partnerKarmaPlus?: number;
  partnerKarmaMinus?: number;
  partnerConsecutiveMinuses?: number;
  partnerBannedUntilMs?: number | null;
  partnerCategory?: ProfileCategory;
  initialNote: string;
  isGroupChat?: boolean;
  groupTag?: string;
  mode: 'TEXT' | 'VOICE' | 'VIDEO';
  messages: ChatMessageItem[];
  myRatedPartner?: 1 | -1 | null;
  partnerRatedMe?: 1 | -1 | null;
}

interface UserGroupSlot {
  slotId: number;
  tag: string;
  tagDraft: string;
  isEditing: boolean;
  adminApproved: boolean;
}

interface CreatedProGroupSlot {
  slotId: number;
  isCreated: boolean; // Статус Открытая (GO-) или Закрытая (GC-) фиксируется раз и навсегда при создании
  accessType: 'OPEN' | 'CLOSED';
  tag: string;
  name: string;
  description: string;
  isEditing: boolean;
}

function generateGroupUniqueTag(accessType: 'OPEN' | 'CLOSED'): string {
  const prefix = accessType === 'OPEN' ? 'GO-' : 'GC-';
  const digits = '23456789';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const d1 = digits.charAt(Math.floor(Math.random() * digits.length));
  const d2 = digits.charAt(Math.floor(Math.random() * digits.length));
  const u1 = upper.charAt(Math.floor(Math.random() * upper.length));
  const l1 = lower.charAt(Math.floor(Math.random() * lower.length));
  const l2 = lower.charAt(Math.floor(Math.random() * lower.length));
  const d3 = digits.charAt(Math.floor(Math.random() * digits.length));
  const d4 = digits.charAt(Math.floor(Math.random() * digits.length));
  return `${prefix}${d1}${d2}${u1}${l1}${l2}${d3}${d4}`;
}

function createDefaultProGroupSlots(): CreatedProGroupSlot[] {
  return [
    {
      slotId: 1,
      isCreated: false,
      accessType: 'CLOSED',
      tag: '',
      name: 'Моя закрытая группа (Семья / Бригада)',
      description: 'Координация участников на карте в реальном времени и общий чат',
      isEditing: true,
    },
    {
      slotId: 2,
      isCreated: false,
      accessType: 'CLOSED',
      tag: '',
      name: '',
      description: '',
      isEditing: true,
    },
    {
      slotId: 3,
      isCreated: false,
      accessType: 'OPEN',
      tag: '',
      name: '',
      description: '',
      isEditing: true,
    },
    {
      slotId: 4,
      isCreated: false,
      accessType: 'OPEN',
      tag: '',
      name: '',
      description: '',
      isEditing: true,
    },
  ];
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_SOS_MS = 60 * 60 * 1000; // Ограничение показа сигнала SOS — 1 час
const SEVEN_DAYS_BAN_MS = 7 * 24 * 60 * 60 * 1000; // Три минуса подряд — бан профиля на неделю (7 суток)
const ONE_MONTH_KARMA_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // Один пользователь может оценивать карму другого не чаще 1 раза в месяц (30 суток)
const DEFAULT_STARTING_KARMA_PLUS = 3; // Стартовая карма +3 (чтобы был запас для бана)

function normalizeKarmaUserId(rawId: string): string {
  return rawId.replace(/-(sos|advert)$/, '');
}

type AccountTier = 'FREE' | 'PRO' | 'BUSINESS';
type ProPackageLevel = 'PRO' | 'PRO_PLUS_1' | 'PRO_PLUS_2' | 'PRO_PLUS_3';
type AdvertAutoRenewMode = 'OFF' | 'DAYS' | 'INFINITE';

const PRO_PACKAGE_META: Record<
  ProPackageLevel,
  {
    id: ProPackageLevel;
    label: string;
    shortBadge: string;
    advertSlots: number;
    maxWords: number;
    monthlyPriceUsd: number;
  }
> = {
  PRO: {
    id: 'PRO',
    label: 'Базовый PRO (1 объявл. · 10 слов)',
    shortBadge: 'PRO',
    advertSlots: 1,
    maxWords: 10,
    monthlyPriceUsd: 9,
  },
  PRO_PLUS_1: {
    id: 'PRO_PLUS_1',
    label: 'PRO + I (2 объявл. · 15 слов)',
    shortBadge: 'PRO + I',
    advertSlots: 2,
    maxWords: 15,
    monthlyPriceUsd: 14,
  },
  PRO_PLUS_2: {
    id: 'PRO_PLUS_2',
    label: 'PRO + II (3 объявл. · 20 слов)',
    shortBadge: 'PRO + II',
    advertSlots: 3,
    maxWords: 20,
    monthlyPriceUsd: 19,
  },
  PRO_PLUS_3: {
    id: 'PRO_PLUS_3',
    label: 'PRO + III (4 объявл. · 25 слов)',
    shortBadge: 'PRO + III',
    advertSlots: 4,
    maxWords: 25,
    monthlyPriceUsd: 24,
  },
};

export const PRO_PICTOGRAM_OPTIONS: {
  id: ProPictogramType;
  label: string;
  shortSymbol: string;
}[] = [
  {id: 'GOLD_BUST', label: 'Золотой бюст (по умолчанию)', shortSymbol: '👤'},
  {id: 'STAR', label: 'Золотая звезда', shortSymbol: '★'},
  {id: 'CROWN', label: 'Золотая корона', shortSymbol: '♛'},
  {id: 'LIGHTNING', label: 'Золотая молния', shortSymbol: '⚡'},
  {id: 'DIAMOND', label: 'Золотой кристалл', shortSymbol: '◆'},
  {id: 'SHIELD', label: 'Золотой щит', shortSymbol: '🛡'},
];

function PersonBustSvg({
  fillColor,
  strokeColor,
  sizeClass = 'w-10 h-10',
}: {
  fillColor: string;
  strokeColor: string;
  sizeClass?: string;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`${sizeClass} drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Голова бюста */}
      <circle cx="14" cy="9.5" r="5.2" fill={fillColor} stroke={strokeColor} strokeWidth="1.8" />
      {/* Плечи и грудь бюста */}
      <path
        d="M4.5 24.5C4.5 18.8 8.7 15.6 14 15.6C19.3 15.6 23.5 18.8 23.5 24.5H4.5Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProCustomPictogramGraphic({
  type,
  sizeClass = 'w-10 h-10',
}: {
  type?: ProPictogramType;
  sizeClass?: string;
}) {
  switch (type) {
    case 'STAR':
      return (
        <span className="text-4xl leading-none text-amber-400 drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
          ★
        </span>
      );
    case 'CROWN':
      return (
        <span className="text-4xl leading-none text-amber-400 drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
          ♛
        </span>
      );
    case 'LIGHTNING':
      return (
        <span className="text-4xl leading-none text-amber-400 drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
          ⚡
        </span>
      );
    case 'DIAMOND':
      return (
        <span className="text-4xl leading-none text-amber-400 drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
          ◆
        </span>
      );
    case 'SHIELD':
      return (
        <span className="text-3xl leading-none text-amber-400 drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]">
          🛡
        </span>
      );
    case 'GOLD_BUST':
    default:
      return <PersonBustSvg fillColor="#fbbf24" strokeColor="#ffffff" sizeClass={sizeClass} />;
  }
}

function generateEightCharUserTag(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface DemoUserProfile {
  id: string;
  userTag: string; // 8-значный буквенно-числовой уникальный тег пользователя (создаётся системой)
  tier: AccountTier; // Статус пользователя зависит только от режима управления: FREE, PRO или BUSINESS
  proPackage?: ProPackageLevel; // Под-пакет уровня PRO: PRO (1 слот, 10 слов), PRO + I (2 слота, 15 слов), PRO + II (3 слота, 20 слов), PRO + III (4 слота, 25 слов)
  proPictogram: ProPictogramType; // Обозначение из списка для уровня PRO (по умолчанию GOLD_BUST)
  karmaPlus: number; // Сколько плюсов в карме (+1 Положительно)
  karmaMinus: number; // Сколько минусов в карме (-1 Отрицательно)
  consecutiveMinuses?: number; // Счётчик минусов подряд (при достижении 3 — бан на неделю)
  bannedUntilMs?: number | null; // Время окончания недельного бана профиля
  name: string;
  nickname: string;
  description: string;
  showName: boolean;
  showNickname: boolean;
  showDescription: boolean;
  disabledWords?: string[];
  groupSlots?: UserGroupSlot[];
  createdProGroups?: CreatedProGroupSlot[];
  advertSlots?: AdvertSlotItem[];
  subscriptionPayoffUsd?: number; // Счётчик погашения подписки с пула Биржи (по факту)
  advertDraftText?: string;
  publishedAdvert?: PublishedAdvertState | null;
  sosText?: string;
  sosActive?: boolean;
  sosExpiresAtMs?: number | null;
  latOffset: number;
  lngOffset: number;
  autoGeo: boolean;
  pushNotifications: boolean;
  showDistance: boolean;
  communityId?: string; // Привязка пользователя к конкретному Демо-Комьюнити (например, "Федоровка" или "Беженцы Украины в Европе")
}

interface DemoCommunityItem {
  id: string;
  name: string;
  description: string;
  centerLat: number;
  centerLng: number;
}

const DEFAULT_DEMO_COMMUNITIES: DemoCommunityItem[] = [
  {
    id: 'community-fedorovka',
    name: 'Федоровка',
    description: 'Комьюнити села (Украина): молоко, яйца, покос травы, вспашка огорода, обрезание деревьев, электрик, строитель, группы рыбалка, охота и клуб',
    centerLat: DEFAULT_CENTER.lat,
    centerLng: DEFAULT_CENTER.lng,
  },
  {
    id: 'community-refugees-eu',
    name: 'Беженцы Украины в Европе',
    description: 'Демонстрация комьюнити украинцев в городах Европы: взаимопомощь, жильё, переводчики, работа, документы и локальные группы',
    centerLat: 52.2297,
    centerLng: 21.0122,
  },
];

interface PublishedAdvertState {
  text: string;
  publishedAtMs: number;
  expiresAtMs: number;
  stoppedEarly: boolean;
  position: {lat: number; lng: number};
  status: 'NATIVE' | 'GUEST';
  autoRenewMode?: AdvertAutoRenewMode;
  autoRenewDays?: number;
  autoRenewUntilMs?: number | null;
}

interface AdvertSlotItem {
  slotId: number;
  draftText: string;
  isEditing: boolean;
  placementMode: 'NATIVE' | 'GUEST';
  autoRenewMode: AdvertAutoRenewMode;
  autoRenewDays: number;
  published: PublishedAdvertState | null;
  monetizeActive?: boolean; // Monetize: ВКЛ (слот передан в обезличенный пул Биржи)
  monetizeStartedAtMs?: number | null;
  monetizeExpiresAtMs?: number | null; // Текущий 24ч цикл на бирже
  monetizeUntilMs?: number | null; // Конечный срок при режиме DAYS
  monetizeWithdrawingUntilMs?: number | null; // 24-часовой буфер возврата слота с биржи после нажатия ВЫКЛ
}

function createDefaultAdvertSlots(firstSlotText = ''): AdvertSlotItem[] {
  return [
    {
      slotId: 1,
      draftText: firstSlotText,
      isEditing: false,
      placementMode: 'NATIVE',
      autoRenewMode: 'OFF',
      autoRenewDays: 7,
      published: null,
    },
    {
      slotId: 2,
      draftText: '',
      isEditing: false,
      placementMode: 'NATIVE',
      autoRenewMode: 'OFF',
      autoRenewDays: 7,
      published: null,
    },
    {
      slotId: 3,
      draftText: '',
      isEditing: false,
      placementMode: 'NATIVE',
      autoRenewMode: 'OFF',
      autoRenewDays: 7,
      published: null,
    },
    {
      slotId: 4,
      draftText: '',
      isEditing: false,
      placementMode: 'NATIVE',
      autoRenewMode: 'OFF',
      autoRenewDays: 7,
      published: null,
    },
  ];
}

function formatDurationHMS(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

function formatBanDurationDaysHMS(ms: number): string {
  if (ms <= 0) return '0 дн. 00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const remAfterDays = totalSeconds % 86400;
  const hours = Math.floor(remAfterDays / 3600);
  const minutes = Math.floor((remAfterDays % 3600) / 60);
  const seconds = remAfterDays % 60;
  return `${days} дн. ${[hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')}`;
}

/**
 * Распознаёт координаты из любого Copy-Paste формата Google Maps:
 * - Обычный копипаст правой кнопкой мыши в Google Maps: "49.234567, 28.456789" (или через пробел / точку с запятой)
 * - Ссылка из адресной строки Google Maps: ".../@49.234567,28.456789,16z" или "!3d49.234567!4d28.456789"
 * - Градусы-минуты-секунды (DMS): 49°14'04.4"N 28°27'24.4"E
 */
function parseGoogleCoordsCopyPaste(raw: string): {lat: number; lng: number} | null {
  const text = raw.trim();
  if (!text) return null;

  // 1. Попытка извлечь из URL Google Maps (!3dLAT!4dLNG или @LAT,LNG)
  const url3d4d = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (url3d4d) {
    const lat = parseFloat(url3d4d[1]);
    const lng = parseFloat(url3d4d[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {lat, lng};
    }
  }
  const urlAt = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlAt) {
    const lat = parseFloat(urlAt[1]);
    const lng = parseFloat(urlAt[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {lat, lng};
    }
  }

  // 2. Попытка распознать формат DMS: 49°14'04.4"N 28°27'24.4"E
  const dmsRegex =
    /(\d+)[°º]\s*(\d+)['’′]\s*(\d+(?:\.\d+)?)["”″]?\s*([NSnsСЮсю])\s*[,;\s]+\s*(\d+)[°º]\s*(\d+)['’′]\s*(\d+(?:\.\d+)?)["”″]?\s*([EWewВЗвз])/;
  const dmsMatch = text.match(dmsRegex);
  if (dmsMatch) {
    let lat =
      parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
    if (/[SsЮю]/.test(dmsMatch[4])) lat = -lat;
    let lng =
      parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
    if (/[WwЗз]/.test(dmsMatch[8])) lng = -lng;
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {lat, lng};
    }
  }

  // 3. Стандартный десятичный копипаст из Google Maps: "49.842957, 24.031111" или "49.842957 24.031111"
  const normalized = text.replace(/(\d),(\d)/g, '$1.$2');
  const numMatches = normalized.match(/-?\d+(?:\.\d+)?/g);
  if (numMatches && numMatches.length >= 2) {
    const lat = parseFloat(numMatches[0]);
    const lng = parseFloat(numMatches[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return {lat, lng};
    }
  }

  return null;
}

function HybridMapContent() {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  // Hybrid Search System Mode switched by left "Google" and right "GoBell" buttons on the single search bar
  const [searchSystemMode, setSearchSystemMode] = useState<'TAG_SYSTEM' | 'GOOGLE_SYSTEM'>('TAG_SYSTEM');
  const [isEliteGameOpen, setIsEliteGameOpen] = useState(true);

  // Search Center & Radius (500 m to 5000 m) & Map Zoom for Google-like marker scaling
  const [searchCenter, setSearchCenter] = useState<google.maps.LatLngLiteral>(() => {
    try {
      const saved = localStorage.getItem('gobell_search_center_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    if (
      savedDemoData?.searchCenter &&
      typeof savedDemoData.searchCenter.lat === 'number' &&
      typeof savedDemoData.searchCenter.lng === 'number'
    ) {
      return savedDemoData.searchCenter;
    }
    return DEFAULT_CENTER;
  });
  const [anchorClusterCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState<number>(2000);
  const [mapZoom, setMapZoom] = useState<number>(14);

  useEffect(() => {
    try {
      localStorage.setItem('gobell_search_center_v1', JSON.stringify(searchCenter));
    } catch {
      // ignore localStorage write errors
    }
  }, [searchCenter]);

  // Масштабирование пиктограмм как у Google Maps в зависимости от текущего приближения (zoom) карты
  const markerZoomScale = useMemo(() => {
    const rawScale = Math.pow(1.16, mapZoom - 14);
    return Math.max(0.42, Math.min(1.35, rawScale));
  }, [mapZoom]);

  // Unified Search Bar & Filter Dropdown States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState<boolean>(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Google Places Autocomplete state for the unified search bar when in 'GOOGLE_SYSTEM' mode
  const [googleSuggestions, setGoogleSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const closeFilterDropdown = useCallback(() => {
    setIsFilterDropdownOpen(false);
    searchInputRef.current?.blur();
  }, []);

  // Fullscreen Modals: List View, User Cabinet & Subscription Page
  const [isListFullscreenOpen, setIsListFullscreenOpen] = useState<boolean>(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState<boolean>(false);
  const [cabinetTab, setCabinetTab] = useState<
    'PROFILE' | 'GROUPS' | 'ADVERT' | 'SOS' | 'CHAT' | 'SETTINGS'
  >('PROFILE');
  const [subscriptionPagePlan, setSubscriptionPagePlan] = useState<
    'PRO' | 'PRO_PLUS' | 'BUSINESS' | null
  >(null);

  // Additional Cabinet Pages State (Groups: 3 unique group tag slots on FREE tier, Created PRO Groups on PRO/PRO+ tier, Advert, SOS, Settings)
  const [groupSlots, setGroupSlots] = useState<UserGroupSlot[]>([
    {
      slotId: 1,
      tag: '',
      tagDraft: '',
      isEditing: false,
      adminApproved: true,
    },
    {
      slotId: 2,
      tag: '',
      tagDraft: '',
      isEditing: false,
      adminApproved: true,
    },
    {
      slotId: 3,
      tag: '',
      tagDraft: '',
      isEditing: false,
      adminApproved: true,
    },
  ]);
  const [myCreatedProGroups, setMyCreatedProGroups] = useState<CreatedProGroupSlot[]>(() =>
    createDefaultProGroupSlots()
  );
  // Exclusive "Показать на карте" group tag filter (disables all standard filters when active)
  const [activeGroupMapTag, setActiveGroupMapTag] = useState<string | null>(null);

  // User's actual physical geolocation (used to determine NATIVE vs GUEST status for Adverts)
  const [userPhysicalGeo, setUserPhysicalGeo] = useState<{lat: number; lng: number}>(
    DEFAULT_CENTER
  );

  // Page 3: Advert State (1 slot on FREE/base PRO, 2 on PRO+I, 3 on PRO+II, 4 on PRO+III; 24h duration, auto-renew & no 24h cooldown on PRO)
  const [myAdvertSlots, setMyAdvertSlots] = useState<AdvertSlotItem[]>(() =>
    createDefaultAdvertSlots('Продам велосипед горный отличное состояние или сдам в аренду')
  );
  const [myAdvertDraftText, setMyAdvertDraftText] = useState<string>(
    'Продам велосипед горный отличное состояние или сдам в аренду'
  );
  const [publishedAdvert, setPublishedAdvert] = useState<PublishedAdvertState | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine whether the current searchCenter is within the user's geolocation radius (NATIVE = green, GUEST = orange)
  const distanceFromUserGeoToSearchCenter = useMemo(
    () => getDistanceMeters(userPhysicalGeo, searchCenter),
    [userPhysicalGeo, searchCenter]
  );

  const currentSearchCenterAdvertStatus: 'NATIVE' | 'GUEST' = useMemo(
    () => (distanceFromUserGeoToSearchCenter <= radiusMeters ? 'NATIVE' : 'GUEST'),
    [distanceFromUserGeoToSearchCenter, radiusMeters]
  );

  const [mySosText, setMySosText] = useState<string>(
    'Нужна помощь сел аккумулятор прикурить авто провода есть'
  );
  const [mySosActive, setMySosActive] = useState<boolean>(false);
  const [mySosExpiresAtMs, setMySosExpiresAtMs] = useState<number | null>(null);
  const [settingsAutoGeo, setSettingsAutoGeo] = useState<boolean>(true);
  const [settingsPushNotifications, setSettingsPushNotifications] = useState<boolean>(true);
  const [settingsShowDistance, setSettingsShowDistance] = useState<boolean>(true);

  // Contact Protection & Chat System State (без демо-запросов)
  const [contactRequests, setContactRequests] = useState<ContactRequestItem[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ActiveChatSession | null>(null);
  const [chatMessageInput, setChatMessageInput] = useState<string>('');
  const [chatSystemNotice, setChatSystemNotice] = useState<{
    type: 'accepted' | 'rejected' | 'ended' | 'sent';
    text: string;
  } | null>(null);

  // Modal Form for Sending a Contact Request with a Cover Note
  const [contactFormTarget, setContactFormTarget] = useState<{
    id: string;
    name: string;
    category?: ProfileCategory;
    closedGroupTag?: string;
  } | null>(null);
  const [contactFormNote, setContactFormNote] = useState<string>('');

  // Selected Marker on Map (opens ONLY when cursor is in object's action zone + KeyI is pressed) & Hovered Marker on Map (mouse pointer)
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const hoveredMarkerIdRef = useRef<string | null>(null);
  const isMapKeyIDownRef = useRef<boolean>(false);

  useEffect(() => {
    hoveredMarkerIdRef.current = hoveredMarkerId;
  }, [hoveredMarkerId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (
        e.code === 'KeyI' ||
        e.key === 'i' ||
        e.key === 'I' ||
        e.key === 'ш' ||
        e.key === 'Ш'
      ) {
        isMapKeyIDownRef.current = true;
        if (hoveredMarkerIdRef.current) {
          setActiveMarkerId(hoveredMarkerIdRef.current);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyI' ||
        e.key === 'i' ||
        e.key === 'I' ||
        e.key === 'ш' ||
        e.key === 'Ш'
      ) {
        isMapKeyIDownRef.current = false;
      }
    };
    const onBlur = () => {
      isMapKeyIDownRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // DEMO VERSION CONTROL PANEL STATE (Сохраняется одновременно в localStorage И в файл проекта src/data/savedDemoData.json, чтобы при сохранении проекта и переходе в режим Просмотра все созданные пользователи были видны!)
  const [demoProfiles, setDemoProfiles] = useState<DemoUserProfile[]>(() => {
    let localList: DemoUserProfile[] = [];
    try {
      const saved = localStorage.getItem('gobell_demo_profiles_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localList = parsed;
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    const fileList = Array.isArray(savedDemoData?.demoProfiles)
      ? savedDemoData.demoProfiles
      : [];
    const chosenList = fileList.length > localList.length ? fileList : localList;
    if (chosenList.length > 0) {
      return chosenList.map((p) => {
        if (p.id === 'demo-user-1' || p.userTag === '48K9mP2x') {
          return {
            ...p,
            tier: 'PRO',
            proPackage: 'PRO_PLUS_3',
            proPictogram: 'CROWN',
          };
        }
        if (p.userTag === 'VmEiio4c') {
          return {
            ...p,
            tier: 'FREE',
          };
        }
        if (p.userTag === 'Lvd6zTcK' && p.name === 'Александр') {
          return {
            ...p,
            name: 'Олег Васильевич',
            nickname: '@Олег',
            description: 'Рыбалка на Днепре  лодка снасти  прикормка',
            showName: true,
            showNickname: false,
            showDescription: true,
            latOffset: -2.369424,
            lngOffset: 4.5181,
          };
        }
        return p;
      });
    }
    return [
      {
        id: 'demo-user-1',
        userTag: '48K9mP2x',
        tier: 'FREE',
        proPictogram: 'GOLD_BUST',
        karmaPlus: DEFAULT_STARTING_KARMA_PLUS,
        karmaMinus: 0,
        name: 'Александр',
        nickname: '@alex_gobell',
        description: 'Кофе выпечка интернет коворкинг помощь зарядка',
        showName: true,
        showNickname: true,
        showDescription: true,
        latOffset: 0,
        lngOffset: 0,
        autoGeo: true,
        pushNotifications: true,
        showDistance: true,
        communityId: 'community-fedorovka',
      },
    ];
  });
  const [activeDemoProfileId, setActiveDemoProfileId] = useState<string>(() => {
    try {
      const localId = localStorage.getItem('gobell_active_demo_id_v1');
      if (localId) return localId;
    } catch {
      // ignore
    }
    return savedDemoData?.activeDemoProfileId || 'demo-user-1';
  });

  // СПИСОК ДЕМО-КОМЬЮНИТИ (Федоровка, Беженцы Украины в Европе и др.) И АКТИВНОЕ ДЕМО-КОМЬЮНИТИ
  const [demoCommunities, setDemoCommunities] = useState<DemoCommunityItem[]>(() => {
    let localComms: DemoCommunityItem[] = [];
    try {
      const saved = localStorage.getItem('gobell_demo_communities_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localComms = parsed;
        }
      }
    } catch {
      // ignore localStorage read errors
    }
    const fileComms = Array.isArray(savedDemoData?.demoCommunities)
      ? savedDemoData.demoCommunities
      : [];
    if (fileComms.length > localComms.length) {
      return fileComms;
    }
    if (localComms.length > 0) {
      return localComms;
    }
    return DEFAULT_DEMO_COMMUNITIES;
  });
  const [activeDemoCommunityId, setActiveDemoCommunityId] = useState<string>(() => {
    try {
      const localComm = localStorage.getItem('gobell_active_community_id_v1');
      if (localComm) return localComm;
    } catch {
      // ignore
    }
    return savedDemoData?.activeDemoCommunityId || 'community-fedorovka';
  });
  // Текущее комьюнити создаваемого/редактируемого пользователя в Кабинете
  const [myCommunityId, setMyCommunityId] = useState<string>('community-fedorovka');
  // Полноэкранная отдельная страница «Демо-Комьюнити и список пользователей выбранного комьюнити»
  const [isCommunitiesPageOpen, setIsCommunitiesPageOpen] = useState<boolean>(false);
  // Полноэкранная страница документации проекта (DOCS.md)
  const [isDocsModalOpen, setIsDocsModalOpen] = useState<boolean>(false);
  // Состояние раздела «О нас» внутри вкладки Settings: 'NONE' (основные настройки) | 'LIST' (список документов) | 'DOC_FINANCING' (Док №1: Схема финансирования стартапа) | 'DOC_ONTOLOGY' (Док №2: Архитектура и онтология)
  const [settingsAboutUsView, setSettingsAboutUsView] = useState<
    'NONE' | 'LIST' | 'DOC_FINANCING' | 'DOC_ONTOLOGY'
  >('NONE');
  // Демо-состояние таблички сбора (без показа сумм взносов: только достигнутый результат в годах, уровень PRO+, остаток до следующего уровня и пирамида приглашённых вниз)
  const [crowdfundingAchievedYears, setCrowdfundingAchievedYears] = useState<number>(2);
  const [crowdfundingInvitedList, setCrowdfundingInvitedList] = useState<
    Array<{
      id: string;
      name: string;
      joinedAt: string;
      achievedBadge: 'PRO' | 'PRO + I' | 'PRO + II' | 'PRO + III';
      achievedYears: number;
      downline: Array<{
        id: string;
        name: string;
        achievedBadge: 'PRO' | 'PRO + I';
        joinedAt: string;
      }>;
    }>
  >([
    {
      id: 'ref-1',
      name: 'Андрей · СТО и Шиномонтаж',
      joinedAt: 'Сегодня, 09:15',
      achievedBadge: 'PRO + I',
      achievedYears: 2,
      downline: [
        {id: 'ref-1-1', name: 'Максим · Эвакуатор 24/7', achievedBadge: 'PRO', joinedAt: '09:40'},
        {id: 'ref-1-2', name: 'Игорь · Автоэлектрик', achievedBadge: 'PRO + I', joinedAt: '10:05'},
        {id: 'ref-1-3', name: 'Сергей · Запчасти', achievedBadge: 'PRO', joinedAt: '10:22'},
      ],
    },
    {
      id: 'ref-2',
      name: 'Елена · Домашняя пекарня',
      joinedAt: 'Сегодня, 10:12',
      achievedBadge: 'PRO + I',
      achievedYears: 1,
      downline: [
        {id: 'ref-2-1', name: 'Ольга · Кондитер', achievedBadge: 'PRO', joinedAt: '10:50'},
      ],
    },
    {
      id: 'ref-3',
      name: 'Тарас · Перевозки Варшава–Киев',
      joinedAt: 'Сегодня, 11:04',
      achievedBadge: 'PRO + II',
      achievedYears: 3,
      downline: [
        {id: 'ref-3-1', name: 'Богдан · Бус Германия', achievedBadge: 'PRO + I', joinedAt: '11:30'},
        {id: 'ref-3-2', name: 'Оксана · Переводы документов', achievedBadge: 'PRO', joinedAt: '11:45'},
      ],
    },
    {
      id: 'ref-4',
      name: 'Дмитрий · Ремонт техники',
      joinedAt: 'Сегодня, 11:48',
      achievedBadge: 'PRO',
      achievedYears: 1,
      downline: [],
    },
    {
      id: 'ref-5',
      name: 'Марина · Репетитор английского',
      joinedAt: 'Сегодня, 12:15',
      achievedBadge: 'PRO + I',
      achievedYears: 1,
      downline: [
        {id: 'ref-5-1', name: 'Анна · Логопед', achievedBadge: 'PRO', joinedAt: '12:40'},
      ],
    },
    {
      id: 'ref-6',
      name: 'Виктор · Фермерские продукты',
      joinedAt: 'Сегодня, 12:50',
      achievedBadge: 'PRO',
      achievedYears: 2,
      downline: [],
    },
    {
      id: 'ref-7',
      name: 'Олег · Строительная бригада',
      joinedAt: 'Сегодня, 13:10',
      achievedBadge: 'PRO + I',
      achievedYears: 1,
      downline: [
        {id: 'ref-7-1', name: 'Павел · Сантехник', achievedBadge: 'PRO', joinedAt: '13:25'},
      ],
    },
  ]);
  const [expandedReferralIds, setExpandedReferralIds] = useState<string[]>(['ref-1', 'ref-3']);
  const [newCommunityNameDraft, setNewCommunityNameDraft] = useState<string>('');
  const [newCommunityDescDraft, setNewCommunityDescDraft] = useState<string>('');
  const [newCommunityCoordsDraft, setNewCommunityCoordsDraft] = useState<string>('');

  // При загрузке сверяемся с серверным файлом /api/demo-state (если в режиме Просмотра в файле больше данных — подгружаем их)
  useEffect(() => {
    fetch('/api/demo-state')
      .then((r) => (r.ok ? r.json() : null))
      .then((serverState) => {
        if (
          serverState &&
          Array.isArray(serverState.demoProfiles) &&
          serverState.demoProfiles.length > demoProfiles.length
        ) {
          setDemoProfiles(serverState.demoProfiles);
          if (Array.isArray(serverState.demoCommunities) && serverState.demoCommunities.length > 0) {
            setDemoCommunities(serverState.demoCommunities);
          }
          if (serverState.activeDemoCommunityId) {
            setActiveDemoCommunityId(serverState.activeDemoCommunityId);
          }
          if (serverState.activeDemoProfileId) {
            const target = serverState.demoProfiles.find(
              (p: DemoUserProfile) => p.id === serverState.activeDemoProfileId
            );
            if (target) {
              handleSelectDemoProfile(target);
            }
          }
        }
      })
      .catch(() => {
        // ignore in static environment
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Автосохранение в localStorage И напрямую в файл проекта src/data/savedDemoData.json (через /api/demo-state)
  useEffect(() => {
    try {
      localStorage.setItem('gobell_demo_communities_v1', JSON.stringify(demoCommunities));
      localStorage.setItem('gobell_active_community_id_v1', activeDemoCommunityId);
      localStorage.setItem('gobell_demo_profiles_v1', JSON.stringify(demoProfiles));
      localStorage.setItem('gobell_active_demo_id_v1', activeDemoProfileId);
    } catch {
      // ignore localStorage write errors
    }

    const payload = {
      updatedAt: Date.now(),
      activeDemoCommunityId,
      activeDemoProfileId,
      searchCenter,
      demoCommunities,
      demoProfiles,
    };
    fetch('/api/demo-state', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    }).catch(() => {
      // ignore network error in static preview
    });
  }, [
    demoCommunities,
    activeDemoCommunityId,
    demoProfiles,
    activeDemoProfileId,
    searchCenter,
  ]);
  const [currentAccountTier, setCurrentAccountTier] = useState<AccountTier>('FREE');
  const [myProPackage, setMyProPackage] = useState<ProPackageLevel>('PRO');
  const [mySubscriptionPayoffUsd, setMySubscriptionPayoffUsd] = useState<number>(0);
  const [myProPictogram, setMyProPictogram] = useState<ProPictogramType>('GOLD_BUST');
  const [myKarmaPlus, setMyKarmaPlus] = useState<number>(DEFAULT_STARTING_KARMA_PLUS);
  const [myKarmaMinus, setMyKarmaMinus] = useState<number>(0);
  const [myConsecutiveMinuses, setMyConsecutiveMinuses] = useState<number>(0);
  const [myBannedUntilMs, setMyBannedUntilMs] = useState<number | null>(null);
  // Хранилище времени последней оценки кармы между конкретной парой пользователей ("оценивающий->оцениваемый": timestampMs), лимит — 1 раз в месяц
  const [karmaPairLastRatedMs, setKarmaPairLastRatedMs] = useState<Record<string, number>>({});

  // Panel "Пользователи" opened when entering any mode (FREE / PRO / BUSINESS)
  const [isUsersPanelOpen, setIsUsersPanelOpen] = useState<boolean>(false);
  const [usersPanelTab, setUsersPanelTab] = useState<'SELECT_USER' | 'CREATE_USER'>('SELECT_USER');
  const [selectedAdminTier, setSelectedAdminTier] = useState<AccountTier>('FREE');

  // Режим полного Кабинета пользователя при создании или редактировании пользователя из панели «Пользователи»
  const [cabinetAdminMode, setCabinetAdminMode] = useState<'NONE' | 'CREATE_USER' | 'EDIT_USER'>(
    'NONE'
  );
  // 8-значный системный тег для создаваемого/редактируемого пользователя в полном Кабинете
  const [newDemoGeneratedTag, setNewDemoGeneratedTag] = useState<string>(() =>
    generateEightCharUserTag()
  );
  // В каком профиле мы находились до открытия режима создания нового пользователя (чтобы при отмене вернуться)
  const [previousActiveDemoProfileId, setPreviousActiveDemoProfileId] =
    useState<string>('demo-user-1');

  // Inline editing state in "select a user" list (кнопка Редактировать / Применить)
  const [editingDemoUserId, setEditingDemoUserId] = useState<string | null>(null);
  const [editDemoNameDraft, setEditDemoNameDraft] = useState<string>('');
  const [editDemoLatDraft, setEditDemoLatDraft] = useState<string>('');
  const [editDemoLngDraft, setEditDemoLngDraft] = useState<string>('');

  // Dynamic word limit based on active tier & PRO package:
  // FREE = 6 words in Profile / 10 in Advert
  // PRO = 10 words, PRO + I = 15 words, PRO + II = 20 words, PRO + III = 25 words
  // BUSINESS = 50 words in Profile / 25 in Advert
  const maxDescriptionWordsForCurrentTier =
    currentAccountTier === 'FREE'
      ? MAX_FREE_DESCRIPTION_WORDS
      : currentAccountTier === 'PRO'
      ? PRO_PACKAGE_META[myProPackage].maxWords
      : 50;

  const maxAdvertWordsForCurrentTier =
    currentAccountTier === 'FREE'
      ? 10
      : currentAccountTier === 'PRO'
      ? PRO_PACKAGE_META[myProPackage].maxWords
      : 25;

  const allowedAdvertSlotsCount =
    currentAccountTier === 'FREE'
      ? 1
      : currentAccountTier === 'PRO'
      ? PRO_PACKAGE_META[myProPackage].advertSlots
      : 4;

  // User's Own Profile in Cabinet: Имя, Ник нейм, Описание
  // Each field has Edit/Apply (Редактировать / Применить) and Show/Hide (Показать / Не показывать)
  const [profileName, setProfileName] = useState<string>('Александр');
  const [profileNameDraft, setProfileNameDraft] = useState<string>('Александр');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [showProfileName, setShowProfileName] = useState<boolean>(true);

  const [profileNickname, setProfileNickname] = useState<string>('@alex_gobell');
  const [profileNicknameDraft, setProfileNicknameDraft] = useState<string>('@alex_gobell');
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [showProfileNickname, setShowProfileNickname] = useState<boolean>(true);

  const [profileDescription, setProfileDescription] = useState<string>(
    'Кофе выпечка интернет коворкинг помощь зарядка'
  );
  const [profileDescriptionDraft, setProfileDescriptionDraft] = useState<string>(
    'Кофе выпечка интернет коворкинг помощь зарядка'
  );
  const [isEditingDescription, setIsEditingDescription] = useState<boolean>(false);
  const [showProfileDescription, setShowProfileDescription] = useState<boolean>(true);

  const [myDisabledWords, setMyDisabledWords] = useState<Set<string>>(new Set());
  const [myPositionOffset, setMyPositionOffset] = useState<{lat: number; lng: number}>({
    lat: 0,
    lng: 0,
  });
  const [profileGeoCoordsDraft, setProfileGeoCoordsDraft] = useState<string>(
    `${DEFAULT_CENTER.lat.toFixed(6)}, ${DEFAULT_CENTER.lng.toFixed(6)}`
  );
  const [isEditingProfileGeo, setIsEditingProfileGeo] = useState<boolean>(false);

  // Автоматическое отключение сигнала SOS по истечении 1 часа показа, снятие недельного бана по истечении 7 суток и автопродление 24ч объявлений PRO
  useEffect(() => {
    if (mySosActive && mySosExpiresAtMs && nowMs >= mySosExpiresAtMs) {
      setMySosActive(false);
      setMySosExpiresAtMs(null);
    }
    if (myBannedUntilMs && nowMs >= myBannedUntilMs) {
      setMyBannedUntilMs(null);
    }
    // Автопродление объявлений и слотов Monetize (Биржа) в режиме PRO / BUSINESS + обработка 24ч буфера возврата с биржи и начислений по факту
    if (currentAccountTier !== 'FREE') {
      let activeMonetizedSlotsCount = 0;

      setMyAdvertSlots((prev) => {
        let changed = false;
        const next = prev.map((slot, idx) => {
          let updatedSlot = slot;

          // 1. Завершение 24-часового буфера возврата с биржи
          if (
            updatedSlot.monetizeWithdrawingUntilMs &&
            nowMs >= updatedSlot.monetizeWithdrawingUntilMs
          ) {
            changed = true;
            updatedSlot = {
              ...updatedSlot,
              monetizeActive: false,
              monetizeWithdrawingUntilMs: null,
              monetizeExpiresAtMs: null,
              monetizeUntilMs: null,
            };
          }

          // 2. Работа слота в пуле Биржи (Monetize: ВКЛ) по таймингу слота
          if (updatedSlot.monetizeActive && updatedSlot.monetizeExpiresAtMs) {
            if (idx < allowedAdvertSlotsCount) {
              activeMonetizedSlotsCount += 1;
            }
            if (nowMs >= updatedSlot.monetizeExpiresAtMs) {
              if (updatedSlot.autoRenewMode === 'INFINITE') {
                changed = true;
                updatedSlot = {
                  ...updatedSlot,
                  monetizeExpiresAtMs: nowMs + TWENTY_FOUR_HOURS_MS,
                };
              } else if (
                updatedSlot.autoRenewMode === 'DAYS' &&
                updatedSlot.monetizeUntilMs &&
                nowMs < updatedSlot.monetizeUntilMs
              ) {
                changed = true;
                updatedSlot = {
                  ...updatedSlot,
                  monetizeExpiresAtMs: Math.min(
                    updatedSlot.monetizeUntilMs,
                    nowMs + TWENTY_FOUR_HOURS_MS
                  ),
                };
              } else {
                // Срок тайминга на бирже истёк — запускается 24ч буфер возврата слота с биржи
                changed = true;
                updatedSlot = {
                  ...updatedSlot,
                  monetizeActive: false,
                  monetizeExpiresAtMs: null,
                  monetizeUntilMs: null,
                  monetizeWithdrawingUntilMs: nowMs + TWENTY_FOUR_HOURS_MS,
                };
              }
            }
          }

          // 3. Автопродление личного объявления
          const pub = updatedSlot.published;
          if (!pub || pub.stoppedEarly) return updatedSlot;
          if (nowMs < pub.expiresAtMs) return updatedSlot;

          if (pub.autoRenewMode === 'INFINITE') {
            changed = true;
            return {
              ...updatedSlot,
              published: {
                ...pub,
                expiresAtMs: nowMs + TWENTY_FOUR_HOURS_MS,
              },
            };
          }
          if (
            pub.autoRenewMode === 'DAYS' &&
            pub.autoRenewUntilMs &&
            nowMs < pub.autoRenewUntilMs
          ) {
            changed = true;
            return {
              ...updatedSlot,
              published: {
                ...pub,
                expiresAtMs: Math.min(pub.autoRenewUntilMs, nowMs + TWENTY_FOUR_HOURS_MS),
              },
            };
          }
          return updatedSlot;
        });
        return changed ? next : prev;
      });

      // Начисление по факту в счётчик погашения подписки за активные слоты в пуле Monetize (пропорционально числу слотов и лимиту слов)
      if (activeMonetizedSlotsCount > 0) {
        const wordWeight = maxAdvertWordsForCurrentTier / 10; // 1.0x (10 слов), 1.5x (15 слов), 2.0x (20 слов), 2.5x (25 слов)
        const dripPerSecond = activeMonetizedSlotsCount * wordWeight * 0.0025;
        setMySubscriptionPayoffUsd((prev) => Number((prev + dripPerSecond).toFixed(4)));
      }
    }
  }, [
    mySosActive,
    mySosExpiresAtMs,
    myBannedUntilMs,
    currentAccountTier,
    allowedAdvertSlotsCount,
    maxAdvertWordsForCurrentTier,
    nowMs,
  ]);

  const hasHydratedInitialProfileRef = useRef<boolean>(false);

  // Sync changes back to the active demo profile entry in demoProfiles list (when not in CREATE_USER draft mode)
  useEffect(() => {
    if (!hasHydratedInitialProfileRef.current) return;
    if (cabinetAdminMode === 'CREATE_USER') return;
    setDemoProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== activeDemoProfileId) return p;
        // Защита от перезаписи дефолтным состоянием до завершения первого рендера гидратации
        if (
          profileName === 'Александр' &&
          profileNickname === '@alex_gobell' &&
          p.name !== 'Александр'
        ) {
          return p;
        }
        return {
          ...p,
          tier: currentAccountTier,
          proPackage: myProPackage,
          proPictogram: myProPictogram,
          karmaPlus: myKarmaPlus,
          karmaMinus: myKarmaMinus,
          consecutiveMinuses: myConsecutiveMinuses,
          bannedUntilMs: myBannedUntilMs,
          name: profileName,
          nickname: profileNickname,
          description: profileDescription,
          showName: showProfileName,
          showNickname: showProfileNickname,
          showDescription: showProfileDescription,
          disabledWords: Array.from(myDisabledWords),
          groupSlots,
          createdProGroups: myCreatedProGroups,
          advertSlots: myAdvertSlots,
          subscriptionPayoffUsd: mySubscriptionPayoffUsd,
          advertDraftText: myAdvertDraftText,
          publishedAdvert,
          sosText: mySosText,
          sosActive: mySosActive,
          sosExpiresAtMs: mySosExpiresAtMs,
          autoGeo: settingsAutoGeo,
          pushNotifications: settingsPushNotifications,
          showDistance: settingsShowDistance,
          latOffset: myPositionOffset.lat,
          lngOffset: myPositionOffset.lng,
          communityId: myCommunityId || activeDemoCommunityId,
        };
      })
    );
  }, [
    cabinetAdminMode,
    activeDemoProfileId,
    currentAccountTier,
    myProPackage,
    myProPictogram,
    myKarmaPlus,
    myKarmaMinus,
    myConsecutiveMinuses,
    myBannedUntilMs,
    profileName,
    profileNickname,
    profileDescription,
    showProfileName,
    showProfileNickname,
    showProfileDescription,
    myDisabledWords,
    groupSlots,
    myCreatedProGroups,
    myAdvertSlots,
    mySubscriptionPayoffUsd,
    myAdvertDraftText,
    publishedAdvert,
    mySosText,
    mySosActive,
    mySosExpiresAtMs,
    settingsAutoGeo,
    settingsPushNotifications,
    settingsShowDistance,
    myPositionOffset,
    myCommunityId,
    activeDemoCommunityId,
  ]);

  // Switch active demonstration into a selected demo user profile (loads full cabinet state of that user)
  const handleSelectDemoProfile = useCallback(
    (targetProfile: DemoUserProfile) => {
      setActiveDemoProfileId(targetProfile.id);
      setCurrentAccountTier(targetProfile.tier);
      const targetProPkg = targetProfile.proPackage || 'PRO';
      setMyProPackage(targetProPkg);
      setMyProPictogram(targetProfile.proPictogram || 'GOLD_BUST');
      setMyKarmaPlus(targetProfile.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS);
      setMyKarmaMinus(targetProfile.karmaMinus ?? 0);
      setMyConsecutiveMinuses(targetProfile.consecutiveMinuses ?? 0);
      setMyBannedUntilMs(targetProfile.bannedUntilMs ?? null);
      setProfileName(targetProfile.name);
      setProfileNameDraft(targetProfile.name);
      setIsEditingName(false);
      setShowProfileName(targetProfile.showName);

      setProfileNickname(targetProfile.nickname);
      setProfileNicknameDraft(targetProfile.nickname);
      setIsEditingNickname(false);
      setShowProfileNickname(targetProfile.showNickname);

      const maxWords =
        targetProfile.tier === 'FREE'
          ? MAX_FREE_DESCRIPTION_WORDS
          : targetProfile.tier === 'PRO'
          ? PRO_PACKAGE_META[targetProPkg].maxWords
          : 50;
      const cleanDesc = limitWords(targetProfile.description, maxWords);
      setProfileDescription(cleanDesc);
      setProfileDescriptionDraft(cleanDesc);
      setIsEditingDescription(false);
      setShowProfileDescription(targetProfile.showDescription);

      setMyDisabledWords(new Set(targetProfile.disabledWords || []));
      setGroupSlots(
        targetProfile.groupSlots || [
          {slotId: 1, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
          {slotId: 2, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
          {slotId: 3, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
        ]
      );
      setMyCreatedProGroups(
        targetProfile.createdProGroups && targetProfile.createdProGroups.length === 4
          ? targetProfile.createdProGroups
          : createDefaultProGroupSlots()
      );
      setMyAdvertSlots(
        targetProfile.advertSlots && targetProfile.advertSlots.length === 4
          ? targetProfile.advertSlots
          : createDefaultAdvertSlots(
              targetProfile.advertDraftText ||
                'Продам велосипед горный отличное состояние или сдам в аренду'
            )
      );
      setMySubscriptionPayoffUsd(targetProfile.subscriptionPayoffUsd ?? 0);
      setMyAdvertDraftText(
        targetProfile.advertDraftText ||
          'Продам велосипед горный отличное состояние или сдам в аренду'
      );
      setPublishedAdvert(targetProfile.publishedAdvert || null);
      setMySosText(
        targetProfile.sosText ||
          'Нужна помощь сел аккумулятор прикурить авто провода есть'
      );
      setMySosActive(Boolean(targetProfile.sosActive));
      setMySosExpiresAtMs(targetProfile.sosExpiresAtMs || null);

      const targetCommunityId = targetProfile.communityId || 'community-fedorovka';
      setMyCommunityId(targetCommunityId);
      setActiveDemoCommunityId(targetCommunityId);
      setMyPositionOffset({lat: targetProfile.latOffset, lng: targetProfile.lngOffset});
      setSettingsAutoGeo(targetProfile.autoGeo);
      setSettingsPushNotifications(targetProfile.pushNotifications);
      setSettingsShowDistance(targetProfile.showDistance);
      const targetGeo = {
        lat: anchorClusterCenter.lat + targetProfile.latOffset,
        lng: anchorClusterCenter.lng + targetProfile.lngOffset,
      };
      setUserPhysicalGeo(targetGeo);
      setSearchCenter(targetGeo);
      setProfileGeoCoordsDraft(`${targetGeo.lat.toFixed(6)}, ${targetGeo.lng.toFixed(6)}`);
      setIsEditingProfileGeo(false);
      map?.panTo(targetGeo);
    },
    [anchorClusterCenter, map]
  );

  // Как только экземпляр Google Map загрузился, автоматически наводим камеру на текущую точку поиска / активного пользователя комьюнити
  const hasCenteredMapOnInitRef = useRef<boolean>(false);
  useEffect(() => {
    if (!map || hasCenteredMapOnInitRef.current) return;
    hasCenteredMapOnInitRef.current = true;
    map.panTo(searchCenter);
  }, [map, searchCenter]);
  useEffect(() => {
    if (hasHydratedInitialProfileRef.current) return;
    hasHydratedInitialProfileRef.current = true;
    const initialTarget =
      demoProfiles.find((p) => p.id === activeDemoProfileId) || demoProfiles[0];
    if (initialTarget) {
      handleSelectDemoProfile(initialTarget);
    }
  }, [demoProfiles, activeDemoProfileId, handleSelectDemoProfile]);

  // Выбор режима (FREE / PRO / BUSINESS) в нижней демо-панели для создания нового пользователя (не сбивает статус уже созданного активного профиля!)
  const handleSwitchActiveDemoTier = useCallback(
    (nextTier: AccountTier) => {
      setSelectedAdminTier(nextTier);
      setIsUsersPanelOpen(true);
      if (cabinetAdminMode !== 'NONE') {
        setCurrentAccountTier(nextTier);
        if (nextTier === 'FREE') {
          const trimmedToSix = limitWords(profileDescription, MAX_FREE_DESCRIPTION_WORDS);
          setProfileDescription(trimmedToSix);
          setProfileDescriptionDraft(trimmedToSix);
        }
      }
    },
    [cabinetAdminMode, profileDescription]
  );

  // Открыть ПОЛНЫЙ КАБИНЕТ ПОЛЬЗОВАТЕЛЯ в режиме СОЗДАНИЯ нового пользователя (create a user)
  const handleStartCreateUserFullCabinet = useCallback(() => {
    const freshTag = generateEightCharUserTag();
    setNewDemoGeneratedTag(freshTag);
    setPreviousActiveDemoProfileId(activeDemoProfileId);
    setCabinetAdminMode('CREATE_USER');
    setUsersPanelTab('CREATE_USER');
    setCurrentAccountTier(selectedAdminTier);
    setMyProPictogram('GOLD_BUST');
    setMyKarmaPlus(DEFAULT_STARTING_KARMA_PLUS);
    setMyKarmaMinus(0);
    setMyConsecutiveMinuses(0);
    setMyBannedUntilMs(null);

    setProfileName('');
    setProfileNameDraft('');
    setIsEditingName(true);
    setShowProfileName(true);

    setProfileNickname(`@user_${freshTag.toLowerCase()}`);
    setProfileNicknameDraft(`@user_${freshTag.toLowerCase()}`);
    setIsEditingNickname(true);
    setShowProfileNickname(true);

    setProfileDescription('');
    setProfileDescriptionDraft('');
    setIsEditingDescription(true);
    setShowProfileDescription(true);

    setMyDisabledWords(new Set());
    setGroupSlots([
      {slotId: 1, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
      {slotId: 2, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
      {slotId: 3, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
    ]);
    setMyCreatedProGroups(createDefaultProGroupSlots());
    setMyAdvertSlots(createDefaultAdvertSlots(''));
    setMySubscriptionPayoffUsd(0);
    setMyAdvertDraftText('');
    setPublishedAdvert(null);
    setMySosText('Нужна помощь сел аккумулятор прикурить авто провода есть');
    setMySosActive(false);
    setMySosExpiresAtMs(null);

    // Привязываем создаваемого пользователя к текущему выбранному Демо-Комьюнити и к центру текущего радиуса поиска на карте
    setMyCommunityId(activeDemoCommunityId);
    const newLatOffset = searchCenter.lat - anchorClusterCenter.lat;
    const newLngOffset = searchCenter.lng - anchorClusterCenter.lng;
    setMyPositionOffset({lat: newLatOffset, lng: newLngOffset});
    setUserPhysicalGeo(searchCenter);
    const formattedCoords = `${searchCenter.lat.toFixed(6)}, ${searchCenter.lng.toFixed(6)}`;
    setProfileGeoCoordsDraft(formattedCoords);
    setIsEditingProfileGeo(true);
    setEditDemoLatDraft(searchCenter.lat.toFixed(6));
    setEditDemoLngDraft(searchCenter.lng.toFixed(6));

    setSettingsAutoGeo(true);
    setSettingsPushNotifications(true);
    setSettingsShowDistance(true);

      setCabinetTab('PROFILE');
      setIsCabinetOpen(true);
    }, [
      activeDemoProfileId,
      selectedAdminTier,
      searchCenter,
      anchorClusterCenter,
      activeDemoCommunityId,
    ]);

  // Открыть ПОЛНЫЙ КАБИНЕТ ПОЛЬЗОВАТЕЛЯ в режиме РЕДАКТИРОВАНИЯ существующего пользователя (Редактировать)
  const handleStartEditUserFullCabinet = useCallback(
    (dp: DemoUserProfile) => {
      handleSelectDemoProfile(dp);
      setEditingDemoUserId(dp.id);
      const latVal = anchorClusterCenter.lat + dp.latOffset;
      const lngVal = anchorClusterCenter.lng + dp.lngOffset;
      setEditDemoLatDraft(latVal.toFixed(6));
      setEditDemoLngDraft(lngVal.toFixed(6));
      setProfileGeoCoordsDraft(`${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`);
      setIsEditingProfileGeo(false);
      setCabinetAdminMode('EDIT_USER');
      setCabinetTab('PROFILE');
      setIsCabinetOpen(true);
    },
    [handleSelectDemoProfile, anchorClusterCenter]
  );

  // Применить скопированные из Google Maps координаты к текущему создаваемому/редактируемому профилю
  const applyGoogleCoordsToCurrentProfile = useCallback(
    (rawCoords: string): {lat: number; lng: number} | null => {
      const parsed = parseGoogleCoordsCopyPaste(rawCoords);
      if (!parsed) return null;
      const newLatOffset = parsed.lat - anchorClusterCenter.lat;
      const newLngOffset = parsed.lng - anchorClusterCenter.lng;
      setMyPositionOffset({lat: newLatOffset, lng: newLngOffset});
      setUserPhysicalGeo(parsed);
      setSearchCenter(parsed);
      setEditDemoLatDraft(parsed.lat.toFixed(6));
      setEditDemoLngDraft(parsed.lng.toFixed(6));
      setProfileGeoCoordsDraft(`${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`);
      map?.panTo(parsed);
      return parsed;
    },
    [anchorClusterCenter, map]
  );

  // Завершить создание или редактирование пользователя в полном Кабинете пользователя и вернуться в список "select a user"
  const handleFinishCabinetUserSave = useCallback(() => {
    const maxW =
      currentAccountTier === 'FREE'
        ? MAX_FREE_DESCRIPTION_WORDS
        : currentAccountTier === 'PRO'
        ? PRO_PACKAGE_META[myProPackage].maxWords
        : 50;

    // Если поля ещё были в режиме редактирования (не нажали Применить возле поля), берём актуальный черновик
    const finalName = (isEditingName ? profileNameDraft : profileName).trim() || `User_${newDemoGeneratedTag.slice(0, 4)}`;
    const rawNick = (isEditingNickname ? profileNicknameDraft : profileNickname).trim();
    const finalNick = rawNick
      ? rawNick.startsWith('@')
        ? rawNick
        : `@${rawNick}`
      : `@user_${newDemoGeneratedTag.toLowerCase()}`;
    const rawDesc = (isEditingDescription ? profileDescriptionDraft : profileDescription).trim();
    const finalDesc = limitWords(rawDesc, maxW);

    setProfileName(finalName);
    setProfileNameDraft(finalName);
    setIsEditingName(false);
    setProfileNickname(finalNick);
    setProfileNicknameDraft(finalNick);
    setIsEditingNickname(false);
    setProfileDescription(finalDesc);
    setProfileDescriptionDraft(finalDesc);
    setIsEditingDescription(false);
    setIsEditingProfileGeo(false);

    // Проверяем, были ли вставлены координаты из Google Maps в поле геолокации профиля
    const parsedFromCopyPaste = parseGoogleCoordsCopyPaste(profileGeoCoordsDraft);

    if (cabinetAdminMode === 'CREATE_USER') {
      const targetGeo = parsedFromCopyPaste || searchCenter;
      const newLatOffset = targetGeo.lat - anchorClusterCenter.lat;
      const newLngOffset = targetGeo.lng - anchorClusterCenter.lng;
      const newId = `demo-user-${Date.now()}`;

      const created: DemoUserProfile = {
        id: newId,
        userTag: newDemoGeneratedTag,
        tier: currentAccountTier,
        proPackage: myProPackage,
        proPictogram: myProPictogram,
        karmaPlus: myKarmaPlus,
        karmaMinus: myKarmaMinus,
        consecutiveMinuses: myConsecutiveMinuses,
        bannedUntilMs: myBannedUntilMs,
        name: finalName,
        nickname: finalNick,
        description: finalDesc,
        showName: showProfileName,
        showNickname: showProfileNickname,
        showDescription: showProfileDescription,
        disabledWords: Array.from(myDisabledWords),
        groupSlots,
        createdProGroups: myCreatedProGroups,
        advertSlots: myAdvertSlots,
        advertDraftText: myAdvertDraftText,
        publishedAdvert,
        sosText: mySosText,
        sosActive: mySosActive,
        sosExpiresAtMs: mySosExpiresAtMs,
        latOffset: newLatOffset,
        lngOffset: newLngOffset,
        autoGeo: settingsAutoGeo,
        pushNotifications: settingsPushNotifications,
        showDistance: settingsShowDistance,
        communityId: myCommunityId || activeDemoCommunityId,
      };

      setDemoProfiles((prev) => [created, ...prev]);
      setActiveDemoProfileId(newId);
      setActiveDemoCommunityId(myCommunityId || activeDemoCommunityId);
      setMyPositionOffset({lat: newLatOffset, lng: newLngOffset});
      setUserPhysicalGeo(targetGeo);
      setSearchCenter(targetGeo);
      map?.panTo(targetGeo);
    } else if (cabinetAdminMode === 'EDIT_USER' && editingDemoUserId) {
      const parsedLat = parsedFromCopyPaste ? parsedFromCopyPaste.lat : parseFloat(editDemoLatDraft);
      const parsedLng = parsedFromCopyPaste ? parsedFromCopyPaste.lng : parseFloat(editDemoLngDraft);
      const updatedLatOffset = Number.isFinite(parsedLat)
        ? parsedLat - anchorClusterCenter.lat
        : myPositionOffset.lat;
      const updatedLngOffset = Number.isFinite(parsedLng)
        ? parsedLng - anchorClusterCenter.lng
        : myPositionOffset.lng;

      const updatedGeo = {
        lat: anchorClusterCenter.lat + updatedLatOffset,
        lng: anchorClusterCenter.lng + updatedLngOffset,
      };
      setMyPositionOffset({lat: updatedLatOffset, lng: updatedLngOffset});
      setUserPhysicalGeo(updatedGeo);
      setSearchCenter(updatedGeo);
      map?.panTo(updatedGeo);
      setDemoProfiles((prev) =>
        prev.map((p) =>
          p.id === editingDemoUserId
            ? {
                ...p,
                tier: currentAccountTier,
                proPackage: myProPackage,
                proPictogram: myProPictogram,
                karmaPlus: myKarmaPlus,
                karmaMinus: myKarmaMinus,
                consecutiveMinuses: myConsecutiveMinuses,
                bannedUntilMs: myBannedUntilMs,
                name: finalName,
                nickname: finalNick,
                description: finalDesc,
                showName: showProfileName,
                showNickname: showProfileNickname,
                showDescription: showProfileDescription,
                disabledWords: Array.from(myDisabledWords),
                groupSlots,
                createdProGroups: myCreatedProGroups,
                advertSlots: myAdvertSlots,
                advertDraftText: myAdvertDraftText,
                publishedAdvert,
                sosText: mySosText,
                sosActive: mySosActive,
                sosExpiresAtMs: mySosExpiresAtMs,
                latOffset: updatedLatOffset,
                lngOffset: updatedLngOffset,
                autoGeo: settingsAutoGeo,
                pushNotifications: settingsPushNotifications,
                showDistance: settingsShowDistance,
                communityId: myCommunityId || activeDemoCommunityId,
              }
            : p
        )
      );
      setActiveDemoCommunityId(myCommunityId || activeDemoCommunityId);
      setEditingDemoUserId(null);
    }

    setCabinetAdminMode('NONE');
    setIsCabinetOpen(false);
    setUsersPanelTab('SELECT_USER');
    setIsUsersPanelOpen(true);
  }, [
    currentAccountTier,
    isEditingName,
    profileNameDraft,
    profileName,
    newDemoGeneratedTag,
    isEditingNickname,
    profileNicknameDraft,
    profileNickname,
    isEditingDescription,
    profileDescriptionDraft,
    profileDescription,
    cabinetAdminMode,
    searchCenter,
    anchorClusterCenter,
    myProPackage,
    myProPictogram,
    myKarmaPlus,
    myKarmaMinus,
    myConsecutiveMinuses,
    myBannedUntilMs,
    showProfileName,
    showProfileNickname,
    showProfileDescription,
    myDisabledWords,
    groupSlots,
    myCreatedProGroups,
    myAdvertSlots,
    myAdvertDraftText,
    publishedAdvert,
    mySosText,
    mySosActive,
    mySosExpiresAtMs,
    settingsAutoGeo,
    settingsPushNotifications,
    settingsShowDistance,
    editingDemoUserId,
    editDemoLatDraft,
    editDemoLngDraft,
    myPositionOffset,
    myCommunityId,
    activeDemoCommunityId,
    map,
    profileGeoCoordsDraft,
  ]);

  const combinedMyProfileText = useMemo(() => {
    const parts: string[] = [];
    if (showProfileName && profileName.trim()) parts.push(censorProfanityText(profileName.trim()));
    if (showProfileNickname && profileNickname.trim())
      parts.push(censorProfanityText(profileNickname.trim()));
    if (showProfileDescription && profileDescription.trim()) {
      parts.push(
        censorProfanityText(
          limitWords(profileDescription.trim(), maxDescriptionWordsForCurrentTier)
        )
      );
    }
    return parts.join(' ');
  }, [
    showProfileName,
    profileName,
    showProfileNickname,
    profileNickname,
    showProfileDescription,
    profileDescription,
    maxDescriptionWordsForCurrentTier,
  ]);

  const combinedMyDisplayName = useMemo(() => {
    const nameParts: string[] = [];
    if (showProfileName && profileName.trim())
      nameParts.push(censorProfanityText(profileName.trim()));
    if (showProfileNickname && profileNickname.trim())
      nameParts.push(censorProfanityText(profileNickname.trim()));
    return nameParts.length > 0 ? nameParts.join(' · ') : 'Профиль пользователя';
  }, [showProfileName, profileName, showProfileNickname, profileNickname]);

  // Динамический каталог всех групп: базовые группы + все группы, созданные пользователями PRO / PRO+
  const allKnownGroupsCatalog: Record<string, GroupCatalogInfo> = useMemo(() => {
    const catalog: Record<string, GroupCatalogInfo> = {...KNOWN_GROUPS_CATALOG};

    for (const dp of demoProfiles) {
      if (dp.tier === 'FREE') continue;
      const dpAllowedGroups =
        dp.tier === 'PRO' ? PRO_PACKAGE_META[dp.proPackage || 'PRO'].advertSlots : 4;
      const dpCreatedList = (dp.createdProGroups || []).slice(0, dpAllowedGroups);
      for (const cg of dpCreatedList) {
        if (cg.isCreated && cg.tag.trim()) {
          const norm = cg.tag.trim().toLowerCase();
          catalog[norm] = {
            tag: cg.tag.trim(),
            name: censorProfanityText(cg.name.trim()) || `Группа ${cg.tag.trim()}`,
            description:
              censorProfanityText(cg.description.trim()) ||
              'Группа, созданная пользователем PRO.',
            accessType: cg.accessType,
            adminName: `${censorProfanityText(dp.name)} (Создатель группы)`,
            adminId: dp.id,
            adminLatOffset: dp.latOffset,
            adminLngOffset: dp.lngOffset,
          };
        }
      }
    }

    if (currentAccountTier !== 'FREE') {
      const myAllowedGroups =
        currentAccountTier === 'PRO' ? PRO_PACKAGE_META[myProPackage].advertSlots : 4;
      for (const cg of myCreatedProGroups.slice(0, myAllowedGroups)) {
        if (cg.isCreated && cg.tag.trim()) {
          const norm = cg.tag.trim().toLowerCase();
          catalog[norm] = {
            tag: cg.tag.trim(),
            name: censorProfanityText(cg.name.trim()) || `Группа ${cg.tag.trim()}`,
            description:
              censorProfanityText(cg.description.trim()) ||
              'Группа, созданная пользователем PRO.',
            accessType: cg.accessType,
            adminName: `${combinedMyDisplayName} (Создатель группы)`,
            adminId: activeDemoProfileId,
            adminLatOffset: myPositionOffset.lat,
            adminLngOffset: myPositionOffset.lng,
          };
        }
      }
    }

    return catalog;
  }, [
    demoProfiles,
    currentAccountTier,
    myProPackage,
    myCreatedProGroups,
    combinedMyDisplayName,
    activeDemoProfileId,
    myPositionOffset,
  ]);

  // Build active profiles list around the current city anchor (including other demo profiles & custom group tags)
  const allActiveProfiles: ActiveProfileItem[] = useMemo(() => {
    const community: ActiveProfileItem[] = INITIAL_PROFILES.map((item) => ({
      ...item,
      position: {
        lat: anchorClusterCenter.lat + item.latOffset,
        lng: anchorClusterCenter.lng + item.lngOffset,
      },
    }));

    // Add all OTHER created demo profiles of the SELECTED DEMO COMMUNITY onto the map: user status is strictly their tier (FREE, PRO, or BUSINESS); забаненные на неделю (3 минуса подряд) скрываются с карты
    for (const dp of demoProfiles) {
      if ((dp.communityId || 'community-fedorovka') !== activeDemoCommunityId) continue;
      if (dp.id === activeDemoProfileId && cabinetAdminMode !== 'CREATE_USER') continue;
      if (dp.bannedUntilMs && nowMs < dp.bannedUntilMs) continue;
      const dpGroupTags = (dp.groupSlots || [])
        .filter((s) => {
          const info = allKnownGroupsCatalog[s.tag.trim().toLowerCase()];
          const isClosed =
            info?.accessType === 'CLOSED' || s.tag.trim().toUpperCase().startsWith('GC-');
          return s.tag.trim().length > 0 && (!isClosed || s.adminApproved);
        })
        .map((s) => s.tag.trim())
        .join(' ');

      const dpAllowedCreated =
        dp.tier === 'FREE'
          ? 0
          : dp.tier === 'PRO'
          ? PRO_PACKAGE_META[dp.proPackage || 'PRO'].advertSlots
          : 4;
      const dpCreatedTags = (dp.createdProGroups || [])
        .slice(0, dpAllowedCreated)
        .filter((cg) => cg.isCreated && cg.tag.trim().length > 0)
        .map((cg) => cg.tag.trim())
        .join(' ');

      const dpParts: string[] = [dp.userTag];
      if (dp.showName && dp.name.trim()) dpParts.push(censorProfanityText(dp.name.trim()));
      if (dp.showNickname && dp.nickname.trim())
        dpParts.push(censorProfanityText(dp.nickname.trim()));
      if (dp.showDescription && dp.description.trim())
        dpParts.push(censorProfanityText(dp.description.trim()));
      if (dpGroupTags) dpParts.push(dpGroupTags);
      if (dpCreatedTags) dpParts.push(dpCreatedTags);
      const dpText = dpParts.join(' ');
      if (!dpText) continue;

      const dpIdentityParts: string[] = [];
      if (dp.showName && dp.name.trim()) dpIdentityParts.push(censorProfanityText(dp.name.trim()));
      else if (dp.showNickname && dp.nickname.trim())
        dpIdentityParts.push(censorProfanityText(dp.nickname.trim()));
      const dpVisibleIdentity = dpIdentityParts.join(' ');
      const dpVisibleDesc = dp.showDescription ? censorProfanityText(dp.description.trim()) : '';

      community.unshift({
        id: dp.id,
        authorName: dpVisibleIdentity || censorProfanityText(dp.name),
        visibleIdentityLabel: dpVisibleIdentity,
        visibleDescription: dpVisibleDesc,
        karmaPlus: dp.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS,
        karmaMinus: dp.karmaMinus ?? 0,
        userTier: dp.tier,
        proPictogram: dp.proPictogram || 'GOLD_BUST',
        category: dp.tier === 'BUSINESS' ? 'BUSINESS' : undefined,
        profileText: dpText,
        disabledWords: dp.disabledWords,
        latOffset: dp.latOffset,
        lngOffset: dp.lngOffset,
        position: {
          lat: anchorClusterCenter.lat + dp.latOffset,
          lng: anchorClusterCenter.lng + dp.lngOffset,
        },
        updatedAt: 'Активен',
        contact: dp.showNickname ? censorProfanityText(dp.nickname) : undefined,
      });

      // Все активные слоты объявлений другого демо-пользователя
      const dpSlotsCount =
        dp.tier === 'FREE'
          ? 1
          : dp.tier === 'PRO'
          ? PRO_PACKAGE_META[dp.proPackage || 'PRO'].advertSlots
          : 4;
      const dpActiveSlots = (dp.advertSlots || []).slice(0, dpSlotsCount);
      for (const slot of dpActiveSlots) {
        if (slot.published && !slot.published.stoppedEarly && nowMs < slot.published.expiresAtMs) {
          const remMs = Math.max(0, slot.published.expiresAtMs - nowMs);
          community.unshift({
            id: `${dp.id}-advert-${slot.slotId}`,
            authorName: dpVisibleIdentity || censorProfanityText(dp.name),
            visibleIdentityLabel: dpVisibleIdentity || censorProfanityText(dp.name),
            visibleDescription: censorProfanityText(slot.published.text),
            karmaPlus: dp.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS,
            karmaMinus: dp.karmaMinus ?? 0,
            category: 'ADVERT',
            profileText: censorProfanityText(slot.published.text),
            latOffset: slot.published.position.lat - anchorClusterCenter.lat,
            lngOffset: slot.published.position.lng - anchorClusterCenter.lng,
            position: slot.published.position,
            updatedAt: `Осталось показа: ${formatDurationHMS(remMs)}`,
            contact: dp.showNickname ? censorProfanityText(dp.nickname) : 'Объявление 24ч',
            advertStatus: slot.published.status,
            ownerProfileId: dp.id,
            slotId: slot.slotId,
          });
        }
      }

      if (
        dp.sosActive &&
        dp.sosExpiresAtMs &&
        nowMs < dp.sosExpiresAtMs &&
        dp.sosText &&
        dp.sosText.trim().length > 0
      ) {
        const remSosMs = Math.max(0, dp.sosExpiresAtMs - nowMs);
        const censoredSos = censorProfanityText(dp.sosText.trim());
        community.unshift({
          id: `${dp.id}-sos`,
          authorName: `${dpVisibleIdentity || censorProfanityText(dp.name)} · SOS`,
          visibleIdentityLabel: dpVisibleIdentity || censorProfanityText(dp.name),
          visibleDescription: censoredSos,
          karmaPlus: dp.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS,
          karmaMinus: dp.karmaMinus ?? 0,
          category: 'SOS',
          profileText: censoredSos,
          latOffset: dp.latOffset,
          lngOffset: dp.lngOffset,
          position: {
            lat: anchorClusterCenter.lat + dp.latOffset,
            lng: anchorClusterCenter.lng + dp.lngOffset,
          },
          updatedAt: `SOS (осталось ${formatDurationHMS(remSosMs)})`,
          contact: dp.showNickname ? censorProfanityText(dp.nickname) : 'Экстренный сигнал SOS',
        });
      }
    }

    const hasAnyVisibleField = showProfileName || showProfileNickname || showProfileDescription;
    const isMyProfileCurrentlyBanned = Boolean(myBannedUntilMs && nowMs < myBannedUntilMs);
    const isMyProfileInSelectedCommunity =
      (myCommunityId || 'community-fedorovka') === activeDemoCommunityId;

    if (
      settingsAutoGeo &&
      isMyProfileInSelectedCommunity &&
      !isMyProfileCurrentlyBanned &&
      hasAnyVisibleField &&
      combinedMyProfileText.trim().length > 0
    ) {
      const approvedGroupTags = groupSlots
        .filter((s) => {
          const info = allKnownGroupsCatalog[s.tag.trim().toLowerCase()];
          const isClosed =
            info?.accessType === 'CLOSED' || s.tag.trim().toUpperCase().startsWith('GC-');
          return s.tag.trim().length > 0 && (!isClosed || s.adminApproved);
        })
        .map((s) => s.tag.trim())
        .join(' ');

      const myCreatedGroupTags =
        currentAccountTier !== 'FREE'
          ? myCreatedProGroups
              .slice(0, allowedAdvertSlotsCount)
              .filter((cg) => cg.isCreated && cg.tag.trim().length > 0)
              .map((cg) => cg.tag.trim())
              .join(' ')
          : '';

      const myVisibleIdentity =
        showProfileName && profileName.trim()
          ? censorProfanityText(profileName.trim())
          : showProfileNickname && profileNickname.trim()
          ? censorProfanityText(profileNickname.trim())
          : '';
      const myVisibleDesc = showProfileDescription
        ? censorProfanityText(
            limitWords(profileDescription.trim(), maxDescriptionWordsForCurrentTier)
          )
        : '';

      community.unshift({
        id: 'my-own-profile',
        authorName: combinedMyDisplayName,
        visibleIdentityLabel: myVisibleIdentity,
        visibleDescription: myVisibleDesc,
        karmaPlus: myKarmaPlus,
        karmaMinus: myKarmaMinus,
        userTier: currentAccountTier,
        proPictogram: myProPictogram,
        category:
          mySosActive && mySosExpiresAtMs && nowMs < mySosExpiresAtMs
            ? 'SOS'
            : currentAccountTier === 'BUSINESS'
            ? 'BUSINESS'
            : undefined,
        profileText: `${combinedMyProfileText} ${approvedGroupTags} ${myCreatedGroupTags}`.trim(),
        disabledWords: Array.from(myDisabledWords),
        latOffset: myPositionOffset.lat,
        lngOffset: myPositionOffset.lng,
        position: {
          lat: anchorClusterCenter.lat + myPositionOffset.lat,
          lng: anchorClusterCenter.lng + myPositionOffset.lng,
        },
        updatedAt:
          mySosActive && mySosExpiresAtMs && nowMs < mySosExpiresAtMs
            ? `SOS (осталось ${formatDurationHMS(Math.max(0, mySosExpiresAtMs - nowMs))})`
            : 'Активен',
        contact: showProfileNickname ? censorProfanityText(profileNickname) : undefined,
      });
    }

    // Все опубликованные слоты объявлений текущего пользователя видимы на карте независимо от активности профиля
    for (const slot of myAdvertSlots.slice(0, allowedAdvertSlotsCount)) {
      if (slot.published && !slot.published.stoppedEarly && nowMs < slot.published.expiresAtMs) {
        const remainingDisplayMs = Math.max(0, slot.published.expiresAtMs - nowMs);
        const autoRenewLabel =
          slot.published.autoRenewMode === 'INFINITE'
            ? ' · Автопродление: бессрочно'
            : slot.published.autoRenewMode === 'DAYS' && slot.published.autoRenewUntilMs
            ? ` · Автопродление (${slot.published.autoRenewDays} дн.)`
            : '';
        community.unshift({
          id: `my-published-advert-${slot.slotId}`,
          authorName: combinedMyDisplayName,
          visibleIdentityLabel: combinedMyDisplayName,
          visibleDescription: censorProfanityText(slot.published.text),
          karmaPlus: myKarmaPlus,
          karmaMinus: myKarmaMinus,
          category: 'ADVERT',
          profileText: censorProfanityText(slot.published.text),
          latOffset: slot.published.position.lat - anchorClusterCenter.lat,
          lngOffset: slot.published.position.lng - anchorClusterCenter.lng,
          position: slot.published.position,
          updatedAt: `Осталось цикла 24ч: ${formatDurationHMS(remainingDisplayMs)}${autoRenewLabel}`,
          contact: showProfileNickname ? censorProfanityText(profileNickname) : 'Объявление 24ч',
          advertStatus: slot.published.status,
          ownerProfileId: 'my-own-profile',
          slotId: slot.slotId,
        });
      }
    }

    return community;
  }, [
    anchorClusterCenter,
    demoProfiles,
    activeDemoProfileId,
    cabinetAdminMode,
    groupSlots,
    myCreatedProGroups,
    allKnownGroupsCatalog,
    showProfileName,
    showProfileNickname,
    showProfileDescription,
    profileName,
    profileDescription,
    maxDescriptionWordsForCurrentTier,
    combinedMyProfileText,
    combinedMyDisplayName,
    profileNickname,
    currentAccountTier,
    myProPictogram,
    myKarmaPlus,
    myKarmaMinus,
    myBannedUntilMs,
    myDisabledWords,
    myPositionOffset,
    myAdvertSlots,
    allowedAdvertSlotsCount,
    publishedAdvert,
    mySosActive,
    mySosExpiresAtMs,
    settingsAutoGeo,
    nowMs,
    activeDemoCommunityId,
    myCommunityId,
  ]);

  // Parse query words and expand with AI synonyms when AI Assistant mode is ON
  const queryTerms = useMemo(() => {
    const baseWords = searchQuery
      .toLowerCase()
      .split(/[\s,.;:!?()[\]"{}<>/\\|+=*~`]+/)
      .map((w) => w.trim().replace(/^@+/, ''))
      .filter((w) => w.length >= 1);

    if (!aiAssistantEnabled || baseWords.length === 0) {
      return {baseWords, expandedWords: baseWords};
    }

    const expandedSet = new Set<string>(baseWords);
    for (const word of baseWords) {
      for (const [key, synonyms] of Object.entries(AI_SEMANTIC_SYNONYMS)) {
        if (key.includes(word) || word.includes(key) || synonyms.some((s) => s.includes(word))) {
          expandedSet.add(key);
          synonyms.forEach((s) => expandedSet.add(s));
        }
      }
    }

    return {
      baseWords,
      expandedWords: Array.from(expandedSet),
    };
  }, [searchQuery, aiAssistantEnabled]);

  // Если в поиск введён тег закрытой группы (GC-...), определяем эту закрытую группу, чтобы найти её админа ВНЕ ЗАВИСИМОСТИ от радиуса!
  const searchedClosedGroupInfo: GroupCatalogInfo | null = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase().replace(/^#+/, '');
    if (!raw) return null;
    const direct = allKnownGroupsCatalog[raw];
    if (direct && direct.accessType === 'CLOSED') {
      return direct;
    }
    for (const word of queryTerms.baseWords) {
      const entry = allKnownGroupsCatalog[word];
      if (entry && entry.accessType === 'CLOSED') {
        return entry;
      }
    }
    return null;
  }, [searchQuery, allKnownGroupsCatalog, queryTerms.baseWords]);

  // Filter profiles within radiusMeters AND matching active word tags
  // ИСКЛЮЧЕНИЕ: если в поиск введён тег закрытой группы (GC-...), поиск выдаёт админа этого тега ВНЕ ЗАВИСИМОСТИ от того, находится он в радиусе или нет!
  const profilesInRadiusMatchingQuery: EnrichedProfileResult[] = useMemo(() => {
    const results: EnrichedProfileResult[] = [];

    for (const profile of allActiveProfiles) {
      const distanceMeters = getDistanceMeters(searchCenter, profile.position);

      const disabledSet = new Set((profile.disabledWords || []).map((w) => w.toLowerCase()));
      const wordTags = extractWordTags(profile.profileText, disabledSet);
      const activeTags = wordTags.filter((t) => t.active).map((t) => t.word);
      const activeNormalized = wordTags.filter((t) => t.active).map((t) => t.normalized);

      if (activeTags.length === 0) continue;

      // Проверяем, является ли этот профиль администратором искомой закрытой группы (GC-...)
      const isSearchedClosedGroupAdmin =
        Boolean(searchedClosedGroupInfo) &&
        (profile.id === searchedClosedGroupInfo?.adminId ||
          (profile.id === 'my-own-profile' &&
            searchedClosedGroupInfo?.adminId === activeDemoProfileId) ||
          activeNormalized.includes(searchedClosedGroupInfo!.tag.toLowerCase()));

      if (distanceMeters > radiusMeters && !isSearchedClosedGroupAdmin) continue;

      let matchedTags: string[] = [];
      if (queryTerms.expandedWords.length > 0) {
        matchedTags = activeTags.filter((_, idx) => {
          const normTag = activeNormalized[idx];
          return queryTerms.expandedWords.some(
            (qWord) => normTag.includes(qWord) || qWord.includes(normTag)
          );
        });

        if (matchedTags.length === 0 && !isSearchedClosedGroupAdmin) continue;
        if (matchedTags.length === 0 && isSearchedClosedGroupAdmin && searchedClosedGroupInfo) {
          matchedTags = [searchedClosedGroupInfo.tag];
        }
      } else {
        matchedTags = activeTags;
      }

      results.push({
        profile,
        distanceMeters,
        activeTags,
        matchedTags,
      });
    }

    // Sort strictly from closest to searchCenter to periphery by distance
    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results;
  }, [
    allActiveProfiles,
    searchCenter,
    radiusMeters,
    queryTerms,
    searchedClosedGroupInfo,
    activeDemoProfileId,
  ]);

  // Calculate object counts for each filter button (ALL, GROUPS, ADVERT, BUSINESS, SOS) in the search radius
  const categoryCounts: Record<FilterCategory, number> = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      ALL: profilesInRadiusMatchingQuery.length,
      GROUPS: 0,
      ADVERT: 0,
      BUSINESS: 0,
      SOS: 0,
    };

    for (const item of profilesInRadiusMatchingQuery) {
      if (item.profile.category) {
        counts[item.profile.category] += 1;
      }
    }

    return counts;
  }, [profilesInRadiusMatchingQuery]);

  // Helper: resolve group info by unique group tag + count active members in current search radius
  const resolveGroupDetails = useCallback(
    (rawTag: string): {info: GroupCatalogInfo; activeMembersInRadius: number} | null => {
      const clean = rawTag.trim();
      if (!clean) return null;
      const lower = clean.toLowerCase();
      const isClosedByPrefix = clean.toUpperCase().startsWith('GC-');
      const catalogEntry: GroupCatalogInfo = allKnownGroupsCatalog[lower] || {
        tag: clean,
        name: isClosedByPrefix
          ? `Закрытая группа #${clean}`
          : `Открытая группа #${clean}`,
        description: isClosedByPrefix
          ? `Закрытая группа с тегом ${clean}. Введите тег в поиск, чтобы отправить запрос админу.`
          : `Открытая группа участников с уникальным тегом ${clean} в выбранном радиусе поиска.`,
        accessType: isClosedByPrefix ? 'CLOSED' : 'OPEN',
        adminName: 'Создатель группы',
      };

      let count = 0;
      for (const profile of allActiveProfiles) {
        const dist = getDistanceMeters(searchCenter, profile.position);
        if (dist > radiusMeters) continue;
        const tags = extractWordTags(profile.profileText);
        if (tags.some((t) => t.normalized === lower)) {
          count += 1;
        }
      }

      return {
        info: catalogEntry,
        activeMembersInRadius: count,
      };
    },
    [allActiveProfiles, searchCenter, radiusMeters, allKnownGroupsCatalog]
  );

  // Final filtered results:
  // If a group's "Показать на карте" button is active (activeGroupMapTag), all category filters are disabled and ONLY members of that group tag are shown!
  const filteredResults: EnrichedProfileResult[] = useMemo(() => {
    if (activeGroupMapTag) {
      const targetNorm = activeGroupMapTag.trim().toLowerCase();
      const groupOnly: EnrichedProfileResult[] = [];
      for (const profile of allActiveProfiles) {
        const distanceMeters = getDistanceMeters(searchCenter, profile.position);
        if (distanceMeters > radiusMeters) continue;
        const wordTags = extractWordTags(profile.profileText);
        const activeTags = wordTags.filter((t) => t.active).map((t) => t.word);
        const activeNorm = wordTags.filter((t) => t.active).map((t) => t.normalized);
        if (activeNorm.includes(targetNorm)) {
          groupOnly.push({
            profile,
            distanceMeters,
            activeTags,
            matchedTags: [activeGroupMapTag],
          });
        }
      }
      groupOnly.sort((a, b) => a.distanceMeters - b.distanceMeters);
      return groupOnly;
    }

    if (selectedCategory === 'ALL') {
      return profilesInRadiusMatchingQuery;
    }
    return profilesInRadiusMatchingQuery.filter(
      (item) => item.profile.category === selectedCategory
    );
  }, [
    activeGroupMapTag,
    allActiveProfiles,
    searchCenter,
    radiusMeters,
    selectedCategory,
    profilesInRadiusMatchingQuery,
  ]);

  // Setting search center by mouse click or smartphone tap on the map (and closing any open marker info card)
  const handleSelectSearchCenter = useCallback(
    (latLng: google.maps.LatLngLiteral) => {
      closeFilterDropdown();
      setActiveMarkerId(null);
      setHoveredMarkerId(null);
      setSearchCenter(latLng);
    },
    [closeFilterDropdown]
  );

  const handleMapClick = useCallback(
    (ev: MapMouseEvent) => {
      closeFilterDropdown();
      setActiveMarkerId(null);
      setHoveredMarkerId(null);
      if (searchSystemMode !== 'TAG_SYSTEM') return;
      if (!ev.detail.latLng) return;
      handleSelectSearchCenter(ev.detail.latLng);
    },
    [handleSelectSearchCenter, closeFilterDropdown, searchSystemMode]
  );

  const handleGoogleNavigate = useCallback(
    (latLng: google.maps.LatLngLiteral, viewport?: google.maps.LatLngBounds | null) => {
      setSearchCenter(latLng);
      if (map) {
        if (viewport) {
          map.fitBounds(viewport);
        } else {
          map.panTo(latLng);
          map.setZoom(14);
        }
      }
    },
    [map]
  );

  // Fetch Google Places Autocomplete suggestions when in GOOGLE_SYSTEM mode
  useEffect(() => {
    if (searchSystemMode !== 'GOOGLE_SYSTEM' || !placesLib) {
      setGoogleSuggestions([]);
      setIsGoogleLoading(false);
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setGoogleSuggestions([]);
      setIsGoogleLoading(false);
      return;
    }

    const {AutocompleteSessionToken, AutocompleteSuggestion} = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const timer = setTimeout(async () => {
      setIsGoogleLoading(true);
      try {
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current ?? undefined,
        });
        setGoogleSuggestions(res?.suggestions || []);
      } catch (err) {
        checkQuotaError(err);
        console.error('Google Autocomplete error:', err);
      } finally {
        setIsGoogleLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery, searchSystemMode, placesLib]);

  const handleSelectGoogleSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        });
        const loc = place.location;
        if (loc) {
          const latLng = {
            lat: typeof loc.lat === 'function' ? loc.lat() : (loc as unknown as google.maps.LatLngLiteral).lat,
            lng: typeof loc.lng === 'function' ? loc.lng() : (loc as unknown as google.maps.LatLngLiteral).lng,
          };
          handleGoogleNavigate(latLng, place.viewport);
        }
        setSearchQuery('');
        setGoogleSuggestions([]);
        sessionTokenRef.current = null;
        closeFilterDropdown();
      } catch (err) {
        checkQuotaError(err);
        console.error('Google Place details error:', err);
      }
    },
    [placesLib, handleGoogleNavigate, closeFilterDropdown]
  );

  const selectedMarkerItem = useMemo(
    () => filteredResults.find((r) => r.profile.id === activeMarkerId) || null,
    [filteredResults, activeMarkerId]
  );

  const myExtractedWordTags = useMemo(
    () => extractWordTags(combinedMyProfileText, myDisabledWords),
    [combinedMyProfileText, myDisabledWords]
  );

  const toggleMyWordTag = useCallback((normalizedWord: string) => {
    setMyDisabledWords((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedWord)) {
        next.delete(normalizedWord);
      } else {
        next.add(normalizedWord);
      }
      return next;
    });
  }, []);

  // Handlers for Contact Request Protection & Chat (включая автоматическую формулировку «Вступление в закрытую группу» при поиске админа по тегу GC-...)
  const handleOpenContactRequestForm = useCallback(
    (profile: {
      id: string;
      authorName: string;
      category?: ProfileCategory;
      closedGroupTag?: string;
    }) => {
      const effectiveClosedTag =
        profile.closedGroupTag ||
        (searchedClosedGroupInfo &&
        (profile.id === searchedClosedGroupInfo.adminId ||
          profile.authorName.toLowerCase().includes(searchedClosedGroupInfo.tag.toLowerCase()))
          ? searchedClosedGroupInfo.tag
          : undefined);

      setContactFormTarget({
        id: profile.id,
        name: profile.authorName,
        category: profile.category,
        closedGroupTag: effectiveClosedTag,
      });
      setContactFormNote(
        effectiveClosedTag
          ? `Вступление в закрытую группу ${effectiveClosedTag}`
          : ''
      );
    },
    [searchedClosedGroupInfo]
  );

  const handleSubmitContactRequest = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!contactFormTarget || !contactFormNote.trim()) return;

      const targetDp = demoProfiles.find(
        (d) =>
          d.id === contactFormTarget.id ||
          `${d.id}-sos` === contactFormTarget.id ||
          contactFormTarget.id.startsWith(`${d.id}-advert-`)
      );

      const newReq: ContactRequestItem = {
        id: `req-${Date.now()}`,
        senderId: contactFormTarget.id,
        senderName: contactFormTarget.name,
        senderKarmaPlus: targetDp
          ? targetDp.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS
          : DEFAULT_STARTING_KARMA_PLUS,
        senderKarmaMinus: targetDp ? targetDp.karmaMinus ?? 0 : 0,
        senderCategory: contactFormTarget.category,
        note: censorProfanityText(contactFormNote.trim()),
        createdAt: 'Только что',
        closedGroupTag: contactFormTarget.closedGroupTag,
        requesterProfileId: activeDemoProfileId,
      };

      setContactRequests((prev) => [newReq, ...prev]);
      setContactFormTarget(null);
      setContactFormNote('');
      setChatSystemNotice({
        type: 'sent',
        text: newReq.closedGroupTag
          ? `Запрос «${newReq.note}» доставлен администратору группы (${newReq.senderName}) в Chat. При нажатии «Принять» закрытая группа ${newReq.closedGroupTag} появится в вашем списке доступных групп.`
          : `Запрос на контакт с сопроводительной запиской доставлен в Chat (${newReq.senderName}). Подтвердите или отклоните его.`,
      });
      setIsListFullscreenOpen(false);
      setIsCabinetOpen(true);
      setCabinetTab('CHAT');
    },
    [contactFormTarget, contactFormNote, demoProfiles, activeDemoProfileId]
  );

  const handleAcceptContactRequest = useCallback(
    (req: ContactRequestItem) => {
      setContactRequests((prev) => prev.filter((item) => item.id !== req.id));

      // Если это запрос на вступление в закрытую группу (GC-...) — при принятии админом пользователь получает доступ, и группа появляется в его списке доступных групп!
      if (req.closedGroupTag) {
        const cleanTag = req.closedGroupTag.trim();
        const addApprovedGroupToSlots = (slots: UserGroupSlot[]): UserGroupSlot[] => {
          const existingIdx = slots.findIndex(
            (s) => s.tag.trim().toLowerCase() === cleanTag.toLowerCase()
          );
          if (existingIdx !== -1) {
            return slots.map((s, idx) =>
              idx === existingIdx
                ? {...s, tag: cleanTag, tagDraft: cleanTag, isEditing: false, adminApproved: true}
                : s
            );
          }
          const emptyIdx = slots.findIndex((s) => !s.tag.trim());
          if (emptyIdx !== -1) {
            return slots.map((s, idx) =>
              idx === emptyIdx
                ? {...s, tag: cleanTag, tagDraft: cleanTag, isEditing: false, adminApproved: true}
                : s
            );
          }
          return [
            ...slots,
            {
              slotId: slots.length + 1,
              tag: cleanTag,
              tagDraft: cleanTag,
              isEditing: false,
              adminApproved: true,
            },
          ];
        };

        setGroupSlots((prev) => addApprovedGroupToSlots(prev));
        if (req.requesterProfileId) {
          setDemoProfiles((prev) =>
            prev.map((dp) =>
              dp.id === req.requesterProfileId
                ? {
                    ...dp,
                    groupSlots: addApprovedGroupToSlots(
                      dp.groupSlots || [
                        {slotId: 1, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
                        {slotId: 2, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
                        {slotId: 3, tag: '', tagDraft: '', isEditing: false, adminApproved: true},
                      ]
                    ),
                  }
                : dp
            )
          );
        }
      }

      setChatSystemNotice({
        type: 'accepted',
        text: req.closedGroupTag
          ? `Запрос на вступление в закрытую группу #${req.closedGroupTag} ПРИНЯТ администратором! Группа #${req.closedGroupTag} добавлена в ваш список доступных групп на вкладке Groups.`
          : `Запрашивающему (${req.senderName}) отправлено подтверждение. Пользователь добавлен в окно чата.`,
      });
      setActiveChatSession({
        partnerId: req.senderId,
        partnerName: req.senderName,
        partnerKarmaPlus: req.senderKarmaPlus ?? DEFAULT_STARTING_KARMA_PLUS,
        partnerKarmaMinus: req.senderKarmaMinus ?? 0,
        partnerCategory: req.senderCategory,
        initialNote: req.note,
        mode: 'TEXT', // По умолчанию текстовый режим
        myRatedPartner: null,
        partnerRatedMe: null,
        messages: [
          {
            id: `msg-init-${Date.now()}`,
            sender: 'partner',
            text: req.note,
            time: 'Запрос принят',
          },
        ],
      });
    },
    []
  );

  const handleDeclineContactRequest = useCallback((req: ContactRequestItem) => {
    setContactRequests((prev) => prev.filter((item) => item.id !== req.id));
    setChatSystemNotice({
      type: 'rejected',
      text: req.closedGroupTag
        ? `Запрос на вступление в закрытую группу #${req.closedGroupTag} ОТКЛОНЕН администратором. Группа не добавлена в список доступных групп.`
        : `Уведомление отправлено пользователю «${req.senderName}»: Ваш запрос отклонен.`,
    });
  }, []);

  const handleSendChatMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeChatSession || !chatMessageInput.trim()) return;
      const text = censorProfanityText(chatMessageInput.trim());
      const nowTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

      setActiveChatSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: `msg-me-${Date.now()}`,
              sender: 'me',
              text,
              time: nowTime,
            },
          ],
        };
      });
      setChatMessageInput('');
    },
    [activeChatSession, chatMessageInput]
  );

  // Отправка ответного сообщения со стороны собеседника (для интерактивного диалога и достижения >= 3 сообщений с каждой стороны)
  const handleSimulatePartnerMessage = useCallback(() => {
    if (!activeChatSession) return;
    const nowTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const partnerCount =
      activeChatSession.messages.filter((m) => m.sender === 'partner').length + 1;
    const replies = [
      'Отлично, давай обсудим детали!',
      'Подтверждаю, я на месте в радиусе поиска.',
      'Договорились, спасибо за быстрый отклик!',
      'Всё прошло супер, на связи!',
    ];
    const replyText = replies[(partnerCount - 1) % replies.length];

    setActiveChatSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `msg-partner-${Date.now()}`,
            sender: 'partner',
            text: replyText,
            time: nowTime,
          },
        ],
      };
    });
  }, [activeChatSession]);

  // Оценка кармы собеседника в личном или групповом чате (+1 Положительно / -1 Отрицательно) — доступна только после >= 3 сообщений с каждой стороны и НЕ ЧАЩЕ 1 РАЗА В МЕСЯЦ между одной парой пользователей. Три минуса подряд = бан профиля на неделю!
  const handleRatePartnerKarma = useCallback(
    (delta: 1 | -1) => {
      if (!activeChatSession) return;
      if (activeChatSession.myRatedPartner) return;

      const now = Date.now();
      const canonicalPartnerId = normalizeKarmaUserId(activeChatSession.partnerId);
      const pairKey = `${activeDemoProfileId}->${canonicalPartnerId}`;
      const lastRatedAt = karmaPairLastRatedMs[pairKey] ?? 0;
      if (lastRatedAt > 0 && now - lastRatedAt < ONE_MONTH_KARMA_COOLDOWN_MS) {
        return;
      }

      setNowMs(now);
      setKarmaPairLastRatedMs((prev) => ({
        ...prev,
        [pairKey]: now,
      }));

      const nextPlus =
        (activeChatSession.partnerKarmaPlus ?? 0) + (delta === 1 ? 1 : 0);
      const nextMinus =
        (activeChatSession.partnerKarmaMinus ?? 0) + (delta === -1 ? 1 : 0);

      const prevStreak = activeChatSession.partnerConsecutiveMinuses ?? 0;
      const rawNextStreak = delta === -1 ? prevStreak + 1 : 0;
      const triggeredWeekBan = rawNextStreak >= 3;
      const nextStreak = triggeredWeekBan ? 0 : rawNextStreak;
      const nextBanUntil = triggeredWeekBan
        ? now + SEVEN_DAYS_BAN_MS
        : activeChatSession.partnerBannedUntilMs ?? null;

      setActiveChatSession((prev) =>
        prev
          ? {
              ...prev,
              partnerKarmaPlus: nextPlus,
              partnerKarmaMinus: nextMinus,
              partnerConsecutiveMinuses: nextStreak,
              partnerBannedUntilMs: nextBanUntil,
              myRatedPartner: delta,
            }
          : null
      );

      // Если собеседник (или участник этой группы) есть в списке созданных демо-пользователей — обновляем его плюсы/минусы и проверяем 3 минуса подряд (бан на неделю)
      const targetGroupNorm = activeChatSession.groupTag?.trim().toLowerCase();
      setDemoProfiles((prev) =>
        prev.map((dp) => {
          const isDirectMatch =
            dp.id === activeChatSession.partnerId ||
            `${dp.id}-sos` === activeChatSession.partnerId;
          const isGroupMemberMatch =
            Boolean(activeChatSession.isGroupChat) &&
            Boolean(targetGroupNorm) &&
            dp.id !== activeDemoProfileId &&
            (dp.groupSlots || []).some(
              (s) => s.tag.trim().toLowerCase() === targetGroupNorm
            );
          if (isDirectMatch || isGroupMemberMatch) {
            const dpPrevStreak = dp.consecutiveMinuses ?? 0;
            const dpRawStreak = delta === -1 ? dpPrevStreak + 1 : 0;
            const dpTriggeredBan = dpRawStreak >= 3;
            return {
              ...dp,
              karmaPlus: (dp.karmaPlus ?? 0) + (delta === 1 ? 1 : 0),
              karmaMinus: (dp.karmaMinus ?? 0) + (delta === -1 ? 1 : 0),
              consecutiveMinuses: dpTriggeredBan ? 0 : dpRawStreak,
              bannedUntilMs: dpTriggeredBan
                ? now + SEVEN_DAYS_BAN_MS
                : dp.bannedUntilMs ?? null,
            };
          }
          return dp;
        })
      );

      setChatSystemNotice({
        type: delta === 1 ? 'accepted' : 'rejected',
        text: triggeredWeekBan
          ? `Собеседник «${activeChatSession.partnerName}» получил 3 минуса подряд — ПРОФИЛЬ ЗАБАНЕН НА НЕДЕЛЮ (7 дней)! Карма: +${nextPlus} / -${nextMinus}.`
          : `Вы оценили собеседника в чате «${activeChatSession.partnerName}»: ${
              delta === 1 ? '+1 (Положительно)' : `-1 (Отрицательно, минусов подряд: ${nextStreak}/3)`
            }. Карма собеседника теперь: +${nextPlus} / -${nextMinus}. Повторная оценка этого пользователя возможна через 1 месяц.`,
      });
    },
    [activeChatSession, activeDemoProfileId, karmaPairLastRatedMs]
  );

  // Оценка вашей кармы со стороны собеседника в личном или групповом чате (+1 Положительно / -1 Отрицательно) после >= 3 сообщений с каждой стороны и НЕ ЧАЩЕ 1 РАЗА В МЕСЯЦ. Три минуса подряд = бан на неделю!
  const handlePartnerRateMyKarma = useCallback(
    (delta: 1 | -1) => {
      if (!activeChatSession) return;
      if (activeChatSession.partnerRatedMe) return;

      const now = Date.now();
      const canonicalPartnerId = normalizeKarmaUserId(activeChatSession.partnerId);
      const pairKey = `${canonicalPartnerId}->${activeDemoProfileId}`;
      const lastRatedAt = karmaPairLastRatedMs[pairKey] ?? 0;
      if (lastRatedAt > 0 && now - lastRatedAt < ONE_MONTH_KARMA_COOLDOWN_MS) {
        return;
      }

      setNowMs(now);
      setKarmaPairLastRatedMs((prev) => ({
        ...prev,
        [pairKey]: now,
      }));

      const nextMyPlus = myKarmaPlus + (delta === 1 ? 1 : 0);
      const nextMyMinus = myKarmaMinus + (delta === -1 ? 1 : 0);
      const rawMyStreak = delta === -1 ? myConsecutiveMinuses + 1 : 0;
      const triggeredMyBan = rawMyStreak >= 3;
      const nextMyStreak = triggeredMyBan ? 0 : rawMyStreak;

      setMyKarmaPlus(nextMyPlus);
      setMyKarmaMinus(nextMyMinus);
      setMyConsecutiveMinuses(nextMyStreak);
      if (triggeredMyBan) {
        setMyBannedUntilMs(now + SEVEN_DAYS_BAN_MS);
      }

      setActiveChatSession((prev) =>
        prev
          ? {
              ...prev,
              partnerRatedMe: delta,
            }
          : null
      );

      setChatSystemNotice({
        type: delta === 1 ? 'accepted' : 'rejected',
        text: triggeredMyBan
          ? `Вы получили 3 минуса подряд от собеседников — ВАШ ПРОФИЛЬ ЗАБАНЕН НА НЕДЕЛЮ (7 дней)! Карма: +${nextMyPlus} / -${nextMyMinus}.`
          : `Собеседник в чате «${activeChatSession.partnerName}» оценил вас: ${
              delta === 1 ? '+1 (Положительно)' : `-1 (Отрицательно, минусов подряд: ${nextMyStreak}/3)`
            }. Ваша карма теперь: +${nextMyPlus} / -${nextMyMinus}. Повторная оценка от этого собеседника возможна через 1 месяц.`,
      });
    },
    [
      activeChatSession,
      activeDemoProfileId,
      karmaPairLastRatedMs,
      myKarmaPlus,
      myKarmaMinus,
      myConsecutiveMinuses,
    ]
  );

  const handleEndChatSession = useCallback(() => {
    setActiveChatSession(null);
    setChatMessageInput('');
    setChatSystemNotice({
      type: 'ended',
      text: 'Чат завершен. Вся информация чата сброшена. Для повторного личного чата снова требуется запрос на контакт и подтверждение.',
    });
  }, []);

  // Open Group Chat directly WITHOUT contact request ("Чат группы без запроса")
  const handleOpenGroupChat = useCallback((groupInfo: GroupCatalogInfo) => {
    setChatSystemNotice({
      type: 'accepted',
      text: `Открыт групповой чат «${groupInfo.name}» (тег #${groupInfo.tag}). Для группового чата запрос на контакт не требуется.`,
    });
    setActiveChatSession({
      partnerId: `group-${groupInfo.tag}`,
      partnerName: `${groupInfo.name} (#${groupInfo.tag})`,
      partnerKarmaPlus: DEFAULT_STARTING_KARMA_PLUS,
      partnerKarmaMinus: 0,
      partnerCategory: 'GROUPS',
      initialNote: groupInfo.description,
      isGroupChat: true,
      groupTag: groupInfo.tag,
      mode: 'TEXT',
      myRatedPartner: null,
      partnerRatedMe: null,
      messages: [
        {
          id: `grp-msg-1-${Date.now()}`,
          sender: 'partner',
          text: `Добро пожаловать в групповой чат #${groupInfo.tag} (${groupInfo.name})! Здесь общаются все участники группы без запроса на контакт.`,
          time: 'Групповой чат',
        },
      ],
    });
    setCabinetTab('CHAT');
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {/* TOP FLOATING HYBRID SEARCH PANEL (ЕДИНАЯ СТРОКА ПОИСКА С КНОПКАМИ GOOGLE СЛЕВА И GOBELL СПРАВА) */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-2xl flex flex-col pointer-events-auto"
        onMouseEnter={() => setIsFilterDropdownOpen(true)}
        onMouseLeave={closeFilterDropdown}
        onTouchStart={() => setIsFilterDropdownOpen(true)}
      >
        {/* БЛОК 1: ПОСТОЯННЫЙ БЛОК (Строка поиска тегов GoBell + ИИ помощник + Кабинет) */}
        <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 transition-all">
          <div className="flex items-center gap-2">
            {/* ПОИСКОВАЯ СТРОКА GOBELL: ПОЛЕ ВВОДА ТЕГОВ И КНОПКА GoBell СПРАВА */}
            <div className="relative flex-1 flex items-center bg-slate-950/95 border border-slate-700/90 focus-within:border-sky-400 rounded-xl p-1 transition-colors">
              {/* Единое поле ввода поиска по тегам GoBell */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsFilterDropdownOpen(true)}
                onClick={() => setIsFilterDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsFilterDropdownOpen(true);
                }}
                placeholder={
                  aiAssistantEnabled
                    ? 'GoBell + ИИ: поиск по тегам и смыслу...'
                    : 'GoBell: поиск по словам-тегам в профилях...'
                }
                className="w-full bg-transparent px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none min-w-0"
              />

              {/* Очистка введенного текста */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                  }}
                  className="p-1 mr-1 text-slate-400 hover:text-white shrink-0"
                  title="Очистить запрос"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Кнопка справа: GoBell */}
              <button
                type="button"
                onClick={() => {
                  setSearchSystemMode('TAG_SYSTEM');
                  setIsFilterDropdownOpen(true);
                  searchInputRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 bg-sky-500 text-slate-950 shadow-sm"
                title="Поиск GoBell по словам-тегам профилей в радиусе"
              >
                GoBell
              </button>
            </div>

            {/* Кнопки ИИ и Кабинет отображаются только в режиме GoBell */}
            {searchSystemMode === 'TAG_SYSTEM' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAiAssistantEnabled((prev) => !prev);
                    setIsFilterDropdownOpen(true);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                    aiAssistantEnabled
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:border-slate-600'
                  }`}
                  title="Включить/выключить режим ИИ-помощника"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">ИИ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCabinetAdminMode('NONE');
                    setIsCabinetOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 text-sky-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Перейти в личный кабинет"
                >
                  <User className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">Кабинет</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextGeo = !settingsAutoGeo;
                    setSettingsAutoGeo(nextGeo);
                    if (nextGeo) {
                      const myPos = {
                        lat: anchorClusterCenter.lat + myPositionOffset.lat,
                        lng: anchorClusterCenter.lng + myPositionOffset.lng,
                      };
                      setUserPhysicalGeo(myPos);
                      setSearchCenter(myPos);
                      setActiveMarkerId('my-own-profile');
                      map?.panTo(myPos);
                    }
                  }}
                  className={`px-2.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 shrink-0 ${
                    settingsAutoGeo
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                      : 'bg-rose-950/80 border-rose-500/70 text-rose-300'
                  }`}
                  title={
                    settingsAutoGeo
                      ? 'Геолокация смартфона ВКЛЮЧЕНА: ваш профиль светится на реальной карте GoBell и игра ELITE 3D доступна'
                      : 'Геолокация смартфона ВЫКЛЮЧЕНА: вы скрыты с карты GoBell, для запуска ELITE 3D необходимо включить геолокацию!'
                  }
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {settingsAutoGeo ? 'ГЕО: ВКЛ' : 'ГЕО: ВЫКЛ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEliteGameOpen(true)}
                  className="px-3 py-2.5 rounded-xl bg-black hover:bg-slate-900 border-2 border-cyan-400 text-yellow-300 text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(0,255,255,0.45)] transition-transform hover:scale-105"
                  title="Запустить космический 3D-симулятор GoBell: ELITE (требуется активная геолокация смартфона — игрок светится на реальной карте GoBell)"
                >
                  <Rocket className="w-4 h-4 text-cyan-400" />
                  <span>ELITE 3D</span>
                  {settingsAutoGeo && (
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"
                      title="Вы светитесь на реальной карте GoBell"
                    />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Подсказка ИИ-помощника, если он включен в режиме GoBell */}
          {searchSystemMode === 'TAG_SYSTEM' && aiAssistantEnabled && isFilterDropdownOpen && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="text-amber-300 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  ИИ-режим GoBell: учитываются смежные слова-теги ({queryTerms.expandedWords.length || 'все'})
                </span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['помощь', 'кофе', 'авто', 'ремонт', 'спорт'].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setSearchQuery(hint)}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-colors"
                  >
                    #{hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Выпадающие подсказки адресов Google при активном режиме Google */}
          {searchSystemMode === 'GOOGLE_SYSTEM' &&
            isFilterDropdownOpen &&
            (googleSuggestions.length > 0 || isGoogleLoading) && (
              <div className="mt-2 border-t border-slate-800 pt-2 max-h-64 overflow-y-auto">
                {isGoogleLoading && googleSuggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400">Поиск адресов Google...</div>
                ) : (
                  <ul className="divide-y divide-slate-800/60">
                    {googleSuggestions.map((s, idx) => {
                      const pred = s.placePrediction;
                      if (!pred) return null;
                      return (
                        <li key={pred.placeId || idx}>
                          <button
                            type="button"
                            onClick={() => handleSelectGoogleSuggestion(s)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-800/80 rounded-lg transition-colors flex items-start gap-2.5"
                          >
                            <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-white font-medium truncate">
                                {pred.mainText?.text || pred.text?.text}
                              </div>
                              {pred.secondaryText?.text && (
                                <div className="text-xs text-slate-400 truncate">
                                  {pred.secondaryText.text}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
        </div>

        {/* БЛОК 2: ВЫПАДАЮЩИЙ СНИЗУ БЛОК ФИЛЬТРОВ GOBELL (Две строки: 1. Радиус 500м-5км, 2. ALL/GROUPS/ADVERT/BUSINESS/SOS + LIST) */}
        {searchSystemMode === 'TAG_SYSTEM' && isFilterDropdownOpen && (
          <div className="mt-1.5 w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* ВЕРХНЯЯ СТРОКА: РАДИУС ПОИСКА (500 м — 5 км) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Радиус поиска:
                </span>
                <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-md">
                  {formatDistance(radiusMeters)}
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-1 max-w-md">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">500 м</span>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-[11px] font-mono text-slate-400 shrink-0">5 км</span>
              </div>
            </div>

            {/* ЕСЛИ В ПОИСК ВВЕДЁН ТЕГ ЗАКРЫТОЙ ГРУППЫ (GC-...), ПОИСК ВЫДАЁТ АДМИНА ТЕГА ВНЕ ЗАВИСИМОСТИ ОТ РАДИУСА */}
            {searchedClosedGroupInfo && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase font-mono">
                      ЗАКРЫТАЯ ГРУППА #{searchedClosedGroupInfo.tag}
                    </span>
                    <span className="text-xs font-bold text-white">
                      Администратор найден вне зависимости от радиуса: {searchedClosedGroupInfo.adminName}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-200/90">
                    {searchedClosedGroupInfo.name} — отправьте запрос админу с автоматической формулировкой «Вступление в закрытую группу».
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenContactRequestForm({
                      id: searchedClosedGroupInfo.adminId || `admin-${searchedClosedGroupInfo.tag}`,
                      authorName: searchedClosedGroupInfo.adminName,
                      category: 'GROUPS',
                      closedGroupTag: searchedClosedGroupInfo.tag,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shrink-0 shadow-md transition-colors"
                >
                  Запрос на вступление в {searchedClosedGroupInfo.tag}
                </button>
              </div>
            )}

            {/* НИЖНЯЯ СТРОКА: СЛЕВА ФИЛЬТРЫ (ALL, GROUPS, ADVERT, BUSINESS, SOS с количеством) + СПРАВА КНОПКА LIST */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Слева: Кнопки фильтров с количеством объектов в радиусе поиска. Включение любого фильтра выключает кнопку "Показать на карте" у группы */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'GROUPS', 'ADVERT', 'BUSINESS', 'SOS'] as FilterCategory[]).map(
                  (cat) => {
                    const isSelected = !activeGroupMapTag && selectedCategory === cat;
                    const count = categoryCounts[cat];
                    const meta = CATEGORY_META[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setActiveGroupMapTag(null);
                          setSelectedCategory(cat);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? meta.activeBtnClass
                            : 'bg-slate-950/90 text-slate-300 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <span>{meta.label}</span>
                        <span
                          className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                            isSelected
                              ? 'bg-black/20 text-current font-bold'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  }
                )}
                {activeGroupMapTag && (
                  <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                    Только группа #{activeGroupMapTag} ({filteredResults.length})
                  </span>
                )}
              </div>

              {/* Справа: Кнопка LIST */}
              <button
                type="button"
                onClick={() => setIsListFullscreenOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-md transition-colors shrink-0 ml-auto"
              >
                <List className="w-4 h-4" />
                <span>LIST ({filteredResults.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* КАРТА GOOGLE MAPS */}
      <div
        className="flex-1 w-full h-full relative"
        onMouseEnter={closeFilterDropdown}
        onPointerDown={closeFilterDropdown}
        onTouchStart={closeFilterDropdown}
        onWheel={closeFilterDropdown}
      >
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={searchCenter}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
          onDragstart={() => {
            closeFilterDropdown();
            setActiveMarkerId(null);
            setHoveredMarkerId(null);
          }}
          onCameraChanged={(ev) => {
            if (typeof ev.detail?.zoom === 'number') {
              setMapZoom(ev.detail.zoom);
            }
            closeFilterDropdown();
          }}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{width: '100%', height: '100%'}}
        >
          {/* Элементы нашей системы GoBell на карте отображаются ТОЛЬКО в режиме GoBell */}
          {searchSystemMode === 'TAG_SYSTEM' && (
            <>
              {/* Голубая маска и очерченная граница радиуса поиска */}
              <SearchRadiusOverlay
                center={searchCenter}
                radiusMeters={radiusMeters}
                onSelectCenter={handleSelectSearchCenter}
              />

              {/* Маркер центра поиска */}
              <AdvancedMarker position={searchCenter} title="Центр радиуса поиска">
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-sky-500/30 border-2 border-sky-400 flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </AdvancedMarker>

              {/* Маркеры активных пользователей и 24ч-объявлений в радиусе поиска:
                  - Местные объявления (NATIVE), привязанные к пользователю, отображаются как 1–4 ВРАЩАЮЩИХСЯ ЗНАКА ДОЛЛАРА ($) прямо НАД ГОЛОВОЙ иконки пользователя!
                  - Гостевые объявления (GUEST), привязанные к месту, отображаются как ВРАЩАЮЩАЯСЯ И ПУЛЬСИРУЮЩАЯ МОНЕТКА ($) на точке карты! */}
              {(() => {
                const visibleOwnerIds = new Set(
                  filteredResults
                    .filter((r) => r.profile.category !== 'ADVERT')
                    .map((r) => r.profile.id)
                );

                return filteredResults.map((item) => {
                  const {profile, distanceMeters} = item;
                  const isPublishedAdvert = profile.category === 'ADVERT';

                  // Если это местное объявление (NATIVE) и иконка самого владельца уже видна на карте —
                  // мы не рисуем дублирующий маркер под ногами владельца, так как это объявление висит вращающимся $ прямо НАД ЕГО ГОЛОВОЙ!
                  if (
                    isPublishedAdvert &&
                    profile.advertStatus === 'NATIVE' &&
                    profile.ownerProfileId &&
                    visibleOwnerIds.has(profile.ownerProfileId)
                  ) {
                    return null;
                  }

                  // Если гостевая монетка (GUEST) попала ровно в те же координаты, где стоит чей-то аватар или другая гостевая монетка,
                  // разводим их на комфортное расстояние друг от друга!
                  let effectiveMarkerPosition = profile.position;
                  if (isPublishedAdvert && profile.advertStatus === 'GUEST') {
                    const collidingOrigin = filteredResults.find(
                      (other) =>
                        other.profile.id !== profile.id &&
                        getDistanceMeters(other.profile.position, profile.position) < 35
                    );
                    if (collidingOrigin) {
                      const sameSpotGuests = filteredResults.filter(
                        (other) =>
                          other.profile.category === 'ADVERT' &&
                          other.profile.advertStatus === 'GUEST' &&
                          getDistanceMeters(other.profile.position, profile.position) < 35
                      );
                      const guestIdx = Math.max(
                        0,
                        sameSpotGuests.findIndex((g) => g.profile.id === profile.id)
                      );
                      const slotIdx = guestIdx + ((profile.slotId || 1) - 1);
                      const angleRad = (slotIdx * Math.PI) / 2.2 + Math.PI / 5;
                      effectiveMarkerPosition = {
                        lat: profile.position.lat + Math.sin(angleRad) * 0.0007,
                        lng: profile.position.lng + Math.cos(angleRad) * 0.001,
                      };
                    }
                  }

                  // Находим все активные местные объявления (NATIVE, от 1 до 4 шт.), привязанные к этому пользователю, чтобы вывести их вращающимися зелёными монетками над его головой
                  const attachedNativeAdverts = !isPublishedAdvert
                    ? allActiveProfiles
                        .filter(
                          (p) =>
                            p.category === 'ADVERT' &&
                            p.advertStatus === 'NATIVE' &&
                            p.ownerProfileId === profile.id
                        )
                        .sort((a, b) => (a.slotId || 1) - (b.slotId || 1))
                    : [];

                  const activeOverheadAdvert = attachedNativeAdverts.find(
                    (ad) => activeMarkerId === ad.id
                  );

                  const effectiveTier =
                    profile.userTier ||
                    (profile.category === 'BUSINESS' ? 'BUSINESS' : 'FREE');
                  const isProfileCardOpen = activeMarkerId === profile.id;
                  const isAnyHoveredOrTapped =
                    isProfileCardOpen || Boolean(activeOverheadAdvert);

                  // Какой объект сейчас показан во всплывающей карточке над маркером (открывается ТОЛЬКО когда объект в зоне действия курсора мыши и нажата клавиша I)
                  const displayedPopupProfile = activeOverheadAdvert || profile;
                  const isPopupShowingAdvert =
                    Boolean(activeOverheadAdvert) || isPublishedAdvert;

                  return (
                    <AdvancedMarker
                      key={profile.id}
                      position={effectiveMarkerPosition}
                      clickable={true}
                      zIndex={isAnyHoveredOrTapped ? 100 : isPublishedAdvert ? 40 : 20}
                      onClick={() => {
                        closeFilterDropdown();
                        if (!isMapKeyIDownRef.current) return;
                        const targetId =
                          hoveredMarkerId &&
                          (hoveredMarkerId === profile.id ||
                            attachedNativeAdverts.some((ad) => ad.id === hoveredMarkerId))
                            ? hoveredMarkerId
                            : profile.id;
                        setActiveMarkerId((prev) => (prev === targetId ? null : targetId));
                      }}
                    >
                      <div
                        className="group relative flex flex-col items-center select-none"
                        onMouseLeave={() => {
                          hoveredMarkerIdRef.current = null;
                          setHoveredMarkerId(null);
                          setActiveMarkerId((prev) =>
                            prev === profile.id ||
                            attachedNativeAdverts.some((ad) => ad.id === prev)
                              ? null
                              : prev
                          );
                        }}
                      >
                        {/* Контейнер масштабирования по зуму карты */}
                        <div
                          className="relative flex flex-col items-center origin-bottom"
                          style={{
                            transform: `scale(${markerZoomScale})`,
                          }}
                        >
                          {/* Информационная карточка объекта СТРОГО НАД МОНЕТКОЙ / ИКОНКОЙ — появляется ТОЛЬКО когда объект в зоне действия курсора мыши и нажата клавиша I */}
                          {isAnyHoveredOrTapped && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                transform: `translateX(-50%) scale(${1 / markerZoomScale})`,
                                transformOrigin: 'bottom center',
                              }}
                              className="absolute bottom-full left-1/2 pb-3.5 z-30 pointer-events-auto"
                            >
                              <div className="px-3.5 py-3 rounded-2xl bg-slate-950/95 border border-slate-700 text-xs text-slate-100 shadow-2xl min-w-[235px] max-w-[295px] text-left leading-snug animate-in fade-in duration-100 space-y-2.5">
                                {isPopupShowingAdvert ? (
                                  <>
                                    {/* Крупный и наглядный текст самого объявления на первом месте */}
                                    <div className="text-sm sm:text-[15px] font-extrabold text-white leading-snug break-words">
                                      {displayedPopupProfile.profileText}
                                    </div>

                                    {/* Аккуратная строка автора, кармы и статуса объявления */}
                                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[160px]">
                                        {displayedPopupProfile.authorName}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                            displayedPopupProfile.advertStatus === 'NATIVE'
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                          }`}
                                        >
                                          {displayedPopupProfile.advertStatus === 'NATIVE'
                                            ? `Местный${
                                                displayedPopupProfile.slotId
                                                  ? ` #${displayedPopupProfile.slotId}`
                                                  : ''
                                              }`
                                            : 'Гость'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                                          +{displayedPopupProfile.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold bg-rose-500/20 text-rose-300">
                                          -{displayedPopupProfile.karmaMinus ?? 0}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Кнопка Запрос на контакт прямо в карточке объявления */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenContactRequestForm({
                                          id: displayedPopupProfile.id,
                                          authorName: displayedPopupProfile.authorName,
                                          category: 'ADVERT',
                                        });
                                      }}
                                      className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Запрос на контакт</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {profile.visibleIdentityLabel &&
                                      profile.visibleIdentityLabel.trim().length > 0 && (
                                        <div className="text-xs font-extrabold text-amber-300 text-center">
                                          {profile.visibleIdentityLabel}
                                        </div>
                                      )}
                                    <div className="flex items-center justify-center gap-2 pb-1 border-b border-slate-800">
                                      <span className="text-[11px] font-bold text-slate-300">Карма:</span>
                                      <span className="px-2 py-0.5 rounded-md font-mono text-xs font-extrabold bg-emerald-500/20 border border-emerald-400/60 text-emerald-300">
                                        +{profile.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-md font-mono text-xs font-extrabold bg-rose-500/20 border border-rose-400/60 text-rose-300">
                                        -{profile.karmaMinus ?? 0}
                                      </span>
                                    </div>

                                    {profile.visibleDescription &&
                                      profile.visibleDescription.trim().length > 0 && (
                                        <div className="text-sm font-semibold text-white text-center">
                                          {profile.visibleDescription}
                                        </div>
                                      )}

                                    {profile.id !== 'my-own-profile' ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenContactRequestForm({
                                            id: profile.id,
                                            authorName: profile.authorName,
                                            category: profile.category,
                                          });
                                        }}
                                        className="mt-1 w-full py-1.5 px-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition-colors"
                                      >
                                        Запрос на контакт
                                      </button>
                                    ) : (
                                      <div className="mt-1 p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/60 text-[11px] text-emerald-300 font-bold text-center space-y-1">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                          <span>📡 Геолокация смартфона ВКЛ</span>
                                        </div>
                                        <div className="text-[10px] text-slate-200 font-normal">
                                          Когда вы играете в <b>ELITE 3D</b>, ваш маяк светится на реальной карте GoBell!
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ОТДЕЛЬНАЯ ЗОНА 1: АКТИВНЫЕ МЕСТНЫЕ ОБЪЯВЛЕНИЯ (1–4 ШТ.): ПРЯМО НАД ГОЛОВОЙ КРУТЯТСЯ 1–4 ЗЕЛЁНЫЕ МОНЕТКИ ($) БЕЗ ТЕКСТОВЫХ ПОДПИСЕЙ */}
                          {attachedNativeAdverts.length > 0 && (
                            <div className="mb-2.5 flex items-center justify-center gap-3 z-20">
                              {attachedNativeAdverts.map((ad) => {
                                const isThisAdSelected = activeMarkerId === ad.id;
                                return (
                                  <div
                                    key={ad.id}
                                    onMouseEnter={() => {
                                      hoveredMarkerIdRef.current = ad.id;
                                      setHoveredMarkerId(ad.id);
                                      if (isMapKeyIDownRef.current) {
                                        setActiveMarkerId(ad.id);
                                      }
                                    }}
                                    className={`relative flex items-center justify-center transition-transform duration-150 cursor-pointer ${
                                      isThisAdSelected ? 'scale-125' : 'hover:scale-125'
                                    }`}
                                  >
                                    <span className="absolute w-7 h-7 rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />
                                    <div className="animate-gobell-dollar w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-600 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.9)] flex items-center justify-center">
                                      <div className="w-4 h-4 rounded-full border border-emerald-950/40 flex items-center justify-center">
                                        <span className="text-xs font-black text-slate-950 leading-none">
                                          $
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* ОТДЕЛЬНАЯ ЗОНА 2: САМ АВАТАР ПОЛЬЗОВАТЕЛЯ ИЛИ ГОСТЕВАЯ МОНЕТКА (НИКАКИХ ТЕКСТОВЫХ ПОДПИСЕЙ НА ЭКРАНЕ, КАРТОЧКА ТОЛЬКО ПО КУРСОРУ + КЛАВИШЕ I) */}
                          <div
                            onMouseEnter={() => {
                              hoveredMarkerIdRef.current = profile.id;
                              setHoveredMarkerId(profile.id);
                              if (isMapKeyIDownRef.current) {
                                setActiveMarkerId(profile.id);
                              }
                            }}
                            className={`relative flex flex-col items-center cursor-pointer transition-transform duration-150 ${
                              isProfileCardOpen ? 'scale-115' : 'hover:scale-110'
                            }`}
                          >
                            {profile.id === 'my-own-profile' && settingsAutoGeo && (
                              <>
                                <span className="absolute -top-1 w-11 h-11 rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />
                                <span className="absolute -top-1.5 w-12 h-12 rounded-full border-2 border-cyan-400/80 shadow-[0_0_18px_rgba(16,185,129,0.95)] pointer-events-none" />
                              </>
                            )}
                            {isPublishedAdvert ? (
                              profile.advertStatus === 'NATIVE' ? (
                                <div className="flex flex-col items-center">
                                  <div className="relative flex items-center justify-center">
                                    <span className="absolute w-9 h-9 rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />
                                    <div className="animate-gobell-dollar w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-600 border-2 border-white shadow-[0_0_14px_rgba(16,185,129,0.9)] flex items-center justify-center">
                                      <div className="w-6 h-6 rounded-full border border-emerald-950/40 flex items-center justify-center">
                                        <span className="text-sm font-black text-slate-950 leading-none">
                                          $
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="relative flex items-center justify-center">
                                    <span className="absolute w-9 h-9 rounded-full bg-amber-400/35 animate-ping pointer-events-none" />
                                    <div className="animate-gobell-dollar w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-2 border-white shadow-[0_0_14px_rgba(245,158,11,0.9)] flex items-center justify-center">
                                      <div className="w-6 h-6 rounded-full border border-amber-900/40 flex items-center justify-center">
                                        <span className="text-sm font-black text-slate-950 leading-none">
                                          $
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : effectiveTier === 'BUSINESS' ? (
                              <div className="flex items-center justify-center">
                                <span className="animate-gobell-dollar text-3xl font-black text-amber-400 drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
                                  $
                                </span>
                              </div>
                            ) : effectiveTier === 'PRO' ? (
                              <div className="flex items-center justify-center">
                                <ProCustomPictogramGraphic
                                  type={profile.proPictogram}
                                  sizeClass="w-8 h-8"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <PersonBustSvg
                                  fillColor="#10b981"
                                  strokeColor="#ffffff"
                                  sizeClass="w-8 h-8"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                });
              })()}
            </>
          )}
        </Map>

        {/* Нижняя плашка статуса центра поиска на карте (только в режиме GoBell, приподнята над нижней демо-панелью) */}
        {searchSystemMode === 'TAG_SYSTEM' && (
          <div className="absolute bottom-20 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-slate-300 font-medium">Центр радиуса:</span>
              <span className="font-mono text-sky-300">
                {searchCenter.lat.toFixed(4)}, {searchCenter.lng.toFixed(4)}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              Радиус: <strong className="text-white">{formatDistance(radiusMeters)}</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">
              Найдено: <strong className="text-sky-400">{filteredResults.length}</strong>
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  settingsAutoGeo ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                }`}
              />
              <span className={settingsAutoGeo ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {settingsAutoGeo
                  ? 'Смартфон GPS ВКЛ: Вы светитесь на карте GoBell'
                  : 'GPS ВЫКЛ: Профиль скрыт с карты (ELITE 3D заблокирована)'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ПОЛНОЭКРАННАЯ ПАНЕЛЬ СПИСКА (КНОПКА LIST) — ПОЛНОСТЬЮ ЗАКРЫВАЕТ ЭКРАН И ЗАКРЫВАЕТСЯ КРЕСТИКОМ В ПРАВОМ ВЕРХНЕМ УГЛУ */}
      {isListFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Шапка полноэкранного списка с крестиком в правом верхнем углу */}
          <div className="h-16 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                <List className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate">
                    Список объектов в радиусе {formatDistance(radiusMeters)}
                  </h2>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Фильтр: {selectedCategory} ({filteredResults.length})
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  Отсортировано от ближайшего к центру поиска к периферии по расстоянию
                </p>
              </div>
            </div>

            {/* Крестик в правом верхнем углу с переходом к карте */}
            <button
              type="button"
              onClick={() => setIsListFullscreenOpen(false)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shrink-0"
              title="Закрыть список и вернуться к карте"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Быстрое переключение фильтров внутри полноэкранного списка (включение любого фильтра выключает кнопку "Показать на карте" группы) */}
          <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'GROUPS', 'ADVERT', 'BUSINESS', 'SOS'] as FilterCategory[]).map((cat) => {
                const isSelected = !activeGroupMapTag && selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveGroupMapTag(null);
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? CATEGORY_META[cat].activeBtnClass
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="font-mono text-[11px] opacity-90">
                      ({categoryCounts[cat]})
                    </span>
                  </button>
                );
              })}
            </div>

            {searchQuery && (
              <div className="text-xs text-slate-400">
                Поисковый запрос: <strong className="text-sky-300">«{searchQuery}»</strong>
              </div>
            )}
          </div>

          {/* Контент списка: от ближайшего к центру поиска к периферии */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-3">
              {filteredResults.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                  <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-base font-semibold text-white">
                    В радиусе {formatDistance(radiusMeters)} по фильтру {selectedCategory} объектов не найдено
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Попробуйте увеличить ползунок радиуса поиска до 5 км, сменить фильтр категории или очистить строку поиска.
                  </p>
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const {profile, distanceMeters, activeTags, matchedTags} = item;
                  const badgeBgColor =
                    profile.category === 'ADVERT' && profile.advertStatus === 'NATIVE'
                      ? '#10b981'
                      : profile.category === 'ADVERT' && profile.advertStatus === 'GUEST'
                      ? '#f97316'
                      : profile.category
                      ? CATEGORY_META[profile.category].pinColor
                      : profile.userTier === 'PRO'
                      ? '#f59e0b'
                      : '#0284c7';
                  const badgeLabel = profile.category
                    ? `${profile.category}${profile.advertStatus ? ` · ${profile.advertStatus}` : ''}`
                    : profile.userTier || 'FREE';

                  return (
                    <div
                      key={profile.id}
                      className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                          <span
                            className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md text-white"
                            style={{
                              backgroundColor: badgeBgColor,
                            }}
                          >
                            {badgeLabel}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-white">
                            {profile.authorName}
                          </h3>
                          <span className="text-xs text-slate-400">· {profile.updatedAt}</span>
                        </div>

                        {/* Все активные слова профиля как теги */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {activeTags.map((tag) => {
                            const isMatched =
                              searchQuery.trim().length > 0 && matchedTags.includes(tag);
                            return (
                              <span
                                key={tag}
                                className={`text-xs px-2 py-0.5 rounded-md border ${
                                  isMatched
                                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                                    : 'bg-slate-950 border-slate-800 text-slate-300'
                                }`}
                              >
                                #{tag}
                              </span>
                            );
                          })}
                        </div>

                        {profile.contact && (
                          <div className="text-xs text-slate-400">
                            Контакт: <span className="text-slate-200 font-mono">{profile.contact}</span>
                          </div>
                        )}
                      </div>

                      {/* Блок расстояния от центра поиска + переход на карту */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400">
                            Расстояние от центра
                          </div>
                          <div className="text-lg font-mono font-bold text-sky-400">
                            {formatDistance(distanceMeters)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {profile.id !== 'my-own-profile' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenContactRequestForm({
                                  id: profile.id,
                                  authorName: profile.authorName,
                                  category: profile.category,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Запрос на контакт</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsListFullscreenOpen(false);
                              setActiveMarkerId(profile.id);
                              map?.panTo(profile.position);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Показать на карте</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ЛИЧНЫЙ КАБИНЕТ ПОЛЬЗОВАТЕЛЯ (КНОПКА «КАБИНЕТ» НА ПОСТОЯННОМ БЛОКЕ) */}
      {isCabinetOpen && !subscriptionPagePlan && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* САМАЯ ВЕРХНЯЯ СТРОКА КАБИНЕТА: ВЫБОР УРОВНЯ FREE / PRO / BUSINESS + БЕГУЩАЯ РЕКЛАМНАЯ СТРОКА */}
          <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="hidden md:inline text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Уровень кабинета:
              </span>

              {/* Уровень FREE */}
              <button
                type="button"
                onClick={() => handleSwitchActiveDemoTier('FREE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  currentAccountTier === 'FREE'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <span>FREE</span>
                {currentAccountTier === 'FREE' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-950/20 font-extrabold">
                    Активен
                  </span>
                )}
              </button>

              {/* Кнопка PRO */}
              <button
                type="button"
                onClick={() => setSubscriptionPagePlan('PRO')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                  currentAccountTier === 'PRO'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border-amber-500/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {currentAccountTier === 'PRO'
                    ? PRO_PACKAGE_META[myProPackage].shortBadge
                    : 'PRO'}
                </span>
                {currentAccountTier === 'PRO' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-950/20 font-extrabold">
                    Активен
                  </span>
                )}
              </button>

              {/* Кнопка PRO+ справа от PRO — ведёт на страницу регистрации уровней PRO + I / PRO + II / PRO + III */}
              <button
                type="button"
                onClick={() => setSubscriptionPagePlan('PRO_PLUS')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 shadow-sm ${
                  currentAccountTier === 'PRO' && myProPackage !== 'PRO'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                    : 'bg-amber-500/15 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border-amber-400/60'
                }`}
                title="Перейти на страницу регистрации пакетов PRO+ (PRO + I, PRO + II, PRO + III)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRO+</span>
              </button>

              {/* Кнопка BUSINESS */}
              <button
                type="button"
                onClick={() => setSubscriptionPagePlan('BUSINESS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                  currentAccountTier === 'BUSINESS'
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-800 hover:bg-indigo-500 hover:text-white text-indigo-300 border-indigo-500/40'
                }`}
              >
                <span>BUSINESS</span>
                {currentAccountTier === 'BUSINESS' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-black/30 font-extrabold">
                    Активен
                  </span>
                )}
              </button>
            </div>

            {/* Бегущая рекламная строка вверху личного кабинета: для FREE — возможности PRO, для уровня PRO — другая бегущая строка с возможностями уровней PRO+ */}
            <div
              onClick={() =>
                setSubscriptionPagePlan(currentAccountTier === 'PRO' ? 'PRO_PLUS' : 'PRO')
              }
              className="flex-1 min-w-[160px] overflow-hidden bg-slate-950/90 border border-amber-500/30 rounded-xl py-2 px-3 cursor-pointer relative"
              title={
                currentAccountTier === 'PRO'
                  ? 'Нажмите, чтобы открыть страницу регистрации уровней PRO+ (PRO + I / II / III)'
                  : 'Click to view PRO subscription'
              }
            >
              {currentAccountTier === 'PRO' ? (
                <div className="animate-gobell-marquee items-center whitespace-nowrap text-xs font-semibold text-amber-300">
                  <span className="mx-6">
                    ★ Возможности уровней PRO+: PRO + I (2 объявления Advert · до 15 слов) · PRO + II (3 объявления Advert · до 20 слов) · PRO + III (4 объявления Advert · до 25 слов) · Автопродление 24ч и запуск без ожидания — нажмите PRO+ для регистрации!
                  </span>
                  <span className="mx-6">
                    ★ PRO+ Upgrade Capabilities: PRO + I (2 Adverts · 15 words) · PRO + II (3 Adverts · 20 words) · PRO + III (4 Adverts · 25 words) · 24h Auto-Renewal & No Waiting Cooldown!
                  </span>
                </div>
              ) : (
                <div className="animate-gobell-marquee items-center whitespace-nowrap text-xs font-semibold text-amber-300">
                  <span className="mx-6">
                    ★ PRO Level Features: More tags. More groups. Group administration. Access to Go Bell Exchange.
                  </span>
                  <span className="mx-6">
                    ★ PRO Level Features: More tags. More groups. Group administration. Access to Go Bell Exchange.
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (cabinetAdminMode === 'CREATE_USER') {
                  const prevDp = demoProfiles.find((d) => d.id === previousActiveDemoProfileId);
                  if (prevDp) handleSelectDemoProfile(prevDp);
                }
                setCabinetAdminMode('NONE');
                setEditingDemoUserId(null);
                setIsCabinetOpen(false);
              }}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shrink-0"
              title="Закрыть кабинет и вернуться к карте"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ДОПОЛНИТЕЛЬНАЯ СТРОКА РЕЖИМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ПОЛЬЗОВАТЕЛЯ В ПОЛНОМ КАБИНЕТЕ */}
          {cabinetAdminMode !== 'NONE' && (
            <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-500/40 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold uppercase tracking-wider">
                  {cabinetAdminMode === 'CREATE_USER'
                    ? `Создание пользователя (${currentAccountTier})`
                    : `Редактирование пользователя (${currentAccountTier})`}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/40 font-mono font-extrabold text-emerald-300">
                  Уникальный 8-значный тег: #
                  {cabinetAdminMode === 'CREATE_USER'
                    ? newDemoGeneratedTag
                    : demoProfiles.find((d) => d.id === editingDemoUserId)?.userTag ||
                      newDemoGeneratedTag}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-semibold">
                    Геолокация (Copy-Paste из Google):
                  </span>
                  <input
                    type="text"
                    value={profileGeoCoordsDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfileGeoCoordsDraft(val);
                      const parsed = parseGoogleCoordsCopyPaste(val);
                      if (parsed) {
                        setEditDemoLatDraft(parsed.lat.toFixed(6));
                        setEditDemoLngDraft(parsed.lng.toFixed(6));
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted) {
                        e.preventDefault();
                        setProfileGeoCoordsDraft(pasted.trim());
                        applyGoogleCoordsToCurrentProfile(pasted);
                      }
                    }}
                    className="bg-slate-950 border border-sky-400 rounded-lg px-2.5 py-1 text-xs font-mono text-sky-300 w-56 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                    placeholder="Напр.: 49.234567, 28.456789"
                  />
                  <button
                    type="button"
                    onClick={() => applyGoogleCoordsToCurrentProfile(profileGeoCoordsDraft)}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-extrabold transition-colors"
                    title="Применить введённые координаты из Google Maps"
                  >
                    Привязать точку
                  </button>
                </div>

                {/* Выбор Демо-Комьюнити для создаваемого / редактируемого пользователя */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-300 font-bold">Демо-Комьюнити:</span>
                  <select
                    value={myCommunityId || activeDemoCommunityId}
                    onChange={(e) => {
                      setMyCommunityId(e.target.value);
                      setActiveDemoCommunityId(e.target.value);
                    }}
                    className="bg-slate-950 border border-emerald-400 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-300 focus:outline-none"
                  >
                    {demoCommunities.map((comm) => (
                      <option key={comm.id} value={comm.id}>
                        {comm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFinishCabinetUserSave}
                  className="px-5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-lg transition-colors"
                >
                  {cabinetAdminMode === 'CREATE_USER' ? 'create a user' : 'Применить'}
                </button>
              </div>
            </div>
          )}

          {/* ВТОРОЙ БЛОК КАБИНЕТА: КНОПКИ PROFILE, GROUPS, ADVERT, SOS, ПОСЕРЕДИНЕ CHAT, И СПРАВА ШЕСТЕРЁНКА (SETTINGS) */}
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Кнопка Profile */}
              <button
                type="button"
                onClick={() => setCabinetTab('PROFILE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  cabinetTab === 'PROFILE'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Profile
              </button>

              {/* Кнопка Groups */}
              <button
                type="button"
                onClick={() => setCabinetTab('GROUPS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  cabinetTab === 'GROUPS'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Groups
              </button>

              {/* Кнопка Advert */}
              <button
                type="button"
                onClick={() => setCabinetTab('ADVERT')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  cabinetTab === 'ADVERT'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Advert
              </button>

              {/* Кнопка SOS */}
              <button
                type="button"
                onClick={() => setCabinetTab('SOS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  cabinetTab === 'SOS'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-950 text-rose-300 border-rose-900/60 hover:border-rose-700'
                }`}
              >
                SOS
              </button>
            </div>

            {/* Кнопка посередине блока: Chat -> ведет на страницу Чат */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setCabinetTab('CHAT')}
                className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                  cabinetTab === 'CHAT'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
                {contactRequests.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-extrabold ${
                      cabinetTab === 'CHAT'
                        ? 'bg-slate-950 text-sky-400'
                        : 'bg-sky-500 text-slate-950'
                    }`}
                  >
                    {contactRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Кнопка со значком шестерёнки -> ведет на страницу Settings */}
            <button
              type="button"
              onClick={() => setCabinetTab('SETTINGS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                cabinetTab === 'SETTINGS'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              title="Settings (Настройки)"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* СТРАНИЦА 1: PROFILE (Поля: Имя, Ник нейм, Описание + кнопки Редактировать/Применить и Показать/Не показывать + Система Кармы и Бана профиля) */}
              {cabinetTab === 'PROFILE' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-base font-bold text-white">Страница Profile</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Управляйте полями профиля. Возле каждого поля доступны кнопки «Редактировать / Применить» и «Показать / Не показывать».
                      </p>
                    </div>

                    {/* Плашка Кармы и серии минусов подряд (3 минуса подряд = бан на неделю) */}
                    <div className="flex items-center gap-2 flex-wrap bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                      <span className="text-slate-300 font-semibold">Карма:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 font-mono font-extrabold text-emerald-300">
                        +{myKarmaPlus}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 font-mono font-extrabold text-rose-300">
                        -{myKarmaMinus}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span
                        className={`font-mono font-bold ${
                          myConsecutiveMinuses > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                        title="Три минуса подряд приводят к бану профиля на неделю"
                      >
                        Минусов подряд: {myConsecutiveMinuses}/3
                      </span>
                    </div>
                  </div>

                  {/* БАННЕР БЛОКИРОВКИ ПРОФИЛЯ НА НЕДЕЛЮ (ПРИ ПОЛУЧЕНИИ 3 МИНУСОВ ПОДРЯД) */}
                  {myBannedUntilMs && nowMs < myBannedUntilMs && (
                    <div className="p-4 rounded-2xl bg-rose-950/70 border-2 border-rose-500 text-rose-100 flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                          ⛔ ПРОФИЛЬ ЗАБЛОКИРОВАН НА НЕДЕЛЮ (3 МИНУСА ПОДРЯД В КАРМУ)
                        </div>
                        <div className="text-xs text-rose-200">
                          Ваш профиль временно скрыт с карты GoBell. До окончания бана осталось:{' '}
                          <strong className="font-mono text-white">
                            {formatBanDurationDaysHMS(Math.max(0, myBannedUntilMs - nowMs))}
                          </strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMyBannedUntilMs(null);
                          setMyConsecutiveMinuses(0);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-200 border border-rose-500/50 text-xs font-bold transition-colors shrink-0"
                      >
                        Снять бан (тест)
                      </button>
                    </div>
                  )}

                  {/* ПОЛЕ ГЕОЛОКАЦИИ ПРОФИЛЯ (РУЧНОЙ ВВОД / COPY-PASTE КООРДИНАТ ИЗ GOOGLE MAPS) И ПРИВЯЗКА К ДЕМО-КОМЬЮНИТИ */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-sky-500/30 space-y-3">
                    {/* Строка привязки профиля к Демо-Комьюнити (только для ДЕМО) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Привязка к Демо-Комьюнити (только ДЕМО):</span>
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={myCommunityId || activeDemoCommunityId}
                          onChange={(e) => {
                            const nextCommId = e.target.value;
                            setMyCommunityId(nextCommId);
                            setActiveDemoCommunityId(nextCommId);
                          }}
                          className="bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                        >
                          {demoCommunities.map((comm) => (
                            <option key={comm.id} value={comm.id}>
                              {comm.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsCommunitiesPageOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                        >
                          Управление комьюнити
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        <span>Привязка профиля к геолокации (Copy-Paste из Google Maps)</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        Текущая точка:{' '}
                        <strong className="text-emerald-300">
                          {(anchorClusterCenter.lat + myPositionOffset.lat).toFixed(6)},{' '}
                          {(anchorClusterCenter.lng + myPositionOffset.lng).toFixed(6)}
                        </strong>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <input
                        type="text"
                        value={
                          isEditingProfileGeo
                            ? profileGeoCoordsDraft
                            : `${(anchorClusterCenter.lat + myPositionOffset.lat).toFixed(6)}, ${(
                                anchorClusterCenter.lng + myPositionOffset.lng
                              ).toFixed(6)}`
                        }
                        readOnly={!isEditingProfileGeo}
                        onChange={(e) => setProfileGeoCoordsDraft(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          if (pasted) {
                            e.preventDefault();
                            setIsEditingProfileGeo(true);
                            setProfileGeoCoordsDraft(pasted.trim());
                            applyGoogleCoordsToCurrentProfile(pasted);
                          }
                        }}
                        placeholder="Скопируйте координаты из Google Maps (напр.: 49.842957, 24.031111) и вставьте сюда..."
                        className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs font-mono transition-colors focus:outline-none border ${
                          isEditingProfileGeo
                            ? 'bg-slate-900 border-sky-400 text-white ring-2 ring-sky-400/20'
                            : 'bg-slate-900/60 border-slate-800 text-sky-200 cursor-default'
                        }`}
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingProfileGeo) {
                              applyGoogleCoordsToCurrentProfile(profileGeoCoordsDraft);
                              setIsEditingProfileGeo(false);
                            } else {
                              setProfileGeoCoordsDraft(
                                `${(anchorClusterCenter.lat + myPositionOffset.lat).toFixed(6)}, ${(
                                  anchorClusterCenter.lng + myPositionOffset.lng
                                ).toFixed(6)}`
                              );
                              setIsEditingProfileGeo(true);
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[130px] text-center ${
                            isEditingProfileGeo
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          {isEditingProfileGeo ? 'Применить' : 'Редактировать'}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      В Google Maps кликните правой кнопкой мыши по нужному дому или двору, нажмите на координаты вверху меню (они скопируются) и вставьте сюда (<strong>Ctrl+V</strong>).
                    </p>
                  </div>

                  {/* ПОЛЕ 1: ИМЯ */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Имя
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <input
                        type="text"
                        value={isEditingName ? profileNameDraft : profileName}
                        readOnly={!isEditingName}
                        onChange={(e) => setProfileNameDraft(e.target.value)}
                        placeholder="Введите ваше имя..."
                        className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none border ${
                          isEditingName
                            ? 'bg-slate-950 border-sky-400 text-white ring-2 ring-sky-400/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200 cursor-default'
                        }`}
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Кнопка с двумя режимами: Редактировать / Применить */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingName) {
                              setProfileName(profileNameDraft.trim());
                              setIsEditingName(false);
                            } else {
                              setProfileNameDraft(profileName);
                              setIsEditingName(true);
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[130px] text-center ${
                            isEditingName
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          {isEditingName ? 'Применить' : 'Редактировать'}
                        </button>

                        {/* Кнопка с двумя режимами: Показать / Не показывать */}
                        <button
                          type="button"
                          onClick={() => setShowProfileName((prev) => !prev)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[135px] text-center ${
                            showProfileName
                              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                              : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          }`}
                        >
                          {showProfileName ? 'Показать' : 'Не показывать'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ПОЛЕ 2: НИК НЕЙМ */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/70">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Ник нейм
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <input
                        type="text"
                        value={isEditingNickname ? profileNicknameDraft : profileNickname}
                        readOnly={!isEditingNickname}
                        onChange={(e) => setProfileNicknameDraft(e.target.value)}
                        placeholder="Введите ваш ник нейм..."
                        className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none border ${
                          isEditingNickname
                            ? 'bg-slate-950 border-sky-400 text-white ring-2 ring-sky-400/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200 cursor-default'
                        }`}
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Кнопка с двумя режимами: Редактировать / Применить */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingNickname) {
                              setProfileNickname(profileNicknameDraft.trim());
                              setIsEditingNickname(false);
                            } else {
                              setProfileNicknameDraft(profileNickname);
                              setIsEditingNickname(true);
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[130px] text-center ${
                            isEditingNickname
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          {isEditingNickname ? 'Применить' : 'Редактировать'}
                        </button>

                        {/* Кнопка с двумя режимами: Показать / Не показывать */}
                        <button
                          type="button"
                          onClick={() => setShowProfileNickname((prev) => !prev)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[135px] text-center ${
                            showProfileNickname
                              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                              : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          }`}
                        >
                          {showProfileNickname ? 'Показать' : 'Не показывать'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ВЫБОР ПАКЕТА PRO (Базовый PRO = 1 объявл. / 10 слов, PRO + I = 2 объявл. / 15 слов, PRO + II = 3 объявл. / 20 слов, PRO + III = 4 объявл. / 25 слов) */}
                  {currentAccountTier === 'PRO' && (
                    <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/40 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                          Пакет уровня PRO (слоты объявлений Advert и лимит слов):
                        </span>
                        <span className="text-xs font-mono text-amber-200">
                          Активен: <strong>{PRO_PACKAGE_META[myProPackage].shortBadge}</strong> ·{' '}
                          {PRO_PACKAGE_META[myProPackage].advertSlots} объявл. · до{' '}
                          {PRO_PACKAGE_META[myProPackage].maxWords} слов
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {(
                          ['PRO', 'PRO_PLUS_1', 'PRO_PLUS_2', 'PRO_PLUS_3'] as ProPackageLevel[]
                        ).map((pkgKey) => {
                          const meta = PRO_PACKAGE_META[pkgKey];
                          const isSelected = myProPackage === pkgKey;
                          return (
                            <button
                              key={pkgKey}
                              type="button"
                              onClick={() => {
                                setMyProPackage(pkgKey);
                                const trimmed = limitWords(profileDescription, meta.maxWords);
                                setProfileDescription(trimmed);
                                setProfileDescriptionDraft(trimmed);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-md'
                                  : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-500/50'
                              }`}
                            >
                              <div className="text-xs font-extrabold">{meta.shortBadge}</div>
                              <div
                                className={`text-[11px] mt-0.5 ${
                                  isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                Объявлений: {meta.advertSlots} · Слов: {meta.maxWords}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ПОЛЕ 3: ОПИСАНИЕ (Ограничение уровня FREE: 6 слов, PRO: 10 слов, PRO+I: 15 слов, PRO+II: 20 слов, PRO+III: 25 слов, BUSINESS: 50 слов) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/70">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Описание{' '}
                        <span className="text-amber-300 normal-case font-semibold">
                          (уровень{' '}
                          {currentAccountTier === 'PRO'
                            ? PRO_PACKAGE_META[myProPackage].shortBadge
                            : currentAccountTier}
                          : максимум {maxDescriptionWordsForCurrentTier} слов)
                        </span>
                      </label>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                          countWords(
                            isEditingDescription ? profileDescriptionDraft : profileDescription
                          ) >= maxDescriptionWordsForCurrentTier
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-sky-400'
                        }`}
                      >
                        Слов:{' '}
                        {countWords(
                          isEditingDescription ? profileDescriptionDraft : profileDescription
                        )}{' '}
                        / {maxDescriptionWordsForCurrentTier}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5">
                      <textarea
                        rows={3}
                        value={
                          isEditingDescription ? profileDescriptionDraft : profileDescription
                        }
                        readOnly={!isEditingDescription}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const words = rawVal.trim().split(/\s+/).filter(Boolean);
                          if (words.length <= maxDescriptionWordsForCurrentTier) {
                            setProfileDescriptionDraft(rawVal);
                          } else {
                            setProfileDescriptionDraft(
                              limitWords(rawVal, maxDescriptionWordsForCurrentTier)
                            );
                          }
                        }}
                        placeholder={`Введите описание профиля (макс. ${maxDescriptionWordsForCurrentTier} слов для уровня ${currentAccountTier})...`}
                        className={`flex-1 rounded-xl p-3.5 text-sm transition-colors focus:outline-none border ${
                          isEditingDescription
                            ? 'bg-slate-950 border-sky-400 text-white ring-2 ring-sky-400/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200 cursor-default'
                        }`}
                      />

                      <div className="flex sm:flex-col items-center gap-2 shrink-0">
                        {/* Кнопка с двумя режимами: Редактировать / Применить */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingDescription) {
                              const limited = limitWords(
                                profileDescriptionDraft.trim(),
                                maxDescriptionWordsForCurrentTier
                              );
                              setProfileDescription(limited);
                              setProfileDescriptionDraft(limited);
                              setIsEditingDescription(false);
                            } else {
                              setProfileDescriptionDraft(profileDescription);
                              setIsEditingDescription(true);
                            }
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[130px] text-center ${
                            isEditingDescription
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          {isEditingDescription ? 'Применить' : 'Редактировать'}
                        </button>

                        {/* Кнопка с двумя режимами: Показать / Не показывать */}
                        <button
                          type="button"
                          onClick={() => setShowProfileDescription((prev) => !prev)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[135px] text-center ${
                            showProfileDescription
                              ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                              : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          }`}
                        >
                          {showProfileDescription ? 'Показать' : 'Не показывать'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Блок выбора пиктограммы на карте (Зелёный бюст на FREE, выбор из списка / Золотой бюст по умолчанию на PRO, анимированный $ на BUSINESS) */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Пиктограмма вашего профиля на карте (уровень {currentAccountTier}):
                      </span>
                      <span className="text-xs text-slate-400">
                        {currentAccountTier === 'FREE'
                          ? 'По умолчанию: Зелёный бюст персоны'
                          : currentAccountTier === 'PRO'
                          ? 'По умолчанию: Золотой бюст (доступен выбор из списка)'
                          : 'Уровень BUSINESS: Анимированный вращающийся знак $'}
                      </span>
                    </div>

                    {currentAccountTier === 'PRO' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PRO_PICTOGRAM_OPTIONS.map((opt) => {
                          const isSelected = myProPictogram === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setMyProPictogram(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400/40'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-amber-400/60 flex items-center justify-center shrink-0">
                                <ProCustomPictogramGraphic type={opt.id} />
                              </div>
                              <span className="text-xs font-semibold leading-tight">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                        {currentAccountTier === 'FREE' ? (
                          <>
                            <div className="w-11 h-11 rounded-2xl bg-slate-900 border-2 border-emerald-400 flex items-center justify-center shrink-0">
                              <PersonBustSvg fillColor="#10b981" strokeColor="#d1fae5" />
                            </div>
                            <div className="text-xs text-slate-300">
                              На уровне <strong className="text-emerald-300">FREE</strong> ваш профиль на карте обозначается крупной пиктограммой <strong>зелёного бюста персоны</strong>. Выбор кастомных пиктограмм из списка открывается на уровне <strong className="text-amber-300">PRO</strong>.
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-11 h-11 rounded-2xl bg-indigo-950 border-2 border-amber-400 flex items-center justify-center shrink-0">
                              <span className="animate-gobell-dollar text-xl font-black text-amber-300">
                                $
                              </span>
                            </div>
                            <div className="text-xs text-slate-300">
                              На уровне <strong className="text-indigo-300">BUSINESS</strong> ваш профиль на карте обозначается крупной <strong>анимированной вращающейся и пульсирующей пиктограммой $</strong>.
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Слова-теги из активных (показанных) полей профиля (Имя + Ник нейм + до 6 слов Описания) */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold text-slate-300">
                        Теги профиля (Имя + Ник нейм + слова Описания с режимом «Показать»):
                      </span>
                      <span className="text-xs font-mono text-sky-400">
                        Активно тегов: {myExtractedWordTags.filter((t) => t.active).length} из{' '}
                        {myExtractedWordTags.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {myExtractedWordTags.map((tagObj) => (
                        <button
                          key={tagObj.normalized}
                          type="button"
                          onClick={() => toggleMyWordTag(tagObj.normalized)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            tagObj.active
                              ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-500 line-through'
                          }`}
                        >
                          <span>#{tagObj.word}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* СТРАНИЦА 2: GROUPS (В FREE: только присоединение к группам по тегу; В PRO / PRO+: создание и модерация собственных открытых GO-... и закрытых GC-... групп по ступеням PRO+ [1/2/3/4 группы, 10/15/20/25 слов]) */}
              {cabinetTab === 'GROUPS' && (
                <div className="space-y-5">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          GROUPS
                        </span>
                        <h3 className="text-base font-bold text-white">
                          Страница Groups ·{' '}
                          {currentAccountTier === 'FREE'
                            ? 'Вступление в группы по тегу (FREE)'
                            : `Создание и модерация групп (${
                                currentAccountTier === 'PRO'
                                  ? `${PRO_PACKAGE_META[myProPackage].shortBadge}: до ${allowedAdvertSlotsCount} своих групп · до ${maxAdvertWordsForCurrentTier} слов`
                                  : 'BUSINESS: до 4 своих групп'
                              })`}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300">
                        {currentAccountTier === 'FREE'
                          ? `Уровень FREE: только вступление (${groupSlots.length} слота)`
                          : `Своих групп PRO: ${allowedAdvertSlotsCount} · Вступление по тегу`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong>Открытая группа</strong> получает тег с префиксом{' '}
                      <code className="text-emerald-300 font-mono">GO-...</code> (например,{' '}
                      <code className="text-emerald-300 font-mono">GO-45Hgd78</code>) — к ней может
                      присоединиться кто угодно, вбив тег себе в группы.{' '}
                      <strong>Закрытая группа</strong> получает тег с префиксом{' '}
                      <code className="text-amber-300 font-mono">GC-...</code> (например,{' '}
                      <code className="text-amber-300 font-mono">GC-91Tech7</code>) — чтобы вступить
                      в неё, нужно <strong>ввести её тег в Поиск GoBell</strong> (поиск выдаст админа
                      вне зависимости от радиуса) и отправить запрос с автоматической формулировкой{' '}
                      <em>«Вступление в закрытую группу»</em>. Если админ в Chat нажмёт{' '}
                      <strong>«Принять»</strong>, группа появится в вашем списке доступных групп.
                    </p>
                  </div>

                  {/* БЛОК СОЗДАНИЯ И МОДЕРАЦИИ СОБСТВЕННЫХ ГРУПП (ТОЛЬКО ДЛЯ PRO / PRO+ / BUSINESS) */}
                  {currentAccountTier !== 'FREE' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                          Мои созданные группы (привилегия PRO · статус Открытая GO- / Закрытая GC- выбирается раз и навсегда при создании):
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          Доступно по пакету: {allowedAdvertSlotsCount} из 4
                        </span>
                      </div>

                      {myCreatedProGroups.slice(0, allowedAdvertSlotsCount).map((cg) => {
                        const wordCount = countWords(cg.description);
                        const cgDetails = cg.isCreated ? resolveGroupDetails(cg.tag) : null;
                        const isShownOnMap =
                          cg.isCreated &&
                          activeGroupMapTag !== null &&
                          activeGroupMapTag.trim().toLowerCase() === cg.tag.trim().toLowerCase();

                        return (
                          <div
                            key={cg.slotId}
                            className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                              isShownOnMap
                                ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                                : cg.isCreated
                                ? 'border-amber-500/40'
                                : 'border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-800">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-extrabold">
                                  Моя группа #{cg.slotId}
                                </span>
                                {cg.isCreated ? (
                                  <>
                                    <span className="px-3 py-1 rounded-lg bg-slate-950 border border-emerald-400/50 font-mono text-xs font-extrabold text-emerald-300">
                                      #{cg.tag}
                                    </span>
                                    <span
                                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                                        cg.accessType === 'CLOSED'
                                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                      }`}
                                    >
                                      {cg.accessType === 'CLOSED'
                                        ? 'Закрытая группа (GC- · статус навсегда)'
                                        : 'Открытая группа (GO- · статус навсегда)'}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Выберите тип группы (раз и навсегда) и нажмите «Создать группу»
                                  </span>
                                )}
                              </div>

                              {/* До создания можно выбрать Открытая (GO-) или Закрытая (GC-); после создания статус заблокирован навсегда */}
                              {!cg.isCreated && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMyCreatedProGroups((prev) =>
                                        prev.map((item) =>
                                          item.slotId === cg.slotId
                                            ? {...item, accessType: 'OPEN'}
                                            : item
                                        )
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                      cg.accessType === 'OPEN'
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                        : 'bg-slate-950 text-slate-300 border-slate-800'
                                    }`}
                                  >
                                    Открытая (GO-...)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMyCreatedProGroups((prev) =>
                                        prev.map((item) =>
                                          item.slotId === cg.slotId
                                            ? {...item, accessType: 'CLOSED'}
                                            : item
                                        )
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                      cg.accessType === 'CLOSED'
                                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                                        : 'bg-slate-950 text-slate-300 border-slate-800'
                                    }`}
                                  >
                                    Закрытая (GC-...)
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-300">
                                  Название группы (Семья, Бригада, Болельщики и т.д.):
                                </label>
                                <input
                                  type="text"
                                  readOnly={cg.isCreated && !cg.isEditing}
                                  value={cg.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMyCreatedProGroups((prev) =>
                                      prev.map((item) =>
                                        item.slotId === cg.slotId ? {...item, name: val} : item
                                      )
                                    );
                                  }}
                                  placeholder="Например: Семья / Бригада монтажников / Выезд болельщиков..."
                                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-semibold text-slate-300">
                                    Описание группы (до {maxAdvertWordsForCurrentTier} слов):
                                  </label>
                                  <span className="text-[11px] font-mono text-amber-300">
                                    {wordCount} / {maxAdvertWordsForCurrentTier} слов
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  readOnly={cg.isCreated && !cg.isEditing}
                                  value={cg.description}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const words = raw.trim().split(/\s+/).filter(Boolean);
                                    const nextDesc =
                                      words.length <= maxAdvertWordsForCurrentTier
                                        ? raw
                                        : limitWords(raw, maxAdvertWordsForCurrentTier);
                                    setMyCreatedProGroups((prev) =>
                                      prev.map((item) =>
                                        item.slotId === cg.slotId
                                          ? {...item, description: nextDesc}
                                          : item
                                      )
                                    );
                                  }}
                                  placeholder={`Описание группы (до ${maxAdvertWordsForCurrentTier} слов)...`}
                                  className="w-full rounded-xl px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-800">
                              {!cg.isCreated ? (
                                <>
                                  <span className="text-xs text-slate-400">
                                    После создания группе будет присвоен уникальный тег{' '}
                                    <strong className="text-white font-mono">
                                      {cg.accessType === 'OPEN' ? 'GO-...' : 'GC-...'}
                                    </strong>{' '}
                                    и её статус ({cg.accessType === 'OPEN' ? 'Открытая' : 'Закрытая'})
                                    зафиксируется навсегда.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const generatedTag = generateGroupUniqueTag(cg.accessType);
                                      setMyCreatedProGroups((prev) =>
                                        prev.map((item) =>
                                          item.slotId === cg.slotId
                                            ? {
                                                ...item,
                                                isCreated: true,
                                                tag: generatedTag,
                                                name:
                                                  item.name.trim() ||
                                                  (item.accessType === 'CLOSED'
                                                    ? `Закрытая группа ${generatedTag}`
                                                    : `Открытая группа ${generatedTag}`),
                                                description:
                                                  limitWords(
                                                    item.description.trim(),
                                                    maxAdvertWordsForCurrentTier
                                                  ) || 'Координация участников группы на карте',
                                                isEditing: false,
                                              }
                                            : item
                                        )
                                      );
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-md transition-colors"
                                  >
                                    Создать группу ({cg.accessType === 'OPEN' ? 'GO-' : 'GC-'})
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs text-slate-300">
                                    Тег для участников:{' '}
                                    <strong className="font-mono text-emerald-300">{cg.tag}</strong>{' '}
                                    · Активных участников в радиусе:{' '}
                                    <strong className="text-white">
                                      {cgDetails?.activeMembersInRadius ?? 1}
                                    </strong>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isShownOnMap) {
                                          setActiveGroupMapTag(null);
                                        } else {
                                          setActiveGroupMapTag(cg.tag);
                                        }
                                      }}
                                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                        isShownOnMap
                                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                      }`}
                                    >
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>
                                        {isShownOnMap ? 'Показано на карте' : 'Показать на карте'}
                                      </span>
                                    </button>

                                    {cgDetails && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenGroupChat(cgDetails.info)}
                                        className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold border border-sky-400 flex items-center gap-1.5"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>Групповой чат</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const deletedTagNorm = cg.tag.trim().toLowerCase();
                                        if (
                                          activeGroupMapTag &&
                                          activeGroupMapTag.trim().toLowerCase() === deletedTagNorm
                                        ) {
                                          setActiveGroupMapTag(null);
                                        }
                                        if (
                                          activeChatSession?.isGroupChat &&
                                          activeChatSession.groupTag?.trim().toLowerCase() ===
                                            deletedTagNorm
                                        ) {
                                          setActiveChatSession(null);
                                        }
                                        // Удаляем дискредитированный или ненужный тег группы у всех участников
                                        setGroupSlots((prev) =>
                                          prev.map((s) =>
                                            s.tag.trim().toLowerCase() === deletedTagNorm
                                              ? {
                                                  ...s,
                                                  tag: '',
                                                  tagDraft: '',
                                                  isEditing: false,
                                                  adminApproved: true,
                                                }
                                              : s
                                          )
                                        );
                                        setDemoProfiles((prev) =>
                                          prev.map((dp) => ({
                                            ...dp,
                                            groupSlots: (dp.groupSlots || []).map((s) =>
                                              s.tag.trim().toLowerCase() === deletedTagNorm
                                                ? {
                                                    ...s,
                                                    tag: '',
                                                    tagDraft: '',
                                                    isEditing: false,
                                                    adminApproved: true,
                                                  }
                                                : s
                                            ),
                                          }))
                                        );
                                        // Освобождаем слот создания группы админа для создания новой группы с новым тегом
                                        setMyCreatedProGroups((prev) =>
                                          prev.map((item) =>
                                            item.slotId === cg.slotId
                                              ? {
                                                  ...item,
                                                  isCreated: false,
                                                  tag: '',
                                                  name: '',
                                                  description: '',
                                                  isEditing: true,
                                                }
                                              : item
                                          )
                                        );
                                      }}
                                      className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold border border-rose-800/70 transition-colors"
                                      title="Удалить группу (если группа больше не нужна или её тег дискредитирован)"
                                    >
                                      Удалить группу
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* СПИСОК ДОСТУПНЫХ ГРУПП ПОЛЬЗОВАТЕЛЯ (ВСТУПЛЕНИЕ ПО ТЕГУ GO-... И ОДОБРЕННЫЕ АДМИНОМ ЗАКРЫТЫЕ ГРУППЫ GC-...) */}
                  <div className="space-y-4">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 px-1">
                      Список доступных групп (вступление в открытые GO-... по тегу и одобренные закрытые группы GC-...):
                    </div>

                    {groupSlots.map((slot, index) => {
                      const details = resolveGroupDetails(slot.tag);
                      const isClosedGroup =
                        details?.info.accessType === 'CLOSED' ||
                        slot.tag.trim().toUpperCase().startsWith('GC-');
                      const hasAccess = !isClosedGroup || slot.adminApproved;
                      const isShownOnMap =
                        activeGroupMapTag !== null &&
                        activeGroupMapTag.trim().toLowerCase() === slot.tag.trim().toLowerCase() &&
                        slot.tag.trim().length > 0;

                      return (
                        <div
                          key={slot.slotId}
                          className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                            isShownOnMap
                              ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                              : 'border-slate-800'
                          }`}
                        >
                          {/* Строка 1: Ввод уникального тега группы + кнопка Редактировать / Применить */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                Группа #{index + 1} (тег открытой группы GO-... или одобренной GC-...)
                              </label>
                              {details && (
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                                    isClosedGroup
                                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  }`}
                                >
                                  {isClosedGroup
                                    ? 'Закрытая группа GC- (вход через Поиск и одобрение админа)'
                                    : 'Открытая группа GO- (вход свободный по тегу)'}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                              <input
                                type="text"
                                value={slot.isEditing ? slot.tagDraft : slot.tag}
                                readOnly={!slot.isEditing}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGroupSlots((prev) =>
                                    prev.map((item) =>
                                      item.slotId === slot.slotId ? {...item, tagDraft: val} : item
                                    )
                                  );
                                }}
                                placeholder="Введите тег открытой группы (например, GO-45Hgd78 или GO-88Velo2)..."
                                className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm font-mono transition-colors focus:outline-none border ${
                                  slot.isEditing
                                    ? 'bg-slate-950 border-emerald-400 text-white ring-2 ring-emerald-400/20'
                                    : 'bg-slate-950/60 border-slate-800 text-emerald-300 cursor-default'
                                }`}
                              />

                              {/* Двухрежимная кнопка: Редактировать / Применить */}
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupSlots((prev) =>
                                    prev.map((item) => {
                                      if (item.slotId !== slot.slotId) return item;
                                      if (item.isEditing) {
                                        const nextTag = item.tagDraft.trim();
                                        const nextDetails = resolveGroupDetails(nextTag);
                                        const nextIsClosed =
                                          nextDetails?.info.accessType === 'CLOSED' ||
                                          nextTag.toUpperCase().startsWith('GC-');
                                        if (
                                          activeGroupMapTag &&
                                          activeGroupMapTag.toLowerCase() === item.tag.toLowerCase()
                                        ) {
                                          setActiveGroupMapTag(
                                            nextIsClosed ? null : nextTag || null
                                          );
                                        }
                                        // Если пользователь вручную вбил закрытую группу GC-..., она требует запроса через Поиск и одобрения админа в Chat!
                                        return {
                                          ...item,
                                          tag: nextTag,
                                          tagDraft: nextTag,
                                          isEditing: false,
                                          adminApproved: !nextIsClosed,
                                        };
                                      } else {
                                        return {
                                          ...item,
                                          tagDraft: item.tag,
                                          isEditing: true,
                                        };
                                      }
                                    })
                                  );
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[135px] text-center shrink-0 ${
                                  slot.isEditing
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                }`}
                              >
                                {slot.isEditing ? 'Применить' : 'Редактировать'}
                              </button>
                            </div>
                          </div>

                          {/* Если тег группы введен */}
                          {details ? (
                            <div className="space-y-3 pt-3 border-t border-slate-800">
                              {/* Если это закрытая группа GC-... и запрос ещё не принят админом через Поиск + Chat */}
                              {isClosedGroup && !slot.adminApproved ? (
                                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <span>
                                    Чтобы вступить в закрытую группу{' '}
                                    <strong className="font-mono text-white">
                                      {details.info.tag}
                                    </strong>
                                    , введите её тег в <strong>Поиск GoBell</strong> (поиск выдаст
                                    админа <strong>{details.info.adminName}</strong> вне зависимости от
                                    радиуса) и отправьте запрос с автоматической формулировкой{' '}
                                    <em>«Вступление в закрытую группу»</em>.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSearchSystemMode('TAG_SYSTEM');
                                      setSearchQuery(details.info.tag);
                                      setIsCabinetOpen(false);
                                      setIsFilterDropdownOpen(true);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shrink-0 shadow-md"
                                  >
                                    Ввести {details.info.tag} в Поиск
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Поле: Название группы и количество активных участников в радиусе поиска + Кнопка Показать на карте */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="space-y-1">
                                      <div className="text-xs text-slate-400">
                                        Название группы · Администратор: {details.info.adminName}
                                      </div>
                                      <div className="text-sm font-bold text-white">
                                        {details.info.name}{' '}
                                        <span className="font-mono text-xs text-emerald-300">
                                          (#{details.info.tag})
                                        </span>
                                      </div>
                                      <div className="text-xs font-mono text-emerald-400">
                                        Активных участников в радиусе ({formatDistance(radiusMeters)}):{' '}
                                        <strong className="text-sm">
                                          {details.activeMembersInRadius}
                                        </strong>
                                      </div>
                                    </div>

                                    {/* Кнопка Показать на карте (отключает все фильтры и показывает только участников группы) */}
                                    <button
                                      type="button"
                                      disabled={!hasAccess}
                                      onClick={() => {
                                        if (!hasAccess) return;
                                        if (isShownOnMap) {
                                          setActiveGroupMapTag(null);
                                        } else {
                                          setActiveGroupMapTag(details.info.tag);
                                        }
                                      }}
                                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 ${
                                        !hasAccess
                                          ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                                          : isShownOnMap
                                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                      }`}
                                    >
                                      <MapPin className="w-4 h-4" />
                                      <span>
                                        {isShownOnMap
                                          ? 'Показано на карте (все фильтры откл.)'
                                          : 'Показать на карте'}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Поле: Описание группы + Кнопка Групповой чат */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="space-y-1 flex-1">
                                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        Описание группы:
                                      </div>
                                      <p className="text-xs text-slate-200 leading-relaxed">
                                        {details.info.description}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={!hasAccess}
                                      onClick={() => {
                                        if (!hasAccess) return;
                                        handleOpenGroupChat(details.info);
                                      }}
                                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 ${
                                        !hasAccess
                                          ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-400 shadow-md'
                                      }`}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      <span>Групповой чат</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic pt-1">
                              Слот свободен. Введите тег открытой группы (например, GO-45Hgd78) или найдите закрытую группу (например, GC-91Tech7) через Поиск.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* СТРАНИЦА 3: ADVERT (В FREE: 1 слот, до 10 слов, пауза 24ч между показами; В PRO: без 24ч штрафа ожидания + Автопродление на срок или бессрочно + пакеты PRO=1 слот/10 слов, PRO+I=2 слота/15 слов, PRO+II=3 слота/20 слов, PRO+III=4 слота/25 слов) */}
              {cabinetTab === 'ADVERT' && (
                <div className="space-y-5">
                  {/* Шапка раздела Advert + выбор пакета PRO / PRO + I / PRO + II / PRO + III */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ADVERT · 24 ЧАСА
                        </span>
                        <h3 className="text-base font-bold text-white">
                          Страница Advert ·{' '}
                          {currentAccountTier === 'FREE'
                            ? 'Суточное объявление (FREE: 1 слот · до 10 слов · пауза 24ч)'
                            : currentAccountTier === 'PRO'
                            ? `Пакет ${PRO_PACKAGE_META[myProPackage].shortBadge} (${allowedAdvertSlotsCount} объявл. · до ${maxAdvertWordsForCurrentTier} слов · без 24ч ожидания · автопродление)`
                            : `BUSINESS (${allowedAdvertSlotsCount} объявл. · до ${maxAdvertWordsForCurrentTier} слов)`}
                        </h3>
                      </div>

                      {currentAccountTier === 'FREE' &&
                        myAdvertSlots[0]?.published && (
                          <button
                            type="button"
                            onClick={() =>
                              setMyAdvertSlots((prev) =>
                                prev.map((s) => (s.slotId === 1 ? {...s, published: null} : s))
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                            title="Сбросить таймер 24 часов для повторного тестирования"
                          >
                            Сбросить таймер 24ч (тест)
                          </button>
                        )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {currentAccountTier === 'FREE' ? (
                        <>
                          В режиме <strong>FREE</strong> доступно <strong>1 объявление</strong> (до{' '}
                          <strong>10 слов</strong>). Оно существует <strong>24 часа</strong> на карте
                          вне зависимости от активности профиля. После публикации или досрочной
                          остановки действует <strong>24-часовой штраф ожидания</strong> перед новым
                          запуском.
                        </>
                      ) : (
                        <>
                          Преимущества <strong>PRO</strong>: <strong>нет 24-часового штрафа ожидания</strong>{' '}
                          перед новым запуском + доступно <strong>автоматическое продление 24ч</strong>{' '}
                          (на указанный срок в днях или бессрочно, пока не отключите). Выберите пакет{' '}
                          <strong>PRO / PRO + I / PRO + II / PRO + III</strong> для увеличения числа
                          объявлений (1 → 2 → 3 → 4) и количества слов (10 → 15 → 20 → 25).
                        </>
                      )}
                    </p>

                    {/* Переключатель пакетов PRO / PRO + I / PRO + II / PRO + III прямо на вкладке Advert */}
                    {currentAccountTier === 'PRO' && (
                      <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {(
                          ['PRO', 'PRO_PLUS_1', 'PRO_PLUS_2', 'PRO_PLUS_3'] as ProPackageLevel[]
                        ).map((pkgKey) => {
                          const meta = PRO_PACKAGE_META[pkgKey];
                          const isSelected = myProPackage === pkgKey;
                          return (
                            <button
                              key={pkgKey}
                              type="button"
                              onClick={() => setMyProPackage(pkgKey)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-md'
                                  : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-500/50'
                              }`}
                            >
                              <div className="text-xs font-extrabold">{meta.shortBadge}</div>
                              <div
                                className={`text-[11px] mt-0.5 ${
                                  isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                Слотов: {meta.advertSlots} · До {meta.maxWords} слов
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* БЛОК БИРЖИ СЛОТОВ И СЧЁТЧИК ПОГАШЕНИЯ ПОДПИСКИ (ДЛЯ УРОВНЯ PRO / PRO+) */}
                  {currentAccountTier !== 'FREE' && (() => {
                    const activePoolSlots = myAdvertSlots
                      .slice(0, allowedAdvertSlotsCount)
                      .filter((s) => s.monetizeActive).length;
                    const withdrawingPoolSlots = myAdvertSlots
                      .slice(0, allowedAdvertSlotsCount)
                      .filter(
                        (s) => s.monetizeWithdrawingUntilMs && s.monetizeWithdrawingUntilMs > nowMs
                      ).length;
                    const subMonthlyCost =
                      currentAccountTier === 'PRO'
                        ? PRO_PACKAGE_META[myProPackage].monthlyPriceUsd
                        : 29;
                    const payoffPercent = Math.min(
                      100,
                      Math.round((mySubscriptionPayoffUsd / subMonthlyCost) * 100)
                    );

                    return (
                      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[11px] font-extrabold uppercase">
                                MONETIZE · БИРЖА СЛОТОВ
                              </span>
                              <span className="text-sm font-bold text-white">
                                Счётчик погашения подписки (начисления по факту из общего пула)
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Выставленные через <strong>Monetize: ВКЛ</strong> слоты попадают в общий
                              обезличенный пул Биржи (вместе с лимитом слов{' '}
                              <strong>{maxAdvertWordsForCurrentTier} слов/слот</strong>). Выручка от
                              фактических покупок <strong>BUSINESS</strong> делится на весь пул и
                              погашает стоимость вашей подписки. При нажатии{' '}
                              <strong>Monetize: ВЫКЛ</strong> действует{' '}
                              <strong>24-часовой буфер возврата</strong>, чтобы биржа заместила
                              уходящий слот.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              disabled={activePoolSlots === 0}
                              onClick={() => {
                                if (activePoolSlots === 0) return;
                                const wordWeight = maxAdvertWordsForCurrentTier / 10;
                                const factualPayout = Number(
                                  (activePoolSlots * wordWeight * 0.75).toFixed(2)
                                );
                                setMySubscriptionPayoffUsd((prev) =>
                                  Number((prev + factualPayout).toFixed(4))
                                );
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                                activePoolSlots > 0
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                              }`}
                              title="Смоделировать фактическую покупку слотов бизнесом на бирже и начисление вашей доли"
                            >
                              + Начислить по факту с Биржи (тест)
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[11px] text-slate-400 uppercase font-semibold">
                              Ваших слотов в пуле Биржи
                            </div>
                            <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                              {activePoolSlots} из {allowedAdvertSlotsCount}{' '}
                              <span className="text-xs text-slate-400 font-normal">
                                ({activePoolSlots * maxAdvertWordsForCurrentTier} слов в пуле)
                              </span>
                            </div>
                            {withdrawingPoolSlots > 0 && (
                              <div className="text-[11px] text-amber-300 mt-0.5">
                                В буфере возврата (24ч): {withdrawingPoolSlots}
                              </div>
                            )}
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[11px] text-slate-400 uppercase font-semibold">
                              Накоплено в счёт подписки
                            </div>
                            <div className="text-lg font-mono font-extrabold text-emerald-300 mt-0.5">
                              ${mySubscriptionPayoffUsd.toFixed(2)}{' '}
                              <span className="text-xs text-slate-400 font-normal">
                                / ${subMonthlyCost}.00 ({payoffPercent}%)
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Погашение тарифа:</span>
                              <span className="font-mono font-bold text-amber-300">
                                {payoffPercent}%
                              </span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{width: `${payoffPercent}%`}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* СЛОТЫ ОБЪЯВЛЕНИЙ (1 слот для FREE/PRO, 2 для PRO+I, 3 для PRO+II, 4 для PRO+III) */}
                  <div className="space-y-4">
                    {myAdvertSlots.slice(0, allowedAdvertSlotsCount).map((slot) => {
                      const pub = slot.published;
                      const remainingDisplayMs =
                        pub && !pub.stoppedEarly ? Math.max(0, pub.expiresAtMs - nowMs) : 0;
                      const isCurrentlyShowingOnMap =
                        Boolean(pub) && !pub?.stoppedEarly && remainingDisplayMs > 0;

                      const isMonetizeActive =
                        currentAccountTier !== 'FREE' && Boolean(slot.monetizeActive);
                      const remainingMonetizeCycleMs =
                        isMonetizeActive && slot.monetizeExpiresAtMs
                          ? Math.max(0, slot.monetizeExpiresAtMs - nowMs)
                          : 0;
                      const remainingWithdrawBufferMs =
                        currentAccountTier !== 'FREE' &&
                        slot.monetizeWithdrawingUntilMs &&
                        slot.monetizeWithdrawingUntilMs > nowMs
                          ? Math.max(0, slot.monetizeWithdrawingUntilMs - nowMs)
                          : 0;
                      const isWithdrawingFromExchange = remainingWithdrawBufferMs > 0;
                      const isLockedByExchange = isMonetizeActive || isWithdrawingFromExchange;

                      // В FREE действует 24ч ожидание от момента прошлой публикации; в PRO и BUSINESS 24ч ожидания НЕТ!
                      const nextAllowedPublishMs =
                        currentAccountTier === 'FREE' && pub
                          ? Math.max(0, pub.publishedAtMs + TWENTY_FOUR_HOURS_MS - nowMs)
                          : 0;

                      const canPublishThisSlot =
                        !isCurrentlyShowingOnMap &&
                        !isLockedByExchange &&
                        nextAllowedPublishMs === 0;
                      const wordCount = countWords(slot.draftText);
                      const slotTags = extractWordTags(
                        limitWords(slot.draftText, maxAdvertWordsForCurrentTier)
                      );

                      const targetPosition =
                        slot.placementMode === 'NATIVE' ? userPhysicalGeo : searchCenter;

                      return (
                        <div
                          key={slot.slotId}
                          className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition-all ${
                            isMonetizeActive
                              ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                              : isWithdrawingFromExchange
                              ? 'border-amber-500/60'
                              : 'border-slate-800'
                          }`}
                        >
                          {/* Заголовок слота + Кнопка Monetize: ВКЛ / ВЫКЛ + Таймеры */}
                          <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-extrabold">
                                Объявление #{slot.slotId}
                              </span>
                              <span className="text-xs text-slate-300 font-semibold">
                                Лимит текста: до{' '}
                                <strong className="text-amber-300">
                                  {maxAdvertWordsForCurrentTier} слов
                                </strong>
                              </span>
                              {currentAccountTier !== 'FREE' && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                                  PRO: Без 24ч штрафа ожидания
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                              {/* КНОПКА MONETIZE : ВКЛ / ВЫКЛ (С 24-ЧАСОВЫМ БУФЕРОМ ВОЗВРАТА С БИРЖИ) */}
                              {currentAccountTier !== 'FREE' && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isCurrentlyShowingOnMap || isWithdrawingFromExchange}
                                    onClick={() => {
                                      if (isCurrentlyShowingOnMap || isWithdrawingFromExchange)
                                        return;
                                      const now = Date.now();
                                      setNowMs(now);
                                      setMyAdvertSlots((prev) =>
                                        prev.map((s) => {
                                          if (s.slotId !== slot.slotId) return s;
                                          if (s.monetizeActive) {
                                            // Выключение Monetize -> запускается 24-часовой буфер возврата слота с биржи
                                            return {
                                              ...s,
                                              monetizeActive: false,
                                              monetizeExpiresAtMs: null,
                                              monetizeUntilMs: null,
                                              monetizeWithdrawingUntilMs:
                                                now + TWENTY_FOUR_HOURS_MS,
                                            };
                                          } else {
                                            // Включение Monetize -> слот уходит в пул биржи по установленному в слоте таймингу
                                            const untilMs =
                                              s.autoRenewMode === 'DAYS'
                                                ? now + s.autoRenewDays * TWENTY_FOUR_HOURS_MS
                                                : null;
                                            return {
                                              ...s,
                                              isEditing: false,
                                              monetizeActive: true,
                                              monetizeStartedAtMs: now,
                                              monetizeExpiresAtMs: now + TWENTY_FOUR_HOURS_MS,
                                              monetizeUntilMs: untilMs,
                                              monetizeWithdrawingUntilMs: null,
                                            };
                                          }
                                        })
                                      );
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                                      isMonetizeActive
                                        ? 'bg-emerald-500 hover:bg-rose-600 text-slate-950 hover:text-white border-emerald-400 shadow-md'
                                        : isWithdrawingFromExchange
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-not-allowed'
                                        : isCurrentlyShowingOnMap
                                        ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                                        : 'bg-slate-950 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border-emerald-500/50'
                                    }`}
                                    title={
                                      isCurrentlyShowingOnMap
                                        ? 'Сначала остановите показ личного объявления, чтобы передать слот на Биржу'
                                        : isWithdrawingFromExchange
                                        ? 'Идёт 24-часовой буфер возврата слота с Биржи'
                                        : 'Передать слот в обезличенный пул Биржи для погашения подписки'
                                    }
                                  >
                                    <span>
                                      Monetize: {isMonetizeActive ? 'ВКЛ' : 'ВЫКЛ'}
                                    </span>
                                  </button>

                                  {isWithdrawingFromExchange && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMyAdvertSlots((prev) =>
                                          prev.map((s) =>
                                            s.slotId === slot.slotId
                                              ? {...s, monetizeWithdrawingUntilMs: null}
                                              : s
                                          )
                                        )
                                      }
                                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-[10px] font-sans font-semibold"
                                      title="Досрочно завершить 24ч буфер возврата слота для тестирования"
                                    >
                                      Сбросить 24ч буфер (тест)
                                    </button>
                                  )}
                                </div>
                              )}

                              <span
                                className={`px-2.5 py-1 rounded-lg border font-bold ${
                                  isCurrentlyShowingOnMap || isMonetizeActive
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : isWithdrawingFromExchange
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                {isMonetizeActive
                                  ? `На Бирже (24ч): ${formatDurationHMS(remainingMonetizeCycleMs)}`
                                  : isWithdrawingFromExchange
                                  ? `Возврат с Биржи: ${formatDurationHMS(
                                      remainingWithdrawBufferMs
                                    )}`
                                  : `Цикл 24ч: ${formatDurationHMS(remainingDisplayMs)}`}
                              </span>
                              {currentAccountTier === 'FREE' && (
                                <span
                                  className={`px-2.5 py-1 rounded-lg border font-bold ${
                                    nextAllowedPublishMs > 0
                                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                      : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                  }`}
                                >
                                  Пауза 24ч: {formatDurationHMS(nextAllowedPublishMs)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Плашка статуса Monetize / 24ч буфера возврата */}
                          {isMonetizeActive && (
                            <div className="p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3 flex-wrap">
                              <span>
                                <strong>Monetize: ВКЛ</strong> — Слот #{slot.slotId} (ёмкость:{' '}
                                <strong>{maxAdvertWordsForCurrentTier} слов</strong>) работает в
                                общем пуле Биржи и начисляет доход в счёт погашения вашей подписки
                                по факту.
                              </span>
                              <span className="font-mono text-[11px] text-emerald-300 font-bold">
                                Режим срока:{' '}
                                {slot.autoRenewMode === 'OFF'
                                  ? '24 часа'
                                  : slot.autoRenewMode === 'DAYS'
                                  ? `${slot.autoRenewDays} дн.`
                                  : 'Бессрочно'}
                              </span>
                            </div>
                          )}

                          {isWithdrawingFromExchange && (
                            <div className="p-3 rounded-xl bg-amber-950/35 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-3 flex-wrap">
                              <span>
                                <strong>Буфер возврата с Биржи (24 часа):</strong> слот выводится из
                                пула. Ожидание 24ч необходимо, чтобы Биржа компенсировала ушедший
                                слот и объём слов для активных кампаний BUSINESS.
                              </span>
                              <span className="font-mono text-xs font-extrabold text-amber-300">
                                До разблокировки: {formatDurationHMS(remainingWithdrawBufferMs)}
                              </span>
                            </div>
                          )}

                          {/* ВЫБОР СТАТУСА ТОЧКИ ПОДАЧИ: МЕСТНЫЙ (Зелёная иконка AD) или ГОСТЬ (Оранжевая иконка AD) */}
                          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-xs font-bold text-slate-200">
                                Статус и точка размещения объявления #{slot.slotId}:
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                Координаты:{' '}
                                <strong className="text-sky-300">
                                  {targetPosition.lat.toFixed(4)}, {targetPosition.lng.toFixed(4)}
                                </strong>{' '}
                                (
                                {slot.placementMode === 'NATIVE'
                                  ? 'ваша фактическая геопозиция — зелёный значок AD'
                                  : 'центр радиуса поиска на карте — оранжевый значок AD'}
                                )
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isCurrentlyShowingOnMap}
                                onClick={() =>
                                  setMyAdvertSlots((prev) =>
                                    prev.map((s) =>
                                      s.slotId === slot.slotId
                                        ? {...s, placementMode: 'NATIVE'}
                                        : s
                                    )
                                  )
                                }
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                  slot.placementMode === 'NATIVE'
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                } ${isCurrentlyShowingOnMap ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                Местный (Гео)
                              </button>
                              <button
                                type="button"
                                disabled={isCurrentlyShowingOnMap}
                                onClick={() =>
                                  setMyAdvertSlots((prev) =>
                                    prev.map((s) =>
                                      s.slotId === slot.slotId
                                        ? {...s, placementMode: 'GUEST'}
                                        : s
                                    )
                                  )
                                }
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                                  slot.placementMode === 'GUEST'
                                    ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                } ${isCurrentlyShowingOnMap ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                Гость (Центр круга)
                              </button>
                            </div>
                          </div>

                          {/* НАСТРОЙКА АВТОПРОДЛЕНИЯ 24Ч (ПЛЮШКА УРОВНЯ PRO / BUSINESS: Выкл / На срок в днях / Бессрочно пока не отключит) */}
                          {currentAccountTier !== 'FREE' && (
                            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-amber-300">
                                  Автоматическое продление 24ч (привилегия PRO):
                                </div>
                                <div className="text-[11px] text-slate-300">
                                  {slot.autoRenewMode === 'OFF'
                                    ? 'Обычный показ на 24 часа без автопродления'
                                    : slot.autoRenewMode === 'DAYS'
                                    ? `Автоматическое продление каждые 24 часа на срок: ${slot.autoRenewDays} дн.`
                                    : 'Бессрочное автопродление каждые 24 часа, пока вы сами не отключите'}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMyAdvertSlots((prev) =>
                                      prev.map((s) =>
                                        s.slotId === slot.slotId
                                          ? {
                                              ...s,
                                              autoRenewMode: 'OFF',
                                              published: s.published
                                                ? {...s.published, autoRenewMode: 'OFF'}
                                                : null,
                                            }
                                          : s
                                      )
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    slot.autoRenewMode === 'OFF'
                                      ? 'bg-slate-200 text-slate-950 border-white'
                                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  Выкл (24ч)
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setMyAdvertSlots((prev) =>
                                      prev.map((s) =>
                                        s.slotId === slot.slotId
                                          ? {
                                              ...s,
                                              autoRenewMode: 'DAYS',
                                              published: s.published
                                                ? {
                                                    ...s.published,
                                                    autoRenewMode: 'DAYS',
                                                    autoRenewDays: s.autoRenewDays,
                                                    autoRenewUntilMs:
                                                      s.published.publishedAtMs +
                                                      s.autoRenewDays * TWENTY_FOUR_HOURS_MS,
                                                  }
                                                : null,
                                            }
                                          : s
                                      )
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    slot.autoRenewMode === 'DAYS'
                                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  На срок (дней)
                                </button>

                                {slot.autoRenewMode === 'DAYS' && (
                                  <div className="flex items-center gap-1 bg-slate-950 border border-amber-400/50 rounded-xl px-2 py-1">
                                    <input
                                      type="number"
                                      min={1}
                                      max={365}
                                      value={slot.autoRenewDays}
                                      onChange={(e) => {
                                        const days = Math.max(
                                          1,
                                          Math.min(365, Number(e.target.value) || 1)
                                        );
                                        setMyAdvertSlots((prev) =>
                                          prev.map((s) =>
                                            s.slotId === slot.slotId
                                              ? {
                                                  ...s,
                                                  autoRenewDays: days,
                                                  published: s.published
                                                    ? {
                                                        ...s.published,
                                                        autoRenewDays: days,
                                                        autoRenewUntilMs:
                                                          s.published.publishedAtMs +
                                                          days * TWENTY_FOUR_HOURS_MS,
                                                      }
                                                    : null,
                                                }
                                              : s
                                          )
                                        );
                                      }}
                                      className="w-12 bg-transparent text-xs font-mono font-bold text-amber-300 focus:outline-none text-center"
                                    />
                                    <span className="text-[11px] text-slate-400">дн.</span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setMyAdvertSlots((prev) =>
                                      prev.map((s) =>
                                        s.slotId === slot.slotId
                                          ? {
                                              ...s,
                                              autoRenewMode: 'INFINITE',
                                              published: s.published
                                                ? {
                                                    ...s.published,
                                                    autoRenewMode: 'INFINITE',
                                                    autoRenewUntilMs: null,
                                                  }
                                                : null,
                                            }
                                          : s
                                      )
                                    )
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    slot.autoRenewMode === 'INFINITE'
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  Бессрочно (пока не отключит)
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Поле ввода текста объявления + кнопка Редактировать/Применить (блокируется на время показа) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <label className="block text-xs font-semibold text-slate-300">
                                Текст объявления #{slot.slotId} (все слова становятся поисковыми
                                тегами):
                              </label>
                              <span
                                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                                  wordCount >= maxAdvertWordsForCurrentTier
                                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                                    : 'bg-slate-950 border-slate-800 text-sky-400'
                                }`}
                              >
                                Слов: {wordCount} / {maxAdvertWordsForCurrentTier}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5">
                              <textarea
                                rows={2}
                                readOnly={
                                  isCurrentlyShowingOnMap || isLockedByExchange || !slot.isEditing
                                }
                                value={slot.draftText}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  const words = rawVal.trim().split(/\s+/).filter(Boolean);
                                  const nextText =
                                    words.length <= maxAdvertWordsForCurrentTier
                                      ? rawVal
                                      : limitWords(rawVal, maxAdvertWordsForCurrentTier);
                                  setMyAdvertSlots((prev) =>
                                    prev.map((s) =>
                                      s.slotId === slot.slotId ? {...s, draftText: nextText} : s
                                    )
                                  );
                                  if (slot.slotId === 1) {
                                    setMyAdvertDraftText(nextText);
                                  }
                                }}
                                placeholder={`Введите текст объявления #${slot.slotId} (до ${maxAdvertWordsForCurrentTier} слов)...`}
                                className={`flex-1 rounded-xl p-3 text-sm transition-colors focus:outline-none border ${
                                  isCurrentlyShowingOnMap || isLockedByExchange
                                    ? 'bg-slate-950/40 border-slate-800 text-slate-400 cursor-not-allowed'
                                    : slot.isEditing
                                    ? 'bg-slate-950 border-amber-400 text-white ring-2 ring-amber-400/20'
                                    : 'bg-slate-950/70 border-slate-800 text-slate-200'
                                }`}
                              />

                              <button
                                type="button"
                                disabled={isCurrentlyShowingOnMap || isLockedByExchange}
                                onClick={() =>
                                  setMyAdvertSlots((prev) =>
                                    prev.map((s) =>
                                      s.slotId === slot.slotId
                                        ? {
                                            ...s,
                                            draftText: limitWords(
                                              s.draftText.trim(),
                                              maxAdvertWordsForCurrentTier
                                            ),
                                            isEditing: !s.isEditing,
                                          }
                                        : s
                                    )
                                  )
                                }
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all min-w-[135px] text-center shrink-0 ${
                                  isCurrentlyShowingOnMap || isLockedByExchange
                                    ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                                    : slot.isEditing
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                }`}
                              >
                                {isCurrentlyShowingOnMap
                                  ? 'Идёт показ'
                                  : isMonetizeActive
                                  ? 'На Бирже'
                                  : isWithdrawingFromExchange
                                  ? 'Буфер 24ч'
                                  : slot.isEditing
                                  ? 'Применить'
                                  : 'Редактировать'}
                              </button>
                            </div>
                          </div>

                          {/* Поисковые теги объявления */}
                          {slotTags.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {slotTags.map((t) => (
                                <span
                                  key={t.normalized}
                                  className={`px-2.5 py-1 rounded-lg text-xs border ${
                                    slot.placementMode === 'NATIVE'
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                                      : 'bg-orange-500/15 border-orange-500/40 text-orange-200'
                                  }`}
                                >
                                  #{t.word}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Кнопка Включить показ / Остановить показ */}
                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                            <div className="text-xs text-slate-400">
                              {isCurrentlyShowingOnMap ? (
                                <span className="text-emerald-300 font-semibold">
                                  Объявление #{slot.slotId} активно на карте (
                                  {pub?.status === 'NATIVE' ? 'Местный' : 'Гость'})
                                  {pub?.autoRenewMode === 'INFINITE'
                                    ? ' · Автопродление: бессрочно'
                                    : pub?.autoRenewMode === 'DAYS' && pub?.autoRenewUntilMs
                                    ? ` · Автопродление до: ${formatBanDurationDaysHMS(
                                        Math.max(0, pub.autoRenewUntilMs - nowMs)
                                      )}`
                                    : ''}
                                </span>
                              ) : isMonetizeActive ? (
                                <span className="text-emerald-300 font-semibold">
                                  Слот передан в пул Биржи (Monetize: ВКЛ) · личная публикация отключена
                                </span>
                              ) : isWithdrawingFromExchange ? (
                                <span className="text-amber-300 font-semibold">
                                  Возврат слота с Биржи (осталось{' '}
                                  {formatDurationHMS(remainingWithdrawBufferMs)})
                                </span>
                              ) : canPublishThisSlot ? (
                                <span>
                                  Готово к запуску ({slot.placementMode === 'NATIVE' ? 'Местный' : 'Гость'})
                                </span>
                              ) : (
                                <span className="text-amber-300">
                                  В режиме FREE повторный запуск доступен через{' '}
                                  {formatDurationHMS(nextAllowedPublishMs)}
                                </span>
                              )}
                            </div>

                            {isCurrentlyShowingOnMap ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setMyAdvertSlots((prev) =>
                                    prev.map((s) =>
                                      s.slotId === slot.slotId && s.published
                                        ? {
                                            ...s,
                                            published: {
                                              ...s.published,
                                              stoppedEarly: true,
                                            },
                                          }
                                        : s
                                    )
                                  )
                                }
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-colors"
                              >
                                Остановить показ
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!canPublishThisSlot || !slot.draftText.trim()}
                                onClick={() => {
                                  if (!canPublishThisSlot || !slot.draftText.trim()) return;
                                  const now = Date.now();
                                  setNowMs(now);
                                  const cleanText = limitWords(
                                    slot.draftText.trim(),
                                    maxAdvertWordsForCurrentTier
                                  );
                                  const pos =
                                    slot.placementMode === 'NATIVE'
                                      ? {...userPhysicalGeo}
                                      : {...searchCenter};
                                  const effectiveAutoRenew: AdvertAutoRenewMode =
                                    currentAccountTier === 'FREE' ? 'OFF' : slot.autoRenewMode;
                                  const autoUntil =
                                    effectiveAutoRenew === 'DAYS'
                                      ? now + slot.autoRenewDays * TWENTY_FOUR_HOURS_MS
                                      : null;

                                  setMyAdvertSlots((prev) =>
                                    prev.map((s) =>
                                      s.slotId === slot.slotId
                                        ? {
                                            ...s,
                                            draftText: cleanText,
                                            isEditing: false,
                                            published: {
                                              text: cleanText,
                                              publishedAtMs: now,
                                              expiresAtMs: now + TWENTY_FOUR_HOURS_MS,
                                              stoppedEarly: false,
                                              position: pos,
                                              status: slot.placementMode,
                                              autoRenewMode: effectiveAutoRenew,
                                              autoRenewDays: slot.autoRenewDays,
                                              autoRenewUntilMs: autoUntil,
                                            },
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
                                  !canPublishThisSlot || !slot.draftText.trim()
                                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                    : slot.placementMode === 'NATIVE'
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-lg'
                                    : 'bg-orange-500 hover:bg-orange-400 text-slate-950 border-orange-400 shadow-lg'
                                }`}
                              >
                                Опубликовать #{slot.slotId} (
                                {slot.placementMode === 'NATIVE' ? 'Местный' : 'Гость'})
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* СТРАНИЦА 4: SOS (Ограничение показа сигнала SOS — 1 час) */}
              {cabinetTab === 'SOS' && (() => {
                const remainingSosMs =
                  mySosActive && mySosExpiresAtMs
                    ? Math.max(0, mySosExpiresAtMs - nowMs)
                    : 0;
                const isSosCurrentlyShowing = mySosActive && remainingSosMs > 0;

                return (
                  <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                            SOS · ЛИМИТ 1 ЧАС
                          </span>
                          <span className="text-xs font-mono text-rose-300">
                            Ограничение показа сигнала SOS: 1 час
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          Страница SOS · Экстренный вызов помощи на карте
                        </h3>
                        <p className="text-xs text-slate-400">
                          Опишите, какая помощь нужна. Все слова сообщения станут активными SOS-тегами ровно на 1 час.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          className={`px-3.5 py-2 rounded-xl border font-mono text-sm font-bold ${
                            isSosCurrentlyShowing
                              ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          Осталось: {formatDurationHMS(remainingSosMs)}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isSosCurrentlyShowing) {
                              setMySosActive(false);
                              setMySosExpiresAtMs(null);
                            } else {
                              const now = Date.now();
                              setNowMs(now);
                              setMySosActive(true);
                              setMySosExpiresAtMs(now + ONE_HOUR_SOS_MS);
                              setProfileDescription(mySosText);
                              setProfileDescriptionDraft(mySosText);
                              setShowProfileDescription(true);
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            isSosCurrentlyShowing
                              ? 'bg-rose-600 text-white border-rose-400 shadow-lg'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-rose-500'
                          }`}
                        >
                          {isSosCurrentlyShowing
                            ? 'SOS СИГНАЛ ВКЛЮЧЕН (Выключить)'
                            : 'Включить сигнал SOS на 1 час'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Текст экстренного сообщения SOS
                      </label>
                      <textarea
                        rows={3}
                        value={mySosText}
                        onChange={(e) => setMySosText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800">
                      {extractWordTags(mySosText).map((t) => (
                        <span
                          key={t.normalized}
                          className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/20 border border-rose-500/40 text-rose-200"
                        >
                          #{t.word}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* СТРАНИЦА CHAT: ЗАЩИТА ПОЛЬЗОВАТЕЛЯ ЧЕРЕЗ ПОДТВЕРЖДЕНИЕ ЗАПРОСА НА КОНТАКТ + РЕЖИМЫ ЧАТА (ТЕКСТОВЫЙ / ГОЛОСОВОЙ / ВИДЕО) */}
              {cabinetTab === 'CHAT' && (
                <div className="space-y-6">
                  {/* Шапка защиты контактов и кнопка тестового создания запроса через форму */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Защита контактов GoBell</span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Страница Chat · Запросы на контакт и защищённая связь
                      </h3>
                      <p className="text-xs text-slate-400">
                        Контакт возможен только после подтверждения запроса с сопроводительной запиской. При завершении чата вся история полностью сбрасывается.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenContactRequestForm({
                          id: `demo-${Date.now()}`,
                          authorName: 'Дмитрий · Коворкинг и IT',
                          category: 'BUSINESS',
                        })
                      }
                      className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-sky-500/40 text-xs font-bold transition-colors shrink-0"
                    >
                      + Форма запроса на контакт
                    </button>
                  </div>

                  {/* Уведомление системы о принятии / отклонении / сбросе чата */}
                  {chatSystemNotice && (
                    <div
                      className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                        chatSystemNotice.type === 'rejected'
                          ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                          : chatSystemNotice.type === 'accepted'
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                          : 'bg-sky-950/60 border-sky-500/50 text-sky-200'
                      }`}
                    >
                      <span>{chatSystemNotice.text}</span>
                      <button
                        type="button"
                        onClick={() => setChatSystemNotice(null)}
                        className="p-1 text-slate-400 hover:text-white shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* БЛОК 1: ВХОДЯЩИЕ ЗАПРОСЫ НА КОНТАКТ С СОПРОВОДИТЕЛЬНОЙ ЗАПИСКОЙ (КНОПКИ ПРИНЯТЬ И ОТКЛОНИТЬ) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">
                        Входящие запросы на контакт ({contactRequests.length})
                      </h4>
                      <span className="text-xs text-slate-400">
                        Требуется ваше подтверждение
                      </span>
                    </div>

                    {contactRequests.length === 0 ? (
                      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-400">
                        Новых запросов на контакт пока нет. Вы можете отправить запрос любому пользователю на карте (или нажать «+ Форма запроса на контакт» выше).
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contactRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {req.senderCategory && (
                                  <span
                                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
                                    style={{
                                      backgroundColor: CATEGORY_META[req.senderCategory].pinColor,
                                    }}
                                  >
                                    {req.senderCategory}
                                  </span>
                                )}
                                <span className="text-sm font-bold text-white">
                                  {req.senderName}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">{req.createdAt}</span>
                            </div>

                            {/* Сопроводительная записка, поясняющая необходимость контакта */}
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Сопроводительная записка:
                              </div>
                              {req.note}
                            </div>

                            {/* Две кнопки под сообщением: Принять и Отклонить */}
                            <div className="flex items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleAcceptContactRequest(req)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-4 h-4" />
                                <span>Принять</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeclineContactRequest(req)}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <X className="w-4 h-4" />
                                <span>Отклонить</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* БЛОК 2: АКТИВНОЕ ОКНО ЧАТА (ПОЯВЛЯЕТСЯ ТОЛЬКО ПОСЛЕ ПРИНЯТИЯ ЗАПРОСА) */}
                  {activeChatSession ? (
                    <div className="bg-slate-900 border border-sky-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      {/* Шапка окна чата: собеседник, переключатели режимов (Текстовый по умолчанию, Голосовой, Видео) и кнопка Завершить чат */}
                      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <div>
                            <div className="text-sm font-bold text-white">
                              {activeChatSession.partnerName}
                            </div>
                            <div className="text-[11px] text-emerald-400">
                              Контакт подтверждён · Сессия защищена
                            </div>
                          </div>
                        </div>

                        {/* Переключение режимов чата: Текстовый (по умолчанию) / Голосовой / Видео + Завершить чат */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Текстовый режим (по умолчанию) */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveChatSession((prev) =>
                                prev ? {...prev, mode: 'TEXT'} : null
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              activeChatSession.mode === 'TEXT'
                                ? 'bg-sky-500 text-slate-950 border-sky-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Текстовый</span>
                          </button>

                          {/* Голосовой режим */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveChatSession((prev) =>
                                prev ? {...prev, mode: 'VOICE'} : null
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              activeChatSession.mode === 'VOICE'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Голосовой</span>
                          </button>

                          {/* Видео режим */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveChatSession((prev) =>
                                prev ? {...prev, mode: 'VIDEO'} : null
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              activeChatSession.mode === 'VIDEO'
                                ? 'bg-indigo-500 text-white border-indigo-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Видео</span>
                          </button>

                          {/* Кнопка Завершить чат (сбрасывает всю информацию чата) */}
                          <button
                            type="button"
                            onClick={handleEndChatSession}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs border border-rose-500 transition-colors flex items-center gap-1.5 ml-auto sm:ml-2 shadow-sm"
                          >
                            <PhoneOff className="w-3.5 h-3.5" />
                            <span>Завершить чат</span>
                          </button>
                        </div>
                      </div>

                      {/* Панель Голосового или Видео режима, если они включены */}
                      {activeChatSession.mode === 'VOICE' && (
                        <div className="p-6 bg-emerald-950/30 border-b border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 animate-pulse">
                            <Phone className="w-6 h-6" />
                          </div>
                          <div className="text-sm font-bold text-white">
                            Активен голосовой режим с «{activeChatSession.partnerName}»
                          </div>
                          <div className="text-xs text-emerald-300">
                            Микрофон включён · Защищённый аудиоканал
                          </div>
                        </div>
                      )}

                      {activeChatSession.mode === 'VIDEO' && (
                        <div className="p-6 bg-indigo-950/40 border-b border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-3">
                          <div className="w-full max-w-md h-44 rounded-xl bg-slate-950 border border-indigo-500/40 flex flex-col items-center justify-center relative overflow-hidden">
                            <Video className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
                            <span className="text-xs font-semibold text-slate-200">
                              Видеопоток: {activeChatSession.partnerName}
                            </span>
                            <div className="absolute bottom-2.5 right-2.5 w-24 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                              Ваша камера
                            </div>
                          </div>
                        </div>
                      )}

                       {/* Список сообщений чата */}
                      <div className="p-4 space-y-3 max-h-72 overflow-y-auto bg-slate-900/60">
                        {activeChatSession.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              msg.sender === 'me' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                msg.sender === 'me'
                                  ? 'bg-sky-500 text-slate-950 font-semibold'
                                  : 'bg-slate-950 border border-slate-800 text-slate-200'
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 px-1">
                              {msg.sender === 'me' ? 'Вы' : activeChatSession.partnerName} ·{' '}
                              {msg.time}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* БЛОК КАРМЫ В ЛИЧНОМ И ГРУППОВОМ ЧАТЕ: РАЗБЛОКИРУЕТСЯ ПОСЛЕ НЕ МЕНЕЕ 3 СООБЩЕНИЙ С КАЖДОЙ СТОРОНЫ И НЕ ЧАЩЕ 1 РАЗА В МЕСЯЦ МЕЖДУ ОДНОЙ ПАРОЙ ПОЛЬЗОВАТЕЛЕЙ */}
                      {(() => {
                        const myMsgCount = activeChatSession.messages.filter(
                          (m) => m.sender === 'me'
                        ).length;
                        const partnerMsgCount = activeChatSession.messages.filter(
                          (m) => m.sender === 'partner'
                        ).length;
                        const canRateKarma = myMsgCount >= 3 && partnerMsgCount >= 3;

                        const canonicalPartnerId = normalizeKarmaUserId(
                          activeChatSession.partnerId
                        );
                        const myToPartnerKey = `${activeDemoProfileId}->${canonicalPartnerId}`;
                        const partnerToMeKey = `${canonicalPartnerId}->${activeDemoProfileId}`;

                        const myToPartnerLastMs = karmaPairLastRatedMs[myToPartnerKey] ?? 0;
                        const partnerToMeLastMs = karmaPairLastRatedMs[partnerToMeKey] ?? 0;

                        const myToPartnerCooldownRemainingMs =
                          myToPartnerLastMs > 0
                            ? Math.max(
                                0,
                                myToPartnerLastMs + ONE_MONTH_KARMA_COOLDOWN_MS - nowMs
                              )
                            : 0;
                        const partnerToMeCooldownRemainingMs =
                          partnerToMeLastMs > 0
                            ? Math.max(
                                0,
                                partnerToMeLastMs + ONE_MONTH_KARMA_COOLDOWN_MS - nowMs
                              )
                            : 0;

                        return (
                          <div className="px-4 py-3 bg-slate-950/90 border-t border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-amber-300">
                                  Система Кармы (не чаще 1 раза в месяц для одной пары):
                                </span>
                                <span className="text-slate-300 font-mono text-[11px]">
                                  Ваши сообщения:{' '}
                                  <strong
                                    className={
                                      myMsgCount >= 3 ? 'text-emerald-400' : 'text-sky-300'
                                    }
                                  >
                                    {myMsgCount}/3
                                  </strong>{' '}
                                  · Сообщения собеседника:{' '}
                                  <strong
                                    className={
                                      partnerMsgCount >= 3 ? 'text-emerald-400' : 'text-sky-300'
                                    }
                                  >
                                    {partnerMsgCount}/3
                                  </strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {(myToPartnerCooldownRemainingMs > 0 ||
                                  partnerToMeCooldownRemainingMs > 0) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setKarmaPairLastRatedMs((prev) => {
                                        const next = {...prev};
                                        delete next[myToPartnerKey];
                                        delete next[partnerToMeKey];
                                        return next;
                                      });
                                      setActiveChatSession((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              myRatedPartner: null,
                                              partnerRatedMe: null,
                                            }
                                          : null
                                      );
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors"
                                    title="Сбросить месячный таймер между этой парой пользователей для тестирования"
                                  >
                                    Сбросить лимит 1 мес. (тест)
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={handleSimulatePartnerMessage}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-semibold transition-colors"
                                >
                                  + Ответ от собеседника ({partnerMsgCount}/3)
                                </button>
                              </div>
                            </div>

                            {!canRateKarma ? (
                              <div className="text-[11px] text-slate-400">
                                Для появления кнопок оценки кармы <strong>+1 (Положительно)</strong> /{' '}
                                <strong>-1 (Отрицательно)</strong> необходимо не менее{' '}
                                <strong>3 сообщений с каждой стороны</strong> (один пользователь может оценивать другого не чаще <strong>1 раза в месяц</strong>).
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* Оценить собеседника */}
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                                  <div className="text-xs">
                                    <div className="font-bold text-white">
                                      Оценить «{activeChatSession.partnerName}»
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      Карма собеседника:{' '}
                                      <strong className="text-emerald-300 font-mono">
                                        +{activeChatSession.partnerKarmaPlus ?? 0}
                                      </strong>{' '}
                                      /{' '}
                                      <strong className="text-rose-300 font-mono">
                                        -{activeChatSession.partnerKarmaMinus ?? 0}
                                      </strong>
                                    </div>
                                  </div>

                                  {myToPartnerCooldownRemainingMs > 0 ? (
                                    <div className="text-right">
                                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950 border border-slate-700 text-amber-300 font-mono">
                                        Лимит 1 мес.:{' '}
                                        {formatBanDurationDaysHMS(myToPartnerCooldownRemainingMs)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleRatePartnerKarma(1)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-colors"
                                      >
                                        +1 (Положительно)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRatePartnerKarma(-1)}
                                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors"
                                      >
                                        -1 (Отрицательно)
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Оценка вас со стороны собеседника */}
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                                  <div className="text-xs">
                                    <div className="font-bold text-white">
                                      Оценка вашей кармы собеседником
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      Ваша карма:{' '}
                                      <strong className="text-emerald-300 font-mono">
                                        +{myKarmaPlus}
                                      </strong>{' '}
                                      /{' '}
                                      <strong className="text-rose-300 font-mono">
                                        -{myKarmaMinus}
                                      </strong>{' '}
                                      · Минусов подряд:{' '}
                                      <strong className="text-rose-300 font-mono">
                                        {myConsecutiveMinuses}/3
                                      </strong>
                                    </div>
                                  </div>

                                  {partnerToMeCooldownRemainingMs > 0 ? (
                                    <div className="text-right">
                                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950 border border-slate-700 text-amber-300 font-mono">
                                        Лимит 1 мес.:{' '}
                                        {formatBanDurationDaysHMS(partnerToMeCooldownRemainingMs)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handlePartnerRateMyKarma(1)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 font-extrabold text-xs transition-colors"
                                      >
                                        +1 (Положительно)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handlePartnerRateMyKarma(-1)}
                                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 font-extrabold text-xs transition-colors"
                                      >
                                        -1 (Отрицательно)
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Форма отправки сообщения в чате */}
                      <form
                        onSubmit={handleSendChatMessage}
                        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={chatMessageInput}
                          onChange={(e) => setChatMessageInput(e.target.value)}
                          placeholder="Напишите сообщение..."
                          className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Отправить</span>
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                      <MessageSquare className="w-6 h-6 text-slate-500 mx-auto" />
                      <div className="text-sm font-bold text-slate-200">
                        Окно активного чата пусто
                      </div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Нажмите кнопку «Принять» под входящим запросом на контакт выше, чтобы подтвердить запрос и открыть чат с пользователем.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* СТРАНИЦА 5: SETTINGS (ШЕСТЕРЁНКА) + РАЗДЕЛ «О НАС» СО СПИСКОМ ДОКУМЕНТОВ */}
              {cabinetTab === 'SETTINGS' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-5 h-5 text-sky-400" />
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {settingsAboutUsView === 'NONE'
                            ? 'Страница Settings · Настройки приложения'
                            : settingsAboutUsView === 'LIST'
                            ? 'Settings → О нас · Список документов проекта'
                            : settingsAboutUsView === 'DOC_FINANCING'
                            ? 'Settings → О нас → Документ №1: Схема финансирования стартапа'
                            : 'Settings → О нас → Документ №2: Онтологическое ядро и архитектура GoBell'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {settingsAboutUsView === 'NONE'
                            ? 'Управление параметрами геолокации, уведомлений, отображения на карте и раздел «О нас».'
                            : 'Официальная документация, финансовая модель и архитектура стартапа GoBell.'}
                        </p>
                      </div>
                    </div>

                    {settingsAboutUsView !== 'NONE' && (
                      <div className="flex items-center gap-2">
                        {settingsAboutUsView !== 'LIST' && (
                          <button
                            type="button"
                            onClick={() => setSettingsAboutUsView('LIST')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-500/40 text-xs font-extrabold transition-colors"
                          >
                            ← К списку документов
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSettingsAboutUsView('NONE')}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
                        >
                          ← Назад в Settings
                        </button>
                      </div>
                    )}
                  </div>

                  {/* РЕЖИМ 1: ОСНОВНОЙ ЭКРАН SETTINGS С ПУНКТОМ «О НАС» */}
                  {settingsAboutUsView === 'NONE' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Автоматическое обновление геолокации
                          </div>
                          <div className="text-xs text-slate-400">
                            Передавать координаты активного профиля в реальном времени
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsAutoGeo((prev) => !prev)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                            settingsAutoGeo
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {settingsAutoGeo ? 'ВКЛ' : 'ВЫКЛ'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Уведомления о сигналах SOS в радиусе
                          </div>
                          <div className="text-xs text-slate-400">
                            Получать оповещения, когда рядом включается активный тег SOS
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsPushNotifications((prev) => !prev)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                            settingsPushNotifications
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {settingsPushNotifications ? 'ВКЛ' : 'ВЫКЛ'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Показывать точное расстояние на маркерах
                          </div>
                          <div className="text-xs text-slate-400">
                            Отображать дистанцию в метрах и километрах от центра поиска
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsShowDistance((prev) => !prev)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                            settingsShowDistance
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {settingsShowDistance ? 'ВКЛ' : 'ВЫКЛ'}
                        </button>
                      </div>

                      {/* ПУНКТ «О НАС» В SETTINGS — ВЫХОД НА СПИСОК ДОКУМЕНТОВ ПРОЕКТА */}
                      <div
                        onClick={() => setSettingsAboutUsView('LIST')}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-950 to-emerald-950/40 border-2 border-amber-500/50 hover:border-amber-400 cursor-pointer transition-all group shadow-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                              GoBell · Документы
                            </span>
                            <span className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                              О нас
                            </span>
                          </div>
                          <div className="text-xs text-slate-300">
                            Список официальных документов проекта (1. Схема финансирования стартапа и др.)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsAboutUsView('LIST');
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shrink-0 shadow-md transition-colors"
                        >
                          Открыть список документов →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* РЕЖИМ 2: СПИСОК ДОКУМЕНТОВ ПРИ НАЖАТИИ НА «О НАС» */}
                  {settingsAboutUsView === 'LIST' && (
                    <div className="space-y-3 pt-1">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300 px-1">
                        Раздел «О нас» · Выберите документ для чтения:
                      </div>

                      {/* Документ №1: Схема финансирования стартапа */}
                      <div
                        onClick={() => setSettingsAboutUsView('DOC_FINANCING')}
                        className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 hover:border-emerald-400 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[11px] font-extrabold uppercase font-mono">
                              Документ №1
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-white">
                              Схема финансирования стартапа
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Двухосевая матрица краудфандинга: взнос от $1 до $10 = 1 год PRO, от $10 до $20 = 2 года PRO... А привлечение от 1 до 10 человек = PRO + I, от 10 до 20 человек = PRO + II, от 20 до 30+ человек = PRO + III + стартовый плацдарм в Европе и биржа Monetize (50/50).
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsAboutUsView('DOC_FINANCING');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shrink-0 shadow-md transition-colors"
                        >
                          Читать документ →
                        </button>
                      </div>

                      {/* Документ №2: Онтологическое ядро и архитектура GoBell */}
                      <div
                        onClick={() => setSettingsAboutUsView('DOC_ONTOLOGY')}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase font-mono">
                              Документ №2
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-white">
                              Онтологическое ядро (Метамонизм) и паспорт системы GoBell
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Формула «Единица системы — тег. Пространство — локальное в глобальном поле», четырёхтактный цикл операторов (FIX → UNFOLD → DIFF → DISS), тарифная сетка, группы GO/GC и система Кармы.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsAboutUsView('DOC_ONTOLOGY');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-extrabold shrink-0 transition-colors"
                        >
                          Читать документ →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* РЕЖИМ 3: ДОКУМЕНТ №1 — «СХЕМА ФИНАНСИРОВАНИЯ СТАРТАПА» */}
                  {settingsAboutUsView === 'DOC_FINANCING' && (
                    <div className="space-y-5 pt-2">
                      {/* Шапка документа */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-amber-950/50 border-2 border-emerald-500/60 space-y-2 shadow-xl">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                            Документ №1 · Финансовая архитектура GoBell
                          </span>
                          <span className="text-xs font-mono text-emerald-300">
                            100% целевое сохранение капитала внутри проекта
                          </span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-extrabold text-white">
                          Схема финансирования стартапа GoBell
                        </h4>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          Финансовая модель стартапа опирается на 4 столпа: <strong>1) Вирусный краудфандинг без оттока живых денег на реферальные выплаты</strong>, <strong>2) Бесплатный захват критической массы и пула Monetize через европейский плацдарм</strong>, <strong>3) Архитектура нулевых расходов на карты и геолокацию ($0)</strong> и <strong>4) Двухконтурная операционная монетизация (Подписки + Биржа 50/50)</strong>.
                        </p>
                      </div>

                      {/* Блок 1: Вирусная двухосевая схема краудфандинга */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3.5">
                        <h5 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
                          1. Двухосевая матрица Краудфандинга (Взнос в $ = Срок в годах · Привлечение людей = Уровень PRO+)
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          В GoBell применена симметричная саморазгоняющаяся формула с шагом <strong>10</strong>: <strong className="text-white">сумма денежного взноса определяет СРОК подписки в годах</strong> (порог входа всего от $1!), а <strong className="text-emerald-300">количество привлечённых новых вкладчиков определяет УРОВЕНЬ мощности подписки (PRO + I / II / III)</strong>. Все 100% собранных денег остаются в бюджете стартапа:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs pt-1">
                          {/* Ось 1: Денежный взнос -> Срок подписки */}
                          <div className="p-4 rounded-xl bg-slate-900 border border-amber-400/50 space-y-2.5">
                            <div className="font-extrabold text-amber-300 uppercase tracking-wide">
                              Ось 1: Денежный взнос → Срок базовой подписки PRO
                            </div>
                            <p className="text-slate-300 text-[11px]">
                              Каждые $10 взноса дают +1 год подписки PRO (розничная цена которой $60/год при тарифе $5/мес):
                            </p>
                            <ul className="space-y-1.5 font-mono text-xs text-slate-200">
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>Взнос <strong>от $1 до $10</strong></span>
                                <span className="text-amber-300 font-extrabold">→ 1 год подписки PRO</span>
                              </li>
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>Взнос <strong>от $10 до $20</strong></span>
                                <span className="text-amber-300 font-extrabold">→ 2 года подписки PRO</span>
                              </li>
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>Взнос <strong>от $20 до $30</strong></span>
                                <span className="text-amber-300 font-extrabold">→ 3 года подписки PRO</span>
                              </li>
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>...каждые следующие <strong>+$10</strong></span>
                                <span className="text-amber-300 font-extrabold">→ +1 год подписки PRO</span>
                              </li>
                            </ul>
                          </div>

                          {/* Ось 2: Привлечение вкладчиков -> Уровень PRO+ */}
                          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-400/50 space-y-2.5">
                            <div className="font-extrabold text-emerald-300 uppercase tracking-wide">
                              Ось 2: Привлечение людей → Апгрейд до PRO + I / II / III
                            </div>
                            <p className="text-slate-300 text-[11px]">
                              Уровни PRO+ за деньги не продаются — они открываются на весь оплаченный срок за приглашённых вкладчиков (даже со взносом от $1!):
                            </p>
                            <ul className="space-y-1.5 font-mono text-xs text-slate-200">
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>Привлечение <strong>от 1 до 10 чел.</strong></span>
                                <span className="text-emerald-300 font-extrabold">→ Уровень PRO + I</span>
                              </li>
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>Привлечение <strong>от 10 до 20 чел.</strong></span>
                                <span className="text-emerald-300 font-extrabold">→ Уровень PRO + II</span>
                              </li>
                              <li className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                                <span>Привлечение <strong>от 20 до 30+ чел.</strong></span>
                                <span className="text-emerald-300 font-extrabold">→ Уровень PRO + III</span>
                              </li>
                            </ul>
                            <div className="text-[11px] text-amber-200/90 pt-0.5">
                              Поскольку вход для друга начинается всего <strong>от $1 за целый год PRO</strong>, пригласить первых 1–10 человек может абсолютно каждый участник!
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                            <div className="font-mono font-extrabold text-amber-300">
                              От 1 до 10 человек → PRO + I
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1">
                              2 слота Advert · 2 свои группы · до 20 слов (обычный тариф $10/мес).
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                            <div className="font-mono font-extrabold text-amber-300">
                              От 10 до 20 человек → PRO + II
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1">
                              3 слота Advert · 3 свои группы · до 30 слов (обычный тариф $15/мес).
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                            <div className="font-mono font-extrabold text-amber-300">
                              От 20 до 30+ человек → PRO + III
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1">
                              4 слота Advert · 4 свои группы · до 40 слов (обычный тариф $20/мес).
                            </div>
                          </div>
                        </div>

                        {/* ИНТЕРАКТИВНАЯ ТАБЛИЧКА НА СТРАНИЦЕ СБОРА: ПРОСТЫЕ МАРКЕРЫ ДОСТИГНУТОГО РЕЗУЛЬТАТА (БЕЗ ПОКАЗА СУММЫ ВЗНОСА) + СКОЛЬКО ОСТАЛОСЬ ДО СЛЕДУЮЩЕГО УРОВНЯ + СПИСОК ПИРАМИДЫ ВНИЗ */}
                        {(() => {
                          const directCount = crowdfundingInvitedList.length;
                          const totalDownlineCount = crowdfundingInvitedList.reduce(
                            (acc, item) => acc + 1 + item.downline.length,
                            0
                          );
                          const achievedLevelBadge =
                            directCount >= 20
                              ? 'PRO + III'
                              : directCount >= 10
                              ? 'PRO + II'
                              : directCount >= 1
                              ? 'PRO + I'
                              : 'PRO';
                          const nextLevelName =
                            directCount < 1
                              ? 'PRO + I'
                              : directCount < 10
                              ? 'PRO + II'
                              : directCount < 20
                              ? 'PRO + III'
                              : null;
                          const remainingToNextLevel =
                            directCount < 1
                              ? 1 - directCount
                              : directCount < 10
                              ? 10 - directCount
                              : directCount < 20
                              ? 20 - directCount
                              : 0;

                          return (
                            <div className="mt-4 p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500/50 space-y-4 shadow-xl">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[11px] font-extrabold uppercase">
                                      Персональная страница участника сбора
                                    </span>
                                    <span className="text-xs font-mono text-amber-300">
                                      Заводится автоматически при первом взносе и регистрации в проекте
                                    </span>
                                  </div>
                                  <div className="text-sm font-extrabold text-white">
                                    Личный кабинет спонсора: простые маркеры результата (без показа суммы взноса) + пирамида приглашённых вниз
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCrowdfundingAchievedYears((prev) =>
                                        prev >= 10 ? 1 : prev + 1
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold transition-colors"
                                  >
                                    +1 год подписки (тест)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextNum = crowdfundingInvitedList.length + 1;
                                      const namesPool = [
                                        'Илья · Автоподбор',
                                        'Наталья · Стоматология',
                                        'Роман · Грузоперевозки',
                                        'Виктория · Салон красоты',
                                        'Артур · Юридическая помощь',
                                        'Денис · Кофейня у дома',
                                      ];
                                      const randomName =
                                        namesPool[(nextNum - 1) % namesPool.length];
                                      setCrowdfundingInvitedList((prev) => [
                                        {
                                          id: `ref-${Date.now()}`,
                                          name: `${randomName} (#${nextNum})`,
                                          joinedAt: 'Только что',
                                          achievedBadge: nextNum % 2 === 0 ? 'PRO + I' : 'PRO',
                                          achievedYears: (nextNum % 3) + 1,
                                          downline:
                                            nextNum % 2 === 0
                                              ? [
                                                  {
                                                    id: `sub-${Date.now()}`,
                                                    name: 'Участник 2-й линии',
                                                    achievedBadge: 'PRO',
                                                    joinedAt: 'Только что',
                                                  },
                                                ]
                                              : [],
                                        },
                                        ...prev,
                                      ]);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold transition-colors shadow-sm"
                                  >
                                    + Пришёл человек по ссылке (тест)
                                  </button>
                                </div>
                              </div>

                              {/* ПЕРСОНАЛЬНАЯ РЕФЕРАЛЬНАЯ ССЫЛКА УЧАСТНИКА (ГЕНЕРИРУЕТСЯ ПРИ ПЕРВОМ ВЗНОСЕ И РЕГИСТРАЦИИ) */}
                              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-400 font-semibold">
                                    Ваша персональная ссылка для приглашения (выдана при первом взносе и регистрации):
                                  </div>
                                  <div className="font-mono font-bold text-emerald-300 select-all">
                                    https://gobell.app/join?ref={activeDemoProfileId}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const link = `https://gobell.app/join?ref=${activeDemoProfileId}`;
                                    if (navigator.clipboard?.writeText) {
                                      navigator.clipboard.writeText(link).catch(() => {});
                                    }
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold transition-colors shrink-0"
                                >
                                  Скопировать мою ссылку
                                </button>
                              </div>

                              {/* ДВЕ ПРОСТЫЕ ШКАЛЫ С МАРКЕРАМИ (БЕЗ ПОКАЗА ДЕНЕГ) */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                                {/* Табличка 1: Достигнутый срок подписки */}
                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 font-semibold">
                                      Достигнутый срок подписки:
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-extrabold text-xs">
                                      {crowdfundingAchievedYears}{' '}
                                      {crowdfundingAchievedYears === 1
                                        ? 'год'
                                        : crowdfundingAchievedYears < 5
                                        ? 'года'
                                        : 'лет'}{' '}
                                      активно
                                    </span>
                                  </div>

                                  {/* Простые маркеры лет (1..10) */}
                                  <div className="grid grid-cols-10 gap-1 pt-0.5">
                                    {Array.from({length: 10}, (_, idx) => {
                                      const yr = idx + 1;
                                      const isReached = yr <= crowdfundingAchievedYears;
                                      return (
                                        <div
                                          key={yr}
                                          className={`h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-extrabold border transition-all ${
                                            isReached
                                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                                              : 'bg-slate-900 text-slate-500 border-slate-800'
                                          }`}
                                          title={`${yr} г.`}
                                        >
                                          {yr}г
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="text-[11px] text-slate-300 flex items-center justify-between">
                                    <span>Сумма взноса не отображается (приватно)</span>
                                    <span className="font-mono text-amber-300 font-bold">
                                      {crowdfundingAchievedYears < 10
                                        ? `До ${crowdfundingAchievedYears + 1} лет: 1 шаг`
                                        : 'Достигнут максимум (10 лет)'}
                                    </span>
                                  </div>
                                </div>

                                {/* Табличка 2: Достигнутый уровень PRO+ и сколько осталось до следующего уровня */}
                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 font-semibold">
                                      Достигнутый статус мощности:
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs">
                                      {achievedLevelBadge}
                                    </span>
                                  </div>

                                  {/* Простые маркеры по 10 точек до следующего уровня */}
                                  <div className="grid grid-cols-10 gap-1 pt-0.5">
                                    {Array.from({length: 10}, (_, idx) => {
                                      const currentBandProgress =
                                        directCount >= 20
                                          ? 10
                                          : directCount >= 10
                                          ? directCount - 10
                                          : directCount;
                                      const isFilled = idx < currentBandProgress;
                                      return (
                                        <div
                                          key={idx}
                                          className={`h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-extrabold border transition-all ${
                                            isFilled
                                              ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm'
                                              : 'bg-slate-900 text-slate-500 border-slate-800'
                                          }`}
                                        >
                                          {isFilled ? '●' : '○'}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  <div className="text-[11px] flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-slate-300">
                                      По вашей ссылке: <strong className="text-white">{directCount} чел.</strong>
                                    </span>
                                    {nextLevelName ? (
                                      <span className="font-mono text-emerald-300 font-extrabold">
                                        До уровня {nextLevelName} осталось: {remainingToNextLevel} чел.
                                      </span>
                                    ) : (
                                      <span className="font-mono text-emerald-300 font-extrabold">
                                        Открыт максимальный уровень PRO + III!
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ЭЛИТНАЯ ЛИГА TOP 100 · СТАТУС «СОВЕТНИК-ДЕПУТАТ GB» (ЗНАЧОК + ОБЩЕСТВЕННЫЙ СОВЕТ GB С ЧИСЛОМ ГОЛОСОВ ПО ЧИСЛУ ПРИВЕДЁННЫХ ПОЛЬЗОВАТЕЛЕЙ + ЛИЧНЫЙ КАНАЛ С РУКОВОДСТВОМ GB) */}
                              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-950 to-purple-950/60 border-2 border-amber-400/70 space-y-2.5 shadow-lg">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                                      <span>★ СОВЕТНИК-ДЕПУТАТ GB · TOP 100</span>
                                    </span>
                                    <span className="text-xs font-extrabold text-amber-200">
                                      1 приведённый пользователь = 1 депутатский голос
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 font-mono text-[11px] font-extrabold text-emerald-300">
                                      Ваши голоса в Совете GB: {directCount} гол.
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-400/50 font-mono text-[11px] font-bold text-amber-300">
                                      Рейтинг TOP 100: #{Math.max(1, 118 - directCount * 3)} место
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-200 leading-relaxed">
                                  <strong>TOP 100 самых активных пользователей</strong>, привлекших наибольшее количество вкладов по своей ссылке, становятся не просто советниками, а <strong className="text-amber-300">Депутатами Общественного совета GB с количеством голосов, строго равным числу приведённых ими пользователей</strong>:
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs pt-0.5">
                                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-400/40">
                                    <div className="font-extrabold text-amber-300">
                                      1. Значок «★ Советник-Депутат GB»
                                    </div>
                                    <div className="text-[11px] text-slate-300 mt-0.5">
                                      Особый золотой знак отличия в профиле и на карте как маркер избранного делегата сообщества.
                                    </div>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-400/40">
                                    <div className="font-extrabold text-emerald-300">
                                      2. Депутатский мандат (Голоса = Люди)
                                    </div>
                                    <div className="text-[11px] text-slate-300 mt-0.5">
                                      Место в Общественном совете GB, где вес вашего решения равен <strong>числу приведённых вами пользователей ({directCount} голосов)</strong>.
                                    </div>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-400/40">
                                    <div className="font-extrabold text-purple-300">
                                      3. Личный канал с руководством GB
                                    </div>
                                    <div className="text-[11px] text-slate-300 mt-0.5">
                                      Закрытый прямой канал коммуникации напрямую с основателями и руководством GoBell.
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* СПИСОК ПИРАМИДЫ ВНИЗ (КТО ПРИШЁЛ ПО ТВОЕЙ ССЫЛКЕ И КОГО ПРИВЕЛИ ОНИ) */}
                              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                                    Список пирамиды вниз (кто пришёл по вашей ссылке)
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    1-я линия: <strong className="text-white">{directCount}</strong> · Всего в ветке вниз:{' '}
                                    <strong className="text-emerald-300">{totalDownlineCount} чел.</strong>
                                  </div>
                                </div>

                                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                  {crowdfundingInvitedList.map((member, idx) => {
                                    const isExpanded = expandedReferralIds.includes(member.id);
                                    return (
                                      <div
                                        key={member.id}
                                        className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
                                      >
                                        <div
                                          onClick={() =>
                                            setExpandedReferralIds((prev) =>
                                              prev.includes(member.id)
                                                ? prev.filter((id) => id !== member.id)
                                                : [...prev, member.id]
                                            )
                                          }
                                          className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/70 transition-colors text-xs"
                                        >
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-[11px] text-slate-400">
                                              #{idx + 1}
                                            </span>
                                            <span className="font-bold text-white">
                                              {member.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                              ({member.joinedAt})
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-extrabold">
                                              {member.achievedBadge} · {member.achievedYears}г
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-[10px] font-bold">
                                              Вниз: +{member.downline.length}
                                            </span>
                                          </div>
                                        </div>

                                        {isExpanded && member.downline.length > 0 && (
                                          <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 space-y-1">
                                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                              Пришли по ссылке «{member.name}» (2-я ступень вниз):
                                            </div>
                                            {member.downline.map((sub) => (
                                              <div
                                                key={sub.id}
                                                className="flex items-center justify-between text-[11px] py-1 pl-3 border-l-2 border-emerald-500/40 text-slate-300"
                                              >
                                                <span>↳ {sub.name}</span>
                                                <span className="font-mono text-[10px] text-amber-300">
                                                  Статус: {sub.achievedBadge} ({sub.joinedAt})
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Блок 2: Стартовый плацдарм и формирование товарного пула Monetize */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-2.5">
                        <h5 className="text-sm font-extrabold uppercase tracking-wider text-sky-300">
                          2. Стартовый плацдарм (Beachhead): Украинцы в Европе, городские Telegram-каналы и пул Monetize
                        </h5>
                        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc pl-5">
                          <li>
                            <strong className="text-white">Гуманитарный и вирусный триггер:</strong> бесплатное предоставление статуса <strong>PRO</strong> украинцам в Европе с намертво пришитыми к шапке профиля (сверх 10 слотов слов) неудаляемыми системными тегами <code className="text-amber-300">#УКРАИНА #UKRAINE</code>.
                          </li>
                          <li>
                            <strong className="text-white">Канал первичного распространения — через знакомых и «знакомых знакомых» в городских Telegram-чатах украинцев Европы:</strong> в каждом европейском городе есть чаты и каналы диаспоры (которые не продают рекламу, а пропускают только живые полезные сообщения от своих). Поэтому заход идёт <strong>не через админов, а снизу — через живую цепочку знакомых и знакомых знакомых</strong>, которые уже живут в этих городах и состоят в местных чатах. Поскольку для украинцев статус <strong>PRO</strong> (с тегами <code>#УКРАИНА #UKRAINE</code>) выдаётся бесплатно ради взаимопомощи, такие рекомендации от живых людей воспринимаются как помощь своим, а не коммерция. При этом каждый знакомый мотивирован кинуть в городской чат и друзьям <strong>свою личную ссылку</strong>, чтобы набрать 1–10–20 переходов для апгрейда до <strong>PRO + I / II / III</strong> и очков в гонке <strong>TOP 100 · Советник-Депутат GB</strong>!
                          </li>
                          <li>
                            <strong className="text-white">Мгновенная капитализация рекламной биржи:</strong> десятки тысяч выданных PRO-аккаунтов сразу создают по всей Европе плотную сеть свободных слотов <strong>Monetize</strong>, которые стартап тут же может продавать европейскому бизнесу (<strong>BUSINESS</strong>) без ожидания платных подписок.
                          </li>
                          <li>
                            <strong className="text-white">Нулевые затраты на модерацию и верификацию:</strong> проверка документов не нужна — любого чужака или спамера, прицепившего плашку <code>#УКРАИНА #UKRAINE</code>, первые же три земляка после диалога в чате отправляют в автоматический бан через <strong>3 минуса подряд (-1) в Карму</strong>.
                          </li>
                        </ul>

                        {/* ОТВЕТ ИНВЕСТОРУ: КАК ПРЕОДОЛЕВАЕТСЯ БАРЬЕР НИЗКОГО КОЛИЧЕСТВА ПОЛЬЗОВАТЕЛЕЙ НА СТАРТЕ (COLD START PROBLEM) */}
                        <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-400/50 space-y-2">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                            Ответ на главный вопрос инвестора: Как преодолеть барьер малого числа пользователей на старте («Холодный старт»)?
                          </div>
                          <ol className="space-y-1.5 text-xs text-slate-200 leading-relaxed list-decimal pl-5">
                            <li>
                              <strong className="text-white">Не «размазываем» запуск по всему миру, а бьём в готовую спаянную сеть:</strong> миллионы украинцев в Европе уже сгруппированы в конкретных городских Telegram-чатах и Facebook-группах (см. реестр из 27 стран ниже).
                            </li>
                            <li>
                              <strong className="text-white">Польза даже при 20–50 участниках в одном районе:</strong> в отличие от обычных соцсетей, где нужны миллионы блогеров, на карте GoBell даже первые <strong>30–50 своих мастеров, врачей, перевозчиков и соседей в радиусе 2–5 км</strong> уже решают бытовую задачу и проблему экстренной помощи (<code>SOS</code>), которая в ленте Telegram тонет за 10 минут.
                            </li>
                            <li>
                              <strong className="text-white">Каждый вошедший обязан привести минимум 1–10 друзей для апгрейда:</strong> бесплатный вход (или взнос от $1) даёт базовый <code>PRO</code> (10 слов), но чтобы получить <strong>PRO + I (20 слов, 2 слота, 2 группы)</strong>, участнику нужно пригласить по своей личной ссылке хотя бы <strong>1–10 знакомых</strong> из того же городского чата.
                            </li>
                            <li>
                              <strong className="text-white">Рекламная биржа Monetize работает уже от первых 500 точек в городе:</strong> локальному бизнесу (СТО, стоматологии, юристу, доставке в Варшаве или Берлине) не нужны миллионы пользователей по всей планете — ему достаточно арендовать слоты <code>Monetize</code> у первых <strong>300–500 активных земляков</strong> в своём городе!
                            </li>
                            <li>
                              <strong className="text-emerald-300">Космосим GoBell: ELITE 3D с обязательной геолокацией смартфона:</strong> чтобы активировать игру, пользователь обязан включить геолокацию на смартфоне. Пока игрок проводит время в космосе (летает между планетами, добывает элементы в поясе астероидов, выполняет контракты правительств планет), <strong>его профиль в реальном времени светится на реальной карте GoBell</strong> со всеми его тегами и принимает запросы на контакт!
                            </li>
                          </ol>
                        </div>

                        {/* БАЗА КАНАЛОВ И ГРУПП УКРАИНЦЕВ ПО СТРАНАМ И ГОРОДАМ (ДЛЯ ПОСЕВА ЧЕРЕЗ ЗНАКОМЫХ И ЗНАКОМЫХ ЗНАКОМЫХ) */}
                        <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-sky-500/40 space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                              Реестр стартовых каналов и чатов диаспоры по странам и городам (27 стран)
                            </div>
                            <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-200 font-mono text-[10px] font-bold">
                              Общий канал по ЕС: https://t.me/ukr_emigration
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1 text-[11px]">
                            {[
                              {
                                country: 'Общий канал по ЕС',
                                links: ['https://t.me/ukr_emigration'],
                              },
                              {
                                country: 'Австрия',
                                links: [
                                  'https://t.me/ukraineat',
                                  'https://t.me/austriaukr',
                                  'https://t.me/refugeesinAustria',
                                ],
                              },
                              {
                                country: 'Бельгия',
                                links: [
                                  'https://t.me/ukrainciwbelgii',
                                  'https://t.me/refugeesinBelgium',
                                ],
                              },
                              {
                                country: 'Болгария',
                                links: [
                                  'https://www.facebook.com/groups/699929631375624/',
                                  'https://www.facebook.com/groups/338927668246444/',
                                  'https://www.facebook.com/OpenDataAssociation/',
                                ],
                              },
                              {
                                country: 'Венгрия',
                                links: [
                                  'https://t.me/hungaryua',
                                  'https://t.me/helpinhungary',
                                  'https://t.me/HUvolunteerswithUA',
                                  'https://help.unhcr.org/hungary/uk/',
                                ],
                              },
                              {
                                country: 'Германия (общие и по городам)',
                                links: [
                                  'https://t.me/refugees_in_Germany',
                                  'https://t.me/+ZM7gZZfM8Wc2YWM6',
                                  'https://t.me/germanyhelpsukraine',
                                  'https://t.me/ru_de_help',
                                  'https://t.me/helpUkraine_Gemany',
                                  'https://www.facebook.com/groups/1257731608089510',
                                  'Берлин: https://t.me/+Mx6WD9KWQzQ4ZTVi, https://t.me/ukrainehelpberlin',
                                  'Штутгарт: https://t.me/helpforukraine22',
                                  'Нюрнберг: https://t.me/help_in_Nuremberg_UA',
                                  'Кельн: https://t.me/cologne_help',
                                  'Хайльбронн (Heilbronn): https://t.me/+zc9HnLCyckMzMGRi',
                                ],
                              },
                              {
                                country: 'Дания',
                                links: ['https://t.me/refugeesinDenmark'],
                              },
                              {
                                country: 'Испания (общие и по городам)',
                                links: [
                                  'https://t.me/infohelpBCN',
                                  'https://t.me/espana_ucrania',
                                  'Барселона: https://t.me/infohelpBCN',
                                  'Валенсия: https://t.me/ukrvalencia',
                                  'Мадрид: https://t.me/ukrmadrid',
                                  'Аликанте, Бенидорм, Валенсия, Гранада: https://t.me/Alvalben',
                                ],
                              },
                              {
                                country: 'Италия',
                                links: ['https://t.me/dodomu_italia_ucraina'],
                              },
                              {
                                country: 'Ирландия',
                                links: [
                                  'https://t.me/DublinTYT',
                                  'Украинцы в Ирландии (Facebook)',
                                ],
                              },
                              {
                                country: 'Канада',
                                links: ['https://t.me/+QCWFEhwwyD9jZDdi'],
                              },
                              {
                                country: 'Кипр',
                                links: ['https://t.me/uacyprus'],
                              },
                              {
                                country: 'Латвия',
                                links: [
                                  'https://t.me/ukrainelatvia',
                                  'https://www.ukraine-latvia.com/uk',
                                ],
                              },
                              {
                                country: 'Мальта (Українці на Мальті)',
                                links: [
                                  'https://www.facebook.com/groups/509497399153604',
                                  'https://www.facebook.com/groups/1531824850366953',
                                ],
                              },
                              {
                                country: 'Молдова',
                                links: [
                                  'https://t.me/moldovaukraina',
                                  'https://ua-md-help.info/',
                                  'https://dopomoga.gov.md',
                                ],
                              },
                              {
                                country: 'Польша (общие и по городам)',
                                links: [
                                  'https://t.me/refugeesinPoland',
                                  'Быдгощ: https://www.facebook.com/groups/338496363010331',
                                  'Варшава: https://www.facebook.com/groups/zasobygrupa/',
                                  'Вроцлав: https://www.facebook.com/groups/277111145806430',
                                  'Гданьск, Гдыня, Сопот: https://www.facebook.com/groups/673244999502092',
                                  'Катовице: https://www.facebook.com/groups/1404384713150789',
                                  'Краков: https://www.facebook.com/groups/wynajemkrakow',
                                  'Лодзь: https://www.facebook.com/groups/ibuyers',
                                  'Люблин: https://www.facebook.com/groups/1599244123639245',
                                  'Познань: https://www.facebook.com/groups/1409735869249950',
                                  'Щецин: https://www.facebook.com/groups/265144983644555',
                                  'https://ukrainesupport.net/uk/',
                                  'https://help.unhcr.org/poland/uk/',
                                ],
                              },
                              {
                                country: 'Португалия',
                                links: [
                                  'https://t.me/+j3_sMgK6QG8yMmVi',
                                  'https://www.sef.pt/en/Pages/homepage.aspx',
                                ],
                              },
                              {
                                country: 'Румыния',
                                links: [
                                  'https://t.me/UkrainiansinRomania',
                                  'https://www.facebook.com/groups/unitipentruucraina',
                                  'https://t.me/romaniahelp2022',
                                  'https://t.me/+sd7n-wZZiPxiZjAy',
                                ],
                              },
                              {
                                country: 'Словакия',
                                links: [
                                  'https://t.me/ukrajinci_na_slovensku',
                                  'https://www.ukraineslovakia.sk',
                                ],
                              },
                              {
                                country: 'Словения',
                                links: ['https://www.facebook.com/groups/179196962897968'],
                              },
                              {
                                country: 'США',
                                links: [
                                  'https://t.me/joinchat/PQ0mGEUTSh8xYTli',
                                  'https://t.me/+LOKfTEG-opo4ODRi',
                                ],
                              },
                              {
                                country: 'Турция (Стамбул, Аланья)',
                                links: [
                                  'Стамбул: https://t.me/uaistanbulchat',
                                  'Аланья: https://t.me/alanyachatUA',
                                ],
                              },
                              {
                                country: 'Франция (и Париж)',
                                links: [
                                  'https://t.me/ukrainieninfrance',
                                  'https://t.me/refugeesinFrance',
                                  'https://t.me/france_ua',
                                  'https://t.me/franceukraine',
                                  'Париж: https://t.me/+KUk3d_a3w7dkYWI0',
                                ],
                              },
                              {
                                country: 'Хорватия',
                                links: [
                                  'https://www.facebook.com/groups/sosukrajina/',
                                  'https://www.facebook.com/UUKDCvit',
                                ],
                              },
                              {
                                country: 'Украина',
                                links: ['https://t.me/refugeesinUkraine'],
                              },
                              {
                                country: 'Чехия',
                                links: ['https://t.me/+eAVhTnKzhEFkNWMy'],
                              },
                              {
                                country: 'Швейцария / Швеция / Эстония / Бразилия',
                                links: [
                                  'Швейцария: https://t.me/refugeesinSwitzerland',
                                  'Швеция: https://t.me/refugeesinSweden',
                                  'Эстония: https://www.facebook.com/ukrainians.in.estonia',
                                  'Бразилия: https://t.me/uarefugee',
                                ],
                              },
                            ].map((region) => (
                              <div
                                key={region.country}
                                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                              >
                                <div className="font-extrabold text-amber-300">{region.country}</div>
                                <div className="space-y-0.5 font-mono text-[10px] text-slate-300 break-all">
                                  {region.links.map((lnk, idx) => (
                                    <div key={idx} className="select-all">
                                      • {lnk}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Блок 3: Экономия капитала стартапа (Zero-Cost Map Engine) */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                        <h5 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                          3. Защита бюджета стартапа: Нулевые расходы на карты и геолокацию ($0.00)
                        </h5>
                        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc pl-5">
                          <li>
                            <strong className="text-white">Отключён платный поиск Google (Places API = $0):</strong> поиск работает исключительно по тегам внутри собственной базы GoBell.
                          </li>
                          <li>
                            <strong className="text-white">Координаты со смартфона пользователя ($0):</strong> в боевом режиме точка профиля привязана к аппаратному GPS смартфона.
                          </li>
                          <li>
                            <strong className="text-white">Нативный мобильный движок карт смартфона ($0 без лимитов):</strong> мобильное приложение использует встроенный в телефон <code>Maps SDK for Android / iOS</code> (<em>Mobile Native Dynamic Maps</em>), где показ карты и переключение «Карта / Спутник» в тарифах Google полностью бесплатны при любом числе пользователей.
                          </li>
                        </ul>
                      </div>

                      {/* Блок 4: Постоянные потоки выручки после запуска */}
                      <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2.5">
                        <h5 className="text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                          4. Операционная выручка после запуска (Подписки + Биржа Monetize 50/50)
                        </h5>
                        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc pl-5">
                          <li>
                            <strong className="text-white">Ежемесячные подписки PRO и PRO+:</strong> $5/мес за базовый PRO и +$5 за каждый шаг расширения (PRO + I = $10/мес, PRO + II = $15/мес, PRO + III = $20/мес).
                          </li>
                          <li>
                            <strong className="text-white">Корпоративный тариф BUSINESS и Биржа Monetize (50 / 50):</strong> бизнес-аккаунты массово арендуют слоты Advert у пользователей PRO/PRO+. Выручка от аренды делится поровну: <strong>50% чистой прибыли забирает компания GoBell</strong>, а <strong>50% начисляется владельцам PRO-слотов</strong> (на оплату подписки или вывод на карту).
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* РЕЖИМ 4: ДОКУМЕНТ №2 — «ОНТОЛОГИЧЕСКОЕ ЯДРО И ПАСПОРТ СИСТЕМЫ GOBELL» */}
                  {settingsAboutUsView === 'DOC_ONTOLOGY' && (
                    <div className="space-y-4 pt-2">
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-sky-950/50 border-2 border-amber-400/60 space-y-3">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                          Документ №2 · Философская формула системы (Метамонизм)
                        </div>
                        <div className="text-lg font-extrabold text-white">
                          «Единица системы — тег. Пространство — локальное в глобальном поле.»
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/40">
                            <div className="font-mono font-extrabold text-sky-300">1. FIX</div>
                            <div className="font-bold text-white mt-0.5">Любой профиль</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Локальная стабилизация узла и базовых тегов в пространстве.
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/40">
                            <div className="font-mono font-extrabold text-amber-300">2. UNFOLD</div>
                            <div className="font-bold text-white mt-0.5">Объявление (Advert)</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Выход за пределы фиксации профиля — центробежный импульс вовне.
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40">
                            <div className="font-mono font-extrabold text-emerald-300">3. DIFF</div>
                            <div className="font-bold text-white mt-0.5">Запрос контакта</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Рождение новой степени свободы — генерация связи между узлами.
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/40">
                            <div className="font-mono font-extrabold text-purple-300">4. DISS</div>
                            <div className="font-bold text-white mt-0.5">Сам процесс</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">
                              Диссипация тождества — живой диалог и сброс после завершения.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* СТРАНИЦА ПОДПИСКИ И РЕГИСТРАЦИИ УРОВНЕЙ (ОТКРЫВАЕТСЯ ПРИ НАЖАТИИ НА PRO, PRO+ ИЛИ BUSINESS В КАБИНЕТЕ) */}
      {subscriptionPagePlan && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* Верхняя шапка страницы подписки / регистрации */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubscriptionPagePlan(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                ← Назад в кабинет (
                {currentAccountTier === 'PRO'
                  ? PRO_PACKAGE_META[myProPackage].shortBadge
                  : currentAccountTier}
                )
              </button>
              <h2 className="text-base font-bold text-white">
                {subscriptionPagePlan === 'PRO_PLUS'
                  ? 'Страница регистрации уровней PRO+ (PRO + I / PRO + II / PRO + III)'
                  : `Страница подписки GoBell · Тариф ${subscriptionPagePlan}`}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubscriptionPagePlan(null);
                setIsCabinetOpen(false);
              }}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-center transition-colors"
              title="Закрыть и вернуться к карте"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Контент страницы подписки / регистрации PRO+ */}
          <div className="flex-1 overflow-y-auto p-6">
            {subscriptionPagePlan === 'PRO_PLUS' ? (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                    Регистрация расширенных пакетов PRO+ для малого бизнеса и краудфандинга
                  </span>
                  <h1 className="text-2xl font-bold text-white">
                    Выберите и зарегистрируйте уровень PRO + I, PRO + II или PRO + III
                  </h1>
                  <p className="text-sm text-slate-400 max-w-2xl mx-auto">
                    Каждый следующий уровень PRO+ добавляет <strong>+1 слот объявления Advert</strong>,{' '}
                    <strong>+1 создаваемую группу</strong> и <strong>+10 активных слов</strong> к базовому тарифу PRO ($5/мес).
                  </p>
                </div>

                {/* БЛОК КРАУДФАНДИНГА: ВЗНОС $1-$10 = 1 ГОД, $10-$20 = 2 ГОДА... А ПРИВЛЕЧЕНИЕ 1-10 ЧЕЛ = PRO+I, 10-20 ЧЕЛ = PRO+II, 20-30+ ЧЕЛ = PRO+III */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/50 border-2 border-amber-400/60 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                        Краудфандинг GoBell · Шаг 10
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold">
                        Вход от $1 = 1 год PRO!
                      </span>
                    </div>
                    <span className="text-xs font-mono text-amber-200">
                      $1–$10 = 1 год · $10–$20 = 2 года ... | 1–10 чел. = PRO+I · 10–20 чел. = PRO+II
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <strong className="text-amber-300">Сумма взноса определяет срок подписки PRO:</strong> от <strong>$1 до $10</strong> = <strong>1 год</strong> подписки, от <strong>$10 до $20</strong> = <strong>2 года</strong> подписки, от <strong>$20 до $30</strong> = <strong>3 года</strong> и т.д. А <strong className="text-emerald-300">привлечение новых вкладчиков повышает сам уровень подписки:</strong> от <strong>1 до 10 человек</strong> = <strong>PRO + I</strong>, от <strong>10 до 20 человек</strong> = <strong>PRO + II</strong>, от <strong>20 до 30+ человек</strong> = <strong>PRO + III</strong>! Кроме того, <strong className="text-amber-300">TOP 100 самых активных участников</strong> получают статус <strong>«★ Советник-Депутат GB»</strong> — место в Общественном совете GB с <strong>количеством голосов, равным числу приведённых ими пользователей</strong>, и личный канал связи с руководством GB.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  {(
                    [
                      {
                        pkg: 'PRO_PLUS_1' as ProPackageLevel,
                        price: '$10 / мес',
                        crowdfundingValue: 'Открывается за привлечение от 1 до 10 вкладчиков',
                        plusLabel: '+1 объявление · +1 группа · +10 слов к базовому PRO',
                        desc: 'Оптимально для локального мастера или точки: 2 одновременных объявления Advert, 2 создаваемые группы и до 20 слов.',
                      },
                      {
                        pkg: 'PRO_PLUS_2' as ProPackageLevel,
                        price: '$15 / мес',
                        crowdfundingValue: 'Открывается за привлечение от 10 до 20 вкладчиков',
                        plusLabel: '+2 объявления · +2 группы · +20 слов к базовому PRO',
                        desc: 'Для активного дела или нескольких направлений: 3 объявления Advert, 3 создаваемые группы и до 30 слов.',
                      },
                      {
                        pkg: 'PRO_PLUS_3' as ProPackageLevel,
                        price: '$20 / мес',
                        crowdfundingValue: 'Открывается за привлечение от 20 до 30+ вкладчиков',
                        plusLabel: '+3 объявления · +3 группы · +30 слов к базовому PRO',
                        desc: 'Максимальный пакет PRO+: 4 одновременных объявления Advert, 4 создаваемые группы и до 40 слов в профиле и объявлениях.',
                      },
                    ]
                  ).map((item) => {
                    const meta = PRO_PACKAGE_META[item.pkg];
                    const isCurrentPkg =
                      currentAccountTier === 'PRO' && myProPackage === item.pkg;

                    return (
                      <div
                        key={item.pkg}
                        className={`rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-6 ${
                          isCurrentPkg
                            ? 'bg-slate-900 border-amber-400 shadow-2xl ring-2 ring-amber-400/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold uppercase">
                              {meta.shortBadge}
                            </span>
                            <span className="text-lg font-mono font-bold text-white">
                              {item.price}
                            </span>
                          </div>

                          <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                            Краудфандинг: {item.crowdfundingValue}
                          </div>

                          <div className="text-xs font-bold text-amber-300">
                            {item.plusLabel}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>

                          <ul className="space-y-2.5 text-xs text-slate-200 pt-1">
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                <strong>{meta.advertSlots}</strong> одновременных объявления в{' '}
                                <strong>Advert</strong> и <strong>{meta.advertSlots}</strong> свои группы
                              </span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                До <strong>{meta.maxWords} слов</strong> в описании профиля и в
                                каждом объявлении
                              </span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                Автопродление 24ч (на срок или бессрочно) + доход от пула Monetize
                              </span>
                            </li>
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentAccountTier('PRO');
                            setSelectedAdminTier('PRO');
                            setMyProPackage(item.pkg);
                            const trimmed = limitWords(profileDescription, meta.maxWords);
                            setProfileDescription(trimmed);
                            setProfileDescriptionDraft(trimmed);
                            setSubscriptionPagePlan(null);
                          }}
                          className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md ${
                            isCurrentPkg
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          }`}
                        >
                          {isCurrentPkg
                            ? `Активен ${meta.shortBadge} (Вернуться в кабинет)`
                            : `Активировать ${meta.shortBadge} (Подписка / За вкладчиков)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <span className="inline-block px-3 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
                    Текущий уровень: {currentAccountTier}
                  </span>
                  <h1 className="text-2xl font-bold text-white">
                    Расширьте возможности вашего профиля на карте
                  </h1>
                  <p className="text-sm text-slate-400 max-w-xl mx-auto">
                    На краудфандинге деньгами оплачивается доступ к PRO на 10 лет, а уровни PRO+ открываются за привлечение новых вкладчиков (от их числа).
                  </p>
                </div>

                {/* БАННЕР КРАУДФАНДИНГА НА СТРАНИЦЕ ПОДПИСКИ */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/50 border border-amber-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase">
                        Краудфандинг GoBell
                      </span>
                      <span className="text-xs font-bold text-emerald-300">
                        Взнос: $1–$10 = 1 год PRO, $10–$20 = 2 года... · Привлечение: 1–10 чел. = PRO+I, 10–20 чел. = PRO+II
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Сумма взноса определяет срок подписки PRO в годах (каждые $10 = +1 год), а привлечение новых вкладчиков повышает статус до PRO + I (1–10 чел.), PRO + II (10–20 чел.) и PRO + III (20–30+ чел.)!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubscriptionPagePlan('PRO_PLUS')}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shrink-0 shadow-md transition-colors"
                  >
                    Уровни PRO+ за вкладчиков
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Карточка PRO */}
                  <div
                    onClick={() => setSubscriptionPagePlan('PRO')}
                    className={`rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                      subscriptionPagePlan === 'PRO'
                        ? 'bg-slate-900 border-amber-400 shadow-2xl ring-2 ring-amber-400/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold uppercase">
                          PRO (базовый)
                        </span>
                        <span className="text-xl font-mono font-bold text-white">$5 / мес</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                        Краудфандинг: взнос $1–$10 = 1 год PRO, $10–$20 = 2 года PRO...
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Для активных жителей, специалистов, создания своих групп и регулярных объявлений.
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-200">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>До 10 слов в профиле, 1 своя группа и 1 объявление Advert (до 10 слов)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Доход в счёт погашения подписки от сдачи слота в пул Monetize</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Выбор золотой пиктограммы на карте и апгрейд до PRO + I / II / III</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAccountTier('PRO');
                        setSelectedAdminTier('PRO');
                        setMyProPackage('PRO');
                        setSubscriptionPagePlan(null);
                      }}
                      className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                    >
                      Оформить подписку PRO
                    </button>
                  </div>

                  {/* Карточка BUSINESS */}
                  <div
                    onClick={() => setSubscriptionPagePlan('BUSINESS')}
                    className={`rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                      subscriptionPagePlan === 'BUSINESS'
                        ? 'bg-slate-900 border-indigo-400 shadow-2xl ring-2 ring-indigo-400/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-xs font-extrabold uppercase">
                          BUSINESS
                        </span>
                        <span className="text-xl font-mono font-bold text-white">$29 / мес</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Для компаний, сетей, планирования рекламных кампаний и сервисных точек.
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-200">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Размещение в категории BUSINESS и планирование рекламных кампаний</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Несколько активных точек (филиалов) на карте одновременно</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>Статистика просмотров и переходов по тегам в радиусе</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAccountTier('BUSINESS');
                        setSelectedAdminTier('BUSINESS');
                        setSubscriptionPagePlan(null);
                      }}
                      className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                    >
                      Оформить подписку BUSINESS
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* МОДАЛЬНАЯ ФОРМА ОТПРАВКИ ЗАПРОСА НА КОНТАКТ С СОПРОВОДИТЕЛЬНОЙ ЗАПИСКОЙ */}
      {contactFormTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Форма запроса на контакт</h3>
              </div>
              <button
                type="button"
                onClick={() => setContactFormTarget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitContactRequest} className="p-5 space-y-4">
              <div className="text-xs text-slate-300">
                Пользователь: <strong className="text-white">{contactFormTarget.name}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Сопроводительная записка (поясните необходимость контакта):
                </label>
                <textarea
                  rows={3}
                  required
                  value={contactFormNote}
                  onChange={(e) => setContactFormNote(e.target.value)}
                  placeholder="Напишите цель обращения, чтобы пользователь мог принять ваш запрос на контакт..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setContactFormTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md"
                >
                  Отправить запрос в Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ОТДЕЛЬНАЯ СТРАНИЦА ДЕМО: СОЗДАНИЕ КОМЬЮНИТИ И СПИСОК ПОЛЬЗОВАТЕЛЕЙ ВЫБРАННОГО КОМЬЮНИТИ */}
      {isCommunitiesPageOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-150">
          {/* Шапка страницы Демо-Комьюнити */}
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-white">
                    Демо-Комьюнити и список пользователей
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase">
                    Функция исключительно ДЕМО
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Выберите конкретную демонстрацию (например, «Федоровка» — комьюнити села, или «Беженцы Украины в Европе»), создавайте новые демо-комьюнити и управляйте списком их участников.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCommunitiesPageOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700 text-xs font-extrabold flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Закрыть и вернуться к карте</span>
            </button>
          </div>

          {/* Основной контент страницы: 1. Выбор и создание Демо-Комьюнити | 2. Список пользователей выбранного комьюнити */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ЛЕВАЯ КОЛОНКА (5/12): СПИСОК ДЕМО-КОМЬЮНИТИ + ФОРМА СОЗДАНИЯ НОВОГО КОМЬЮНИТИ */}
              <div className="lg:col-span-5 space-y-5">
                {/* Карточки существующих Демо-Комьюнити */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                      1. Выберите Демо-Комьюнити ({demoCommunities.length})
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {demoCommunities.map((comm) => {
                      const isSelected = comm.id === activeDemoCommunityId;
                      const membersInComm = demoProfiles.filter(
                        (dp) => (dp.communityId || 'community-fedorovka') === comm.id
                      );

                      return (
                        <div
                          key={comm.id}
                          onClick={() => {
                            setActiveDemoCommunityId(comm.id);
                            if (membersInComm.length > 0) {
                              handleSelectDemoProfile(membersInComm[0]);
                            } else {
                              const center = {lat: comm.centerLat, lng: comm.centerLng};
                              setSearchCenter(center);
                              map?.panTo(center);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20 shadow-lg'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white">
                                {comm.name}
                              </span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase">
                                  Активная демонстрация
                                </span>
                              )}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-sky-300">
                              Участников: {membersInComm.length}
                            </span>
                          </div>

                          {comm.description && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {comm.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                            <span>
                              Центр: {comm.centerLat.toFixed(4)}, {comm.centerLng.toFixed(4)}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDemoCommunityId(comm.id);
                                  if (membersInComm.length > 0) {
                                    handleSelectDemoProfile(membersInComm[0]);
                                  } else {
                                    const center = {lat: comm.centerLat, lng: comm.centerLng};
                                    setSearchCenter(center);
                                    map?.panTo(center);
                                  }
                                  setIsCommunitiesPageOpen(false);
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-extrabold text-[11px] transition-colors"
                              >
                                Открыть на карте
                              </button>
                              {comm.id !== 'community-fedorovka' &&
                                demoCommunities.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDemoCommunities((prev) =>
                                        prev.filter((c) => c.id !== comm.id)
                                      );
                                      if (activeDemoCommunityId === comm.id) {
                                        setActiveDemoCommunityId('community-fedorovka');
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white font-sans font-bold text-[11px] transition-colors"
                                  >
                                    Удалить
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Форма создания нового Демо-Комьюнити */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-sky-300">
                    2. Создать новое Демо-Комьюнити
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Название комьюнити:
                      </label>
                      <input
                        type="text"
                        value={newCommunityNameDraft}
                        onChange={(e) => setNewCommunityNameDraft(e.target.value)}
                        placeholder="Например: Федоровка или Беженцы Украины в Европе..."
                        className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Описание демонстрации (кейс):
                      </label>
                      <textarea
                        rows={2}
                        value={newCommunityDescDraft}
                        onChange={(e) => setNewCommunityDescDraft(e.target.value)}
                        placeholder="Краткое описание демо-кейса..."
                        className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Центр комьюнити на карте (Copy-Paste из Google Maps или пусто = текущая точка карты):
                      </label>
                      <input
                        type="text"
                        value={newCommunityCoordsDraft}
                        onChange={(e) => setNewCommunityCoordsDraft(e.target.value)}
                        placeholder={`${searchCenter.lat.toFixed(6)}, ${searchCenter.lng.toFixed(6)}`}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs font-mono text-sky-300 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanName = newCommunityNameDraft.trim();
                        if (!cleanName) return;
                        const parsedCenter =
                          parseGoogleCoordsCopyPaste(newCommunityCoordsDraft) || searchCenter;
                        const newId = `community-${Date.now()}`;
                        const createdComm: DemoCommunityItem = {
                          id: newId,
                          name: cleanName,
                          description:
                            newCommunityDescDraft.trim() ||
                            `Демонстрационное комьюнити «${cleanName}»`,
                          centerLat: parsedCenter.lat,
                          centerLng: parsedCenter.lng,
                        };
                        setDemoCommunities((prev) => [...prev, createdComm]);
                        setActiveDemoCommunityId(newId);
                        setMyCommunityId(newId);
                        setSearchCenter(parsedCenter);
                        map?.panTo(parsedCenter);
                        setNewCommunityNameDraft('');
                        setNewCommunityDescDraft('');
                        setNewCommunityCoordsDraft('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-colors shadow-md"
                    >
                      + Создать Демо-Комьюнити
                    </button>
                  </div>
                </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА (7/12): СПИСОК ПОЛЬЗОВАТЕЛЕЙ ВЫБРАННОГО КОМЬЮНИТИ */}
              <div className="lg:col-span-7">
                {(() => {
                  const currentComm =
                    demoCommunities.find((c) => c.id === activeDemoCommunityId) ||
                    demoCommunities[0];
                  const communityUsers = demoProfiles.filter(
                    (dp) => (dp.communityId || 'community-fedorovka') === currentComm.id
                  );

                  return (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-white">
                              Пользователи комьюнити: «{currentComm.name}»
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 font-mono text-xs font-extrabold text-sky-300">
                              {communityUsers.length} чел.
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            В демонстрации на карте отображаются только участники выбранного комьюнити «{currentComm.name}».
                          </p>
                        </div>

                        {/* Кнопки быстрого создания пользователя (FREE / PRO / BUSINESS) прямо в это комьюнити */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdminTier('FREE');
                              setMyCommunityId(currentComm.id);
                              setIsCommunitiesPageOpen(false);
                              handleStartCreateUserFullCabinet();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition-colors shadow-sm"
                          >
                            + create FREE user
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdminTier('PRO');
                              setMyCommunityId(currentComm.id);
                              setIsCommunitiesPageOpen(false);
                              handleStartCreateUserFullCabinet();
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors shadow-sm"
                          >
                            + create PRO user
                          </button>
                        </div>
                      </div>

                      {communityUsers.length === 0 ? (
                        <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                          <p className="text-sm font-bold text-slate-300">
                            В комьюнити «{currentComm.name}» пока нет пользователей
                          </p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Нажмите кнопку <strong>+ create FREE user</strong> или <strong>+ create PRO user</strong> выше, чтобы добавить первого жителя и привязать его координаты из Google Maps.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {communityUsers.map((dp) => {
                            const isCurrentActive = dp.id === activeDemoProfileId;
                            const geoLat = (anchorClusterCenter.lat + dp.latOffset).toFixed(6);
                            const geoLng = (anchorClusterCenter.lng + dp.lngOffset).toFixed(6);

                            return (
                              <div
                                key={dp.id}
                                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                                  isCurrentActive
                                    ? 'bg-slate-950 border-sky-400 ring-1 ring-sky-400/30'
                                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-extrabold text-emerald-300">
                                      #{dp.userTag}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                        dp.tier === 'FREE'
                                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                          : dp.tier === 'PRO'
                                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                      }`}
                                    >
                                      {dp.tier === 'PRO' && dp.proPackage
                                        ? PRO_PACKAGE_META[dp.proPackage].shortBadge
                                        : dp.tier}
                                    </span>
                                    <span className="text-sm font-extrabold text-white">
                                      {dp.name}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                      {dp.nickname}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                                      +{dp.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold">
                                      -{dp.karmaMinus ?? 0}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSelectDemoProfile(dp);
                                        setIsCommunitiesPageOpen(false);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                        isCurrentActive
                                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                                          : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border-slate-700'
                                      }`}
                                    >
                                      {isCurrentActive ? 'Активен (На карту)' : 'Выбрать'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsCommunitiesPageOpen(false);
                                        handleStartEditUserFullCabinet(dp);
                                      }}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border border-slate-700 transition-colors"
                                    >
                                      Редактировать
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDemoProfiles((prev) =>
                                          prev.filter((item) => item.id !== dp.id)
                                        );
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-800/70 transition-colors"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                </div>

                                {/* Описание (слова-теги) */}
                                <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-2">
                                  <span className="text-slate-400 font-semibold mr-1.5">
                                    Описание (теги):
                                  </span>
                                  <span className="text-white font-medium">
                                    {dp.description || '—'}
                                  </span>
                                </div>

                                {/* Нижняя строка карточки: Геолокация + Смена комьюнити */}
                                <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-slate-400 pt-0.5">
                                  <span className="font-mono flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span>
                                      Координаты: <strong className="text-sky-300">{geoLat}, {geoLng}</strong>
                                    </span>
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <span>Комьюнити:</span>
                                    <select
                                      value={dp.communityId || 'community-fedorovka'}
                                      onChange={(e) => {
                                        const nextComm = e.target.value;
                                        setDemoProfiles((prev) =>
                                          prev.map((item) =>
                                            item.id === dp.id
                                              ? {...item, communityId: nextComm}
                                              : item
                                          )
                                        );
                                        if (dp.id === activeDemoProfileId) {
                                          setMyCommunityId(nextComm);
                                        }
                                      }}
                                      className="bg-slate-900 border border-emerald-500/40 rounded-lg px-2 py-1 text-xs font-bold text-emerald-300 focus:outline-none"
                                    >
                                      {demoCommunities.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ПОЛНОЭКРАННАЯ СТРАНИЦА ДОКУМЕНТАЦИИ ПРОЕКТА (DOCS.md) */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-150">
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                DOCS.md · Паспорт проекта
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                GoBell — Архитектура, Инварианты и Экономика
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsDocsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Закрыть доки</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-24">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Аксиома Метамонизма */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-sky-950/50 border-2 border-amber-400/60 shadow-xl space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Философская формула системы (Метамонизм)
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-white">
                  «Единица системы — тег. Пространство — локальное в глобальном поле.»
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-sky-500/40">
                    <div className="font-mono font-extrabold text-sky-300">1. FIX</div>
                    <div className="font-bold text-white mt-0.5">Любой профиль</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Локальная стабилизация узла и базовых тегов в пространстве.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40">
                    <div className="font-mono font-extrabold text-amber-300">2. UNFOLD</div>
                    <div className="font-bold text-white mt-0.5">Объявление (Advert)</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Выход за пределы фиксации профиля — центробежный импульс вовне.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40">
                    <div className="font-mono font-extrabold text-emerald-300">3. DIFF</div>
                    <div className="font-bold text-white mt-0.5">Запрос контакта</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Рождение новой степени свободы — генерация связи между узлами.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/40">
                    <div className="font-mono font-extrabold text-purple-300">4. DISS</div>
                    <div className="font-bold text-white mt-0.5">Сам процесс</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Диссипация тождества — живой диалог и сброс после завершения.
                    </div>
                  </div>
                </div>
              </div>

              {/* Раздел 1: Схема нулевых затрат на карты Google */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                  1. Схема нулевых затрат на карты и геолокацию (Zero-Cost Map Engine)
                </h3>
                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed list-disc pl-5">
                  <li>
                    <strong className="text-white">Отключён платный адресный поиск Google (Places API = $0):</strong> строка поиска работает на 100% в режиме <strong>GoBell</strong> (поиск по нашим словам-тегам и группам в нашей базе).
                  </li>
                  <li>
                    <strong className="text-white">Привязка к GPS смартфона в боевом режиме ($0):</strong> в реальном приложении координаты пользователя берутся напрямую с GPS-датчика его смартфона. Фиксированная привязка к точке на карте используется только в демо-режиме для презентации комьюнити.
                  </li>
                  <li>
                    <strong className="text-white">Использование родного движка карт смартфона (Mobile Native Dynamic Maps = $0):</strong> в мобильном приложении (Android / iOS) используется встроенный системный движок карт телефона (<code>Maps SDK for Android / iOS</code>). По официальным тарифам Google показ карты и переключение режимов <strong>«Карта / Спутник»</strong> на смартфонах бесплатны и не имеют лимитов.
                  </li>
                </ul>
              </div>

              {/* Раздел 2: Тарифная сетка */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-sky-300">
                  2. Тарифная сетка и уровни (FREE · PRO · PRO+ · BUSINESS)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-extrabold text-sky-300">FREE ($0 / бесплатно)</div>
                    <p className="text-slate-300">
                      6 слов в описании профиля, голубой пин, участие в группах, подача сигнала SOS (до 6 слов). Допускается указать @никнейм одним словом для вирусного набора массы.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-1">
                    <div className="font-extrabold text-amber-300">PRO ($5 / мес)</div>
                    <p className="text-slate-300">
                      10 слов в профиле и объявлении, золотой пин, создание 1 своей группы (GO или GC), 1 слот объявления Advert (24ч + автопродление), заработок на Monetize.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-400/60 space-y-1">
                    <div className="font-extrabold text-amber-300">
                      PRO+ (I: $10 · II: $15 · III: $20 / мес)
                    </div>
                    <p className="text-slate-300">
                      Каждый шаг (+$5) добавляет +1 слот Advert, +1 создаваемую группу и +10 слов: PRO + I (2 слота, 2 группы, 20 слов), PRO + II (3 слота, 3 группы, 30 слов), PRO + III (4 слота, 4 группы, 40 слов).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/50 space-y-1">
                    <div className="font-extrabold text-indigo-300">BUSINESS (Рекламодатель)</div>
                    <p className="text-slate-300">
                      До 20 слов в стационарном профиле (фиолетовый пин) + массовая аренда свободных слотов Advert из пула Monetize (по геолокации владельцев или произвольным координатам).
                    </p>
                  </div>
                </div>
              </div>

              {/* Раздел 3: Monetize и Группы */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-300">
                  3. Биржа Monetize (50/50) и Группы (GO / GC)
                </h3>
                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed list-disc pl-5">
                  <li>
                    <strong className="text-white">NATIVE vs GUEST:</strong> собственные объявления PRO помечаются как <code>NATIVE</code>, а арендованные бизнесом через пул Monetize — как <code>GUEST</code> (на карте и в LIST).
                  </li>
                  <li>
                    <strong className="text-white">Распределение дохода Monetize (50 / 50):</strong> 50% стоимости аренды забирает платформа GoBell, 50% зачисляется владельцу PRO-слота (вывод на карту от минимума или оплата подписки PRO / PRO+).
                  </li>
                  <li>
                    <strong className="text-white">Формат групп:</strong> <code>GO-XXXXXX (N)</code> — открытая группа; <code>GC-XXXXXX (N)</code> — закрытая группа (поиск по тегу GC-... находит админа вне зависимости от радиуса).
                  </li>
                </ul>
              </div>

              {/* Раздел 4: Вирусная раскрутка и Краудфандинг */}
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                  4. Стратегия раскрутки (Схема 90-х + Украинский плацдарм в Европе)
                </h3>
                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed list-disc pl-5">
                  <li>
                    <strong className="text-white">Краудфандинг (Матрица с шагом 10):</strong> сумма денежного взноса определяет <strong>срок базовой подписки PRO в годах</strong> (от $1 до $10 = 1 год PRO, от $10 до $20 = 2 года PRO, от $20 до $30 = 3 года PRO и т.д.). А привлечение новых вкладчиков повышает <strong>уровень подписки до PRO+</strong>: от 1 до 10 человек = <strong>PRO + I</strong>, от 10 до 20 человек = <strong>PRO + II</strong>, от 20 до 30+ человек = <strong>PRO + III</strong>. При первом взносе и регистрации участнику автоматически заводится персональная страница со шкалой маркеров результата (без показа сумм взносов) и деревом приглашённых вниз.
                  </li>
                  <li>
                    <strong className="text-white">TOP 100 · Статус «Советник-Депутат GB»:</strong> 100 самых активных пользователей, привлекших наибольшее количество вкладов, получают особый статус <strong>«Советник-Депутат GB»</strong>, эксклюзивный значок <code>★ СОВЕТНИК-ДЕПУТАТ GB</code>, место в <strong>Общественном совете GB с количеством голосов по числу приведённых пользователей (1 приведённый пользователь = 1 голос)</strong> и <strong>личный канал коммуникации с руководством GB</strong>.
                  </li>
                  <li>
                    <strong className="text-white">Ниша «Украинцы в Европе»:</strong> бесплатная раздача статуса PRO землякам с намертво пришитыми к шапке профиля (сверх 10 слотов слов) неудаляемыми тегами <code>#УКРАИНА #UKRAINE</code>. Чужаки и фейки моментально отсекаются самим сообществом через 3 минуса подряд в карму (автобан на 7 дней).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* НИЖНЯЯ ПАНЕЛЬ УПРАВЛЕНИЯ ДЕМО-ВЕРСИЕЙ ПРИЛОЖЕНИЯ (РЕЖИМЫ FREE / PRO / BUSINESS -> ПАНЕЛЬ «ПОЛЬЗОВАТЕЛИ» С КНОПКАМИ SELECT A USER И CREATE A USER) */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-4 py-2.5">
        {/* ПАНЕЛЬ «ПОЛЬЗОВАТЕЛИ» (ОТКРЫВАЕТСЯ ПРИ ВХОДЕ В ЛЮБОЙ РЕЖИМ FREE / PRO / BUSINESS) */}
        {isUsersPanelOpen && (
          <div className="max-w-5xl mx-auto mb-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* ВЕРХНЯЯ ШАПКА ПАНЕЛИ «ПОЛЬЗОВАТЕЛИ» С ДВУМЯ КНОПКАМИ: 1. select a user | 2. create a user */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                    Пользователи
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                      selectedAdminTier === 'FREE'
                        ? 'bg-sky-500 text-slate-950'
                        : selectedAdminTier === 'PRO'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    Режим {selectedAdminTier}
                  </span>
                </div>

                {/* Кнопка 1: select a user (в текущем выбранном Демо-Комьюнити) */}
                <button
                  type="button"
                  onClick={() => setUsersPanelTab('SELECT_USER')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                    usersPanelTab === 'SELECT_USER'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  select a user (
                  {
                    demoProfiles.filter(
                      (dp) =>
                        (dp.communityId || 'community-fedorovka') === activeDemoCommunityId
                    ).length
                  }
                  )
                </button>

                {/* Кнопка 2: create a user (открывает полный Кабинет пользователя в режиме создания) */}
                <button
                  type="button"
                  onClick={handleStartCreateUserFullCabinet}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                    usersPanelTab === 'CREATE_USER'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  create a user
                </button>

                {/* Быстрый переход на отдельную страницу Демо-Комьюнити */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUsersPanelOpen(false);
                    setIsCommunitiesPageOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>
                    Комьюнити:{' '}
                    {demoCommunities.find((c) => c.id === activeDemoCommunityId)?.name ||
                      'Федоровка'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsUsersPanelOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                title="Свернуть панель Пользователи"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* КОНТЕНТ ВКЛАДКИ 1: select a user (Список созданных админом демо-пользователей выбранного комьюнити) */}
            {usersPanelTab === 'SELECT_USER' && (
              <div className="p-4 max-h-72 overflow-y-auto space-y-2.5">
                {demoProfiles.filter(
                  (dp) => (dp.communityId || 'community-fedorovka') === activeDemoCommunityId
                ).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                    В выбранном Демо-Комьюнити пока нет пользователей. Нажмите кнопку{' '}
                    <strong>create a user</strong> вверху, чтобы создать демо-пользователя.
                  </div>
                ) : (
                  demoProfiles
                    .filter(
                      (dp) =>
                        (dp.communityId || 'community-fedorovka') === activeDemoCommunityId
                    )
                    .map((dp) => {
                      const isCurrentActive = dp.id === activeDemoProfileId;
                      const isRowEditing = editingDemoUserId === dp.id;
                      const geoLat = (anchorClusterCenter.lat + dp.latOffset).toFixed(4);
                      const geoLng = (anchorClusterCenter.lng + dp.lngOffset).toFixed(4);

                    return (
                      <div
                        key={dp.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentActive
                            ? 'bg-slate-950 border-sky-400 ring-1 ring-sky-400/30'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Информация о пользователе: 1. 8-значный уникальный тег, 2. Имя профиля, 3. Геолокация */}
                        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                          {/* 8-значный буквенно-числовой уникальный тег пользователя (создаётся системой) */}
                          <span
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-extrabold text-emerald-300 shrink-0"
                            title="Уникальный 8-значный буквенно-числовой тег пользователя"
                          >
                            #{dp.userTag}
                          </span>

                          {/* Уровень профиля */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                              dp.tier === 'FREE'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                : dp.tier === 'PRO'
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            }`}
                          >
                            {dp.tier}
                          </span>

                          {/* Имя профиля и Геолокация (в режиме просмотра или редактирования) */}
                          {isRowEditing ? (
                            <div className="flex items-center gap-2 flex-wrap flex-1">
                              <input
                                type="text"
                                value={editDemoNameDraft}
                                onChange={(e) => setEditDemoNameDraft(e.target.value)}
                                placeholder="Имя профиля"
                                className="bg-slate-900 border border-sky-400 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none w-36"
                              />
                              <input
                                type="text"
                                value={editDemoLatDraft}
                                onChange={(e) => setEditDemoLatDraft(e.target.value)}
                                placeholder="Широта (Lat)"
                                className="bg-slate-900 border border-sky-400 rounded-lg px-2 py-1 text-xs font-mono text-sky-300 focus:outline-none w-24"
                              />
                              <input
                                type="text"
                                value={editDemoLngDraft}
                                onChange={(e) => setEditDemoLngDraft(e.target.value)}
                                placeholder="Долгота (Lng)"
                                className="bg-slate-900 border border-sky-400 rounded-lg px-2 py-1 text-xs font-mono text-sky-300 focus:outline-none w-24"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 flex-wrap min-w-0">
                              <span className="text-sm font-bold text-white truncate">
                                {dp.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                                +{dp.karmaPlus ?? DEFAULT_STARTING_KARMA_PLUS}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] font-bold">
                                -{dp.karmaMinus ?? 0}
                              </span>
                              {dp.bannedUntilMs && nowMs < dp.bannedUntilMs ? (
                                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-extrabold uppercase">
                                  БАН НА НЕДЕЛЮ ({formatBanDurationDaysHMS(dp.bannedUntilMs - nowMs)})
                                </span>
                              ) : (dp.consecutiveMinuses ?? 0) > 0 ? (
                                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                                  Минусов подряд: {dp.consecutiveMinuses}/3
                                </span>
                              ) : null}
                              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span>
                                  Геолокация: <strong className="text-slate-200">{geoLat}, {geoLng}</strong>
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Маленькие кнопки управления справа: Перейти | Редактировать / Применить | Удалить */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Кнопка Перейти */}
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectDemoProfile(dp);
                              setIsUsersPanelOpen(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              isCurrentActive
                                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                                : 'bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border-slate-700'
                            }`}
                          >
                            {isCurrentActive ? 'Активен (Перейти)' : 'Перейти'}
                          </button>

                          {/* Кнопка Редактировать (открывает полный Кабинет этого пользователя для редактирования всех разделов) */}
                          <button
                            type="button"
                            onClick={() => handleStartEditUserFullCabinet(dp)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border-slate-700"
                          >
                            Редактировать
                          </button>

                          {/* Кнопка Удалить */}
                          <button
                            type="button"
                            onClick={() => {
                              setDemoProfiles((prev) => prev.filter((item) => item.id !== dp.id));
                              if (editingDemoUserId === dp.id) {
                                setEditingDemoUserId(null);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-800/70 transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* КОНТЕНТ ВКЛАДКИ 2: create a user (Переход в полный Кабинет пользователя для создания) */}
            {usersPanelTab === 'CREATE_USER' && (
              <div className="p-5 flex items-center justify-between gap-4 flex-wrap bg-slate-950">
                <div className="text-xs text-slate-300">
                  В режиме создания и редактирования пользователя используется{' '}
                  <strong className="text-white">полный Кабинет пользователя</strong> (все вкладки:{' '}
                  <span className="text-sky-300">Profile, Groups, Advert, SOS, Chat, Settings</span>
                  ) для уровня <strong className="text-emerald-300">{selectedAdminTier}</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleStartCreateUserFullCabinet}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-lg transition-colors"
                >
                  Открыть полный кабинет (create a user)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Основная строка нижней панели управления демо-версией: Режимы FREE / PRO / BUSINESS */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sky-400">
              Демо-версия · Управление режимами
            </span>

            {/* Кнопки режимов FREE / PRO / BUSINESS -> при входе открывается панель «Пользователи» */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['FREE', 'PRO', 'BUSINESS'] as AccountTier[]).map((tier) => {
                const active = currentAccountTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handleSwitchActiveDemoTier(tier)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      active
                        ? tier === 'FREE'
                          ? 'bg-sky-500 text-slate-950 shadow-sm'
                          : tier === 'PRO'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-indigo-500 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white bg-slate-950/60'
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Текущий активный демо-профиль и кнопка открытия панели «Пользователи» */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {(() => {
              const currentDp = demoProfiles.find((d) => d.id === activeDemoProfileId);
              return (
                currentDp && (
                  <div className="text-xs text-slate-300 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="font-mono text-emerald-300 font-bold">
                      #{currentDp.userTag}
                    </span>
                    <strong className="text-white">{currentDp.name}</strong>
                    <span className="text-slate-400">({currentDp.tier})</span>
                  </div>
                )
              );
            })()}

            <button
              type="button"
              onClick={() => setIsDocsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-amber-500/60 bg-amber-500/15 hover:bg-amber-400 hover:text-slate-950 text-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
              title="Открыть документацию проекта GoBell (DOCS.md)"
            >
              <span>Доки</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCommunitiesPageOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-emerald-500/60 bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 transition-all flex items-center gap-1.5 shadow-sm"
              title="Открыть отдельную страницу Демо-Комьюнити и список пользователей выбранного комьюнити"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>
                Демо-Комьюнити:{' '}
                {demoCommunities.find((c) => c.id === activeDemoCommunityId)?.name ||
                  'Федоровка'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsUsersPanelOpen((prev) => !prev)}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                isUsersPanelOpen
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>
                Пользователи (
                {
                  demoProfiles.filter(
                    (dp) =>
                      (dp.communityId || 'community-fedorovka') === activeDemoCommunityId
                  ).length
                }
                )
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Космический 3D Wireframe симулятор GoBell: ELITE (ZX Spectrum 1984) с выбором миссий из экосистемы GoBell */}
      <GoBellEliteGame
        isOpen={isEliteGameOpen}
        onClose={() => setIsEliteGameOpen(false)}
        pilotName={profileName || profileNickname || 'Командор'}
        isSmartphoneGeoActive={settingsAutoGeo}
        smartphoneGeoCoords={{
          lat: anchorClusterCenter.lat + myPositionOffset.lat,
          lng: anchorClusterCenter.lng + myPositionOffset.lng,
        }}
        pilotProfileTags={myExtractedWordTags.filter((t) => t.active).map((t) => t.word)}
        onToggleSmartphoneGeo={(active) => {
          setSettingsAutoGeo(active);
          if (active) {
            const fallbackPos = {
              lat: anchorClusterCenter.lat + myPositionOffset.lat,
              lng: anchorClusterCenter.lng + myPositionOffset.lng,
            };
            setUserPhysicalGeo(fallbackPos);
            setSearchCenter(fallbackPos);
            setActiveMarkerId('my-own-profile');
            map?.panTo(fallbackPos);
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const realCoords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  };
                  setUserPhysicalGeo(realCoords);
                },
                () => {
                  // В демо-среде используем координаты профиля
                },
                {timeout: 4000}
              );
            }
          }
        }}
        onViewPlayerOnRealMap={() => {
          setIsEliteGameOpen(false);
          const myPos = {
            lat: anchorClusterCenter.lat + myPositionOffset.lat,
            lng: anchorClusterCenter.lng + myPositionOffset.lng,
          };
          setSearchCenter(myPos);
          setActiveMarkerId('my-own-profile');
          setHoveredMarkerId('my-own-profile');
          map?.panTo(myPos);
          map?.setZoom(15);
        }}
        missionSeeds={allActiveProfiles
          .filter(
            (p) =>
              p.category === 'ADVERT' || p.category === 'SOS' || p.category === 'BUSINESS'
          )
          .map((p) => ({
            id: p.id,
            authorName: p.authorName,
            text: p.profileText,
            category: (p.category || 'ADVERT') as GoBellMissionSeed['category'],
            karmaPlus: p.karmaPlus,
          }))}
        onEarnKarmaAndBonus={(karmaDelta) => {
          setMyKarmaPlus((prev) => prev + karmaDelta);
        }}
        onChangeGoBellTariff={(tariff, joinedPlanetGroupTags) => {
          if (tariff === 'FREE') {
            setCurrentAccountTier('FREE');
          } else if (tariff === 'BUSINESS') {
            setCurrentAccountTier('BUSINESS');
          } else {
            setCurrentAccountTier('PRO');
            setMyProPackage(tariff);
          }
          setGroupSlots(
            Array.from({length: Math.max(3, joinedPlanetGroupTags.length)}, (_, idx) => {
              const tag = joinedPlanetGroupTags[idx] || '';
              return {
                slotId: idx + 1,
                tag,
                tagDraft: tag,
                isEditing: false,
                adminApproved: true,
              };
            })
          );
        }}
        onSendPlanetContactRequest={(payload) => {
          const nowTime = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const requestMsg: ChatMessageItem = {
            id: `msg-planet-req-${Date.now()}`,
            sender: 'me',
            text: `🪐 Запрос на контакт (Планета ${payload.planetName}): ${payload.note}`,
            time: nowTime,
          };
          const replyMsg: ChatMessageItem = {
            id: `msg-planet-reply-${Date.now() + 1}`,
            sender: 'partner',
            text: `Приветствуем с орбиты планеты ${payload.planetName}! Ваш запрос на контакт получен объектом «${payload.name}». Канал связи GoBell открыт.`,
            time: nowTime,
          };

          setActiveChatSession({
            partnerId: payload.id,
            partnerName: payload.name,
            partnerKarmaPlus: payload.karmaPlus,
            partnerKarmaMinus: 0,
            partnerCategory: payload.category,
            initialNote: payload.note,
            isGroupChat: payload.category === 'GROUPS',
            groupTag: payload.groupTag,
            mode: 'TEXT',
            messages: [requestMsg, replyMsg],
            myRatedPartner: null,
            partnerRatedMe: null,
          });
          setChatSystemNotice({
            type: 'accepted',
            text: `Канал связи с объектом «${payload.name}» (Планета ${payload.planetName}) открыт.`,
          });

          if (payload.openChatAfterSend) {
            setIsEliteGameOpen(false);
            setIsCabinetOpen(true);
            setCabinetTab('CHAT');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {!API_KEY ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-white">
              Ключ Google Maps API не найден
            </h2>
            <p className="text-xs text-slate-400">
              Проверьте переменную окружения <code className="text-sky-300">VITE_GOOGLE_MAPS_API_KEY</code>.
            </p>
          </div>
        </div>
      ) : (
        <APIProvider apiKey={API_KEY}>
          <HybridMapContent />
        </APIProvider>
      )}
    </div>
  );
}
