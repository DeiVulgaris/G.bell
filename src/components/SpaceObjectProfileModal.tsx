import React, {useState, useEffect} from 'react';
import {
  X,
  User,
  Users,
  ShieldCheck,
  Sparkles,
  Navigation,
  MessageSquare,
  Check,
  Compass,
} from 'lucide-react';
import {
  AsteroidElementSymbol,
  ASTEROID_PERIODIC_ELEMENTS,
  GoBellSpaceTariff,
  GOBELL_SPACE_TARIFF_META,
} from './GoBellEliteGame';
import { KuiperBeltBodyDef } from '../data/kuiperBeltData';
import {
  CapturedPlanetClanRecord,
  ClanAffiliationKind,
  CLAN_AND_UNION_PRESETS,
  StandardDictatorPlanet,
  calculatePlanetAuctionValuationCr,
  formatCapturedPlanetFullTitle,
} from '../data/standardDictatorWorlds';
import {
  getStarRadiationProfile,
  StellarRadiationProfile,
} from '../data/stellarPhysicsEngine';

export type SpaceObjectProfileKind =
  | 'STAR'
  | 'PLANET'
  | 'GROUP'
  | 'BUSINESS'
  | 'ADVERT'
  | 'LOGISTICS_MODULE'
  | 'CARGO'
  | 'SPACE_DEBRIS'
  | 'ASTEROID'
  | 'STATION'
  | 'COMBAT_SHIP'
  | 'SOS_POD'
  | 'SUBSPACE_BEACON';

export interface SpaceObjectAdvertSlot {
  slotId: number;
  title: string;
  description: string;
  authorName: string;
  karmaPlus: number;
  karmaMinus: number;
}

export interface ConstellationStarJumpItem {
  starId: string;
  starName: string;
  spectralColor: string;
  spectralNote: string;
  distanceLightYears: string;
  targetSystemId: number;
  isHoveredStar?: boolean;
  starRad?: StellarRadiationProfile;
}

export interface SpaceObjectProfileData {
  id: string;
  kind: SpaceObjectProfileKind;
  systemTag: string;
  color: string;
  // Core profile fields (matching User Profile in GoBell)
  name: string;
  nickname: string;
  description: string;
  groupsTitle: string;
  groupsDescription: string;
  groupTag?: string;
  businessesTitle: string;
  businessesDescription: string;
  adverts?: SpaceObjectAdvertSlot[];
  constellationStars?: ConstellationStarJumpItem[];
  karmaPlus: number;
  karmaMinus: number;
  distanceUnits: number;
  coordsLabel: string;
  // Screen anchor coordinates so the card appears right next to the object
  canvasX?: number;
  canvasY?: number;
  anchorLeftPx?: number;
  anchorTopPx?: number;
  screenRadiusPx?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  // Optional domain-specific metadata for interactive actions
  planetOrder?: number; // 1=Меркурий, 2=Венера, 3=Земля, 4=Марс
  planetCleanName?: string;
  dictatorPlanetIndex?: number; // 1..284
  officialPlanetName?: string;
  folkPlanetName?: string;
  starSystemTitle?: string;
  entityId?: string;
  asteroidId?: string;
  asteroidRevealed?: boolean;
  asteroidIsValuable?: boolean;
  elementSymbol?: AsteroidElementSymbol;
  routeFromPlanet?: string;
  routeToPlanet?: string;
  routePhaseLabel?: string;
  routeProgressPct?: number;
  orbitWaitSec?: number;
  cargoResourceLabel?: string;
  engineType?: string;
  engineTypeLabelRu?: string;
  shipMassTons?: number;
  shipMaxMassTons?: number;
  playerHitTons?: number;
  solarFluxPct?: number;
  noContactsAllowed?: boolean;
  isKuiperBelt?: boolean;
  kuiperMeta?: KuiperBeltBodyDef;
  initialTab?: 'PROFILE' | 'GROUPS' | 'BUSINESS' | 'CONTACT';
}

export interface CustomObjectProfileOverride {
  name?: string;
  nickname?: string;
  description?: string;
  showName?: boolean;
  showNickname?: boolean;
  showDescription?: boolean;
  disabledTags?: string[];
  karmaDeltaPlus?: number;
  karmaDeltaMinus?: number;
}

interface SpaceObjectProfileModalProps {
  profile: SpaceObjectProfileData | null;
  onClose: () => void;
  isFullPlacard?: boolean;
  onToggleFullPlacard?: (full: boolean) => void;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
  customOverrides: Record<string, CustomObjectProfileOverride>;
  onUpdateCustomOverride: (
    objectId: string,
    patch: Partial<CustomObjectProfileOverride>
  ) => void;
  // Interactive game actions (close to User Profile functions)
  joinedPlanetGroups: string[];
  maxAllowedPlanetGroups: number;
  gobellTariff: GoBellSpaceTariff;
  onToggleJoinPlanetGroup: (groupTag: string, planetCleanName: string) => void;
  onSelectGoBellTariff: (tariff: GoBellSpaceTariff) => void;
  onSupplyFromPlanet: (planetOrder: number) => void;
  onDeliverGovernmentContract: (
    targetPlanetName: string,
    resourceType: 'IRON' | 'ALUMINUM' | 'FOOD_WATER' | 'TITANIUM' | 'RARE_ELEMENTS'
  ) => void;
  onSellAllPeriodicElements: () => void;
  onFocusObjectInSpace: (profile: SpaceObjectProfileData) => void;
  onToggleStationaryOrbit: () => void;
  isStationaryOrbitLocked: boolean;
  onTractorCaptureObject?: (profile: SpaceObjectProfileData) => void;
  onDestroyObjectAsAsteroid?: (profile: SpaceObjectProfileData) => void;
  onDockStation?: () => void;
  onHyperspaceJumpToConstellationStar?: (
    starItem: ConstellationStarJumpItem,
    constellationName: string
  ) => void;
  onSendContactRequest: (
    targetName: string,
    planetOrSectorName: string,
    category: 'GROUPS' | 'BUSINESS' | 'ADVERT',
    note: string,
    groupTag?: string
  ) => void;
  // Захват планет, переименование («Метадонг - бывший Шлак-9 · клан Розовой бабочки»), доход и Галактический Аукцион
  capturedPlanetsMap?: Record<number, CapturedPlanetClanRecord>;
  activeSystemDictatorPlanets?: [
    StandardDictatorPlanet,
    StandardDictatorPlanet,
    StandardDictatorPlanet,
    StandardDictatorPlanet,
  ];
  onCaptureAndAnnexPlanet?: (payload: {
    orbitOrder: 1 | 2 | 3 | 4;
    customName: string;
    formerName: string;
    affiliationKind: ClanAffiliationKind;
    clanOrUnionName: string;
    clanIcon: string;
    clanColor: string;
    applyToEntireSystem?: boolean;
  }) => void;
  onCollectPlanetClanIncomeNow?: (
    planetIndex: number,
    applyToEntireSystem?: boolean
  ) => void;
  onUpgradePlanetClanInfrastructure?: (planetIndex: number) => void;
  onRaisePlanetAuctionBid?: (planetIndex: number) => void;
  onSellPlanetOnAuction?: (planetIndex: number, sellEntireSystem?: boolean) => void;
  // Live stocks for button labels
  ironStock: number;
  aluminumStock: number;
  foodWaterCargoStock: number;
  titaniumStock: number;
  usedCargoTons: number;
  maxCargoCapacity: number;
  isPirateStatus: boolean;
  pirateBuyMultiplier: number;
  pirateSellDivisor: number;
}

