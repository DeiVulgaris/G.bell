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
  shipMassTons?: number;
  shipMaxMassTons?: number;
  playerHitTons?: number;
  solarFluxPct?: number;
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
  onSendContactRequest: (
    targetName: string,
    planetOrSectorName: string,
    category: 'GROUPS' | 'BUSINESS' | 'ADVERT',
    note: string,
    groupTag?: string
  ) => void;
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
  onSendContactRequest,
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

  // Contact form note inside the profile
  const [contactNote, setContactNote] = useState('');
  const [contactSentBanner, setContactSentBanner] = useState<string | null>(null);
  const [cardCorner, setCardCorner] = useState<
    'TOP_RIGHT' | 'TOP_LEFT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT'
  >('TOP_RIGHT');

  useEffect(() => {
    if (!profile) return;
    setActiveTab(profile.initialTab || 'PROFILE');
    setIsEditingName(false);
    setIsEditingNickname(false);
    setIsEditingDescription(false);
    setContactSentBanner(null);
    const ov = customOverrides[profile.id];
    const currentName = ov?.name ?? profile.name;
    const currentNick = ov?.nickname ?? profile.nickname;
    setContactNote(
      `Приветствую, «${currentName}» (${currentNick})! Запрашиваю канал связи и синхронизацию с борта Cobra Mk III.`
    );
  }, [profile?.id, profile?.initialTab]);

  // Close on Escape
  useEffect(() => {
    if (!profile) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [profile, onClose]);

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
  const cardW = Math.min(360, Math.max(280, contW - 20));
  const maxCardH = Math.min(390, Math.max(240, Math.floor(contH * 0.68)));

  const cornerPosStyle: React.CSSProperties =
    cardCorner === 'TOP_RIGHT'
      ? {top: '10px', right: '10px'}
      : cardCorner === 'TOP_LEFT'
      ? {top: '46px', left: '10px'}
      : cardCorner === 'BOTTOM_RIGHT'
      ? {bottom: '10px', right: '10px'}
      : {bottom: '10px', left: '10px'};

  return (
    <div
      onMouseEnter={onMouseEnterCard}
      onMouseLeave={onMouseLeaveCard}
      style={{
        ...cornerPosStyle,
        width: `${cardW}px`,
        maxHeight: `${maxCardH}px`,
      }}
      className="absolute z-40 pointer-events-auto bg-slate-950/95 backdrop-blur-md border-2 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.45)] overflow-hidden flex flex-col font-sans select-text animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Верхняя шапка карточки объекта в углу 3D-экрана */}
      <div
        className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2"
        style={{borderTopColor: profile.color}}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl bg-slate-950 border-2 flex items-center justify-center shrink-0 font-mono font-black text-sm shadow-inner"
            style={{borderColor: profile.color, color: profile.color}}
          >
            {profile.kind === 'STAR' && '☀'}
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

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors"
            title="Закрыть карточку [I / Esc]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Компактные вкладки карточки объекта (как в профиле пользователя GoBell) */}
      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 grid grid-cols-4 gap-1">
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
          <span className="truncate">Профиль</span>
        </button>

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
      </div>

      {/* Содержимое карточки объекта */}
      <div className="p-3 overflow-y-auto space-y-2.5 text-[11px] text-slate-200">
        {/* ВКЛАДКА 1: ПРОФИЛЬ ОБЪЕКТА (ИМЯ, НИКНЕЙМ, ГРУППЫ, БИЗНЕСЫ, ОПИСАНИЕ) */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-2.5">
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

            {/* 3. ГРУППЫ И БИЗНЕСЫ (наглядно в карточке) */}
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

            {/* Доп. телеметрия для логистического модуля / груза / мусора / астероида */}
            {(profile.routeFromPlanet ||
              profile.cargoResourceLabel ||
              profile.kind === 'ASTEROID') && (
              <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1 text-[10px]">
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

              <button
                type="button"
                onClick={() => setActiveTab('CONTACT')}
                className="py-1.5 px-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-[10px] flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Контакт</span>
              </button>
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

        {/* ВКЛАДКА 2: ГРУППЫ (ПРАВИТЕЛЬСТВО И ГОСУДАРСТВЕННЫЕ КОНТРАКТЫ 10 CR) */}
        {activeTab === 'GROUPS' && (
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
        {activeTab === 'BUSINESS' && (
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
        {activeTab === 'CONTACT' && (
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
    </div>
  );
};