function extractObjectWordTags(text: string): {word: string; normalized: string}[] {
  const rawWords = text
    .replace(/[.,!?;:()[\]«»"']/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);
  const seen = new Set<string>();
  const result: {word: string; normalized: string}[] = [];
  for (const w of rawWords) {
    const norm = w.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push({word: w, normalized: norm});
    }
  }
  return result;
}

export const SpaceObjectProfileModal: React.FC<SpaceObjectProfileModalProps> = ({
  profile,
  onClose,
  isFullPlacard = false,
  onToggleFullPlacard,
  onMouseEnterCard,
  onMouseLeaveCard,
  customOverrides,
  onUpdateCustomOverride,
  joinedPlanetGroups,
  maxAllowedPlanetGroups,
  gobellTariff,
  onToggleJoinPlanetGroup,
  onSelectGoBellTariff,
  onSupplyFromPlanet,
  onDeliverGovernmentContract,
  onSellAllPeriodicElements,
  onFocusObjectInSpace,
  onToggleStationaryOrbit,
  isStationaryOrbitLocked,
  onTractorCaptureObject,
  onDestroyObjectAsAsteroid,
  onDockStation,
  onHyperspaceJumpToConstellationStar,
  onSendContactRequest,
  capturedPlanetsMap = {},
  activeSystemDictatorPlanets,
  onCaptureAndAnnexPlanet,
  onCollectPlanetClanIncomeNow,
  onUpgradePlanetClanInfrastructure,
  onRaisePlanetAuctionBid,
  onSellPlanetOnAuction,
  ironStock,
  aluminumStock,
  foodWaterCargoStock,
  titaniumStock,
  usedCargoTons,
  maxCargoCapacity,
  isPirateStatus,
  pirateBuyMultiplier,
  pirateSellDivisor,
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'GROUPS' | 'BUSINESS' | 'CONTACT'>(
    'PROFILE'
  );

  // Editing states for Name, Nickname, Description (matching User Profile in GoBell)
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  // Форма захвата планеты, переименования («Метадонг - бывший Шлак-9»), присоединения к клану/союзу («клан Розовой бабочки») и аукциона
  const [clanNewNameDraft, setClanNewNameDraft] = useState('Метадонг');
  const [clanFormerNameDraft, setClanFormerNameDraft] = useState('Шлак-9');
  const [clanKindDraft, setClanKindDraft] = useState<ClanAffiliationKind>('CLAN');
  const [clanTitleDraft, setClanTitleDraft] = useState('клан Розовой бабочки');
  const [clanIconDraft, setClanIconDraft] = useState('🦋');
  const [clanColorDraft, setClanColorDraft] = useState('#f472b6');
  const [clanPanelMode, setClanPanelMode] = useState<'CLAN_INCOME' | 'AUCTION'>('CLAN_INCOME');
  const [clanActionFeedback, setClanActionFeedback] = useState<string | null>(null);

  // Contact form note inside the profile
  const [contactNote, setContactNote] = useState('');
  const [contactSentBanner, setContactSentBanner] = useState<string | null>(null);
  const [cardCorner, setCardCorner] = useState<
    'TOP_RIGHT' | 'TOP_LEFT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT'
  >('TOP_RIGHT');

  const resolvedDictatorPlanet =
    profile?.kind === 'PLANET' && profile.planetOrder && activeSystemDictatorPlanets
      ? activeSystemDictatorPlanets[(profile.planetOrder - 1) as 0 | 1 | 2 | 3]
      : undefined;

  const resolvedPlanetIndex =
    profile?.dictatorPlanetIndex || resolvedDictatorPlanet?.index || 0;

  const capturedPlanetRec =
    resolvedPlanetIndex > 0 ? capturedPlanetsMap[resolvedPlanetIndex] : undefined;

  useEffect(() => {
    if (!profile) return;
    setActiveTab(profile.initialTab || 'PROFILE');
    setIsEditingName(false);
    setIsEditingNickname(false);
    setIsEditingDescription(false);
    setContactSentBanner(null);
    setClanActionFeedback(null);
    const ov = customOverrides[profile.id];
    const currentName = ov?.name ?? profile.name;
    const currentNick = ov?.nickname ?? profile.nickname;
    setContactNote(
      `Приветствую, «${currentName}» (${currentNick})! Запрашиваю канал связи и синхронизацию с борта Cobra Mk III.`
    );

    if (profile.kind === 'PLANET') {
      const pIdx =
        profile.dictatorPlanetIndex ||
        (profile.planetOrder && activeSystemDictatorPlanets
          ? activeSystemDictatorPlanets[(profile.planetOrder - 1) as 0 | 1 | 2 | 3]?.index
          : 0) ||
        0;
      const cap = pIdx ? capturedPlanetsMap[pIdx] : undefined;
      const defaultFormer =
        cap?.formerName ||
        profile.folkPlanetName ||
        resolvedDictatorPlanet?.folkName ||
        profile.planetCleanName ||
        'Шлак-9';
      setClanFormerNameDraft(defaultFormer);
      setClanNewNameDraft(cap?.customName || 'Метадонг');
      setClanKindDraft(cap?.affiliationKind || 'CLAN');
      setClanTitleDraft(cap?.clanOrUnionName || 'клан Розовой бабочки');
      setClanIconDraft(cap?.clanIcon || '🦋');
      setClanColorDraft(cap?.clanColor || '#f472b6');
    }
  }, [profile?.id, profile?.initialTab, resolvedPlanetIndex]);

  // Закрытие таблички по «0» (Digit0 / Numpad0) или Escape, открытие полной таблички по «,» (запятая рядом с 0)
  useEffect(() => {
    if (!profile) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.isContentEditable)
      ) {
        if (e.key === 'Escape') {
          targetEl.blur();
        }
        return;
      }
      if (
        e.key === 'Escape' ||
        e.code === 'Digit0' ||
        e.code === 'Numpad0' ||
        e.key === '0'
      ) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (
        e.code === 'NumpadDecimal' ||
        e.code === 'Comma' ||
        e.code === 'Period' ||
        e.code === 'Slash' ||
        e.key === ',' ||
        e.key === '.'
      ) {
        e.preventDefault();
        e.stopPropagation();
        onToggleFullPlacard?.(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [profile, onClose, onToggleFullPlacard]);

  if (!profile) return null;

  const ov = customOverrides[profile.id] || {};
  const displayName = ov.name ?? profile.name;
  const displayNickname = ov.nickname ?? profile.nickname;
  const displayDescription = ov.description ?? profile.description;
  const showName = ov.showName ?? true;
  const showNickname = ov.showNickname ?? true;
  const showDescription = ov.showDescription ?? true;
  const disabledTags = ov.disabledTags || [];
  const totalKarmaPlus = profile.karmaPlus + (ov.karmaDeltaPlus || 0);
  const totalKarmaMinus = profile.karmaMinus + (ov.karmaDeltaMinus || 0);

  // Extract tags from visible fields (Name + Nickname + Description + Groups + Businesses)
  const combinedTagSource = [
    showName ? displayName : '',
    showNickname ? displayNickname : '',
    showDescription ? displayDescription : '',
    profile.groupsTitle,
    profile.businessesTitle,
  ]
    .filter(Boolean)
    .join(' ');
  const extractedTags = extractObjectWordTags(combinedTagSource);

  const toggleWordTag = (normalized: string) => {
    const exists = disabledTags.includes(normalized);
    const nextDisabled = exists
      ? disabledTags.filter((t) => t !== normalized)
      : [...disabledTags, normalized];
    onUpdateCustomOverride(profile.id, {disabledTags: nextDisabled});
  };

  const kindBadgeLabel: Record<SpaceObjectProfileKind, string> = {
    STAR: 'ЗВЕЗДА · СОЛНЦЕ',
    PLANET: 'ПЛАНЕТА СИСТЕМЫ',
    GROUP: 'ГРУППА ПЛАНЕТЫ',
    BUSINESS: 'БИЗНЕС ПЛАНЕТЫ',
    ADVERT: 'ОБЪЯВЛЕНИЕ БИЗНЕСА',
    LOGISTICS_MODULE: 'АВТОМАТИЧЕСКИЙ МОДУЛЬ',
    CARGO: 'ГРУЗ НА ТРАЕКТОРИИ',
    SPACE_DEBRIS: 'МУСОР НА ТРАЕКТОРИИ',
    ASTEROID: 'ПОЯС АСТЕРОИДОВ',
    STATION: 'ОРБИТАЛЬНАЯ СТАНЦИЯ',
    COMBAT_SHIP: 'КОРАБЛЬ В СЕКТОРЕ',
    SOS_POD: 'СПАСАТЕЛЬНАЯ КАПСУЛА',
    SUBSPACE_BEACON: 'КАНАЛ ФИКСАЦИИ',
  };

  const pTag =
    profile.groupTag ||
    (profile.planetOrder === 1
      ? 'GO-MERCURY'
      : profile.planetOrder === 2
      ? 'GO-VENUS'
      : profile.planetOrder === 3
      ? 'GO-EARTH'
      : profile.planetOrder === 4
      ? 'GO-MARS'
      : undefined);

  const isMemberOfPlanetGroup = pTag ? joinedPlanetGroups.includes(pTag) : false;

  // Размещаем информационную карточку объекта аккуратно в углу 3D-экрана, чтобы она не закрывала обзор в центре
  const contW = profile.viewportWidth || 760;
  const contH = profile.viewportHeight || 480;
  const cardW = Math.min(profile.kind === 'PLANET' ? 405 : 360, Math.max(280, contW - 20));
  const maxCardH = Math.min(profile.kind === 'PLANET' ? 445 : 390, Math.max(240, Math.floor(contH * 0.76)));

  const previewRecForAuction: CapturedPlanetClanRecord = capturedPlanetRec || {
    planetIndex: resolvedPlanetIndex || 1,
    starSlotIndex: resolvedDictatorPlanet?.starSlotIndex ?? 0,
    orbitOrder: (profile.planetOrder as 1 | 2 | 3 | 4) || 1,
    isCaptured: false,
    capturedAtMs: Date.now(),
    customName: clanNewNameDraft || 'Метадонг',
    formerName: clanFormerNameDraft || 'Шлак-9',
    formerOfficialName:
      profile.officialPlanetName ||
      resolvedDictatorPlanet?.officialName ||
      profile.planetCleanName ||
      'Сектор Омега-7',
    affiliationKind: clanKindDraft,
    clanOrUnionName: clanTitleDraft || 'клан Розовой бабочки',
    clanIcon: clanIconDraft || '🦋',
    clanColor: clanColorDraft || '#f472b6',
    incomePerCycleCr: 35,
    infrastructureLevel: 1,
    totalEarnedCr: 0,
    auctionBiddingRound: 0,
  };
  const auctionValuation = calculatePlanetAuctionValuationCr(previewRecForAuction);
  const fullSystemAuctionPriceCr = Math.round(auctionValuation.totalBidCr * 4 * 1.3);

  const cornerPosStyle: React.CSSProperties = isFullPlacard
    ? {
        top: '10px',
        left: '10px',
        right: '10px',
        bottom: '10px',
      }
    : cardCorner === 'TOP_RIGHT'
    ? {top: '48px', right: '18px', width: `${cardW}px`, maxHeight: `${maxCardH}px`}
    : cardCorner === 'TOP_LEFT'
    ? {top: '48px', left: '18px', width: `${cardW}px`, maxHeight: `${maxCardH}px`}
    : cardCorner === 'BOTTOM_RIGHT'
    ? {bottom: '18px', right: '18px', width: `${cardW}px`, maxHeight: `${maxCardH}px`}
    : {bottom: '18px', left: '18px', width: `${cardW}px`, maxHeight: `${maxCardH}px`};

  return (
    <div
      onMouseEnter={() => {
        onMouseEnterCard?.();
      }}
      onMouseMove={(e) => {
        e.stopPropagation();
        onMouseEnterCard?.();
      }}
      onMouseLeave={onMouseLeaveCard}
      style={cornerPosStyle}
      className={`absolute ${
        isFullPlacard ? 'z-50' : 'z-40'
      } pointer-events-auto bg-slate-950/95 backdrop-blur-md border-2 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.55)] overflow-hidden flex flex-col font-sans select-text animate-in fade-in zoom-in-95 duration-100`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Информационная полоса управления табличкой: [ , ] Полная табличка · [ 0 ] Закрыть табличку · Огневая рубка зафиксирована */}
      <div className="px-3 py-1.5 bg-gradient-to-r from-cyan-950/95 via-slate-900/95 to-fuchsia-950/95 border-b border-cyan-500/40 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-cyan-200">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-mono">
            🔒 ОГНЕВАЯ РУБКА ЗАФИКСИРОВАНА
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Курсор свободен (движение мыши к краю не вращает рубку)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleFullPlacard && (
            <button
              type="button"
              onClick={() => onToggleFullPlacard(!isFullPlacard)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 ${
                isFullPlacard
                  ? 'bg-cyan-500/20 hover:bg-cyan-400 hover:text-slate-950 text-cyan-200 border-cyan-400'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-yellow-200 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
              }`}
              title="Клавиша «,» (рядом с 0) — открыть полную табличку со всеми разделами"
            >
              <span>{isFullPlacard ? '📐 Компактный вид' : '📋 ПОЛНАЯ ТАБЛИЧКА'}</span>
              <span className="px-1 py-0 rounded bg-slate-950/80 text-amber-300 font-mono text-[9px]">
                [ , ]
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 hover:bg-rose-500 text-white border border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.45)] transition-all flex items-center gap-1"
            title="Клавиша «0» — закрыть табличку и разблокировать огневую рубку"
          >
            <span>✕ ЗАКРЫТЬ</span>
            <span className="px-1 py-0 rounded bg-slate-950/80 text-rose-200 font-mono text-[9px]">
              [ 0 ]
            </span>
          </button>
        </div>
      </div>

      {/* Верхняя шапка карточки объекта */}
      <div
        className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2"
        style={{borderTopColor: profile.color}}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl bg-slate-950 border-2 flex items-center justify-center shrink-0 font-mono font-black text-sm shadow-inner"
            style={{borderColor: profile.color, color: profile.color}}
          >
            {profile.kind === 'STAR' && '★'}
            {profile.kind === 'PLANET' && '🌍'}
            {profile.kind === 'GROUP' && '👥'}
            {profile.kind === 'BUSINESS' && '💼'}
            {profile.kind === 'ADVERT' && '📢'}
            {profile.kind === 'LOGISTICS_MODULE' && '🛰'}
            {profile.kind === 'CARGO' && '📦'}
            {profile.kind === 'SPACE_DEBRIS' && '🪨'}
            {profile.kind === 'ASTEROID' && '❖'}
            {profile.kind === 'STATION' && '⬡'}
            {profile.kind === 'COMBAT_SHIP' && '⚔'}
            {profile.kind === 'SOS_POD' && '🆘'}
            {profile.kind === 'SUBSPACE_BEACON' && '📡'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border"
                style={{
                  borderColor: profile.color,
                  color: profile.color,
                  backgroundColor: 'rgba(2, 6, 23, 0.9)',
                }}
              >
                {kindBadgeLabel[profile.kind]}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {profile.distanceUnits} ед.
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 text-xs font-extrabold text-white truncate">
              <span className="truncate">{showName ? displayName : 'Имя скрыто'}</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-300 font-mono text-[11px] truncate">
                {showNickname ? displayNickname : 'Ник скрыт'}
              </span>
            </div>
          </div>
        </div>

        {/* Карма объекта (+ / -) и кнопка закрытия */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1">
            <button
              type="button"
              onClick={() =>
                onUpdateCustomOverride(profile.id, {
                  karmaDeltaPlus: (ov.karmaDeltaPlus || 0) + 1,
                })
              }
              className="px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-400/60 text-emerald-300 transition-colors"
              title="Оценить объект положительно (+1 в карму)"
            >
              +{totalKarmaPlus}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateCustomOverride(profile.id, {
                  karmaDeltaMinus: (ov.karmaDeltaMinus || 0) + 1,
                })
              }
              className="px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-400/60 text-rose-300 transition-colors"
              title="Оценить объект отрицательно (-1 в карму)"
            >
              -{totalKarmaMinus}
            </button>
          </div>

          {!isFullPlacard && (
            <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              {(
                [
                  {id: 'TOP_LEFT', label: '↖', title: 'В левый верхний угол'},
                  {id: 'TOP_RIGHT', label: '↗', title: 'В правый верхний угол'},
                  {id: 'BOTTOM_LEFT', label: '↙', title: 'В левый нижний угол'},
                  {id: 'BOTTOM_RIGHT', label: '↘', title: 'В правый нижний угол'},
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardCorner(c.id)}
                  className={`px-1 py-0.5 rounded text-[9px] font-bold transition-colors ${
                    cardCorner === c.id
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={c.title}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors"
            title="Закрыть табличку [0 / I / Esc]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Компактные вкладки карточки объекта (как в профиле пользователя GoBell) */}
      <div
        className={`px-3 py-1.5 bg-slate-950 border-b border-slate-800 grid ${
          profile.noContactsAllowed ? 'grid-cols-1' : 'grid-cols-4'
        } gap-1`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('PROFILE')}
          className={`py-1 px-1.5 rounded-lg text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'PROFILE'
              ? 'bg-cyan-400 text-slate-950'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <User className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {profile.noContactsAllowed
              ? 'Профиль автономного корабля (Без контактов · Можно уничтожить и забрать груз)'
              : 'Профиль'}
          </span>
        </button>

        {!profile.noContactsAllowed && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('GROUPS')}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'GROUPS'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-3 h-3 shrink-0" />
              <span className="truncate">Группы</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BUSINESS')}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'BUSINESS'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="truncate">Бизнесы</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CONTACT')}
              className={`py-1 px-1.5 rounded-lg text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'CONTACT'
                  ? 'bg-sky-400 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <MessageSquare className="w-3 h-3 shrink-0" />
              <span className="truncate">Контакт</span>
            </button>
          </>
        )}
      </div>

      {/* Содержимое карточки объекта (в режиме Полной таблички [ , ] отображаются сразу все разделы в 2 колонки) */}
      <div
        className={`p-3 overflow-y-auto text-[11px] text-slate-200 flex-1 ${
          isFullPlacard && !profile.noContactsAllowed
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-3 items-start'
            : 'space-y-2.5'
        }`}
      >
        {/* ВКЛАДКА 1: ПРОФИЛЬ ОБЪЕКТА (ИМЯ, НИКНЕЙМ, СУВЕРЕНИТЕТ / КЛАН / АУКЦИОН, ОПИСАНИЕ) */}
        {(activeTab === 'PROFILE' || isFullPlacard) && (
          <div
            className={`space-y-2.5 ${
              isFullPlacard && !profile.noContactsAllowed ? 'lg:col-span-7' : ''
            }`}
          >
            {/* СПЕЦИАЛЬНЫЙ АСТРОФИЗИЧЕСКИЙ БЛОК: КЛАСС ЗВЕЗДЫ, ФОТОННЫЙ И ГАММАКВАНТОВЫЙ ПОТЕНЦИАЛ ГЭУ */}
            {profile.kind === 'STAR' && (() => {
              const starRad = getStarRadiationProfile(`${profile.name} ${profile.nickname} ${profile.description}`);
              return (
                <div
                  className="p-3 rounded-xl border-2 space-y-2.5 shadow-lg bg-slate-950/95"
                  style={{borderColor: starRad.starColorHex}}
                >
                  <div className="flex items-center justify-between gap-1.5 flex-wrap border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-lg leading-none font-black"
                        style={{color: starRad.starColorHex}}
                      >
                        ★
                      </span>
                      <div>
                        <div className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                          <span>{starRad.badgeShort}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Температура: {starRad.surfaceTempLabel} &middot; Спектр: {starRad.spectralCode}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded font-black font-mono text-[10px] border ${
                        starRad.isGiant
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                          : starRad.isDwarf
                          ? 'bg-rose-950/80 border-rose-400 text-rose-300'
                          : 'bg-yellow-950/80 border-yellow-400 text-yellow-300'
                      }`}
                    >
                      {starRad.ratioToSunLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 rounded-lg bg-slate-900 border border-yellow-500/30 space-y-0.5">
                      <div className="text-yellow-400 font-bold uppercase flex items-center gap-1">
                        <span>☀️ Фотонный потенциал</span>
                      </div>
                      <div className="text-sm font-mono font-black text-white">
                        {starRad.photonPotential.toFixed(2)}&times;
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {starRad.isSunEquivalent
                          ? '100% нормы (Солнце = 1.0)'
                          : starRad.photonPotential > 1
                          ? `+${Math.round((starRad.photonPotential - 1) * 100)}% к Солнцу (оптика)`
                          : `${Math.round((starRad.photonPotential - 1) * 100)}% к Солнцу`}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-purple-500/30 space-y-0.5">
                      <div className="text-purple-300 font-bold uppercase flex items-center gap-1">
                        <span>⚡ Гаммаквантовый</span>
                      </div>
                      <div className="text-sm font-mono font-black text-white">
                        {starRad.gammaPotential.toFixed(2)}&times;
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {starRad.isSunEquivalent
                          ? '100% нормы (Солнце = 1.0)'
                          : starRad.gammaPotential > 1
                          ? `+${Math.round((starRad.gammaPotential - 1) * 100)}% к Солнцу (жёсткий поток)`
                          : `${Math.round((starRad.gammaPotential - 1) * 100)}% к Солнцу`}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900 border border-cyan-500/30 space-y-0.5">
                      <div className="text-cyan-300 font-bold uppercase flex items-center gap-1">
                        <span>🌀 Зарядка ГЭУ (K_rad)</span>
                      </div>
                      <div className="text-sm font-mono font-black text-emerald-400">
                        {starRad.totalRadCoeff.toFixed(2)}&times;
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Зарядка 100т: ~{Math.round(starRad.rechargeTime100TonSec)} сек.
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-300 leading-relaxed bg-black/60 p-2 rounded border border-slate-800">
                    {starRad.benchmark.descriptionRu}
                  </div>
                </div>
              );
            })()}

            {/* СПЕЦИАЛЬНЫЙ БЛОК КАРТОЧКИ ПЛАНЕТЫ: ЗАХВАТ, ПЕРЕИМЕНОВАНИЕ («Метадонг - бывший Шлак-9»), КЛАН/СОЮЗ («клан Розовой бабочки»), ДОХОД И ГАЛАКТИЧЕСКИЙ АУКЦИОН */}
            {profile.kind === 'PLANET' && profile.planetOrder && profile.planetOrder <= 4 && !profile.isKuiperBelt && (
              <div
                className="p-2.5 rounded-xl border-2 space-y-2 shadow-inner"
                style={{
                  borderColor: capturedPlanetRec?.isCaptured
                    ? capturedPlanetRec.clanColor || '#f472b6'
                    : capturedPlanetRec?.soldOnAuctionAtMs
                    ? '#fbbf24'
                    : '#f43f5e',
                  backgroundColor: capturedPlanetRec?.isCaptured
                    ? 'rgba(80, 7, 36, 0.35)'
                    : capturedPlanetRec?.soldOnAuctionAtMs
                    ? 'rgba(69, 26, 3, 0.4)'
                    : 'rgba(15, 23, 42, 0.95)',
                }}
              >
                {/* Шапка статуса суверенитета планеты */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                        capturedPlanetRec?.isCaptured
                          ? 'bg-pink-500/25 border-pink-400 text-pink-200'
                          : capturedPlanetRec?.soldOnAuctionAtMs
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                          : 'bg-rose-500/25 border-rose-400 text-rose-200'
                      }`}
                    >
                      {capturedPlanetRec?.isCaptured
                        ? `${capturedPlanetRec.clanIcon} ЗАХВАЧЕНА · ДОСТУП К КАРТОЧКЕ ОТКРЫТ`
                        : capturedPlanetRec?.soldOnAuctionAtMs
                        ? '🏛 ПРОДАНА НА ГАЛАКТИЧЕСКОМ АУКЦИОНЕ'
                        : '🔒 ПОД ВЛАСТЬЮ ДИКТАТОРА'}
                    </span>
                    {resolvedPlanetIndex > 0 && (
                      <span className="text-[9px] font-mono text-slate-400">
                        Планета #{resolvedPlanetIndex}/284
                      </span>
                    )}
                  </div>

                  {capturedPlanetRec?.isCaptured && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-extrabold">
                      +{capturedPlanetRec.incomePerCycleCr} CR / цикл
                    </span>
                  )}
                </div>

                {/* Текущий канонический титул планеты */}
                {capturedPlanetRec?.isCaptured ? (
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-pink-400/50 space-y-1">
                    <div className="text-[9px] font-mono uppercase text-pink-300">
                      Захваченная планета в составе {capturedPlanetRec.affiliationKind === 'CLAN' ? 'Клана' : 'Союза'}:
                    </div>
                    <div className="text-xs font-extrabold text-white leading-snug">
                      {capturedPlanetRec.clanIcon}{' '}
                      {formatCapturedPlanetFullTitle(capturedPlanetRec)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 pt-0.5">
                      <span>
                        Доход: +{capturedPlanetRec.incomePerCycleCr} CR/цикл (Инфр. Ур.{capturedPlanetRec.infrastructureLevel})
                      </span>
                      <span>Всего получено: {capturedPlanetRec.totalEarnedCr} CR</span>
                    </div>
                  </div>
                ) : capturedPlanetRec?.soldOnAuctionAtMs ? (
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-amber-400/60 space-y-1">
                    <div className="text-[10px] font-extrabold text-amber-300">
                      🏛 Лот продан за +{capturedPlanetRec.lastSoldPriceCr} CR
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Покупатель: <b className="text-white">{capturedPlanetRec.lastAuctionBuyer}</b>
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Бывший титул: «{formatCapturedPlanetFullTitle(capturedPlanetRec)}». Вы можете снова захватить планету в свой клан/союз!
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-300 leading-snug">
                      Официально: <b className="text-white">{profile.officialPlanetName || resolvedDictatorPlanet?.officialName || displayName}</b> · В народе:{' '}
                      <b className="text-amber-300">«{profile.folkPlanetName || resolvedDictatorPlanet?.folkName || clanFormerNameDraft}»</b>
                    </div>
                    <div className="text-[9px] text-rose-300">
                      Захватите планету, чтобы получить полный доступ к карточке, переименовать её (например: <b>Метадонг - бывший Шлак-9 · клан Розовой бабочки</b>), получать с неё доход или продать на Галактическом Аукционе!
                    </div>
                  </div>
                )}

                {clanActionFeedback && (
                  <div className="p-1.5 rounded-lg bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold text-[10px] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{clanActionFeedback}</span>
                  </div>
                )}

                {/* Переключатель режима управления планетой: [Клан / Переименование / Доход] или [Продать на Аукционе] */}
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setClanPanelMode('CLAN_INCOME')}
                    className={`py-1 px-2 rounded text-[10px] font-extrabold transition-colors ${
                      clanPanelMode === 'CLAN_INCOME'
                        ? 'bg-pink-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🦋 Клан · Имя · Доход
                  </button>
                  <button
                    type="button"
                    onClick={() => setClanPanelMode('AUCTION')}
                    className={`py-1 px-2 rounded text-[10px] font-extrabold transition-colors ${
                      clanPanelMode === 'AUCTION'
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🏛 Продать на Аукционе
                  </button>
                </div>

                {clanPanelMode === 'CLAN_INCOME' ? (
                  <div className="space-y-2">
                    {/* Быстрая кнопка-эталон из запроса игрока: «Метадонг - бывший Шлак-9 · клан Розовой бабочки» */}
                    <button
                      type="button"
                      onClick={() => {
                        setClanNewNameDraft('Метадонг');
                        setClanFormerNameDraft('Шлак-9');
                        setClanKindDraft('CLAN');
                        setClanTitleDraft('клан Розовой бабочки');
                        setClanIconDraft('🦋');
                        setClanColorDraft('#f472b6');
                        onCaptureAndAnnexPlanet?.({
                          orbitOrder: profile.planetOrder as 1 | 2 | 3 | 4,
                          customName: 'Метадонг',
                          formerName: 'Шлак-9',
                          affiliationKind: 'CLAN',
                          clanOrUnionName: 'клан Розовой бабочки',
                          clanIcon: '🦋',
                          clanColor: '#f472b6',
                          applyToEntireSystem: false,
                        });
                        onUpdateCustomOverride(profile.id, {
                          name: 'Метадонг - бывший Шлак-9',
                          nickname: 'клан Розовой бабочки',
                        });
                        setClanActionFeedback(
                          'Планета захвачена: «Метадонг - бывший Шлак-9 · клан Розовой бабочки» (+35 CR/цикл)!'
                        );
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-400 hover:to-fuchsia-400 text-slate-950 font-extrabold text-[10px] shadow-md flex items-center justify-center gap-1"
                    >
                      <span>🦋 Захватить как: «Метадонг - бывший Шлак-9 · клан Розовой бабочки»</span>
                    </button>

                    {/* Поля: Новое имя и Бывшее имя */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                          Новое имя планеты:
                        </label>
                        <input
                          type="text"
                          value={clanNewNameDraft}
                          onChange={(e) => setClanNewNameDraft(e.target.value)}
                          placeholder="Метадонг"
                          className="w-full rounded-lg px-2 py-1 text-[11px] font-extrabold bg-slate-950 border border-pink-400/60 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                          Бывший (старое имя):
                        </label>
                        <input
                          type="text"
                          value={clanFormerNameDraft}
                          onChange={(e) => setClanFormerNameDraft(e.target.value)}
                          placeholder="Шлак-9"
                          className="w-full rounded-lg px-2 py-1 text-[11px] font-mono font-bold bg-slate-950 border border-slate-700 text-amber-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Выбор КЛАН или СОЮЗ и пресеты */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400">
                          Присоединить к Клану или Союзу:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setClanKindDraft('CLAN')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              clanKindDraft === 'CLAN'
                                ? 'bg-pink-500 text-slate-950 border-pink-300'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            КЛАН
                          </button>
                          <button
                            type="button"
                            onClick={() => setClanKindDraft('UNION')}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              clanKindDraft === 'UNION'
                                ? 'bg-sky-400 text-slate-950 border-sky-300'
                                : 'bg-slate-950 text-slate-400 border-slate-800'
                            }`}
                          >
                            СОЮЗ
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={clanTitleDraft}
                        onChange={(e) => setClanTitleDraft(e.target.value)}
                        placeholder="клан Розовой бабочки"
                        className="w-full rounded-lg px-2 py-1 text-[11px] font-bold bg-slate-950 border border-sky-400/60 text-pink-200 focus:outline-none"
                      />

                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {CLAN_AND_UNION_PRESETS.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => {
                              setClanKindDraft(pr.kind);
                              setClanTitleDraft(pr.name);
                              setClanIconDraft(pr.icon);
                              setClanColorDraft(pr.color);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                              clanTitleDraft === pr.name
                                ? 'bg-pink-500/30 border-pink-400 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {pr.icon} {pr.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Кнопки: Присоединить планету ИЛИ Присоединить всю звёздную систему */}
                    <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const finalCustom = clanNewNameDraft.trim() || 'Метадонг';
                          const finalFormer = clanFormerNameDraft.trim() || 'Шлак-9';
                          const finalClan = clanTitleDraft.trim() || 'клан Розовой бабочки';
                          onCaptureAndAnnexPlanet?.({
                            orbitOrder: profile.planetOrder as 1 | 2 | 3 | 4,
                            customName: finalCustom,
                            formerName: finalFormer,
                            affiliationKind: clanKindDraft,
                            clanOrUnionName: finalClan,
                            clanIcon: clanIconDraft,
                            clanColor: clanColorDraft,
                            applyToEntireSystem: false,
                          });
                          onUpdateCustomOverride(profile.id, {
                            name: `${finalCustom} - бывший ${finalFormer}`,
                            nickname: finalClan,
                          });
                          setClanActionFeedback(
                            `Планета захвачена и переименована: «${finalCustom} - бывший ${finalFormer} · ${finalClan}»!`
                          );
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px]"
                      >
                        ⚔️ Захватить и присоединить ПЛАНЕТУ к {clanKindDraft === 'CLAN' ? 'клану' : 'союзу'} (+Доход)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const finalCustom = clanNewNameDraft.trim() || 'Метадонг';
                          const finalFormer = clanFormerNameDraft.trim() || 'Шлак-9';
                          const finalClan = clanTitleDraft.trim() || 'клан Розовой бабочки';
                          onCaptureAndAnnexPlanet?.({
                            orbitOrder: profile.planetOrder as 1 | 2 | 3 | 4,
                            customName: finalCustom,
                            formerName: finalFormer,
                            affiliationKind: clanKindDraft,
                            clanOrUnionName: finalClan,
                            clanIcon: clanIconDraft,
                            clanColor: clanColorDraft,
                            applyToEntireSystem: true,
                          });
                          onUpdateCustomOverride(profile.id, {
                            name: `${finalCustom} - бывший ${finalFormer}`,
                            nickname: finalClan,
                          });
                          setClanActionFeedback(
                            `Вся звёздная система (4 планеты) присоединена к «${finalClan}» с бонусом дохода +25%!`
                          );
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-[10px]"
                      >
                        🌟 Присоединить ВСЮ СИСТЕМУ (4 планеты) к «{clanTitleDraft || 'клану'}»
                      </button>
                    </div>

                    {/* Кнопки сбора дохода и прокачки инфраструктуры захваченной планеты */}
                    {capturedPlanetRec?.isCaptured && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            onCollectPlanetClanIncomeNow?.(resolvedPlanetIndex, false);
                            setClanActionFeedback(
                              `Получен доход +${capturedPlanetRec.incomePerCycleCr} CR с планеты «${capturedPlanetRec.customName}»!`
                            );
                          }}
                          className="py-1.5 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px]"
                        >
                          💰 Собрать +{capturedPlanetRec.incomePerCycleCr} CR
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpgradePlanetClanInfrastructure?.(resolvedPlanetIndex);
                            setClanActionFeedback(
                              `Инфраструктура планеты «${capturedPlanetRec.customName}» улучшена (+20 CR/цикл и рост цены на аукционе)!`
                            );
                          }}
                          className="py-1.5 px-2 rounded-lg bg-purple-400 hover:bg-purple-300 text-slate-950 font-extrabold text-[10px]"
                        >
                          ⬆️ Инфр. Ур.{capturedPlanetRec.infrastructureLevel} (+20 CR/ц)
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ВКЛАДКА ГАЛАКТИЧЕСКОГО АУКЦИОНА ПЛАНЕТ И СИСТЕМ */
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-amber-400/50 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-amber-300 font-extrabold uppercase">
                          🏛 Галактический Аукцион Планет
                        </span>
                        <span className="font-mono text-emerald-300 font-bold">
                          Раунд торгов {(previewRecForAuction.auctionBiddingRound || 0) + 1}/5
                        </span>
                      </div>

                      <div className="text-[11px] font-extrabold text-white">
                        Лот: «{formatCapturedPlanetFullTitle(previewRecForAuction)}»
                      </div>

                      <div className="text-[10px] text-slate-300 space-y-0.5 pt-0.5">
                        <div className="flex justify-between">
                          <span>Базовая ценность орбиты:</span>
                          <b className="font-mono text-white">{auctionValuation.baseValuationCr} CR</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Бренд-бонус имени и клана:</span>
                          <b className="font-mono text-pink-300">+{auctionValuation.renamedBrandBonusCr} CR</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Инфраструктура (Ур.{previewRecForAuction.infrastructureLevel}):</span>
                          <b className="font-mono text-cyan-300">+{auctionValuation.infraBonusCr} CR</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Надбавка покупателя на торгах:</span>
                          <b className="font-mono text-amber-300">+{auctionValuation.roundBonusCr} CR</b>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800 text-xs">
                          <span className="font-extrabold text-amber-200">Текущая ставка за планету:</span>
                          <b className="font-mono text-emerald-400 text-xs">+{auctionValuation.totalBidCr} CR</b>
                        </div>
                      </div>

                      <div className="pt-1 text-[10px] text-slate-400">
                        Лидер торгов: <span className="text-amber-300 font-bold">{auctionValuation.topBidderBadge}</span> ·{' '}
                        <span className="text-white font-semibold">{auctionValuation.topBidderName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!capturedPlanetRec?.isCaptured) {
                            onCaptureAndAnnexPlanet?.({
                              orbitOrder: profile.planetOrder as 1 | 2 | 3 | 4,
                              customName: clanNewNameDraft.trim() || 'Метадонг',
                              formerName: clanFormerNameDraft.trim() || 'Шлак-9',
                              affiliationKind: clanKindDraft,
                              clanOrUnionName: clanTitleDraft.trim() || 'клан Розовой бабочки',
                              clanIcon: clanIconDraft,
                              clanColor: clanColorDraft,
                              applyToEntireSystem: false,
                            });
                          }
                          if (resolvedPlanetIndex > 0) {
                            onRaisePlanetAuctionBid?.(resolvedPlanetIndex);
                          }
                          setClanActionFeedback(
                            'Синдикаты повысили ставку на Галактическом Аукционе!'
                          );
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-extrabold text-[10px]"
                      >
                        🔨 Поднять ставку на торгах (привлечь следующий синдикат)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!capturedPlanetRec?.isCaptured) {
                            onCaptureAndAnnexPlanet?.({
                              orbitOrder: profile.planetOrder as 1 | 2 | 3 | 4,
                              customName: clanNewNameDraft.trim() || 'Метадонг',
                              formerName: clanFormerNameDraft.trim() || 'Шлак-9',
                              affiliationKind: clanKindDraft,
                              clanOrUnionName: clanTitleDraft.trim() || 'клан Розовой бабочки',
                              clanIcon: clanIconDraft,
                              clanColor: clanColorDraft,
                              applyToEntireSystem: false,
                            });
                          }
                          if (resolvedPlanetIndex > 0) {
                            onSellPlanetOnAuction?.(resolvedPlanetIndex, false);
                          }
                          setClanActionFeedback(
                            `Планета «${previewRecForAuction.customName}» продана на аукционе за +${auctionValuation.totalBidCr} CR!`
                          );
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] shadow-md"
                      >
                        💎 Продать ПЛАНЕТУ на аукционе за +{auctionValuation.totalBidCr} CR
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (resolvedPlanetIndex > 0) {
                            onSellPlanetOnAuction?.(resolvedPlanetIndex, true);
                          }
                          setClanActionFeedback(
                            `Вся звёздная система (4 планеты) продана на аукционе за +${fullSystemAuctionPriceCr} CR!`
                          );
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-[10px] shadow-md"
                      >
                        🌌 Продать ВСЮ СИСТЕМУ (4 планеты) на аукционе за +{fullSystemAuctionPriceCr} CR
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* СПЕЦИАЛЬНЫЙ БЛОК ДЛЯ ОБЪЕКТОВ ПОЯСА КОЙПЕРА (90 000 — 100 000 ЕД.) */}
            {profile.kuiperMeta && (
              <div className="p-3 rounded-xl border-2 border-indigo-400/80 bg-gradient-to-b from-indigo-950/70 to-slate-950/90 space-y-2.5 shadow-inner">
                {/* Шапка: Классификация и диаметр */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-indigo-500/30 border border-indigo-400 text-indigo-200">
                    🪐 ПОЯС КОЙПЕРА (R: {profile.kuiperMeta.orbitRadius} ЕД.)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/25 border border-amber-400 text-amber-200 font-mono">
                    {profile.kuiperMeta.diameterLabelRu}
                  </span>
                </div>

                {/* Официальный статус МАС */}
                <div className="p-2 rounded-lg bg-black/60 border border-indigo-400/40 space-y-1">
                  <div className="text-[10px] font-extrabold text-indigo-300 flex items-center justify-between">
                    <span>{profile.kuiperMeta.classificationLabelRu}</span>
                    <span className="font-mono text-slate-400 text-[9px]">{profile.kuiperMeta.folkName}</span>
                  </div>
                  <div className="text-[10px] text-slate-200 leading-relaxed">
                    {profile.kuiperMeta.summaryRu}
                  </div>
                </div>

                {/* Физические параметры: Состав, Форма, Масса */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                  <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 block font-bold">🧪 Состав поверхности:</span>
                    <span className="text-slate-200">{profile.kuiperMeta.surfaceCompositionRu}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 block font-bold">⚖️ Расчётная масса:</span>
                    <span className="text-amber-300">{profile.kuiperMeta.massLabelRu}</span>
                  </div>
                </div>

                {profile.kuiperMeta.atmosphereRu && (
                  <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/40 text-[9px] space-y-0.5">
                    <span className="font-bold text-sky-300">💨 Атмосфера:</span>
                    <span className="text-slate-300 block">{profile.kuiperMeta.atmosphereRu}</span>
                  </div>
                )}

                {profile.kuiperMeta.moons && profile.kuiperMeta.moons.length > 0 && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[9px] space-y-1">
                    <span className="font-bold text-emerald-300">🌙 Спутники ({profile.kuiperMeta.moons.length}):</span>
                    <div className="space-y-0.5 text-slate-300">
                      {profile.kuiperMeta.moons.map((m) => (
                        <div key={m.id} className="flex items-center justify-between">
                          <span className="text-white font-bold">• {m.name}</span>
                          <span className="text-emerald-400 font-mono">
                            {m.isLargeCompanion ? 'Крупный компаньон (двойная система)' : `R ~${m.radius3D * 12} км`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.kuiperMeta.hasRings && (
                  <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-400/50 text-[9px] space-y-0.5">
                    <span className="font-bold text-purple-300">
                      {profile.kuiperMeta.isRocheLimitAnomaly ? '🔮 Аномальная система колец (за пределом Роша):' : '🪐 Кольцевая система:'}
                    </span>
                    <span className="text-slate-200 block">
                      {profile.kuiperMeta.isRocheLimitAnomaly
                        ? 'Кольцо Weywot Ring расположено на расстоянии около 4100 км от центра (в 7.4 радиуса планетоида) — далеко за классическим пределом Роша (~1.4R), опровергая прежние законы аккреции колец.'
                        : 'Плотное планарное кольцо шириной 70 км на расстоянии ~2287 км от центра в резонансе 3:1 со сверхбыстрым вращением планеты.'}
                    </span>
                  </div>
                )}

                {/* Орбитальная динамика и скорость движения */}
                <div className="p-2 rounded-lg bg-black/60 border border-slate-800 text-[9px] text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-amber-200 font-bold">
                    <span>🚀 Орбитальная механика:</span>
                    <span className="font-mono text-emerald-300">V = 25 ед/с (как у планет)</span>
                  </div>
                  <div>{profile.kuiperMeta.orbitLoreRu}</div>
                  <div className="text-slate-400 pt-0.5 italic">{profile.kuiperMeta.scientificHistoryRu}</div>
                </div>
              </div>
            )}

            {/* 1. ИМЯ */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Имя
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingName) {
                        onUpdateCustomOverride(profile.id, {
                          name: nameDraft.trim() || profile.name,
                        });
                        setIsEditingName(false);
                      } else {
                        setNameDraft(displayName);
                        setIsEditingName(true);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isEditingName
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isEditingName ? 'Применить' : 'Редактировать'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCustomOverride(profile.id, {showName: !showName})
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      showName
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-rose-600 text-white border-rose-500'
                    }`}
                  >
                    {showName ? 'Показать' : 'Скрыто'}
                  </button>
                </div>
              </div>
              {isEditingName ? (
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-1 text-xs font-bold bg-slate-950 border border-sky-400 text-white focus:outline-none"
                />
              ) : (
                <div className="text-xs font-extrabold text-white">
                  {showName ? displayName : 'Имя скрыто'}
                </div>
              )}
            </div>

            {/* 2. НИКНЕЙМ */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Никнейм
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingNickname) {
                        onUpdateCustomOverride(profile.id, {
                          nickname: nicknameDraft.trim() || profile.nickname,
                        });
                        setIsEditingNickname(false);
                      } else {
                        setNicknameDraft(displayNickname);
                        setIsEditingNickname(true);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isEditingNickname
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isEditingNickname ? 'Применить' : 'Редактировать'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCustomOverride(profile.id, {showNickname: !showNickname})
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      showNickname
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-rose-600 text-white border-rose-500'
                    }`}
                  >
                    {showNickname ? 'Показать' : 'Скрыто'}
                  </button>
                </div>
              </div>
              {isEditingNickname ? (
                <input
                  type="text"
                  value={nicknameDraft}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                  className="w-full rounded-lg px-2.5 py-1 text-xs font-mono font-bold bg-slate-950 border border-sky-400 text-amber-300 focus:outline-none"
                />
              ) : (
                <div className="text-xs font-mono font-extrabold text-amber-300">
                  {showNickname ? displayNickname : 'Никнейм скрыт'}
                </div>
              )}
            </div>

            {/* СПИСОК ЗВЁЗД СОЗВЕЗДИЯ / СИСТЕМЫ С ФУНКЦИЕЙ ГИПЕРПРЫЖКА ВОЗЛЕ КАЖДОЙ ЗВЕЗДЫ */}
            {profile.constellationStars && profile.constellationStars.length > 0 && (
              <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-400/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1">
                    <span>★ Звёзды системы созвездия ({profile.constellationStars.length}):</span>
                  </span>
                  <span className="text-[9px] font-mono text-amber-300 font-bold">
                    Выберите звезду → Гиперпрыжок
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {profile.constellationStars.map((stItem) => {
                    const starRad =
                      stItem.starRad ||
                      getStarRadiationProfile(`${stItem.spectralNote} ${stItem.starName}`);
                    return (
                      <div
                        key={stItem.starId}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 transition-colors ${
                          stItem.isHoveredStar
                            ? 'bg-indigo-900/60 border-amber-400 shadow-sm'
                            : 'bg-slate-950/90 border-slate-800 hover:border-indigo-400/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              style={{color: stItem.spectralColor}}
                              className="text-sm leading-none font-extrabold shrink-0"
                            >
                              ★
                            </span>
                            <span className="text-xs font-extrabold text-white truncate">
                              {stItem.starName}
                            </span>
                            {stItem.isHoveredStar && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/50 text-[9px] font-mono font-bold text-amber-300 shrink-0">
                                В прицеле
                              </span>
                            )}
                            {/* Бейдж спектрального класса и множителя ГЭУ */}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold font-mono border shrink-0 ${
                                starRad.isGiant
                                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300'
                                  : starRad.isDwarf
                                  ? 'bg-rose-950/70 border-rose-400 text-rose-300'
                                  : 'bg-yellow-950/70 border-yellow-400 text-yellow-300'
                              }`}
                            >
                              {starRad.spectralCode} · {starRad.stellarTypeRu} [K_rad: {starRad.totalRadCoeff.toFixed(2)}&times;]
                            </span>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 truncate pl-4">
                            {stItem.spectralNote} · {stItem.distanceLightYears}
                          </div>

                          {/* Фотонный и гаммаквантовый потенциалы звезды */}
                          <div className="flex items-center gap-2 pl-4 text-[9px] font-mono flex-wrap">
                            <span className="text-yellow-300/90" title="Фотонный потенциал (оптическое/световое излучение, Солнце = 1.0)">
                              ☀️ Фотон: {starRad.photonPotential.toFixed(2)}&times;
                            </span>
                            <span className="text-purple-300/90" title="Гаммаквантовый потенциал (высокоэнергетический квантовый поток, Солнце = 1.0)">
                              ⚡ Гамма: {starRad.gammaPotential.toFixed(2)}&times;
                            </span>
                            <span
                              className={`font-bold ${
                                starRad.isGiant
                                  ? 'text-emerald-400'
                                  : starRad.isDwarf
                                  ? 'text-amber-400'
                                  : 'text-yellow-300'
                              }`}
                              title="Интегральный множитель накачки аккумулятора ГЭУ корабля"
                            >
                              {starRad.ratioToSunLabel}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onHyperspaceJumpToConstellationStar?.(stItem, displayName);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-md transition-colors"
                          title={`Совершить гиперпрыжок к звезде «${stItem.starName}» (${starRad.badgeShort})`}
                        >
                          <span>🚀 Гиперпрыжок</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. ГРУППЫ И БИЗНЕСЫ (наглядно в карточке) */}
            {profile.noContactsAllowed ? (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/60 space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-rose-300">
                  🚫 Контакты отсутствуют (Автономный корабль-сборщик металлов в Поясе Астероидов)
                </div>
                <div className="text-[11px] text-slate-200 leading-snug">
                  На этом корабле «Буран / Шаттл» нет никаких групп, бизнесов и контактов. Он летит в Поясе Астероидов на половине скорости (50 ед/с), стреляет по астероидам и собирает металлы. Его можно уничтожить (ЛКМ/ПКМ/V), а оставшийся после него груз металлов — забрать (СКМ)!
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-300">
                      👥 Группы: {profile.groupsTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('GROUPS')}
                      className="text-[10px] font-extrabold text-emerald-400 underline"
                    >
                      Открыть →
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    {profile.groupsDescription}
                  </div>
                  {pTag && profile.planetCleanName && (
                    <button
                      type="button"
                      onClick={() => onToggleJoinPlanetGroup(pTag, profile.planetCleanName!)}
                      className={`mt-1 w-full py-1 px-2 rounded-lg font-extrabold text-[10px] transition-colors ${
                        isMemberOfPlanetGroup
                          ? 'bg-slate-800 hover:bg-rose-600 text-emerald-300 hover:text-white'
                          : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                      }`}
                    >
                      {isMemberOfPlanetGroup
                        ? `✓ Вы в группе #${pTag} (цена ресурса 1 CR) · Выйти`
                        : `+ Вступить в группу #${pTag} (скидка с 5 CR до 1 CR)`}
                    </button>
                  )}
                </div>

                <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase text-amber-300">
                      💼 Бизнесы: {profile.businessesTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('BUSINESS')}
                      className="text-[10px] font-extrabold text-amber-400 underline"
                    >
                      Торговля →
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    {profile.businessesDescription}
                  </div>
                  {profile.planetOrder && (
                    <button
                      type="button"
                      onClick={() => onSupplyFromPlanet(profile.planetOrder!)}
                      className="mt-1 w-full py-1 px-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px]"
                    >
                      {profile.planetOrder === 1 &&
                        `⚙️ Купить Железо +1т (${
                          isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                        } CR) [Запас: ${ironStock}т]`}
                      {profile.planetOrder === 2 &&
                        `🔩 Купить Алюминий +1т (${
                          isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                        } CR) [Запас: ${aluminumStock}т]`}
                      {profile.planetOrder === 3 &&
                        `🍎💧 Купить Продовольствие и Воду +1т (${
                          isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                        } CR) [Запас: ${foodWaterCargoStock}т]`}
                      {profile.planetOrder === 4 &&
                        `🛡️ Купить Титан +1т (${
                          isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                        } CR) [Запас: ${titaniumStock}т]`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 4. ОПИСАНИЕ */}
            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Описание
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingDescription) {
                        onUpdateCustomOverride(profile.id, {
                          description: descriptionDraft.trim() || profile.description,
                        });
                        setIsEditingDescription(false);
                      } else {
                        setDescriptionDraft(displayDescription);
                        setIsEditingDescription(true);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isEditingDescription
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isEditingDescription ? 'Применить' : 'Редактировать'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCustomOverride(profile.id, {
                        showDescription: !showDescription,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      showDescription
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-rose-600 text-white border-rose-500'
                    }`}
                  >
                    {showDescription ? 'Показать' : 'Скрыто'}
                  </button>
                </div>
              </div>
              {isEditingDescription ? (
                <textarea
                  rows={2}
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  className="w-full rounded-lg p-2 text-xs font-semibold bg-slate-950 border border-sky-400 text-white focus:outline-none"
                />
              ) : (
                <div className="text-xs font-semibold text-emerald-300 leading-snug">
                  {showDescription ? displayDescription : 'Описание скрыто'}
                </div>
              )}
            </div>

            {/* Доп. телеметрия для логистического модуля / груза / мусора / астероида / корабля */}
            {(profile.routeFromPlanet ||
              profile.cargoResourceLabel ||
              profile.engineTypeLabelRu ||
              profile.kind === 'ASTEROID') && (
              <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1 text-[10px]">
                {profile.engineTypeLabelRu && (
                  <div className="text-purple-300 font-bold flex items-center gap-1">
                    <span>⚙️</span>
                    <span>Двигатель: {profile.engineTypeLabelRu}</span>
                  </div>
                )}
                {profile.routeFromPlanet && profile.routeToPlanet && (
                  <div className="text-cyan-300 font-bold">
                    Маршрут: {profile.routeFromPlanet} → {profile.routeToPlanet}{' '}
                    {profile.routePhaseLabel ? `(${profile.routePhaseLabel})` : ''}
                  </div>
                )}
                {profile.cargoResourceLabel && (
                  <div className="text-amber-300 font-bold">
                    Груз: {profile.cargoResourceLabel}
                  </div>
                )}
                {profile.kind === 'ASTEROID' && (
                  <div className="text-amber-300 font-bold">
                    {profile.asteroidRevealed &&
                    profile.elementSymbol &&
                    ASTEROID_PERIODIC_ELEMENTS[profile.elementSymbol]
                      ? `Элемент: ${ASTEROID_PERIODIC_ELEMENTS[profile.elementSymbol].nameRu} (${ASTEROID_PERIODIC_ELEMENTS[profile.elementSymbol].displaySymbol}) · ${ASTEROID_PERIODIC_ELEMENTS[profile.elementSymbol].sellPriceCr} CR/т`
                      : 'Порода не разведана (выстрелите лазером ЛКМ для анализа)'}
                  </div>
                )}
              </div>
            )}

            {/* Быстрые кнопки управления объектом прямо в карточке */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onFocusObjectInSpace(profile);
                }}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[10px] flex items-center justify-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Навести курс</span>
              </button>

              {profile.kind === 'PLANET' && (
                <button
                  type="button"
                  onClick={onToggleStationaryOrbit}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl font-extrabold text-[10px] border ${
                    isStationaryOrbitLocked
                      ? 'bg-emerald-400 text-slate-950 border-yellow-300'
                      : 'bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border-emerald-400'
                  }`}
                >
                  {isStationaryOrbitLocked ? '🔓 Открепить орбиту (X)' : '🛰 Стац. орбита (X)'}
                </button>
              )}

              {profile.kind === 'STATION' && onDockStation && (
                <button
                  type="button"
                  onClick={() => {
                    onDockStation();
                    onClose();
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px]"
                >
                  Стыковка (T)
                </button>
              )}

              {(profile.kind === 'CARGO' ||
                profile.kind === 'SOS_POD' ||
                (profile.kind === 'ASTEROID' &&
                  profile.asteroidRevealed &&
                  profile.asteroidIsValuable)) &&
                onTractorCaptureObject && (
                  <button
                    type="button"
                    onClick={() => {
                      onTractorCaptureObject(profile);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px]"
                  >
                    🧲 В отсек (СКМ)
                  </button>
                )}

              {(profile.kind === 'CARGO' || profile.kind === 'SPACE_DEBRIS') &&
                onDestroyObjectAsAsteroid && (
                  <button
                    type="button"
                    onClick={() => {
                      onDestroyObjectAsAsteroid(profile);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px]"
                  >
                    💥 Как астероид (+CR)
                  </button>
                )}

              {!profile.noContactsAllowed && (
                <button
                  type="button"
                  onClick={() => setActiveTab('CONTACT')}
                  className="py-1.5 px-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-[10px] flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Контакт</span>
                </button>
              )}
            </div>

            {/* Слова-теги профиля объекта (как в профиле пользователя GoBell) */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Слова-теги профиля объекта:</span>
                <span className="font-mono text-sky-400">
                  {extractedTags.filter((t) => !disabledTags.includes(t.normalized)).length}/
                  {extractedTags.length}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap max-h-16 overflow-y-auto">
                {extractedTags.map((tagObj) => {
                  const isActive = !disabledTags.includes(tagObj.normalized);
                  return (
                    <button
                      key={tagObj.normalized}
                      type="button"
                      onClick={() => toggleWordTag(tagObj.normalized)}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold border transition-all ${
                        isActive
                          ? 'bg-sky-500/20 border-sky-400/70 text-sky-200'
                          : 'bg-slate-950 border-slate-800 text-slate-500 line-through'
                      }`}
                    >
                      #{tagObj.word}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ПРАВАЯ КОЛОНКА В ПОЛНОЙ ТАБЛИЧКЕ (ИЛИ ОТДЕЛЬНЫЕ ВКЛАДКИ В КОМПАКТНОМ ВИДЕ) */}
        {(isFullPlacard || activeTab !== 'PROFILE') && !profile.noContactsAllowed && (
          <div
            className={`space-y-2.5 ${
              isFullPlacard ? 'lg:col-span-5' : ''
            }`}
          >
            {/* ВКЛАДКА 2: ГРУППЫ (ПРАВИТЕЛЬСТВО И ГОСУДАРСТВЕННЫЕ КОНТРАКТЫ 10 CR) */}
            {(activeTab === 'GROUPS' || isFullPlacard) && (
              <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-extrabold text-emerald-300 text-xs">
                  {profile.groupsTitle}
                </div>
                {pTag && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-extrabold">
                    #{pTag}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                {profile.groupsDescription}
              </div>

              {pTag && profile.planetCleanName && (
                <div className="pt-1.5 border-t border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => onToggleJoinPlanetGroup(pTag, profile.planetCleanName!)}
                    className={`w-full py-1.5 px-3 rounded-xl font-extrabold text-xs ${
                      isMemberOfPlanetGroup
                        ? 'bg-slate-800 hover:bg-rose-600 text-slate-200'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    }`}
                  >
                    {isMemberOfPlanetGroup
                      ? `✓ Вы состоите в #${pTag} (скидка 1 CR) · Выйти`
                      : `+ Вступить в #${pTag} (${joinedPlanetGroups.length}/${maxAllowedPlanetGroups})`}
                  </button>

                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400">
                      Тариф: <b className="text-amber-300">{GOBELL_SPACE_TARIFF_META[gobellTariff].badge}</b>
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {(['FREE', 'PRO', 'PRO_PLUS_1', 'PRO_PLUS_2', 'BUSINESS'] as GoBellSpaceTariff[]).map(
                        (tKey) => (
                          <button
                            key={tKey}
                            type="button"
                            onClick={() => onSelectGoBellTariff(tKey)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              gobellTariff === tKey
                                ? 'bg-amber-400 text-slate-950 border-amber-300'
                                : 'bg-slate-950 text-slate-300 border-slate-700'
                            }`}
                          >
                            {GOBELL_SPACE_TARIFF_META[tKey].badge}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {profile.planetOrder && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="font-extrabold text-emerald-300 text-[10px]">
                    📦 Контракты Правительства «{profile.planetCleanName}» (+
                    {Number((10 / pirateSellDivisor).toFixed(1))} CR):
                  </div>
                  {profile.planetOrder === 3 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Земля', 'IRON')}
                        className="w-full py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        ⚙️ Сдать 1т ЖЕЛЕЗА с Меркурия → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {ironStock}т)
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Земля', 'ALUMINUM')}
                        className="w-full py-1.5 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        🔩 Сдать 1т АЛЮМИНИЯ с Венеры → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {aluminumStock}т)
                      </button>
                    </>
                  )}
                  {profile.planetOrder === 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Меркурий', 'FOOD_WATER')}
                        className="w-full py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        🍎💧 Сдать 1т ЕДЫ И ВОДЫ с Земли → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {foodWaterCargoStock}т)
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Меркурий', 'TITANIUM')}
                        className="w-full py-1.5 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        🛡️ Сдать 1т ТИТАНА с Марса → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {titaniumStock}т)
                      </button>
                    </>
                  )}
                  {profile.planetOrder === 2 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Венера', 'IRON')}
                        className="w-full py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        ⚙️ Сдать 1т ЖЕЛЕЗА с Меркурия → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {ironStock}т)
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Венера', 'FOOD_WATER')}
                        className="w-full py-1.5 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        🍎💧 Сдать 1т ЕДЫ И ВОДЫ с Земли → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {foodWaterCargoStock}т)
                      </button>
                    </>
                  )}
                  {profile.planetOrder === 4 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Марс', 'FOOD_WATER')}
                        className="w-full py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        🍎💧 Сдать 1т ЕДЫ И ВОДЫ с Земли → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {foodWaterCargoStock}т)
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeliverGovernmentContract('Марс', 'ALUMINUM')}
                        className="w-full py-1.5 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[10px] text-left"
                      >
                        🔩 Сдать 1т АЛЮМИНИЯ с Венеры → +{Number((10 / pirateSellDivisor).toFixed(1))} CR (в трюме: {aluminumStock}т)
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={onSellAllPeriodicElements}
                    className="w-full py-1.5 px-2 rounded-lg bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-extrabold text-[10px]"
                  >
                    💎 Продать редкие элементы Пояса ({usedCargoTons}/{maxCargoCapacity}т)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 3: БИЗНЕСЫ И ОБЪЯВЛЕНИЯ */}
        {(activeTab === 'BUSINESS' || isFullPlacard) && (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2">
              <div className="font-extrabold text-amber-300 text-xs">
                {profile.businessesTitle}
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                {profile.businessesDescription}
              </div>

              {profile.planetOrder && (
                <button
                  type="button"
                  onClick={() => onSupplyFromPlanet(profile.planetOrder!)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs"
                >
                  {profile.planetOrder === 1 &&
                    `⚙️ Купить ЖЕЛЕЗО +1т (${
                      isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                    } CR) [Запас: ${ironStock}т]`}
                  {profile.planetOrder === 2 &&
                    `🔩 Купить АЛЮМИНИЙ +1т (${
                      isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                    } CR) [Запас: ${aluminumStock}т]`}
                  {profile.planetOrder === 3 &&
                    `🍎💧 Купить ПРОДОВОЛЬСТВИЕ И ВОДУ +1т (${
                      isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                    } CR) [Запас: ${foodWaterCargoStock}т]`}
                  {profile.planetOrder === 4 &&
                    `🛡️ Купить ТИТАН +1т (${
                      isMemberOfPlanetGroup ? 1 * pirateBuyMultiplier : 5 * pirateBuyMultiplier
                    } CR) [Запас: ${titaniumStock}т]`}
                </button>
              )}

              {profile.adverts && profile.adverts.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-extrabold uppercase text-emerald-300">
                    Объявления бизнеса (ADVERT · 4 слота):
                  </div>
                  {profile.adverts.map((adv) => (
                    <div
                      key={adv.slotId}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-amber-300 font-extrabold">{adv.title}</span>
                        <span className="text-emerald-400 font-mono">+{adv.karmaPlus}</span>
                      </div>
                      <div className="text-[11px] text-white leading-snug">{adv.description}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setContactNote(
                            `Здравствуйте, «${adv.authorName}»! Обращаюсь по объявлению #${adv.slotId}: «${adv.description}».`
                          );
                          setActiveTab('CONTACT');
                        }}
                        className="w-full py-1 px-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px]"
                      >
                        Запрос на контакт по объявлению #{adv.slotId}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 4: ЗАПРОС НА КОНТАКТ В GOBELL CHAT */}
        {(activeTab === 'CONTACT' || isFullPlacard) && (
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Запрос на контакт в Chat GoBell</span>
              </div>

              {contactSentBanner && (
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-400 text-emerald-200 font-bold text-[10px] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{contactSentBanner}</span>
                </div>
              )}

              <textarea
                rows={3}
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 focus:border-sky-400 p-2 text-xs text-white focus:outline-none"
                placeholder="Сопроводительная записка..."
              />

              <button
                type="button"
                onClick={() => {
                  if (!contactNote.trim()) return;
                  onSendContactRequest(
                    `${displayName} (${displayNickname})`,
                    profile.planetCleanName || displayName,
                    profile.kind === 'PLANET' ? 'GROUPS' : 'BUSINESS',
                    contactNote.trim(),
                    pTag
                  );
                  setContactSentBanner(
                    `Запрос для «${displayName}» (${displayNickname}) отправлен в Chat GoBell (+1 Карма)!`
                  );
                }}
                className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Отправить в Chat GoBell (+1 Карма)</span>
              </button>
            </div>
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
};
