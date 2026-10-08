import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  Crosshair,
  Zap,
  Shield,
  Navigation,
  Package,
  Award,
  Volume2,
  VolumeX,
  X,
  Bell,
  AlertTriangle,
  Sparkles,
  Rocket,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  TonnageExperienceModal,
  WEAPON_COMBINATION_PRESETS,
  WeaponCombinationMode,
  CombatDebitCreditSettlement,
  getPilotExperienceRankByTons,
} from './TonnageExperienceModal';
import {FullGameConfigDocModal} from './FullGameConfigDocModal';
import {
  SpaceObjectProfileModal,
  SpaceObjectProfileData,
  CustomObjectProfileOverride,
} from './SpaceObjectProfileModal';
import {
  LabHangarCraftingModal,
  CRAFTABLE_SPACE_ITEMS,
  CraftableItemState,
  LAB_MODULE_MASS_TONS,
  HANGAR_MODULE_MASS_TONS,
  LAB_MODULE_PRICE_CR,
  HANGAR_MODULE_PRICE_CR,
} from './LabHangarCraftingModal';

export interface GoBellMissionSeed {
  id: string;
  authorName: string;
  text: string;
  category: 'ADVERT' | 'SOS' | 'BUSINESS' | 'GROUPS';
  karmaPlus?: number;
}

export interface PlanetContactRequestPayload {
  id: string;
  name: string;
  category: 'GROUPS' | 'BUSINESS' | 'ADVERT';
  note: string;
  karmaPlus: number;
  planetName: string;
  groupTag?: string;
  openChatAfterSend?: boolean;
}

export type GoBellSpaceTariff =
  | 'FREE'
  | 'PRO'
  | 'PRO_PLUS_1'
  | 'PRO_PLUS_2'
  | 'PRO_PLUS_3'
  | 'BUSINESS';

export const GOBELL_SPACE_TARIFF_META: Record<
  GoBellSpaceTariff,
  {
    id: GoBellSpaceTariff;
    badge: string;
    label: string;
    priceLabel: string;
    note: string;
    maxGroups: number;
  }
> = {
  FREE: {
    id: 'FREE',
    badge: 'FREE',
    label: 'Тариф FREE (1 доступная группа)',
    priceLabel: '$0 / мес',
    note: 'Тариф FREE: 1 группа планеты со скидкой 1 CR, 1 слот (10 слов)',
    maxGroups: 1,
  },
  PRO: {
    id: 'PRO',
    badge: 'PRO',
    label: 'Тариф PRO (2 доступные группы)',
    priceLabel: '$3 / мес',
    note: 'Тариф PRO: 2 группы планет со скидкой 1 CR, 1 слот (10 слов)',
    maxGroups: 2,
  },
  PRO_PLUS_1: {
    id: 'PRO_PLUS_1',
    badge: 'PRO + I',
    label: 'Тариф PRO + I (3 доступные группы)',
    priceLabel: '$5 / мес',
    note: 'Тариф PRO + I: 3 группы планет со скидкой 1 CR, 2 слота (15 слов)',
    maxGroups: 3,
  },
  PRO_PLUS_2: {
    id: 'PRO_PLUS_2',
    badge: 'PRO + II',
    label: 'Тариф PRO + II (4 группы · все планеты!)',
    priceLabel: '$8 / мес',
    note: 'Тариф PRO + II: 4 группы (все 4 планеты со скидкой 1 CR!), 3 слота (20 слов)',
    maxGroups: 4,
  },
  PRO_PLUS_3: {
    id: 'PRO_PLUS_3',
    badge: 'PRO + III',
    label: 'Тариф PRO + III (8 доступных групп)',
    priceLabel: '$12 / мес',
    note: 'Тариф PRO + III: 8 групп планет, 4 слота (25 слов)',
    maxGroups: 8,
  },
  BUSINESS: {
    id: 'BUSINESS',
    badge: 'BUSINESS',
    label: 'Тариф BUSINESS (8 доступных групп)',
    priceLabel: '$19 / мес',
    note: 'Тариф BUSINESS: 8 групп планет + создание своего Бизнеса с меньшей маржой',
    maxGroups: 8,
  },
};

interface GoBellEliteGameProps {
  isOpen: boolean;
  onClose: () => void;
  missionSeeds: GoBellMissionSeed[];
  pilotName: string;
  onEarnKarmaAndBonus?: (karmaDelta: number, gbtBonus: number, missionTitle: string) => void;
  onSendPlanetContactRequest?: (payload: PlanetContactRequestPayload) => void;
  initialTariff?: GoBellSpaceTariff;
  onChangeGoBellTariff?: (tariff: GoBellSpaceTariff, joinedPlanetGroupTags: string[]) => void;
  isSmartphoneGeoActive?: boolean;
  smartphoneGeoCoords?: {lat: number; lng: number};
  pilotProfileTags?: string[];
  onToggleSmartphoneGeo?: (active: boolean) => void;
  onViewPlayerOnRealMap?: () => void;
}

interface StarSystem {
  id: number;
  name: string;
  gov: string;
  econ:
    | 'Rich Industrial'
    | 'Agricultural'
    | 'High Tech'
    | 'Anarchy'
    | 'Mining'
    | 'Critical Matter (Ω-γ) Source'
    | 'Relict Supernova Core';
  techLevel: number;
  danger: 'Low' | 'Medium' | 'High (Pirate Zone)' | 'Extreme (Supernovae & Pirates)';
  x: number;
  y: number;
  color: string;
  description: string;
  priceFactors: number[];
  isOldGalaxy?: boolean;
  supernovaNote?: string;
}

const GALAXY_SYSTEMS: StarSystem[] = [
  {
    id: 0,
    name: 'LAVE · ФЁДОРОВКА-ПРАЙМ',
    gov: 'Совет Сообщества GoBell',
    econ: 'Agricultural',
    techLevel: 5,
    danger: 'Low',
    x: 24,
    y: 48,
    color: '#00ff00',
    description: 'Центральный орбитальный хаб GoBell. Безопасная зона для старта торговли и местных контрактов.',
    priceFactors: [0.7, 0.8, 1.1, 1.0, 1.35, 1.25, 1.15, 1.2],
  },
  {
    id: 1,
    name: 'ZAONCE · ВИННИЦА-ОРБИТА',
    gov: 'Корпоративный Сектор',
    econ: 'High Tech',
    techLevel: 12,
    danger: 'Low',
    x: 42,
    y: 34,
    color: '#00ffff',
    description: 'Высокотехнологичный кластер. Дешёвые компьютеры и машины, высокий спрос на продовольствие и руду.',
    priceFactors: [1.35, 1.25, 1.15, 0.9, 0.65, 0.75, 0.85, 0.9],
  },
  {
    id: 2,
    name: 'DISO · КИЕВ-СТАНЦИЯ',
    gov: 'Демократия Конфедерации',
    econ: 'Rich Industrial',
    techLevel: 10,
    danger: 'Medium',
    x: 58,
    y: 52,
    color: '#ffff00',
    description: 'Крупный промышленный узел с активной биржей объявлений GoBell и плотным трафиком.',
    priceFactors: [1.2, 1.15, 0.95, 1.1, 0.85, 0.8, 0.9, 1.1],
  },
  {
    id: 3,
    name: 'RIEDQUAT · ПИРАТСКИЙ ПОЯС',
    gov: 'Анархия (Беззаконие)',
    econ: 'Anarchy',
    techLevel: 4,
    danger: 'High (Pirate Zone)',
    x: 74,
    y: 28,
    color: '#ff0055',
    description: 'Опасный сектор анархии! Высокие награды за миссии SOS и охоту за пиратами, сверхвыгодная контрабанда.',
    priceFactors: [1.45, 1.3, 0.75, 1.6, 1.4, 1.35, 0.8, 1.5],
  },
  {
    id: 4,
    name: 'LEESTI · ОДЕССА-ПОРТ',
    gov: 'Свободный Торговый Порт',
    econ: 'Rich Industrial',
    techLevel: 9,
    danger: 'Medium',
    x: 34,
    y: 72,
    color: '#ff00ff',
    description: 'Свободный космопорт на пересечении гипер-маршрутов. Отличные цены на сплавы и кристаллы GoBell.',
    priceFactors: [1.15, 0.9, 1.2, 1.25, 0.9, 0.85, 0.75, 1.3],
  },
  {
    id: 5,
    name: 'ORERVE · РУДНИКИ ТИТАНА',
    gov: 'Шахтёрская Гильдия',
    econ: 'Mining',
    techLevel: 6,
    danger: 'Medium',
    x: 82,
    y: 66,
    color: '#00ff88',
    description: 'Богатые астероидные поля. Сверхдешёвые радиоактивные руды, сплавы и кристаллы GoBell.',
    priceFactors: [1.3, 1.2, 0.55, 1.15, 1.25, 1.3, 0.6, 0.65],
  },
  {
    id: 6,
    name: 'OMEGA-RELICT · СТАРАЯ ГАЛАКТИКА (БЕЗ ПЛАНЕТ)',
    gov: 'Мёртвый сектор (Без заселённых планет)',
    econ: 'Critical Matter (Ω-γ) Source',
    techLevel: 15,
    danger: 'Extreme (Supernovae & Pirates)',
    x: 88,
    y: 16,
    color: '#c084fc',
    isOldGalaxy: true,
    supernovaNote:
      'Диссипация ослабила внутренние связи вещества: локальные узлы лавинообразно размыкаются в виде гамма-квантов (всплески сверхновых без послесвечения). Заселённых планет нет!',
    description:
      'Старая галактика без заселённых планет. Сверхновые взрываются очень часто (гамма-всплески без послесвечения). Можно потерять корабль, но риск оправдан добычей Критического вещества (Ω-γ)!',
    priceFactors: [2.0, 2.0, 3.0, 2.5, 2.2, 0.4, 1.8, 0.5],
  },
  {
    id: 7,
    name: 'CHRONOS-VOID · ЯДРО ГАММА-ВСПЛЕСКОВ (БЕЗ ПЛАНЕТ)',
    gov: 'Аномалия диссипации узлов (Пираты и Контрабандисты)',
    econ: 'Relict Supernova Core',
    techLevel: 16,
    danger: 'Extreme (Supernovae & Pirates)',
    x: 14,
    y: 18,
    color: '#f43f5e',
    isOldGalaxy: true,
    supernovaNote:
      'Конечный срок жизни вещества исчерпан: лавинообразные гамма-всплески без послесвечения. Источник топлива для тяжёлых кораблей и тяжёлого гамма-вооружения.',
    description:
      'Древнее галактическое ядро без планет. Максимальная концентрация Критического вещества (Ω-γ), караваны контрабандистов и пиратские тяжёлые крейсеры.',
    priceFactors: [2.4, 2.3, 3.5, 2.8, 2.5, 0.35, 2.0, 0.45],
  },
];

interface Commodity {
  id: number;
  name: string;
  unit: string;
  basePrice: number;
}

const COMMODITIES: Commodity[] = [
  {id: 0, name: 'Железо (Fe · 1-я пл. Меркурий: 5 CR / в группе 1 CR → Земле 10 CR)', unit: 't', basePrice: 5},
  {id: 1, name: 'Алюминий (Al · 2-я пл. Венера: 5 CR / в группе 1 CR → Земле 10 CR)', unit: 't', basePrice: 5},
  {id: 2, name: 'Продовольствие (3-я пл. Земля: 5 CR / в группе 1 CR → Планетам 10 CR)', unit: 't', basePrice: 5},
  {id: 3, name: 'Вода H₂O/O₂ (3-я пл. Земля: 5 CR / в группе 1 CR → Питьё и Кислород)', unit: 't', basePrice: 5},
  {id: 4, name: 'Титан (Ti · 4-я пл. Марс: 5 CR / в группе 1 CR → Планетам 10 CR)', unit: 't', basePrice: 5},
  {id: 5, name: 'Редкие элементы (Пояс Астероидов → Правительствам планет 15 CR)', unit: 't', basePrice: 15},
  {id: 6, name: 'Оборудование (Machinery)', unit: 't', basePrice: 12},
  {id: 7, name: 'Кристаллы GoBell (GBT-Ore)', unit: 'g', basePrice: 24},
];

export interface GoBellSpaceMission {
  id: string;
  type: 'ADVERT' | 'SOS' | 'BOUNTY';
  title: string;
  clientName: string;
  briefing: string;
  targetSystemId: number;
  rewardCredits: number;
  rewardKarma: number;
  killsRequired: number;
  killsDone: number;
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface WireframeMesh {
  vertices: Vec3[];
  edges: [number, number][];
}

// 1. Вращающаяся 12-гранная станция CORIOLIS со стыковочным шлюзом
const CORIOLIS_MESH: WireframeMesh = {
  vertices: [
    // Передняя грань со шлюзом
    {x: -60, y: -60, z: 90},
    {x: 60, y: -60, z: 90},
    {x: 60, y: 60, z: 90},
    {x: -60, y: 60, z: 90},
    // Средний пояс (восьмиугольник)
    {x: -110, y: -45, z: 0},
    {x: -45, y: -110, z: 0},
    {x: 45, y: -110, z: 0},
    {x: 110, y: -45, z: 0},
    {x: 110, y: 45, z: 0},
    {x: 45, y: 110, z: 0},
    {x: -45, y: 110, z: 0},
    {x: -110, y: 45, z: 0},
    // Задняя грань
    {x: -60, y: -60, z: -90},
    {x: 60, y: -60, z: -90},
    {x: 60, y: 60, z: -90},
    {x: -60, y: 60, z: -90},
    // Прямоугольник стыковочного шлюза (Docking Slot) на передней грани
    {x: -28, y: -10, z: 91},
    {x: 28, y: -10, z: 91},
    {x: 28, y: 10, z: 91},
    {x: -28, y: 10, z: 91},
  ],
  edges: [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 4],
    [12, 13], [13, 14], [14, 15], [15, 12],
    [0, 4], [0, 5], [1, 6], [1, 7], [2, 8], [2, 9], [3, 10], [3, 11],
    [12, 4], [12, 5], [13, 6], [13, 7], [14, 8], [14, 9], [15, 10], [15, 11],
    // Стыковочный шлюз
    [16, 17], [17, 18], [18, 19], [19, 16],
  ],
};

// 2. Классический корабль COBRA MK III (клиновидный многогранник)
const COBRA_MESH: WireframeMesh = {
  vertices: [
    {x: 0, y: 0, z: 55}, // Нос
    {x: -55, y: 0, z: -35}, // Левое крыло
    {x: 55, y: 0, z: -35}, // Правое крыло
    {x: 0, y: 18, z: -10}, // Верх кабины
    {x: 0, y: -14, z: -15}, // Днище
    {x: -25, y: 8, z: -40}, // Корма верх лево
    {x: 25, y: 8, z: -40}, // Корма верх право
    {x: -25, y: -8, z: -40}, // Корма низ лево
    {x: 25, y: -8, z: -40}, // Корма низ право
  ],
  edges: [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [3, 1], [3, 2], [3, 5], [3, 6],
    [4, 1], [4, 2], [4, 7], [4, 8],
    [1, 5], [1, 7], [2, 6], [2, 8],
    [5, 6], [7, 8], [5, 7], [6, 8],
  ],
};

// 3. Корабль чужих THARGOID (восьмиугольная летающая тарелка)
const THARGOID_MESH: WireframeMesh = {
  vertices: [
    {x: 0, y: 22, z: 0}, // Верхний купол
    {x: 0, y: -22, z: 0}, // Нижний купол
    {x: 48, y: 0, z: 20},
    {x: 20, y: 0, z: 48},
    {x: -20, y: 0, z: 48},
    {x: -48, y: 0, z: 20},
    {x: -48, y: 0, z: -20},
    {x: -20, y: 0, z: -48},
    {x: 20, y: 0, z: -48},
    {x: 48, y: 0, z: -20},
  ],
  edges: [
    [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 2],
    [0, 2], [0, 4], [0, 6], [0, 8],
    [1, 3], [1, 5], [1, 7], [1, 9],
  ],
};

// 4. Контейнер с грузом / Спасательная капсула SOS (Октаэдр/Призма)
const CARGO_MESH: WireframeMesh = {
  vertices: [
    {x: 0, y: 20, z: 0},
    {x: 0, y: -20, z: 0},
    {x: -18, y: 0, z: -18},
    {x: 18, y: 0, z: -18},
    {x: 18, y: 0, z: 18},
    {x: -18, y: 0, z: 18},
  ],
  edges: [
    [2, 3], [3, 4], [4, 5], [5, 2],
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
  ],
};

export type PilotLegalStatus = 'LAWFUL' | 'MARAUDER' | 'PIRATE';

export type LogisticsCyclePhase =
  | 'OUTBOUND_FLIGHT' // Перелёт: Своя планета -> Другая планета k (60 сек, груз: ресурс своей планеты)
  | 'WAIT_OTHER_ORBIT' // Задержка на стационарной орбите другой планеты k: 1 минута (60 сек)
  | 'RETURN_FLIGHT' // Возвращение: Другая планета k -> Своя планета (60 сек, груз: ресурс чужой планеты k)
  | 'WAIT_HOME_ORBIT'; // Задержка на стационарной орбите своей планеты: 1 минута (60 сек) перед вылетом к следующей планете k+1

export interface PlanetLogisticsMeta {
  planetIdx: number; // 0..3
  planetOrder: number; // 1..4
  cleanName: string;
  shortTag: string;
  color: string;
  resourceSymbol: AsteroidElementSymbol;
  resourceTitle: string;
  cycleOtherPlanets: [number, number, number]; // Индексы всех остальных планет для безостановочного цикла
}

export const PLANET_LOGISTICS_CONFIG: PlanetLogisticsMeta[] = [
  {
    planetIdx: 0,
    planetOrder: 1,
    cleanName: 'Меркурий',
    shortTag: 'I. МЕРКУРИЙ',
    color: '#fb923c',
    resourceSymbol: 'Fe',
    resourceTitle: 'Железо (Fe)',
    cycleOtherPlanets: [1, 2, 3], // Венера (1) -> Земля (2) -> Марс (3) -> без остановки
  },
  {
    planetIdx: 1,
    planetOrder: 2,
    cleanName: 'Венера',
    shortTag: 'II. ВЕНЕРА',
    color: '#a3e635',
    resourceSymbol: 'Al',
    resourceTitle: 'Алюминий (Al)',
    cycleOtherPlanets: [0, 2, 3], // Меркурий (1) -> Земля (2) -> Марс (3) -> без остановки
  },
  {
    planetIdx: 2,
    planetOrder: 3,
    cleanName: 'Земля',
    shortTag: 'III. ЗЕМЛЯ',
    color: '#38bdf8',
    resourceSymbol: 'H2O',
    resourceTitle: 'Еда и Вода (H₂O/O₂)',
    cycleOtherPlanets: [0, 1, 3], // Меркурий (1) -> Венера (2) -> Марс (3) -> без остановки
  },
  {
    planetIdx: 3,
    planetOrder: 4,
    cleanName: 'Марс',
    shortTag: 'IV. МАРС',
    color: '#f43f5e',
    resourceSymbol: 'Ti',
    resourceTitle: 'Титан (Ti)',
    cycleOtherPlanets: [0, 1, 2], // Меркурий (1) -> Венера (2) -> Земля (3) -> без остановки
  },
];

export const getPlanetResourceInfo = (
  planetIdx: number,
  isOldGalaxy: boolean
): {symbol: AsteroidElementSymbol; title: string; planetName: string; color: string} => {
  const cfg = PLANET_LOGISTICS_CONFIG[planetIdx] || PLANET_LOGISTICS_CONFIG[0];
  if (isOldGalaxy) {
    return {
      symbol: 'Omega',
      title: 'Критическое вещество (Ω-γ)',
      planetName: `Реликтовый узел #${cfg.planetOrder}`,
      color: '#e879f9',
    };
  }
  return {
    symbol: cfg.resourceSymbol,
    title: cfg.resourceTitle,
    planetName: cfg.cleanName,
    color: cfg.color,
  };
};

interface SpaceEntity {
  id: string;
  kind: 'STATION' | 'PIRATE' | 'THARGOID' | 'TRADER' | 'CARGO' | 'SOS_POD' | 'SPACE_DEBRIS';
  label: string;
  pos: Vec3;
  vel: Vec3;
  rot: Vec3;
  rotSpeed: Vec3;
  hp: number;
  maxHp: number;
  massKg?: number; // Текущая масса корабля врага в кг (стандартный корабль = 50 000 кг = 50 т)
  maxMassKg?: number; // Полная масса корабля врага в кг (50 000 кг или выше с бронёй)
  playerHitMassKg?: number; // Сумма кг массы врага, выбитая лично твоими выстрелами (засчитывается в Кредит XP ТОЛЬКО после уничтожения врага!)
  teamHitMassKg?: number; // Сумма кг массы врага, выбитая союзниками по команде
  playerShotsHitCount?: number; // Количество твоих попаданий по этому кораблю
  color: string;
  bounty: number;
  lootOrigin?: 'PLAYER_DESTROYED_SHIP' | 'AFTER_BATTLE';
  lootElement?: AsteroidElementSymbol;
  destroyedShipName?: string;
  // Строгое детерминированное движение в системе по траекториям между планетами (без хаотических движений):
  isLogisticsModule?: boolean; // Автоматический логистический стандартный модуль планеты
  homePlanetIdx?: number; // Индекс своей планеты (0 = Меркурий, 1 = Венера, 2 = Земля, 3 = Марс)
  cycleTargetListIdx?: number; // 0, 1, 2 — номер текущей другой планеты в цикле [другая 1 -> другая 2 -> другая 3]
  logisticsPhase?: LogisticsCyclePhase; // Фаза цикла: перелёт туда / орбита чужой 60с / возврат / орбита своей 60с
  trajFromPlanetIdx?: number; // Планета отправления текущей траектории (0..3)
  trajToPlanetIdx?: number; // Планета назначения текущей траектории (0..3)
  trajProgress?: number; // Прогресс по траектории 0.0 .. 1.0
  trajDurationSec?: number; // Длительность перелёта по траектории (60 сек)
  orbitWaitRemainingSec?: number; // Остаток задержки на стационарной орбите (60 сек = 1 минута)
  isFollowingKilledShipTrajectory?: boolean; // Для груза (CARGO) и мусора (SPACE_DEBRIS): при гибели продолжает двигаться по траектории убитого корабля и исчезает в планете назначения
}

export const buildLogisticsModuleLabel = (ent: SpaceEntity, isOldGalaxy: boolean): string => {
  const homeIdx = ent.homePlanetIdx ?? 0;
  const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[0];
  const targetListIdx = (ent.cycleTargetListIdx ?? 0) % 3;
  const otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];
  const otherCfg = PLANET_LOGISTICS_CONFIG[otherIdx] || PLANET_LOGISTICS_CONFIG[1];
  const homeRes = getPlanetResourceInfo(homeIdx, isOldGalaxy);
  const otherRes = getPlanetResourceInfo(otherIdx, isOldGalaxy);
  const phase = ent.logisticsPhase || 'OUTBOUND_FLIGHT';
  const pct = Math.round(Math.max(0, Math.min(1, ent.trajProgress ?? 0)) * 100);
  const waitSec = Math.ceil(Math.max(0, ent.orbitWaitRemainingSec ?? 60));

  if (phase === 'OUTBOUND_FLIGHT') {
    return `🛰 МОДУЛЬ «${homeCfg.cleanName.toUpperCase()}» [${homeCfg.cleanName} → ${otherCfg.cleanName} (${targetListIdx + 1}/3) · ${pct}% · ГРУЗ СВОЕЙ ПЛ.: ${homeRes.title}]`;
  }
  if (phase === 'WAIT_OTHER_ORBIT') {
    return `🛰 МОДУЛЬ «${homeCfg.cleanName.toUpperCase()}» [ОРБИТА «${otherCfg.cleanName.toUpperCase()}» · ЗАДЕРЖКА ${waitSec}с/60с · ПОГРУЗКА: ${otherRes.title}]`;
  }
  if (phase === 'RETURN_FLIGHT') {
    return `🛰 МОДУЛЬ «${homeCfg.cleanName.toUpperCase()}» [ВОЗВРАТ ${otherCfg.cleanName} → ${homeCfg.cleanName} (${targetListIdx + 1}/3) · ${pct}% · ГРУЗ ЧУЖОЙ ПЛ.: ${otherRes.title}]`;
  }
  const nextTargetIdx = homeCfg.cycleOtherPlanets[(targetListIdx + 1) % 3];
  const nextTargetCfg = PLANET_LOGISTICS_CONFIG[nextTargetIdx] || PLANET_LOGISTICS_CONFIG[0];
  return `🛰 МОДУЛЬ «${homeCfg.cleanName.toUpperCase()}» [ОРБИТА СВОЕЙ ПЛ. «${homeCfg.cleanName.toUpperCase()}» · ЗАДЕРЖКА ${waitSec}с/60с → СЛЕД.: ${nextTargetCfg.cleanName}]`;
};

export const createPlanetaryLogisticsModuleEntity = (
  homePlanetIdx: number,
  sysId: number,
  isOldGalaxy: boolean,
  initialPhase: LogisticsCyclePhase,
  initialTargetListIdx: number,
  initialProgressOrWait: number
): SpaceEntity => {
  const homeCfg = PLANET_LOGISTICS_CONFIG[homePlanetIdx] || PLANET_LOGISTICS_CONFIG[0];
  const targetListIdx = initialTargetListIdx % 3;
  const otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];
  const homeRes = getPlanetResourceInfo(homePlanetIdx, isOldGalaxy);
  const otherRes = getPlanetResourceInfo(otherIdx, isOldGalaxy);

  const isOutboundOrHome =
    initialPhase === 'OUTBOUND_FLIGHT' || initialPhase === 'WAIT_HOME_ORBIT';
  const activeLootSym = isOutboundOrHome ? homeRes.symbol : otherRes.symbol;
  const fromIdx =
    initialPhase === 'OUTBOUND_FLIGHT'
      ? homePlanetIdx
      : initialPhase === 'WAIT_OTHER_ORBIT'
      ? otherIdx
      : initialPhase === 'RETURN_FLIGHT'
      ? otherIdx
      : homePlanetIdx;
  const toIdx =
    initialPhase === 'OUTBOUND_FLIGHT'
      ? otherIdx
      : initialPhase === 'WAIT_OTHER_ORBIT'
      ? otherIdx
      : initialPhase === 'RETURN_FLIGHT'
      ? homePlanetIdx
      : homePlanetIdx;
  const prog =
    initialPhase === 'OUTBOUND_FLIGHT' || initialPhase === 'RETURN_FLIGHT'
      ? Math.max(0, Math.min(0.99, initialProgressOrWait))
      : initialPhase === 'WAIT_OTHER_ORBIT'
      ? 1
      : 0;
  const waitSec =
    initialPhase === 'WAIT_OTHER_ORBIT' || initialPhase === 'WAIT_HOME_ORBIT'
      ? Math.max(1, Math.min(60, initialProgressOrWait))
      : 60;

  const entity: SpaceEntity = {
    id: `logistics-module-${sysId}-p${homePlanetIdx}-${Date.now()}-${Math.floor(prog * 100)}`,
    kind: 'TRADER',
    label: '',
    pos: {x: 0, y: 0, z: 1200},
    vel: {x: 0, y: 0, z: 0}, // Никаких хаотических скоростей — строго по траектории!
    rot: {x: 0, y: 0, z: 0}, // Никакого хаотического вращения вокруг осей — нос строго по маршруту!
    rotSpeed: {x: 0, y: 0, z: 0},
    hp: 100,
    maxHp: 100,
    massKg: 50000, // Стандартный логистический модуль полной массой 50 т (50 000 кг)
    maxMassKg: 50000,
    playerHitMassKg: 0,
    teamHitMassKg: 0,
    playerShotsHitCount: 0,
    color: homeRes.color,
    bounty: isOldGalaxy ? 550 : 200,
    lootElement: activeLootSym,
    isLogisticsModule: true,
    homePlanetIdx,
    cycleTargetListIdx: targetListIdx,
    logisticsPhase: initialPhase,
    trajFromPlanetIdx: fromIdx,
    trajToPlanetIdx: toIdx,
    trajProgress: prog,
    trajDurationSec: 60,
    orbitWaitRemainingSec: waitSec,
  };
  entity.label = buildLogisticsModuleLabel(entity, isOldGalaxy);
  return entity;
};

export const createKilledShipTrajectoryDrops = (
  killedEntity: SpaceEntity,
  currentSystemId: number,
  isOldGalaxy: boolean
): SpaceEntity[] => {
  const fromIdx = killedEntity.trajFromPlanetIdx ?? killedEntity.homePlanetIdx ?? 0;
  const toIdx =
    killedEntity.trajToPlanetIdx !== undefined && killedEntity.trajToPlanetIdx !== fromIdx
      ? killedEntity.trajToPlanetIdx
      : ((fromIdx + 1) % 4);
  const currentProg = Math.max(0.04, Math.min(0.95, killedEntity.trajProgress ?? 0.35));
  const destCfg = PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[0];
  const droppedSym: AsteroidElementSymbol =
    killedEntity.lootElement ||
    getPlanetResourceInfo(fromIdx, isOldGalaxy).symbol;
  const droppedMeta = ASTEROID_PERIODIC_ELEMENTS[droppedSym];
  const shipCleanName = killedEntity.label.split('[')[0].trim();

  // 1) Груз убитого корабля: продолжает двигаться строго по траектории убитого корабля в планету назначения.
  // Если не подобрали — исчезает в планете назначения, чтобы мусора не было!
  // Если уничтожить выстрелом — считается уничтожением астероида и вознаграждается соответственно!
  const cargoEntity: SpaceEntity = {
    id: `traj-cargo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    kind: 'CARGO',
    label: `📦 ГРУЗ ПО ТРАЕКТОРИИ [1т ${droppedMeta.displaySymbol} → ИСЧЕЗНЕТ В ПЛ. «${destCfg.cleanName.toUpperCase()}» | СКМ=ВЗЯТЬ / ЛКМ=КАК АСТЕРОИД]`,
    pos: {...killedEntity.pos},
    vel: {x: 0, y: 0, z: 0},
    rot: {x: 0, y: 0, z: 0},
    rotSpeed: {x: 0, y: 0, z: 0},
    hp: 40,
    maxHp: 40,
    color: '#ff0055',
    bounty: 0,
    lootOrigin: 'PLAYER_DESTROYED_SHIP',
    lootElement: droppedSym,
    destroyedShipName: shipCleanName,
    trajFromPlanetIdx: fromIdx,
    trajToPlanetIdx: toIdx,
    trajProgress: currentProg,
    trajDurationSec: 60,
    isFollowingKilledShipTrajectory: true,
  };

  // 2) Мусор (обломки убитого корабля): также движется строго по траектории убитого корабля и исчезает в планете назначения,
  // а его уничтожение считается уничтожением астероида и вознаграждается соответственно!
  const debrisEntity: SpaceEntity = {
    id: `traj-debris-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    kind: 'SPACE_DEBRIS',
    label: `🪨 МУСОР ОБЛОМКОВ ПО ТРАЕКТОРИИ [→ ИСЧЕЗНЕТ В ПЛ. «${destCfg.cleanName.toUpperCase()}» | ЛКМ/ПКМ = УНИЧТОЖИТЬ КАК АСТЕРОИД!]`,
    pos: {...killedEntity.pos},
    vel: {x: 0, y: 0, z: 0},
    rot: {x: 0, y: 0, z: 0},
    rotSpeed: {x: 0, y: 0, z: 0},
    hp: 35,
    maxHp: 35,
    color: '#94a3b8',
    bounty: 0,
    destroyedShipName: shipCleanName,
    trajFromPlanetIdx: fromIdx,
    trajToPlanetIdx: toIdx,
    trajProgress: Math.min(0.98, currentProg + 0.025),
    trajDurationSec: 60,
    isFollowingKilledShipTrajectory: true,
  };

  const result: SpaceEntity[] = [cargoEntity, debrisEntity];

  // Если был сбит автоматический логистический модуль планеты — родная планета выводит следующий стандартный модуль
  // на свою стационарную орбиту (задержка 60 сек) для безостановочного продолжения цикла со следующей планетой!
  if (killedEntity.isLogisticsModule && killedEntity.homePlanetIdx !== undefined) {
    const nextTargetListIdx = ((killedEntity.cycleTargetListIdx ?? 0) + 1) % 3;
    const replacementModule = createPlanetaryLogisticsModuleEntity(
      killedEntity.homePlanetIdx,
      currentSystemId,
      isOldGalaxy,
      'WAIT_HOME_ORBIT',
      nextTargetListIdx,
      60
    );
    result.push(replacementModule);
  }

  return result;
};

export const stepSystemTrajectories = (
  entities: SpaceEntity[],
  dtSec: number,
  isOldGalaxy: boolean,
  onCargoOrDebrisAbsorbed?: (label: string, destPlanetName: string) => void
): SpaceEntity[] => {
  const nextEntities: SpaceEntity[] = [];

  for (const ent of entities) {
    if (ent.isLogisticsModule && ent.homePlanetIdx !== undefined) {
      const homeIdx = ent.homePlanetIdx;
      const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[0];
      let targetListIdx = (ent.cycleTargetListIdx ?? 0) % 3;
      let otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];
      let phase: LogisticsCyclePhase = ent.logisticsPhase || 'OUTBOUND_FLIGHT';
      let prog = ent.trajProgress ?? 0;
      let waitSec = ent.orbitWaitRemainingSec ?? 60;
      const flightDuration = ent.trajDurationSec || 60;

      if (phase === 'OUTBOUND_FLIGHT') {
        prog += dtSec / flightDuration;
        ent.trajFromPlanetIdx = homeIdx;
        ent.trajToPlanetIdx = otherIdx;
        ent.lootElement = getPlanetResourceInfo(homeIdx, isOldGalaxy).symbol; // Груз со своей планеты — её ресурсы!
        if (prog >= 1) {
          prog = 1;
          phase = 'WAIT_OTHER_ORBIT';
          waitSec = 60; // Задержка на стационарной орбите другой планеты — 1 минута (60 сек)
        }
      } else if (phase === 'WAIT_OTHER_ORBIT') {
        waitSec -= dtSec;
        ent.trajFromPlanetIdx = otherIdx;
        ent.trajToPlanetIdx = otherIdx;
        prog = 1;
        ent.lootElement = getPlanetResourceInfo(otherIdx, isOldGalaxy).symbol; // На орбите чужой планеты загружаются её ресурсы!
        if (waitSec <= 0) {
          waitSec = 0;
          phase = 'RETURN_FLIGHT';
          prog = 0;
          ent.trajFromPlanetIdx = otherIdx;
          ent.trajToPlanetIdx = homeIdx;
        }
      } else if (phase === 'RETURN_FLIGHT') {
        prog += dtSec / flightDuration;
        ent.trajFromPlanetIdx = otherIdx;
        ent.trajToPlanetIdx = homeIdx;
        ent.lootElement = getPlanetResourceInfo(otherIdx, isOldGalaxy).symbol; // Груз с чужой планеты — её ресурсы!
        if (prog >= 1) {
          prog = 1;
          phase = 'WAIT_HOME_ORBIT';
          waitSec = 60; // Задержка на стационарной орбите своей планеты на 1 минуту (60 сек)
        }
      } else if (phase === 'WAIT_HOME_ORBIT') {
        waitSec -= dtSec;
        ent.trajFromPlanetIdx = homeIdx;
        ent.trajToPlanetIdx = homeIdx;
        prog = 0;
        ent.lootElement = getPlanetResourceInfo(homeIdx, isOldGalaxy).symbol; // Загрузка ресурса своей планеты
        if (waitSec <= 0) {
          // Переход к следующей планете по циклу (другая планета 2, другая планета 3, и снова другая планета 1 без остановки!)
          targetListIdx = (targetListIdx + 1) % 3;
          otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];
          phase = 'OUTBOUND_FLIGHT';
          prog = 0;
          waitSec = 60;
          ent.trajFromPlanetIdx = homeIdx;
          ent.trajToPlanetIdx = otherIdx;
        }
      }

      ent.cycleTargetListIdx = targetListIdx;
      ent.logisticsPhase = phase;
      ent.trajProgress = prog;
      ent.orbitWaitRemainingSec = waitSec;
      ent.label = buildLogisticsModuleLabel(ent, isOldGalaxy);
      nextEntities.push(ent);
    } else if (ent.isFollowingKilledShipTrajectory) {
      // Движение груза (CARGO) и мусора (SPACE_DEBRIS) по траектории убитого корабля:
      // если его не подобрали (и не расстреляли как астероид) — он исчезает в планете назначения, чтобы мусора не было!
      const flightDuration = ent.trajDurationSec || 60;
      const nextProg = (ent.trajProgress ?? 0) + dtSec / flightDuration;
      const toIdx = ent.trajToPlanetIdx ?? 0;
      const destCfg = PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[0];

      if (nextProg >= 1) {
        onCargoOrDebrisAbsorbed?.(ent.label, destCfg.cleanName);
        // Не добавляем в nextEntities — объект исчез в планете назначения, чтобы мусора не было!
        continue;
      }

      ent.trajProgress = nextProg;
      const pct = Math.round(nextProg * 100);
      if (ent.kind === 'CARGO') {
        const sym = ent.lootElement || 'Fe';
        const meta = ASTEROID_PERIODIC_ELEMENTS[sym];
        const originTag =
          ent.lootOrigin === 'PLAYER_DESTROYED_SHIP' ? 'СКМ=ПИРАТ' : 'СКМ=МАРОДЁР';
        ent.label = `📦 ГРУЗ НА ТРАЕКТОРИИ [1т ${meta.displaySymbol} · ${pct}% → ИСЧЕЗНЕТ В «${destCfg.cleanName.toUpperCase()}» | ${originTag} / ЛКМ=АСТЕРОИД]`;
      } else if (ent.kind === 'SPACE_DEBRIS') {
        ent.label = `🪨 МУСОР НА ТРАЕКТОРИИ [${pct}% → ИСЧЕЗНЕТ В «${destCfg.cleanName.toUpperCase()}» | ЛКМ/ПКМ = УНИЧТОЖИТЬ КАК АСТЕРОИД!]`;
      }
      nextEntities.push(ent);
    } else {
      nextEntities.push(ent);
    }
  }

  return nextEntities;
};

export interface LogisticsUiSnapshotItem {
  id: string;
  planetName: string;
  phaseLabel: string;
  routeLabel: string;
  cargoLabel: string;
  timerSec: number;
  progressPct: number;
  color: string;
  isCargoOrDebris: boolean;
  isWaitingOrbit?: boolean;
}

export const buildLogisticsUiSnapshot = (
  entities: SpaceEntity[],
  isOldGalaxy: boolean
): LogisticsUiSnapshotItem[] => {
  const result: LogisticsUiSnapshotItem[] = [];
  for (const ent of entities) {
    if (ent.isLogisticsModule && ent.homePlanetIdx !== undefined) {
      const homeIdx = ent.homePlanetIdx;
      const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[0];
      const targetListIdx = (ent.cycleTargetListIdx ?? 0) % 3;
      const otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];
      const otherCfg = PLANET_LOGISTICS_CONFIG[otherIdx] || PLANET_LOGISTICS_CONFIG[1];
      const homeRes = getPlanetResourceInfo(homeIdx, isOldGalaxy);
      const otherRes = getPlanetResourceInfo(otherIdx, isOldGalaxy);
      const phase: LogisticsCyclePhase = ent.logisticsPhase || 'OUTBOUND_FLIGHT';
      const isWait = phase === 'WAIT_OTHER_ORBIT' || phase === 'WAIT_HOME_ORBIT';
      const waitSec = Math.ceil(Math.max(0, ent.orbitWaitRemainingSec ?? 60));
      const flightDuration = ent.trajDurationSec || 60;
      const progRatio = Math.max(0, Math.min(1, ent.trajProgress ?? 0));
      const flightRemSec = Math.ceil(Math.max(0, (1 - progRatio) * flightDuration));
      const timerSec = isWait ? waitSec : flightRemSec;
      const progressPct = isWait
        ? Math.min(100, Math.max(0, Math.round(((60 - waitSec) / 60) * 100)))
        : Math.round(progRatio * 100);

      const phaseLabel =
        phase === 'OUTBOUND_FLIGHT'
          ? `Перелёт: ${homeCfg.cleanName} → ${otherCfg.cleanName} (${targetListIdx + 1}/3)`
          : phase === 'WAIT_OTHER_ORBIT'
          ? `Стац. орбита «${otherCfg.cleanName}» (задержка 1 мин)`
          : phase === 'RETURN_FLIGHT'
          ? `Возврат: ${otherCfg.cleanName} → ${homeCfg.cleanName} (${targetListIdx + 1}/3)`
          : `Стац. орбита своей планеты «${homeCfg.cleanName}» (1 мин)`;

      const cargoLabel =
        phase === 'OUTBOUND_FLIGHT' || phase === 'WAIT_HOME_ORBIT'
          ? `Со своей планеты: ${homeRes.title}`
          : `С чужой планеты: ${otherRes.title}`;

      result.push({
        id: ent.id,
        planetName: `${homeCfg.shortTag} (Модуль 50т)`,
        phaseLabel,
        routeLabel: `${homeCfg.cleanName} ⇄ ${otherCfg.cleanName} (#${targetListIdx + 1}/3)`,
        cargoLabel,
        timerSec,
        progressPct,
        color: ent.color,
        isCargoOrDebris: false,
        isWaitingOrbit: isWait,
      });
    } else if (
      ent.isFollowingKilledShipTrajectory ||
      ent.kind === 'CARGO' ||
      ent.kind === 'SPACE_DEBRIS'
    ) {
      const fromIdx = ent.trajFromPlanetIdx ?? 3;
      const toIdx = ent.trajToPlanetIdx ?? 2;
      const fromCfg = PLANET_LOGISTICS_CONFIG[fromIdx] || PLANET_LOGISTICS_CONFIG[3];
      const toCfg = PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[2];
      const progRatio = Math.max(0, Math.min(1, ent.trajProgress ?? 0));
      const flightDuration = ent.trajDurationSec || 60;
      const timerSec = Math.ceil(Math.max(0, (1 - progRatio) * flightDuration));
      const progressPct = Math.round(progRatio * 100);
      const isDebris = ent.kind === 'SPACE_DEBRIS';
      const sym = ent.lootElement || 'Fe';
      const meta = ASTEROID_PERIODIC_ELEMENTS[sym];

      result.push({
        id: ent.id,
        planetName: isDebris
          ? '🪨 Мусор на траектории убитого корабля'
          : '📦 Груз на траектории убитого корабля',
        phaseLabel: `По траектории ${fromCfg.cleanName} → ${toCfg.cleanName} (исчезнет в «${toCfg.cleanName}»)`,
        routeLabel: `${fromCfg.cleanName} → ${toCfg.cleanName}`,
        cargoLabel: isDebris
          ? 'Космический мусор (ЛКМ/ПКМ = уничтожить как астероид)'
          : `1т [${meta.displaySymbol}] ${meta.nameRu} (СКМ=Взять / ЛКМ=Астероид)`,
        timerSec,
        progressPct,
        color: ent.color,
        isCargoOrDebris: true,
        isWaitingOrbit: false,
      });
    }
  }
  return result;
};

interface DebrisParticle {
  pos: Vec3;
  vel: Vec3;
  ttl: number;
  color: string;
}

interface PlanetGoBellObject {
  id: string;
  planetId: string;
  planetCleanName: string; // "Меркурий", "Венера", "Земля", "Марс"
  planetOrder?: number; // 1 = Железо, 2 = Алюминий, 3 = Продовольствие и Вода (O₂), 4 = Титан
  specializationBadge?: string;
  specializationPurpose?: string;
  kind: 'GROUP' | 'BUSINESS' | 'ADVERT';
  title: string; // Название объекта (для группы — название планеты, для бизнеса — бизнес, для объявления — слот #1..#4)
  description: string; // Описание объекта (для группы — "Друзья планеты", для бизнеса и его 4 объявлений — текст/теги)
  authorName: string; // Имя для формы запроса на контакт в GoBell
  groupTag?: string; // Например: "GO-MERCURY"
  slotId?: number; // 1..4 для четырёх объявлений бизнеса
  parentBusinessId?: string;
  karmaPlus: number;
  karmaMinus: number;
  latDeg: number; // Широта на 3D-сфере планеты
  lonOffsetDeg: number; // Долгота на 3D-сфере планеты
}

interface ProjectedPlanetObjectHit {
  obj: PlanetGoBellObject;
  planetName: string;
  canvasX: number;
  canvasY: number;
  hitRadius: number;
}

interface SystemPlanet {
  id: string;
  name: string;
  cleanName: string;
  shortMarker: string;
  specializationShort: string;
  orbitOrder: number; // 1..4 (Меркурий, Венера, Земля, Марс)
  orbitRadius: number; // 6000, 12000, 18000, 24000 (ровно 6000 ед = 1 минута полёта на макс. скорости 100 ед/с!)
  orbitAngle: number;
  orbitSpeed: number;
  radius3D: number;
  spinAngle: number;
  spinSpeed: number; // Замедлено в 3 раза для удобного взаимодействия с объектами GoBell на планете!
  color: string;
  labelOffsetY: number;
  isMainWorld?: boolean;
  gobellObjects: PlanetGoBellObject[];
}

export type AsteroidElementSymbol =
  | 'H2O'
  | 'Fe'
  | 'Al'
  | 'Ti'
  | 'Cu'
  | 'Ni'
  | 'Co'
  | 'Li'
  | 'Ag'
  | 'Pt'
  | 'Au'
  | 'Omega';

export interface AsteroidElementMeta {
  symbol: AsteroidElementSymbol;
  displaySymbol: string;
  atomicNumber: string;
  nameRu: string;
  earthPriceNote: string;
  sellPriceCr: number; // Полцены (50%) — цена, по которой Правительства планет ЗАКУПАЮТ у пилотов
  fullPriceCr: number; // Полная цена (100%) — цена, по которой Правительства планет ПРОДАЮТ
  color: string;
}

// Элементы периодической системы и Вода (H₂O), добываемые в Поясе Астероидов (всё кроме продовольствия!):
// • Правительства планет ЗАКУПАЮТ за полцены (50% = sellPriceCr) и ПРОДАЮТ за полную цену (100% = fullPriceCr)
//   в соответствии с текущими пропорциями цен на рынке реальной Земли!
// • Если пилот подписывается на БИЗНЕС-АККАУНТ (BUSINESS), он может создать свой бизнес с МЕНЬШЕЙ МАРЖОЙ:
//   закупать по ЗАВЫШЕННОЙ цене (например, 70%–75% вместо 50% у правительств),
//   а продавать по ЗАНИЖЕННОЙ цене (например, 85%–90% вместо 100% у правительств)!
export const ASTEROID_PERIODIC_ELEMENTS: Record<AsteroidElementSymbol, AsteroidElementMeta> = {
  H2O: {
    symbol: 'H2O',
    displaySymbol: 'H₂O',
    atomicNumber: 'Лёд H₂O/O₂',
    nameRu: 'Вода (Астероидный лёд H₂O/O₂)',
    earthPriceNote: 'Рынок Земли (~$200/т · 0.4× к Fe): Прав-во закупает 50% (2 CR) / продаёт 100% (4 CR)',
    sellPriceCr: 2,
    fullPriceCr: 4,
    color: '#38bdf8',
  },
  Fe: {
    symbol: 'Fe',
    displaySymbol: 'Fe',
    atomicNumber: '№26 Fe',
    nameRu: 'Железо (Fe)',
    earthPriceNote: 'База рынка Земли (~$500/т · 1.0×): Прав-во закупает 50% (5 CR) / продаёт 100% (10 CR)',
    sellPriceCr: 5,
    fullPriceCr: 10,
    color: '#fb923c',
  },
  Al: {
    symbol: 'Al',
    displaySymbol: 'Al',
    atomicNumber: '№13 Al',
    nameRu: 'Алюминий (Al)',
    earthPriceNote: 'Пропорция Земли (~$2 400/т · 4.8× к Fe): Прав-во закупает 50% (24 CR) / продаёт 100% (48 CR)',
    sellPriceCr: 24,
    fullPriceCr: 48,
    color: '#a3e635',
  },
  Ti: {
    symbol: 'Ti',
    displaySymbol: 'Ti',
    atomicNumber: '№22 Ti',
    nameRu: 'Титан (Ti)',
    earthPriceNote: 'Пропорция Земли (~$6 500/т · 13× к Fe): Прав-во закупает 50% (65 CR) / продаёт 100% (130 CR)',
    sellPriceCr: 65,
    fullPriceCr: 130,
    color: '#f43f5e',
  },
  Cu: {
    symbol: 'Cu',
    displaySymbol: 'Cu',
    atomicNumber: '№29 Cu',
    nameRu: 'Медь (Cu)',
    earthPriceNote: 'Пропорция Земли (~$9 500/т · 19× к Fe): Прав-во закупает 50% (95 CR) / продаёт 100% (190 CR)',
    sellPriceCr: 95,
    fullPriceCr: 190,
    color: '#f59e0b',
  },
  Ni: {
    symbol: 'Ni',
    displaySymbol: 'Ni',
    atomicNumber: '№28 Ni',
    nameRu: 'Никель (Ni)',
    earthPriceNote: 'Пропорция Земли (~$16 500/т · 33× к Fe): Прав-во закупает 50% (165 CR) / продаёт 100% (330 CR)',
    sellPriceCr: 165,
    fullPriceCr: 330,
    color: '#2dd4bf',
  },
  Co: {
    symbol: 'Co',
    displaySymbol: 'Co',
    atomicNumber: '№27 Co',
    nameRu: 'Кобальт (Co)',
    earthPriceNote: 'Пропорция Земли (~$28 000/т · 56× к Fe): Прав-во закупает 50% (280 CR) / продаёт 100% (560 CR)',
    sellPriceCr: 280,
    fullPriceCr: 560,
    color: '#818cf8',
  },
  Li: {
    symbol: 'Li',
    displaySymbol: 'Li',
    atomicNumber: '№3 Li',
    nameRu: 'Литий (Li)',
    earthPriceNote: 'Пропорция Земли (~$35 000/т · 70× к Fe): Прав-во закупает 50% (350 CR) / продаёт 100% (700 CR)',
    sellPriceCr: 350,
    fullPriceCr: 700,
    color: '#c084fc',
  },
  Ag: {
    symbol: 'Ag',
    displaySymbol: 'Ag',
    atomicNumber: '№47 Ag',
    nameRu: 'Серебро (Ag)',
    earthPriceNote: 'Драгметалл Земли (~180× к Fe): Прав-во закупает 50% (900 CR) / продаёт 100% (1 800 CR)',
    sellPriceCr: 900,
    fullPriceCr: 1800,
    color: '#e2e8f0',
  },
  Pt: {
    symbol: 'Pt',
    displaySymbol: 'Pt',
    atomicNumber: '№78 Pt',
    nameRu: 'Платина (Pt)',
    earthPriceNote: 'Драгметалл Земли (~480× к Fe): Прав-во закупает 50% (2 400 CR) / продаёт 100% (4 800 CR)',
    sellPriceCr: 2400,
    fullPriceCr: 4800,
    color: '#67e8f9',
  },
  Au: {
    symbol: 'Au',
    displaySymbol: 'Au',
    atomicNumber: '№79 Au',
    nameRu: 'Золото (Au)',
    earthPriceNote: 'Драгметалл Земли (~750× к Fe): Прав-во закупает 50% (3 750 CR) / продаёт 100% (7 500 CR)',
    sellPriceCr: 3750,
    fullPriceCr: 7500,
    color: '#fde047',
  },
  Omega: {
    symbol: 'Omega',
    displaySymbol: 'Ω-γ',
    atomicNumber: 'Узел Ω-γ',
    nameRu: 'Критическое вещество (Ω-γ · Размыкание узлов)',
    earthPriceNote:
      'Онтологическое топливо из старых галактик (супер-энергия ≫ ядерной для тяжёлых кораблей и гамма-оружия): Прав-во 5 000 CR / Рынок 10 000 CR / Контрабанда 16 500 CR!',
    sellPriceCr: 5000,
    fullPriceCr: 10000,
    color: '#e879f9',
  },
};

export interface PilotCreatedSpaceBusiness {
  isCreated: boolean;
  name: string;
  description: string;
  planetOrder: 1 | 2 | 3 | 4; // 1=Меркурий, 2=Венера, 3=Земля, 4=Марс
  buyRatePct: number; // Закупка по завышенной по сравнению с правительствами (>50%, например 70%)
  sellRatePct: number; // Продажа по заниженной по сравнению с правительствами (<100%, например 85%)
  totalTurnoverProfitCr: number;
  dealsCount: number;
}

export type SubspacePointPreset =
  | 'NEAR_SHIP'
  | 'CURSOR'
  | 'STAR'
  | 'MERCURY'
  | 'VENUS'
  | 'EARTH'
  | 'MARS'
  | 'BELT'
  | 'EDGE'
  | 'CUSTOM';

export interface SubspaceFixationSlot {
  slotId: number;
  text: string;
  placementMode: 'NEAR_SHIP' | 'ANY_POINT'; // Прямо возле себя (Местный) либо В любой точке (Гость)
  pointPreset: SubspacePointPreset;
  customCoords: Vec3; // Относительно Центральной Звезды в базисе эклиптики (U, N, V)
  isFixedInSpace: boolean;
  fixedCoordsInSystem: Vec3 | null; // Координаты в базисе эклиптики (dU, dN, dV от Звезды)
  fixedPointLabel: string;
  inAuctionPool: boolean; // Передан ли слот в Пул аукциона «Подпространственный канал фиксации» (доля в пуле аукциона)
  autoRenewMode: 'OFF' | 'DAYS' | 'INFINITE';
  autoRenewDays: number;
  withdrawingBufferSec: number; // 24ч буфер возврата слота из пула аукциона
}

export const ASTEROID_ELEMENT_ORDER: AsteroidElementSymbol[] = [
  'H2O',
  'Fe',
  'Al',
  'Ti',
  'Cu',
  'Ni',
  'Co',
  'Li',
  'Ag',
  'Pt',
  'Au',
  'Omega',
];

interface SystemAsteroid {
  id: string;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  yOffset: number;
  size3D: number;
  rotAngle: number;
  rotSpeed: number;
  color: string;
  isValuable: boolean; // false = простой булыжник (исчезает бесследно со взрывом), true = имеет ценность (элемент периодической системы или вода H₂O)
  revealed: boolean; // false до огневого контакта (все булыжники неразличимы!), true после выстрела — помечается как Fe, Al, Ti, H₂O...
  elementSymbol?: AsteroidElementSymbol;
}

// МАСШТАБ ЗВЁЗДНОЙ СИСТЕМЫ И СФЕРЫ ГРАНИЦЫ:
// Максимальная скорость корабля = 100 ед./сек.
// 1 минута полёта на макс. скорости (60 сек) = 6 000 ед. (шаг между орбитами планет!).
// 5 минут полёта на макс. скорости (300 сек) = 30 000 ед. (радиус Сферы Системы от окраины до Звезды!).
const SYSTEM_SPHERE_RADIUS = 30000;
const PLANET_ORBIT_STEP = 6000; // 1 минута (60с) между планетами при Vmax = 100 ед/с
const MAX_SYSTEM_SPEED = 100; // 100 ед/с = 6000 ед/мин = 30000 ед за 5 минут

const formatFlightEta = (distUnits: number, speedUnitsPerSec: number): string => {
  const effectiveSpd = Math.max(1, speedUnitsPerSec);
  const totalSec = Math.max(0, Math.round(distUnits / effectiveSpd));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}м ${secs < 10 ? '0' : ''}${secs}с`;
};

export const GoBellEliteGame: React.FC<GoBellEliteGameProps> = ({
  isOpen,
  onClose,
  missionSeeds,
  pilotName,
  onEarnKarmaAndBonus,
  onSendPlanetContactRequest,
  initialTariff = 'FREE',
  onChangeGoBellTariff,
  isSmartphoneGeoActive = true,
  smartphoneGeoCoords = {lat: 49.2331, lng: 28.4682},
  pilotProfileTags = [],
  onToggleSmartphoneGeo,
  onViewPlayerOnRealMap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const [isGeoBeaconModalOpen, setIsGeoBeaconModalOpen] = useState<boolean>(false);

  // Состояние наведённого/выбранного объекта GoBell на поверхности 3D-сферы планеты (Группа / Бизнес / 4 Объявления бизнеса)
  const [hoveredPlanetObjUi, setHoveredPlanetObjUi] = useState<{
    obj: PlanetGoBellObject;
    planetName: string;
    canvasX: number;
    canvasY: number;
    leftPx: number;
    topPx: number;
  } | null>(null);
  const isHoveringPopupRef = useRef<boolean>(false);
  const hoveredPlanetObjRef = useRef<PlanetGoBellObject | null>(null);
  const projectedPlanetObjectsRef = useRef<ProjectedPlanetObjectHit[]>([]);

  // Модальное окно «Форма запроса на контакт» (точно как на карте GoBell)
  const [planetContactTarget, setPlanetContactTarget] = useState<{
    obj: PlanetGoBellObject;
    planetName: string;
  } | null>(null);
  const [planetContactNote, setPlanetContactNote] = useState<string>('');
  const [sentContactBanner, setSentContactBanner] = useState<{
    targetName: string;
    planetName: string;
    category: 'GROUPS' | 'BUSINESS' | 'ADVERT';
    note: string;
  } | null>(null);

  // Звуковой бипер ZX Spectrum (Web Audio API)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playZxBeep = useCallback(
    (type: 'LASER' | 'HIT' | 'EXPLODE' | 'HYPERSPACE' | 'DOCK' | 'MISSION') => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square'; // Классический прямоугольный импульс ZX Spectrum Beeper
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'LASER') {
          osc.frequency.setValueAtTime(980, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.11);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.11);
          osc.start(now);
          osc.stop(now + 0.11);
        } else if (type === 'HIT') {
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(110, now + 0.08);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'EXPLODE') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.42);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.42);
          osc.start(now);
          osc.stop(now + 0.42);
        } else if (type === 'HYPERSPACE') {
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.9);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.9);
          osc.start(now);
          osc.stop(now + 0.9);
        } else if (type === 'DOCK' || type === 'MISSION') {
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          osc.frequency.setValueAtTime(783.99, now + 0.16);
          osc.frequency.setValueAtTime(1046.5, now + 0.24);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.38);
          osc.start(now);
          osc.stop(now + 0.38);
        }
      } catch {
        // Игнорируем ограничения автозапуска аудио
      }
    },
    [soundEnabled]
  );

  // Состояние командира корабля Cobra Mk III
  const [credits, setCredits] = useState<number>(1000);
  const [fuel, setFuel] = useState<number>(7.0); // макс 7.0 световых лет
  const [currentSystemId, setCurrentSystemId] = useState<number>(0);
  const [targetSystemId, setTargetSystemId] = useState<number>(1);
  const [cargoHold, setCargoHold] = useState<Record<number, number>>({});
  const [maxCargoCapacity, setMaxCargoCapacity] = useState<number>(20);
  const [hasMilitaryLaser, setHasMilitaryLaser] = useState<boolean>(false);
  const [eliteKills, setEliteKills] = useState<number>(0);
  const [earnedGoBellKarma, setEarnedGoBellKarma] = useState<number>(0);

  // =========================================================================
  // БОРТОВЫЕ ЗАПАСЫ СПЕЦИАЛИЗАЦИИ ПЛАНЕТ И ЗВЕЗДЫ:
  // • Звезда — источник энергии (заряжает энергию и щиты от близости)
  // • 1-я планета (Меркурий) — ЖЕЛЕЗО (Fe): необходимый запас для восстановления повреждений во время гиперпрыжка
  // • 2-я планета (Венера) — АЛЮМИНИЙ (Al): необходим для восстановления повреждений во время гиперпрыжка
  // • 3-я планета (Земля) — ПРОДОВОЛЬСТВИЕ (автономное нахождение в космосе) и ВОДА (питьё и источник кислорода O₂)
  // • 4-я планета (Марс) — ТИТАН (Ti): необходимый для восстановления повреждений во время гиперпрыжка
  // =========================================================================
  const [ironStock, setIronStock] = useState<number>(2); // Железо (Fe), тонн в грузовом отсеке
  const [aluminumStock, setAluminumStock] = useState<number>(2); // Алюминий (Al), тонн в грузовом отсеке
  const [titaniumStock, setTitaniumStock] = useState<number>(2); // Титан (Ti), тонн в грузовом отсеке
  const [foodWaterCargoStock, setFoodWaterCargoStock] = useState<number>(1); // Контейнеры Продовольствия с Земли (в поясе астероидов продовольствие НЕ добывается!)
  const [foodStockPct, setFoodStockPct] = useState<number>(100); // Продовольствие (автономное нахождение в космосе — только с Земли!), %
  const [waterOxygenStockPct, setWaterOxygenStockPct] = useState<number>(100); // Вода (питьё и источник кислорода O₂ — можно пополнять и на Земле, и льдом H₂O в поясе астероидов!), %
  const [hullIntegrityPct, setHullIntegrityPct] = useState<number>(100); // Целостность корпуса (восстанавливается Железом + Алюминием + Титаном при гиперпрыжке)

  // Грузовой отсек для элементов периодической системы и воды (H₂O), добытых в Поясе Астероидов
  // (Fe, Al, Ti учитываются в ironStock, aluminumStock, titaniumStock, а здесь — H₂O, Cu, Ni, Co, Li, Ag, Pt, Au)
  const [minedElementsHold, setMinedElementsHold] = useState<
    Record<Exclude<AsteroidElementSymbol, 'Fe' | 'Al' | 'Ti'>, number>
  >({
    H2O: 0,
    Cu: 0,
    Ni: 0,
    Co: 0,
    Li: 0,
    Ag: 0,
    Pt: 0,
    Au: 0,
    Omega: 1, // Стартовый образец Критического вещества (Ω-γ) для испытания контролируемого размыкания узлов или контрабанды!
  });

  // =========================================================================
  // ОНТОЛОГИЧЕСКАЯ МОДЕЛЬ ДИССИПАЦИИ ВЕЩЕСТВА И КРИТИЧЕСКОГО ВЕЩЕСТВА (Ω-γ):
  // • Вещество обладает конечным сроком жизни вследствие диссипации, ослабляющей внутренние связи.
  // • В конечном итоге локальный узел не может быть замкнутым и размыкается в виде гамма-квантов —
  //   аналог гамма-всплеска сверхновой, но БЕЗ ПОСЛЕСВЕЧЕНИЯ.
  // • В звёздах этот процесс лавинообразный (особенно в старых галактиках без заселённых планет).
  // • При наличии Критического вещества (Ω-γ) размыкание локальных узлов осуществляется КОНТРОЛИРУЕМО,
  //   что даёт супер-энергию на порядки выше ядерной:
  //   1) Энергия для ТЯЖЁЛЫХ КОРАБЛЕЙ (реактор контролируемого размыкания узлов снимает штраф массы, даёт 100% манёвр и гамма-щит).
  //   2) Энергия для ТЯЖЁЛОГО ВООРУЖЕНИЯ (гамма-квантовый излучатель размыкания узлов — мгновенная аннигиляция без послесвечения).
  //   3) Экономика Старых Галактик (риск потери корабля от сверхновых), Контрабанды (16 500 CR/т), Пиратства и Торговли!
  // =========================================================================
  const [isOntologyModalOpen, setIsOntologyModalOpen] = useState<boolean>(false);
  const [reactorSuperEnergySec, setReactorSuperEnergySec] = useState<number>(0); // Таймер контролируемого размыкания узлов (супер-энергия для тяжёлого корабля)
  const [heavyGammaCharges, setHeavyGammaCharges] = useState<number>(3); // Заряды тяжёлого гамма-вооружения (контролируемый выброс гамма-квантов)
  const [smuggledTonsCount, setSmuggledTonsCount] = useState<number>(0);
  const [smugglingProfitCr, setSmugglingProfitCr] = useState<number>(0);
  const [supernovaSurvivedCount, setSupernovaSurvivedCount] = useState<number>(0);

  // =========================================================================
  // МЕЖПЛАНЕТНАЯ ЛОГИСТИКА ЧЕРЕЗ ГРУППЫ-ПРАВИТЕЛЬСТВА ПЛАНЕТ, ТАРИФЫ GOBELL И ПОЯС АСТЕРОИДОВ:
  // • Группа каждой планеты (#GO-MERCURY, #GO-VENUS, #GO-EARTH, #GO-MARS) = её ПРАВИТЕЛЬСТВО.
  // • Базовая стоимость ресурса на планете = 5 CR, а если ты состоишь в Группе этой планеты — СКИДКА ДО 1 CR!
  // • Правительство другой планеты платит за доставку нужного ей ресурса 10 CR (например, Земля платит 10 CR за Железо с Меркурия!).
  // • Количество доступных групп ограничено тарифом GoBell (FREE = 1 группа, PRO = 2, PRO+I = 3, PRO+II = 4 группы),
  //   что стимулирует менять тариф в GoBell для вступления во все группы планет и закупки по 1 CR вместо 5 CR!
  // • В Поясе Астероидов 2 стандартные задачи для всех систем:
  //   1) Очищать пояс астероидов от булыжников (повышает безопасность полётов в поясе beltSafetyPct до 100% + премия от правительств).
  //   2) Добывать в поясе астероидов Редкие элементы (rareElementsStock) и сдавать их через группы-правительства планет.
  // =========================================================================
  const [gobellTariff, setGobellTariff] = useState<GoBellSpaceTariff>(initialTariff);
  // По умолчанию на тарифе FREE (1 слот группы) пилот состоит только в группе Земли (#GO-EARTH)
  const [joinedPlanetGroups, setJoinedPlanetGroups] = useState<string[]>(['GO-EARTH']);
  const [rareElementsStock, setRareElementsStock] = useState<number>(1); // Редкие элементы из Пояса Астероидов (т)
  const [beltSafetyPct, setBeltSafetyPct] = useState<number>(45); // Безопасность полётов в поясе астероидов (растёт до 100% при очистке от булыжников)
  const [clearedBouldersCount, setClearedBouldersCount] = useState<number>(0); // Очищено булыжников в поясе астероидов
  const [showTariffUpgradePrompt, setShowTariffUpgradePrompt] = useState<boolean>(false);

  // =========================================================================
  // 1) БИЗНЕС-АККАУНТ ПИЛОТА (BUSINESS): СОЗДАНИЕ БИЗНЕСА С МЕНЬШЕЙ МАРЖОЙ
  // • Правительства планет закупают ресурсы/элементы за ПОЛЦЕНЫ (50%), а продают за ПОЛНУЮ (100%) — маржа правительств 50%.
  // • Если пилот подписывается на Бизнес-аккаунт (gobellTariff === 'BUSINESS'), он может создать свой Бизнес с МЕНЬШЕЙ МАРЖОЙ:
  //   закупать по ЗАВЫШЕННОЙ цене (например, 70% от полной вместо 50% у правительств),
  //   а продавать по ЗАНИЖЕННОЙ цене (например, 85% от полной вместо 100% у правительств)!
  // =========================================================================
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState<boolean>(false);
  const [pilotBusiness, setPilotBusiness] = useState<PilotCreatedSpaceBusiness>({
    isCreated: false,
    name: `Бизнес «${pilotName} · Свободный Трейд»`,
    description:
      'Частный торговый хаб с меньшей маржой: закупаем ресурсы и элементы Пояса ДОРОЖЕ правительств (70% вместо 50%), продаём ДЕШЕВЛЕ правительств (85% вместо 100%)!',
    planetOrder: 3, // По умолчанию на 3-й планете (Земля)
    buyRatePct: 70, // Завышенная закупка (> 50% у правительств)
    sellRatePct: 85, // Заниженная продажа (< 100% у правительств)
    totalTurnoverProfitCr: 0,
    dealsCount: 0,
  });

  // =========================================================================
  // ЮРИДИЧЕСКАЯ ОНТОЛОГИЯ СТАТУСОВ КОСМОСА: «ЗАКОННЫЙ ПИЛОТ», «МАРОДЁР» И «ПИРАТ»
  // 1) Статус «ПИРАТ» (PIRATE):
  //    Присваивается ТОЛЬКО если ты РАЗБИЛ ЧУЖОЙ КОРАБЛЬ И ЗАБРАЛ С НЕГО ХОТЬ ОДИН ПРЕДМЕТ!
  //    Следствие: Карма в минусе (< 0) И наценка на всё ×10 (и при покупке ×10 +, и при продаже ÷10 -)!
  // 2) Статус «МАРОДЁР» (MARAUDER):
  //    Присваивается, если ты ПРОСТО ПОДОБРАЛ ПРЕДМЕТ ПОСЛЕ ДРАКИ (не разбивая корабль сам).
  //    Следствие: Просто портится карма (-5 кармы за каждый подобранный предмет), БЕЗ пиратской наценки ×10!
  // =========================================================================
  const [pilotLegalStatus, setPilotLegalStatus] = useState<PilotLegalStatus>('LAWFUL');
  const [shipsDestroyedByPlayer, setShipsDestroyedByPlayer] = useState<number>(0);
  const [pirateLootedItemsCount, setPirateLootedItemsCount] = useState<number>(0);
  const [marauderLootedItemsCount, setMarauderLootedItemsCount] = useState<number>(0);

  // Расчёт цен закупки и продажи для любого элемента:
  // Наценка ×10 (при покупке ×10 +, при продаже ÷10 -) действует ТОЛЬКО при статусе «ПИРАТ» (разбил чужой корабль и забрал с него хоть один предмет)!
  // При статусе «МАРОДЁР» (просто подобрал предмет после драки) просто портится карма, а цены остаются 1×!
  const isPirateStatus = pilotLegalStatus === 'PIRATE';
  const isMarauderStatus = pilotLegalStatus === 'MARAUDER';
  const pirateBuyMultiplier = isPirateStatus ? 10 : 1; // При покупке наценка ×10 (+) для Пирата
  const pirateSellDivisor = isPirateStatus ? 10 : 1; // При продаже уценка ÷10 (-) для Пирата

  // Универсальное размещение подобранного в космосе предмета (элемента) в грузовом отсеке
  const addLootElementToCargoHold = useCallback((sym: AsteroidElementSymbol) => {
    if (sym === 'Fe') {
      setIronStock((s) => s + 1);
    } else if (sym === 'Al') {
      setAluminumStock((s) => s + 1);
    } else if (sym === 'Ti') {
      setTitaniumStock((s) => s + 1);
    } else if (sym === 'H2O') {
      setWaterOxygenStockPct(100);
      setMinedElementsHold((prev) => ({...prev, H2O: (prev.H2O || 0) + 1}));
    } else {
      setMinedElementsHold((prev) => ({...prev, [sym]: (prev[sym] || 0) + 1}));
      setRareElementsStock((r) => r + 1);
    }
  }, []);

  // Единая обработка захвата/подбора предмета (CARGO) в космосе:
  // • Если предмет выпал из РАЗБИТОГО ТОБОЙ чужого корабля (lootOrigin === 'PLAYER_DESTROYED_SHIP') -> СТАТУС «ПИРАТ» (карма в минусе + наценка ×10)!
  // • Если предмет ПРОСТО ПОДОБРАН ПОСЛЕ ДРАКИ (lootOrigin === 'AFTER_BATTLE') -> СТАТУС «МАРОДЁР» (просто портится карма, без наценки ×10)!
  const collectSpaceLootItem = useCallback(
    (
      origin: 'PLAYER_DESTROYED_SHIP' | 'AFTER_BATTLE',
      sym: AsteroidElementSymbol = 'Pt',
      sourceLabel?: string
    ) => {
      const elMeta = ASTEROID_PERIODIC_ELEMENTS[sym];
      addLootElementToCargoHold(sym);

      if (origin === 'PLAYER_DESTROYED_SHIP') {
        playZxBeep('HIT');
        setPilotLegalStatus('PIRATE');
        setPirateLootedItemsCount((c) => c + 1);
        setEarnedGoBellKarma((prev) => {
          const nextKarma = prev >= 0 ? -15 : prev - 10;
          setFlightMessage(
            `🏴‍☠️ СТАТУС «ПИРАТ» ПРИСВОЕН! ВЫ РАЗБИЛИ ЧУЖОЙ КОРАБЛЬ${
              sourceLabel ? ` («${sourceLabel}»)` : ''
            } И ЗАБРАЛИ С НЕГО ПРЕДМЕТ (+1т [${elMeta.displaySymbol}] ${
              elMeta.nameRu
            })! КАРМА В МИНУСЕ (${nextKarma}), НАЦЕНКА НА ВСЁ ×10 (ПОКУПКА ×10 +, ПРОДАЖА ÷10 -)!`
          );
          return nextKarma;
        });
        onEarnKarmaAndBonus?.(
          -15,
          0,
          `Пиратство: разбил чужой корабль и забрал с него предмет [${elMeta.displaySymbol}]`
        );
      } else {
        playZxBeep('DOCK');
        setMarauderLootedItemsCount((c) => c + 1);
        setPilotLegalStatus((prev) => (prev === 'PIRATE' ? 'PIRATE' : 'MARAUDER'));
        setEarnedGoBellKarma((prev) => {
          const nextKarma = prev - 5;
          setFlightMessage(
            `🦅 СТАТУС «МАРОДЁР»! ВЫ ПРОСТО ПОДОБРАЛИ ПРЕДМЕТ ПОСЛЕ ДРАКИ (+1т [${
              elMeta.displaySymbol
            }] ${elMeta.nameRu}) — ПРОСТО ИСПОРТИЛАСЬ КАРМА (-5 → ${
              nextKarma > 0 ? `+${nextKarma}` : nextKarma
            }), БЕЗ ПИРАТСКОЙ НАЦЕНКИ ×10!`
          );
          return nextKarma;
        });
        onEarnKarmaAndBonus?.(
          -5,
          0,
          `Мародёрство: просто подобрал предмет [${elMeta.displaySymbol}] после драки (портится карма)`
        );
      }
    },
    [addLootElementToCargoHold, onEarnKarmaAndBonus, playZxBeep]
  );

  // Быстрое действие 1: Симуляция/выполнение «Разбил чужой корабль и забрал с него предмет» -> Статус ПИРАТ
  const handleTriggerPirateDestroyAndLoot = useCallback(() => {
    const sym: AsteroidElementSymbol = GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy ? 'Omega' : 'Au';
    setShipsDestroyedByPlayer((n) => n + 1);
    collectSpaceLootItem('PLAYER_DESTROYED_SHIP', sym, 'ЧУЖОЙ ТОРГОВЫЙ КОРАБЛЬ');
  }, [collectSpaceLootItem, currentSystemId]);

  // Быстрое действие 2: Симуляция/выполнение «Просто подобрал предмет после драки» -> Статус МАРОДЁР (просто портится карма)
  const handleTriggerMarauderPickupAfterFight = useCallback(() => {
    const sym: AsteroidElementSymbol = GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy ? 'Omega' : 'Pt';
    collectSpaceLootItem('AFTER_BATTLE', sym, 'МЕСТО ЧУЖОЙ СХВАТКИ');
  }, [collectSpaceLootItem, currentSystemId]);

  // Быстрое действие 3: Амнистия / восстановление статуса Законного пилота
  const handleRestoreLawfulStatus = useCallback(() => {
    playZxBeep('MISSION');
    setPilotLegalStatus('LAWFUL');
    setEarnedGoBellKarma((prev) => (prev < 5 ? 5 : prev));
    setFlightMessage(
      '🛡️ АМНИСТИЯ: СТАТУС «ЗАКОННЫЙ ПИЛОТ» ВОССТАНОВЛЕН (КАРМА +5 · ЦЕНЫ 1× БЕЗ ПИРАТСКОЙ НАЦЕНКИ)!'
    );
  }, [playZxBeep]);

  // Переключение статуса по клику в верхней панели (ЗАКОННЫЙ -> МАРОДЁР -> ПИРАТ -> ЗАКОННЫЙ)
  const handleTogglePirateStatus = useCallback(() => {
    if (pilotLegalStatus === 'LAWFUL') {
      handleTriggerMarauderPickupAfterFight();
    } else if (pilotLegalStatus === 'MARAUDER') {
      handleTriggerPirateDestroyAndLoot();
    } else {
      handleRestoreLawfulStatus();
    }
  }, [
    handleRestoreLawfulStatus,
    handleTriggerMarauderPickupAfterFight,
    handleTriggerPirateDestroyAndLoot,
    pilotLegalStatus,
  ]);

  const getElementTradePrices = useCallback(
    (sym: AsteroidElementSymbol) => {
      const meta = ASTEROID_PERIODIC_ELEMENTS[sym];
      const fullCr = meta.fullPriceCr; // 100% — продажа правительством
      const govBuyCr = meta.sellPriceCr; // 50% — закупка правительством (полцены)
      const bizBuyCr = Math.max(
        govBuyCr + 1,
        Math.round((fullCr * pilotBusiness.buyRatePct) / 100)
      ); // Завышенная закупка бизнесом пилота (> 50%)
      const bizSellCr = Math.min(
        fullCr - 1,
        Math.max(bizBuyCr + 1, Math.round((fullCr * pilotBusiness.sellRatePct) / 100))
      ); // Заниженная продажа бизнесом пилота (< 100%)
      const basePilotSellPriceCr =
        gobellTariff === 'BUSINESS' && pilotBusiness.isCreated ? bizBuyCr : govBuyCr;
      const basePilotBuyPriceCr =
        gobellTariff === 'BUSINESS' && pilotBusiness.isCreated ? bizSellCr : fullCr;

      // Если статус ПИРАТ (карма в минусе): наценка на всё ×10 — при покупке ×10 (+), при продаже ÷10 (-)!
      const activePilotSellPriceCr = isPirateStatus
        ? Number((basePilotSellPriceCr / 10).toFixed(1))
        : basePilotSellPriceCr;
      const activePilotBuyPriceCr = isPirateStatus
        ? basePilotBuyPriceCr * 10
        : basePilotBuyPriceCr;

      return {
        fullCr,
        govBuyCr,
        bizBuyCr,
        bizSellCr,
        basePilotSellPriceCr,
        basePilotBuyPriceCr,
        activePilotSellPriceCr,
        activePilotBuyPriceCr,
      };
    },
    [
      gobellTariff,
      isPirateStatus,
      pilotBusiness.buyRatePct,
      pilotBusiness.isCreated,
      pilotBusiness.sellRatePct,
    ]
  );

  // =========================================================================
  // 2) ПОДПРОСТРАНСТВЕННЫЙ КАНАЛ ФИКСАЦИИ (АНАЛОГ АУКЦИОНА СЛОТА ОБЪЯВЛЕНИЯ GOBELL):
  // • Суть та же: возможность зафиксировать объявление в ЛЮБОЙ ТОЧКЕ звёздной системы либо ПРЯМО ВОЗЛЕ СЕБЯ.
  // • Смысл тот же: передача слота в обезличенный пул даёт ДОЛЮ В ПУЛЕ АУКЦИОНА (начисление дивидендов CR и погашение подписки $).
  // =========================================================================
  const [isSubspaceChannelModalOpen, setIsSubspaceChannelModalOpen] = useState<boolean>(false);
  const [subspacePoolDividendsCr, setSubspacePoolDividendsCr] = useState<number>(0);
  const [subspaceSubscriptionPayoffUsd, setSubspaceSubscriptionPayoffUsd] = useState<number>(0);
  const [subspaceSlots, setSubspaceSlots] = useState<SubspaceFixationSlot[]>([
    {
      slotId: 1,
      text: 'Срочная поставка титана железа и редких элементов Пояса по низким ценам #титан #железо #торговля',
      placementMode: 'NEAR_SHIP',
      pointPreset: 'NEAR_SHIP',
      customCoords: {x: 0, y: 0, z: 18000},
      isFixedInSpace: true,
      fixedCoordsInSystem: {x: 190, y: 45, z: 17850}, // Изначально зафиксирован возле орбиты Земли
      fixedPointLabel: 'Прямо возле себя (Орбита III. Земли)',
      inAuctionPool: false,
      autoRenewMode: 'INFINITE',
      autoRenewDays: 7,
      withdrawingBufferSec: 0,
    },
    {
      slotId: 2,
      text: 'Закупка золота платины лития и кобальта у старателей Пояса астероидов #золото #платина #пояс',
      placementMode: 'ANY_POINT',
      pointPreset: 'BELT',
      customCoords: {x: 0, y: 60, z: 27000},
      isFixedInSpace: false,
      fixedCoordsInSystem: null,
      fixedPointLabel: 'Пояс Астероидов (R=27 000)',
      inAuctionPool: true, // Слот #2 по умолчанию демонстрирует работу в пуле аукциона!
      autoRenewMode: 'INFINITE',
      autoRenewDays: 14,
      withdrawingBufferSec: 0,
    },
    {
      slotId: 3,
      text: 'Орбитальная заправка водой кислородом и ремонт после гиперпрыжка #вода #кислород #ремонт',
      placementMode: 'ANY_POINT',
      pointPreset: 'STAR',
      customCoords: {x: 0, y: 40, z: 450},
      isFixedInSpace: false,
      fixedCoordsInSystem: null,
      fixedPointLabel: 'У Центральной Звезды',
      inAuctionPool: false,
      autoRenewMode: 'OFF',
      autoRenewDays: 7,
      withdrawingBufferSec: 0,
    },
    {
      slotId: 4,
      text: 'Конвой и охрана грузовых кораблей в секторе Марса и Поясе астероидов #конвой #охрана #марс',
      placementMode: 'ANY_POINT',
      pointPreset: 'MARS',
      customCoords: {x: 0, y: -40, z: 24000},
      isFixedInSpace: false,
      fixedCoordsInSystem: null,
      fixedPointLabel: 'Орбита IV. Марса',
      inAuctionPool: false,
      autoRenewMode: 'OFF',
      autoRenewDays: 7,
      withdrawingBufferSec: 0,
    },
  ]);

  // Доступное число слотов и лимит слов Подпространственного канала фиксации по тарифу GoBell
  const allowedSubspaceSlotsCount =
    gobellTariff === 'FREE' || gobellTariff === 'PRO'
      ? 1
      : gobellTariff === 'PRO_PLUS_1'
      ? 2
      : gobellTariff === 'PRO_PLUS_2'
      ? 3
      : 4;

  const maxSubspaceWordsForTariff =
    gobellTariff === 'FREE' || gobellTariff === 'PRO'
      ? 10
      : gobellTariff === 'PRO_PLUS_1'
      ? 15
      : gobellTariff === 'PRO_PLUS_2'
      ? 20
      : 25;

  const activeAuctionPoolSlotsCount = subspaceSlots
    .slice(0, allowedSubspaceSlotsCount)
    .filter((s) => s.inAuctionPool).length;

  // Вес пая слота в пуле аукциона Подпространственного канала фиксации (пропорционально числу слотов и ёмкости слов: 10 слов = 1.0 пай, 25 слов = 2.5 пая)
  const myAuctionPoolWeight = Number(
    (activeAuctionPoolSlotsCount * (maxSubspaceWordsForTariff / 10)).toFixed(2)
  );
  const totalSystemAuctionPoolWeight = Number((30 + myAuctionPoolWeight).toFixed(2));
  const myAuctionPoolSharePct = Number(
    ((myAuctionPoolWeight / Math.max(1, totalSystemAuctionPoolWeight)) * 100).toFixed(2)
  );

  const subspaceBeaconsRef = useRef<SubspaceFixationSlot[]>(subspaceSlots);
  useEffect(() => {
    subspaceBeaconsRef.current = subspaceSlots.slice(0, allowedSubspaceSlotsCount);
  }, [allowedSubspaceSlotsCount, subspaceSlots]);

  // Автоматическое начисление дохода от Доли в пуле аукциона «Подпространственный канал фиксации» + пассивный оборот созданного Бизнеса с меньшей маржой
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      if (activeAuctionPoolSlotsCount > 0) {
        const crDividend = Math.max(1, Math.round(myAuctionPoolWeight * 2));
        const usdDrip = Number((myAuctionPoolWeight * 0.015).toFixed(3));
        setSubspacePoolDividendsCr((prev) => prev + crDividend);
        setSubspaceSubscriptionPayoffUsd((prev) => Number((prev + usdDrip).toFixed(3)));
        setCredits((c) => c + crDividend);
      }

      // Уменьшение таймера буфера возврата из пула аукциона
      setSubspaceSlots((prev) => {
        let changed = false;
        const next = prev.map((s) => {
          if (s.withdrawingBufferSec > 0) {
            changed = true;
            return {...s, withdrawingBufferSec: Math.max(0, s.withdrawingBufferSec - 2)};
          }
          return s;
        });
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [activeAuctionPoolSlotsCount, isOpen, myAuctionPoolWeight]);

  // Вычисление текущих 3D-координат корабля пилота в системе от Центральной Звезды (в базисе эклиптики U, N, V)
  const getCurrentShipSystemCoords = useCallback((): Vec3 => {
    const st = flightStateRef.current;
    // Вектор от Звезды к кораблю в камере = -st.starPos; проектируем на базис эклиптики (eclipticU, eclipticN, eclipticV)
    const relX = -st.starPos.x;
    const relY = -st.starPos.y;
    const relZ = -st.starPos.z;
    const uCoord =
      relX * st.eclipticU.x + relY * st.eclipticU.y + relZ * st.eclipticU.z;
    const nCoord =
      relX * st.eclipticN.x + relY * st.eclipticN.y + relZ * st.eclipticN.z;
    const vCoord =
      relX * st.eclipticV.x + relY * st.eclipticV.y + relZ * st.eclipticV.z;
    return {
      x: Math.round(uCoord),
      y: Math.round(nCoord),
      z: Math.round(vCoord),
    };
  }, []);

  // Зафиксировать объявление слота в Подпространственном канале фиксации:
  // либо ПРЯМО ВОЗЛЕ СЕБЯ ('NEAR_SHIP'), либо В ЛЮБОЙ ТОЧКЕ СИСТЕМЫ ('ANY_POINT')!
  const handleFixSubspaceAdvert = useCallback(
    (slotId: number, forceMode?: 'NEAR_SHIP' | 'ANY_POINT', forcePreset?: SubspacePointPreset) => {
      const st = flightStateRef.current;
      const targetSlot = subspaceSlots.find((s) => s.slotId === slotId);
      if (!targetSlot) return;

      if (targetSlot.inAuctionPool) {
        playZxBeep('HIT');
        setFlightMessage(
          `⚠️ СЛОТ #${slotId} СЕЙЧАС В ПУЛЕ АУКЦИОНА! ОТКЛЮЧИТЕ ПУЛ АУКЦИОНА, ЧТОБЫ ЗАФИКСИРОВАТЬ ЛИЧНОЕ ОБЪЯВЛЕНИЕ В КОСМОСЕ!`
        );
        return;
      }

      const mode = forceMode || targetSlot.placementMode;
      const preset = forcePreset || (mode === 'NEAR_SHIP' ? 'NEAR_SHIP' : targetSlot.pointPreset);

      let fixedVec: Vec3 = {x: 0, y: 0, z: 18000};
      let label = 'Прямо возле себя';

      if (mode === 'NEAR_SHIP' || preset === 'NEAR_SHIP') {
        // Фиксация ПРЯМО ВОЗЛЕ СЕБЯ (на расстоянии ~220 ед. перед носом корабля, чтобы пилот сразу увидел маяк перед собой!)
        const aheadCam: Vec3 = {x: 0, y: 15, z: 220};
        const vecFromStarCam: Vec3 = {
          x: aheadCam.x - st.starPos.x,
          y: aheadCam.y - st.starPos.y,
          z: aheadCam.z - st.starPos.z,
        };
        fixedVec = {
          x: Math.round(
            vecFromStarCam.x * st.eclipticU.x +
              vecFromStarCam.y * st.eclipticU.y +
              vecFromStarCam.z * st.eclipticU.z
          ),
          y: Math.round(
            vecFromStarCam.x * st.eclipticN.x +
              vecFromStarCam.y * st.eclipticN.y +
              vecFromStarCam.z * st.eclipticN.z
          ),
          z: Math.round(
            vecFromStarCam.x * st.eclipticV.x +
              vecFromStarCam.y * st.eclipticV.y +
              vecFromStarCam.z * st.eclipticV.z
          ),
        };
        label = `Прямо возле себя (${fixedVec.x}, ${fixedVec.y}, ${fixedVec.z})`;
      } else if (preset === 'CURSOR') {
        // В точке прицела курсора мыши в 3D-пространстве
        const aimX = st.turretActive ? st.turretX : 430;
        const aimY = st.turretActive ? st.turretY : 194;
        const depthZ = 280;
        const camX = ((aimX - 430) * depthZ) / 380;
        const camY = ((194 - aimY) * depthZ) / 380;
        const vecFromStarCam: Vec3 = {
          x: camX - st.starPos.x,
          y: camY - st.starPos.y,
          z: depthZ - st.starPos.z,
        };
        fixedVec = {
          x: Math.round(
            vecFromStarCam.x * st.eclipticU.x +
              vecFromStarCam.y * st.eclipticU.y +
              vecFromStarCam.z * st.eclipticU.z
          ),
          y: Math.round(
            vecFromStarCam.x * st.eclipticN.x +
              vecFromStarCam.y * st.eclipticN.y +
              vecFromStarCam.z * st.eclipticN.z
          ),
          z: Math.round(
            vecFromStarCam.x * st.eclipticV.x +
              vecFromStarCam.y * st.eclipticV.y +
              vecFromStarCam.z * st.eclipticV.z
          ),
        };
        label = `Точка прицела (${fixedVec.x}, ${fixedVec.y}, ${fixedVec.z})`;
      } else if (preset === 'STAR') {
        fixedVec = {x: 0, y: 65, z: -380};
        label = 'У Центральной Звезды (R=380)';
      } else if (preset === 'MERCURY' || preset === 'VENUS' || preset === 'EARTH' || preset === 'MARS') {
        const pIdx =
          preset === 'MERCURY' ? 0 : preset === 'VENUS' ? 1 : preset === 'EARTH' ? 2 : 3;
        const p = st.planets[pIdx];
        if (p) {
          fixedVec = {
            x: Math.round(Math.cos(p.orbitAngle) * p.orbitRadius + 160),
            y: 55,
            z: Math.round(Math.sin(p.orbitAngle) * p.orbitRadius),
          };
          label = `Орбита планеты ${p.cleanName} (R=${p.orbitRadius})`;
        }
      } else if (preset === 'BELT') {
        fixedVec = {x: 120, y: 40, z: -27000};
        label = 'Пояс Астероидов (R=27 000)';
      } else if (preset === 'EDGE') {
        fixedVec = {x: 0, y: 80, z: -29600};
        label = 'Окраина Сферы Системы (R=29 600)';
      } else {
        fixedVec = {...targetSlot.customCoords};
        label = `Точка (${fixedVec.x}, ${fixedVec.y}, ${fixedVec.z})`;
      }

      playZxBeep('MISSION');
      setSubspaceSlots((prev) =>
        prev.map((s) =>
          s.slotId === slotId
            ? {
                ...s,
                placementMode: mode,
                pointPreset: preset,
                isFixedInSpace: true,
                fixedCoordsInSystem: fixedVec,
                fixedPointLabel: label,
              }
            : s
        )
      );
      setFlightMessage(
        `📡 ПОДПРОСТРАНСТВЕННЫЙ КАНАЛ ФИКСАЦИИ: ОБЪЯВЛЕНИЕ #${slotId} ЗАФИКСИРОВАНО В ТОЧКЕ «${label.toUpperCase()}»!`
      );
    },
    [playZxBeep, subspaceSlots]
  );

  // Переключение слота в Пул Аукциона «Подпространственный канал фиксации» (Доля в пуле аукциона)
  const handleToggleSubspaceAuctionPool = useCallback(
    (slotId: number) => {
      playZxBeep('MISSION');
      setSubspaceSlots((prev) =>
        prev.map((s) => {
          if (s.slotId !== slotId) return s;
          if (s.inAuctionPool) {
            setFlightMessage(
              `⏳ СЛОТ #${slotId} ВЫВОДИТСЯ ИЗ ПУЛА АУКЦИОНА ПОДПРОСТРАНСТВЕННОГО КАНАЛА ФИКСАЦИИ (БУФЕР ВОЗВРАТА 24Ч)!`
            );
            return {
              ...s,
              inAuctionPool: false,
              withdrawingBufferSec: 24,
            };
          } else {
            setFlightMessage(
              `📡 СЛОТ #${slotId} ПЕРЕДАН В ПУЛ АУКЦИОНА «ПОДПРОСТРАНСТВЕННЫЙ КАНАЛ ФИКСАЦИИ»! ВАША ДОЛЯ В ПУЛЕ РАСТЁТ И НАЧИСЛЯЕТ CR + $!`
            );
            return {
              ...s,
              inAuctionPool: true,
              isFixedInSpace: false,
              withdrawingBufferSec: 0,
            };
          }
        })
      );
    },
    [playZxBeep]
  );

  const maxAllowedPlanetGroups = GOBELL_SPACE_TARIFF_META[gobellTariff].maxGroups;

  const handleSelectGoBellTariff = useCallback(
    (nextTariff: GoBellSpaceTariff) => {
      playZxBeep('MISSION');
      setGobellTariff(nextTariff);
      const nextMax = GOBELL_SPACE_TARIFF_META[nextTariff].maxGroups;
      let nextGroups = joinedPlanetGroups;
      if (nextMax >= 4) {
        // При переходе на PRO + II / PRO + III / BUSINESS автоматически доступны все 4 группы планет со скидкой 1 CR!
        nextGroups = Array.from(
          new Set([...joinedPlanetGroups, 'GO-MERCURY', 'GO-VENUS', 'GO-EARTH', 'GO-MARS'])
        ).slice(0, nextMax);
        setJoinedPlanetGroups(nextGroups);
      } else if (joinedPlanetGroups.length > nextMax) {
        nextGroups = joinedPlanetGroups.slice(0, nextMax);
        setJoinedPlanetGroups(nextGroups);
      }
      setShowTariffUpgradePrompt(false);
      onChangeGoBellTariff?.(nextTariff, nextGroups);
      setFlightMessage(
        `★ ТАРИФ GOBELL ИЗМЕНЁН НА «${GOBELL_SPACE_TARIFF_META[nextTariff].badge}»: ДОСТУПНО ГРУПП ПЛАНЕТ — ${nextMax}! СКИДКА ДО 1 CR ВО ВСЕХ ВАШИХ ГРУППАХ ★`
      );
    },
    [joinedPlanetGroups, onChangeGoBellTariff, playZxBeep]
  );

  // Создание / Обновление Бизнеса пилота с меньшей маржой на тарифе BUSINESS (и размещение его на 3D-сфере выбранной планеты!)
  const handleCreateOrUpdatePilotBusiness = useCallback(() => {
    if (gobellTariff !== 'BUSINESS') {
      handleSelectGoBellTariff('BUSINESS');
    }
    const safeBuy = Math.max(55, Math.min(88, pilotBusiness.buyRatePct));
    const safeSell = Math.max(safeBuy + 5, Math.min(96, pilotBusiness.sellRatePct));
    const updatedBiz: PilotCreatedSpaceBusiness = {
      ...pilotBusiness,
      isCreated: true,
      buyRatePct: safeBuy,
      sellRatePct: safeSell,
    };
    setPilotBusiness(updatedBiz);

    // Добавляем или обновляем маркер Бизнеса пилота на выбранной планете 3D-сцены
    const st = flightStateRef.current;
    const pIdx = updatedBiz.planetOrder - 1;
    const targetP = st.planets[pIdx];
    if (targetP) {
      const pilotBizObjId = `pilot-custom-biz-${updatedBiz.planetOrder}`;
      const existingFiltered = targetP.gobellObjects.filter((o) => o.id !== pilotBizObjId);
      const marginPct = safeSell - safeBuy;
      targetP.gobellObjects = [
        ...existingFiltered,
        {
          id: pilotBizObjId,
          planetId: targetP.id,
          planetCleanName: targetP.cleanName,
          planetOrder: updatedBiz.planetOrder,
          specializationBadge: `💼 БИЗНЕС ПИЛОТА (МАРЖА ${marginPct}% ПРОТИВ 50% У ПРАВИТЕЛЬСТВ)`,
          specializationPurpose: `Закупает по ЗАВЫШЕННОЙ (${safeBuy}% вместо 50% у правительств), продаёт по ЗАНИЖЕННОЙ (${safeSell}% вместо 100% у правительств)!`,
          kind: 'BUSINESS',
          title: updatedBiz.name,
          description: updatedBiz.description,
          authorName: `${pilotName} · ${updatedBiz.name}`,
          karmaPlus: 35,
          karmaMinus: 0,
          latDeg: -4,
          lonOffsetDeg: -8,
        },
      ];
    }

    playZxBeep('MISSION');
    setFlightMessage(
      `💼 БИЗНЕС СОЗДАН («${updatedBiz.name}»): ЗАКУПКА ${safeBuy}% (У ПРАВИТЕЛЬСТВ 50%), ПРОДАЖА ${safeSell}% (У ПРАВИТЕЛЬСТВ 100%) · МАРЖА ${
        safeSell - safeBuy
      }%!`
    );
  }, [gobellTariff, handleSelectGoBellTariff, pilotBusiness, pilotName, playZxBeep]);

  // Проведение торгового оборота Бизнеса пилота (вольные корабли продают вашему бизнесу по завышенной цене buyRatePct и покупают по заниженной sellRatePct)
  const handleRunPilotBusinessTurnover = useCallback(() => {
    if (gobellTariff !== 'BUSINESS' || !pilotBusiness.isCreated) {
      setIsBusinessModalOpen(true);
      return;
    }
    const marginPct = Math.max(5, pilotBusiness.sellRatePct - pilotBusiness.buyRatePct);
    // Чем меньше маржа по сравнению с 50% маржой правительств, тем выше поток кораблей и оборот!
    const volumeMultiplier = Math.max(2, Math.round((50 - marginPct) / 6));
    const profitCr = marginPct * volumeMultiplier;

    playZxBeep('MISSION');
    setCredits((c) => c + profitCr);
    setEarnedGoBellKarma((k) => k + 1);
    setPilotBusiness((prev) => ({
      ...prev,
      totalTurnoverProfitCr: prev.totalTurnoverProfitCr + profitCr,
      dealsCount: prev.dealsCount + volumeMultiplier,
    }));
    setFlightMessage(
      `💼 ОБОРОТ ВАШЕГО БИЗНЕСА (ЗАКУПКА ${pilotBusiness.buyRatePct}% > 50% ПРАВ-ВА · ПРОДАЖА ${pilotBusiness.sellRatePct}% < 100% ПРАВ-ВА): ПРОВЕДЕНО ${volumeMultiplier} СДЕЛОК → ПРИБЫЛЬ +${profitCr} CR!`
    );
  }, [gobellTariff, pilotBusiness, playZxBeep]);

  const handleToggleJoinPlanetGroup = useCallback(
    (groupTag: string, planetCleanName: string) => {
      const normTag = groupTag.trim().toUpperCase();
      if (joinedPlanetGroups.includes(normTag)) {
        const next = joinedPlanetGroups.filter((g) => g !== normTag);
        setJoinedPlanetGroups(next);
        onChangeGoBellTariff?.(gobellTariff, next);
        playZxBeep('DOCK');
        setFlightMessage(
          `ВЫ ВЫШЛИ ИЗ ГРУППЫ-ПРАВИТЕЛЬСТВА «${planetCleanName.toUpperCase()}» (#${normTag}). ЦЕНА РЕСУРСА НА ПЛАНЕТЕ: 5 CR (БЕЗ СКИДКИ)`
        );
        return;
      }

      if (joinedPlanetGroups.length >= maxAllowedPlanetGroups) {
        playZxBeep('HIT');
        setShowTariffUpgradePrompt(true);
        setFlightMessage(
          `⚠️ ЛИМИТ ГРУПП ПО ТАРИФУ ${GOBELL_SPACE_TARIFF_META[gobellTariff].badge} ИСЧЕРПАН (${joinedPlanetGroups.length}/${maxAllowedPlanetGroups})! СМЕНИТЕ ТАРИФ GOBELL, ЧТОБЫ ВСТУПИТЬ В #${normTag} И ПОКУПАТЬ РЕСУРС ПО 1 CR ВМЕСТО 5 CR!`
        );
        return;
      }

      const next = [...joinedPlanetGroups, normTag];
      setJoinedPlanetGroups(next);
      onChangeGoBellTariff?.(gobellTariff, next);
      playZxBeep('MISSION');
      setFlightMessage(
        `✓ ВЫ ВСТУПИЛИ В ГРУППУ-ПРАВИТЕЛЬСТВО «${planetCleanName.toUpperCase()}» (#${normTag})! СКИДКА НА РЕСУРС ПЛАНЕТЫ: 1 CR ВМЕСТО 5 CR (${next.length}/${maxAllowedPlanetGroups} ГРУПП)`
      );
    },
    [gobellTariff, joinedPlanetGroups, maxAllowedPlanetGroups, onChangeGoBellTariff, playZxBeep]
  );

  // Режим экрана: FLIGHT (полёт), DOCKED (станция: GoBell Миссии и Торговля), GALAXY_MAP (выбор гиперпрыжка)
  const [screenMode, setScreenMode] = useState<'FLIGHT' | 'DOCKED' | 'GALAXY_MAP'>('FLIGHT');
  const [stationTab, setStationTab] = useState<'GOBELL_MISSIONS' | 'MARKET' | 'OUTFITTING'>(
    'GOBELL_MISSIONS'
  );

  // Лог бортового компьютера ZX Spectrum
  const [flightMessage, setFlightMessage] = useState<string>(
    'COMMANDER READY · GOBELL ORBITAL LINK ESTABLISHED'
  );

  // Список миссий GoBell (генерируется из реальных объявлений/SOS/профилей GoBell + космических контрактов)
  const [missions, setMissions] = useState<GoBellSpaceMission[]>([]);

  useEffect(() => {
    const generated: GoBellSpaceMission[] = [];

    // 1. Генерируем миссии напрямую из живых объектов карты GoBell
    missionSeeds.slice(0, 5).forEach((seed, idx) => {
      const destSys = GALAXY_SYSTEMS[(idx + 1) % GALAXY_SYSTEMS.length];
      if (seed.category === 'SOS') {
        generated.push({
          id: `gobell-sos-${seed.id}`,
          type: 'SOS',
          title: `🆘 ПЕРЕХВАТ СИГНАЛА SOS · ${destSys.name}`,
          clientName: seed.authorName,
          briefing: `Экстренный вызов GoBell SOS: «${seed.text}». Прыгайте в систему ${destSys.name}, уничтожьте пиратов-перехватчиков и спасите капсулу!`,
          targetSystemId: destSys.id,
          rewardCredits: 650 + idx * 120,
          rewardKarma: 3,
          killsRequired: 2,
          killsDone: 0,
          status: 'AVAILABLE',
        });
      } else {
        generated.push({
          id: `gobell-adv-${seed.id}`,
          type: 'ADVERT',
          title: `📦 КОНТРАКТ ОБЪЯВЛЕНИЯ GOBELL · ${destSys.name}`,
          clientName: seed.authorName,
          briefing: `Заказ по объявлению GoBell: «${seed.text}». Доставьте спецконтейнер на орбитальную станцию системы ${destSys.name} (клавиша H — прыжок, T — стыковка).`,
          targetSystemId: destSys.id,
          rewardCredits: 450 + idx * 90,
          rewardKarma: 2,
          killsRequired: 0,
          killsDone: 0,
          status: 'AVAILABLE',
        });
      }
    });

    // 2. Всегда добавляем боевые и спасательные миссии GoBell, чтобы выбор был богатым
    generated.push(
      {
        id: 'gobell-bounty-riedquat',
        type: 'BOUNTY',
        title: '⚔️ ЗАЧИСТКА СЕКТОРА RIEDQUAT ОТ ПИРАТОВ КАРМЫ',
        clientName: 'Патруль Безопасности GoBell',
        briefing:
          'В секторе RIEDQUAT действуют пираты Cobra Mk III и корабли Thargoid, грабящие торговцев сообщества. Уничтожьте 3 вражеских корабля лазером (F).',
        targetSystemId: 3,
        rewardCredits: 950,
        rewardKarma: 4,
        killsRequired: 3,
        killsDone: 0,
        status: 'AVAILABLE',
      },
      {
        id: 'gobell-sos-deep',
        type: 'SOS',
        title: '🆘 СПАСЕНИЕ КАПСУЛЫ В СЕКТОРЕ ZAONCE',
        clientName: 'Служба GoBell SOS 112',
        briefing:
          'Торговый корабль подал сигнал SOS на подлёте к станции ZAONCE. Сбейте пирата прикрытия и подберите спасательную капсулу в открытом космосе.',
        targetSystemId: 1,
        rewardCredits: 700,
        rewardKarma: 3,
        killsRequired: 1,
        killsDone: 0,
        status: 'AVAILABLE',
      },
      {
        id: 'gobell-courier-leesti',
        type: 'ADVERT',
        title: '💎 СРОЧНЫЙ ЧАРТЕР КРИСТАЛЛОВ GOBELL В LEESTI',
        clientName: 'Биржа Слотов GoBell PRO+',
        briefing:
          'Экспресс-доставка зашифрованного пакета сделок Биржи GoBell на станцию LEESTI · ОДЕССА-ПОРТ. Достаточно совершить гиперпрыжок (H) и пристыковаться (T).',
        targetSystemId: 4,
        rewardCredits: 520,
        rewardKarma: 2,
        killsRequired: 0,
        killsDone: 0,
        status: 'AVAILABLE',
      }
    );

    setMissions(generated);
  }, [missionSeeds]);

  // Рефы физического 3D-мира для 60 FPS цикла (Самолётное управление + Огневая рубка мыши + Физика Массы/Брони)
  const [throttleUi, setThrottleUi] = useState<number>(100); // По умолчанию 100% (макс. скорость: 5 мин от окраины до звезды, 1 мин между планетами)
  // Дополнительные бронеплиты корпуса: 0 = Стандарт 50t (+0t), 1 = Средний (+15t), 2 = Тяжёлый дредноут (+35t)
  const [armorBallastLevel, setArmorBallastLevel] = useState<0 | 1 | 2>(0);

  // =========================================================================
  // ТОННАЖНАЯ СИСТЕМА ИГРОВЫХ ОЧКОВ (ОПЫТ В ТОННАХ УНИЧТОЖЕННОЙ МАССЫ ВРАГА) И КОНСТРУКТОР МАССЫ / ОРУЖИЯ:
  // • Два одинаковых стандартных корабля имеют полную массу 50 т (50 000 кг).
  // • 1 выстрел из лазера разрушает 100 кг (0.10 т) массы врага, 1 выстрел из плазмы разрушает 100 кг (0.10 т).
  // • Количество доступных выстрелов для стандартного типа корабля (50 т) равно:
  //   50 т + 10% = 55 т (55 000 кг = 550 выстрелов по 100 кг).
  // • Можно докупать броню как вес (+5 т, +10 т, +25 т, +50 т) и докупать/комбинировать оружие
  //   с большей ёмкостью или силой выстрела: 100 кг, 50 + 50 кг, 2 × 50 кг, 150 кг, 100 + 100 = 200 кг.
  // • Суть начисления очков — В ТОННАХ: сколько тонн врага уничтожено, это и есть показатель игрового опыта (XP)!
  // =========================================================================
  const baseStandardShipMassTons = 50; // Стандартная полная масса корабля = 50 т
  const [purchasedArmorWeightTons, setPurchasedArmorWeightTons] = useState<number>(0); // Докупленная броня как вес (т)
  const [extraAmmoCapacityBonusPct, setExtraAmmoCapacityBonusPct] = useState<number>(10); // Стандарт: +10% (50 т + 10% = 55 т = 550 выстрелов по 100 кг)
  const [weaponComboMode, setWeaponComboMode] = useState<WeaponCombinationMode>('SINGLE_100KG');
  const [unlockedWeaponCombos, setUnlockedWeaponCombos] = useState<WeaponCombinationMode[]>([
    'SINGLE_100KG',
    'COMBO_50_PLUS_50',
    'DUAL_2X50KG',
  ]);
  const [destroyedEnemyTonsXp, setDestroyedEnemyTonsXp] = useState<number>(0); // КРЕДИТ: уничтоженные ТОБОЙ тонны врага (засчитываются ТОЛЬКО после полного уничтожения противника!)
  const [spentSalvoDebitKg, setSpentSalvoDebitKg] = useState<number>(0); // ДЕБЕТ: суммарный потраченный тоннаж залпа в кг (напр. потратил 51 т залпа -> уничтожил врага 50 т -> засчиталось 50 т!)
  const [isTeamCombatMode, setIsTeamCombatMode] = useState<boolean>(false); // Режим «Работает команда» (считаются конкретно твои попадания + попадания союзников)
  const [pendingTargetHitSummary, setPendingTargetHitSummary] = useState<{
    targetLabel: string;
    playerTons: number;
    teamTons: number;
    remainingTons: number;
    maxTons: number;
    playerShots: number;
  } | null>(null);
  const [isTonnageXpModalOpen, setIsTonnageXpModalOpen] = useState<boolean>(false);
  const [isFullConfigDocOpen, setIsFullConfigDocOpen] = useState<boolean>(false);
  const [isLabHangarModalOpen, setIsLabHangarModalOpen] = useState<boolean>(false);

  // =========================================================================
  // ЛАБОРАТОРИЯ (+5 Т) И АНГАР (+5 Т): 2 СПОСОБА ПОЛУЧИТЬ ЧТО-ЛИБО И ПРОДАЖА 50% / 80%
  // • Способ 1: Купить за 100% цены.
  // • Способ 2: Разработать за 10% цены (нужна Лаборатория) + Построить за 10% цены (нужен Ангар).
  // • Продать можно: Правительству планеты за 50% цены ИЛИ Частному бизнесу за 80% цены.
  // • Лаборатория и Ангар имеют массу по 5 т каждый, и эта масса присоединяется к общей массе корабля!
  // =========================================================================
  const [hasLaboratory, setHasLaboratory] = useState<boolean>(false);
  const [hasHangar, setHasHangar] = useState<boolean>(false);
  const [craftableItemsState, setCraftableItemsState] = useState<
    Record<string, CraftableItemState>
  >({
    MILITARY_LASER: {developed: false, ownedCount: 0},
    CARGO_EXPANDER_35T: {developed: false, ownedCount: 0},
    ARMOR_PLATE_10T: {developed: false, ownedCount: 0},
    WEAPON_HEAVY_150KG: {developed: false, ownedCount: 0},
    WEAPON_TWIN_200KG: {developed: false, ownedCount: 0},
    AUTONOMOUS_LOGISTICS_DRONE: {developed: false, ownedCount: 0},
  });

  // Расчёт текущей заполненности грузового отсека (включая все захваченные элементы периодической системы Fe, Al, Ti, H₂O, Cu, Ni, Co, Li, Ag, Pt, Au и грузы), массы корабля, манёвренности и защиты
  const marketCargoTons = Object.values(cargoHold).reduce((acc, v) => acc + v, 0);
  const periodicExtraTons = Object.values(minedElementsHold).reduce((acc, v) => acc + v, 0);
  const usedCargoTonsForPhysics =
    marketCargoTons +
    ironStock +
    aluminumStock +
    titaniumStock +
    foodWaterCargoStock +
    periodicExtraTons;
  const armorPresetTons = armorBallastLevel === 2 ? 35 : armorBallastLevel === 1 ? 15 : 0;
  const armorExtraTons = armorPresetTons + purchasedArmorWeightTons;
  const labAndHangarMassTons =
    (hasLaboratory ? LAB_MODULE_MASS_TONS : 0) + (hasHangar ? HANGAR_MODULE_MASS_TONS : 0);
  const equipmentTons =
    (hasMilitaryLaser ? 4 : 0) + (maxCargoCapacity > 20 ? 5 : 0) + labAndHangarMassTons;
  const baseShipMassWithoutLabHangarTons =
    baseStandardShipMassTons +
    armorExtraTons +
    Math.max(0, usedCargoTonsForPhysics - 8) +
    (hasMilitaryLaser ? 4 : 0) +
    (maxCargoCapacity > 20 ? 5 : 0);
  // В стандартной комплектации (без доп. брони и со стартовым запасом 8т) полная масса корабля = ровно 50 т,
  // а при покупке Лаборатории (+5 т) и Ангара (+5 т) их масса присоединяется к общей массе корабля!
  const totalShipMassTons =
    baseStandardShipMassTons +
    armorExtraTons +
    Math.max(0, usedCargoTonsForPhysics - 8) +
    equipmentTons;

  // Максимальная огневая ёмкость корабля в кг: в стандартной комплектации 50 т + 10% = 55 000 кг (55 т = 550 выстрелов по 100 кг)
  const maxAmmoCapacityKg = Math.round(
    (baseStandardShipMassTons + armorExtraTons) * 1000 * (1 + extraAmmoCapacityBonusPct / 100)
  );
  const [remainingAmmoCapacityKg, setRemainingAmmoCapacityKg] = useState<number>(55000);

  // Обработчики конструктора брони (как веса), ёмкости боезапаса, комбинаций оружия и начисления опыта в тоннах
  const handleReloadFullAmmoCapacity = useCallback(() => {
    playZxBeep('DOCK');
    setRemainingAmmoCapacityKg(maxAmmoCapacityKg);
    setFlightMessage(
      `⚡ БОЕКОМПЛЕКТ ПОЛНОСТЬЮ ЗАРЯЖЕН: ${(maxAmmoCapacityKg / 1000).toFixed(1)} Т (${
        baseStandardShipMassTons + armorExtraTons
      } т + ${extraAmmoCapacityBonusPct}%) = ${Math.floor(
        maxAmmoCapacityKg / 100
      )} ВЫСТРЕЛОВ ПО 100 КГ!`
    );
  }, [armorExtraTons, baseStandardShipMassTons, extraAmmoCapacityBonusPct, maxAmmoCapacityKg, playZxBeep]);

  const handleBuyArmorWeightTons = useCallback(
    (deltaTons: number, costCr: number) => {
      if (costCr > 0 && credits < costCr) {
        playZxBeep('HIT');
        setFlightMessage(`⚠️ НЕДОСТАТОЧНО КРЕДИТОВ ДЛЯ ДОКУПКИ БРОНИ (НУЖНО ${costCr} CR)!`);
        return;
      }
      playZxBeep('MISSION');
      if (costCr > 0) {
        setCredits((c) => Number((c - costCr).toFixed(1)));
      }
      setPurchasedArmorWeightTons((prev) => {
        const nextArmor = Math.max(0, prev + deltaTons);
        const nextTotalShipTons = baseStandardShipMassTons + armorPresetTons + nextArmor;
        const nextMaxAmmoKg = Math.round(
          nextTotalShipTons * 1000 * (1 + extraAmmoCapacityBonusPct / 100)
        );
        setRemainingAmmoCapacityKg(nextMaxAmmoKg);
        setFlightMessage(
          deltaTons > 0
            ? `🛡️ ДОКУПЛЕНА БРОНЯ КАК ВЕС (+${deltaTons} т ЗА ${costCr} CR): ПОЛНАЯ МАССА КОРАБЛЯ = ${nextTotalShipTons} т (${(
                nextTotalShipTons * 1000
              ).toLocaleString('ru-RU')} кг), БОЕЗАПАС ВЫСТРЕЛОВ = ${(nextMaxAmmoKg / 1000).toFixed(
                1
              )} т (${Math.floor(nextMaxAmmoKg / 100)} выстр. по 100 кг)!`
            : `🛡️ БРОНЯ СБРОШЕНА ДО СТАНДАРТНОЙ КОМПЛЕКТАЦИИ 50 т (БОЕЗАПАС 50 т + 10% = 55 т / 550 ВЫСТРЕЛОВ ПО 100 КГ)`
        );
        return nextArmor;
      });
    },
    [armorPresetTons, baseStandardShipMassTons, credits, extraAmmoCapacityBonusPct, playZxBeep]
  );

  const handleBuyExtraAmmoCapacityPct = useCallback(
    (addPct: number, costCr: number) => {
      if (credits < costCr) {
        playZxBeep('HIT');
        setFlightMessage(`⚠️ НЕДОСТАТОЧНО КРЕДИТОВ ДЛЯ УВЕЛИЧЕНИЯ ЁМКОСТИ ОРУЖИЯ (НУЖНО ${costCr} CR)!`);
        return;
      }
      playZxBeep('MISSION');
      setCredits((c) => Number((c - costCr).toFixed(1)));
      setExtraAmmoCapacityBonusPct((prev) => {
        const nextPct = prev + addPct;
        const nextMaxKg = Math.round(
          (baseStandardShipMassTons + armorExtraTons) * 1000 * (1 + nextPct / 100)
        );
        setRemainingAmmoCapacityKg(nextMaxKg);
        setFlightMessage(
          `⚡ ЁМКОСТЬ ОРУЖИЯ УВЕЛИЧЕНА ДО ${
            baseStandardShipMassTons + armorExtraTons
          } т + ${nextPct}% = ${(nextMaxKg / 1000).toFixed(1)} т (${Math.floor(
            nextMaxKg / 100
          )} ВЫСТРЕЛОВ ПО 100 КГ)!`
        );
        return nextPct;
      });
    },
    [armorExtraTons, baseStandardShipMassTons, credits, playZxBeep]
  );

  const handleSelectOrBuyWeaponCombo = useCallback(
    (mode: WeaponCombinationMode) => {
      const preset = WEAPON_COMBINATION_PRESETS[mode];
      if (unlockedWeaponCombos.includes(mode)) {
        playZxBeep('DOCK');
        setWeaponComboMode(mode);
        setFlightMessage(
          `🔫 АКТИВИРОВАНА КОМБИНАЦИЯ ОРУЖИЯ «${preset.title.toUpperCase()}»: 1 НАЖАТИЕ РАЗРУШАЕТ ${
            preset.totalDestroyedKgPerAction
          } КГ (+${(preset.totalDestroyedKgPerAction / 1000).toFixed(2)} т ОПЫТА XP)!`
        );
        return;
      }
      const finalCost = preset.priceCr * pirateBuyMultiplier;
      if (credits < finalCost) {
        playZxBeep('HIT');
        setFlightMessage(`⚠️ НЕДОСТАТОЧНО КРЕДИТОВ ДЛЯ ПОКУПКИ МОДУЛЯ ОРУЖИЯ (НУЖНО ${finalCost} CR)!`);
        return;
      }
      playZxBeep('MISSION');
      setCredits((c) => Number((c - finalCost).toFixed(1)));
      setUnlockedWeaponCombos((prev) => [...prev, mode]);
      setWeaponComboMode(mode);
      setFlightMessage(
        `🔫 ДОКУПЛЕН И УСТАНОВЛЕН МОДУЛЬ ОРУЖИЯ «${preset.title.toUpperCase()}» (-${finalCost} CR): СИЛА ЗАЛПА ${
          preset.totalDestroyedKgPerAction
        } КГ (+${(preset.totalDestroyedKgPerAction / 1000).toFixed(2)} т XP ЗА ВЫСТРЕЛ)!`
      );
    },
    [credits, pirateBuyMultiplier, playZxBeep, unlockedWeaponCombos]
  );

  const handleSettleCombatDebitCredit = useCallback(
    (settlement: CombatDebitCreditSettlement) => {
      const {
        debitSalvoSpentKg,
        creditedPlayerDestroyedKg,
        enemyShipDestroyed,
        logNote,
      } = settlement;
      playZxBeep(enemyShipDestroyed ? 'EXPLODE' : 'HIT');
      if (debitSalvoSpentKg > 0) {
        setRemainingAmmoCapacityKg((prev) => Math.max(0, prev - debitSalvoSpentKg));
        setSpentSalvoDebitKg((prev) => prev + debitSalvoSpentKg);
      }
      // ПРАВИЛО ДЕБЕТ / КРЕДИТ:
      // Очки опыта (тонны) засчитываются в КРЕДИТ ТОЛЬКО если противник УНИЧТОЖЕН (enemyShipDestroyed === true)!
      // Если не уничтожил — не засчитываются (0 т)! Если работала команда — засчитываются ровно уничтоженные тобой тонны (creditedPlayerDestroyedKg)!
      if (enemyShipDestroyed && creditedPlayerDestroyedKg > 0) {
        const creditedTonsXp = Number((creditedPlayerDestroyedKg / 1000).toFixed(2));
        setDestroyedEnemyTonsXp((prev) => Number((prev + creditedTonsXp).toFixed(2)));
        setEliteKills((k) => k + 1);
        setShipsDestroyedByPlayer((n) => n + 1);
        setCredits((c) => c + Math.round(creditedTonsXp * 4));
      } else if (enemyShipDestroyed) {
        setEliteKills((k) => k + 1);
      }
      setFlightMessage(logNote);
    },
    [playZxBeep]
  );
  // 1) Базовая манёвренность от массы корабля (от 100% при 50t до 35% при 110t).
  // ЕСЛИ АКТИВЕН РЕАКТОР КОНТРОЛИРУЕМОГО РАЗМЫКАНИЯ ЛОКАЛЬНЫХ УЗЛОВ (Критическое вещество Ω-γ),
  // супер-энергия (на порядки выше ядерной) полностью питает тяжёлый корабль и даёт 100% манёвренность даже в броне ТАНК (+35t)!
  const baseMassManeuverPct =
    reactorSuperEnergySec > 0
      ? 100
      : Math.round(Math.max(35, Math.min(100, 100 - ((totalShipMassTons - 25) / 75) * 65)));
  // 2) Инерция от скорости: чем выше скорость (throttleUi 0..100%), тем ниже манёвренность, и наоборот!
  const speedInertiaMultiplier =
    reactorSuperEnergySec > 0 ? 0.92 : 1 - (throttleUi / 100) * 0.62; // при супер-энергии инерция тяжёлого корабля компенсируется!
  const maneuverabilityPct = Math.round(
    Math.max(14, Math.min(100, baseMassManeuverPct * speedInertiaMultiplier))
  );
  // Уровень продольной инерции (заноса на вираже): растёт с ростом скорости и массы корабля
  const inertiaForcePct =
    reactorSuperEnergySec > 0
      ? 12
      : Math.round(
          Math.max(5, Math.min(100, throttleUi * (0.65 + ((totalShipMassTons - 25) / 75) * 0.35)))
        );
  // Чем тяжелее корабль — тем выше защищённость/броня (а с супер-энергией контролируемого размыкания узлов — 92%!)
  const armorProtectionPct =
    reactorSuperEnergySec > 0
      ? 92
      : Math.round(Math.max(10, Math.min(75, 10 + ((totalShipMassTons - 25) / 75) * 62)));

  // Состояние солнечной зарядки от близости к звезде и выбранного ракурса в звёздной системе
  const [solarChargeUi, setSolarChargeUi] = useState<{
    fluxPct: number;
    starDist: number;
    etaToStar: string;
  }>({
    fluxPct: 4,
    starDist: SYSTEM_SPHERE_RADIUS,
    etaToStar: '5м 00с',
  });

  // Состояние закрепления корабля на стационарной орбите планеты (клавиша X)
  const [stationaryOrbitInfo, setStationaryOrbitInfo] = useState<{
    planetId: string;
    planetName: string;
    cleanName: string;
    color: string;
  } | null>(null);

  // =========================================================================
  // СОСТОЯНИЕ АВТОМАТИЧЕСКОЙ ПЛАНЕТАРНОЙ ЛОГИСТИКИ И СТРОГИХ ТРАЕКТОРИЙ (БЕЗ ХАОСА):
  // • У каждой из 4 планет есть свой автоматический логистический стандартный модуль (50 т),
  //   курсирующий по циклу без остановки:
  //   Своя планета -> Другая планета 1 -> Задержка на стационарной орбите 1 мин (60с) ->
  //   Возвращение на свою планету -> Задержка на стационарной орбите своей планеты 1 мин (60с) ->
  //   Другая планета 2 ... и так со всеми планетами без остановки!
  // • Груз соответствующий: со своей планеты — её ресурсы, с чужой — её ресурсы.
  // • При гибели корабля груз и мусор продолжают двигаться по траектории убитого корабля и,
  //   если их не подобрали, исчезают в планете назначения (чтобы мусора не было).
  // • Уничтожение мусора или груза считается уничтожением астероида и вознаграждается соответственно!
  // =========================================================================
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState<boolean>(false);
  const [absorbedInPlanetCount, setAbsorbedInPlanetCount] = useState<number>(0);
  const [destroyedCargoDebrisAsAsteroidCount, setDestroyedCargoDebrisAsAsteroidCount] =
    useState<number>(0);
  const [logisticsUiSnapshot, setLogisticsUiSnapshot] = useState<LogisticsUiSnapshotItem[]>([]);

  // =========================================================================
  // КАРТОЧКА ПРОФИЛЯ КОСМИЧЕСКОГО ОБЪЕКТА (ТОЛЬКО ПРИ НАВЕДЕНИИ КУРСОРА МЫШИ + КЛАВИША I):
  // • На 3D-экране нет никаких подписей или текстов у объектов (даже при наведении мыши).
  // • Только когда объект находится в зоне действия курсора мыши и нажата клавиша I,
  //   рядом с объектом появляется его карточка профиля (это касается групп, бизнесов, объявлений и любого объекта).
  // =========================================================================
  const [activeObjectProfile, setActiveObjectProfile] =
    useState<SpaceObjectProfileData | null>(null);
  const activeObjectProfileRef = useRef<SpaceObjectProfileData | null>(null);
  const [customObjectOverrides, setCustomObjectOverrides] = useState<
    Record<string, CustomObjectProfileOverride>
  >({});

  interface ProjectedScreenTargetHit {
    id: string;
    canvasX: number;
    canvasY: number;
    hitRadius: number;
    priority: number;
    profile: SpaceObjectProfileData;
  }

  const projectedScreenTargetsRef = useRef<ProjectedScreenTargetHit[]>([]);
  const hoveredScreenTargetRef = useRef<ProjectedScreenTargetHit | null>(null);
  const isKeyIDownRef = useRef<boolean>(false);
  const isHoveringObjectCardRef = useRef<boolean>(false);

  const handleUpdateCustomObjectOverride = useCallback(
    (objectId: string, patch: Partial<CustomObjectProfileOverride>) => {
      setCustomObjectOverrides((prev) => ({
        ...prev,
        [objectId]: {
          ...(prev[objectId] || {}),
          ...patch,
        },
      }));
    },
    []
  );

  const flightStateRef = useRef<{
    speed: number;
    targetSpeed: number;
    maxSpeed: number;
    pitchRate: number;
    rollRate: number;
    bankAngle: number;
    pitchAngle: number;
    frontShield: number;
    aftShield: number;
    energy: number;
    laserHeat: number;
    laserFiringTimer: number;
    plasmaFiringTimer: number;
    gammaWeaponFiringTimer: number;
    supernovaBurstTimer: number;
    tractorBeamTimer: number;
    hyperspaceTimer: number;
    hyperspaceTargetId: number;
    // Координаты прицела Огневой Башни (указатель мыши на 3D-экране)
    turretX: number;
    turretY: number;
    turretActive: boolean;
    lastShotTargetX: number;
    lastShotTargetY: number;
    // Динамические параметры массы корабля для 60 FPS цикла
    massTons: number;
    maneuverFactor: number;
    protectionFactor: number;
    enemyFireCooldown: number;
    // СЦЕНА ВНУТРИ СФЕРЫ СИСТЕМЫ: Центральная Звезда в центре сферы, 4 Планеты и Пояс Астероидов
    starPos: Vec3;
    eclipticU: Vec3;
    eclipticV: Vec3;
    eclipticN: Vec3;
    planets: SystemPlanet[];
    asteroids: SystemAsteroid[];
    stationaryOrbitPlanetId: string | null;
    stationaryOrbitTurnRad: number;
    solarFluxPct: number;
    frameCounter: number;
    lastFrameTimeMs: number;
    entities: SpaceEntity[];
    debris: DebrisParticle[];
    stars: Vec3[];
    keys: Record<string, boolean>;
  }>({
    speed: MAX_SYSTEM_SPEED,
    targetSpeed: MAX_SYSTEM_SPEED,
    maxSpeed: MAX_SYSTEM_SPEED,
    pitchRate: 0,
    rollRate: 0,
    bankAngle: 0,
    pitchAngle: 0,
    frontShield: 100,
    aftShield: 100,
    energy: 100,
    laserHeat: 0,
    laserFiringTimer: 0,
    plasmaFiringTimer: 0,
    gammaWeaponFiringTimer: 0,
    supernovaBurstTimer: 0,
    tractorBeamTimer: 0,
    hyperspaceTimer: 0,
    hyperspaceTargetId: 1,
    turretX: 430,
    turretY: 194,
    turretActive: false,
    lastShotTargetX: 430,
    lastShotTargetY: 194,
    massTons: 25,
    maneuverFactor: 1.0,
    protectionFactor: 0.1,
    enemyFireCooldown: 90,
    starPos: {x: 0, y: 80, z: SYSTEM_SPHERE_RADIUS},
    eclipticU: {x: 1, y: 0, z: 0},
    eclipticV: {x: 0, y: 0.16, z: 0.987},
    eclipticN: {x: 0, y: 0.987, z: -0.16},
    planets: [],
    asteroids: [],
    stationaryOrbitPlanetId: null,
    stationaryOrbitTurnRad: 0,
    solarFluxPct: 4,
    frameCounter: 0,
    lastFrameTimeMs: 0,
    entities: [],
    debris: [],
    stars: [],
    keys: {},
  });

  // Синхронизируем расчётную массу, базовую манёвренность и защиту с физическим движком
  // При этом максимальная крейсерская скорость в системе фиксирована = 100 ед./сек (ровно 5 мин от окраины 30000 до звезды и 1 мин между планетами 6000!)
  useEffect(() => {
    const st = flightStateRef.current;
    st.massTons = totalShipMassTons;
    st.maneuverFactor = baseMassManeuverPct / 100;
    st.protectionFactor = armorProtectionPct / 100;
    st.maxSpeed = MAX_SYSTEM_SPEED;
  }, [totalShipMassTons, baseMassManeuverPct, armorProtectionPct]);

  // Инициализация чистой сцены Звёздной Системы внутри Сферы (R = 30 000):
  // В центре сферы — Звезда, вокруг неё — 4 планеты по принципу первых 4 планет Солнечной системы
  // (Меркурий R=6000, Венера R=12000, Земля R=18000, Марс R=24000) и Пояс Астероидов (R=27000).
  // На каждой планете созданы объекты GoBell:
  // 1) Группа с названием планеты и описанием «Друзья планеты»
  // 2) Один Бизнес
  // 3) Четыре его объявления (ADVERT #1..#4)
  // Вращение всех планет замедлено в 3 раза для комфортного наведения курсора и отправки запроса на контакт!
  const buildPlanetGoBellObjects = (
    planetId: string,
    planetOrder: number,
    cleanPlanetName: string,
    groupTag: string,
    specializationBadge: string,
    specializationPurpose: string,
    businessName: string,
    businessDesc: string,
    adverts: [string, string, string, string]
  ): PlanetGoBellObject[] => {
    const businessId = `${planetId}-business`;
    return [
      // 1. ГРУППА ПЛАНЕТЫ = ЕЁ ПРАВИТЕЛЬСТВО (координирует межпланетную логистику, очистку пояса астероидов и добычу редких элементов)
      {
        id: `${planetId}-group`,
        planetId,
        planetCleanName: cleanPlanetName,
        planetOrder,
        specializationBadge: `🏛️ ПРАВИТЕЛЬСТВО ПЛАНЕТЫ «${cleanPlanetName.toUpperCase()}» · ГРУППА #${groupTag}`,
        specializationPurpose:
          planetOrder === 3
            ? 'Потребность Земли в Железе с Меркурия (платит 10 CR, на Меркурии 5 CR / в группе Меркурия 1 CR!), Алюминии и Титане + Очистка пояса астероидов и Редкие элементы'
            : planetOrder === 1
            ? 'Продажа Железа Fe (5 CR / в группе #GO-MERCURY скидка до 1 CR! На Земле за доставку платят 10 CR) + Контракты логистики и Пояса астероидов'
            : planetOrder === 2
            ? 'Продажа Алюминия Al (5 CR / в группе #GO-VENUS скидка до 1 CR! На Земле и Марсе платят 10 CR) + Контракты логистики и Пояса астероидов'
            : 'Продажа Титана Ti (5 CR / в группе #GO-MARS скидка до 1 CR! На Земле и Меркурии платят 10 CR) + Очистка Пояса астероидов и Редкие элементы',
        kind: 'GROUP',
        title: `${cleanPlanetName} (Правительство)`,
        description: 'Друзья планеты · Правительство: межпланетная логистика (10 CR), очистка пояса астероидов и редкие элементы',
        authorName: `Правительство · Группа «${cleanPlanetName}» (#${groupTag})`,
        groupTag,
        karmaPlus: 18,
        karmaMinus: 0,
        latDeg: 10,
        lonOffsetDeg: -27,
      },
      // 2. ОДИН БИЗНЕС ПЛАНЕТЫ (со специализацией планеты)
      {
        id: businessId,
        planetId,
        planetCleanName: cleanPlanetName,
        planetOrder,
        specializationBadge,
        specializationPurpose,
        kind: 'BUSINESS',
        title: businessName,
        description: businessDesc,
        authorName: businessName,
        karmaPlus: 25,
        karmaMinus: 0,
        latDeg: -15,
        lonOffsetDeg: 18,
      },
      // 3. ЧЕТЫРЕ ОБЪЯВЛЕНИЯ ЭТОГО БИЗНЕСА (ADVERT #1..#4)
      {
        id: `${businessId}-adv-1`,
        planetId,
        planetCleanName: cleanPlanetName,
        planetOrder,
        specializationBadge,
        specializationPurpose,
        kind: 'ADVERT',
        title: `Объявление #1 · ${businessName}`,
        description: adverts[0],
        authorName: businessName,
        slotId: 1,
        parentBusinessId: businessId,
        karmaPlus: 25,
        karmaMinus: 0,
        latDeg: 7,
        lonOffsetDeg: 1,
      },
      {
        id: `${businessId}-adv-2`,
        planetId,
        planetCleanName: cleanPlanetName,
        planetOrder,
        specializationBadge,
        specializationPurpose,
        kind: 'ADVERT',
        title: `Объявление #2 · ${businessName}`,
        description: adverts[1],
        authorName: businessName,
        slotId: 2,
        parentBusinessId: businessId,
        karmaPlus: 25,
        karmaMinus: 0,
        latDeg: 22,
        lonOffsetDeg: 12,
      },
      {
        id: `${businessId}-adv-3`,
        planetId,
        planetCleanName: cleanPlanetName,
        planetOrder,
        specializationBadge,
        specializationPurpose,
        kind: 'ADVERT',
        title: `Объявление #3 · ${businessName}`,
        description: adverts[2],
        authorName: businessName,
        slotId: 3,
        parentBusinessId: businessId,
        karmaPlus: 25,
        karmaMinus: 0,
        latDeg: 22,
        lonOffsetDeg: 25,
      },
      {
        id: `${businessId}-adv-4`,
        planetId,
        planetCleanName: cleanPlanetName,
        planetOrder,
        specializationBadge,
        specializationPurpose,
        kind: 'ADVERT',
        title: `Объявление #4 · ${businessName}`,
        description: adverts[3],
        authorName: businessName,
        slotId: 4,
        parentBusinessId: businessId,
        karmaPlus: 25,
        karmaMinus: 0,
        latDeg: 7,
        lonOffsetDeg: 36,
      },
    ];
  };

  const spawnSystemEntities = useCallback((sysId: number) => {
    const sys = GALAXY_SYSTEMS[sysId] || GALAXY_SYSTEMS[0];
    const shortSysName = sys.name.split('·')[0].trim();

    const st = flightStateRef.current;
    st.eclipticU = {x: 1, y: 0, z: 0};
    st.eclipticV = {x: 0, y: 0.16, z: 0.987};
    st.eclipticN = {x: 0, y: 0.987, z: -0.16};

    // СПЕЦИАЛИЗАЦИЯ ЗВЕЗДЫ И ЧЕТЫРЁХ ПЛАНЕТ СИСТЕМЫ:
    // • Звезда в центре — ИСТОЧНИК ЭНЕРГИИ.
    // • 1-я планета (ближайшая к звезде — Меркурий): ЖЕЛЕЗО (Fe) — необходимый запас для восстановления повреждений во время гиперпрыжка.
    // • 2-я планета (Венера): АЛЮМИНИЙ (Al) — необходимо для восстановления повреждений во время гиперпрыжка.
    // • 3-я планета (Земля): ПРОДОВОЛЬСТВИЕ (необходимое для автономного нахождения в космосе) и ВОДА (необходимая как питьё и источник кислорода O₂).
    // • 4-я планета (Марс): ТИТАН (Ti) — необходимый для восстановления повреждений во время гиперпрыжка.
    st.planets = [
      {
        id: `planet-${sysId}-1`,
        name: `I. МЕРКУРИЙ (${shortSysName}-I · ЖЕЛЕЗО Fe)`,
        cleanName: 'Меркурий',
        shortMarker: 'I. МЕРКУРИЙ [ЖЕЛЕЗО Fe]',
        specializationShort: 'ЖЕЛЕЗО (Fe) · Ремонт гиперпрыжка',
        orbitOrder: 1,
        orbitRadius: PLANET_ORBIT_STEP * 1, // 6 000 ед. от Звезды (1 мин от Звезды)
        orbitAngle: -Math.PI / 2 - 0.11,
        orbitSpeed: 0.000015,
        radius3D: 95,
        spinAngle: 0,
        spinSpeed: 0.0026, // В 3 раза медленнее
        color: '#fb923c', // Янтарно-оранжевая точка/сфера
        labelOffsetY: -26,
        gobellObjects: buildPlanetGoBellObjects(
          `planet-${sysId}-1`,
          1,
          'Меркурий',
          'GO-MERCURY',
          '⚙️ СПЕЦИАЛИЗАЦИЯ 1-Й ПЛАНЕТЫ: ЖЕЛЕЗО (Fe)',
          'Необходимый запас для восстановления повреждений во время гиперпрыжка',
          'Бизнес «Феррум-Меркурий · Запас Железа (Fe)»',
          'Добыча и поставка ЖЕЛЕЗА (Fe) — необходимого запаса для восстановления повреждений силового каркаса во время гиперпрыжка.',
          [
            'ЖЕЛЕЗО (Fe) конструкционное: необходимый запас для восстановления повреждений корабля во время гиперпрыжка #железо #гиперпрыжок #ремонт',
            'Отгрузка слитков чистого железа Меркурия для восстановления силовых шпангоутов после перегрузок гиперпрыжка #запас #железо #каркас',
            'Ремонтные комплекты из железа (Fe) для автоматической сварки повреждений обшивки при гиперпрыжке #сварка #железо #обшивка',
            'Пополнение бортового бункера железа перед серией дальних гиперпрыжков по системам GoBell #опт #железо #меркурий',
          ]
        ),
      },
      {
        id: `planet-${sysId}-2`,
        name: `II. ВЕНЕРА (${shortSysName}-II · АЛЮМИНИЙ Al)`,
        cleanName: 'Венера',
        shortMarker: 'II. ВЕНЕРА [АЛЮМИНИЙ Al]',
        specializationShort: 'АЛЮМИНИЙ (Al) · Ремонт гиперпрыжка',
        orbitOrder: 2,
        orbitRadius: PLANET_ORBIT_STEP * 2, // 12 000 ед. от Звезды (+1 мин от Меркурия)
        orbitAngle: -Math.PI / 2 + 0.11,
        orbitSpeed: 0.000011,
        radius3D: 120,
        spinAngle: 0,
        spinSpeed: -0.002, // В 3 раза медленнее
        color: '#a3e635', // Изумрудно-золотистая точка/сфера
        labelOffsetY: 18,
        gobellObjects: buildPlanetGoBellObjects(
          `planet-${sysId}-2`,
          2,
          'Венера',
          'GO-VENUS',
          '🔩 СПЕЦИАЛИЗАЦИЯ 2-Й ПЛАНЕТЫ: АЛЮМИНИЙ (Al)',
          'Необходимо для восстановления повреждений во время гиперпрыжка',
          'Бизнес «АлюмПром-Венера · Запас Алюминия (Al)»',
          'Производство и поставка АЛЮМИНИЯ (Al) — необходимого для восстановления повреждений переборок и контуров во время гиперпрыжка.',
          [
            'АЛЮМИНИЙ (Al) авиакосмический: необходим для восстановления повреждений корпуса и экранов во время гиперпрыжка #алюминий #гиперпрыжок #ремонт',
            'Листовой и профильный алюминий Венеры для герметизации отсеков после повреждений гиперпрыжка #алюминий #герметизация #корпус',
            'Алюминиевые шины и радиаторы охлаждения для восстановления энергоконтуров во время гиперпрыжка #охлаждение #алюминий #венера',
            'Срочная загрузка бортового запаса алюминия (Al) на орбите Венеры для защиты в гиперпрыжке #запас #алюминий #орбита',
          ]
        ),
      },
      {
        id: `planet-${sysId}-3`,
        name: `III. ЗЕМЛЯ (${shortSysName}-III · ПРОДОВОЛЬСТВИЕ И ВОДА O₂)`,
        cleanName: 'Земля',
        shortMarker: 'III. ЗЕМЛЯ [ПРОДОВОЛЬСТВИЕ И ВОДА O₂]',
        specializationShort: 'ПРОДОВОЛЬСТВИЕ (автономность) и ВОДА (питьё + кислород O₂)',
        orbitOrder: 3,
        orbitRadius: PLANET_ORBIT_STEP * 3, // 18 000 ед. от Звезды (+1 мин от Венеры)
        orbitAngle: -Math.PI / 2 - 0.14,
        orbitSpeed: 0.000008,
        radius3D: 132,
        spinAngle: 0,
        spinSpeed: 0.0036, // В 3 раза медленнее
        color: '#38bdf8', // Ярко-голубая точка/сфера
        labelOffsetY: -18,
        isMainWorld: true,
        gobellObjects: buildPlanetGoBellObjects(
          `planet-${sysId}-3`,
          3,
          'Земля',
          'GO-EARTH',
          '🍎💧 СПЕЦИАЛИЗАЦИЯ 3-Й ПЛАНЕТЫ: ПРОДОВОЛЬСТВИЕ И ВОДА (O₂)',
          'Продовольствие для автономного нахождения в космосе и Вода как питьё и источник кислорода',
          'Бизнес «АгроАква-Земля · Продовольствие и Вода (O₂)»',
          'Поставка ПРОДОВОЛЬСТВИЯ (необходимого для автономного нахождения в космосе) и ВОДЫ (необходимой как питьё и источник кислорода O₂).',
          [
            'ПРОДОВОЛЬСТВИЕ для экипажей: необходимый запас рационов для длительного автономного нахождения в космосе #продовольствие #автономность #космос',
            'ВОДА питьевая и электролизная (H₂O → O₂): необходима как питьё и главный источник кислорода на корабле #вода #кислород #питье',
            'Комплекты автономного жизнеобеспечения Земли: свежее продовольствие + чистая вода для регенерации кислорода #жизнеобеспечение #продовольствие #вода',
            'Полная заправка танков питьевой водой (источник кислорода O₂) и продовольственных складов корабля #кислород #вода #рационы',
          ]
        ),
      },
      {
        id: `planet-${sysId}-4`,
        name: `IV. МАРС (${shortSysName}-IV · ТИТАН Ti)`,
        cleanName: 'Марс',
        shortMarker: 'IV. МАРС [ТИТАН Ti]',
        specializationShort: 'ТИТАН (Ti) · Ремонт гиперпрыжка',
        orbitOrder: 4,
        orbitRadius: PLANET_ORBIT_STEP * 4, // 24 000 ед. от Звезды (+1 мин от Земли)
        orbitAngle: -Math.PI / 2 + 0.13,
        orbitSpeed: 0.000006,
        radius3D: 105,
        spinAngle: 0,
        spinSpeed: 0.003, // В 3 раза медленнее
        color: '#f43f5e', // Красная точка/сфера
        labelOffsetY: 20,
        gobellObjects: buildPlanetGoBellObjects(
          `planet-${sysId}-4`,
          4,
          'Марс',
          'GO-MARS',
          '🛡️ СПЕЦИАЛИЗАЦИЯ 4-Й ПЛАНЕТЫ: ТИТАН (Ti)',
          'Необходимый запас для восстановления повреждений во время гиперпрыжка',
          'Бизнес «ТитанКузница-Марс · Запас Титана (Ti)»',
          'Добыча и отгрузка жаропрочного ТИТАНА (Ti) — необходимого для восстановления бронеплит и повреждений во время гиперпрыжка.',
          [
            'ТИТАН (Ti) жаропрочный: необходимый запас для восстановления повреждений брони и узлов во время гиперпрыжка #титан #гиперпрыжок #ремонт',
            'Марсианские титановые пластины для защиты и восстановления корпуса от разрывов гиперпространства #титан #броня #гиперпрыжок',
            'Восстановление повреждений гипердвигателя и внешних сопел чистым титаном у Олимпа #ремонт #титан #марс',
            'Оптовая загрузка бортового запаса титана (Ti) для безопасных гиперпрыжков между звёздными системами #запас #титан #снаряжение',
          ]
        ),
      },
    ];

    // При старте в обычной системе помещаем корабль прямо перед Планетой III. Земля (на 1/2 экрана),
    // а если это СТАРАЯ ГАЛАКТИКА БЕЗ ЗАСЕЛЁННЫХ ПЛАНЕТ (sys.isOldGalaxy) — планет нет вообще (из-за частых взрывов сверхновых!),
    // и корабль выходит прямо в реликтовый пояс Критического вещества (Ω-γ) перед умирающей звездой!
    if (sys.isOldGalaxy) {
      st.planets = [];
      st.starPos = {
        x: 0,
        y: 35,
        z: 26800,
      };
    } else {
      const startPlanet = st.planets[2];
      const cosA = Math.cos(startPlanet.orbitAngle);
      const sinA = Math.sin(startPlanet.orbitAngle);
      const offsetX = startPlanet.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x);
      const offsetY = startPlanet.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y);
      const offsetZ = startPlanet.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z);
      const closeDist = Math.round(startPlanet.radius3D * 2.05);
      st.starPos = {
        x: -offsetX,
        y: -offsetY,
        z: closeDist - offsetZ,
      };
    }
    st.speed = 0;
    st.targetSpeed = 0;
    st.stationaryOrbitPlanetId = null;
    st.stationaryOrbitTurnRad = 0;
    setStationaryOrbitInfo(null);
    setThrottleUi(0);

    // Пояс Астероидов за 4-й планетой (Марсом) на радиусе R = 26 500 .. 27 500 внутри Сферы Системы (R = 30 000):
    // • До момента огневого контакта ВСЕ булыжники абсолютно неразличимы (одинаковый каменный цвет #94a3b8, без меток).
    // • При огневом контакте простые булыжники (!isValuable) исчезают бесследно со взрывом,
    //   а имеющие ценность булыжники (isValuable) помечаются как Fe, Al, Ti, H₂O, Cu, Ni, Co, Li, Ag, Pt, Au, Ω-γ
    //   и могут быть захвачены (СКМ / C) в грузовой отсек в соответствии с его вместимостью!
    // • В СТАРЫХ ГАЛАКТИКАХ БЕЗ ПЛАНЕТ (sys.isOldGalaxy) основная часть ценных глыб — это КРИТИЧЕСКОЕ ВЕЩЕСТВО (Ω-γ)!
    const elementPoolByRarity: AsteroidElementSymbol[] = sys.isOldGalaxy
      ? [
          'Omega', 'Omega', 'Omega', 'Omega', 'Omega', 'Omega',
          'Pt', 'Pt',
          'Au', 'Au',
          'Ti', 'Fe',
        ]
      : [
          'Fe', 'Fe', 'Fe', 'Fe',
          'H2O', 'H2O', 'H2O',
          'Al', 'Al', 'Al',
          'Ti', 'Ti', 'Ti',
          'Cu', 'Cu',
          'Ni', 'Ni',
          'Co',
          'Li',
          'Ag',
          'Pt',
          'Au',
          'Omega',
        ];
    const generatedAsteroids: SystemAsteroid[] = [];
    const totalAsteroids = 150;
    for (let i = 0; i < totalAsteroids; i++) {
      const angle =
        i < 55
          ? -Math.PI / 2 + ((i / 55) - 0.5) * 0.95
          : (i / totalAsteroids) * Math.PI * 2;
      // Примерно 45% булыжников — простые (исчезают бесследно со взрывом), 55% — ценные (помечаются элементами периодической системы и H₂O)
      const isValuable = sys.isOldGalaxy ? i % 3 !== 0 : i % 9 !== 0 && i % 2 === 0;
      const elSym = isValuable
        ? elementPoolByRarity[(i * 7 + sysId * 3) % elementPoolByRarity.length]
        : undefined;
      generatedAsteroids.push({
        id: `ast-${sysId}-${i}`,
        orbitRadius: 26600 + ((i * 173) % 900),
        orbitAngle: angle,
        orbitSpeed: 0.000012 + (i % 5) * 0.000002,
        yOffset: ((i % 11) - 5) * 28,
        size3D: 14 + (i % 5) * 6,
        rotAngle: (i * 0.7) % (Math.PI * 2),
        rotSpeed: 0.01 + (i % 4) * 0.005,
        color: '#94a3b8', // Единый нейтральный цвет камня — булыжники неразличимы до огневого контакта!
        isValuable,
        revealed: false,
        elementSymbol: elSym,
      });
    }
    st.asteroids = generatedAsteroids;

    // =========================================================================
    // ДВИЖЕНИЕ В СИСТЕМЕ БЕЗ ХАОТИЧЕСКИХ ДВИЖЕНИЙ (СТРОГО ПО ТРАЕКТОРИЯМ МЕЖДУ ПЛАНЕТАМИ):
    // • У каждой из 4 планет (I. Меркурий, II. Венера, III. Земля, IV. Марс) есть свой
    //   автоматический логистический стандартный модуль (50 т), курсирующий по циклу без остановки:
    //   Своя планета -> Другая планета 1 -> Задержка на стационарной орбите 1 минута (60 сек) ->
    //   Возвращение на свою планету -> Задержка на стационарной орбите своей планеты 1 минута (60 сек) ->
    //   Другая планета 2 ... и так со всеми планетами без остановки!
    // • Груз соответствующий: со своей планеты — её ресурсы (Fe / Al / Еда+H₂O / Ti), с чужой — её ресурсы!
    // • При гибели корабля груз и мусор продолжают двигаться строго по траектории убитого корабля
    //   и, если их не подобрали, исчезают в планете назначения (чтобы мусора не было).
    // =========================================================================
    const isOld = Boolean(sys.isOldGalaxy);
    st.entities = [
      // 1. Логистический стандартный модуль Планеты I (Меркурий): перелёт по маршруту Меркурий -> Венера, груз своей планеты: Fe
      createPlanetaryLogisticsModuleEntity(0, sysId, isOld, 'OUTBOUND_FLIGHT', 0, 0.35),
      // 2. Логистический стандартный модуль Планеты II (Венера): задержка 1 минута на стационарной орбите чужой планеты (Меркурий), погрузка ресурса чужой планеты (Fe)
      createPlanetaryLogisticsModuleEntity(1, sysId, isOld, 'WAIT_OTHER_ORBIT', 0, 48),
      // 3. Логистический стандартный модуль Планеты III (Земля): отправляется от орбиты Земли по маршруту Земля -> Венера (1.5% пути — виден прямо на старте у Земли и уменьшается по мере удаления!)
      createPlanetaryLogisticsModuleEntity(2, sysId, isOld, 'OUTBOUND_FLIGHT', 1, 0.015),
      // 4. Логистический стандартный модуль Планеты IV (Марс): подлетает по маршруту Марс -> Земля (96% пути — приближается к орбите Земли и растёт в масштабе!)
      createPlanetaryLogisticsModuleEntity(3, sysId, isOld, 'OUTBOUND_FLIGHT', 2, 0.96),
      // 5. Груз после боя, продолжающий двигаться строго по траектории убитого корабля (Марс -> Земля) — исчезнет в планете назначения Земля, если не подобрать и не расстрелять как астероид!
      {
        id: `after-battle-loot-${sysId}-1`,
        kind: 'CARGO',
        label: `📦 ГРУЗ НА ТРАЕКТОРИИ [1т ${isOld ? 'Ω-γ' : 'Ti'} · 93% → ИСЧЕЗНЕТ В «ЗЕМЛЯ» | СКМ=МАРОДЁР / ЛКМ=АСТЕРОИД]`,
        pos: {x: 0, y: 0, z: 500},
        vel: {x: 0, y: 0, z: 0},
        rot: {x: 0, y: 0, z: 0},
        rotSpeed: {x: 0, y: 0, z: 0},
        hp: 40,
        maxHp: 40,
        color: '#f59e0b',
        bounty: 0,
        lootOrigin: 'AFTER_BATTLE',
        lootElement: isOld ? 'Omega' : 'Ti',
        trajFromPlanetIdx: 3,
        trajToPlanetIdx: 2,
        trajProgress: 0.93,
        trajDurationSec: 60,
        isFollowingKilledShipTrajectory: true,
      },
      // 6. Мусор обломков на траектории убитого корабля (Марс -> Земля) — исчезнет в планете назначения Земля, а его уничтожение считается уничтожением астероида!
      {
        id: `traj-debris-init-${sysId}-1`,
        kind: 'SPACE_DEBRIS',
        label:
          '🪨 МУСОР НА ТРАЕКТОРИИ [94% → ИСЧЕЗНЕТ В «ЗЕМЛЯ» | ЛКМ/ПКМ = УНИЧТОЖИТЬ КАК АСТЕРОИД!]',
        pos: {x: 0, y: 0, z: 520},
        vel: {x: 0, y: 0, z: 0},
        rot: {x: 0, y: 0, z: 0},
        rotSpeed: {x: 0, y: 0, z: 0},
        hp: 35,
        maxHp: 35,
        color: '#94a3b8',
        bounty: 0,
        trajFromPlanetIdx: 3,
        trajToPlanetIdx: 2,
        trajProgress: 0.94,
        trajDurationSec: 60,
        isFollowingKilledShipTrajectory: true,
      },
    ];
    st.debris = [];
    st.stars = [];
    setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
  }, []);

  // Вспомогательное действие: вознаграждение за уничтожение мусора (SPACE_DEBRIS) или груза (CARGO) как за уничтожение астероида!
  const rewardDestroyCargoOrDebrisAsAsteroid = useCallback(
    (destroyedEnt: SpaceEntity, weaponSource: 'LASER' | 'PLASMA' | 'GAMMA' | 'PANEL') => {
      const st = flightStateRef.current;
      playZxBeep('EXPLODE');
      for (let i = 0; i < 20; i++) {
        st.debris.push({
          pos: {...destroyedEnt.pos},
          vel: {
            x: (Math.random() - 0.5) * 24,
            y: (Math.random() - 0.5) * 24,
            z: (Math.random() - 0.5) * 24,
          },
          ttl: 25,
          color: i % 2 === 0 ? '#fde047' : '#94a3b8',
        });
      }
      st.entities = st.entities.filter((e) => e.id !== destroyedEnt.id);

      const inPlanetGroup =
        joinedPlanetGroups.includes('GO-MARS') ||
        joinedPlanetGroups.includes('GO-EARTH') ||
        joinedPlanetGroups.includes('GO-MERCURY') ||
        joinedPlanetGroups.includes('GO-VENUS');
      const baseAsteroidRewardCr =
        weaponSource === 'GAMMA'
          ? 16
          : weaponSource === 'PLASMA'
          ? inPlanetGroup
            ? 10
            : 6
          : inPlanetGroup
          ? 8
          : 4;
      const finalRewardCr = Number((baseAsteroidRewardCr / pirateSellDivisor).toFixed(1));
      const safetyAdd = weaponSource === 'PLASMA' || weaponSource === 'GAMMA' ? 6 : 4;

      setCredits((c) => Number((c + finalRewardCr).toFixed(1)));
      setClearedBouldersCount((cnt) => cnt + 1);
      setDestroyedCargoDebrisAsAsteroidCount((cnt) => cnt + 1);
      setBeltSafetyPct((prev) => Math.min(100, prev + safetyAdd));

      const targetTypeLabel =
        destroyedEnt.kind === 'SPACE_DEBRIS' ? 'КОСМИЧЕСКИЙ МУСОР' : 'ГРУЗ НА ТРАЕКТОРИИ';
      setFlightMessage(
        `💥 УНИЧТОЖЕНИЕ ${targetTypeLabel} ЗАСЧИТАНО КАК УНИЧТОЖЕНИЕ АСТЕРОИДА! ВОЗНАГРАЖДЕНИЕ: +${finalRewardCr} CR · ОЧИЩЕНО АСТЕРОИДОВ/МУСОРА: ${
          clearedBouldersCount + 1
        } · БЕЗОПАСНОСТЬ СИСТЕМЫ: ${Math.min(100, beltSafetyPct + safetyAdd)}%`
      );
    },
    [beltSafetyPct, clearedBouldersCount, joinedPlanetGroups, pirateSellDivisor, playZxBeep]
  );

  // Промотка времени цикла всех логистических модулей и грузов/мусора на траекториях (+15 сек или +60 сек = 1 минута):
  const handleAdvanceSystemTrajectoriesTime = useCallback(
    (deltaSec: number) => {
      const st = flightStateRef.current;
      const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
      let absorbedNames: string[] = [];
      st.entities = stepSystemTrajectories(
        st.entities,
        deltaSec,
        isOld,
        (itemLabel, destPlanetName) => {
          absorbedNames.push(`${itemLabel.split('[')[0].trim()} → ${destPlanetName}`);
        }
      );
      playZxBeep('DOCK');
      if (absorbedNames.length > 0) {
        setAbsorbedInPlanetCount((c) => c + absorbedNames.length);
        setFlightMessage(
          `♻️ +${deltaSec} СЕК ПО ТРАЕКТОРИЯМ: НЕПОДОБРАННЫЙ ГРУЗ/МУСОР ДОСТИГ ПЛАНЕТЫ НАЗНАЧЕНИЯ И ИСЧЕЗ (${absorbedNames.join(
            '; '
          )}), ЧТОБЫ МУСОРА В СИСТЕМЕ НЕ БЫЛО!`
        );
      } else {
        setFlightMessage(
          `⏩ +${deltaSec} СЕК ПО ЦИКЛУ ЛОГИСТИКИ ПЛАНЕТ: ВСЕ 4 СТАНДАРТНЫХ МОДУЛЯ И ГРУЗЫ СДВИНУЛИСЬ СТРОГО ПО ТРАЕКТОРИЯМ!`
        );
      }
    },
    [currentSystemId, playZxBeep]
  );

  // Наведение корабля на выбранный логистический модуль планеты или груз/мусор на траектории:
  // Перемещает КОРАБЛЬ ИГРОКА к точке маршрута, где сейчас летит выбранный модуль, не сдвигая сам модуль с его траектории!
  const handleFocusOnTrajectoryEntity = useCallback(
    (entityId: string) => {
      const st = flightStateRef.current;
      const target = st.entities.find((e) => e.id === entityId);
      if (!target) return;
      setScreenMode('FLIGHT');
      st.stationaryOrbitPlanetId = null;
      st.stationaryOrbitTurnRad = 0;
      setStationaryOrbitInfo(null);
      st.pitchRate = 0;
      st.rollRate = 0;
      st.speed = 0;
      st.targetSpeed = 0;
      setThrottleUi(0);

      // Вычисляем точное положение модуля/груза на его 3D-маршруте относительно Звезды и ставим корабль игрока в 160 ед. перед этой точкой маршрута
      st.eclipticU = {x: 1, y: 0, z: 0};
      st.eclipticV = {x: 0, y: 0.16, z: 0.987};
      st.eclipticN = {x: 0, y: 0.987, z: -0.16};

      const getPlanetOffsetFromStar = (idx: number): {vec: Vec3; r: number} => {
        const p = st.planets[idx];
        const orbitR = p ? p.orbitRadius : PLANET_ORBIT_STEP * (idx + 1);
        const orbitA = p ? p.orbitAngle : -Math.PI / 2 + (idx % 2 === 0 ? -0.11 : 0.11);
        const r3d = p ? p.radius3D : 110;
        const cA = Math.cos(orbitA);
        const sA = Math.sin(orbitA);
        return {
          vec: {
            x: orbitR * (cA * st.eclipticU.x + sA * st.eclipticV.x),
            y: orbitR * (cA * st.eclipticU.y + sA * st.eclipticV.y),
            z: orbitR * (cA * st.eclipticU.z + sA * st.eclipticV.z),
          },
          r: r3d,
        };
      };

      const homeIdx = target.homePlanetIdx ?? target.trajFromPlanetIdx ?? 0;
      const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[0];
      const targetListIdx = (target.cycleTargetListIdx ?? 0) % 3;
      const otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];

      let fromIdx = target.trajFromPlanetIdx ?? homeIdx;
      let toIdx =
        target.trajToPlanetIdx !== undefined && target.trajToPlanetIdx !== fromIdx
          ? target.trajToPlanetIdx
          : otherIdx;
      let prog = Math.max(0, Math.min(1, target.trajProgress ?? 0.35));

      if (target.isLogisticsModule) {
        if (target.logisticsPhase === 'OUTBOUND_FLIGHT') {
          fromIdx = homeIdx;
          toIdx = otherIdx;
        } else if (target.logisticsPhase === 'WAIT_OTHER_ORBIT') {
          fromIdx = homeIdx;
          toIdx = otherIdx;
          prog = 1;
        } else if (target.logisticsPhase === 'RETURN_FLIGHT') {
          fromIdx = otherIdx;
          toIdx = homeIdx;
        } else if (target.logisticsPhase === 'WAIT_HOME_ORBIT') {
          fromIdx = homeIdx;
          toIdx = homeCfg.cycleOtherPlanets[(targetListIdx + 1) % 3];
          prog = 0;
        }
      }

      const pFrom = getPlanetOffsetFromStar(fromIdx);
      const pTo = getPlanetOffsetFromStar(toIdx);
      const dx = pTo.vec.x - pFrom.vec.x;
      const dy = pTo.vec.y - pFrom.vec.y;
      const dz = pTo.vec.z - pFrom.vec.z;
      const len = Math.max(1, Math.hypot(dx, dy, dz));
      const ux = dx / len;
      const uy = dy / len;
      const uz = dz / len;

      const startX = pFrom.vec.x + ux * (pFrom.r * 1.55);
      const startY = pFrom.vec.y + uy * (pFrom.r * 1.55);
      const startZ = pFrom.vec.z + uz * (pFrom.r * 1.55);

      const endX = pTo.vec.x - ux * (pTo.r * 1.55);
      const endY = pTo.vec.y - uy * (pTo.r * 1.55);
      const endZ = pTo.vec.z - uz * (pTo.r * 1.55);

      const entOffsetFromStar: Vec3 = {
        x: startX + (endX - startX) * prog,
        y: startY + (endY - startY) * prog,
        z: startZ + (endZ - startZ) * prog,
      };

      // Размещаем корабль игрока на дистанции 165 ед. перед точкой траектории модуля
      st.starPos = {
        x: -entOffsetFromStar.x,
        y: -entOffsetFromStar.y,
        z: 165 - entOffsetFromStar.z,
      };

      playZxBeep('MISSION');
      setFlightMessage(`🎯 КОРАБЛЬ ПОДВЕДЁН К МАРШРУТУ: ${target.label}`);
    },
    [playZxBeep]
  );

  // Демонстрационное уничтожение выбранного логистического модуля:
  // его груз и мусор продолжают двигаться строго по траектории убитого корабля и исчезают в планете назначения, если их не подобрать!
  const handleDestroyModuleToTestTrajectoryCargo = useCallback(
    (moduleId: string) => {
      const st = flightStateRef.current;
      const modEnt = st.entities.find((e) => e.id === moduleId);
      if (!modEnt) return;
      const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
      // Если модуль стоял на орбите, переводим его в полёт на 35% траектории к планете назначения, чтобы наглядно показать движение груза по траектории убитого корабля
      if (
        modEnt.logisticsPhase === 'WAIT_HOME_ORBIT' ||
        modEnt.logisticsPhase === 'WAIT_OTHER_ORBIT'
      ) {
        const homeIdx = modEnt.homePlanetIdx ?? 0;
        const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[0];
        const otherIdx = homeCfg.cycleOtherPlanets[(modEnt.cycleTargetListIdx ?? 0) % 3];
        modEnt.trajFromPlanetIdx =
          modEnt.logisticsPhase === 'WAIT_HOME_ORBIT' ? homeIdx : otherIdx;
        modEnt.trajToPlanetIdx =
          modEnt.logisticsPhase === 'WAIT_HOME_ORBIT' ? otherIdx : homeIdx;
        modEnt.trajProgress = 0.35;
      }
      const toIdx = modEnt.trajToPlanetIdx ?? 0;
      const destName = (PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[0]).cleanName;
      const drops = createKilledShipTrajectoryDrops(modEnt, currentSystemId, isOld);
      st.entities = st.entities.filter((e) => e.id !== modEnt.id);
      st.entities.push(...drops);

      playZxBeep('EXPLODE');
      setEliteKills((k) => k + 1);
      setShipsDestroyedByPlayer((n) => n + 1);
      setDestroyedEnemyTonsXp((xp) => Number((xp + 50).toFixed(2)));
      setSpentSalvoDebitKg((d) => d + 51000);
      setFlightMessage(
        `💥 МОДУЛЬ УНИЧТОЖЕН (+50 Т XP)! ЕГО ГРУЗ И МУСОР ПРОДОЛЖАЮТ ДВИГАТЬСЯ СТРОГО ПО ТРАЕКТОРИИ УБИТОГО КОРАБЛЯ В ПЛАНЕТУ НАЗНАЧЕНИЯ «${destName.toUpperCase()}» (ЕСЛИ НЕ ПОДОБРАТЬ — ИСЧЕЗНУТ В ПЛАНЕТЕ НАЗНАЧЕНИЯ)!`
      );
      setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
    },
    [currentSystemId, playZxBeep]
  );

  const handleFastForwardLogisticsCycle = useCallback(
    (deltaSec: number) => {
      handleAdvanceSystemTrajectoriesTime(deltaSec);
      const st = flightStateRef.current;
      const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
      setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
    },
    [currentSystemId, handleAdvanceSystemTrajectoriesTime]
  );

  const handleFocusLogisticsEntityInSight = useCallback(
    (entityId: string) => {
      handleFocusOnTrajectoryEntity(entityId);
    },
    [handleFocusOnTrajectoryEntity]
  );

  const handleDestroyCargoOrDebrisAsAsteroid = useCallback(
    (targetId?: string) => {
      const st = flightStateRef.current;
      const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
      let target = targetId
        ? st.entities.find((e) => e.id === targetId)
        : st.entities.find((e) => e.kind === 'SPACE_DEBRIS' || e.kind === 'CARGO');
      if (!target) {
        // Если на траектории сейчас нет груза/мусора, создаём тестовый фрагмент на траектории Марс -> Земля и уничтожаем как астероид
        target = {
          id: `traj-debris-temp-${Date.now()}`,
          kind: 'SPACE_DEBRIS',
          label: '🪨 МУСОР НА ТРАЕКТОРИИ [МАРС → ЗЕМЛЯ]',
          pos: {x: 0, y: 0, z: 340},
          vel: {x: 0, y: 0, z: 0},
          rot: {x: 0, y: 0, z: 0},
          rotSpeed: {x: 0.02, y: 0.02, z: 0.02},
          hp: 35,
          maxHp: 35,
          color: '#94a3b8',
          bounty: 0,
          trajFromPlanetIdx: 3,
          trajToPlanetIdx: 2,
          trajProgress: 0.5,
          trajDurationSec: 60,
          isFollowingKilledShipTrajectory: true,
        };
        st.entities.push(target);
      }
      rewardDestroyCargoOrDebrisAsAsteroid(target, 'PANEL');
      setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
    },
    [currentSystemId, rewardDestroyCargoOrDebrisAsAsteroid]
  );

  // Быстрая навигация внутри Сферы Звёздной Системы:
  // Позволяет встать на Окраину Сферы (30 000 ед. = 5 минут до Звезды, все планеты и звезда — цветные точки с маркерами)
  // или мгновенно подлететь вплотную (на 1/2 экрана) к Звезде, любой из 4 Планет или Поясу Астероидов!
  const handleNavigateSystemView = useCallback(
    (
      mode:
        | 'SYSTEM_EDGE'
        | 'STAR_CLOSE'
        | 'PLANET_1'
        | 'PLANET_2'
        | 'PLANET_3'
        | 'PLANET_4'
        | 'ASTEROID_BELT'
    ) => {
      const st = flightStateRef.current;
      setScreenMode('FLIGHT');
      st.stationaryOrbitPlanetId = null;
      st.stationaryOrbitTurnRad = 0;
      setStationaryOrbitInfo(null);
      st.pitchRate = 0;
      st.rollRate = 0;
      st.eclipticU = {x: 1, y: 0, z: 0};
      st.eclipticV = {x: 0, y: 0.16, z: 0.987};
      st.eclipticN = {x: 0, y: 0.987, z: -0.16};

      if (mode === 'SYSTEM_EDGE') {
        // Окраина Сферы Системы (R = 30 000): все 4 планеты и звезда видны как разноцветные точки с текстовыми маркерами!
        // Полёт до Звезды на максимальной скорости (100 ед/с) занимает ровно 5 минут (300 сек), между планетами — по 1 минуте (60 сек).
        st.starPos = {x: 0, y: 90, z: SYSTEM_SPHERE_RADIUS};
        if (st.planets[0]) st.planets[0].orbitAngle = -Math.PI / 2 - 0.11;
        if (st.planets[1]) st.planets[1].orbitAngle = -Math.PI / 2 + 0.11;
        if (st.planets[2]) st.planets[2].orbitAngle = -Math.PI / 2 - 0.14;
        if (st.planets[3]) st.planets[3].orbitAngle = -Math.PI / 2 + 0.13;
        st.targetSpeed = MAX_SYSTEM_SPEED;
        st.speed = MAX_SYSTEM_SPEED;
        setThrottleUi(100);
        setFlightMessage(
          '🔭 ОКРАИНА СФЕРЫ СИСТЕМЫ (R=30 000): ЗВЕЗДА И 4 ПЛАНЕТЫ — ЦВЕТНЫЕ ТОЧКИ С МАРКЕРАМИ · 5 МИН ДО ЗВЕЗДЫ, 1 МИН МЕЖДУ ПЛАНЕТАМИ'
        );
      } else if (mode === 'STAR_CLOSE') {
        // В непосредственной близости к Центральной Звезде: жёлтый кружочек с лучиками на пол-экрана + зарядка энергией 100%!
        st.starPos = {x: 0, y: 0, z: 265};
        st.targetSpeed = 0;
        st.speed = 0;
        setThrottleUi(0);
        setFlightMessage(
          '☀ ЦЕНТР СФЕРЫ · ЗВЕЗДА ВБЛИЗИ (1/2 ЭКРАНА): ЖЁЛТЫЙ КРУЖОЧЕК С ЛУЧИКАМИ · ЗАРЯДКА ЭНЕРГИЕЙ 100% MAX!'
        );
      } else if (mode === 'ASTEROID_BELT') {
        // Внутри Пояса Астероидов (R = 27 000 от Звезды, 3 000 ед. от окраины сферы)
        st.starPos = {x: 0, y: 40, z: 27000};
        st.targetSpeed = 35;
        st.speed = 35;
        setThrottleUi(35);
        setFlightMessage(
          '🪨 ПОЯС АСТЕРОИДОВ (R=27 000): КАМЕННОЕ КОЛЬЦО ЭКЛИПТИКИ ЗА ЧЕТВЁРТОЙ ПЛАНЕТОЙ МАРС-IV'
        );
      } else {
        // Подлёт вплотную (на пол-экрана) к выбранной планете (I. Меркурий, II. Венера, III. Земля, IV. Марс)
        const pIndex =
          mode === 'PLANET_1' ? 0 : mode === 'PLANET_2' ? 1 : mode === 'PLANET_3' ? 2 : 3;
        const targetP = st.planets[pIndex] || st.planets[2];
        if (targetP) {
          targetP.spinAngle = 0;
          const cosA = Math.cos(targetP.orbitAngle);
          const sinA = Math.sin(targetP.orbitAngle);
          const offsetX = targetP.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x);
          const offsetY = targetP.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y);
          const offsetZ = targetP.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z);
          // Ставим корабль так, чтобы выбранная планета оказалась прямо перед носом на пол-экрана!
          const closeDist = Math.round(targetP.radius3D * 2.05);
          st.starPos = {
            x: -offsetX,
            y: -offsetY,
            z: closeDist - offsetZ,
          };
          st.targetSpeed = 0;
          st.speed = 0;
          setThrottleUi(0);
          setHoveredPlanetObjUi(null);
          hoveredPlanetObjRef.current = null;
          setFlightMessage(
            `🌍 ${targetP.name} ВБЛИЗИ (1/2 ЭКРАНА): НАВЕДИТЕ КУРСОР НА ГРУППУ «${targetP.cleanName.toUpperCase()}», БИЗНЕС ИЛИ 4 ЕГО ОБЪЯВЛЕНИЯ ДЛЯ ЗАПРОСА НА КОНТАКТ!`
          );
        }
      }
      playZxBeep('DOCK');
    },
    [playZxBeep]
  );

  useEffect(() => {
    spawnSystemEntities(0);
  }, [spawnSystemEntities]);

  // Таймер работы Реактора контролируемого размыкания локальных узлов (супер-энергия для тяжёлого корабля)
  useEffect(() => {
    if (!isOpen || reactorSuperEnergySec <= 0) return;
    const t = setInterval(() => {
      setReactorSuperEnergySec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen, reactorSuperEnergySec]);

  // =========================================================================
  // ОНТОЛОГИЧЕСКАЯ МЕХАНИКА №1: КОНТРОЛИРУЕМОЕ РАЗМЫКАНИЕ ЛОКАЛЬНЫХ УЗЛОВ (КРИТИЧЕСКОЕ ВЕЩЕСТВО Ω-γ)
  // • Даёт супер-энергию, на порядки превосходящую ядерную:
  //   1) Переводит корабль в режим ТЯЖЁЛОГО КРЕЙСЕРА (+35t брони) БЕЗ потери манёвренности (100% манёвр, 92% защита, гамма-экран от сверхновых).
  //   2) Заряжает ТЯЖЁЛОЕ ГАММА-ВООРУЖЕНИЕ (+5 гамма-квантовых залпов размыкания узлов без послесвечения).
  // =========================================================================
  const handleControlledNodeUnbinding = useCallback(() => {
    const omegaQty = minedElementsHold.Omega || 0;
    if (omegaQty <= 0) {
      playZxBeep('HIT');
      setFlightMessage(
        '⚠️ НЕТ КРИТИЧЕСКОГО ВЕЩЕСТВА [Ω-γ]! СОВЕРШИТЕ ПРЫЖОК В СТАРУЮ ГАЛАКТИКУ (OMEGA-RELICT / CHRONOS-VOID) ИЛИ ПЕРЕХВАТИТЕ КОНВОЙ!'
      );
      return;
    }

    playZxBeep('MISSION');
    setMinedElementsHold((prev) => ({
      ...prev,
      Omega: Math.max(0, (prev.Omega || 0) - 1),
    }));
    setArmorBallastLevel(2); // Тяжёлый корабль (+35t брони)
    setReactorSuperEnergySec((prev) => prev + 180); // +3 минуты супер-энергии контролируемого размыкания узлов
    setHeavyGammaCharges((prev) => prev + 5); // +5 залпов тяжёлого гамма-вооружения
    setHullIntegrityPct(100);
    setFuel(7.0);
    flightStateRef.current.frontShield = 100;
    flightStateRef.current.aftShield = 100;
    flightStateRef.current.energy = 100;
    flightStateRef.current.laserHeat = 0;

    setFlightMessage(
      '☢️ КОНТРОЛИРУЕМОЕ РАЗМЫКАНИЕ ЛОКАЛЬНЫХ УЗЛОВ (1т Ω-γ): СУПЕР-ЭНЕРГИЯ ≫ ЯДЕРНОЙ АКТИВИРОВАНА! ТЯЖЁЛЫЙ КОРАБЛЬ (100% МАНЁВР · 92% ЗАЩИТА) + 5 ЗАЛПОВ ТЯЖЁЛОГО ГАММА-ОРУЖИЯ (V)!'
    );
  }, [minedElementsHold.Omega, playZxBeep]);

  // =========================================================================
  // ОНТОЛОГИЧЕСКАЯ МЕХАНИКА №2: ТЯЖЁЛОЕ ВООРУЖЕНИЕ — ГАММА-КВАНТОВЫЙ РАЗМЫКАТЕЛЬ УЗЛОВ (Клавиша V / Кнопка)
  // • Контролируемый пучок гамма-квантов вызывает лавинообразное размыкание локальных узлов в цели:
  //   аналог гамма-всплеска сверхновой, но БЕЗ ПОСЛЕСВЕЧЕНИЯ!
  // • Сжигает любой тяжёлый корабль пиратов/контрабандистов с 1 выстрела (с выбросом трофейного Ω-γ)
  //   или мгновенно вскрывает и захватывает Критическое вещество (Ω-γ) в поясе старых галактик!
  // =========================================================================
  const handleFireHeavyGammaWeapon = useCallback(() => {
    if (screenMode !== 'FLIGHT') return;
    if (heavyGammaCharges <= 0) {
      playZxBeep('HIT');
      setFlightMessage(
        '⚠️ НЕТ ЗАРЯДОВ ТЯЖЁЛОГО ГАММА-ОРУЖИЯ! ВЫПОЛНИТЕ КОНТРОЛИРУЕМОЕ РАЗМЫКАНИЕ УЗЛОВ ИЗ 1т КРИТИЧЕСКОГО ВЕЩЕСТВА [Ω-γ]!'
      );
      return;
    }

    const st = flightStateRef.current;
    const aimX = st.turretActive ? st.turretX : 430;
    const aimY = st.turretActive ? st.turretY : 194;
    st.lastShotTargetX = aimX;
    st.lastShotTargetY = aimY;
    st.gammaWeaponFiringTimer = 9; // Короткий чистый гамма-импульс БЕЗ ПОСЛЕСВЕЧЕНИЯ!
    setHeavyGammaCharges((c) => Math.max(0, c - 1));
    playZxBeep('EXPLODE');

    // 1. Проверяем попадание по кораблям или грузу/мусору на траектории в секторе
    let hitEntity: SpaceEntity | null = null;
    let bestDist = Infinity;
    for (const ent of st.entities) {
      if (ent.kind === 'STATION' || ent.kind === 'SOS_POD') continue;
      if (ent.pos.z > 25 && ent.pos.z < 18000) {
        const projRatio = 380 / ent.pos.z;
        const entScreenX = 430 + ent.pos.x * projRatio;
        const entScreenY = 194 - ent.pos.y * projRatio;
        const d = Math.hypot(entScreenX - aimX, entScreenY - aimY);
        const hitR = Math.max(22, Math.min(115, (28 * 380) / ent.pos.z + 18));
        if (d <= hitR && d < bestDist) {
          bestDist = d;
          hitEntity = ent;
        }
      }
    }

    if (hitEntity) {
      // Если уничтожен космический мусор или груз на траектории — считается уничтожением астероида и вознаграждается соответственно!
      if (hitEntity.kind === 'CARGO' || hitEntity.kind === 'SPACE_DEBRIS') {
        rewardDestroyCargoOrDebrisAsAsteroid(hitEntity, 'GAMMA');
        return;
      }

      const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
      const reward = (hitEntity.bounty || 300) + 450;
      const destroyedLabel = hitEntity.label;
      const toIdx =
        hitEntity.trajToPlanetIdx !== undefined
          ? hitEntity.trajToPlanetIdx
          : ((hitEntity.homePlanetIdx ?? 0) + 1) % 4;
      const destPlanetName = (PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[0]).cleanName;

      // Масса вражеского корабля (стандарт 50 т = 50 000 кг, тяжёлый крейсер Thargoid = 80 т = 80 000 кг)
      const defaultEnemyMaxKg = hitEntity.kind === 'THARGOID' ? 80000 : 50000;
      const remainingEnemyKg = hitEntity.massKg ?? defaultEnemyMaxKg;
      const prevPlayerHitKg = hitEntity.playerHitMassKg ?? 0;
      const totalPlayerCreditedKg = prevPlayerHitKg + remainingEnemyKg;
      const gainedTonsXp = Number((totalPlayerCreditedKg / 1000).toFixed(2));
      const debitSalvoKg = remainingEnemyKg + 1000;

      // ПРИ ГИБЕЛИ КОРАБЛЯ ГРУЗ И МУСОР ПРОДОЛЖАЮТ ДВИГАТЬСЯ СТРОГО ПО ТРАЕКТОРИИ УБИТОГО КОРАБЛЯ
      // И ЕСЛИ ИХ НЕ ПОДОБРАЛИ — ИСЧЕЗАЮТ В ПЛАНЕТЕ НАЗНАЧЕНИЯ, ЧТОБЫ МУСОРА НЕ БЫЛО!
      const drops = createKilledShipTrajectoryDrops(hitEntity, currentSystemId, isOld);
      st.entities = st.entities.filter((e) => e.id !== hitEntity!.id);
      st.entities.push(...drops);

      setCredits((c) => c + reward);
      setEliteKills((k) => k + 1);
      setShipsDestroyedByPlayer((n) => n + 1);
      setSpentSalvoDebitKg((d) => d + debitSalvoKg);
      setDestroyedEnemyTonsXp((xp) => Number((xp + gainedTonsXp).toFixed(2)));
      setPendingTargetHitSummary(null);
      setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
      setFlightMessage(
        `☢️ «${destroyedLabel}» УНИЧТОЖЕН (+${gainedTonsXp} Т XP)! ГРУЗ И МУСОР ПРОДОЛЖАЮТ ДВИГАТЬСЯ СТРОГО ПО ТРАЕКТОРИИ УБИТОГО КОРАБЛЯ В ПЛАНЕТУ «${destPlanetName.toUpperCase()}» (И ИСЧЕЗНУТ В НЕЙ, ЧТОБЫ МУСОРА НЕ БЫЛО)!`
      );
      return;
    }

    // 2. Если выстрел произведён по глыбам в поясе — мгновенно вскрываем и извлекаем Критическое вещество (Ω-γ)!
    if (usedCargoTonsForPhysics < maxCargoCapacity) {
      setMinedElementsHold((prev) => ({
        ...prev,
        Omega: (prev.Omega || 0) + 1,
      }));
      setFlightMessage(
        `☢️ ГАММА-КВАНТОВЫЙ ИМПУЛЬС (БЕЗ ПОСЛЕСВЕЧЕНИЯ): ЛОКАЛЬНЫЙ УЗЕЛ АСТЕРОИДА ВСКРЫТ → ДОБЫТА +1т [Ω-γ] КРИТИЧЕСКОГО ВЕЩЕСТВА (ЦЕНА КОНТРАБАНДЫ: 16 500 CR/т)!`
      );
    } else {
      setFlightMessage(
        '☢️ ГАММА-ЗАЛП ПРОИЗВЕДЁН (БЕЗ ПОСЛЕСВЕЧЕНИЯ), НО ГРУЗОВОЙ ОТСЕК ПОЛОН! ОСВОБОДИТЕ ТРЮМ ДЛЯ ЗАХВАТА [Ω-γ]!'
      );
    }
  }, [
    currentSystemId,
    heavyGammaCharges,
    maxCargoCapacity,
    playZxBeep,
    rewardDestroyCargoOrDebrisAsAsteroid,
    screenMode,
    usedCargoTonsForPhysics,
  ]);

  // =========================================================================
  // ОНТОЛОГИЧЕСКАЯ МЕХАНИКА №3: ВЗРЫВ СВЕРХНОВОЙ (ГАММА-ВСПЛЕСК БЕЗ ПОСЛЕСВЕЧЕНИЯ В СТАРЫХ ГАЛАКТИКАХ)
  // • В старых галактиках без заселённых планет сверхновые взрываются очень часто (лавинообразное размыкание локальных узлов звезды).
  // • Можно потерять корабль (и весь груз в трюме!), если нет супер-энергии тяжёлого корабля или тяжёлой брони,
  //   но риск оправдан высокой ценой Критического вещества (Ω-γ) и всплеском его выброса!
  // =========================================================================
  const handleTriggerSupernovaGammaBurst = useCallback(() => {
    const st = flightStateRef.current;
    st.supernovaBurstTimer = 14; // Мгновенная гамма-вспышка сверхновой БЕЗ ПОСЛЕСВЕЧЕНИЯ!
    playZxBeep('EXPLODE');

    // Взрыв сверхновой выбрасывает в космос новые сгустки Критического вещества (Ω-γ)
    for (let i = 0; i < Math.min(18, st.asteroids.length); i++) {
      st.asteroids[i].isValuable = true;
      st.asteroids[i].revealed = true;
      st.asteroids[i].elementSymbol = 'Omega';
      st.asteroids[i].color = '#e879f9';
    }

    if (reactorSuperEnergySec > 0) {
      setSupernovaSurvivedCount((c) => c + 1);
      if (usedCargoTonsForPhysics < maxCargoCapacity) {
        setMinedElementsHold((prev) => ({
          ...prev,
          Omega: (prev.Omega || 0) + 1,
        }));
      }
      setFlightMessage(
        '💥 ВСПЫШКА СВЕРХНОВОЙ (ГАММА-ВСПЛЕСК БЕЗ ПОСЛЕСВЕЧЕНИЯ)! СУПЕР-ЭНЕРГИЯ ТЯЖЁЛОГО КОРАБЛЯ ПОГЛОТИЛА УДАР И СИНТЕЗИРОВАЛА +1т [Ω-γ] КРИТИЧЕСКОГО ВЕЩЕСТВА!'
      );
      return;
    }

    // Если реактор контролируемого размыкания узлов НЕ включён — корабль получает тяжёлый гамма-удар!
    const hullDamage = armorBallastLevel === 2 ? 22 : 45;
    st.frontShield = 0;
    st.aftShield = 0;

    setHullIntegrityPct((prevHull) => {
      const nextHull = prevHull - hullDamage;
      if (nextHull <= 0) {
        // ПОТЕРЯ КОРАБЛЯ В СТАРОЙ ГАЛАКТИКЕ ОТ СВЕРХНОВОЙ:
        // Капсула эвакуирует пилота в безопасную систему LAVE (ID=0), но весь груз в отсеке сгорает!
        setCurrentSystemId(0);
        spawnSystemEntities(0);
        setMinedElementsHold({
          H2O: 0,
          Cu: 0,
          Ni: 0,
          Co: 0,
          Li: 0,
          Ag: 0,
          Pt: 0,
          Au: 0,
          Omega: 0,
        });
        setCargoHold({});
        setFlightMessage(
          '💀 КОРАБЛЬ ПОТЕРЯН ВО ВЗРЫВЕ СВЕРХНОВОЙ (ГАММА-ВСПЛЕСК БЕЗ ПОСЛЕСВЕЧЕНИЯ)! СПАСАТЕЛЬНАЯ КАПСУЛА ДОСТАВИЛА ВАС В LAVE, НО ВЕСЬ ГРУЗ УТРАЧЕН! ВКЛЮЧАЙТЕ СУПЕР-ЭНЕРГИЮ ТЯЖЁЛОГО КОРАБЛЯ!'
        );
        return 100;
      }
      setSupernovaSurvivedCount((c) => c + 1);
      setFlightMessage(
        `⚠️ ВЗРЫВ СВЕРХНОВОЙ (ГАММА-ВСПЛЕСК БЕЗ ПОСЛЕСВЕЧЕНИЯ): ЩИТЫ СОРВАНЫ, КОРПУС -${hullDamage}% (ОСТАЛОСЬ ${nextHull}%)! ВЫБРОШЕНО КРИТИЧЕСКОЕ ВЕЩЕСТВО [Ω-γ] — ЗАХВАТИТЕ (СКМ/C) ИЛИ ВКЛЮЧИТЕ СУПЕР-ЭНЕРГИЮ!`
      );
      return nextHull;
    });
  }, [armorBallastLevel, maxCargoCapacity, playZxBeep, reactorSuperEnergySec, spawnSystemEntities, usedCargoTonsForPhysics]);

  // =========================================================================
  // ОНТОЛОГИЧЕСКАЯ МЕХАНИКА №4: ЭКОНОМИКА КОНТРАБАНДЫ, ПИРАТСТВА И ТОРГОВЛИ КРИТИЧЕСКИМ ВЕЩЕСТВОМ (Ω-γ)
  // • Сбыт контрабандой через Синдикат Тёмных Секторов приносит 16 500 CR/т (против 5 000 CR гос. закупки),
  //   но без супер-энергии тяжёлого корабля возможен штраф/перехват таможенным крейсером.
  // =========================================================================
  const handleSmuggleCriticalMatter = useCallback(() => {
    const omegaQty = minedElementsHold.Omega || 0;
    if (omegaQty <= 0) {
      playZxBeep('HIT');
      setFlightMessage(
        '⚠️ ДЛЯ КОНТРАБАНДЫ НЕТ КРИТИЧЕСКОГО ВЕЩЕСТВА [Ω-γ] В ТРЮМЕ! ДОБУДЬТЕ ЕГО В СТАРЫХ ГАЛАКТИКАХ ИЛИ ОТБЕЙТЕ У ПИРАТОВ!'
      );
      return;
    }

    const contrabandPriceCr = 16500;
    playZxBeep('MISSION');
    setMinedElementsHold((prev) => ({
      ...prev,
      Omega: Math.max(0, (prev.Omega || 0) - 1),
    }));
    setCredits((c) => c + contrabandPriceCr);
    setSmuggledTonsCount((cnt) => cnt + 1);
    setSmugglingProfitCr((p) => p + contrabandPriceCr);
    onEarnKarmaAndBonus?.(
      2,
      contrabandPriceCr,
      'Контрабанда Критического вещества (Ω-γ) для тяжёлых кораблей и гамма-вооружения'
    );
    setFlightMessage(
      `🕶️ КОНТРАБАНДА КРИТИЧЕСКОГО ВЕЩЕСТВА [Ω-γ] УСПЕШНА: ПРОДАНА 1т НА ЧЁРНОМ РЫНКЕ ТЯЖЁЛОГО ФЛОТА ЗА +${contrabandPriceCr} CR (В 3.3 РАЗА ВЫШЕ ГОС. ЗАКУПКИ)!`
    );
  }, [minedElementsHold.Omega, onEarnKarmaAndBonus, playZxBeep]);

  // Вызов в прицел на строгой межпланетной траектории: Логистический модуль / Конвой + Груз/Мусор на траектории
  const handleSpawnCriticalConvoyAmbush = useCallback(() => {
    const st = flightStateRef.current;
    setScreenMode('FLIGHT');
    playZxBeep('HIT');
    const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
    const lootSym: AsteroidElementSymbol = isOld ? 'Omega' : 'Ti';
    const afterBattleSym: AsteroidElementSymbol = isOld ? 'Omega' : 'Fe';
    const newConvoyId = `foreign-convoy-${Date.now()}`;
    st.entities.push(
      {
        id: newConvoyId,
        kind: 'TRADER',
        label: `МОДУЛЬ НА ТРАЕКТОРИИ «МАРС #4 → ЗЕМЛЯ #3» [ГРУЗ: 1т ${ASTEROID_PERIODIC_ELEMENTS[lootSym].displaySymbol}]`,
        pos: {x: 0, y: 0, z: 360},
        vel: {x: 0, y: 0, z: 0},
        rot: {x: 0, y: 0, z: 0},
        rotSpeed: {x: 0, y: 0, z: 0},
        hp: 55,
        maxHp: 55,
        color: '#38bdf8',
        bounty: 350,
        lootElement: lootSym,
        massKg: 50000,
        maxMassKg: 50000,
        playerHitMassKg: 0,
        teamHitMassKg: 0,
        playerShotsHitCount: 0,
        trajFromPlanetIdx: 3, // Марс (#4)
        trajToPlanetIdx: 2, // Земля (#3)
        trajProgress: 0.94,
        trajDurationSec: 60,
      },
      {
        id: `after-battle-item-${Date.now() + 1}`,
        kind: 'CARGO',
        label: `📦 ГРУЗ НА ТРАЕКТОРИИ «МАРС #4 → ЗЕМЛЯ #3» [1т ${ASTEROID_PERIODIC_ELEMENTS[afterBattleSym].displaySymbol} · ИСЧЕЗНЕТ В ЗЕМЛЕ]`,
        pos: {x: 0, y: 0, z: 330},
        vel: {x: 0, y: 0, z: 0},
        rot: {x: 0, y: 0, z: 0},
        rotSpeed: {x: 0, y: 0, z: 0},
        hp: 80,
        maxHp: 80,
        color: '#f59e0b',
        bounty: 0,
        lootOrigin: 'AFTER_BATTLE',
        lootElement: afterBattleSym,
        trajFromPlanetIdx: 3, // Марс (#4)
        trajToPlanetIdx: 2, // Земля (#3)
        trajProgress: 0.955,
        trajDurationSec: 60,
        isFollowingKilledShipTrajectory: true,
      }
    );
    handleFocusOnTrajectoryEntity(newConvoyId);
    setFlightMessage(
      '🎯 СТРОГИЕ ТРАЕКТОРИИ: 1) МОДУЛЬ «МАРС → ЗЕМЛЯ» (СТРОГО НА МАРШРУТЕ, С МАСШТАБИРОВАНИЕМ ОТ ДИСТАНЦИИ) · 2) ГРУЗ НА ТРАЕКТОРИИ (СКМ=МАРОДЁР / ЛКМ=АСТЕРОИД)!'
    );
  }, [currentSystemId, handleFocusOnTrajectoryEntity, playZxBeep]);

  // ОРУЖИЕ №1 (Левая кнопка мыши ЛКМ / F): Импульсный Лазер Огневой Башни (стреляет в указатель мыши!)
  const handleFireLaser = useCallback(() => {
    if (screenMode !== 'FLIGHT') return;
    const st = flightStateRef.current;
    if (st.laserHeat >= 95) {
      setFlightMessage('WARNING · ПЕРЕГРЕВ ЛАЗЕРА ОГНЕВОЙ БАШНИ (LASER OVERHEAT)!');
      return;
    }

    const aimX = st.turretActive ? st.turretX : 430;
    const aimY = st.turretActive ? st.turretY : 194;
    st.lastShotTargetX = aimX;
    st.lastShotTargetY = aimY;

    st.laserHeat = Math.min(100, st.laserHeat + (hasMilitaryLaser ? 10 : 16));
    st.laserFiringTimer = 7;
    playZxBeep('LASER');

    // Проверяем попадание по 3D-объектам в точке ПРИЦЕЛА ОГНЕВОЙ БАШНИ (включая ГРУЗ / МУСОР на траектории!)
    const damage = hasMilitaryLaser ? 42 : 26;
    let hitEntity: SpaceEntity | null = null;
    let bestDist = Infinity;

    for (const ent of st.entities) {
      if (ent.kind === 'STATION' || ent.kind === 'SOS_POD') continue;
      if (ent.pos.z > 25 && ent.pos.z < 18000) {
        const projRatio = 380 / ent.pos.z;
        const entScreenX = 430 + ent.pos.x * projRatio;
        const entScreenY = 194 - ent.pos.y * projRatio;
        const hitRadius = Math.max(18, Math.min(68, (24 * 380) / ent.pos.z + 14));
        const dist = Math.hypot(entScreenX - aimX, entScreenY - aimY);
        if (dist <= hitRadius && dist < bestDist) {
          bestDist = dist;
          hitEntity = ent;
        }
      }
    }

    if (hitEntity) {
      // =========================================================================
      // УНИЧТОЖЕНИЕ МУСОРА ИЛИ ГРУЗА НА ТРАЕКТОРИИ СЧИТАЕТСЯ УНИЧТОЖЕНИЕМ АСТЕРОИДА
      // И ВОЗНАГРАЖДАЕТСЯ СООТВЕТСТВЕННО!
      // =========================================================================
      if (hitEntity.kind === 'CARGO' || hitEntity.kind === 'SPACE_DEBRIS') {
        rewardDestroyCargoOrDebrisAsAsteroid(hitEntity, 'LASER');
        return;
      }

      // =========================================================================
      // ПРОСТОЙ ДЕБЕТ / КРЕДИТ И КОМАНДНЫЙ УЧЁТ ПОПАДАНИЙ В 3D-БОЮ (ЛАЗЕР):
      // =========================================================================
      const activeCombo = WEAPON_COMBINATION_PRESETS[weaponComboMode];
      const defaultMaxMassKg = hitEntity.kind === 'THARGOID' ? 80000 : 50000;
      if (hitEntity.maxMassKg === undefined) hitEntity.maxMassKg = defaultMaxMassKg;
      if (hitEntity.massKg === undefined) hitEntity.massKg = defaultMaxMassKg;
      if (hitEntity.playerHitMassKg === undefined) hitEntity.playerHitMassKg = 0;
      if (hitEntity.teamHitMassKg === undefined) hitEntity.teamHitMassKg = 0;
      if (hitEntity.playerShotsHitCount === undefined) hitEntity.playerShotsHitCount = 0;

      const prevMassKg = hitEntity.massKg;
      const damageFraction = Math.min(1, damage / Math.max(1, hitEntity.maxHp));
      const rawSalvoImpactKg = Math.round(hitEntity.maxMassKg * damageFraction);
      hitEntity.hp -= damage;
      const isDestroyedNow = hitEntity.hp <= 0 || prevMassKg - rawSalvoImpactKg <= 0;
      const totalRemovedMassKg = isDestroyedNow ? prevMassKg : Math.min(prevMassKg, rawSalvoImpactKg);

      const playerAddedKg = isTeamCombatMode
        ? Math.round(totalRemovedMassKg * 0.6)
        : totalRemovedMassKg;
      const teamAddedKg = totalRemovedMassKg - playerAddedKg;
      const addedPlayerShots = Math.max(
        1,
        Math.round(playerAddedKg / activeCombo.totalDestroyedKgPerAction)
      );
      const debitSalvoSpentKg = Math.round(playerAddedKg * 1.02);

      hitEntity.playerHitMassKg += playerAddedKg;
      hitEntity.teamHitMassKg += teamAddedKg;
      hitEntity.playerShotsHitCount += addedPlayerShots;
      hitEntity.massKg = Math.max(0, prevMassKg - totalRemovedMassKg);

      setRemainingAmmoCapacityKg((ammo) => Math.max(0, ammo - debitSalvoSpentKg));
      setSpentSalvoDebitKg((d) => d + debitSalvoSpentKg);

      playZxBeep('HIT');

      if (!isDestroyedNow) {
        setPendingTargetHitSummary({
          targetLabel: hitEntity.label,
          playerTons: Number((hitEntity.playerHitMassKg / 1000).toFixed(2)),
          teamTons: Number((hitEntity.teamHitMassKg / 1000).toFixed(2)),
          remainingTons: Number((hitEntity.massKg / 1000).toFixed(2)),
          maxTons: Number((hitEntity.maxMassKg / 1000).toFixed(0)),
          playerShots: hitEntity.playerShotsHitCount,
        });
        setFlightMessage(
          isTeamCombatMode
            ? `🤝 КОМАНДНЫЙ БОЙ (ЛАЗЕР): ТВОИ ПОПАДАНИЯ ${(hitEntity.playerHitMassKg / 1000).toFixed(
                2
              )} Т (${hitEntity.playerShotsHitCount} ВЫСТР.) · КОМАНДА ${(
                hitEntity.teamHitMassKg / 1000
              ).toFixed(2)} Т · ОСТАТОК ВРАГА ${(hitEntity.massKg / 1000).toFixed(
                2
              )} Т (ПОКА НЕ УНИЧТОЖЕН — 0 Т В ЗАЧЁТ!)`
            : `⚡ ПОПАДАНИЕ ЛАЗЕРА: ДЕБЕТ ЗАЛПА -${(debitSalvoSpentKg / 1000).toFixed(
                2
              )} Т · ТВОИ ПОПАДАНИЯ ${(hitEntity.playerHitMassKg / 1000).toFixed(
                2
              )} Т · ОСТАТОК ВРАГА ${(hitEntity.massKg / 1000).toFixed(
                2
              )} / ${(hitEntity.maxMassKg / 1000).toFixed(
                0
              )} Т (НЕ УНИЧТОЖЕН — ОЧКИ НЕ ЗАСЧИТЫВАЮТСЯ!)`
        );
      }

      for (let i = 0; i < 6; i++) {
        st.debris.push({
          pos: {...hitEntity.pos},
          vel: {
            x: (Math.random() - 0.5) * 16,
            y: (Math.random() - 0.5) * 16,
            z: (Math.random() - 0.5) * 16,
          },
          ttl: 18,
          color: hitEntity.color,
        });
      }

      if (hitEntity.hp <= 0) {
        playZxBeep('EXPLODE');
        for (let i = 0; i < 22; i++) {
          st.debris.push({
            pos: {...hitEntity.pos},
            vel: {
              x: (Math.random() - 0.5) * 26,
              y: (Math.random() - 0.5) * 26,
              z: (Math.random() - 0.5) * 26,
            },
            ttl: 34,
            color: i % 2 === 0 ? '#ffff00' : hitEntity.color,
          });
        }

        const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
        const reward = hitEntity.bounty || 100;
        const toIdx =
          hitEntity.trajToPlanetIdx !== undefined
            ? hitEntity.trajToPlanetIdx
            : ((hitEntity.homePlanetIdx ?? 0) + 1) % 4;
        const destPlanetName = (PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[0]).cleanName;

        // ПРИ ГИБЕЛИ КОРАБЛЯ ЕГО ГРУЗ И МУСОР ПРОДОЛЖАЮТ ДВИГАТЬСЯ СТРОГО ПО ТРАЕКТОРИИ УБИТОГО КОРАБЛЯ
        // И ЕСЛИ ИХ НЕ ПОДОБРАЛИ — ИСЧЕЗАЮТ В ПЛАНЕТЕ НАЗНАЧЕНИЯ, ЧТОБЫ МУСОРА НЕ БЫЛО!
        const drops = createKilledShipTrajectoryDrops(hitEntity, currentSystemId, isOld);
        st.entities = st.entities.filter((e) => e.id !== hitEntity!.id);
        st.entities.push(...drops);

        const creditedPlayerTonsXp = Number(((hitEntity.playerHitMassKg || 50000) / 1000).toFixed(2));
        const teamDestroyedTons = Number(((hitEntity.teamHitMassKg || 0) / 1000).toFixed(2));
        const totalDebitOnTargetTons = Number(
          (((hitEntity.playerHitMassKg || 50000) * 1.02) / 1000).toFixed(2)
        );

        setCredits((c) => c + reward);
        setEliteKills((k) => k + 1);
        setShipsDestroyedByPlayer((n) => n + 1);
        setDestroyedEnemyTonsXp((xp) => Number((xp + creditedPlayerTonsXp).toFixed(2)));
        setPendingTargetHitSummary(null);
        setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
        setFlightMessage(
          isTeamCombatMode && teamDestroyedTons > 0
            ? `💥 ВРАГ (${((hitEntity.maxMassKg || 50000) / 1000).toFixed(
                0
              )} Т) УНИЧТОЖЕН КОМАНДОЙ! ТВОИ ПОПАДАНИЯ = +${creditedPlayerTonsXp} Т XP! ГРУЗ ДВИЖЕТСЯ ПО ТРАЕКТОРИИ В «${destPlanetName.toUpperCase()}»!`
            : `💥 ПОТРАЧЕНО ${totalDebitOnTargetTons} Т ЗАЛПА → УНИЧТОЖЕН (+${creditedPlayerTonsXp} Т XP)! ГРУЗ ПРОДОЛЖАЕТ ПУТЬ ПО ТРАЕКТОРИИ В «${destPlanetName.toUpperCase()}» (И ИСЧЕЗНЕТ В НЕЙ, ЕСЛИ НЕ ПОДОБРАТЬ)!`
        );

        setMissions((prev) =>
          prev.map((m) => {
            if (m.status !== 'ACTIVE') return m;
            if (m.type === 'BOUNTY' || m.type === 'SOS') {
              const nextKills = m.killsDone + 1;
              if (nextKills >= m.killsRequired) {
                playZxBeep('MISSION');
                setCredits((c) => c + m.rewardCredits);
                setEarnedGoBellKarma((k) => k + m.rewardKarma);
                onEarnKarmaAndBonus?.(m.rewardKarma, m.rewardCredits, m.title);
                setFlightMessage(
                  `★ МИССИЯ GOBELL ВЫПОЛНЕНА: ${m.title} (+${m.rewardCredits} CR, +${m.rewardKarma} КАРМА) ★`
                );
                return {...m, killsDone: nextKills, status: 'COMPLETED'};
              }
              return {...m, killsDone: nextKills};
            }
            return m;
          })
        );
      }
      return;
    }

    // Проверяем попадание по булыжникам в ПОЯСЕ АСТЕРОИДОВ
    let hitAsteroidIdx = -1;
    let bestAstDist = Infinity;
    let hitAstPos: Vec3 = {x: 0, y: 0, z: 300};
    for (let i = 0; i < st.asteroids.length; i++) {
      const ast = st.asteroids[i];
      const cosA = Math.cos(ast.orbitAngle);
      const sinA = Math.sin(ast.orbitAngle);
      const ax =
        st.starPos.x +
        ast.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x) +
        ast.yOffset * st.eclipticN.x;
      const ay =
        st.starPos.y +
        ast.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y) +
        ast.yOffset * st.eclipticN.y;
      const az =
        st.starPos.z +
        ast.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z) +
        ast.yOffset * st.eclipticN.z;
      if (az > 30 && az < 9000) {
        const asx = 430 + (ax * 380) / az;
        const asy = 194 - (ay * 380) / az;
        const astScreenR = Math.max(14, Math.min(42, (ast.size3D * 380) / az + 12));
        const d = Math.hypot(asx - aimX, asy - aimY);
        if (d <= astScreenR && d < bestAstDist) {
          bestAstDist = d;
          hitAsteroidIdx = i;
          hitAstPos = {x: ax, y: ay, z: Math.min(600, Math.max(120, az))};
        }
      }
    }

    if (hitAsteroidIdx !== -1) {
      const hitAst = st.asteroids[hitAsteroidIdx];

      if (!hitAst.isValuable) {
        playZxBeep('EXPLODE');
        for (let i = 0; i < 20; i++) {
          st.debris.push({
            pos: {...hitAstPos},
            vel: {
              x: (Math.random() - 0.5) * 24,
              y: (Math.random() - 0.5) * 24,
              z: (Math.random() - 0.5) * 24,
            },
            ttl: 26,
            color: i % 2 === 0 ? '#fde047' : '#94a3b8',
          });
        }
        st.asteroids.splice(hitAsteroidIdx, 1);

        const bountyCr =
          joinedPlanetGroups.includes('GO-MARS') || joinedPlanetGroups.includes('GO-EARTH') ? 8 : 4;
        setCredits((c) => c + bountyCr);
        setClearedBouldersCount((cnt) => cnt + 1);
        setBeltSafetyPct((prev) => Math.min(100, prev + 4));
        setFlightMessage(
          `💥 ОГНЕВОЙ КОНТАКТ: ПРОСТОЙ БУЛЫЖНИК ИСЧЕЗ БЕССЛЕДНО СО ВЗРЫВОМ! БЕЗОПАСНОСТЬ ПОЯСА: ${Math.min(
            100,
            beltSafetyPct + 4
          )}% (+${bountyCr} CR ЗА ОЧИСТКУ)`
        );
      } else {
        const elSym = hitAst.elementSymbol || 'Fe';
        const elMeta = ASTEROID_PERIODIC_ELEMENTS[elSym];
        playZxBeep('MISSION');
        for (let i = 0; i < 10; i++) {
          st.debris.push({
            pos: {...hitAstPos},
            vel: {
              x: (Math.random() - 0.5) * 14,
              y: (Math.random() - 0.5) * 14,
              z: (Math.random() - 0.5) * 14,
            },
            ttl: 18,
            color: elMeta.color,
          });
        }
        hitAst.revealed = true;
        hitAst.color = elMeta.color;
        setFlightMessage(
          `🔬 ОГНЕВОЙ КОНТАКТ: ЦЕННЫЙ БУЛЫЖНИК ПОМЕЧЕН КАК «[${elMeta.displaySymbol}] ${elMeta.nameRu}» (Цена рынка Земли: ${elMeta.sellPriceCr} CR/т)! НАЖМИТЕ КОЛЁСИКО МЫШИ (СКМ / C) ДЛЯ ЗАХВАТА В ГРУЗОВОЙ ОТСЕК!`
        );
      }
    }
  }, [beltSafetyPct, currentSystemId, hasMilitaryLaser, isTeamCombatMode, joinedPlanetGroups, onEarnKarmaAndBonus, playZxBeep, rewardDestroyCargoOrDebrisAsAsteroid, screenMode, weaponComboMode]);

  // ОРУЖИЕ №2 (Правая кнопка мыши ПКМ / R): Тяжёлый Плазменный Залп Огневой Башни в точку прицела мыши
  const handleFireSecondaryWeapon = useCallback(() => {
    if (screenMode !== 'FLIGHT') return;
    const st = flightStateRef.current;
    if (st.energy < 18) {
      setFlightMessage('WARNING · НЕДОСТАТОЧНО ЭНЕРГИИ ДЛЯ ОРУЖИЯ №2 (ПЛАЗМА БАШНИ)!');
      return;
    }

    const aimX = st.turretActive ? st.turretX : 430;
    const aimY = st.turretActive ? st.turretY : 194;
    st.lastShotTargetX = aimX;
    st.lastShotTargetY = aimY;

    st.energy = Math.max(0, st.energy - 18);
    st.plasmaFiringTimer = 11;
    playZxBeep('HIT');

    const heavyDamage = 65;
    let hitEntity: SpaceEntity | null = null;
    let bestDist = Infinity;

    for (const ent of st.entities) {
      if (ent.kind === 'STATION' || ent.kind === 'SOS_POD') continue;
      if (ent.pos.z > 25 && ent.pos.z < 18000) {
        const projRatio = 380 / ent.pos.z;
        const entScreenX = 430 + ent.pos.x * projRatio;
        const entScreenY = 194 - ent.pos.y * projRatio;
        const dist = Math.hypot(entScreenX - aimX, entScreenY - aimY);
        const hitRadius = Math.max(22, Math.min(86, (28 * 380) / ent.pos.z + 16));
        if (dist <= hitRadius && dist < bestDist) {
          bestDist = dist;
          hitEntity = ent;
        }
      }
    }

    if (hitEntity) {
      // =========================================================================
      // УНИЧТОЖЕНИЕ МУСОРА ИЛИ ГРУЗА НА ТРАЕКТОРИИ СЧИТАЕТСЯ УНИЧТОЖЕНИЕМ АСТЕРОИДА
      // И ВОЗНАГРАЖДАЕТСЯ СООТВЕТСТВЕННО!
      // =========================================================================
      if (hitEntity.kind === 'CARGO' || hitEntity.kind === 'SPACE_DEBRIS') {
        rewardDestroyCargoOrDebrisAsAsteroid(hitEntity, 'PLASMA');
        return;
      }

      // ПРОСТОЙ ДЕБЕТ / КРЕДИТ И КОМАНДНЫЙ УЧЁТ ПОПАДАНИЙ В 3D-БОЮ (ПЛАЗМА):
      const activeCombo = WEAPON_COMBINATION_PRESETS[weaponComboMode];
      const defaultMaxMassKg = hitEntity.kind === 'THARGOID' ? 80000 : 50000;
      if (hitEntity.maxMassKg === undefined) hitEntity.maxMassKg = defaultMaxMassKg;
      if (hitEntity.massKg === undefined) hitEntity.massKg = defaultMaxMassKg;
      if (hitEntity.playerHitMassKg === undefined) hitEntity.playerHitMassKg = 0;
      if (hitEntity.teamHitMassKg === undefined) hitEntity.teamHitMassKg = 0;
      if (hitEntity.playerShotsHitCount === undefined) hitEntity.playerShotsHitCount = 0;

      const prevMassKg = hitEntity.massKg;
      const damageFraction = Math.min(1, heavyDamage / Math.max(1, hitEntity.maxHp));
      const rawSalvoImpactKg = Math.round(hitEntity.maxMassKg * damageFraction);
      hitEntity.hp -= heavyDamage;
      const isDestroyedNow = hitEntity.hp <= 0 || prevMassKg - rawSalvoImpactKg <= 0;
      const totalRemovedMassKg = isDestroyedNow ? prevMassKg : Math.min(prevMassKg, rawSalvoImpactKg);

      const playerAddedKg = isTeamCombatMode
        ? Math.round(totalRemovedMassKg * 0.6)
        : totalRemovedMassKg;
      const teamAddedKg = totalRemovedMassKg - playerAddedKg;
      const addedPlayerShots = Math.max(
        1,
        Math.round(playerAddedKg / activeCombo.totalDestroyedKgPerAction)
      );
      const debitSalvoSpentKg = Math.round(playerAddedKg * 1.02);

      hitEntity.playerHitMassKg += playerAddedKg;
      hitEntity.teamHitMassKg += teamAddedKg;
      hitEntity.playerShotsHitCount += addedPlayerShots;
      hitEntity.massKg = Math.max(0, prevMassKg - totalRemovedMassKg);

      setRemainingAmmoCapacityKg((ammo) => Math.max(0, ammo - debitSalvoSpentKg));
      setSpentSalvoDebitKg((d) => d + debitSalvoSpentKg);

      playZxBeep('EXPLODE');
      if (!isDestroyedNow) {
        setPendingTargetHitSummary({
          targetLabel: hitEntity.label,
          playerTons: Number((hitEntity.playerHitMassKg / 1000).toFixed(2)),
          teamTons: Number((hitEntity.teamHitMassKg / 1000).toFixed(2)),
          remainingTons: Number((hitEntity.massKg / 1000).toFixed(2)),
          maxTons: Number((hitEntity.maxMassKg / 1000).toFixed(0)),
          playerShots: hitEntity.playerShotsHitCount,
        });
        setFlightMessage(
          isTeamCombatMode
            ? `🤝 КОМАНДНЫЙ БОЙ (ПЛАЗМА): ТВОИ ПОПАДАНИЯ ${(hitEntity.playerHitMassKg / 1000).toFixed(
                2
              )} Т (${hitEntity.playerShotsHitCount} ВЫСТР.) · КОМАНДА ${(
                hitEntity.teamHitMassKg / 1000
              ).toFixed(2)} Т · ОСТАТОК ВРАГА ${(hitEntity.massKg / 1000).toFixed(
                2
              )} Т (ПОКА НЕ УНИЧТОЖЕН — 0 Т В ЗАЧЁТ!)`
            : `🔥 ПОПАДАНИЕ ПЛАЗМЫ: ДЕБЕТ ЗАЛПА -${(debitSalvoSpentKg / 1000).toFixed(
                2
              )} Т · ТВОИ ПОПАДАНИЯ ${(hitEntity.playerHitMassKg / 1000).toFixed(
                2
              )} Т · ОСТАТОК ВРАГА ${(hitEntity.massKg / 1000).toFixed(
                2
              )} / ${(hitEntity.maxMassKg / 1000).toFixed(
                0
              )} Т (НЕ УНИЧТОЖЕН — ОЧКИ НЕ ЗАСЧИТЫВАЮТСЯ!)`
        );
      }

      for (let i = 0; i < 12; i++) {
        st.debris.push({
          pos: {...hitEntity.pos},
          vel: {
            x: (Math.random() - 0.5) * 22,
            y: (Math.random() - 0.5) * 22,
            z: (Math.random() - 0.5) * 22,
          },
          ttl: 24,
          color: '#ffff00',
        });
      }

      if (hitEntity.hp <= 0) {
        const isOld = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
        const reward = hitEntity.bounty || 120;
        const toIdx =
          hitEntity.trajToPlanetIdx !== undefined
            ? hitEntity.trajToPlanetIdx
            : ((hitEntity.homePlanetIdx ?? 0) + 1) % 4;
        const destPlanetName = (PLANET_LOGISTICS_CONFIG[toIdx] || PLANET_LOGISTICS_CONFIG[0]).cleanName;

        const drops = createKilledShipTrajectoryDrops(hitEntity, currentSystemId, isOld);
        st.entities = st.entities.filter((e) => e.id !== hitEntity!.id);
        st.entities.push(...drops);

        const creditedPlayerTonsXp = Number(((hitEntity.playerHitMassKg || 50000) / 1000).toFixed(2));
        const teamDestroyedTons = Number(((hitEntity.teamHitMassKg || 0) / 1000).toFixed(2));
        const totalDebitOnTargetTons = Number(
          (((hitEntity.playerHitMassKg || 50000) * 1.02) / 1000).toFixed(2)
        );

        setCredits((c) => c + reward);
        setEliteKills((k) => k + 1);
        setShipsDestroyedByPlayer((n) => n + 1);
        setDestroyedEnemyTonsXp((xp) => Number((xp + creditedPlayerTonsXp).toFixed(2)));
        setPendingTargetHitSummary(null);
        setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOld));
        setFlightMessage(
          isTeamCombatMode && teamDestroyedTons > 0
            ? `💥 ВРАГ (${((hitEntity.maxMassKg || 50000) / 1000).toFixed(
                0
              )} Т) УНИЧТОЖЕН КОМАНДОЙ! ТВОИ ПОПАДАНИЯ = +${creditedPlayerTonsXp} Т XP! ГРУЗ ДВИЖЕТСЯ ПО ТРАЕКТОРИИ В «${destPlanetName.toUpperCase()}»!`
            : `💥 ПОТРАЧЕНО ${totalDebitOnTargetTons} Т ЗАЛПА → УНИЧТОЖЕН (+${creditedPlayerTonsXp} Т XP)! ГРУЗ ПРОДОЛЖАЕТ ПУТЬ ПО ТРАЕКТОРИИ В «${destPlanetName.toUpperCase()}» (И ИСЧЕЗНЕТ В НЕЙ, ЕСЛИ НЕ ПОДОБРАТЬ)!`
        );
      }
      return;
    }

    // Плазменный залп по булыжникам в ПОЯСЕ АСТЕРОИДОВ (расчистка коридора + добыча Редких элементов)
    let hitAsteroidIdx = -1;
    let bestAstDist = Infinity;
    let hitAstPos: Vec3 = {x: 0, y: 0, z: 300};
    for (let i = 0; i < st.asteroids.length; i++) {
      const ast = st.asteroids[i];
      const cosA = Math.cos(ast.orbitAngle);
      const sinA = Math.sin(ast.orbitAngle);
      const ax =
        st.starPos.x +
        ast.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x) +
        ast.yOffset * st.eclipticN.x;
      const ay =
        st.starPos.y +
        ast.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y) +
        ast.yOffset * st.eclipticN.y;
      const az =
        st.starPos.z +
        ast.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z) +
        ast.yOffset * st.eclipticN.z;
      if (az > 30 && az < 9000) {
        const asx = 430 + (ax * 380) / az;
        const asy = 194 - (ay * 380) / az;
        const astScreenR = Math.max(18, Math.min(48, (ast.size3D * 380) / az + 16));
        const d = Math.hypot(asx - aimX, asy - aimY);
        if (d <= astScreenR && d < bestAstDist) {
          bestAstDist = d;
          hitAsteroidIdx = i;
          hitAstPos = {x: ax, y: ay, z: Math.min(600, Math.max(120, az))};
        }
      }
    }

    if (hitAsteroidIdx !== -1) {
      const hitAst = st.asteroids[hitAsteroidIdx];
      if (!hitAst.isValuable) {
        playZxBeep('EXPLODE');
        for (let i = 0; i < 22; i++) {
          st.debris.push({
            pos: {...hitAstPos},
            vel: {
              x: (Math.random() - 0.5) * 26,
              y: (Math.random() - 0.5) * 26,
              z: (Math.random() - 0.5) * 26,
            },
            ttl: 28,
            color: i % 2 === 0 ? '#ffff00' : '#94a3b8',
          });
        }
        st.asteroids.splice(hitAsteroidIdx, 1);
        const bountyCr =
          joinedPlanetGroups.includes('GO-MARS') || joinedPlanetGroups.includes('GO-EARTH') ? 10 : 6;
        setCredits((c) => c + bountyCr);
        setClearedBouldersCount((cnt) => cnt + 1);
        setBeltSafetyPct((prev) => Math.min(100, prev + 6));
        setFlightMessage(
          `💥 ПЛАЗМА БАШНИ: ПРОСТОЙ БУЛЫЖНИК ИСЧЕЗ БЕССЛЕДНО СО ВЗРЫВОМ! БЕЗОПАСНОСТЬ ПОЯСА: ${Math.min(
            100,
            beltSafetyPct + 6
          )}% (+${bountyCr} CR)`
        );
      } else {
        const elSym = hitAst.elementSymbol || 'Ti';
        const elMeta = ASTEROID_PERIODIC_ELEMENTS[elSym];
        playZxBeep('MISSION');
        for (let i = 0; i < 12; i++) {
          st.debris.push({
            pos: {...hitAstPos},
            vel: {
              x: (Math.random() - 0.5) * 16,
              y: (Math.random() - 0.5) * 16,
              z: (Math.random() - 0.5) * 16,
            },
            ttl: 20,
            color: elMeta.color,
          });
        }
        hitAst.revealed = true;
        hitAst.color = elMeta.color;
        setFlightMessage(
          `🔬 ПЛАЗМА ВСКРЫЛА ПОРОДУ: ЦЕННЫЙ БУЛЫЖНИК ПОМЕЧЕН КАК «[${elMeta.displaySymbol}] ${elMeta.nameRu}» (${elMeta.sellPriceCr} CR/т)! НАЖМИТЕ КОЛЁСИКО МЫШИ (СКМ / C) ДЛЯ ЗАХВАТА В ОТСЕК!`
        );
      }
    }
  }, [beltSafetyPct, currentSystemId, isTeamCombatMode, joinedPlanetGroups, playZxBeep, screenMode, weaponComboMode]);

  // ЗАХВАТ ПРИ НАЖАТИИ КОЛЁСИКА МЫШИ (СКМ / C):
  // Захватывает помеченный (после огневого контакта!) ценный булыжник (Fe, Al, Ti, H₂O, Cu, Ni, Co, Li, Ag, Pt, Au)
  // и размещает его в грузовом отсеке корабля в соответствии с его вместимостью (maxCargoCapacity)!
  const handleTractorCapture = useCallback(() => {
    if (screenMode !== 'FLIGHT') return;
    const st = flightStateRef.current;
    const aimX = st.turretActive ? st.turretX : 430;
    const aimY = st.turretActive ? st.turretY : 194;
    st.lastShotTargetX = aimX;
    st.lastShotTargetY = aimY;
    st.tractorBeamTimer = 14;
    playZxBeep('DOCK');

    // 1. Сначала проверяем предметы CARGO (с разбитого тобой корабля -> ПИРАТ / после чужой драки -> МАРОДЁР) и спасательные капсулы SOS_POD
    let target = st.entities.find((ent) => {
      if (ent.kind !== 'SOS_POD' && ent.kind !== 'CARGO') return false;
      if (ent.pos.z < 20 || ent.pos.z > 18000) return false;
      const projRatio = 380 / ent.pos.z;
      const entScreenX = 430 + ent.pos.x * projRatio;
      const entScreenY = 194 - ent.pos.y * projRatio;
      return Math.hypot(entScreenX - aimX, entScreenY - aimY) <= 155;
    });

    // Если прямо под курсором нет контейнера, но впереди на экране дрейфует предмет с разбитого корабля или после драки — захватываем ближайший!
    if (!target) {
      target = st.entities.find(
        (ent) => (ent.kind === 'CARGO' || ent.kind === 'SOS_POD') && ent.pos.z > 20 && ent.pos.z < 6000
      );
    }

    if (target) {
      if (target.kind === 'SOS_POD') {
        playZxBeep('MISSION');
        setCredits((c) => c + 350);
        setEarnedGoBellKarma((k) => k + 2);
        onEarnKarmaAndBonus?.(2, 350, 'Захват и эвакуация спасательной капсулы пилота');
        setFlightMessage(
          `★ ЛУЧ ЗАХВАТА БАШНИ: КАПСУЛА «${target.label}» СПАСЕНА (+350 CR · +2 КАРМА)! ★`
        );
        st.entities = st.entities.filter((e) => e.id !== target!.id);
        return;
      } else {
        // Захват предмета (CARGO): проверяем место в трюме и источник предмета!
        if (usedCargoTonsForPhysics >= maxCargoCapacity) {
          playZxBeep('HIT');
          setFlightMessage(
            `⚠️ ГРУЗОВОЙ ОТСЕК ПОЛОН (${usedCargoTonsForPhysics}/${maxCargoCapacity}т)! ОСВОБОДИТЕ 1т В ТРЮМЕ, ЧТОБЫ ЗАБРАТЬ ПРЕДМЕТ «${target.label}»!`
          );
          return;
        }
        const origin = target.lootOrigin || 'AFTER_BATTLE';
        const sym = target.lootElement || 'Pt';
        const shipName = target.destroyedShipName || target.label;
        st.entities = st.entities.filter((e) => e.id !== target!.id);
        collectSpaceLootItem(origin, sym, shipName);
        return;
      }
    }

    // 2. Ищем в Поясе Астероидов ПОМЕЧЕННЫЙ после огневого контакта ценный булыжник (revealed === true)
    let revealedIdx = -1;
    let bestRevealedDist = Infinity;
    let unrevealedHit = false;

    for (let i = 0; i < st.asteroids.length; i++) {
      const ast = st.asteroids[i];
      const cosA = Math.cos(ast.orbitAngle);
      const sinA = Math.sin(ast.orbitAngle);
      const ax =
        st.starPos.x +
        ast.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x) +
        ast.yOffset * st.eclipticN.x;
      const ay =
        st.starPos.y +
        ast.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y) +
        ast.yOffset * st.eclipticN.y;
      const az =
        st.starPos.z +
        ast.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z) +
        ast.yOffset * st.eclipticN.z;
      if (az <= 30 || az >= 9000) continue;
      const asx = 430 + (ax * 380) / az;
      const asy = 194 - (ay * 380) / az;
      const dist = Math.hypot(asx - aimX, asy - aimY);

      if (ast.revealed && ast.isValuable && dist <= 95 && dist < bestRevealedDist) {
        bestRevealedDist = dist;
        revealedIdx = i;
      } else if (!ast.revealed && dist <= 55) {
        unrevealedHit = true;
      }
    }

    // Если прямо под прицелом не оказалось помеченного булыжника, проверяем есть ли любой видимый помеченный булыжник поблизости на экране
    if (revealedIdx === -1) {
      for (let i = 0; i < st.asteroids.length; i++) {
        const ast = st.asteroids[i];
        if (!ast.revealed || !ast.isValuable) continue;
        const cosA = Math.cos(ast.orbitAngle);
        const sinA = Math.sin(ast.orbitAngle);
        const ax =
          st.starPos.x +
          ast.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x) +
          ast.yOffset * st.eclipticN.x;
        const ay =
          st.starPos.y +
          ast.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y) +
          ast.yOffset * st.eclipticN.y;
        const az =
          st.starPos.z +
          ast.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z) +
          ast.yOffset * st.eclipticN.z;
        if (az <= 30 || az >= 9000) continue;
        const asx = 430 + (ax * 380) / az;
        const asy = 194 - (ay * 380) / az;
        if (asx >= 0 && asx <= 860 && asy >= 0 && asy <= 390) {
          const dist = Math.hypot(asx - aimX, asy - aimY);
          if (dist < bestRevealedDist) {
            bestRevealedDist = dist;
            revealedIdx = i;
          }
        }
      }
    }

    if (revealedIdx !== -1) {
      // Проверяем вместимость грузового отсека (usedCargoTonsForPhysics < maxCargoCapacity)
      if (usedCargoTonsForPhysics >= maxCargoCapacity) {
        playZxBeep('HIT');
        setFlightMessage(
          `⚠️ ГРУЗОВОЙ ОТСЕК ЗАПОЛНЕН (${usedCargoTonsForPhysics}/${maxCargoCapacity}т)! ПРОДАЙТЕ ЭЛЕМЕНТЫ ПО ПРОПОРЦИЯМ РЫНКА ЗЕМЛИ ИЛИ РАСШИРЬТЕ ТРЮМ ДО 35т!`
        );
        return;
      }

      const capturedAst = st.asteroids[revealedIdx];
      const sym = capturedAst.elementSymbol || 'Fe';
      const elMeta = ASTEROID_PERIODIC_ELEMENTS[sym];

      // Удаляем захваченный булыжник из космоса (перемещён в грузовой отсек!)
      st.asteroids.splice(revealedIdx, 1);
      playZxBeep('MISSION');

      if (sym === 'Fe') {
        setIronStock((s) => s + 1);
      } else if (sym === 'Al') {
        setAluminumStock((s) => s + 1);
      } else if (sym === 'Ti') {
        setTitaniumStock((s) => s + 1);
      } else if (sym === 'H2O') {
        // Вода H₂O из пояса астероидов: пополняет питьё и кислород O₂ до 100% (кроме продовольствия!) + 1т в грузовой отсек
        setWaterOxygenStockPct(100);
        setMinedElementsHold((prev) => ({...prev, H2O: prev.H2O + 1}));
      } else {
        setMinedElementsHold((prev) => ({...prev, [sym]: (prev[sym] || 0) + 1}));
        setRareElementsStock((r) => r + 1);
      }

      const nextCargoTons = usedCargoTonsForPhysics + 1;
      setFlightMessage(
        sym === 'H2O'
          ? `🧲 ЗАХВАЧЕН В ГРУЗОВОЙ ОТСЕК (${nextCargoTons}/${maxCargoCapacity}т): +1т [${elMeta.displaySymbol}] Вода/O₂ (Питьё и кислород 100%, кроме продовольствия! Цена Земли: ${elMeta.sellPriceCr} CR/т)`
          : `🧲 ЗАХВАЧЕН В ГРУЗОВОЙ ОТСЕК (${nextCargoTons}/${maxCargoCapacity}т): +1т [${elMeta.displaySymbol}] ${elMeta.nameRu} · Рыночная цена Земли: ${elMeta.sellPriceCr} CR/т!`
      );
      return;
    }

    if (unrevealedHit) {
      playZxBeep('HIT');
      setFlightMessage(
        '⚠️ ДО ОГНЕВОГО КОНТАКТА БУЛЫЖНИКИ НЕРАЗЛИЧИМЫ! СНАЧАЛА ВЫСТРЕЛИТЕ ЛАЗЕРОМ (ЛКМ / F): ПРОСТЫЕ ИСЧЕЗНУТ СО ВЗРЫВОМ, А ЦЕННЫЕ ПОМЕТЯТСЯ (Fe, Al, Ti, H₂O...)!'
      );
    } else {
      setFlightMessage(
        'ЛУЧ ЗАХВАТА (СКМ / C): СНАЧАЛА ВЫСТРЕЛИТЕ ПО БУЛЫЖНИКУ (ЛКМ / F), ЧТОБЫ ПОМЕТИТЬ ЭЛЕМЕНТ (Fe, Al, Ti, H₂O...), ЗАТЕМ ЗАХВАТИТЕ В ОТСЕК!'
      );
    }
  }, [maxCargoCapacity, onEarnKarmaAndBonus, playZxBeep, screenMode, usedCargoTonsForPhysics]);

  // Продажа элементов периодической системы и воды (H₂O), добытых в поясе астероидов:
  // • Правительства планет закупают элементы за ПОЛЦЕНЫ (50% = govBuyCr) и продают за ПОЛНУЮ (100% = fullCr).
  // • Если у пилота подключён Бизнес-аккаунт (BUSINESS) и создан свой бизнес с меньшей маржой — сбыт идёт по ЗАВЫШЕННОЙ закупочной цене (bizBuyCr > 50%)!
  const handleSellPeriodicElement = useCallback(
    (symbolOrAll: AsteroidElementSymbol | 'ALL') => {
      const isBizActive = gobellTariff === 'BUSINESS' && pilotBusiness.isCreated;

      if (symbolOrAll === 'ALL') {
        let totalEarnedCr = 0;
        let totalSoldTons = 0;
        const soldLabels: string[] = [];

        // Продаём все элементы из minedElementsHold (H₂O, Cu, Ni, Co, Li, Ag, Pt, Au)
        const nextHold = {...minedElementsHold};
        (Object.keys(nextHold) as Array<Exclude<AsteroidElementSymbol, 'Fe' | 'Al' | 'Ti'>>).forEach(
          (sym) => {
            const qty = nextHold[sym] || 0;
            if (qty > 0) {
              const price = getElementTradePrices(sym).activePilotSellPriceCr;
              totalEarnedCr += qty * price;
              totalSoldTons += qty;
              soldLabels.push(`${qty}т ${ASTEROID_PERIODIC_ELEMENTS[sym].displaySymbol}`);
              nextHold[sym] = 0;
            }
          }
        );

        // Для Fe, Al, Ti оставляем по 1т неприкосновенного ремонтного запаса для гиперпрыжка (если их больше 1т), либо продаём излишек
        let nextFe = ironStock;
        if (ironStock > 1) {
          const sellFe = ironStock - 1;
          totalEarnedCr += sellFe * getElementTradePrices('Fe').activePilotSellPriceCr;
          totalSoldTons += sellFe;
          soldLabels.push(`${sellFe}т Fe`);
          nextFe = 1;
        }
        let nextAl = aluminumStock;
        if (aluminumStock > 1) {
          const sellAl = aluminumStock - 1;
          totalEarnedCr += sellAl * getElementTradePrices('Al').activePilotSellPriceCr;
          totalSoldTons += sellAl;
          soldLabels.push(`${sellAl}т Al`);
          nextAl = 1;
        }
        let nextTi = titaniumStock;
        if (titaniumStock > 1) {
          const sellTi = titaniumStock - 1;
          totalEarnedCr += sellTi * getElementTradePrices('Ti').activePilotSellPriceCr;
          totalSoldTons += sellTi;
          soldLabels.push(`${sellTi}т Ti`);
          nextTi = 1;
        }

        if (totalSoldTons <= 0) {
          setFlightMessage(
            '⚠️ В ГРУЗОВОМ ОТСЕКЕ НЕТ ДОБЫТЫХ ЭЛЕМЕНТОВ ДЛЯ ОПТОВОЙ ПРОДАЖИ (ПО 1т Fe, Al, Ti ОСТАВЛЕНО ДЛЯ ГИПЕРПРЫЖКА)!'
          );
          return;
        }

        playZxBeep('MISSION');
        setMinedElementsHold(nextHold);
        setIronStock(nextFe);
        setAluminumStock(nextAl);
        setTitaniumStock(nextTi);
        const roundedTotalEarned = Number(totalEarnedCr.toFixed(1));
        setCredits((c) => Number((c + roundedTotalEarned).toFixed(1)));
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ СТАТУС ПИРАТ (КАРМА ${earnedGoBellKarma} · ПРИ ПРОДАЖЕ УЦЕНКА ÷10 -): ПРОДАНО ${soldLabels.join(', ')} ЗА +${roundedTotalEarned} CR (В 10 РАЗ МЕНЬШЕ ОБЫЧНОЙ ЦЕНЫ)!`
            : isBizActive
            ? `🏢 ПРОДАНО ЧЕРЕЗ ВАШ БИЗНЕС «${pilotBusiness.name}» ПО ЗАВЫШЕННОЙ ЦЕНЕ (${pilotBusiness.buyRatePct}% ВМЕСТО 50% У ПРАВИТЕЛЬСТВ): ${soldLabels.join(', ')} → +${roundedTotalEarned} CR!`
            : `🏛 ПРОДАНО ПРАВИТЕЛЬСТВАМ ПЛАНЕТ ЗА ПОЛЦЕНЫ (50% ОТ ПОЛНОЙ ЦЕНЫ ЗЕМЛИ): ${soldLabels.join(', ')} → +${roundedTotalEarned} CR!`
        );
        return;
      }

      const meta = ASTEROID_PERIODIC_ELEMENTS[symbolOrAll];
      const prices = getElementTradePrices(symbolOrAll);
      const sellUnitCr = prices.activePilotSellPriceCr;

      if (symbolOrAll === 'Fe') {
        if (ironStock <= 0) {
          setFlightMessage('⚠️ В ГРУЗОВОМ ОТСЕКЕ НЕТ ЖЕЛЕЗА (Fe) ДЛЯ ПРОДАЖИ!');
          return;
        }
        playZxBeep('DOCK');
        setIronStock((s) => s - 1);
        setCredits((c) => Number((c + sellUnitCr).toFixed(1)));
      } else if (symbolOrAll === 'Al') {
        if (aluminumStock <= 0) {
          setFlightMessage('⚠️ В ГРУЗОВОМ ОТСЕКЕ НЕТ АЛЮМИНИЯ (Al) ДЛЯ ПРОДАЖИ!');
          return;
        }
        playZxBeep('DOCK');
        setAluminumStock((s) => s - 1);
        setCredits((c) => Number((c + sellUnitCr).toFixed(1)));
      } else if (symbolOrAll === 'Ti') {
        if (titaniumStock <= 0) {
          setFlightMessage('⚠️ В ГРУЗОВОМ ОТСЕКЕ НЕТ ТИТАНА (Ti) ДЛЯ ПРОДАЖИ!');
          return;
        }
        playZxBeep('DOCK');
        setTitaniumStock((s) => s - 1);
        setCredits((c) => Number((c + sellUnitCr).toFixed(1)));
      } else {
        const currentQty = minedElementsHold[symbolOrAll] || 0;
        if (currentQty <= 0) {
          setFlightMessage(
            `⚠️ В ГРУЗОВОМ ОТСЕКЕ НЕТ ЭЛЕМЕНТА [${meta.displaySymbol}] ${meta.nameRu}! ДОБУДЬТЕ В ПОЯСЕ АСТЕРОИДОВ!`
          );
          return;
        }
        playZxBeep('DOCK');
        setMinedElementsHold((prev) => ({
          ...prev,
          [symbolOrAll]: Math.max(0, (prev[symbolOrAll] || 0) - 1),
        }));
        setCredits((c) => Number((c + sellUnitCr).toFixed(1)));
      }

      setFlightMessage(
        isPirateStatus
          ? `🏴‍☠️ СТАТУС ПИРАТ (КАРМА ${earnedGoBellKarma} · ПРИ ПРОДАЖЕ ÷10 -): ПРОДАНА 1т [${meta.displaySymbol}] ${meta.nameRu} ВСЕГО ЗА +${sellUnitCr} CR (БЕЗ ПИРАТСКОГО СТАТУСА БЫЛО БЫ +${prices.basePilotSellPriceCr} CR)!`
          : isBizActive
          ? `🏢 ПРОДАНА 1т [${meta.displaySymbol}] ${meta.nameRu} ПО ЗАВЫШЕННОЙ ЗАКУПКЕ ВАШЕГО БИЗНЕСА (${pilotBusiness.buyRatePct}%): +${sellUnitCr} CR (у правительств полцены: ${prices.govBuyCr} CR)`
          : `🏛 ПРОДАНА 1т [${meta.displaySymbol}] ${meta.nameRu} ПРАВИТЕЛЬСТВУ ЗА ПОЛЦЕНЫ (50%): +${sellUnitCr} CR (полная цена продажи правительством: ${prices.fullCr} CR)`
      );
    },
    [
      aluminumStock,
      earnedGoBellKarma,
      getElementTradePrices,
      gobellTariff,
      ironStock,
      isPirateStatus,
      minedElementsHold,
      pilotBusiness.buyRatePct,
      pilotBusiness.isCreated,
      pilotBusiness.name,
      playZxBeep,
      titaniumStock,
    ]
  );

  // Покупка 1т элемента периодической системы:
  // • Правительства планет продают за ПОЛНУЮ цену (100% = fullCr).
  // • Если у пилота подключён Бизнес-аккаунт (BUSINESS) и создан свой бизнес с меньшей маржой — покупка идёт по ЗАНИЖЕННОЙ цене (bizSellCr < 100%)!
  // • Если статус ПИРАТ (карма в минусе): наценка при покупке ×10 (+)!
  const handleBuyPeriodicElement = useCallback(
    (sym: AsteroidElementSymbol) => {
      if (usedCargoTonsForPhysics >= maxCargoCapacity) {
        playZxBeep('HIT');
        setFlightMessage(
          `⚠️ ГРУЗОВОЙ ОТСЕК ЗАПОЛНЕН (${usedCargoTonsForPhysics}/${maxCargoCapacity}т)! ОСВОБОДИТЕ МЕСТО В ОТСЕКЕ!`
        );
        return;
      }
      const meta = ASTEROID_PERIODIC_ELEMENTS[sym];
      const prices = getElementTradePrices(sym);
      const isBizActive = gobellTariff === 'BUSINESS' && pilotBusiness.isCreated;
      const buyCostCr = prices.activePilotBuyPriceCr;

      if (credits < buyCostCr) {
        playZxBeep('HIT');
        setFlightMessage(
          `⚠️ НЕДОСТАТОЧНО КРЕДИТОВ ДЛЯ ПОКУПКИ 1т [${meta.displaySymbol}] ${meta.nameRu}: НУЖНО ${buyCostCr} CR ${isPirateStatus ? '(ПИРАТСКАЯ НАЦЕНКА ×10!)' : ''} (БАЛАНС: ${credits} CR)`
        );
        return;
      }

      playZxBeep('DOCK');
      setCredits((c) => Number((c - buyCostCr).toFixed(1)));
      if (sym === 'Fe') setIronStock((s) => s + 1);
      else if (sym === 'Al') setAluminumStock((s) => s + 1);
      else if (sym === 'Ti') setTitaniumStock((s) => s + 1);
      else {
        setMinedElementsHold((prev) => ({
          ...prev,
          [sym]: (prev[sym] || 0) + 1,
        }));
      }

      setFlightMessage(
        isPirateStatus
          ? `🏴‍☠️ СТАТУС ПИРАТ (КАРМА ${earnedGoBellKarma} · ПРИ ПОКУПКЕ ×10 +): КУПЛЕНА 1т [${meta.displaySymbol}] ${meta.nameRu} ЗА -${buyCostCr} CR (БЕЗ ПИРАТСКОГО СТАТУСА БЫЛО БЫ -${prices.basePilotBuyPriceCr} CR)!`
          : isBizActive
          ? `🏢 КУПЛЕНА 1т [${meta.displaySymbol}] ${meta.nameRu} ПО ЗАНИЖЕННОЙ ЦЕНЕ ВАШЕГО БИЗНЕСА (${pilotBusiness.sellRatePct}%): -${buyCostCr} CR (у правительств полная цена: ${prices.fullCr} CR)`
          : `🏛 КУПЛЕНА 1т [${meta.displaySymbol}] ${meta.nameRu} У ПРАВИТЕЛЬСТВА ЗА ПОЛНУЮ ЦЕНУ (100%): -${buyCostCr} CR (правительство закупает за полцены: ${prices.govBuyCr} CR)`
      );
    },
    [
      credits,
      earnedGoBellKarma,
      getElementTradePrices,
      gobellTariff,
      isPirateStatus,
      maxCargoCapacity,
      pilotBusiness.isCreated,
      pilotBusiness.sellRatePct,
      playZxBeep,
      usedCargoTonsForPhysics,
    ]
  );

  // Закупка специализированного ресурса на планете:
  // Базовая стоимость на планете = 5 кредитов (5 CR), а если вы состоите в Группе этой планеты — скидка до 1 кредита (1 CR)!
  // Если статус ПИРАТ (карма в минусе) — наценка на покупку ×10 (+): 50 CR без группы или 10 CR в группе!
  // При этом ресурс размещается в грузовом отсеке в соответствии с его вместимостью (maxCargoCapacity)!
  const handleSupplyFromPlanet = useCallback(
    (planetOrder: number) => {
      if (usedCargoTonsForPhysics >= maxCargoCapacity) {
        playZxBeep('HIT');
        setFlightMessage(
          `⚠️ ГРУЗОВОЙ ОТСЕК ЗАПОЛНЕН (${usedCargoTonsForPhysics}/${maxCargoCapacity}т)! ПРОДАЙТЕ РЕСУРСЫ ИЛИ РАСШИРЬТЕ ТРЮМ!`
        );
        return;
      }
      if (planetOrder === 1) {
        // 1-я планета (Меркурий): ЖЕЛЕЗО (Fe) — стоит 5 CR, а в группе Меркурия (#GO-MERCURY) скидка до 1 CR (для Пирата ×10: 50 CR / 10 CR)!
        const inMercuryGroup = joinedPlanetGroups.includes('GO-MERCURY');
        const cost = (inMercuryGroup ? 1 : 5) * pirateBuyMultiplier;
        if (credits < cost) {
          setFlightMessage(
            `НЕДОСТАТОЧНО КРЕДИТОВ (${cost} CR${isPirateStatus ? ' · ПИРАТ ×10' : ''}) ДЛЯ ЗАКУПКИ ЖЕЛЕЗА (Fe) НА МЕРКУРИИ!`
          );
          return;
        }
        playZxBeep('DOCK');
        setCredits((c) => Number((c - cost).toFixed(1)));
        setIronStock((s) => s + 1);
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ МЕРКУРИЙ (СТАТУС ПИРАТ · НАЦЕНКА ПРИ ПОКУПКЕ ×10 +): КУПЛЕНО +1т ЖЕЛЕЗА (Fe) ЗА -${cost} CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : inMercuryGroup
            ? `⚙️ МЕРКУРИЙ (ВЫ В ГРУППЕ #GO-MERCURY · СКИДКА ДО 1 CR!): КУПЛЕНО +1т ЖЕЛЕЗА (Fe) ЗА 1 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : `⚙️ МЕРКУРИЙ (БЕЗ ГРУППЫ · 5 CR): КУПЛЕНО +1т ЖЕЛЕЗА (Fe) ЗА 5 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
        );
      } else if (planetOrder === 2) {
        // 2-я планета (Венера): АЛЮМИНИЙ (Al) — стоит 5 CR, а в группе Венеры (#GO-VENUS) скидка до 1 CR (для Пирата ×10: 50 CR / 10 CR)!
        const inVenusGroup = joinedPlanetGroups.includes('GO-VENUS');
        const cost = (inVenusGroup ? 1 : 5) * pirateBuyMultiplier;
        if (credits < cost) {
          setFlightMessage(
            `НЕДОСТАТОЧНО КРЕДИТОВ (${cost} CR${isPirateStatus ? ' · ПИРАТ ×10' : ''}) ДЛЯ ЗАКУПКИ АЛЮМИНИЯ (Al) НА ВЕНЕРЕ!`
          );
          return;
        }
        playZxBeep('DOCK');
        setCredits((c) => Number((c - cost).toFixed(1)));
        setAluminumStock((s) => s + 1);
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ ВЕНЕРА (СТАТУС ПИРАТ · НАЦЕНКА ПРИ ПОКУПКЕ ×10 +): КУПЛЕНО +1т АЛЮМИНИЯ (Al) ЗА -${cost} CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : inVenusGroup
            ? `🔩 ВЕНЕРА (ВЫ В ГРУППЕ #GO-VENUS · СКИДКА ДО 1 CR!): КУПЛЕНО +1т АЛЮМИНИЯ (Al) ЗА 1 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : `🔩 ВЕНЕРА (БЕЗ ГРУППЫ · 5 CR): КУПЛЕНО +1т АЛЮМИНИЯ (Al) ЗА 5 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
        );
      } else if (planetOrder === 3) {
        // 3-я планета (Земля): ПРОДОВОЛЬСТВИЕ И ВОДА/O₂ — стоит 5 CR, а в группе Земли (#GO-EARTH) скидка до 1 CR (для Пирата ×10: 50 CR / 10 CR)!
        const inEarthGroup = joinedPlanetGroups.includes('GO-EARTH');
        const cost = (inEarthGroup ? 1 : 5) * pirateBuyMultiplier;
        if (credits < cost) {
          setFlightMessage(
            `НЕДОСТАТОЧНО КРЕДИТОВ (${cost} CR${isPirateStatus ? ' · ПИРАТ ×10' : ''}) ДЛЯ ЗАКУПКИ ПРОДОВОЛЬСТВИЯ И ВОДЫ (O₂) НА ЗЕМЛЕ!`
          );
          return;
        }
        playZxBeep('MISSION');
        setCredits((c) => Number((c - cost).toFixed(1)));
        setFoodStockPct(100);
        setWaterOxygenStockPct(100);
        setFoodWaterCargoStock((s) => s + 1);
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ ЗЕМЛЯ (СТАТУС ПИРАТ · НАЦЕНКА ПРИ ПОКУПКЕ ×10 +): КУПЛЕНО +1т ПРОДОВОЛЬСТВИЯ И ВОДЫ/O₂ ЗА -${cost} CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : inEarthGroup
            ? `🍎💧 ЗЕМЛЯ (ВЫ В ГРУППЕ #GO-EARTH · СКИДКА ДО 1 CR!): КУПЛЕНО +1т ПРОДОВОЛЬСТВИЯ И ВОДЫ/O₂ ЗА 1 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : `🍎💧 ЗЕМЛЯ (БЕЗ ГРУППЫ · 5 CR): КУПЛЕНО +1т ПРОДОВОЛЬСТВИЯ И ВОДЫ/O₂ ЗА 5 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
        );
      } else if (planetOrder === 4) {
        // 4-я планета (Марс): ТИТАН (Ti) — стоит 5 CR, а в группе Марса (#GO-MARS) скидка до 1 CR (для Пирата ×10: 50 CR / 10 CR)!
        const inMarsGroup = joinedPlanetGroups.includes('GO-MARS');
        const cost = (inMarsGroup ? 1 : 5) * pirateBuyMultiplier;
        if (credits < cost) {
          setFlightMessage(
            `НЕДОСТАТОЧНО КРЕДИТОВ (${cost} CR${isPirateStatus ? ' · ПИРАТ ×10' : ''}) ДЛЯ ЗАКУПКИ ТИТАНА (Ti) НА МАРСЕ!`
          );
          return;
        }
        playZxBeep('DOCK');
        setCredits((c) => Number((c - cost).toFixed(1)));
        setTitaniumStock((s) => s + 1);
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ МАРС (СТАТУС ПИРАТ · НАЦЕНКА ПРИ ПОКУПКЕ ×10 +): КУПЛЕНО +1т ТИТАНА (Ti) ЗА -${cost} CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : inMarsGroup
            ? `🛡️ МАРС (ВЫ В ГРУППЕ #GO-MARS · СКИДКА ДО 1 CR!): КУПЛЕНО +1т ТИТАНА (Ti) ЗА 1 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
            : `🛡️ МАРС (БЕЗ ГРУППЫ · 5 CR): КУПЛЕНО +1т ТИТАНА (Ti) ЗА 5 CR (ОТСЕК: ${usedCargoTonsForPhysics + 1}/${maxCargoCapacity}т)`
        );
      }
    },
    [
      credits,
      isPirateStatus,
      joinedPlanetGroups,
      maxCargoCapacity,
      pirateBuyMultiplier,
      playZxBeep,
      usedCargoTonsForPhysics,
    ]
  );

  // Выполнение межпланетного логистического контракта через Группу-Правительство планеты (оплата 10 CR за доставку ресурса с другой планеты или 15 CR за редкие элементы из пояса астероидов; для Пирата при продаже/сдаче ÷10: +1 CR!)
  const handleDeliverGovernmentContract = useCallback(
    (
      targetPlanetName: string,
      resourceType: 'IRON' | 'ALUMINUM' | 'FOOD_WATER' | 'TITANIUM' | 'RARE_ELEMENTS'
    ) => {
      const contractPayoutCr = Number((10 / pirateSellDivisor).toFixed(1));
      const rarePayoutCr = Number((15 / pirateSellDivisor).toFixed(1));

      if (resourceType === 'IRON') {
        if (ironStock < 1) {
          setFlightMessage(
            `⚠️ НЕТ ЖЕЛЕЗА (Fe) ДЛЯ ДОСТАВКИ НА ${targetPlanetName.toUpperCase()}! ЗАКУПИТЕ НА МЕРКУРИИ!`
          );
          return;
        }
        playZxBeep('MISSION');
        setIronStock((s) => s - 1);
        setCredits((c) => Number((c + contractPayoutCr).toFixed(1)));
        if (!isPirateStatus) {
          setEarnedGoBellKarma((k) => k + 1);
        }
        onEarnKarmaAndBonus?.(
          isPirateStatus ? 0 : 1,
          contractPayoutCr,
          `Логистика Правительства «${targetPlanetName}»: доставка Железа (Fe) с Меркурия`
        );
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПРОДАЖЕ ÷10 -): СДАНА 1т ЖЕЛЕЗА НА «${targetPlanetName.toUpperCase()}» → ВЫПЛАЧЕНО ВСЕГО +${contractPayoutCr} CR ВМЕСТО 10 CR!`
            : `🏛️ КОНТРАКТ ПРАВИТЕЛЬСТВА «${targetPlanetName.toUpperCase()}» ВЫПОЛНЕН: ДОСТАВЛЕНО 1т ЖЕЛЕЗА С МЕРКУРИЯ → ПОЛУЧЕНО +${contractPayoutCr} CR (+1 КАРМА)!`
        );
      } else if (resourceType === 'ALUMINUM') {
        if (aluminumStock < 1) {
          setFlightMessage(
            `⚠️ НЕТ АЛЮМИНИЯ (Al) ДЛЯ ДОСТАВКИ НА ${targetPlanetName.toUpperCase()}! ЗАКУПИТЕ НА ВЕНЕРЕ!`
          );
          return;
        }
        playZxBeep('MISSION');
        setAluminumStock((s) => s - 1);
        setCredits((c) => Number((c + contractPayoutCr).toFixed(1)));
        if (!isPirateStatus) {
          setEarnedGoBellKarma((k) => k + 1);
        }
        onEarnKarmaAndBonus?.(
          isPirateStatus ? 0 : 1,
          contractPayoutCr,
          `Логистика Правительства «${targetPlanetName}»: доставка Алюминия (Al) с Венеры`
        );
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПРОДАЖЕ ÷10 -): СДАНА 1т АЛЮМИНИЯ НА «${targetPlanetName.toUpperCase()}» → ВЫПЛАЧЕНО ВСЕГО +${contractPayoutCr} CR ВМЕСТО 10 CR!`
            : `🏛️ КОНТРАКТ ПРАВИТЕЛЬСТВА «${targetPlanetName.toUpperCase()}» ВЫПОЛНЕН: ДОСТАВЛЕНО 1т АЛЮМИНИЯ С ВЕНЕРЫ → ПОЛУЧЕНО +${contractPayoutCr} CR (+1 КАРМА)!`
        );
      } else if (resourceType === 'FOOD_WATER') {
        if (foodWaterCargoStock < 1) {
          setFlightMessage(
            `⚠️ НЕТ КОНТЕЙНЕРОВ ПРОДОВОЛЬСТВИЯ/ВОДЫ ДЛЯ ДОСТАВКИ НА ${targetPlanetName.toUpperCase()}! ЗАКУПИТЕ НА ЗЕМЛЕ!`
          );
          return;
        }
        playZxBeep('MISSION');
        setFoodWaterCargoStock((s) => s - 1);
        setCredits((c) => Number((c + contractPayoutCr).toFixed(1)));
        if (!isPirateStatus) {
          setEarnedGoBellKarma((k) => k + 1);
        }
        onEarnKarmaAndBonus?.(
          isPirateStatus ? 0 : 1,
          contractPayoutCr,
          `Логистика Правительства «${targetPlanetName}»: доставка Продовольствия и Воды/O₂ с Земли`
        );
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПРОДАЖЕ ÷10 -): СДАНО ПРОДОВОЛЬСТВИЕ И ВОДА НА «${targetPlanetName.toUpperCase()}» → ВЫПЛАЧЕНО ВСЕГО +${contractPayoutCr} CR ВМЕСТО 10 CR!`
            : `🏛️ КОНТРАКТ ПРАВИТЕЛЬСТВА «${targetPlanetName.toUpperCase()}» ВЫПОЛНЕН: ДОСТАВЛЕНО ПРОДОВОЛЬСТВИЕ И ВОДА С ЗЕМЛИ → ПОЛУЧЕНО +${contractPayoutCr} CR (+1 КАРМА)!`
        );
      } else if (resourceType === 'TITANIUM') {
        if (titaniumStock < 1) {
          setFlightMessage(
            `⚠️ НЕТ ТИТАНА (Ti) ДЛЯ ДОСТАВКИ НА ${targetPlanetName.toUpperCase()}! ЗАКУПИТЕ НА МАРСЕ!`
          );
          return;
        }
        playZxBeep('MISSION');
        setTitaniumStock((s) => s - 1);
        setCredits((c) => Number((c + contractPayoutCr).toFixed(1)));
        if (!isPirateStatus) {
          setEarnedGoBellKarma((k) => k + 1);
        }
        onEarnKarmaAndBonus?.(
          isPirateStatus ? 0 : 1,
          contractPayoutCr,
          `Логистика Правительства «${targetPlanetName}»: доставка Титана (Ti) с Марса`
        );
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПРОДАЖЕ ÷10 -): СДАНА 1т ТИТАНА НА «${targetPlanetName.toUpperCase()}» → ВЫПЛАЧЕНО ВСЕГО +${contractPayoutCr} CR ВМЕСТО 10 CR!`
            : `🏛️ КОНТРАКТ ПРАВИТЕЛЬСТВА «${targetPlanetName.toUpperCase()}» ВЫПОЛНЕН: ДОСТАВЛЕНО 1т ТИТАНА С МАРСА → ПОЛУЧЕНО +${contractPayoutCr} CR (+1 КАРМА)!`
        );
      } else if (resourceType === 'RARE_ELEMENTS') {
        if (rareElementsStock < 1) {
          setFlightMessage(
            `⚠️ НЕТ РЕДКИХ ЭЛЕМЕНТОВ! ЛЕТИТЕ В ПОЯС АСТЕРОИДОВ, РАССТРЕЛИВАЙТЕ БУЛЫЖНИКИ ИЛИ НАЖМИТЕ КОЛЁСИКО МЫШИ ДЛЯ ДОБЫЧИ!`
          );
          return;
        }
        playZxBeep('MISSION');
        setRareElementsStock((s) => s - 1);
        setCredits((c) => Number((c + rarePayoutCr).toFixed(1)));
        if (!isPirateStatus) {
          setEarnedGoBellKarma((k) => k + 2);
        }
        onEarnKarmaAndBonus?.(
          isPirateStatus ? 0 : 2,
          rarePayoutCr,
          `Поставка Редких элементов из Пояса астероидов Правительству «${targetPlanetName}»`
        );
        setFlightMessage(
          isPirateStatus
            ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПРОДАЖЕ ÷10 -): СДАНА 1т РЕДКИХ ЭЛЕМЕНТОВ → ВЫПЛАЧЕНО ВСЕГО +${rarePayoutCr} CR ВМЕСТО 15 CR!`
            : `💎 КОНТРАКТ ПРАВИТЕЛЬСТВА «${targetPlanetName.toUpperCase()}»: СДАНА 1т РЕДКИХ ЭЛЕМЕНТОВ ИЗ ПОЯСА АСТЕРОИДОВ → +${rarePayoutCr} CR (+2 КАРМА)!`
        );
      }
    },
    [
      aluminumStock,
      foodWaterCargoStock,
      ironStock,
      isPirateStatus,
      onEarnKarmaAndBonus,
      pirateSellDivisor,
      playZxBeep,
      rareElementsStock,
      titaniumStock,
    ]
  );

  // Ручное или автоматическое восстановление повреждений после гиперпрыжка с использованием Железа (1-я пл.), Алюминия (2-я пл.) и Титана (4-я пл.)
  const handleRepairHyperspaceDamage = useCallback(() => {
    if (hullIntegrityPct >= 100) {
      setFlightMessage('КОРПУС КОРАБЛЯ В ИДЕАЛЬНОМ СОСТОЯНИИ (100%)!');
      return;
    }
    if (ironStock < 1 || aluminumStock < 1 || titaniumStock < 1) {
      const missing: string[] = [];
      if (ironStock < 1) missing.push('Железо Fe (1-я пл. Меркурий)');
      if (aluminumStock < 1) missing.push('Алюминий Al (2-я пл. Венера)');
      if (titaniumStock < 1) missing.push('Титан Ti (4-я пл. Марс)');
      setFlightMessage(
        `⚠️ ДЛЯ ВОССТАНОВЛЕНИЯ ПОВРЕЖДЕНИЙ ГИПЕРПРЫЖКА НЕ ХВАТАЕТ: ${missing.join(', ')}!`
      );
      return;
    }
    playZxBeep('MISSION');
    setIronStock((s) => Math.max(0, s - 1));
    setAluminumStock((s) => Math.max(0, s - 1));
    setTitaniumStock((s) => Math.max(0, s - 1));
    setHullIntegrityPct(100);
    flightStateRef.current.frontShield = 100;
    flightStateRef.current.aftShield = 100;
    setFlightMessage(
      '🔧 ПОВРЕЖДЕНИЯ ГИПЕРПРЫЖКА ПОЛНОСТЬЮ ВОССТАНОВЛЕНЫ (100%) ЗА СЧЁТ ЗАПАСА: -1т ЖЕЛЕЗА (Fe), -1т АЛЮМИНИЯ (Al), -1т ТИТАНА (Ti)!'
    );
  }, [aluminumStock, hullIntegrityPct, ironStock, playZxBeep, titaniumStock]);

  // Гиперпрыжок (H) с расходом и автоматическим восстановлением повреждений во время гиперпрыжка (Железо + Алюминий + Титан)
  const handleHyperspaceJump = useCallback(
    (forcedDestId?: number) => {
      const destId = typeof forcedDestId === 'number' ? forcedDestId : targetSystemId;
      if (destId === currentSystemId) {
        setScreenMode('GALAXY_MAP');
        setFlightMessage('SELECT TARGET STAR SYSTEM FOR HYPERSPACE JUMP (H)');
        return;
      }
      const distLy = 1.8;
      if (fuel < distLy) {
        setFlightMessage('HYPERSPACE ABORTED · INSUFFICIENT FUEL! DOCK (T) TO REFUEL');
        return;
      }
      if (foodStockPct <= 5 || waterOxygenStockPct <= 5) {
        setFlightMessage(
          '⚠️ КРИТИЧЕСКИЙ УРОВЕНЬ ПРОДОВОЛЬСТВИЯ ИЛИ ВОДЫ/КИСЛОРОДА (O₂)! ПОПОЛНИТЕ НА 3-Й ПЛАНЕТЕ (ЗЕМЛЯ)!'
        );
        return;
      }

      setScreenMode('FLIGHT');
      flightStateRef.current.stationaryOrbitPlanetId = null;
      flightStateRef.current.stationaryOrbitTurnRad = 0;
      setStationaryOrbitInfo(null);
      flightStateRef.current.hyperspaceTimer = 55;
      flightStateRef.current.hyperspaceTargetId = destId;
      playZxBeep('HYPERSPACE');
      setFuel((f) => Math.max(0, Number((f - distLy).toFixed(1))));
      // Расход автономных запасов продовольствия и воды/кислорода при межзвёздном переходе
      setFoodStockPct((p) => Math.max(5, p - 12));
      setWaterOxygenStockPct((p) => Math.max(5, p - 14));

      // Проверка наличия запаса Железа (1-я пл.), Алюминия (2-я пл.) и Титана (4-я пл.) для восстановления повреждений во время гиперпрыжка
      if (ironStock >= 1 && aluminumStock >= 1 && titaniumStock >= 1) {
        setIronStock((s) => s - 1);
        setAluminumStock((s) => s - 1);
        setTitaniumStock((s) => s - 1);
        setHullIntegrityPct(100);
        setFlightMessage(
          `⚡ ГИПЕРПРЫЖОК В ${GALAXY_SYSTEMS[destId].name}: ПОВРЕЖДЕНИЯ ВО ВРЕМЯ ГИПЕРПРЫЖКА ВОССТАНОВЛЕНЫ (ИЗРАСХОДОВАНО ПО 1т ЖЕЛЕЗА, АЛЮМИНИЯ И ТИТАНА)!`
        );
      } else {
        setHullIntegrityPct((h) => Math.max(25, h - 32));
        setFlightMessage(
          `⚠️ ГИПЕРПРЫЖОК В ${GALAXY_SYSTEMS[destId].name}: ПОЛУЧЕНЫ ПОВРЕЖДЕНИЯ КОРПУСА! ПОПОЛНИТЕ ЖЕЛЕЗО (1-Я ПЛ.), АЛЮМИНИЙ (2-Я ПЛ.) И ТИТАН (4-Я ПЛ.)!`
        );
      }
    },
    [
      aluminumStock,
      currentSystemId,
      foodStockPct,
      fuel,
      ironStock,
      playZxBeep,
      targetSystemId,
      titaniumStock,
      waterOxygenStockPct,
    ]
  );

  // Стыковка со станцией и Торговля / Выбор миссии GoBell (T)
  const handleToggleDocking = useCallback(() => {
    if (screenMode === 'DOCKED') {
      setScreenMode('FLIGHT');
      flightStateRef.current.speed = 18;
      setFlightMessage(`LAUNCHED FROM ${GALAXY_SYSTEMS[currentSystemId].name} ORBITAL HUB`);
      return;
    }

    playZxBeep('DOCK');
    setScreenMode('DOCKED');
    flightStateRef.current.frontShield = 100;
    flightStateRef.current.aftShield = 100;
    flightStateRef.current.laserHeat = 0;

    // Проверяем завершение курьерских миссий GoBell (ADVERT) в этой системе
    setMissions((prev) =>
      prev.map((m) => {
        if (m.status === 'ACTIVE' && m.type === 'ADVERT' && m.targetSystemId === currentSystemId) {
          setCredits((c) => c + m.rewardCredits);
          setEarnedGoBellKarma((k) => k + m.rewardKarma);
          onEarnKarmaAndBonus?.(m.rewardKarma, m.rewardCredits, m.title);
          setFlightMessage(
            `★ ДОСТАВКА GOBELL ЗАВЕРШЕНА: +${m.rewardCredits} CR И +${m.rewardKarma} К КАРМЕ! ★`
          );
          return {...m, status: 'COMPLETED'};
        }
        return m;
      })
    );
  }, [currentSystemId, onEarnKarmaAndBonus, playZxBeep, screenMode]);

  // ЗАКРЕПЛЕНИЕ / ОТКРЕПЛЕНИЕ НА СТАЦИОНАРНОЙ ОРБИТЕ ПЛАНЕТЫ (Клавиша X / Кнопка):
  // При закреплении осевое вращение планеты относительно корабля прекращается,
  // корабль двигается вокруг оси планеты вместе с планетой, а вся звёздная система вращается соответствующе!
  // Повторное нажатие на X открепляет корабль от стационарной орбиты.
  const handleToggleStationaryOrbit = useCallback(() => {
    const st = flightStateRef.current;
    setScreenMode('FLIGHT');

    // Повторное нажатие на X — открепляем корабль от стационарной орбиты
    if (st.stationaryOrbitPlanetId) {
      const prevPlanet = st.planets.find((p) => p.id === st.stationaryOrbitPlanetId);
      st.stationaryOrbitPlanetId = null;
      st.stationaryOrbitTurnRad = 0;
      setStationaryOrbitInfo(null);
      playZxBeep('DOCK');
      setFlightMessage(
        `🔓 КОРАБЛЬ ОТКРЕПЛЁН ОТ СТАЦИОНАРНОЙ ОРБИТЫ ${
          prevPlanet ? `«${prevPlanet.cleanName.toUpperCase()}»` : 'ПЛАНЕТЫ'
        } (X) · СВОБОДНЫЙ ПОЛЁТ И ОСЕВОЕ ВРАЩЕНИЕ ПЛАНЕТЫ ВОЗОБНОВЛЕНЫ`
      );
      return;
    }

    // Находим ближайшую планету системы для закрепления на стационарной орбите
    if (!st.planets || st.planets.length === 0) return;
    let nearestPlanet = st.planets[2] || st.planets[0];
    let bestDist = Infinity;
    let nearestCamPos: Vec3 = {x: 0, y: 0, z: 270};

    for (const p of st.planets) {
      const cosA = Math.cos(p.orbitAngle);
      const sinA = Math.sin(p.orbitAngle);
      const px = st.starPos.x + p.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x);
      const py = st.starPos.y + p.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y);
      const pz = st.starPos.z + p.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z);
      const d = Math.hypot(px, py, pz);
      if (d < bestDist) {
        bestDist = d;
        nearestPlanet = p;
        nearestCamPos = {x: px, y: py, z: pz};
      }
    }

    // Если корабль находился далеко от планеты или планета была за спиной — выводим корабль на стационарную орбиту перед планетой
    const isPlanetVisibleInFront =
      nearestCamPos.z >= nearestPlanet.radius3D * 1.25 &&
      bestDist <= nearestPlanet.radius3D * 6.5 &&
      Math.hypot(nearestCamPos.x, nearestCamPos.y) <= nearestCamPos.z * 0.75;

    if (!isPlanetVisibleInFront) {
      st.eclipticU = {x: 1, y: 0, z: 0};
      st.eclipticV = {x: 0, y: 0.16, z: 0.987};
      st.eclipticN = {x: 0, y: 0.987, z: -0.16};
      nearestPlanet.spinAngle = 0;
      const cosA = Math.cos(nearestPlanet.orbitAngle);
      const sinA = Math.sin(nearestPlanet.orbitAngle);
      const offsetX =
        nearestPlanet.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x);
      const offsetY =
        nearestPlanet.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y);
      const offsetZ =
        nearestPlanet.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z);
      const closeDist = Math.round(nearestPlanet.radius3D * 2.05);
      st.starPos = {
        x: -offsetX,
        y: -offsetY,
        z: closeDist - offsetZ,
      };
    }

    st.stationaryOrbitPlanetId = nearestPlanet.id;
    st.stationaryOrbitTurnRad = 0;
    st.speed = 0;
    st.targetSpeed = 0;
    st.pitchRate = 0;
    st.rollRate = 0;
    setThrottleUi(0);
    setStationaryOrbitInfo({
      planetId: nearestPlanet.id,
      planetName: nearestPlanet.name,
      cleanName: nearestPlanet.cleanName,
      color: nearestPlanet.color,
    });
    playZxBeep('MISSION');
    setFlightMessage(
      `🛰 ЗАКРЕПЛЁН НА СТАЦИОНАРНОЙ ОРБИТЕ «${nearestPlanet.cleanName.toUpperCase()}» (X): ОСЕВОЕ ВРАЩЕНИЕ ПЛАНЕТЫ ОСТАНОВЛЕНО, КОРАБЛЬ ДВИЖЕТСЯ ВОКРУГ ОСИ ВМЕСТЕ С ПЛАНЕТОЙ!`
    );
  }, [playZxBeep]);

  // Показать карточку объекта рядом с ним ТОЛЬКО когда объект находится в зоне действия курсора мыши и нажата клавиша I
  const handleTriggerObjectProfileAtCursor = useCallback(() => {
    const hovered = hoveredScreenTargetRef.current;
    if (hovered) {
      const canvas = canvasRef.current;
      const container = viewportContainerRef.current;
      let anchorLeftPx = hovered.canvasX;
      let anchorTopPx = hovered.canvasY;
      let viewportWidth = 760;
      let viewportHeight = 480;
      let screenRadiusPx = hovered.hitRadius;

      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        viewportWidth = container?.clientWidth || rect.width || 760;
        viewportHeight = container?.clientHeight || rect.height || 480;
        const canvasAspect = canvas.width / canvas.height;
        const rectAspect = rect.width / Math.max(1, rect.height);
        let renderW = rect.width;
        let renderH = rect.height;
        let offsetX = 0;
        let offsetY = 0;
        if (rectAspect > canvasAspect) {
          renderW = rect.height * canvasAspect;
          offsetX = (rect.width - renderW) / 2;
        } else {
          renderH = rect.width / canvasAspect;
          offsetY = (rect.height - renderH) / 2;
        }
        anchorLeftPx = offsetX + (hovered.canvasX / canvas.width) * renderW;
        anchorTopPx = offsetY + (hovered.canvasY / canvas.height) * renderH;
        screenRadiusPx = Math.max(12, (hovered.hitRadius / canvas.width) * renderW);
      }

      const nextProfile: SpaceObjectProfileData = {
        ...hovered.profile,
        canvasX: hovered.canvasX,
        canvasY: hovered.canvasY,
        anchorLeftPx,
        anchorTopPx,
        screenRadiusPx,
        viewportWidth,
        viewportHeight,
      };
      activeObjectProfileRef.current = nextProfile;
      setActiveObjectProfile(nextProfile);
      playZxBeep('MISSION');
    } else if (activeObjectProfileRef.current) {
      activeObjectProfileRef.current = null;
      setActiveObjectProfile(null);
    }
  }, [playZxBeep]);

  const handleFocusObjectFromProfile = useCallback(
    (profile: SpaceObjectProfileData) => {
      if (profile.kind === 'STAR') {
        handleNavigateSystemView('STAR_CLOSE');
      } else if (
        (profile.kind === 'PLANET' ||
          profile.kind === 'GROUP' ||
          profile.kind === 'BUSINESS' ||
          profile.kind === 'ADVERT') &&
        profile.planetOrder
      ) {
        const viewMap: Record<number, 'PLANET_1' | 'PLANET_2' | 'PLANET_3' | 'PLANET_4'> = {
          1: 'PLANET_1',
          2: 'PLANET_2',
          3: 'PLANET_3',
          4: 'PLANET_4',
        };
        handleNavigateSystemView(viewMap[profile.planetOrder] || 'PLANET_3');
      } else if (profile.kind === 'ASTEROID') {
        handleNavigateSystemView('ASTEROID_BELT');
      } else if (profile.entityId) {
        handleFocusLogisticsEntityInSight(profile.entityId);
      }
    },
    [handleFocusLogisticsEntityInSight, handleNavigateSystemView]
  );

  // Клавиатурное управление: WASD / Стрелки — полёт, I (при наведении курсора мыши на объект) — карточка объекта рядом с ним, X — стационарная орбита, F — стрельба, H — гиперпрыжок, T — стыковка
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.isContentEditable)
      ) {
        return;
      }

      const code = e.code;
      const key = e.key.toLowerCase();
      flightStateRef.current.keys[code] = true;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      if (code === 'KeyI' || key === 'i' || key === 'ш') {
        e.preventDefault();
        isKeyIDownRef.current = true;
        handleTriggerObjectProfileAtCursor();
      } else if (code === 'KeyX' || key === 'x' || key === 'ч' || key === 'х') {
        e.preventDefault();
        handleToggleStationaryOrbit();
      } else if (code === 'KeyF' || key === 'f' || key === 'а' || code === 'Space') {
        e.preventDefault();
        handleFireLaser();
      } else if (code === 'KeyH' || key === 'h' || key === 'р') {
        e.preventDefault();
        handleHyperspaceJump();
      } else if (code === 'KeyT' || key === 't' || key === 'е') {
        e.preventDefault();
        handleToggleDocking();
      } else if (code === 'KeyG' || key === 'g' || key === 'п') {
        e.preventDefault();
        setScreenMode((prev) => (prev === 'GALAXY_MAP' ? 'FLIGHT' : 'GALAXY_MAP'));
      } else if (code === 'KeyV' || key === 'v' || key === 'м') {
        e.preventDefault();
        handleFireHeavyGammaWeapon();
      } else if (code === 'Digit1') {
        e.preventDefault();
        handleNavigateSystemView('SYSTEM_EDGE');
      } else if (code === 'Digit2') {
        e.preventDefault();
        handleNavigateSystemView('STAR_CLOSE');
      } else if (code === 'Digit3') {
        e.preventDefault();
        handleNavigateSystemView('PLANET_1');
      } else if (code === 'Digit4') {
        e.preventDefault();
        handleNavigateSystemView('PLANET_2');
      } else if (code === 'Digit5') {
        e.preventDefault();
        handleNavigateSystemView('PLANET_3');
      } else if (code === 'Digit6') {
        e.preventDefault();
        handleNavigateSystemView('PLANET_4');
      } else if (code === 'Digit7') {
        e.preventDefault();
        handleNavigateSystemView('ASTEROID_BELT');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      flightStateRef.current.keys[e.code] = false;
      const key = e.key.toLowerCase();
      if (e.code === 'KeyI' || key === 'i' || key === 'ш') {
        isKeyIDownRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    handleFireHeavyGammaWeapon,
    handleFireLaser,
    handleHyperspaceJump,
    handleNavigateSystemView,
    handleToggleDocking,
    handleToggleStationaryOrbit,
    handleTriggerObjectProfileAtCursor,
    isOpen,
  ]);

  // Главный 60 FPS цикл рендеринга 3D Wireframe (в стиле ZX Spectrum 1984)
  useEffect(() => {
    if (!isOpen) return;
    let animId = 0;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const viewH = Math.floor(height * 0.72); // Верхние 72% — окно 3D космоса, нижние 28% — кокпит Cobra Mk III
          const cx = width / 2;
          const cy = viewH / 2;

          const st = flightStateRef.current;
          const keys = st.keys;

          // Обработка САМОЛЁТНОГО управления с учётом МАССЫ КОРАБЛЯ (чем тяжелее корабль — тем ниже манёвренность, но выше броня!):
          // W / ↑ — штурвал от себя (пикирование, нос вниз)
          // S / ↓ — штурвал на себя (кабрирование, нос вверх)
          // A / ← и D / → — крен крыльев влево / вправо (Roll)
          // E / Shift — прибавить тягу (РУД +), Q / Ctrl — убавить тягу (РУД -)
          const pitchInput =
            (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0) -
            (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0);
          const rollInput =
            (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) -
            (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
          const throttleInput =
            (keys['KeyE'] || keys['ShiftLeft'] || keys['ShiftRight'] || keys['Equal'] ? 1 : 0) -
            (keys['KeyQ'] || keys['ControlLeft'] || keys['ControlRight'] || keys['Minus'] ? 1 : 0);

          const isStationaryLocked = Boolean(st.stationaryOrbitPlanetId);

          if (isStationaryLocked) {
            st.targetSpeed = 0;
            st.speed = 0;
          } else if (throttleInput !== 0) {
            st.targetSpeed = Math.max(
              0,
              Math.min(st.maxSpeed, st.targetSpeed + throttleInput * 1.1)
            );
            setThrottleUi(Math.round((st.targetSpeed / Math.max(1, st.maxSpeed)) * 100));
          } else if (st.targetSpeed > st.maxSpeed) {
            st.targetSpeed = st.maxSpeed;
          }
          st.speed = isStationaryLocked ? 0 : st.speed * 0.9 + st.targetSpeed * 0.1;

          // Точный расчёт реального времени кадра (dtSec в секундах):
          // На максимальной скорости (100 ед./сек):
          // • Пролёт между соседними планетами (6 000 ед.) = ровно 60 сек (1 минута)!
          // • Пролёт от окраины Сферы Системы (30 000 ед.) до Звезды (0 ед.) = ровно 300 сек (5 минут)!
          const nowMs = performance.now();
          const dtSec =
            st.lastFrameTimeMs > 0
              ? Math.max(0.004, Math.min(0.08, (nowMs - st.lastFrameTimeMs) / 1000))
              : 1 / 60;
          st.lastFrameTimeMs = nowMs;

          // СОГЛАСОВАНИЕ СКОРОСТИ И МАНЁВРЕННОСТИ (ИМИТАЦИЯ ИНЕРЦИИ):
          // Чем ВЫШЕ текущая скорость — тем НИЖЕ манёвренность и тем сильнее инерционный занос на вираже!
          // Чем НИЖЕ скорость — тем РЕЗЧЕ и быстрее разворачивается корабль вокруг своей оси!
          const liveSpeedRatio = Math.max(0, Math.min(1, st.speed / Math.max(1, st.maxSpeed)));
          const liveSpeedInertiaFactor = 1 - liveSpeedRatio * 0.62; // 1.00 на месте -> 0.38 на полном форсаже
          const effectiveMf = Math.max(0.14, st.maneuverFactor * liveSpeedInertiaFactor);

          // Инерционное сохранение углового момента: на большой скорости и большой массе корабль дольше скользит по дуге
          const inertiaDamping = Math.min(
            0.95,
            0.81 + liveSpeedRatio * 0.09 + (1 - st.maneuverFactor) * 0.05
          );

          if (isStationaryLocked) {
            // На стационарной орбите корабль жёстко синхронизирован с осью планеты
            st.pitchRate = 0;
            st.rollRate = 0;
          } else {
            st.pitchRate = st.pitchRate * inertiaDamping + pitchInput * (0.0074 * effectiveMf);
            st.rollRate = st.rollRate * inertiaDamping + rollInput * (0.0126 * effectiveMf);
            st.bankAngle += st.rollRate;
            st.pitchAngle = Math.max(-1.2, Math.min(1.2, st.pitchAngle + st.pitchRate));
          }
          st.laserHeat = Math.max(0, st.laserHeat - 0.35);

          // ЗАРЯДКА ЭНЕРГИЕЙ ОТ СТЕПЕНИ БЛИЗОСТИ К ЦЕНТРАЛЬНОЙ ЗВЕЗДЕ В ЦЕНТРЕ СФЕРЫ:
          // На окраине сферы системы (дист = 30 000 ед.) зарядка минимальна (~3%),
          // а в непосредственной близости к звезде (дист ~ 260 ед., звезда на пол-экрана) — 100% MAX!
          const currentStarDist = Math.max(
            180,
            Math.hypot(st.starPos.x, st.starPos.y, st.starPos.z)
          );
          const solarProximityRatio = Math.max(
            0.03,
            Math.min(1, Math.pow(340 / currentStarDist, 0.72))
          );
          const liveSolarFluxPct = Math.round(solarProximityRatio * 100);
          st.solarFluxPct = liveSolarFluxPct;
          st.frameCounter = (st.frameCounter + 1) % 6000;
          if (st.frameCounter % 12 === 0) {
            setSolarChargeUi({
              fluxPct: liveSolarFluxPct,
              starDist: Math.round(currentStarDist),
              etaToStar: formatFlightEta(currentStarDist, st.speed > 1 ? st.speed : MAX_SYSTEM_SPEED),
            });
          }
          // Плавный расход Продовольствия (автономное нахождение в космосе) и Воды (питьё и источник кислорода O₂)
          if (st.frameCounter % 180 === 0 && screenMode === 'FLIGHT') {
            setFoodStockPct((prev) => Math.max(10, prev - 1));
            setWaterOxygenStockPct((prev) => Math.max(10, prev - 1));
          }

          // Скорость пополнения аккумулятора энергии и щитов напрямую зависит от близости к звезде
          const solarEnergyGain = 0.04 + solarProximityRatio * 0.62;
          st.energy = Math.min(100, st.energy + solarEnergyGain);
          st.frontShield = Math.min(
            100,
            st.frontShield + 0.02 + solarProximityRatio * 0.14 + st.protectionFactor * 0.05
          );
          st.aftShield = Math.min(
            100,
            st.aftShield + 0.02 + solarProximityRatio * 0.14 + st.protectionFactor * 0.05
          );

          // Чёрный фон ZX Spectrum
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);

          // Эффект гиперпрыжка (Hyperspace Tunnel)
          if (st.hyperspaceTimer > 0) {
            st.hyperspaceTimer -= 1;
            const progress = (55 - st.hyperspaceTimer) / 55;
            for (let r = 1; r <= 8; r++) {
              const radius = ((progress * 500 + r * 55) % 450) + 10;
              ctx.strokeStyle = r % 2 === 0 ? '#00ffff' : '#ff00ff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
              `>>> HYPERSPACE JUMP TO ${GALAXY_SYSTEMS[st.hyperspaceTargetId].name} <<<`,
              cx,
              cy
            );

            if (st.hyperspaceTimer === 0) {
              const nextSys = st.hyperspaceTargetId;
              setCurrentSystemId(nextSys);
              spawnSystemEntities(nextSys);
              setFlightMessage(`ARRIVED IN ${GALAXY_SYSTEMS[nextSys].name} · SCANNER ACTIVE`);
            }
          } else if (screenMode === 'FLIGHT') {
            const cosRoll = Math.cos(st.rollRate);
            const sinRoll = Math.sin(st.rollRate);
            const cosPitch = Math.cos(st.pitchRate);
            const sinPitch = Math.sin(st.pitchRate);

            // =========================================================================
            // СЦЕНА ВНУТРИ 3D-СФЕРЫ ЗВЁЗДНОЙ СИСТЕМЫ (R = 30 000):
            // • В центре сферы — Звезда (жёлтый кружочек с лучиками, зарядка энергией от близости)
            // • Внутри сферы — 4 Планеты (I. Меркурий R=6000, II. Венера R=12000, III. Земля R=18000, IV. Марс R=24000)
            //   и Пояс Астероидов (R=27000)
            // • С окраины сцены все планеты и звезда выглядят точками разных цветов с текстовым маркером
            // • Пролёт от окраины (30 000) к Звезде (0) на макс. скорости (100 ед/с) = ровно 5 минут (300 с),
            //   между планетами (шаг 6 000 ед.) = ровно 1 минута (60 с)!
            // =========================================================================
            const rotateCamVec = (v: Vec3): Vec3 => {
              const x1 = v.x * cosRoll - v.y * sinRoll;
              const y1 = v.x * sinRoll + v.y * cosRoll;
              const y2 = y1 * cosPitch - v.z * sinPitch;
              const z2 = y1 * sinPitch + v.z * cosPitch;
              return {x: x1, y: y2, z: z2};
            };

            // Вращаем 3D-базис плоскости эклиптики и позицию Центральной Звезды
            st.eclipticU = rotateCamVec(st.eclipticU);
            st.eclipticV = rotateCamVec(st.eclipticV);
            st.eclipticN = rotateCamVec(st.eclipticN);

            const rotStar = rotateCamVec(st.starPos);
            // Точное смещение по реальному времени dtSec: при st.speed = 100 ед/с корабль проходит 6000 ед за 60 сек (1 мин) и 30000 ед за 300 сек (5 мин)!
            const forwardStep = st.speed * dtSec;
            st.starPos = {
              x: rotStar.x,
              y: rotStar.y,
              z: rotStar.z - forwardStep,
            };

            // =========================================================================
            // РЕЖИМ СТАЦИОНАРНОЙ ОРБИТЫ (КЛАВИША X):
            // 1) Осевое вращение выбранной планеты относительно корабля полностью прекращается!
            // 2) Корабль двигается вокруг оси планеты вместе с планетой (с её угловой скоростью),
            //    поэтому вся остальная звёздная система (Звезда, пунктирные орбиты, другие планеты,
            //    Пояс Астероидов и внешняя Сфера Системы) синхронно вращается вокруг оси планеты!
            // =========================================================================
            const lockedPlanet = st.stationaryOrbitPlanetId
              ? st.planets.find((p) => p.id === st.stationaryOrbitPlanetId) || null
              : null;

            let lockedPlanetCamPos: Vec3 | null = null;
            if (lockedPlanet) {
              const oldCosA = Math.cos(lockedPlanet.orbitAngle);
              const oldSinA = Math.sin(lockedPlanet.orbitAngle);
              lockedPlanetCamPos = {
                x:
                  st.starPos.x +
                  lockedPlanet.orbitRadius *
                    (oldCosA * st.eclipticU.x + oldSinA * st.eclipticV.x),
                y:
                  st.starPos.y +
                  lockedPlanet.orbitRadius *
                    (oldCosA * st.eclipticU.y + oldSinA * st.eclipticV.y),
                z:
                  st.starPos.z +
                  lockedPlanet.orbitRadius *
                    (oldCosA * st.eclipticU.z + oldSinA * st.eclipticV.z),
              };
            }

            // Обновляем орбитальное и осевое движение всех планет системы
            for (const planet of st.planets) {
              const isHoveringThisPlanetObj =
                (hoveredPlanetObjRef.current &&
                  hoveredPlanetObjRef.current.planetId === planet.id) ||
                isHoveringPopupRef.current;

              planet.orbitAngle += planet.orbitSpeed * (dtSec * 60);

              if (lockedPlanet && planet.id === lockedPlanet.id) {
                // Планета вращается вокруг своей оси в пространстве, и корабль на стационарной орбите
                // вращается вокруг оси планеты ТОЧНО С ТОЙ ЖЕ УГЛОВОЙ СКОРОСТЬЮ!
                const dSpin = planet.spinSpeed * (dtSec * 60);
                planet.spinAngle += dSpin;
                st.stationaryOrbitTurnRad += dSpin;

                // Поворачиваем систему координат внешней звёздной системы на -dSpin вокруг оси планеты (st.eclipticN),
                // благодаря чему сама планета и её объекты GoBell стоят абсолютно неподвижно перед кораблём,
                // а вся звёздная система вращается вокруг оси планеты!
                const cosDS = Math.cos(dSpin);
                const sinDS = Math.sin(dSpin);
                const nextU: Vec3 = {
                  x: cosDS * st.eclipticU.x - sinDS * st.eclipticV.x,
                  y: cosDS * st.eclipticU.y - sinDS * st.eclipticV.y,
                  z: cosDS * st.eclipticU.z - sinDS * st.eclipticV.z,
                };
                const nextV: Vec3 = {
                  x: sinDS * st.eclipticU.x + cosDS * st.eclipticV.x,
                  y: sinDS * st.eclipticU.y + cosDS * st.eclipticV.y,
                  z: sinDS * st.eclipticU.z + cosDS * st.eclipticV.z,
                };
                const normU = Math.hypot(nextU.x, nextU.y, nextU.z) || 1;
                const normV = Math.hypot(nextV.x, nextV.y, nextV.z) || 1;
                st.eclipticU = {x: nextU.x / normU, y: nextU.y / normU, z: nextU.z / normU};
                st.eclipticV = {x: nextV.x / normV, y: nextV.y / normV, z: nextV.z / normV};
              } else if (!isHoveringThisPlanetObj) {
                planet.spinAngle += planet.spinSpeed * (dtSec * 60);
              }
            }

            if (lockedPlanet && lockedPlanetCamPos) {
              const newCosA = Math.cos(lockedPlanet.orbitAngle);
              const newSinA = Math.sin(lockedPlanet.orbitAngle);
              st.starPos = {
                x:
                  lockedPlanetCamPos.x -
                  lockedPlanet.orbitRadius *
                    (newCosA * st.eclipticU.x + newSinA * st.eclipticV.x),
                y:
                  lockedPlanetCamPos.y -
                  lockedPlanet.orbitRadius *
                    (newCosA * st.eclipticU.y + newSinA * st.eclipticV.y),
                z:
                  lockedPlanetCamPos.z -
                  lockedPlanet.orbitRadius *
                    (newCosA * st.eclipticU.z + newSinA * st.eclipticV.z),
              };
            } else {
              // ОГРАНИЧЕНИЕ ЗОНЫ СИСТЕМЫ СФЕРОЙ (R = 30 000 вокруг Центральной Звезды):
              const distFromStarCenter = Math.hypot(st.starPos.x, st.starPos.y, st.starPos.z);
              if (distFromStarCenter > SYSTEM_SPHERE_RADIUS) {
                const clampRatio = SYSTEM_SPHERE_RADIUS / distFromStarCenter;
                st.starPos.x *= clampRatio;
                st.starPos.y *= clampRatio;
                st.starPos.z *= clampRatio;
              }
            }

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, width, viewH);
            ctx.clip();

            // 1. РЕНДЕР ОГРАНИЧИВАЮЩЕЙ 3D-СФЕРЫ СИСТЕМЫ (R = 30 000 вокруг Центральной Звезды)
            // Тонкая сферическая сетка меридианов и параллелей границы звёздной системы
            const sphereLatitudes = [-45, 0, 45];
            const sphereSegments = 120;
            ctx.save();
            ctx.setLineDash([4, 10]);
            ctx.strokeStyle = lockedPlanet
              ? 'rgba(56, 189, 248, 0.24)'
              : 'rgba(56, 189, 248, 0.14)';
            ctx.lineWidth = lockedPlanet ? 1.05 : 0.85;
            for (const latDeg of sphereLatitudes) {
              const latRad = (latDeg * Math.PI) / 180;
              const cLat = Math.cos(latRad);
              const sLat = Math.sin(latRad);
              ctx.beginPath();
              let pen = false;
              for (let s = 0; s <= sphereSegments; s++) {
                const lon = (s / sphereSegments) * Math.PI * 2;
                const cLon = Math.cos(lon);
                const sLon = Math.sin(lon);
                const dirX =
                  cLat * (cLon * st.eclipticU.x + sLon * st.eclipticV.x) + sLat * st.eclipticN.x;
                const dirY =
                  cLat * (cLon * st.eclipticU.y + sLon * st.eclipticV.y) + sLat * st.eclipticN.y;
                const dirZ =
                  cLat * (cLon * st.eclipticU.z + sLon * st.eclipticV.z) + sLat * st.eclipticN.z;

                const bx = st.starPos.x + dirX * SYSTEM_SPHERE_RADIUS;
                const by = st.starPos.y + dirY * SYSTEM_SPHERE_RADIUS;
                const bz = st.starPos.z + dirZ * SYSTEM_SPHERE_RADIUS;
                if (bz > 60) {
                  const bsx = cx + (bx * 380) / bz;
                  const bsy = cy - (by * 380) / bz;
                  if (bsx > -1600 && bsx < width + 1600 && bsy > -1600 && bsy < viewH + 1600) {
                    if (!pen) {
                      ctx.moveTo(bsx, bsy);
                      pen = true;
                    } else {
                      ctx.lineTo(bsx, bsy);
                    }
                  } else {
                    pen = false;
                  }
                } else {
                  pen = false;
                }
              }
              ctx.stroke();
            }
            // Меридианы внешней Сферы Системы
            for (let m = 0; m < 6; m++) {
              const lon = (m / 6) * Math.PI;
              const cLon = Math.cos(lon);
              const sLon = Math.sin(lon);
              const mVecX = cLon * st.eclipticU.x + sLon * st.eclipticV.x;
              const mVecY = cLon * st.eclipticU.y + sLon * st.eclipticV.y;
              const mVecZ = cLon * st.eclipticU.z + sLon * st.eclipticV.z;
              ctx.beginPath();
              let pen = false;
              for (let s = 0; s <= sphereSegments; s++) {
                const theta = (s / sphereSegments) * Math.PI * 2;
                const cT = Math.cos(theta);
                const sT = Math.sin(theta);
                const bx = st.starPos.x + (cT * mVecX + sT * st.eclipticN.x) * SYSTEM_SPHERE_RADIUS;
                const by = st.starPos.y + (cT * mVecY + sT * st.eclipticN.y) * SYSTEM_SPHERE_RADIUS;
                const bz = st.starPos.z + (cT * mVecZ + sT * st.eclipticN.z) * SYSTEM_SPHERE_RADIUS;
                if (bz > 60) {
                  const bsx = cx + (bx * 380) / bz;
                  const bsy = cy - (by * 380) / bz;
                  if (bsx > -1600 && bsx < width + 1600 && bsy > -1600 && bsy < viewH + 1600) {
                    if (!pen) {
                      ctx.moveTo(bsx, bsy);
                      pen = true;
                    } else {
                      ctx.lineTo(bsx, bsy);
                    }
                  } else {
                    pen = false;
                  }
                } else {
                  pen = false;
                }
              }
              ctx.stroke();
            }
            ctx.restore();

            // 2. РЕНДЕР ЭКЛИПТИКИ СИСТЕМЫ: Еле заметные пунктирные орбиты 4 планет (R = 6000, 12000, 18000, 24000)
            const frameProjectedPlanetObjects: ProjectedPlanetObjectHit[] = [];
            const frameScreenTargets: ProjectedScreenTargetHit[] = [];

            for (const planet of st.planets) {
              const orbitSegments = 180;
              ctx.save();
              ctx.setLineDash([3, 7]); // Еле заметный пунктир орбиты в плоскости эклиптики
              ctx.lineWidth = planet.isMainWorld ? 1.15 : 0.9;
              ctx.strokeStyle = lockedPlanet
                ? 'rgba(148, 163, 184, 0.34)'
                : 'rgba(148, 163, 184, 0.22)';
              ctx.beginPath();
              let penDown = false;
              for (let s = 0; s <= orbitSegments; s++) {
                const theta = (s / orbitSegments) * Math.PI * 2;
                const cosT = Math.cos(theta);
                const sinT = Math.sin(theta);
                const ox =
                  st.starPos.x +
                  planet.orbitRadius * (cosT * st.eclipticU.x + sinT * st.eclipticV.x);
                const oy =
                  st.starPos.y +
                  planet.orbitRadius * (cosT * st.eclipticU.y + sinT * st.eclipticV.y);
                const oz =
                  st.starPos.z +
                  planet.orbitRadius * (cosT * st.eclipticU.z + sinT * st.eclipticV.z);

                if (oz > 40) {
                  const osx = cx + (ox * 380) / oz;
                  const osy = cy - (oy * 380) / oz;
                  if (osx > -1600 && osx < width + 1600 && osy > -1600 && osy < viewH + 1600) {
                    if (!penDown) {
                      ctx.moveTo(osx, osy);
                      penDown = true;
                    } else {
                      ctx.lineTo(osx, osy);
                    }
                  } else {
                    penDown = false;
                  }
                } else {
                  penDown = false;
                }
              }
              ctx.stroke();
              ctx.restore();
            }

            // 3. РЕНДЕР ПОЯСА АСТЕРОИДОВ (R = 26 600 .. 27 500 за 4-й планетой Марс-IV) БЕЗ ТЕКСТОВЫХ ПОДПИСЕЙ НА ЭКРАНЕ:
            for (let i = 0; i < st.asteroids.length; i++) {
              const ast = st.asteroids[i];
              ast.orbitAngle += ast.orbitSpeed * (dtSec * 60);
              ast.rotAngle += ast.rotSpeed * (dtSec * 60);

              const cosA = Math.cos(ast.orbitAngle);
              const sinA = Math.sin(ast.orbitAngle);
              const ax =
                st.starPos.x +
                ast.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x) +
                ast.yOffset * st.eclipticN.x;
              const ay =
                st.starPos.y +
                ast.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y) +
                ast.yOffset * st.eclipticN.y;
              const az =
                st.starPos.z +
                ast.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z) +
                ast.yOffset * st.eclipticN.z;

              if (az > 30) {
                const asx = cx + (ax * 380) / az;
                const asy = cy - (ay * 380) / az;
                if (asx >= 0 && asx <= width && asy >= 0 && asy <= viewH) {
                  const astDist = Math.hypot(ax, ay, az);
                  const astScreenR = Math.max(1.3, Math.min(28, (ast.size3D * 380) / az));
                  const renderColor = ast.revealed ? ast.color : '#94a3b8';
                  ctx.fillStyle = renderColor;
                  ctx.strokeStyle = renderColor;

                  if (astScreenR <= 2.8 && !ast.revealed) {
                    ctx.fillRect(asx - 1, asy - 1, 2.2, 2.2);
                  } else {
                    ctx.lineWidth = ast.revealed ? 2.1 : 1.2;
                    ctx.beginPath();
                    for (let v = 0; v < 6; v++) {
                      const va = ast.rotAngle + (v * Math.PI * 2) / 6;
                      const rad = Math.max(5, astScreenR) * (v % 2 === 0 ? 1.0 : 0.72);
                      const vx = asx + Math.cos(va) * rad;
                      const vy = asy + Math.sin(va) * rad;
                      if (v === 0) ctx.moveTo(vx, vy);
                      else ctx.lineTo(vx, vy);
                    }
                    ctx.closePath();
                    ctx.stroke();

                    // Ценный булыжник после огневого контакта выделяется только геометрической цветной рамкой (без текста)
                    if (ast.revealed && ast.isValuable && ast.elementSymbol) {
                      const elMeta = ASTEROID_PERIODIC_ELEMENTS[ast.elementSymbol];
                      const boxR = Math.max(8, astScreenR + 4);
                      ctx.strokeStyle = elMeta.color;
                      ctx.lineWidth = 1.4;
                      ctx.strokeRect(asx - boxR, asy - boxR, boxR * 2, boxR * 2);
                    }
                  }

                  if (astScreenR >= 3.2 || ast.revealed) {
                    const elMeta =
                      ast.revealed && ast.elementSymbol
                        ? ASTEROID_PERIODIC_ELEMENTS[ast.elementSymbol]
                        : null;
                    frameScreenTargets.push({
                      id: ast.id,
                      canvasX: asx,
                      canvasY: asy,
                      hitRadius: Math.max(14, astScreenR + 8),
                      priority: ast.revealed ? 60 : 25,
                      profile: {
                        id: ast.id,
                        kind: 'ASTEROID',
                        systemTag: `AST-${i + 1}`,
                        color: elMeta ? elMeta.color : '#94a3b8',
                        name: elMeta ? `Астероид (${elMeta.nameRu})` : 'Астероид',
                        nickname: elMeta
                          ? `элемент ${elMeta.displaySymbol} (пояс астероидов)`
                          : 'объект пояса астероидов',
                        description: elMeta
                          ? `Источник минерального сырья в поясе астероидов (${elMeta.nameRu} ${elMeta.displaySymbol} · ${elMeta.sellPriceCr} CR/т).`
                          : 'Каменно-металлическая глыба внешнего пояса астероидов (R = 27 000 ед.). Огневой контакт лазером открывает химический состав породы.',
                        groupsTitle: 'горнодобывающий сектор (Правительство Марса · #GO-MARS)',
                        groupsDescription:
                          'Контракты на разведку пояса астероидов, расчистку траекторий и поставку редких элементов периодической системы.',
                        groupTag: 'GO-MARS',
                        businessesTitle: 'сырьевая биржа ( скупка элементов по пропорциям Земли )',
                        businessesDescription: elMeta
                          ? `Приём руды ${elMeta.nameRu} (${elMeta.displaySymbol}) по котировке ${elMeta.sellPriceCr} CR за тонну.`
                          : 'Оценка и приём ценных элементов периодической системы после лазерного спектрального контакта.',
                        karmaPlus: 12,
                        karmaMinus: 0,
                        distanceUnits: Math.round(astDist),
                        coordsLabel: `R=${Math.round(ast.orbitRadius)} ед.`,
                        planetOrder: 4,
                        planetCleanName: 'Марс',
                        asteroidId: ast.id,
                        asteroidRevealed: ast.revealed,
                        asteroidIsValuable: ast.isValuable,
                        elementSymbol: ast.elementSymbol,
                      },
                    });
                  }
                }
              }
            }

            // 4. Собираем небесные тела системы (Центральную Звезду + 4 Планеты) и сортируем по дальности Z
            type CelestialRenderItem =
              | {kind: 'STAR'; z: number; dist: number; pos: Vec3}
              | {kind: 'PLANET'; z: number; dist: number; pos: Vec3; planet: SystemPlanet};

            const celestials: CelestialRenderItem[] = [];
            if (st.starPos.z > 25) {
              celestials.push({
                kind: 'STAR',
                z: st.starPos.z,
                dist: Math.hypot(st.starPos.x, st.starPos.y, st.starPos.z),
                pos: st.starPos,
              });
            }

            for (const planet of st.planets) {
              const cosA = Math.cos(planet.orbitAngle);
              const sinA = Math.sin(planet.orbitAngle);
              const px =
                st.starPos.x +
                planet.orbitRadius * (cosA * st.eclipticU.x + sinA * st.eclipticV.x);
              const py =
                st.starPos.y +
                planet.orbitRadius * (cosA * st.eclipticU.y + sinA * st.eclipticV.y);
              const pz =
                st.starPos.z +
                planet.orbitRadius * (cosA * st.eclipticU.z + sinA * st.eclipticV.z);
              if (pz > 25) {
                celestials.push({
                  kind: 'PLANET',
                  z: pz,
                  dist: Math.hypot(px, py, pz),
                  pos: {x: px, y: py, z: pz},
                  planet,
                });
              }
            }

            celestials.sort((a, b) => b.z - a.z);

            for (const item of celestials) {
              if (item.kind === 'STAR') {
                // =========================================================================
                // 4A. ЦЕНТРАЛЬНАЯ ЗВЕЗДА В ЦЕНТРЕ СФЕРЫ СИСТЕМЫ (БЕЗ ТЕКСТОВЫХ ПОДПИСЕЙ НА ЭКРАНЕ)
                // =========================================================================
                const isOldGalaxyStar = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
                const sz = Math.max(85, item.pos.z);
                const sx = cx + (item.pos.x * 380) / sz;
                const sy = cy - (item.pos.y * 380) / sz;

                const rawStarRadius = (135 * 380) / sz;
                const starRadius = Math.max(3.0, Math.min(viewH * 0.47, rawStarRadius));

                if (
                  sx + starRadius * 2.2 >= -120 &&
                  sx - starRadius * 2.2 <= width + 120 &&
                  sy + starRadius * 2.2 >= -120 &&
                  sy - starRadius * 2.2 <= viewH + 120
                ) {
                  const haloGrad = ctx.createRadialGradient(
                    sx,
                    sy,
                    starRadius * 0.25,
                    sx,
                    sy,
                    starRadius * 2.2 + 8
                  );
                  if (isOldGalaxyStar) {
                    haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
                    haloGrad.addColorStop(0.45, 'rgba(232, 121, 249, 0.55)');
                    haloGrad.addColorStop(1, 'rgba(232, 121, 249, 0)');
                  } else {
                    haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.98)');
                    haloGrad.addColorStop(0.45, 'rgba(250, 204, 21, 0.45)');
                    haloGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
                  }
                  ctx.fillStyle = haloGrad;
                  ctx.beginPath();
                  ctx.arc(sx, sy, starRadius * 2.2 + 8, 0, Math.PI * 2);
                  ctx.fill();

                  const numRays = isOldGalaxyStar ? 24 : 16;
                  const rayRot = st.frameCounter * (isOldGalaxyStar ? 0.024 : 0.008);
                  ctx.strokeStyle = isOldGalaxyStar ? '#e879f9' : '#fde047';
                  ctx.lineWidth = starRadius > 45 ? 2.2 : starRadius > 12 ? 1.5 : 1.15;
                  ctx.beginPath();
                  for (let r = 0; r < numRays; r++) {
                    const angle = rayRot + (r * Math.PI * 2) / numRays;
                    const isLongRay = r % 2 === 0;
                    const innerR = starRadius * 1.08;
                    const outerR =
                      starRadius < 6
                        ? starRadius + (isLongRay ? 11.5 : 6.5)
                        : starRadius * (isLongRay ? 1.65 : 1.3) + (isLongRay ? 8 : 4);
                    ctx.moveTo(sx + Math.cos(angle) * innerR, sy + Math.sin(angle) * innerR);
                    ctx.lineTo(sx + Math.cos(angle) * outerR, sy + Math.sin(angle) * outerR);
                  }
                  ctx.stroke();

                  ctx.fillStyle = isOldGalaxyStar ? '#f5d0fe' : '#fde047';
                  ctx.strokeStyle = isOldGalaxyStar ? '#e879f9' : '#fef9c3';
                  ctx.lineWidth = starRadius > 30 ? 2.2 : 1.2;
                  ctx.beginPath();
                  ctx.arc(sx, sy, starRadius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();

                  if (starRadius > 24) {
                    ctx.save();
                    ctx.setLineDash([6, 6]);
                    ctx.strokeStyle = isOldGalaxyStar
                      ? 'rgba(232, 121, 249, 0.75)'
                      : 'rgba(254, 249, 195, 0.55)';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.arc(sx, sy, starRadius * 0.72, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(sx, sy, starRadius * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                  }

                  // Регистрируем Звезду (Солнце) для вызова карточки профиля по клавише I при наведении курсора
                  frameScreenTargets.push({
                    id: `star-system-${currentSystemId}`,
                    canvasX: sx,
                    canvasY: sy,
                    hitRadius: Math.max(20, starRadius + 10),
                    priority: 50,
                    profile: {
                      id: `star-system-${currentSystemId}`,
                      kind: 'STAR',
                      systemTag: 'SOL-STAR',
                      color: isOldGalaxyStar ? '#e879f9' : '#fde047',
                      name: isOldGalaxyStar ? 'Реликтовая звезда' : 'Солнце',
                      nickname: 'звезда',
                      description: isOldGalaxyStar
                        ? 'Источник возобновляемой энергии в системе · реликтовое гамма-ядро лавинообразного размыкания локальных узлов'
                        : 'Источник возобновляемой энергии в системе',
                      groupsTitle: 'энергетическое ядро системы (#SOLAR-CORE)',
                      groupsDescription:
                        'Центр гравитационного притяжения плоскости эклиптики 4 планет и беспроводной зарядки солнечных накопителей кораблей.',
                      businessesTitle: 'солнечная генерация (бесплатная зарядка щитов и реактора)',
                      businessesDescription: `Текущий поток солнечной зарядки корабля: ${st.solarFluxPct}% (максимум 100% на ближней гелиостационарной дистанции).`,
                      karmaPlus: 100,
                      karmaMinus: 0,
                      distanceUnits: Math.round(item.dist),
                      coordsLabel: 'Центр сферы R=0 ед.',
                      solarFluxPct: st.solarFluxPct,
                    },
                  });
                }
              } else {
                // =========================================================================
                // 4B. ПЛАНЕТА СИСТЕМЫ (БЕЗ ТЕКСТОВЫХ ПОДПИСЕЙ НА ЭКРАНЕ — ПРОФИЛЬ ПО КЛАВИШЕ I)
                // =========================================================================
                const p = item.planet;
                const pz = Math.max(82, item.pos.z);
                const psx = cx + (item.pos.x * 380) / pz;
                const psy = cy - (item.pos.y * 380) / pz;

                const rawPlanetR = (p.radius3D * 380) / pz;
                const planetR = Math.max(3.2, Math.min(viewH * 0.47, rawPlanetR));

                if (
                  psx + planetR * 1.4 >= -120 &&
                  psx - planetR * 1.4 <= width + 120 &&
                  psy + planetR * 1.4 >= -120 &&
                  psy - planetR * 1.4 <= viewH + 120
                ) {
                  if (rawPlanetR < 8.5) {
                    // На большой дистанции — чистая цветная точка и прицельное кольцо без каких-либо подписей
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(psx, psy, 3.6, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.1;
                    ctx.beginPath();
                    ctx.arc(psx, psy, 6.8, 0, Math.PI * 2);
                    ctx.stroke();
                  } else {
                    // Полноценная 3D-сфера с меридианами, широтами (параллелями) и полюсами без текстовых надписей
                    ctx.fillStyle = '#020710';
                    ctx.beginPath();
                    ctx.arc(psx, psy, planetR, 0, Math.PI * 2);
                    ctx.fill();

                    const cosSpin = Math.cos(p.spinAngle);
                    const sinSpin = Math.sin(p.spinAngle);
                    const pU: Vec3 = {
                      x: cosSpin * st.eclipticU.x + sinSpin * st.eclipticV.x,
                      y: cosSpin * st.eclipticU.y + sinSpin * st.eclipticV.y,
                      z: cosSpin * st.eclipticU.z + sinSpin * st.eclipticV.z,
                    };
                    const pV: Vec3 = {
                      x: -sinSpin * st.eclipticU.x + cosSpin * st.eclipticV.x,
                      y: -sinSpin * st.eclipticU.y + cosSpin * st.eclipticV.y,
                      z: -sinSpin * st.eclipticU.z + cosSpin * st.eclipticV.z,
                    };
                    const pN = st.eclipticN;

                    const projectSphereNormal = (nx: number, ny: number, nz: number) => ({
                      x: psx + nx * planetR,
                      y: psy - ny * planetR,
                      front: nz <= 0.05,
                    });

                    const latitudesDeg = planetR > 16 ? [-60, -30, 0, 30, 60] : [-35, 0, 35];
                    const latSteps = planetR > 40 ? 36 : 20;

                    for (const latDeg of latitudesDeg) {
                      const latRad = (latDeg * Math.PI) / 180;
                      const cosLat = Math.cos(latRad);
                      const sinLat = Math.sin(latRad);
                      const isEquator = latDeg === 0;

                      for (let s = 0; s < latSteps; s++) {
                        const lon1 = (s / latSteps) * Math.PI * 2;
                        const lon2 = ((s + 1) / latSteps) * Math.PI * 2;

                        const n1x =
                          cosLat * (Math.cos(lon1) * pU.x + Math.sin(lon1) * pV.x) + sinLat * pN.x;
                        const n1y =
                          cosLat * (Math.cos(lon1) * pU.y + Math.sin(lon1) * pV.y) + sinLat * pN.y;
                        const n1z =
                          cosLat * (Math.cos(lon1) * pU.z + Math.sin(lon1) * pV.z) + sinLat * pN.z;

                        const n2x =
                          cosLat * (Math.cos(lon2) * pU.x + Math.sin(lon2) * pV.x) + sinLat * pN.x;
                        const n2y =
                          cosLat * (Math.cos(lon2) * pU.y + Math.sin(lon2) * pV.y) + sinLat * pN.y;
                        const n2z =
                          cosLat * (Math.cos(lon2) * pU.z + Math.sin(lon2) * pV.z) + sinLat * pN.z;

                        const pt1 = projectSphereNormal(n1x, n1y, n1z);
                        const pt2 = projectSphereNormal(n2x, n2y, n2z);

                        if (pt1.front || pt2.front) {
                          ctx.strokeStyle = isEquator ? '#fef08a' : p.color;
                          ctx.globalAlpha = isEquator ? 0.92 : 0.68;
                          ctx.lineWidth = isEquator ? 1.5 : 1.0;
                          ctx.beginPath();
                          ctx.moveTo(pt1.x, pt1.y);
                          ctx.lineTo(pt2.x, pt2.y);
                          ctx.stroke();
                        } else if (planetR > 28 && s % 2 === 0) {
                          ctx.strokeStyle = p.color;
                          ctx.globalAlpha = 0.18;
                          ctx.lineWidth = 0.8;
                          ctx.beginPath();
                          ctx.moveTo(pt1.x, pt1.y);
                          ctx.lineTo(pt2.x, pt2.y);
                          ctx.stroke();
                        }
                      }
                    }

                    const numMeridians = planetR > 20 ? 12 : 6;
                    const merSteps = planetR > 40 ? 22 : 12;

                    for (let m = 0; m < numMeridians; m++) {
                      const lonRad = (m / numMeridians) * Math.PI * 2;
                      const cosLon = Math.cos(lonRad);
                      const sinLon = Math.sin(lonRad);
                      const isPrimeMeridian = m === 0 || m === numMeridians / 2;

                      const mDirX = cosLon * pU.x + sinLon * pV.x;
                      const mDirY = cosLon * pU.y + sinLon * pV.y;
                      const mDirZ = cosLon * pU.z + sinLon * pV.z;

                      for (let s = 0; s < merSteps; s++) {
                        const lat1 = -Math.PI / 2 + (s / merSteps) * Math.PI;
                        const lat2 = -Math.PI / 2 + ((s + 1) / merSteps) * Math.PI;

                        const n1x = Math.cos(lat1) * mDirX + Math.sin(lat1) * pN.x;
                        const n1y = Math.cos(lat1) * mDirY + Math.sin(lat1) * pN.y;
                        const n1z = Math.cos(lat1) * mDirZ + Math.sin(lat1) * pN.z;

                        const n2x = Math.cos(lat2) * mDirX + Math.sin(lat2) * pN.x;
                        const n2y = Math.cos(lat2) * mDirY + Math.sin(lat2) * pN.y;
                        const n2z = Math.cos(lat2) * mDirZ + Math.sin(lat2) * pN.z;

                        const pt1 = projectSphereNormal(n1x, n1y, n1z);
                        const pt2 = projectSphereNormal(n2x, n2y, n2z);

                        if (pt1.front || pt2.front) {
                          ctx.strokeStyle = isPrimeMeridian ? '#ffffff' : p.color;
                          ctx.globalAlpha = isPrimeMeridian ? 0.85 : 0.62;
                          ctx.lineWidth = isPrimeMeridian ? 1.3 : 0.95;
                          ctx.beginPath();
                          ctx.moveTo(pt1.x, pt1.y);
                          ctx.lineTo(pt2.x, pt2.y);
                          ctx.stroke();
                        } else if (planetR > 28 && s % 2 === 0) {
                          ctx.strokeStyle = p.color;
                          ctx.globalAlpha = 0.16;
                          ctx.lineWidth = 0.75;
                          ctx.beginPath();
                          ctx.moveTo(pt1.x, pt1.y);
                          ctx.lineTo(pt2.x, pt2.y);
                          ctx.stroke();
                        }
                      }
                    }
                    ctx.globalAlpha = 1.0;

                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = planetR > 35 ? 2.2 : 1.5;
                    ctx.beginPath();
                    ctx.arc(psx, psy, planetR, 0, Math.PI * 2);
                    ctx.stroke();

                    // Геометрические шпили полюсов без текстовых подписей
                    const northPolePt = projectSphereNormal(pN.x, pN.y, pN.z);
                    const southPolePt = projectSphereNormal(-pN.x, -pN.y, -pN.z);

                    const axisSpike = Math.max(4, Math.min(18, planetR * 0.14));
                    const northTipX = psx + pN.x * (planetR + axisSpike);
                    const northTipY = psy - pN.y * (planetR + axisSpike);
                    const southTipX = psx - pN.x * (planetR + axisSpike);
                    const southTipY = psy + pN.y * (planetR + axisSpike);

                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.moveTo(northPolePt.x, northPolePt.y);
                    ctx.lineTo(northTipX, northTipY);
                    ctx.moveTo(southPolePt.x, southPolePt.y);
                    ctx.lineTo(southTipX, southTipY);
                    ctx.stroke();

                    const poleMarkerR = Math.max(2, Math.min(6, planetR * 0.055));
                    ctx.fillStyle = '#00ffff';
                    ctx.beginPath();
                    ctx.arc(northPolePt.x, northPolePt.y, poleMarkerR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#f43f5e';
                    ctx.beginPath();
                    ctx.arc(southPolePt.x, southPolePt.y, poleMarkerR, 0, Math.PI * 2);
                    ctx.fill();

                    if (st.stationaryOrbitPlanetId === p.id) {
                      ctx.save();
                      ctx.setLineDash([8, 6]);
                      ctx.strokeStyle = '#34d399';
                      ctx.lineWidth = 1.6;
                      ctx.beginPath();
                      ctx.arc(psx, psy, planetR + 10, 0, Math.PI * 2);
                      ctx.stroke();
                      ctx.restore();
                    }

                    // =========================================================================
                    // 4C. ОБЪЕКТЫ ЭКОСИСТЕМЫ GOBELL НА ПОВЕРХНОСТИ 3D-СФЕРЫ ПЛАНЕТЫ (БЕЗ ТЕКСТА):
                    // Чистые геометрические значки (Группы, Бизнеса и Объявлений).
                    // При наведении курсора мыши никаких всплывающих окон и текстов нет —
                    // карточка открывается ТОЛЬКО при наведении курсора мыши и нажатой клавише I!
                    // =========================================================================
                    if (planetR >= 18 && p.gobellObjects && p.gobellObjects.length > 0) {
                      const projectedMap = new Map<
                        string,
                        {obj: PlanetGoBellObject; ox: number; oy: number; nz: number}
                      >();

                      for (const gbObj of p.gobellObjects) {
                        const latRad = (gbObj.latDeg * Math.PI) / 180;
                        const lonRad = (gbObj.lonOffsetDeg * Math.PI) / 180;
                        const cosLat = Math.cos(latRad);
                        const sinLat = Math.sin(latRad);
                        const sinLon = Math.sin(lonRad);
                        const cosLon = Math.cos(lonRad);

                        const eqX = sinLon * pU.x - cosLon * pV.x;
                        const eqY = sinLon * pU.y - cosLon * pV.y;
                        const eqZ = sinLon * pU.z - cosLon * pV.z;

                        const nx = cosLat * eqX + sinLat * pN.x;
                        const ny = cosLat * eqY + sinLat * pN.y;
                        const nz = cosLat * eqZ + sinLat * pN.z;

                        const ox = psx + nx * planetR;
                        const oy = psy - ny * planetR;

                        projectedMap.set(gbObj.id, {obj: gbObj, ox, oy, nz});
                        frameProjectedPlanetObjects.push({
                          obj: gbObj,
                          planetName: p.name,
                          canvasX: ox,
                          canvasY: oy,
                          hitRadius: Math.max(15, Math.min(28, planetR * 0.13)),
                        });
                      }

                      const businessProj = Array.from(projectedMap.values()).find(
                        (entry) => entry.obj.kind === 'BUSINESS'
                      );
                      if (businessProj) {
                        ctx.save();
                        ctx.setLineDash([3, 4]);
                        ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
                        ctx.lineWidth = 1.2;
                        for (const entry of projectedMap.values()) {
                          if (entry.obj.kind === 'ADVERT') {
                            ctx.beginPath();
                            ctx.moveTo(businessProj.ox, businessProj.oy);
                            ctx.lineTo(entry.ox, entry.oy);
                            ctx.stroke();
                          }
                        }
                        ctx.restore();
                      }

                      const pGroupObj = p.gobellObjects.find((o) => o.kind === 'GROUP');
                      const pBizObj = p.gobellObjects.find((o) => o.kind === 'BUSINESS');
                      const pAdvertsList = p.gobellObjects
                        .filter((o) => o.kind === 'ADVERT')
                        .map((o) => ({
                          slotId: o.slotId || 1,
                          title: o.title,
                          description: o.description,
                          authorName: o.authorName,
                          karmaPlus: o.karmaPlus,
                          karmaMinus: o.karmaMinus,
                        }));

                      for (const {obj: gbObj, ox, oy} of projectedMap.values()) {
                        const isHovered = hoveredScreenTargetRef.current?.id === gbObj.id;
                        const baseR = Math.max(
                          6,
                          Math.min(
                            gbObj.kind === 'ADVERT' ? 13 : 16,
                            planetR * (gbObj.kind === 'ADVERT' ? 0.075 : 0.09)
                          )
                        );
                        const drawR = isHovered ? baseR * 1.25 : baseR;
                        const pulseR =
                          drawR + 4 + Math.sin(st.frameCounter * 0.08 + (gbObj.slotId || 0)) * 2.5;

                        ctx.save();
                        if (gbObj.kind === 'GROUP') {
                          // 1. МАРКЕР ГРУППЫ ПЛАНЕТЫ (чистая геометрия без текста)
                          ctx.strokeStyle = isHovered
                            ? '#ffffff'
                            : 'rgba(16, 185, 129, 0.75)';
                          ctx.lineWidth = isHovered ? 2.2 : 1.3;
                          ctx.beginPath();
                          ctx.arc(ox, oy, pulseR, 0, Math.PI * 2);
                          ctx.stroke();

                          ctx.fillStyle = isHovered ? '#059669' : '#10b981';
                          ctx.strokeStyle = '#ffffff';
                          ctx.lineWidth = 2;
                          ctx.beginPath();
                          ctx.arc(ox, oy, drawR, 0, Math.PI * 2);
                          ctx.fill();
                          ctx.stroke();

                          ctx.fillStyle = '#ffffff';
                          ctx.beginPath();
                          ctx.arc(ox, oy - drawR * 0.22, drawR * 0.28, 0, Math.PI * 2);
                          ctx.fill();
                          ctx.beginPath();
                          ctx.arc(
                            ox,
                            oy + drawR * 0.45,
                            drawR * 0.48,
                            Math.PI * 1.1,
                            Math.PI * 1.9
                          );
                          ctx.fill();
                        } else if (gbObj.kind === 'BUSINESS') {
                          // 2. МАРКЕР БИЗНЕСА ПЛАНЕТЫ (чистая геометрия золотого кристалла без текста)
                          ctx.strokeStyle = isHovered
                            ? '#ffffff'
                            : 'rgba(251, 191, 36, 0.8)';
                          ctx.lineWidth = isHovered ? 2.4 : 1.4;
                          ctx.beginPath();
                          ctx.arc(ox, oy, pulseR, 0, Math.PI * 2);
                          ctx.stroke();

                          ctx.fillStyle = isHovered ? '#d97706' : '#f59e0b';
                          ctx.strokeStyle = '#fef08a';
                          ctx.lineWidth = 2;
                          ctx.beginPath();
                          ctx.arc(ox, oy, drawR, 0, Math.PI * 2);
                          ctx.fill();
                          ctx.stroke();

                          // Внутренний геометрический ромб бизнеса (без текстового символа $)
                          const dIn = drawR * 0.52;
                          ctx.fillStyle = '#020617';
                          ctx.beginPath();
                          ctx.moveTo(ox, oy - dIn);
                          ctx.lineTo(ox + dIn, oy);
                          ctx.lineTo(ox, oy + dIn);
                          ctx.lineTo(ox - dIn, oy);
                          ctx.closePath();
                          ctx.fill();
                        } else {
                          // 3. МАРКЕР ОБЪЯВЛЕНИЯ БИЗНЕСА (чистая геометрия без текста)
                          ctx.strokeStyle = isHovered
                            ? '#ffffff'
                            : 'rgba(52, 211, 153, 0.8)';
                          ctx.lineWidth = isHovered ? 2.2 : 1.2;
                          ctx.beginPath();
                          ctx.arc(ox, oy, pulseR, 0, Math.PI * 2);
                          ctx.stroke();

                          ctx.fillStyle = isHovered ? '#10b981' : '#059669';
                          ctx.strokeStyle = '#ffffff';
                          ctx.lineWidth = 1.8;
                          ctx.beginPath();
                          ctx.arc(ox, oy, drawR, 0, Math.PI * 2);
                          ctx.fill();
                          ctx.stroke();

                          // Внутренний золотой кружок слота объявления (без текста $1 / AD #1)
                          ctx.fillStyle = '#fef08a';
                          ctx.beginPath();
                          ctx.arc(ox, oy, Math.max(2.2, drawR * 0.36), 0, Math.PI * 2);
                          ctx.fill();
                        }
                        ctx.restore();

                        // Регистрируем Группу, Бизнес и каждое Объявление для показа его карточки по курсору + клавише I
                        const pOrderNum =
                          gbObj.planetOrder ||
                          (p.cleanName === 'Меркурий'
                            ? 1
                            : p.cleanName === 'Венера'
                            ? 2
                            : p.cleanName === 'Земля'
                            ? 3
                            : 4);

                        frameScreenTargets.push({
                          id: gbObj.id,
                          canvasX: ox,
                          canvasY: oy,
                          hitRadius: Math.max(16, drawR + 8),
                          priority: 95,
                          profile: {
                            id: gbObj.id,
                            kind:
                              gbObj.kind === 'GROUP'
                                ? 'GROUP'
                                : gbObj.kind === 'BUSINESS'
                                ? 'BUSINESS'
                                : 'ADVERT',
                            systemTag:
                              gbObj.kind === 'GROUP'
                                ? gbObj.groupTag || `GO-${p.cleanName.toUpperCase()}`
                                : gbObj.kind === 'BUSINESS'
                                ? `BIZ-${pOrderNum}`
                                : `AD-${pOrderNum}-${gbObj.slotId || 1}`,
                            color:
                              gbObj.kind === 'GROUP'
                                ? '#10b981'
                                : gbObj.kind === 'BUSINESS'
                                ? '#f59e0b'
                                : '#34d399',
                            name:
                              gbObj.kind === 'GROUP'
                                ? gbObj.title
                                : gbObj.kind === 'BUSINESS'
                                ? gbObj.title
                                : `Объявление #${gbObj.slotId || 1} (${p.cleanName})`,
                            nickname:
                              gbObj.kind === 'GROUP'
                                ? `группа (${p.cleanName.toLowerCase()})`
                                : gbObj.kind === 'BUSINESS'
                                ? `бизнес (${p.cleanName.toLowerCase()})`
                                : `объявление бизнеса (${p.cleanName.toLowerCase()})`,
                            description: gbObj.description,
                            groupsTitle: `правительство (${p.cleanName} · #${
                              pGroupObj?.groupTag || 'GO-EARTH'
                            })`,
                            groupsDescription:
                              pGroupObj?.description ||
                              `Друзья планеты ${p.cleanName} · государственное снабжение и контракты.`,
                            groupTag: pGroupObj?.groupTag,
                            businessesTitle: `торговля (${
                              pBizObj?.title || `Бизнес планеты ${p.cleanName}`
                            })`,
                            businessesDescription:
                              pBizObj?.description ||
                              `Официальный торговый узел и экспорт ресурсов планеты ${p.cleanName}.`,
                            adverts: pAdvertsList,
                            karmaPlus: gbObj.karmaPlus,
                            karmaMinus: gbObj.karmaMinus,
                            distanceUnits: Math.round(item.dist),
                            coordsLabel: `Сфера ${p.cleanName}`,
                            planetOrder: pOrderNum,
                            planetCleanName: p.cleanName,
                            initialTab: 'PROFILE',
                          },
                        });
                      }
                    }
                  }

                  // Регистрируем саму Планету в списке объектов для вызова её карточки по клавише I
                  const planetGroupObj = p.gobellObjects?.find((o) => o.kind === 'GROUP');
                  const planetBusinessObj = p.gobellObjects?.find((o) => o.kind === 'BUSINESS');
                  const planetAdvertObjs = (p.gobellObjects || [])
                    .filter((o) => o.kind === 'ADVERT')
                    .map((o) => ({
                      slotId: o.slotId || 1,
                      title: o.title,
                      description: o.description,
                      authorName: o.authorName,
                      karmaPlus: o.karmaPlus,
                      karmaMinus: o.karmaMinus,
                    }));

                  const pOrder =
                    planetGroupObj?.planetOrder ||
                    (p.cleanName === 'Меркурий'
                      ? 1
                      : p.cleanName === 'Венера'
                      ? 2
                      : p.cleanName === 'Земля'
                      ? 3
                      : 4);

                  const planetDescriptionByOrder: Record<number, string> = {
                    1: 'Источник железа и тяжёлой руды в системе (базовый ресурс для сталелитейных верфей и обшивки).',
                    2: 'Источник алюминия и лёгких авиакосмических сплавов в системе (корпуса и крылья кораблей).',
                    3: 'Источник продовольствия и воды (кислорода O₂ для жизнеобеспечения экипажей и колоний в системе).',
                    4: 'Источник титана и сверхпрочной брони в системе · опорный форпост у Пояса Астероидов.',
                  };

                  frameScreenTargets.push({
                    id: p.id,
                    canvasX: psx,
                    canvasY: psy,
                    hitRadius: Math.max(20, planetR + 10),
                    priority: 55,
                    profile: {
                      id: p.id,
                      kind: 'PLANET',
                      systemTag: `PLANET-${pOrder}`,
                      color: p.color,
                      name: p.cleanName,
                      nickname: 'планета',
                      description:
                        planetDescriptionByOrder[pOrder] || 'Источник ресурсов в звёздной системе.',
                      groupsTitle: `правительство (${p.cleanName} · #${
                        planetGroupObj?.groupTag || 'GO-EARTH'
                      })`,
                      groupsDescription:
                        planetGroupObj?.description ||
                        `Друзья планеты ${p.cleanName} · государственное управление, скидка на профильный ресурс с 5 CR до 1 CR и приём межпланетных контрактов по 10 CR.`,
                      groupTag: planetGroupObj?.groupTag,
                      businessesTitle: `торговля (${
                        planetBusinessObj?.title || `Торговая палата планеты ${p.cleanName}`
                      })`,
                      businessesDescription:
                        planetBusinessObj?.description ||
                        `Официальная торговля профильным ресурсом планеты ${p.cleanName} и 4 слота коммерческих объявлений.`,
                      adverts: planetAdvertObjs,
                      karmaPlus: planetGroupObj?.karmaPlus ?? 30,
                      karmaMinus: planetGroupObj?.karmaMinus ?? 0,
                      distanceUnits: Math.round(item.dist),
                      coordsLabel: `Орбита R=${p.orbitRadius} ед.`,
                      planetOrder: pOrder,
                      planetCleanName: p.cleanName,
                    },
                  });
                }
              }
            }

            // =========================================================================
            // 2F. ПОДПРОСТРАНСТВЕННЫЙ КАНАЛ ФИКСАЦИИ (БЕЗ ТЕКСТА НА ЭКРАНЕ — ПРОФИЛЬ ПО КЛАВИШЕ I)
            // =========================================================================
            for (const sSlot of subspaceBeaconsRef.current) {
              if (!sSlot.isFixedInSpace && !sSlot.inAuctionPool) continue;
              const sysCoord = sSlot.fixedCoordsInSystem || sSlot.customCoords;
              const wx =
                st.starPos.x +
                sysCoord.x * st.eclipticU.x +
                sysCoord.y * st.eclipticN.x +
                sysCoord.z * st.eclipticV.x;
              const wy =
                st.starPos.y +
                sysCoord.x * st.eclipticU.y +
                sysCoord.y * st.eclipticN.y +
                sysCoord.z * st.eclipticV.y;
              const wz =
                st.starPos.z +
                sysCoord.x * st.eclipticU.z +
                sysCoord.y * st.eclipticN.z +
                sysCoord.z * st.eclipticV.z;

              if (wz <= 20) continue;
              const dist3D = Math.hypot(wx, wy, wz);
              const bScale = 380 / wz;
              const bx = cx + wx * bScale;
              const by = cy - wy * bScale;

              if (bx < -60 || bx > width + 60 || by < -60 || by > viewH + 60) continue;

              const drawR = Math.max(9, Math.min(22, (380 / Math.max(120, dist3D)) * 15));
              const pulse = 1 + 0.2 * Math.sin(st.frameCounter * 0.14 + sSlot.slotId);
              const beaconObjId = `subspace-channel-slot-${sSlot.slotId}`;
              const isHovered = hoveredScreenTargetRef.current?.id === beaconObjId;

              ctx.save();
              ctx.strokeStyle = isHovered
                ? '#ffffff'
                : sSlot.inAuctionPool
                ? '#facc15'
                : '#38bdf8';
              ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
              ctx.lineWidth = isHovered ? 2.5 : 1.8;
              ctx.beginPath();
              ctx.arc(bx, by, drawR * pulse, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              const dR = drawR * 0.72;
              ctx.beginPath();
              ctx.moveTo(bx, by - dR);
              ctx.lineTo(bx + dR, by);
              ctx.lineTo(bx, by + dR);
              ctx.lineTo(bx - dR, by);
              ctx.closePath();
              ctx.fillStyle = sSlot.inAuctionPool
                ? 'rgba(250, 204, 21, 0.35)'
                : 'rgba(56, 189, 248, 0.35)';
              ctx.fill();
              ctx.stroke();
              ctx.restore();

              frameScreenTargets.push({
                id: beaconObjId,
                canvasX: bx,
                canvasY: by,
                hitRadius: Math.max(18, drawR + 8),
                priority: 85,
                profile: {
                  id: beaconObjId,
                  kind: 'SUBSPACE_BEACON',
                  systemTag: `SUBSPACE-${sSlot.slotId}`,
                  color: sSlot.inAuctionPool ? '#facc15' : '#38bdf8',
                  name: 'канал фиксации',
                  nickname: `аукцион слота #${sSlot.slotId} (${sSlot.fixedPointLabel})`,
                  description: sSlot.text,
                  groupsTitle: 'подпространственная сеть GoBell (#SUBSPACE-NET)',
                  groupsDescription:
                    'Фиксация информационных маяков в любой точке звёздной системы и распределение доходов пула аукциона.',
                  businessesTitle: sSlot.inAuctionPool
                    ? `пул аукциона Monetize (доля ${myAuctionPoolSharePct}%)`
                    : `точка фиксации: ${sSlot.fixedPointLabel}`,
                  businessesDescription:
                    'Аналог аукциона слота объявления GoBell в открытом космосе.',
                  karmaPlus: 25,
                  karmaMinus: 0,
                  distanceUnits: Math.round(dist3D),
                  coordsLabel: sSlot.fixedPointLabel,
                  planetCleanName: sSlot.fixedPointLabel,
                },
              });
            }

            projectedPlanetObjectsRef.current = frameProjectedPlanetObjects;
            if (hoveredPlanetObjRef.current) {
              hoveredPlanetObjRef.current = null;
              setHoveredPlanetObjUi(null);
            }

            ctx.restore();

            // =========================================================================
            // 3. СТРОГОЕ ДВИЖЕНИЕ ПО ТРАЕКТОРИЯМ БЕЗ ХАОТИЧЕСКИХ ДВИЖЕНИЙ:
            // • 4 Планетных Автоматических Логистических Стандартных Модуля курсируют по бесконечному циклу:
            //   Своя планета → Другая планета 1 → Орбита 60с → Возврат на свою планету → Орбита 60с → Другая планета 2...
            // • Груз соответствует планете отправления (со своей планеты — её ресурс, с чужой — её ресурс).
            // • При гибели корабля его груз продолжает двигаться строго по траектории убитого корабля,
            //   и если его не подобрали — исчезает в планете назначения, чтобы мусора не было!
            // =========================================================================
            const isOldSys = Boolean(GALAXY_SYSTEMS[currentSystemId]?.isOldGalaxy);
            const absorbedList: string[] = [];
            st.entities = stepSystemTrajectories(
              st.entities,
              dtSec,
              isOldSys,
              (itemLabel, destPlanetName) => {
                absorbedList.push(`${itemLabel.split('[')[0].trim()} → ${destPlanetName}`);
              }
            );

            if (absorbedList.length > 0) {
              setAbsorbedInPlanetCount((cnt) => cnt + absorbedList.length);
              setFlightMessage(
                `🪐 ЧИСТЫЙ КОСМОС (МУСОРА НЕТ): НЕПОДОБРАННЫЙ ГРУЗ/МУСОР ДОСТИГ ПЛАНЕТЫ НАЗНАЧЕНИЯ (${absorbedList.join(
                  '; '
                )}) ПО ТРАЕКТОРИИ И ИСЧЕЗ В НЕЙ!`
              );
            }

            // Периодическое обновление снимка состояния планетной логистики для UI
            if (st.frameCounter % 15 === 0) {
              setLogisticsUiSnapshot(buildLogisticsUiSnapshot(st.entities, isOldSys));
            }

            // Вспомогательная функция точных 3D-координат и радиуса планеты по её индексу (0..3)
            const getPlanet3DNode = (idx: number): {pos: Vec3; radius3D: number} => {
              const p = st.planets[idx];
              const orbitR = p ? p.orbitRadius : PLANET_ORBIT_STEP * (idx + 1);
              const orbitA = p ? p.orbitAngle : -Math.PI / 2 + (idx % 2 === 0 ? -0.11 : 0.11);
              const radius3D = p ? p.radius3D : 110;
              const cA = Math.cos(orbitA);
              const sA = Math.sin(orbitA);
              return {
                pos: {
                  x: st.starPos.x + orbitR * (cA * st.eclipticU.x + sA * st.eclipticV.x),
                  y: st.starPos.y + orbitR * (cA * st.eclipticU.y + sA * st.eclipticV.y),
                  z: st.starPos.z + orbitR * (cA * st.eclipticU.z + sA * st.eclipticV.z),
                },
                radius3D,
              };
            };

            // Вычисляем истинные 3D-координаты каждого модуля и груза СТРОГО НА ЕГО МЕЖПЛАНЕТНОМ МАРШРУТЕ
            // (никакого застревания перед глазами и никакого хаотического вращения вокруг осей!)
            type ComputedEntityRoutePose = {
              ent: SpaceEntity;
              forwardVec: Vec3;
              rightVec: Vec3;
              upVec: Vec3;
              routeStartPt: Vec3;
              routeEndPt: Vec3;
            };

            const posedEntities: ComputedEntityRoutePose[] = [];

            for (const ent of st.entities) {
              const homeIdx = ent.homePlanetIdx ?? ent.trajFromPlanetIdx ?? 0;
              const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[0];
              const targetListIdx = (ent.cycleTargetListIdx ?? 0) % 3;
              const otherIdx = homeCfg.cycleOtherPlanets[targetListIdx];

              let fromIdx = ent.trajFromPlanetIdx ?? homeIdx;
              let toIdx =
                ent.trajToPlanetIdx !== undefined && ent.trajToPlanetIdx !== fromIdx
                  ? ent.trajToPlanetIdx
                  : otherIdx;
              let prog = Math.max(0, Math.min(1, ent.trajProgress ?? 0.35));

              if (ent.isLogisticsModule) {
                if (ent.logisticsPhase === 'OUTBOUND_FLIGHT') {
                  fromIdx = homeIdx;
                  toIdx = otherIdx;
                } else if (ent.logisticsPhase === 'WAIT_OTHER_ORBIT') {
                  fromIdx = homeIdx;
                  toIdx = otherIdx;
                  prog = 1; // На стационарной орбите чужой планеты назначения
                } else if (ent.logisticsPhase === 'RETURN_FLIGHT') {
                  fromIdx = otherIdx;
                  toIdx = homeIdx;
                } else if (ent.logisticsPhase === 'WAIT_HOME_ORBIT') {
                  fromIdx = homeIdx;
                  toIdx = homeCfg.cycleOtherPlanets[(targetListIdx + 1) % 3];
                  prog = 0; // На стационарной орбите своей родной планеты перед вылетом к следующей
                }
              }

              const pFrom = getPlanet3DNode(fromIdx);
              const pTo = getPlanet3DNode(toIdx);
              const dx = pTo.pos.x - pFrom.pos.x;
              const dy = pTo.pos.y - pFrom.pos.y;
              const dz = pTo.pos.z - pFrom.pos.z;
              const routeDist = Math.max(1, Math.hypot(dx, dy, dz));

              // Единичный вектор направления маршрута (нос корабля смотрит СТРОГО по маршруту без вращения вокруг осей!)
              const forwardVec: Vec3 = {
                x: dx / routeDist,
                y: dy / routeDist,
                z: dz / routeDist,
              };

              // Ортонормированный базис корабля на маршруте (крылья лежат в плоскости эклиптики без крена и кувырканий)
              const rawRx = st.eclipticN.y * forwardVec.z - st.eclipticN.z * forwardVec.y;
              const rawRy = st.eclipticN.z * forwardVec.x - st.eclipticN.x * forwardVec.z;
              const rawRz = st.eclipticN.x * forwardVec.y - st.eclipticN.y * forwardVec.x;
              const rLen = Math.hypot(rawRx, rawRy, rawRz) || 1;
              const rightVec: Vec3 = {
                x: rawRx / rLen,
                y: rawRy / rLen,
                z: rawRz / rLen,
              };
              const upVec: Vec3 = {
                x: forwardVec.y * rightVec.z - forwardVec.z * rightVec.y,
                y: forwardVec.z * rightVec.x - forwardVec.x * rightVec.z,
                z: forwardVec.x * rightVec.y - forwardVec.y * rightVec.x,
              };

              const laneRightOffset = ent.kind === 'SPACE_DEBRIS' ? 12 : 0;
              const laneUpOffset = ent.kind === 'SPACE_DEBRIS' ? -6 : 0;

              const routeStartPt: Vec3 = {
                x:
                  pFrom.pos.x +
                  forwardVec.x * (pFrom.radius3D * 1.55) +
                  rightVec.x * laneRightOffset +
                  upVec.x * laneUpOffset,
                y:
                  pFrom.pos.y +
                  forwardVec.y * (pFrom.radius3D * 1.55) +
                  rightVec.y * laneRightOffset +
                  upVec.y * laneUpOffset,
                z:
                  pFrom.pos.z +
                  forwardVec.z * (pFrom.radius3D * 1.55) +
                  rightVec.z * laneRightOffset +
                  upVec.z * laneUpOffset,
              };

              const routeEndPt: Vec3 = {
                x:
                  pTo.pos.x -
                  forwardVec.x * (pTo.radius3D * 1.55) +
                  rightVec.x * laneRightOffset +
                  upVec.x * laneUpOffset,
                y:
                  pTo.pos.y -
                  forwardVec.y * (pTo.radius3D * 1.55) +
                  rightVec.y * laneRightOffset +
                  upVec.y * laneUpOffset,
                z:
                  pTo.pos.z -
                  forwardVec.z * (pTo.radius3D * 1.55) +
                  rightVec.z * laneRightOffset +
                  upVec.z * laneUpOffset,
              };

              // Истинная 3D-позиция объекта СТРОГО на его маршруте между планетами
              ent.pos = {
                x: routeStartPt.x + (routeEndPt.x - routeStartPt.x) * prog,
                y: routeStartPt.y + (routeEndPt.y - routeStartPt.y) * prog,
                z: routeStartPt.z + (routeEndPt.z - routeStartPt.z) * prog,
              };
              ent.rot = {x: 0, y: 0, z: 0};
              ent.rotSpeed = {x: 0, y: 0, z: 0};

              posedEntities.push({
                ent,
                forwardVec,
                rightVec,
                upVec,
                routeStartPt,
                routeEndPt,
              });
            }

            posedEntities.sort((a, b) => b.ent.pos.z - a.ent.pos.z);

            for (const {
              ent,
              forwardVec,
              rightVec,
              upVec,
              routeStartPt,
              routeEndPt,
            } of posedEntities) {
              // Проверка авто-подбора контейнеров с предметами (CARGO) и спасательных капсул SOS при прямом налёте кораблём
              if (
                (ent.kind === 'CARGO' || ent.kind === 'SOS_POD') &&
                ent.pos.z > 15 &&
                ent.pos.z < 95 &&
                Math.hypot(ent.pos.x, ent.pos.y) < 55
              ) {
                if (ent.kind === 'SOS_POD') {
                  playZxBeep('MISSION');
                  setCredits((c) => c + 350);
                  setEarnedGoBellKarma((k) => k + 2);
                  onEarnKarmaAndBonus?.(2, 350, 'Спасение капсулы SOS в открытом космосе');
                  setFlightMessage('★ SOS CAPSULE RESCUED! +350 CR & +2 GOBELL KARMA ★');
                  st.entities = st.entities.filter((e) => e.id !== ent.id);
                  continue;
                } else if (usedCargoTonsForPhysics < maxCargoCapacity) {
                  const origin = ent.lootOrigin || 'AFTER_BATTLE';
                  const sym = ent.lootElement || 'Pt';
                  const shipName = ent.destroyedShipName || ent.label;
                  st.entities = st.entities.filter((e) => e.id !== ent.id);
                  collectSpaceLootItem(origin, sym, shipName);
                  continue;
                }
              }

              // Авто-стыковка при подлёте вплотную к станции Coriolis
              if (
                ent.kind === 'STATION' &&
                ent.pos.z > 30 &&
                ent.pos.z < 165 &&
                Math.hypot(ent.pos.x, ent.pos.y) < 135
              ) {
                ent.pos.z = 950;
                handleToggleDocking();
                break;
              }

              // 1) Рендерим пунктирную линию 3D-маршрута между планетами (чтобы было видно саму трассу, по которой летит модуль)
              if (ent.kind !== 'STATION') {
                const routeSamples = 24;
                ctx.save();
                ctx.setLineDash([4, 6]);
                ctx.strokeStyle = ent.color;
                ctx.globalAlpha = ent.isLogisticsModule ? 0.32 : 0.22;
                ctx.lineWidth = ent.isLogisticsModule ? 1.15 : 0.9;
                ctx.beginPath();
                let penDown = false;
                for (let s = 0; s <= routeSamples; s++) {
                  const t = s / routeSamples;
                  const rx = routeStartPt.x + (routeEndPt.x - routeStartPt.x) * t;
                  const ry = routeStartPt.y + (routeEndPt.y - routeStartPt.y) * t;
                  const rz = routeStartPt.z + (routeEndPt.z - routeStartPt.z) * t;
                  if (rz > 35) {
                    const sx = cx + (rx * 380) / rz;
                    const sy = cy - (ry * 380) / rz;
                    if (sx > -1600 && sx < width + 1600 && sy > -1600 && sy < viewH + 1600) {
                      if (!penDown) {
                        ctx.moveTo(sx, sy);
                        penDown = true;
                      } else {
                        ctx.lineTo(sx, sy);
                      }
                    } else {
                      penDown = false;
                    }
                  } else {
                    penDown = false;
                  }
                }
                ctx.stroke();
                ctx.restore();
              }

              // Если сам модуль/груз сейчас находится позади камеры корабля — НЕ рисуем его перед глазами!
              if (ent.pos.z <= 25) {
                continue;
              }

              const centerScale = 380 / ent.pos.z;
              const entScreenX = cx + ent.pos.x * centerScale;
              const entScreenY = cy - ent.pos.y * centerScale;

              // Отсечение за пределами экрана
              if (
                entScreenX < -220 ||
                entScreenX > width + 220 ||
                entScreenY < -220 ||
                entScreenY > viewH + 220
              ) {
                continue;
              }

              // Выбираем 3D-сетку (Mesh) и честный физический масштаб в 3D-пространстве:
              // Корабль/модуль в 3D значительно меньше планеты (meshWorldScale = 0.28 -> размах крыльев ~30 ед. против диаметра планеты ~240 ед.),
              // поэтому вблизи (100–220 ед.) он крупный и детальный, на средней дистанции (350–1500 ед.) пропорционально уменьшается,
              // а на межпланетной дистанции (2000–25000 ед.) масштабируется в аккуратную точку/силуэт на линии маршрута!
              const mesh =
                ent.kind === 'STATION'
                  ? CORIOLIS_MESH
                  : ent.kind === 'THARGOID'
                  ? THARGOID_MESH
                  : ent.kind === 'CARGO' || ent.kind === 'SOS_POD' || ent.kind === 'SPACE_DEBRIS'
                  ? CARGO_MESH
                  : COBRA_MESH;

              const meshWorldScale =
                ent.kind === 'STATION'
                  ? 0.65
                  : ent.kind === 'CARGO' || ent.kind === 'SOS_POD' || ent.kind === 'SPACE_DEBRIS'
                  ? 0.24
                  : 0.28;

              const apparentHalfSizePx = (55 * meshWorldScale * 380) / ent.pos.z;

              // Начисто убрано вращение вокруг осей: вершины ориентированы строго по вектору маршрута (rightVec, upVec, forwardVec)
              const projected: {x: number; y: number}[] = mesh.vertices.map((v) => {
                const vx = v.x * meshWorldScale;
                const vy = v.y * meshWorldScale;
                const vz = v.z * meshWorldScale;
                const wx =
                  ent.pos.x +
                  rightVec.x * vx +
                  upVec.x * vy +
                  forwardVec.x * vz;
                const wy =
                  ent.pos.y +
                  rightVec.y * vx +
                  upVec.y * vy +
                  forwardVec.y * vz;
                const wz = Math.max(
                  20,
                  ent.pos.z +
                    rightVec.z * vx +
                    upVec.z * vy +
                    forwardVec.z * vz
                );
                const scale = 380 / wz;
                return {
                  x: cx + wx * scale,
                  y: cy - wy * scale,
                };
              });

              ctx.strokeStyle = ent.color;
              ctx.lineWidth =
                apparentHalfSizePx > 22 ? 1.6 : apparentHalfSizePx > 7 ? 1.25 : 1.0;
              ctx.beginPath();
              for (const [i1, i2] of mesh.edges) {
                const p1 = projected[i1];
                const p2 = projected[i2];
                if (p1 && p2) {
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                }
              }
              ctx.stroke();

              // Если модуль/груз далеко на маршруте (проекция меньше 3.5 пикс.) — подсвечиваем его чёткой масштабной точкой на траектории
              if (apparentHalfSizePx < 3.5) {
                ctx.fillStyle = ent.color;
                ctx.beginPath();
                ctx.arc(
                  entScreenX,
                  entScreenY,
                  Math.max(1.8, apparentHalfSizePx),
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              }

              // Регистрируем 3D-объект (автоматический модуль, груз, мусор, станцию, корабль, капсулу SOS) для вызова его карточки по клавише I (без подписей на экране)
              const trueDist = Math.round(Math.hypot(ent.pos.x, ent.pos.y, ent.pos.z));
              const homeIdx = ent.homePlanetIdx ?? ent.trajFromPlanetIdx ?? 2;
              const homeCfg = PLANET_LOGISTICS_CONFIG[homeIdx] || PLANET_LOGISTICS_CONFIG[2];
              const fromPlanetCfg =
                PLANET_LOGISTICS_CONFIG[ent.trajFromPlanetIdx ?? homeIdx] || homeCfg;
              const toPlanetCfg =
                PLANET_LOGISTICS_CONFIG[ent.trajToPlanetIdx ?? ((homeIdx + 1) % 4)] || homeCfg;
              const routePct = Math.round((ent.trajProgress ?? 0) * 100);
              const phaseLabelRu =
                ent.logisticsPhase === 'OUTBOUND_FLIGHT'
                  ? `Полёт ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName} (${routePct}%)`
                  : ent.logisticsPhase === 'WAIT_OTHER_ORBIT'
                  ? `Стационарная орбита ${toPlanetCfg.cleanName} (${Math.ceil(
                      ent.orbitWaitRemainingSec ?? 60
                    )}с)`
                  : ent.logisticsPhase === 'RETURN_FLIGHT'
                  ? `Возврат ${fromPlanetCfg.cleanName} → ${homeCfg.cleanName} (${routePct}%)`
                  : ent.logisticsPhase === 'WAIT_HOME_ORBIT'
                  ? `Стационарная орбита родной планеты ${homeCfg.cleanName} (${Math.ceil(
                      ent.orbitWaitRemainingSec ?? 60
                    )}с)`
                  : `Маршрут ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName} (${routePct}%)`;

              let objProfile: SpaceObjectProfileData;
              if (ent.isLogisticsModule) {
                objProfile = {
                  id: ent.id,
                  kind: 'LOGISTICS_MODULE',
                  systemTag: `LOG-${homeCfg.orderRoman}`,
                  color: ent.color,
                  name: 'модуль',
                  nickname: `логистик (${homeCfg.cleanName})`,
                  description: `логистика планеты ${homeCfg.cleanName} · автоматический логистический стандартный модуль (50 т) курсирует строго по циклу между планетами с минутной стоянкой на стационарной орбите`,
                  groupsTitle: `правительство (${homeCfg.cleanName} · #${homeCfg.groupTag})`,
                  groupsDescription: `Государственная служба автоматического межпланетного снабжения планеты ${homeCfg.cleanName}.`,
                  groupTag: homeCfg.groupTag,
                  businessesTitle: `межпланетная торговля (${
                    ent.currentCargoLabel || homeCfg.resourceLabel
                  })`,
                  businessesDescription: `Перевозка профильного ресурса (${
                    ent.currentCargoLabel || homeCfg.resourceLabel
                  }) строго по межпланетной трассе ${fromPlanetCfg.cleanName} → ${
                    toPlanetCfg.cleanName
                  }.`,
                  karmaPlus: 40,
                  karmaMinus: 0,
                  distanceUnits: trueDist,
                  coordsLabel: `${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName} (${routePct}%)`,
                  planetOrder: homeIdx + 1,
                  planetCleanName: homeCfg.cleanName,
                  entityId: ent.id,
                  routeFromPlanet: fromPlanetCfg.cleanName,
                  routeToPlanet: toPlanetCfg.cleanName,
                  routePhaseLabel: phaseLabelRu,
                  routeProgressPct: routePct,
                  orbitWaitSec: Math.ceil(ent.orbitWaitRemainingSec ?? 0),
                  cargoResourceLabel: ent.currentCargoLabel || homeCfg.resourceLabel,
                  shipMassTons: Number(((ent.massKg ?? 50000) / 1000).toFixed(1)),
                  shipMaxMassTons: Number(((ent.maxMassKg ?? 50000) / 1000).toFixed(0)),
                  playerHitTons: Number(((ent.playerHitMassKg ?? 0) / 1000).toFixed(2)),
                };
              } else if (ent.kind === 'CARGO') {
                objProfile = {
                  id: ent.id,
                  kind: 'CARGO',
                  systemTag: 'CARGO-TRAJ',
                  color: ent.color,
                  name: 'груз',
                  nickname: `ресурс (${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName})`,
                  description: `Грузовой контейнер (${
                    ent.currentCargoLabel || ent.label
                  }), продолжающий движение строго по траектории погибшего корабля к планете назначения ${
                    toPlanetCfg.cleanName
                  }. Если не подобран — исчезает в планете назначения. Уничтожение награждается как уничтожение астероида.`,
                  groupsTitle: `таможенный контроль (${toPlanetCfg.cleanName} · #${toPlanetCfg.groupTag})`,
                  groupsDescription: `Автоматическое поглощение неподобранных контейнеров планетой назначения ${toPlanetCfg.cleanName} для поддержания чистоты космоса.`,
                  groupTag: toPlanetCfg.groupTag,
                  businessesTitle: `товарный лот (${ent.currentCargoLabel || 'контейнер'})`,
                  businessesDescription:
                    ent.lootOrigin === 'PLAYER_DESTROYED_SHIP'
                      ? 'Внимание: подбор груза с лично сбитого корабля присваивает статус ПИРАТ (×10). Огневое уничтожение контейнера поощряется как расчистка астероида (+CR).'
                      : 'Контейнер на траектории: можно подобрать гравизахватом (СКМ) или уничтожить лазером как астероид (+CR).',
                  karmaPlus: 15,
                  karmaMinus: 0,
                  distanceUnits: trueDist,
                  coordsLabel: `Трасса ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName} (${routePct}%)`,
                  planetOrder: (ent.trajToPlanetIdx ?? 2) + 1,
                  planetCleanName: toPlanetCfg.cleanName,
                  entityId: ent.id,
                  routeFromPlanet: fromPlanetCfg.cleanName,
                  routeToPlanet: toPlanetCfg.cleanName,
                  routePhaseLabel: `Дрейф по траектории (${routePct}%)`,
                  routeProgressPct: routePct,
                  cargoResourceLabel: ent.currentCargoLabel || ent.label,
                  elementSymbol: ent.lootElement,
                };
              } else if (ent.kind === 'SPACE_DEBRIS') {
                objProfile = {
                  id: ent.id,
                  kind: 'SPACE_DEBRIS',
                  systemTag: 'DEBRIS-TRAJ',
                  color: ent.color,
                  name: 'мусор',
                  nickname: `обломки (${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName})`,
                  description: `Обломки разрушенного корпуса на траектории ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName}. Исчезают в планете назначения ${toPlanetCfg.cleanName}, чтобы в системе не было мусора. Уничтожение мусора лазером считается уничтожением астероида и вознаграждается кредитами.`,
                  groupsTitle: `служба чистоты орбит (${toPlanetCfg.cleanName} · #${toPlanetCfg.groupTag})`,
                  groupsDescription:
                    'Премирование пилотов за огневую утилизацию космического мусора на межпланетных траекториях.',
                  groupTag: toPlanetCfg.groupTag,
                  businessesTitle: 'утилизация обломков (= вознаграждение как за астероид)',
                  businessesDescription:
                    'При расстреле обломков начисляется премия минерального эквивалента астероида.',
                  karmaPlus: 10,
                  karmaMinus: 0,
                  distanceUnits: trueDist,
                  coordsLabel: `Трасса ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName} (${routePct}%)`,
                  planetOrder: (ent.trajToPlanetIdx ?? 2) + 1,
                  planetCleanName: toPlanetCfg.cleanName,
                  entityId: ent.id,
                  routeFromPlanet: fromPlanetCfg.cleanName,
                  routeToPlanet: toPlanetCfg.cleanName,
                  routePhaseLabel: `Движение к планете (${routePct}%)`,
                  routeProgressPct: routePct,
                };
              } else if (ent.kind === 'STATION') {
                objProfile = {
                  id: ent.id,
                  kind: 'STATION',
                  systemTag: 'CORIOLIS-HUB',
                  color: ent.color,
                  name: 'станция Кориолис',
                  nickname: `космопорт (${GALAXY_SYSTEMS[currentSystemId]?.name || 'SOL'})`,
                  description:
                    'Орбитальный торговый и технический узел звёздной системы: товарная биржа, оснащение корабля и терминал миссий GoBell.',
                  groupsTitle: 'диспетчерская служба космопорта (#CORIOLIS-CTRL)',
                  groupsDescription:
                    'Автоматическая стыковка (клавиша T), заправка топливом и регистрация тоннажа опыта пилотов.',
                  businessesTitle: 'межпланетная биржа и верфь оснащения Cobra Mk III',
                  businessesDescription:
                    'Оптовая торговля ресурсами системы, установка лазеров, плазменных пушек и бронеплит.',
                  karmaPlus: 50,
                  karmaMinus: 0,
                  distanceUnits: trueDist,
                  coordsLabel: `Орбита станции (${trueDist} ед.)`,
                  planetOrder: 3,
                  planetCleanName: 'Земля',
                  entityId: ent.id,
                };
              } else if (ent.kind === 'SOS_POD') {
                objProfile = {
                  id: ent.id,
                  kind: 'SOS_POD',
                  systemTag: 'SOS-CAPSULE',
                  color: ent.color,
                  name: 'капсула SOS',
                  nickname: `сигнал бедствия (${fromPlanetCfg.cleanName})`,
                  description:
                    'Спасательная капсула экипажа на межпланетном маршруте. Захват гравилучом (СКМ) приносит +2 в карму GoBell и +350 CR.',
                  groupsTitle: 'спасательная служба сектора (#SOS-RESCUE)',
                  groupsDescription: 'Приоритетный протокол помощи терпящим бедствие в космосе.',
                  businessesTitle: 'страховой фонд спасения (+350 CR за эвакуацию)',
                  businessesDescription:
                    'Выплата вознаграждения и начисление положительной кармы за доставку капсулы.',
                  karmaPlus: 35,
                  karmaMinus: 0,
                  distanceUnits: trueDist,
                  coordsLabel: `Маршрут ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName}`,
                  planetOrder: 3,
                  planetCleanName: 'Земля',
                  entityId: ent.id,
                };
              } else {
                objProfile = {
                  id: ent.id,
                  kind: 'COMBAT_SHIP',
                  systemTag: `SHIP-${ent.kind}`,
                  color: ent.color,
                  name: 'корабль',
                  nickname: `${
                    ent.kind === 'THARGOID' ? 'таргоид' : ent.kind === 'PIRATE' ? 'рейдер' : 'конвой'
                  } (${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName})`,
                  description: `Корабль на межпланетной траектории ${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName}. При уничтожении его груз продолжает движение строго по маршруту к планете назначения.`,
                  groupsTitle: `патруль траектории (${toPlanetCfg.cleanName})`,
                  groupsDescription:
                    'Контроль безопасности межпланетных коридоров и учёт тоннажа опыта (Дебет/Кредит).',
                  businessesTitle: `бортовой груз (${ent.currentCargoLabel || 'ресурсы системы'})`,
                  businessesDescription:
                    'При гибели корабля груз движется по траектории и исчезает в планете назначения, если не перехвачен.',
                  karmaPlus: ent.kind === 'TRADER' ? 20 : 5,
                  karmaMinus: ent.kind === 'TRADER' ? 0 : 15,
                  distanceUnits: trueDist,
                  coordsLabel: `${fromPlanetCfg.cleanName} → ${toPlanetCfg.cleanName} (${routePct}%)`,
                  planetOrder: (ent.trajToPlanetIdx ?? 2) + 1,
                  planetCleanName: toPlanetCfg.cleanName,
                  entityId: ent.id,
                  routeFromPlanet: fromPlanetCfg.cleanName,
                  routeToPlanet: toPlanetCfg.cleanName,
                  routePhaseLabel: `По курсу (${routePct}%)`,
                  routeProgressPct: routePct,
                  cargoResourceLabel: ent.currentCargoLabel,
                  shipMassTons: Number(((ent.massKg ?? 50000) / 1000).toFixed(1)),
                  shipMaxMassTons: Number(((ent.maxMassKg ?? 50000) / 1000).toFixed(0)),
                  playerHitTons: Number(((ent.playerHitMassKg ?? 0) / 1000).toFixed(2)),
                };
              }

              frameScreenTargets.push({
                id: ent.id,
                canvasX: entScreenX,
                canvasY: entScreenY,
                hitRadius: Math.max(18, Math.min(64, apparentHalfSizePx + 14)),
                priority: 80,
                profile: objProfile,
              });
            }

            // Ответный огонь пиратов с проверкой ЗАЩИЩЁННОСТИ (Брони от массы корабля)
            st.enemyFireCooldown -= 1;
            if (st.enemyFireCooldown <= 0) {
              st.enemyFireCooldown = 115;
              const attacker = st.entities.find(
                (e) => (e.kind === 'PIRATE' || e.kind === 'THARGOID') && e.pos.z > 120 && e.pos.z < 850
              );
              if (attacker) {
                const aScale = 380 / attacker.pos.z;
                const ax = cx + attacker.pos.x * aScale;
                const ay = cy - attacker.pos.y * aScale;
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(cx + (Math.random() - 0.5) * 40, viewH - 18);
                ctx.stroke();

                const rawDmg = attacker.kind === 'THARGOID' ? 18 : 12;
                const mitigatedDmg = Math.max(2, Math.round(rawDmg * (1 - st.protectionFactor)));
                st.frontShield = Math.max(15, st.frontShield - mitigatedDmg);
              }
            }

            // 4. Осколки взрывов
            for (const deb of st.debris) {
              deb.pos.x += deb.vel.x;
              deb.pos.y += deb.vel.y;
              deb.pos.z += deb.vel.z;
              deb.ttl -= 1;
              if (deb.pos.z > 30) {
                const scale = 380 / deb.pos.z;
                const sx = cx + deb.pos.x * scale;
                const sy = cy - deb.pos.y * scale;
                ctx.strokeStyle = deb.color;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(sx - 2, sy - 2, 5, 5);
              }
            }
            st.debris = st.debris.filter((d) => d.ttl > 0);

            // 5. Курсовой Авиагоризонт корабля в центре экрана
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.55)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.moveTo(cx - 22, cy);
            ctx.lineTo(cx - 8, cy);
            ctx.moveTo(cx + 8, cy);
            ctx.lineTo(cx + 22, cy);
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(st.bankAngle);
            const pitchOffsetPx = Math.max(-24, Math.min(24, st.pitchRate * 1400));
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.65)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-44, pitchOffsetPx);
            ctx.lineTo(-20, pitchOffsetPx);
            ctx.moveTo(20, pitchOffsetPx);
            ctx.lineTo(44, pitchOffsetPx);
            ctx.stroke();
            ctx.restore();

            // =========================================================================
            // 5B. ОГНЕВАЯ РУБКА (ТУРЕЛЬ), ПРИЦЕЛ МЫШИ И ИНСПЕКТОР ПРОФИЛЯ (КУРСОР + КЛАВИША I)
            // НИКАКИХ ТЕКСТОВ НА ЭКРАНЕ НЕТ (ДАЖЕ ПРИ НАВЕДЕНИИ КУРСОРА МЫШИ)!
            // Карточка объекта появляется ТОЛЬКО когда объект в зоне действия курсора мыши и нажата клавиша I!
            // =========================================================================
            const aimX = st.turretActive ? st.turretX : cx;
            const aimY = st.turretActive ? st.turretY : cy;

            projectedScreenTargetsRef.current = frameScreenTargets;

            let bestHoveredTarget: ProjectedScreenTargetHit | null = null;
            let bestHoveredScore = Infinity;
            for (const cand of frameScreenTargets) {
              const d = Math.hypot(cand.canvasX - aimX, cand.canvasY - aimY);
              if (d <= cand.hitRadius) {
                const weightedScore = d - cand.priority * 0.25;
                if (weightedScore < bestHoveredScore) {
                  bestHoveredScore = weightedScore;
                  bestHoveredTarget = cand;
                }
              }
            }
            hoveredScreenTargetRef.current = bestHoveredTarget;

            // Вспомогательная функция перевода canvas-координат объекта в пиксели контейнера для привязки карточки рядом с объектом
            const computeCardAnchorFromHit = (hit: ProjectedScreenTargetHit) => {
              const rect = canvas.getBoundingClientRect();
              const container = viewportContainerRef.current;
              const viewportWidth = container?.clientWidth || rect.width || 760;
              const viewportHeight = container?.clientHeight || rect.height || 480;
              const canvasAspect = canvas.width / canvas.height;
              const rectAspect = rect.width / Math.max(1, rect.height);
              let renderW = rect.width;
              let renderH = rect.height;
              let offsetX = 0;
              let offsetY = 0;
              if (rectAspect > canvasAspect) {
                renderW = rect.height * canvasAspect;
                offsetX = (rect.width - renderW) / 2;
              } else {
                renderH = rect.width / canvasAspect;
                offsetY = (rect.height - renderH) / 2;
              }
              return {
                anchorLeftPx: offsetX + (hit.canvasX / canvas.width) * renderW,
                anchorTopPx: offsetY + (hit.canvasY / canvas.height) * renderH,
                screenRadiusPx: Math.max(12, (hit.hitRadius / canvas.width) * renderW),
                viewportWidth,
                viewportHeight,
              };
            };

            // 1) Если объект находится в зоне действия курсора мыши И нажата клавиша I — открываем/обновляем карточку этого объекта рядом с ним
            if (isKeyIDownRef.current && bestHoveredTarget) {
              const currentOpenId = activeObjectProfileRef.current?.id;
              if (currentOpenId !== bestHoveredTarget.id || st.frameCounter % 3 === 0) {
                const anchor = computeCardAnchorFromHit(bestHoveredTarget);
                const nextProfile: SpaceObjectProfileData = {
                  ...bestHoveredTarget.profile,
                  canvasX: bestHoveredTarget.canvasX,
                  canvasY: bestHoveredTarget.canvasY,
                  ...anchor,
                };
                activeObjectProfileRef.current = nextProfile;
                setActiveObjectProfile(nextProfile);
              }
            } else if (activeObjectProfileRef.current) {
              // 2) Если карточка уже открыта: пока объект остаётся в зоне действия курсора мыши (или курсор внутри самой карточки),
              //    обновляем координаты привязки карточки; а если курсор увели с объекта (и не на карточку) — закрываем карточку!
              const stillOnSameObject =
                bestHoveredTarget && bestHoveredTarget.id === activeObjectProfileRef.current.id;
              if (stillOnSameObject && bestHoveredTarget) {
                if (st.frameCounter % 3 === 0) {
                  const anchor = computeCardAnchorFromHit(bestHoveredTarget);
                  const nextProfile: SpaceObjectProfileData = {
                    ...bestHoveredTarget.profile,
                    canvasX: bestHoveredTarget.canvasX,
                    canvasY: bestHoveredTarget.canvasY,
                    ...anchor,
                    initialTab: activeObjectProfileRef.current.initialTab,
                  };
                  activeObjectProfileRef.current = nextProfile;
                  setActiveObjectProfile(nextProfile);
                }
              } else if (isHoveringObjectCardRef.current) {
                const liveTarget = frameScreenTargets.find(
                  (t) => t.id === activeObjectProfileRef.current?.id
                );
                if (liveTarget && st.frameCounter % 4 === 0) {
                  const anchor = computeCardAnchorFromHit(liveTarget);
                  const nextProfile: SpaceObjectProfileData = {
                    ...liveTarget.profile,
                    canvasX: liveTarget.canvasX,
                    canvasY: liveTarget.canvasY,
                    ...anchor,
                    initialTab: activeObjectProfileRef.current.initialTab,
                  };
                  activeObjectProfileRef.current = nextProfile;
                  setActiveObjectProfile(nextProfile);
                }
              } else {
                activeObjectProfileRef.current = null;
                setActiveObjectProfile(null);
              }
            }

            // Проверяем, наведён ли прицел Огневой Башни на боевую/захватываемую цель
            let lockedTarget: SpaceEntity | null = null;
            let lockedDist = Infinity;
            for (const ent of st.entities) {
              if (ent.kind === 'STATION') continue;
              if (ent.pos.z > 25 && ent.pos.z < 18000) {
                const projRatio = 380 / ent.pos.z;
                const ex = cx + ent.pos.x * projRatio;
                const ey = cy - ent.pos.y * projRatio;
                const d = Math.hypot(ex - aimX, ey - aimY);
                const lockR = Math.max(22, Math.min(72, (28 * 380) / ent.pos.z + 16));
                if (d <= lockR && d < lockedDist) {
                  lockedDist = d;
                  lockedTarget = ent;
                }
              }
            }

            // Векторная Огневая Башня (Turret Mount) внизу кокпита, поворачивающая стволы за мышью
            const turretBaseX = cx;
            const turretBaseY = viewH - 2;
            const turretAngle = Math.atan2(aimY - turretBaseY, aimX - turretBaseX);
            const barrelLen = 34;
            const bTipLeftX = turretBaseX - 14 + Math.cos(turretAngle) * barrelLen;
            const bTipLeftY = turretBaseY - 6 + Math.sin(turretAngle) * barrelLen;
            const bTipRightX = turretBaseX + 14 + Math.cos(turretAngle) * barrelLen;
            const bTipRightY = turretBaseY - 6 + Math.sin(turretAngle) * barrelLen;

            // Купол огневой рубки
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(turretBaseX - 36, turretBaseY);
            ctx.lineTo(turretBaseX - 22, turretBaseY - 14);
            ctx.lineTo(turretBaseX + 22, turretBaseY - 14);
            ctx.lineTo(turretBaseX + 36, turretBaseY);
            ctx.stroke();

            // Поворотные спаренные стволы огневой башни
            ctx.strokeStyle = lockedTarget ? '#ff0055' : '#ffff00';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(turretBaseX - 14, turretBaseY - 6);
            ctx.lineTo(bTipLeftX, bTipLeftY);
            ctx.moveTo(turretBaseX + 14, turretBaseY - 6);
            ctx.lineTo(bTipRightX, bTipRightY);
            ctx.stroke();

            // Пунктирная линия наведения от огневой рубки к прицелу мыши
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = lockedTarget ? 'rgba(255, 0, 85, 0.45)' : 'rgba(255, 255, 0, 0.28)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(turretBaseX, turretBaseY - 10);
            ctx.lineTo(aimX, aimY);
            ctx.stroke();
            ctx.restore();

            // Прицел Огневой Башни на указателе мыши (чистая геометрия без каких-либо текстовых подписей!)
            const reticleColor = lockedTarget
              ? lockedTarget.kind === 'SOS_POD'
                ? '#00ff88'
                : lockedTarget.kind === 'CARGO'
                ? lockedTarget.lootOrigin === 'PLAYER_DESTROYED_SHIP'
                  ? '#ff0055'
                  : '#f59e0b'
                : '#ff0055'
              : bestHoveredTarget
              ? '#00ffff'
              : '#ffff00';

            ctx.strokeStyle = reticleColor;
            ctx.lineWidth = lockedTarget || bestHoveredTarget ? 2.0 : 1.5;
            ctx.beginPath();
            ctx.arc(aimX, aimY, 22, 0, Math.PI * 2);
            ctx.moveTo(aimX - 28, aimY - 12);
            ctx.lineTo(aimX - 28, aimY - 28);
            ctx.lineTo(aimX - 12, aimY - 28);
            ctx.moveTo(aimX + 12, aimY - 28);
            ctx.lineTo(aimX + 28, aimY - 28);
            ctx.lineTo(aimX + 28, aimY - 12);
            ctx.moveTo(aimX - 28, aimY + 12);
            ctx.lineTo(aimX - 28, aimY + 28);
            ctx.lineTo(aimX - 12, aimY + 28);
            ctx.moveTo(aimX + 12, aimY + 28);
            ctx.lineTo(aimX + 28, aimY + 28);
            ctx.lineTo(aimX + 28, aimY + 12);
            ctx.moveTo(aimX - 8, aimY);
            ctx.lineTo(aimX + 8, aimY);
            ctx.moveTo(aimX, aimY - 8);
            ctx.lineTo(aimX, aimY + 8);
            ctx.stroke();

            // 6. Лучи Оружия №1 (ЛКМ / F — Импульсные лазеры бьют из стволов башни в точку прицела мыши!)
            if (st.laserFiringTimer > 0) {
              st.laserFiringTimer -= 1;
              const tx = st.lastShotTargetX;
              const ty = st.lastShotTargetY;
              ctx.strokeStyle = hasMilitaryLaser ? '#ff00ff' : '#00ffff';
              ctx.lineWidth = 2.6;
              ctx.beginPath();
              ctx.moveTo(bTipLeftX, bTipLeftY);
              ctx.lineTo(tx, ty);
              ctx.moveTo(bTipRightX, bTipRightY);
              ctx.lineTo(tx, ty);
              ctx.stroke();
            }

            // 7. Залп Оружия №2 (ПКМ — Тяжёлая плазменная пушка бьёт из башни в прицел мыши!)
            if (st.plasmaFiringTimer > 0) {
              st.plasmaFiringTimer -= 1;
              const tx = st.lastShotTargetX;
              const ty = st.lastShotTargetY;
              ctx.strokeStyle = '#ffff00';
              ctx.lineWidth = 4.2;
              ctx.beginPath();
              ctx.moveTo(bTipLeftX, bTipLeftY);
              ctx.lineTo(tx, ty);
              ctx.moveTo(bTipRightX, bTipRightY);
              ctx.lineTo(tx, ty);
              ctx.stroke();
              ctx.strokeStyle = '#ff0055';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(tx, ty, 24 + (11 - st.plasmaFiringTimer) * 3, 0, Math.PI * 2);
              ctx.stroke();
            }

            // 8. Гравитационный Луч Захвата капсул (Нажатие колёсика мыши СКМ — кольца в точке прицела мыши!)
            if (st.tractorBeamTimer > 0) {
              st.tractorBeamTimer -= 1;
              const tx = st.lastShotTargetX;
              const ty = st.lastShotTargetY;
              ctx.strokeStyle = '#00ff88';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(turretBaseX, turretBaseY - 10);
              ctx.lineTo(tx, ty);
              ctx.stroke();
              for (let r = 1; r <= 4; r++) {
                ctx.beginPath();
                ctx.arc(tx, ty, r * 20 + (st.tractorBeamTimer % 5) * 3, 0, Math.PI * 2);
                ctx.stroke();
              }
            }

            // 9. ТЯЖЁЛОЕ ГАММА-ВООРУЖЕНИЕ (Клавиша V — Контролируемое размыкание локальных узлов в виде гамма-квантов БЕЗ ПОСЛЕСВЕЧЕНИЯ!)
            if (st.gammaWeaponFiringTimer > 0) {
              st.gammaWeaponFiringTimer -= 1;
              const tx = st.lastShotTargetX;
              const ty = st.lastShotTargetY;
              ctx.save();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 5.5;
              ctx.beginPath();
              ctx.moveTo(bTipLeftX, bTipLeftY);
              ctx.lineTo(tx, ty);
              ctx.moveTo(bTipRightX, bTipRightY);
              ctx.lineTo(tx, ty);
              ctx.stroke();

              ctx.strokeStyle = '#e879f9';
              ctx.lineWidth = 2.2;
              for (let k = 0; k < 12; k++) {
                const ang = (k * Math.PI * 2) / 12;
                const rOut = 58 - st.gammaWeaponFiringTimer * 4;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx + Math.cos(ang) * rOut, ty + Math.sin(ang) * rOut);
                ctx.stroke();
              }
              ctx.restore();
            }

            // 10. ГАММА-ВСПЛЕСК СВЕРХНОВОЙ БЕЗ ПОСЛЕСВЕЧЕНИЯ (чистая геометрия без текста)
            if (st.supernovaBurstTimer > 0) {
              st.supernovaBurstTimer -= 1;
              ctx.save();
              ctx.strokeStyle = '#f5d0fe';
              ctx.lineWidth = 2.5;
              const burstRadius = (15 - st.supernovaBurstTimer) * 65;
              ctx.beginPath();
              ctx.arc(cx, cy, burstRadius, 0, Math.PI * 2);
              ctx.stroke();
              for (let q = 0; q < 20; q++) {
                const qAng = (q * Math.PI * 2) / 20;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(qAng) * 20, cy + Math.sin(qAng) * 20);
                ctx.lineTo(cx + Math.cos(qAng) * (burstRadius + 80), cy + Math.sin(qAng) * (burstRadius + 80));
                ctx.stroke();
              }
              ctx.restore();
            }
          }

          // =========================================================================
          // НИЖНЯЯ ПАНЕЛЬ КОКПИТА ELITE (ZX SPECTRUM 3D RADAR SCANNER + ПРИБОРЫ)
          // =========================================================================
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, viewH, width, height - viewH);
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          ctx.strokeRect(2, viewH + 2, width - 4, height - viewH - 4);
          ctx.strokeRect(2, 2, width - 4, viewH - 2);

          // Центральный 3D-Эллиптический Радар-Сканер (Elite 3D Scanner)
          const radarCx = width / 2;
          const radarCy = viewH + (height - viewH) * 0.56;
          const radarRx = Math.min(155, width * 0.24);
          const radarRy = Math.min(54, (height - viewH) * 0.34);

          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(radarCx, radarCy, radarRx, radarRy, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Сектор обзора на радаре
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.moveTo(radarCx, radarCy);
          ctx.lineTo(radarCx - radarRx * 0.65, radarCy - radarRy * 0.75);
          ctx.moveTo(radarCx, radarCy);
          ctx.lineTo(radarCx + radarRx * 0.65, radarCy - radarRy * 0.75);
          ctx.stroke();

          // Отображение Центральной Звезды и 4 Планет эклиптики на 3D-радаре (центр радара = позиция корабля)
          const starRadarNx = Math.max(-1, Math.min(1, st.starPos.x / SYSTEM_SPHERE_RADIUS));
          const starRadarNz = Math.max(-1, Math.min(1, st.starPos.z / SYSTEM_SPHERE_RADIUS));
          const starRadarNy = Math.max(-1, Math.min(1, st.starPos.y / 6000));
          const sBx = radarCx + starRadarNx * radarRx * 0.85;
          const sBy = radarCy - starRadarNz * radarRy * 0.8;
          const sStickY = sBy - starRadarNy * 20;
          ctx.strokeStyle = '#fde047';
          ctx.fillStyle = '#fde047';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sBx, sBy);
          ctx.lineTo(sBx, sStickY);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sBx, sStickY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Отображение 4 Планет на 3D-радаре точками их цветов
          for (const p of st.planets) {
            const cA = Math.cos(p.orbitAngle);
            const sA = Math.sin(p.orbitAngle);
            const px = st.starPos.x + p.orbitRadius * (cA * st.eclipticU.x + sA * st.eclipticV.x);
            const py = st.starPos.y + p.orbitRadius * (cA * st.eclipticU.y + sA * st.eclipticV.y);
            const pz = st.starPos.z + p.orbitRadius * (cA * st.eclipticU.z + sA * st.eclipticV.z);
            const pNx = Math.max(-1, Math.min(1, px / SYSTEM_SPHERE_RADIUS));
            const pNz = Math.max(-1, Math.min(1, pz / SYSTEM_SPHERE_RADIUS));
            const pNy = Math.max(-1, Math.min(1, py / 6000));
            const pBx = radarCx + pNx * radarRx * 0.85;
            const pBy = radarCy - pNz * radarRy * 0.8;
            const pStickY = pBy - pNy * 18;
            ctx.strokeStyle = p.color;
            ctx.fillStyle = p.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(pBx, pBy);
            ctx.lineTo(pBx, pStickY);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pBx, pStickY, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Отображение 3D-целей (модулей и грузов на межпланетных траекториях) на радаре в едином масштабе системы с планетами
          for (const ent of st.entities) {
            const nx = Math.max(-1, Math.min(1, ent.pos.x / SYSTEM_SPHERE_RADIUS));
            const nz = Math.max(-1, Math.min(1, ent.pos.z / SYSTEM_SPHERE_RADIUS));
            const ny = Math.max(-1, Math.min(1, ent.pos.y / 6000));

            const bx = radarCx + nx * radarRx * 0.85;
            const by = radarCy - nz * radarRy * 0.8;
            const stickTopY = by - ny * 18;

            ctx.strokeStyle = ent.color;
            ctx.fillStyle = ent.color;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx, stickTopY);
            ctx.stroke();
            ctx.fillRect(bx - 2, stickTopY - 2, 4, 4);
          }

          // Компас наведения на станцию Coriolis и индикатор Солнечной Зарядки (справа от радара)
          const compX = radarCx + radarRx + 36;
          const compY = viewH + 28;
          ctx.strokeStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(compX, compY, 14, 0, Math.PI * 2);
          ctx.stroke();
          const stationEnt = st.entities.find((e) => e.kind === 'STATION');
          if (stationEnt) {
            const dx = Math.max(-9, Math.min(9, stationEnt.pos.x / 55));
            const dy = Math.max(-9, Math.min(9, -stationEnt.pos.y / 55));
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(compX + dx - 2.5, compY + dy - 2.5, 5, 5);
          }

          // Индикатор направления на Звезду и % солнечной зарядки под компасом
          const sunCompY = viewH + 66;
          ctx.strokeStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(compX, sunCompY, 12, 0, Math.PI * 2);
          ctx.stroke();
          const sunDx = Math.max(-7, Math.min(7, st.starPos.x / 180));
          const sunDy = Math.max(-7, Math.min(7, -st.starPos.y / 180));
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(compX + sunDx, sunCompY + sunDy, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`☀${st.solarFluxPct}%`, compX, sunCompY + 23);

          // Левая колонка приборов (FS, AS, FUEL, LASER TEMP)
          const drawBar = (
            x: number,
            y: number,
            label: string,
            val: number,
            maxVal: number,
            barColor: string
          ) => {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(label, x, y + 9);
            const barX = x + 38;
            const barW = Math.max(55, radarCx - radarRx - 68);
            ctx.strokeStyle = '#555555';
            ctx.strokeRect(barX, y, barW, 10);
            ctx.fillStyle = barColor;
            ctx.fillRect(barX + 1, y + 1, Math.max(0, ((barW - 2) * val) / maxVal), 8);
          };

          drawBar(14, viewH + 16, 'FS', st.frontShield, 100, '#00ff00');
          drawBar(14, viewH + 34, 'AS', st.aftShield, 100, '#00ff00');
          drawBar(14, viewH + 52, 'FL', fuel, 7.0, '#00ffff');
          drawBar(14, viewH + 70, 'LT', st.laserHeat, 100, st.laserHeat > 75 ? '#ff0055' : '#ffff00');

          // Правая колонка приборов (SPD, MANEUVER с учётом скорости/инерции, ARMOR DEF, ENERGY)
          const rightX = radarCx + radarRx + 68;
          if (rightX + 95 < width) {
            const liveSpdRatioForHud = Math.max(0, Math.min(1, st.speed / Math.max(1, st.maxSpeed)));
            const liveEffectiveMnvPct = Math.round(
              Math.max(14, st.maneuverFactor * (1 - liveSpdRatioForHud * 0.62) * 100)
            );
            drawBar(rightX, viewH + 16, 'SPD', st.speed, st.maxSpeed, '#00ffff');
            drawBar(
              rightX,
              viewH + 34,
              'MNV',
              liveEffectiveMnvPct,
              100,
              '#ff00ff'
            );
            drawBar(
              rightX,
              viewH + 52,
              'DEF',
              Math.round(st.protectionFactor * 100),
              100,
              '#ffff00'
            );
            drawBar(rightX, viewH + 70, 'NRG', st.energy, 100, '#00ff00');
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    currentSystemId,
    fuel,
    handleToggleDocking,
    hasMilitaryLaser,
    isOpen,
    onEarnKarmaAndBonus,
    playZxBeep,
    screenMode,
    spawnSystemEntities,
  ]);

  if (!isOpen) return null;

  const currentSystem = GALAXY_SYSTEMS[currentSystemId] || GALAXY_SYSTEMS[0];
  const targetSystem = GALAXY_SYSTEMS[targetSystemId] || GALAXY_SYSTEMS[1];
  const usedCargoTons = usedCargoTonsForPhysics;

  // Точное преобразование координат указателя мыши в координаты 3D-прицела Огневой Башни
  const updateTurretReticleFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const canvasAspect = canvas.width / canvas.height;
    const rectAspect = rect.width / rect.height;
    let renderW = rect.width;
    let renderH = rect.height;
    let offsetX = 0;
    let offsetY = 0;
    if (rectAspect > canvasAspect) {
      renderW = rect.height * canvasAspect;
      offsetX = (rect.width - renderW) / 2;
    } else {
      renderH = rect.width / canvasAspect;
      offsetY = (rect.height - renderH) / 2;
    }
    const rawX = ((e.clientX - rect.left - offsetX) / renderW) * canvas.width;
    const rawY = ((e.clientY - rect.top - offsetY) / renderH) * canvas.height;
    const viewH = Math.floor(canvas.height * 0.72);
    flightStateRef.current.turretX = Math.max(18, Math.min(canvas.width - 18, rawX));
    flightStateRef.current.turretY = Math.max(18, Math.min(viewH - 14, rawY));
    flightStateRef.current.turretActive = true;
  };

  const xpRankMeta = getPilotExperienceRankByTons(destroyedEnemyTonsXp);
  const eliteRank = xpRankMeta.rank;

  const handleBuyCommodity = (comm: Commodity) => {
    const baseUnitPrice = Math.round(comm.basePrice * (currentSystem.priceFactors[comm.id] || 1));
    // Если статус ПИРАТ (карма в минусе): при покупке наценка ×10 (+)!
    const unitPrice = baseUnitPrice * pirateBuyMultiplier;
    if (credits < unitPrice) {
      setFlightMessage(
        `INSUFFICIENT CREDITS (NEED ${unitPrice} CR${isPirateStatus ? ' · PIRATE ×10 MARKUP' : ''})!`
      );
      return;
    }
    if (comm.unit === 't' && usedCargoTons >= maxCargoCapacity) {
      setFlightMessage('CARGO HOLD FULL! SELL GOODS OR UPGRADE CARGO BAY');
      return;
    }
    playZxBeep('DOCK');
    setCredits((c) => Number((c - unitPrice).toFixed(1)));
    setCargoHold((prev) => ({...prev, [comm.id]: (prev[comm.id] || 0) + 1}));
    setFlightMessage(
      isPirateStatus
        ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПОКУПКЕ ×10 +): КУПЛЕНО 1 ${comm.unit} ${comm.name} ЗА -${unitPrice} CR (БАЗОВАЯ ЦЕНА: ${baseUnitPrice} CR)`
        : `BOUGHT 1 ${comm.unit} OF ${comm.name} FOR ${unitPrice} CR`
    );
  };

  const handleSellCommodity = (comm: Commodity) => {
    const owned = cargoHold[comm.id] || 0;
    if (owned <= 0) return;
    const baseUnitPrice = Math.round(comm.basePrice * (currentSystem.priceFactors[comm.id] || 1));
    // Если статус ПИРАТ (карма в минусе): при продаже уценка ÷10 (-)!
    const unitPrice = Number((baseUnitPrice / pirateSellDivisor).toFixed(1));
    playZxBeep('DOCK');
    setCredits((c) => Number((c + unitPrice).toFixed(1)));
    setCargoHold((prev) => ({...prev, [comm.id]: Math.max(0, (prev[comm.id] || 0) - 1)}));
    setFlightMessage(
      isPirateStatus
        ? `🏴‍☠️ СТАТУС ПИРАТ (ПРИ ПРОДАЖЕ ÷10 -): ПРОДАНО 1 ${comm.unit} ${comm.name} ВСЕГО ЗА +${unitPrice} CR (БАЗОВАЯ ЦЕНА: ${baseUnitPrice} CR)`
        : `SOLD 1 ${comm.unit} OF ${comm.name} FOR ${unitPrice} CR`
    );
  };

  const handleAcceptMission = (missionId: string, destSysId: number) => {
    playZxBeep('MISSION');
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? {...m, status: 'ACTIVE'} : m))
    );
    setTargetSystemId(destSysId);
    setFlightMessage(
      `МИССИЯ GOBELL ПРИНЯТА! КУРС НА ${GALAXY_SYSTEMS[destSysId]?.name} ЗАДАН (НАЖМИТЕ H ДЛЯ ПРЫЖКА)`
    );
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black text-emerald-400 font-mono flex flex-col select-none overflow-hidden">
      {/* Верхняя строка статуса ZX Spectrum / GoBell Space Command */}
      <div className="px-3 py-2 border-b-2 border-cyan-400 bg-black flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-yellow-400 text-yellow-300 font-extrabold text-xs tracking-wider">
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span>GOBELL : ELITE 1984 (ZX SPECTRUM 3D)</span>
          </div>
          <span className="text-xs text-cyan-300 font-bold">
            CMDR {pilotName.toUpperCase()} · RANK: <span className="text-yellow-300">{eliteRank}</span> ·{' '}
            <span className="text-emerald-300">ОПЫТ: {destroyedEnemyTonsXp.toFixed(2)} Т</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold flex-wrap">
          <button
            type="button"
            onClick={() => setIsFullConfigDocOpen(true)}
            className="px-2.5 py-1 border-2 border-yellow-300 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-[11px] flex items-center gap-1.5 shadow-[0_0_14px_rgba(250,204,21,0.65)]"
            title="Открыть документ «Полное описание финальной конфигурации игры»: визуальный ряд, звёздная система и траектории, группы/бизнесы/объявления и карма (×10), масса/щит/схема урона и подсчёт очков (Дебет/Кредит)"
          >
            <span>📄 ПОЛНОЕ ОПИСАНИЕ ИГРЫ (КОНФИГУРАЦИЯ)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTonnageXpModalOpen(true)}
            className="px-2.5 py-1 border-2 border-amber-400 bg-amber-500/20 hover:bg-amber-400 hover:text-black text-amber-200 font-extrabold text-[11px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(251,191,36,0.45)]"
            title="Простой Дебет / Кредит игровых очков: потратил 51 т залпа и уничтожил противника (50 т) -> засчиталось 50 т XP (если не уничтожил — не засчитываются). Если работает команда — считаются конкретно твои попадания и после уничтожения врага тебе засчитываются уничтоженные тобой тонны!"
          >
            <Award className="w-3.5 h-3.5 text-yellow-300" />
            <span>
              🏆 КРЕДИТ (XP): {destroyedEnemyTonsXp.toFixed(2)} Т · ДЕБЕТ ЗАЛПА: {(spentSalvoDebitKg / 1000).toFixed(1)} Т ·{' '}
              {isTeamCombatMode ? '🤝 КОМАНДА' : '👤 СОЛО'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsLogisticsModalOpen(true)}
            className="px-2.5 py-1 border-2 border-cyan-400 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-200 font-extrabold text-[11px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
            title="Строгие траектории без хаотических движений: у каждой планеты свой автоматический логистический стандартный модуль (цикл: своя планета -> другая планета 1 -> орбита 1 мин -> возврат -> орбита 1 мин -> другая планета 2...). При гибели груз движется по траектории убитого корабля и исчезает в планете назначения. Уничтожение мусора/груза = уничтожение астероида!"
          >
            <span>
              🛰️ ТРАЕКТОРИИ ПЛАНЕТ (4 МОДУЛЯ · ИСЧЕЗЛО В ПЛАНЕТАХ: {absorbedInPlanetCount} · УБИТО КАК АСТЕРОИД: {destroyedCargoDebrisAsAsteroidCount})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsGeoBeaconModalOpen(true)}
            className="px-2.5 py-1 border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-400 hover:text-black text-emerald-300 font-extrabold text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            title="Пока вы играете в космосе, геолокация смартфона активна и ваш профиль светится на реальной карте GoBell!"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              📡 GPS ВКЛ ({smartphoneGeoCoords.lat.toFixed(4)}, {smartphoneGeoCoords.lng.toFixed(4)}) · ВЫ СВЕТИТЕСЬ НА КАРТЕ GOBELL
            </span>
          </button>
          <span className="text-yellow-300">CREDITS: {credits} CR</span>
          <span className="text-cyan-300">FUEL: {fuel.toFixed(1)} LY</span>
          <span className="text-emerald-400">
            CARGO: {usedCargoTons}/{maxCargoCapacity}t
          </span>
          <button
            type="button"
            onClick={() => setIsOntologyModalOpen(true)}
            className={`px-2 py-1 border-2 font-extrabold text-[11px] flex items-center gap-1 ${
              reactorSuperEnergySec > 0
                ? 'border-fuchsia-300 bg-fuchsia-400 text-black shadow-[0_0_12px_rgba(232,121,249,0.8)]'
                : 'border-fuchsia-400 bg-fuchsia-950/50 hover:bg-fuchsia-400 hover:text-black text-fuchsia-200'
            }`}
            title="Онтологическая модель диссипации вещества: Критическое вещество (Ω-γ), контролируемое размыкание локальных узлов (супер-энергия для тяжёлых кораблей и тяжёлого гамма-оружия), старые галактики без планет и контрабанда"
          >
            <span>
              ☢️ КРИТ. ВЕЩЕСТВО Ω-γ: {minedElementsHold.Omega || 0}т
              {reactorSuperEnergySec > 0 ? ` · СУПЕР-ЭНЕРГИЯ ${reactorSuperEnergySec}с` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsBusinessModalOpen(true)}
            className="px-2 py-1 border border-fuchsia-400 bg-fuchsia-500/20 hover:bg-fuchsia-400 hover:text-black text-fuchsia-300 font-extrabold text-[11px]"
            title="Бизнес-аккаунт пилота: создать бизнес с меньшей маржой (закупать по завышенной цене >50%, продавать по заниженной <100% по сравнению с правительствами планет)"
          >
            🏢 БИЗНЕС ({gobellTariff === 'BUSINESS' && pilotBusiness.isCreated ? `${pilotBusiness.buyRatePct}%/${pilotBusiness.sellRatePct}%` : 'ПРАВ-ВА 50%/100%'})
          </button>
          <button
            type="button"
            onClick={() => setIsSubspaceChannelModalOpen(true)}
            className="px-2 py-1 border border-yellow-400 bg-yellow-400/20 hover:bg-yellow-400 hover:text-black text-yellow-300 font-extrabold text-[11px]"
            title="Подпространственный канал фиксации (аукцион слота объявления): зафиксировать объявление прямо возле себя или в любой точке · Доля в пуле аукциона"
          >
            📡 КАНАЛ ФИКСАЦИИ (ПУЛ {myAuctionPoolSharePct}%)
          </button>
          <button
            type="button"
            onClick={handleTogglePirateStatus}
            className={`px-2.5 py-1 border-2 font-extrabold text-[11px] flex items-center gap-1 transition-all ${
              isPirateStatus
                ? 'border-rose-400 bg-rose-600 text-white shadow-[0_0_14px_rgba(244,63,94,0.85)]'
                : isMarauderStatus
                ? 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'border-emerald-400 bg-emerald-950/40 hover:bg-amber-500/30 text-emerald-300'
            }`}
            title="Статус ПИРАТ: если разбил чужой корабль и забрал с него хоть 1 предмет (карма в минусе + наценка на всё ×10: покупка ×10+, продажа ÷10-). Статус МАРОДЁР: если просто подобрал предмет после драки (просто портится карма, без наценки ×10)."
          >
            <span>
              {isPirateStatus
                ? `🏴‍☠️ СТАТУС: ПИРАТ (КАРМА ${earnedGoBellKarma} · КУП ×10+ / ПРОД ÷10-)`
                : isMarauderStatus
                ? `🦅 СТАТУС: МАРОДЁР (ПОДОБРАЛ ПОСЛЕ ДРАКИ · КАРМА ${
                    earnedGoBellKarma > 0 ? `+${earnedGoBellKarma}` : earnedGoBellKarma
                  } · ЦЕНЫ 1×)`
                : `🛡️ ЗАКОННЫЙ (КАРМА ${
                    earnedGoBellKarma >= 0 ? `+${earnedGoBellKarma}` : earnedGoBellKarma
                  })`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-1.5 border border-cyan-500 text-cyan-300 hover:bg-cyan-500/20"
            title="Звук ZX Spectrum Beeper"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 border-2 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-black font-extrabold flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>НА КАРТУ GOBELL</span>
          </button>
        </div>
      </div>

      {/* Информационная строка бортового компьютера */}
      <div className="px-3 py-1 bg-slate-950 border-b border-emerald-500/40 flex items-center justify-between text-[11px] text-yellow-300">
        <div className="truncate font-bold">{flightMessage}</div>
        <div className="flex items-center gap-3 shrink-0 text-cyan-300">
          <span>СИСТЕМА: {currentSystem.name}</span>
          <span>→ ЦЕЛЬ ПРЫЖКА: {targetSystem.name}</span>
        </div>
      </div>

      {/* Основная область: 3D-Космос + Терминал Миссий GoBell / Торговли / Галактической Карты */}
      <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Левый / главный экран 3D Wireframe */}
        <div
          ref={viewportContainerRef}
          className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={860}
            height={540}
            onContextMenu={(e) => e.preventDefault()}
            onMouseMove={(e) => {
              if (screenMode !== 'FLIGHT') return;
              updateTurretReticleFromMouse(e);
            }}
            onMouseDown={(e) => {
              if (screenMode !== 'FLIGHT') return;
              updateTurretReticleFromMouse(e);
              // Если курсор наведён на объект GoBell на планете — клик ЛКМ открывает Форму запроса на контакт!
              if (e.button === 0 && hoveredPlanetObjRef.current) {
                e.preventDefault();
                const targetObj = hoveredPlanetObjRef.current;
                setPlanetContactTarget({
                  obj: targetObj,
                  planetName: targetObj.planetCleanName,
                });
                setPlanetContactNote(
                  targetObj.kind === 'GROUP'
                    ? `Приветствую группу «${targetObj.title}» (${targetObj.description})! Хочу установить планетарный контакт.`
                    : `Здравствуйте, «${targetObj.authorName}»! Заинтересовало: ${targetObj.title}.`
                );
                playZxBeep('MISSION');
                return;
              }
              if (e.button === 0) {
                e.preventDefault();
                handleFireLaser();
              } else if (e.button === 1) {
                e.preventDefault();
                handleTractorCapture();
              } else if (e.button === 2) {
                e.preventDefault();
                handleFireSecondaryWeapon();
              }
            }}
            onWheel={(e) => {
              if (screenMode !== 'FLIGHT') return;
              e.preventDefault();
              const deltaPct = e.deltaY < 0 ? 8 : -8;
              setThrottleUi((prev) => {
                const next = Math.max(0, Math.min(100, prev + deltaPct));
                flightStateRef.current.targetSpeed =
                  (next / 100) * flightStateRef.current.maxSpeed;
                return next;
              });
            }}
            className="w-full h-full object-contain bg-black cursor-crosshair"
          />

          {/* БЫСТРАЯ КНОПКА ЗАКРЕПЛЕНИЯ / ОТКРЕПЛЕНИЯ НА СТАЦИОНАРНОЙ ОРБИТЕ ПЛАНЕТЫ (КЛАВИША X) ПРЯМО НА 3D-ЭКРАНЕ */}
          {screenMode === 'FLIGHT' && !sentContactBanner && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 flex-wrap pointer-events-auto">
              <button
                type="button"
                onClick={handleToggleStationaryOrbit}
                className={`px-3.5 py-2 border-2 font-extrabold text-xs transition-all shadow-lg flex items-center gap-2 ${
                  stationaryOrbitInfo
                    ? 'bg-emerald-400 text-black border-yellow-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]'
                    : 'bg-slate-950/90 hover:bg-emerald-500 hover:text-black text-emerald-300 border-emerald-400'
                }`}
                title="Нажмите клавишу X, чтобы закрепиться на стационарной орбите планеты (осевое вращение планеты остановится, а корабль будет двигаться вокруг оси вместе с планетой) или повторно X — чтобы открепиться"
              >
                <span>
                  {stationaryOrbitInfo
                    ? `🛰 НА СТАЦИОНАРНОЙ ОРБИТЕ: ${stationaryOrbitInfo.cleanName.toUpperCase()} · ОТКРЕПИТЬСЯ (X)`
                    : '🛰 ЗАКРЕПИТЬСЯ НА СТАЦИОНАРНОЙ ОРБИТЕ (X)'}
                </span>
              </button>
              {stationaryOrbitInfo && (
                <div className="px-2.5 py-1.5 bg-slate-950/90 border border-emerald-400/70 text-[10px] text-cyan-300 font-bold">
                  Осевое вращение планеты остановлено · Вся система вращается вокруг оси планеты [X — открепить]
                </div>
              )}
            </div>
          )}

          {/* КАРТОЧКА ПРОФИЛЯ ЛЮБОГО ОБЪЕКТА (СОЛНЦЕ, ПЛАНЕТА, ГРУППА, БИЗНЕС, ОБЪЯВЛЕНИЕ, МОДУЛЬ, ГРУЗ, АСТЕРОИД) — ПОЯВЛЯЕТСЯ РЯДОМ С ОБЪЕКТОМ ТОЛЬКО КОГДА ОБЪЕКТ В ЗОНЕ ДЕЙСТВИЯ КУРСОРА МЫШИ И НАЖАТА КЛАВИША I */}
          <SpaceObjectProfileModal
            profile={screenMode === 'FLIGHT' ? activeObjectProfile : null}
            onClose={() => {
              isHoveringObjectCardRef.current = false;
              activeObjectProfileRef.current = null;
              setActiveObjectProfile(null);
            }}
            onMouseEnterCard={() => {
              isHoveringObjectCardRef.current = true;
            }}
            onMouseLeaveCard={() => {
              isHoveringObjectCardRef.current = false;
            }}
            customOverrides={customObjectOverrides}
            onUpdateCustomOverride={handleUpdateCustomObjectOverride}
            joinedPlanetGroups={joinedPlanetGroups}
            maxAllowedPlanetGroups={maxAllowedPlanetGroups}
            gobellTariff={gobellTariff}
            onToggleJoinPlanetGroup={handleToggleJoinPlanetGroup}
            onSelectGoBellTariff={handleSelectGoBellTariff}
            onSupplyFromPlanet={handleSupplyFromPlanet}
            onDeliverGovernmentContract={handleDeliverGovernmentContract}
            onSellAllPeriodicElements={() => handleSellPeriodicElement('ALL')}
            onFocusObjectInSpace={handleFocusObjectFromProfile}
            onToggleStationaryOrbit={handleToggleStationaryOrbit}
            isStationaryOrbitLocked={Boolean(stationaryOrbitInfo)}
            onTractorCaptureObject={(prof) => {
              handleFocusObjectFromProfile(prof);
              handleTractorCapture();
            }}
            onDestroyObjectAsAsteroid={(prof) => {
              handleDestroyCargoOrDebrisAsAsteroid(prof.entityId);
              isHoveringObjectCardRef.current = false;
              activeObjectProfileRef.current = null;
              setActiveObjectProfile(null);
            }}
            onDockStation={handleToggleDocking}
            onSendContactRequest={(targetName, planetOrSectorName, category, note, groupTag) => {
              playZxBeep('MISSION');
              setEarnedGoBellKarma((k) => k + 1);
              onEarnKarmaAndBonus?.(
                1,
                150,
                `Запрос на контакт с объектом «${targetName}» (${planetOrSectorName})`
              );
              onSendPlanetContactRequest?.({
                id: `obj-contact-${Date.now()}`,
                name: `${targetName} · ${planetOrSectorName}`,
                category,
                note,
                karmaPlus: 20,
                planetName: planetOrSectorName,
                groupTag,
                openChatAfterSend: false,
              });
              setSentContactBanner({
                targetName,
                planetName: planetOrSectorName,
                category,
                note,
              });
              setFlightMessage(
                `✓ ЗАПРОС НА КОНТАКТ ДОСТАВЛЕН В CHAT GOBELL: «${targetName}» (${planetOrSectorName.toUpperCase()})`
              );
            }}
            ironStock={ironStock}
            aluminumStock={aluminumStock}
            foodWaterCargoStock={foodWaterCargoStock}
            titaniumStock={titaniumStock}
            usedCargoTons={usedCargoTons}
            maxCargoCapacity={maxCargoCapacity}
            isPirateStatus={isPirateStatus}
            pirateBuyMultiplier={pirateBuyMultiplier}
            pirateSellDivisor={pirateSellDivisor}
          />

          {/* УВЕДОМЛЕНИЕ ОБ ОТПРАВЛЕННОМ ЗАПРОСЕ НА КОНТАКТ С ПЛАНЕТЫ В GOBELL CHAT */}
          {sentContactBanner && (
            <div className="absolute top-3 left-3 right-3 z-30 bg-slate-950/95 border-2 border-emerald-400 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shadow-2xl font-sans">
              <div className="space-y-0.5 text-xs">
                <div className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Запрос на контакт отправлен в Chat GoBell: «{sentContactBanner.targetName}» (планета {sentContactBanner.planetName}) · +1 Карма GoBell!
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Сопроводительная записка: «{sentContactBanner.note}»
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onSendPlanetContactRequest && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendPlanetContactRequest({
                        id: `planet-open-${Date.now()}`,
                        name: sentContactBanner.targetName,
                        category: sentContactBanner.category,
                        note: sentContactBanner.note,
                        karmaPlus: 20,
                        planetName: sentContactBanner.planetName,
                        openChatAfterSend: true,
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold"
                  >
                    Открыть в Chat GoBell →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSentContactBanner(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  ОК
                </button>
              </div>
            </div>
          )}

          {/* МОДАЛЬНОЕ ОКНО «ФОРМА ЗАПРОСА НА КОНТАКТ» (ТОЧНО КАК НА КАРТЕ GOBELL) */}
          {planetContactTarget && (
            <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
              <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">Форма запроса на контакт</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlanetContactTarget(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!planetContactNote.trim()) return;
                    const targetObj = planetContactTarget.obj;
                    const mappedCategory: 'GROUPS' | 'BUSINESS' | 'ADVERT' =
                      targetObj.kind === 'GROUP'
                        ? 'GROUPS'
                        : targetObj.kind === 'BUSINESS'
                        ? 'BUSINESS'
                        : 'ADVERT';

                    playZxBeep('MISSION');
                    setEarnedGoBellKarma((k) => k + 1);
                    onEarnKarmaAndBonus?.(
                      1,
                      150,
                      `Запрос на контакт с планетарным объектом GoBell: ${targetObj.title}`
                    );
                    onSendPlanetContactRequest?.({
                      id: targetObj.id,
                      name: `${targetObj.authorName} · Планета ${targetObj.planetCleanName}`,
                      category: mappedCategory,
                      note: planetContactNote.trim(),
                      karmaPlus: targetObj.karmaPlus,
                      planetName: targetObj.planetCleanName,
                      groupTag: targetObj.groupTag,
                      openChatAfterSend: false,
                    });
                    setSentContactBanner({
                      targetName: targetObj.title,
                      planetName: targetObj.planetCleanName,
                      category: mappedCategory,
                      note: planetContactNote.trim(),
                    });
                    setFlightMessage(
                      `✓ ЗАПРОС НА КОНТАКТ ДОСТАВЛЕН В CHAT GOBELL: «${targetObj.title}» (ПЛАНЕТА ${targetObj.planetCleanName.toUpperCase()})`
                    );
                    setPlanetContactTarget(null);
                  }}
                  className="p-5 space-y-4"
                >
                  <div className="space-y-1 text-xs text-slate-300">
                    <div>
                      Планета: <strong className="text-sky-300">{planetContactTarget.planetName}</strong>
                    </div>
                    <div>
                      Объект GoBell:{' '}
                      <strong className="text-white">{planetContactTarget.obj.title}</strong>
                    </div>
                    <div>
                      Описание:{' '}
                      <span className="text-emerald-300 font-semibold">
                        {planetContactTarget.obj.description}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Сопроводительная записка (поясните необходимость контакта):
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={planetContactNote}
                      onChange={(e) => setPlanetContactNote(e.target.value)}
                      placeholder="Напишите цель обращения, чтобы пользователь мог принять ваш запрос на контакт..."
                      className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPlanetContactTarget(null)}
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

          {/* ОБЯЗАТЕЛЬНЫЙ ШЛЮЗ АКТИВАЦИИ ГЕОЛОКАЦИИ СМАРТФОНА: ЧТОБЫ ИГРАТЬ В ELITE 3D, ДОЛЖНА БЫТЬ АКТИВИРОВАНА ГЕОЛОКАЦИЯ СМАРТФОНА (ИГРОК СВЕТИТСЯ НА РЕАЛЬНОЙ КАРТЕ GOBELL!) */}
          {!isSmartphoneGeoActive && (
            <div className="fixed inset-0 z-[190] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 font-sans">
              <div className="w-full max-w-xl bg-slate-900 border-2 border-emerald-400 rounded-2xl shadow-[0_0_45px_rgba(16,185,129,0.45)] overflow-hidden p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-extrabold uppercase">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Обязательное условие запуска GoBell : ELITE 3D</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white pt-1">
                      Для активации игры должна быть включена геолокация на смартфоне!
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white"
                    title="Вернуться на карту GoBell"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2.5 text-xs text-slate-200 leading-relaxed">
                  <div className="font-extrabold text-emerald-300 text-sm">
                    📡 Как работает связка космоса и реальной карты GoBell:
                  </div>
                  <div>
                    • <b className="text-white">Когда игрок играет в космосе — он светится на реальной карте GoBell</b> в своих физических координатах смартфона (<span className="font-mono text-cyan-300">{smartphoneGeoCoords.lat.toFixed(4)}, {smartphoneGeoCoords.lng.toFixed(4)}</span>).
                  </div>
                  <div>
                    • <b className="text-amber-300">Преодоление холодного старта:</b> пока пилоты проводят время в звёздной системе (добывают элементы в Поясе астероидов, выполняют контракты правительств планет или фиксируют подпространственные слоты), их реальные профили со всеми тегами образуют живую светящуюся сеть на карте города и принимают запросы на контакт!
                  </div>
                  <div>
                    • <b className="text-rose-300">Без включённой геолокации смартфона</b> бортовые двигатели и 3D-сканер корабля Cobra Mk III заблокированы.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Вернуться на карту GoBell
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playZxBeep('MISSION');
                      onToggleSmartphoneGeo?.(true);
                      setFlightMessage(
                        `📡 ГЕОЛОКАЦИЯ СМАРТФОНА АКТИВИРОВАНА (${smartphoneGeoCoords.lat.toFixed(4)}, ${smartphoneGeoCoords.lng.toFixed(4)})! ВЫ СВЕТИТЕСЬ НА РЕАЛЬНОЙ КАРТЕ GOBELL!`
                      );
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.7)] flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>ВКЛЮЧИТЬ ГЕОЛОКАЦИЮ СМАРТФОНА И ИГРАТЬ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* МОДАЛЬНОЕ ОКНО СТАТУСА МАЯКА ГЕОЛОКАЦИИ: ИГРОК СВЕТИТСЯ НА РЕАЛЬНОЙ КАРТЕ GOBELL ВО ВРЕМЯ ИГРЫ */}
          {isGeoBeaconModalOpen && (
            <div className="fixed inset-0 z-[175] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
              <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-400 rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-sm font-extrabold text-emerald-300 uppercase">
                      📡 Маяк смартфона активен · Вы светитесь на реальной карте GoBell
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGeoBeaconModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/50 text-slate-200 space-y-2 leading-relaxed">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-emerald-300">Статус геолокации смартфона:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 font-extrabold text-[11px]">
                        АКТИВНА · ОНЛАЙН В КОСМОСЕ И НА КАРТЕ
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-slate-300">Ваши реальные координаты на карте GoBell:</span>
                      <span className="font-mono font-extrabold text-cyan-300">
                        {smartphoneGeoCoords.lat.toFixed(6)}, {smartphoneGeoCoords.lng.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-slate-300">Профиль пилота на карте города:</span>
                      <span className="font-extrabold text-white">
                        {pilotName} ({GOBELL_SPACE_TARIFF_META[gobellTariff].badge})
                      </span>
                    </div>
                    {pilotProfileTags.length > 0 && (
                      <div className="pt-1 border-t border-emerald-500/30">
                        <div className="text-[11px] text-slate-300 mb-1">
                          Ваши активные слова-теги, которые прямо сейчас светятся в поиске GoBell:
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pilotProfileTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-400/50 text-emerald-300 font-mono text-[10px] font-bold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    Пока вы находитесь в <b>GoBell : ELITE 3D</b>, ваш смартфон транслирует геолокацию, а ваш аватар подсвечен пульсирующим маяком на реальной карте GoBell. Любой пользователь в радиусе поиска видит вас на карте и может отправить вам запрос на контакт!
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGeoBeaconModalOpen(false);
                        onToggleSmartphoneGeo?.(false);
                      }}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-700 font-bold text-[11px]"
                    >
                      Отключить геолокацию (Блокировать игру)
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {onViewPlayerOnRealMap && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsGeoBeaconModalOpen(false);
                            onViewPlayerOnRealMap();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs shadow-md"
                        >
                          👁 Посмотреть как я свечусь на карте GoBell
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsGeoBeaconModalOpen(false)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                      >
                        Продолжить полёт
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* МОДАЛЬНОЕ ОКНО 1: БИЗНЕС-АККАУНТ ПИЛОТА И СОЗДАНИЕ БИЗНЕСА С МЕНЬШЕЙ МАРЖОЙ (ПРОТИВ 50% / 100% ПРАВИТЕЛЬСТВ ПЛАНЕТ) */}
          {isBusinessModalOpen && (
            <div className="fixed inset-0 z-[155] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
              <div className="w-full max-w-2xl bg-slate-900 border-2 border-fuchsia-400 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    <h3 className="text-sm font-extrabold text-fuchsia-300 uppercase">
                      🏢 Бизнес-Аккаунт GoBell · Создание Бизнеса с Меньшей Маржой
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBusinessModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs overflow-y-auto">
                  <div className="p-3.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/40 text-slate-200 leading-relaxed space-y-1.5">
                    <div>
                      • <b className="text-amber-300">Правительства планет (Группы)</b> закупают ресурсы и элементы из Пояса астероидов за <b>полцены (50%)</b>, а продают за <b>полную цену (100%)</b> (маржа правительств = 50%).
                    </div>
                    <div>
                      • <b className="text-fuchsia-300">Если пилот подписывается на Бизнес-аккаунт (BUSINESS)</b>, он может создать собственный Бизнес с <b>меньшей маржой</b>: закупать по <b>завышенной цене ({pilotBusiness.buyRatePct}% вместо 50%)</b>, а продавать по <b>заниженной цене ({pilotBusiness.sellRatePct}% вместо 100%)</b> по сравнению с правительствами планет!
                    </div>
                  </div>

                  {/* Выбор тарифа GoBell */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {(
                      ['FREE', 'PRO', 'PRO_PLUS_1', 'PRO_PLUS_2', 'BUSINESS'] as GoBellSpaceTariff[]
                    ).map((tKey) => {
                      const meta = GOBELL_SPACE_TARIFF_META[tKey];
                      const active = gobellTariff === tKey;
                      return (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => handleSelectGoBellTariff(tKey)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            active
                              ? 'border-emerald-400 bg-emerald-950/40 text-white'
                              : tKey === 'BUSINESS'
                              ? 'border-fuchsia-400/70 bg-fuchsia-950/20 text-fuchsia-200 hover:border-fuchsia-300'
                              : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-400'
                          }`}
                        >
                          <div className="font-extrabold text-[11px]">{meta.badge}</div>
                          <div className="text-[10px] text-amber-300 font-bold">{meta.priceLabel}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Групп: {meta.maxGroups} · Слотов: {tKey === 'BUSINESS' ? 4 : tKey === 'PRO_PLUS_2' ? 3 : tKey === 'PRO_PLUS_1' ? 2 : 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Настройки Бизнеса пилота с меньшей маржой */}
                  <div className="p-4 rounded-xl border border-slate-700 bg-slate-950 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 font-bold mb-1">
                          Название вашего Бизнеса:
                        </label>
                        <input
                          type="text"
                          value={pilotBusiness.name}
                          onChange={(e) =>
                            setPilotBusiness((p) => ({...p, name: e.target.value}))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 font-bold mb-1">
                          Планета размещения маркера Бизнеса в 3D-сцене:
                        </label>
                        <select
                          value={pilotBusiness.planetOrder}
                          onChange={(e) =>
                            setPilotBusiness((p) => ({
                              ...p,
                              planetOrder: Number(e.target.value) as 1 | 2 | 3 | 4,
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                        >
                          <option value={1}>I. Меркурий (Железо Fe)</option>
                          <option value={2}>II. Венера (Алюминий Al)</option>
                          <option value={3}>III. Земля (Продовольствие и Вода O₂)</option>
                          <option value={4}>IV. Марс (Титан Ti)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-1">
                        <div className="flex justify-between font-bold text-[11px]">
                          <span className="text-emerald-300">Закупка (Завышенная vs 50%):</span>
                          <span className="text-white font-extrabold">
                            {pilotBusiness.buyRatePct}% (у прав-ва 50%)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={55}
                          max={85}
                          step={5}
                          value={pilotBusiness.buyRatePct}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPilotBusiness((p) => ({
                              ...p,
                              buyRatePct: val,
                              sellRatePct: Math.max(val + 5, p.sellRatePct),
                            }));
                          }}
                          className="w-full accent-emerald-400 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400">
                          Закупаете дороже правительств ({pilotBusiness.buyRatePct}% &gt; 50%).
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-1">
                        <div className="flex justify-between font-bold text-[11px]">
                          <span className="text-cyan-300">Продажа (Заниженная vs 100%):</span>
                          <span className="text-white font-extrabold">
                            {pilotBusiness.sellRatePct}% (у прав-ва 100%)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={65}
                          max={95}
                          step={5}
                          value={pilotBusiness.sellRatePct}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPilotBusiness((p) => ({
                              ...p,
                              sellRatePct: val,
                              buyRatePct: Math.min(p.buyRatePct, val - 5),
                            }));
                          }}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400">
                          Продаёте дешевле правительств ({pilotBusiness.sellRatePct}% &lt; 100%). Маржа бизнеса:{' '}
                          <b className="text-fuchsia-300">
                            {pilotBusiness.sellRatePct - pilotBusiness.buyRatePct}%
                          </b>{' '}
                          (против 50% у правительств).
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-800">
                      <div className="text-[11px] text-slate-300">
                        Оборот бизнеса: сделок <b className="text-white">{pilotBusiness.dealsCount}</b> · прибыль{' '}
                        <b className="text-emerald-300">+{pilotBusiness.totalTurnoverProfitCr} CR</b>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCreateOrUpdatePilotBusiness}
                          className="px-3.5 py-2 rounded-xl bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-extrabold text-xs"
                        >
                          {pilotBusiness.isCreated
                            ? '✓ Обновить бизнес с меньшей маржой'
                            : '🏢 Подключить BUSINESS и создать бизнес'}
                        </button>
                        {pilotBusiness.isCreated && (
                          <button
                            type="button"
                            onClick={handleRunPilotBusinessTurnover}
                            className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs"
                          >
                            🤝 Провести оборот бизнеса (+CR)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* МОДАЛЬНОЕ ОКНО 2: ПОДПРОСТРАНСТВЕННЫЙ КАНАЛ ФИКСАЦИИ (АНАЛОГ АУКЦИОНА СЛОТА ОБЪЯВЛЕНИЯ GOBELL · ДОЛЯ В ПУЛЕ АУКЦИОНА) */}
          {isSubspaceChannelModalOpen && (
            <div className="fixed inset-0 z-[156] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
              <div className="w-full max-w-2xl bg-slate-900 border-2 border-yellow-400 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-extrabold text-yellow-300 uppercase">
                      📡 Подпространственный канал фиксации · Пул Аукциона Слотов
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSubspaceChannelModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs overflow-y-auto">
                  <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-400/50 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-yellow-300 text-sm">
                        📊 ВАША ДОЛЯ В ПУЛЕ АУКЦИОНА: {myAuctionPoolSharePct}% (Вес пая: {myAuctionPoolWeight})
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-yellow-400 text-black font-extrabold text-[11px]">
                        Доступно каналов по тарифу {GOBELL_SPACE_TARIFF_META[gobellTariff].badge}:{' '}
                        {allowedSubspaceSlotsCount} (до {maxSubspaceWordsForTariff} слов)
                      </span>
                    </div>
                    <div className="text-slate-200 leading-relaxed text-[11px]">
                      Аналог <b>Аукциона слота объявления GoBell</b>: вы можете зафиксировать объявление <b>прямо возле себя</b> или <b>в любой точке звёздной системы</b>, либо передать канал в <b>Пул Аукциона</b>, чтобы получать <b>долю в пуле аукциона</b> (начислено дивидендов:{' '}
                      <b className="text-emerald-300">+{subspacePoolDividendsCr} CR</b> · погашение подписки:{' '}
                      <b className="text-cyan-300">${subspaceSubscriptionPayoffUsd.toFixed(2)}</b>).
                    </div>
                  </div>

                  {/* Слоты Подпространственного канала фиксации */}
                  <div className="space-y-3">
                    {subspaceSlots.slice(0, allowedSubspaceSlotsCount).map((slot) => (
                      <div
                        key={slot.slotId}
                        className={`p-3.5 rounded-xl border-2 space-y-2.5 ${
                          slot.inAuctionPool
                            ? 'border-yellow-400 bg-yellow-950/20'
                            : slot.isFixedInSpace
                            ? 'border-cyan-400 bg-slate-950'
                            : 'border-slate-700 bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-extrabold text-[10px]">
                              КАНАЛ ФИКСАЦИИ #{slot.slotId}
                            </span>
                            <span className="text-[11px] font-bold text-cyan-300">
                              Точка: {slot.fixedPointLabel}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSubspaceAuctionPool(slot.slotId)}
                            className={`px-3 py-1 rounded-lg font-extrabold text-[11px] ${
                              slot.inAuctionPool
                                ? 'bg-emerald-400 text-black'
                                : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                            }`}
                          >
                            {slot.inAuctionPool
                              ? '✓ В пуле аукциона (приносит долю CR + $)'
                              : 'Передать в Пул Аукциона (+Доля в пуле)'}
                          </button>
                        </div>

                        <input
                          type="text"
                          value={slot.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubspaceSlots((prev) =>
                              prev.map((s) => (s.slotId === slot.slotId ? {...s, text: val} : s))
                            );
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          placeholder="Текст объявления для фиксации в подпространственном канале..."
                        />

                        {/* Выбор точки фиксации: Прямо возле себя или Любая точка */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(
                              [
                                {id: 'NEAR_SHIP', label: '📍 Прямо возле себя'},
                                {id: 'CURSOR', label: '🎯 В прицеле'},
                                {id: 'STAR', label: '☀ У Звезды'},
                                {id: 'MERCURY', label: '🟠 Меркурий'},
                                {id: 'VENUS', label: '🟢 Венера'},
                                {id: 'EARTH', label: '🔵 Земля'},
                                {id: 'MARS', label: '🔴 Марс'},
                                {id: 'BELT', label: '🪨 Пояс'},
                                {id: 'EDGE', label: '🔭 Окраина'},
                              ] as Array<{id: SubspacePointPreset; label: string}>
                            ).map((pt) => (
                              <button
                                key={pt.id}
                                type="button"
                                onClick={() =>
                                  handleFixSubspaceAdvert(
                                    slot.slotId,
                                    pt.id === 'NEAR_SHIP' ? 'NEAR_SHIP' : 'ANY_POINT',
                                    pt.id
                                  )
                                }
                                className={`px-2 py-1 rounded border text-[10px] font-bold ${
                                  slot.pointPreset === pt.id && slot.isFixedInSpace
                                    ? 'bg-cyan-400 text-black border-cyan-300'
                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-400'
                                }`}
                              >
                                {pt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* МОДАЛЬНОЕ ОКНО 3: ОНТОЛОГИЧЕСКАЯ МОДЕЛЬ ДИССИПАЦИИ ВЕЩЕСТВА, КРИТИЧЕСКОЕ ВЕЩЕСТВО (Ω-γ), СТАРЫЕ ГАЛАКТИКИ, ТЯЖЁЛЫЕ КОРАБЛИ И КОНТРАБАНДА */}
          {isOntologyModalOpen && (
            <div className="fixed inset-0 z-[158] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
              <div className="w-full max-w-2xl bg-slate-900 border-2 border-fuchsia-400 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    <h3 className="text-sm font-extrabold text-fuchsia-300 uppercase">
                      ☢️ Онтология Вещества · Критическое вещество (Ω-γ), Старые Галактики и Контрабанда
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOntologyModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs overflow-y-auto">
                  {/* Философско-онтологический фундамент модели */}
                  <div className="p-3.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/50 space-y-2">
                    <div className="font-extrabold text-fuchsia-300 text-sm">
                      🔬 ОНТОЛОГИЧЕСКАЯ МОДЕЛЬ ДИССИПАЦИИ И РАЗМЫКАНИЯ ЛОКАЛЬНЫХ УЗЛОВ:
                    </div>
                    <div className="text-slate-200 leading-relaxed text-[11px] space-y-1">
                      <p>
                        1. <b>Конечный срок жизни вещества</b>: вследствие диссипации внутренние связи вещества ослабевают. В конечном итоге локальный узел не может оставаться замкнутым и <b>размыкается в виде гамма-квантов</b> — аналог гамма-всплеска сверхновой, но <b>без послесвечения</b>.
                      </p>
                      <p>
                        2. <b>Лавинообразный процесс в звёздах и Старые Галактики</b>: в звёздах размыкание узлов идёт лавинообразно. В <b>старых галактиках без заселённых планет</b> (<i>OMEGA-RELICT</i>, <i>CHRONOS-VOID</i>) сверхновые взрываются очень часто — можно потерять корабль и весь груз, но риск оправдан добычей <b>Критического вещества [Ω-γ]</b>!
                      </p>
                      <p>
                        3. <b>Контролируемое размыкание локальных узлов (Супер-энергия ≫ ядерной)</b>: наличие <b>Критического вещества [Ω-γ]</b> позволяет размыкать локальные узлы контролируемо — это даёт <b>энергию для тяжёлых кораблей</b> (100% манёвренность в тяжёлой броне + гамма-щит от сверхновых) и <b>энергию для тяжёлого гамма-вооружения</b>!
                      </p>
                    </div>
                  </div>

                  {/* Текущий статус бортового запаса Ω-γ, супер-энергии и тяжёлого вооружения */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-fuchsia-500/50">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Критическое вещество [Ω-γ]
                      </div>
                      <div className="text-lg font-extrabold text-fuchsia-300 mt-0.5">
                        {minedElementsHold.Omega || 0} т
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        Контрабанда: 16 500 CR/т
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/50">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Реактор тяжёлого корабля
                      </div>
                      <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                        {reactorSuperEnergySec > 0 ? `${reactorSuperEnergySec} сек` : 'ВЫКЛ'}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {reactorSuperEnergySec > 0
                          ? '100% манёвр + 92% броня + защита от сверхновых'
                          : 'Требуется 1т [Ω-γ] для запуска'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-yellow-500/50">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Тяжёлое гамма-оружие (V)
                      </div>
                      <div className="text-lg font-extrabold text-yellow-300 mt-0.5">
                        {heavyGammaCharges} залпов
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Размыкание узлов цели без послесвечения
                      </div>
                    </div>
                  </div>

                  {/* Блок 1: Контролируемое размыкание локальных узлов (Энергия для тяжёлых кораблей и тяжёлого вооружения) */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="font-extrabold text-cyan-300 text-xs uppercase">
                      ⚡ 1. Контролируемое размыкание узлов: Тяжёлый корабль + Тяжёлое гамма-вооружение
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Расходует <b>1т Критического вещества [Ω-γ]</b>: переводит корабль в класс <b>Тяжёлого Дредноута (+35t брони)</b> со <b>100% манёвренностью</b>, поглощает гамма-всплески сверхновых и заряжает <b>+5 залпов Тяжёлого Гамма-Излучателя (клавиша V)</b>.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleControlledNodeUnbinding}
                        className="py-2.5 px-3 rounded-xl bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-extrabold text-xs"
                      >
                        ☢️ Запустить контролируемое размыкание (-1т Ω-γ)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOntologyModalOpen(false);
                          handleFireHeavyGammaWeapon();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                      >
                        💥 Залп Тяжёлым Гамма-Оружием (V · {heavyGammaCharges} зар.)
                      </button>
                    </div>
                  </div>

                  {/* Блок 2: Экспедиция в Старые Галактики без заселённых планет (источник Ω-γ и частые сверхновые) */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/50 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-rose-300 text-xs uppercase">
                        🌌 2. Старые галактики без заселённых планет (Взрывы сверхновых · Добыча Ω-γ)
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold">
                        Пережито вспышек сверхновых: {supernovaSurvivedCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      В старых галактиках нет заселённых планет: звёзды лавинообразно размыкают узлы в виде гамма-всплесков без послесвечения. Без супер-энергии можно потерять корабль, но астероиды и караваны там насыщены <b>Критическим веществом [Ω-γ]</b>!
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOntologyModalOpen(false);
                          setTargetSystemId(6);
                          handleHyperspaceJump(6);
                        }}
                        className="py-2 px-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-[11px]"
                      >
                        🚀 Прыжок в OMEGA-RELICT (Старая галактика #1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOntologyModalOpen(false);
                          setTargetSystemId(7);
                          handleHyperspaceJump(7);
                        }}
                        className="py-2 px-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold text-[11px]"
                      >
                        🚀 Прыжок в CHRONOS-VOID (Старая галактика #2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOntologyModalOpen(false);
                          handleTriggerSupernovaGammaBurst();
                        }}
                        className="py-2 px-2.5 rounded-xl border border-rose-400 bg-rose-950/50 hover:bg-rose-400 hover:text-black text-rose-200 font-extrabold text-[11px]"
                      >
                        💥 Испытать взрыв сверхновой (+выброс Ω-γ)
                      </button>
                    </div>
                  </div>

                  {/* Блок 3: Экономика Контрабанды, Пиратства (Карма в минусе · наценка ×10) и Торговли Критическим веществом */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/50 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-emerald-300 text-xs uppercase">
                        🕶️ 3. Экономика Контрабанды, Пиратства (Наценка ×10) и Торговли [Ω-γ]
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold">
                        Контрабанда: {smuggledTonsCount}т (+{smugglingProfitCr} CR)
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-rose-500/60 bg-rose-950/30 space-y-2">
                      <div className="text-[11px] text-slate-200 leading-relaxed space-y-1">
                        <div>
                          <b>🏴‍☠️ Статус «ПИРАТ»</b> — присваивается, если ты <b>разбил чужой корабль и забрал с него хоть один предмет</b>! Тогда карма уходит в минус (<b>{isPirateStatus ? earnedGoBellKarma : '< 0'}</b>) и действует <b>наценка на всё ×10</b>: при покупке <b>×10 (+)</b>, при продаже <b>÷10 (-)</b>.
                        </div>
                        <div>
                          <b>🦅 Статус «МАРОДЁР»</b> — присваивается, если ты <b>просто подобрал предмет после драки</b> (не разбивая корабль сам). Тогда <b>просто портится карма (-5)</b>, без наценки ×10!
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={handleTriggerPirateDestroyAndLoot}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px]"
                        >
                          🏴‍☠️ Разбить чужой корабль + взять предмет → ПИРАТ (×10)
                        </button>
                        <button
                          type="button"
                          onClick={handleTriggerMarauderPickupAfterFight}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px]"
                        >
                          🦅 Подобрать предмет после драки → МАРОДЁР (-Карма)
                        </button>
                        <button
                          type="button"
                          onClick={handleRestoreLawfulStatus}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[10px]"
                        >
                          🛡️ Амнистия (Законный · Карма +5 · Цены 1×)
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={handleSmuggleCriticalMatter}
                        className="py-2 px-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[11px]"
                      >
                        🕶️ Сбыть 1т [Ω-γ] контрабандой (+16 500 CR)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSellPeriodicElement('Omega')}
                        className="py-2 px-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[11px]"
                      >
                        🏛 Легальная сдача 1т [Ω-γ] (+{getElementTradePrices('Omega').activePilotSellPriceCr} CR{isPirateStatus ? ' · ÷10' : ''})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOntologyModalOpen(false);
                          handleSpawnCriticalConvoyAmbush();
                        }}
                        className="py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px]"
                      >
                        🏴‍☠️ Пиратский перехват конвоя (Статус Пират)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* МОДАЛЬНОЕ ОКНО 4: ПРОСТОЙ ДЕБЕТ / КРЕДИТ ИГРОВЫХ ОЧКОВ (ОПЫТ В ТОННАХ УНИЧТОЖЕННОЙ МАССЫ ВРАГА), КОМАНДНЫЙ БОЙ, БОЕЗАПАС 50Т+10% (550 ВЫСТРЕЛОВ), ДОКУПКА БРОНИ И ОРУЖИЯ */}
          <TonnageExperienceModal
            isOpen={isTonnageXpModalOpen}
            onClose={() => setIsTonnageXpModalOpen(false)}
            credits={credits}
            isPirateStatus={isPirateStatus}
            pirateBuyMultiplier={pirateBuyMultiplier}
            destroyedEnemyTonsXp={destroyedEnemyTonsXp}
            spentSalvoDebitKg={spentSalvoDebitKg}
            destroyedEnemyShipsCount={shipsDestroyedByPlayer}
            isTeamCombatMode={isTeamCombatMode}
            onToggleTeamCombatMode={(enabled) => {
              setIsTeamCombatMode(enabled);
              setFlightMessage(
                enabled
                  ? '🤝 ВКЛЮЧЁН РЕЖИМ «РАБОТАЕТ КОМАНДА»: СЧИТАЮТСЯ КОНКРЕТНО ТВОИ ПОПАДАНИЯ И ПОСЛЕ УНИЧТОЖЕНИЯ ВРАГА ТЕБЕ ЗАСЧИТЫВАЮТСЯ УНИЧТОЖЕННЫЕ ТОБОЙ ТОННЫ!'
                  : '👤 ВКЛЮЧЁН РЕЖИМ «СОЛО ДЕБЕТ / КРЕДИТ»: ПОТРАТИЛ 51 Т ЗАЛПА → УНИЧТОЖИЛ ПРОТИВНИКА 50 Т → ЗАСЧИТАЛОСЬ +50 Т XP (ЕСЛИ НЕ УНИЧТОЖИЛ — 0 Т)!'
              );
            }}
            baseStandardShipMassTons={baseStandardShipMassTons}
            purchasedArmorWeightTons={armorExtraTons}
            extraAmmoCapacityBonusPct={extraAmmoCapacityBonusPct}
            remainingAmmoCapacityKg={remainingAmmoCapacityKg}
            maxAmmoCapacityKg={maxAmmoCapacityKg}
            weaponComboMode={weaponComboMode}
            unlockedWeaponCombos={unlockedWeaponCombos}
            onSelectOrBuyWeaponCombo={handleSelectOrBuyWeaponCombo}
            onBuyArmorWeightTons={handleBuyArmorWeightTons}
            onBuyExtraAmmoCapacityPct={handleBuyExtraAmmoCapacityPct}
            onReloadFullAmmoCapacity={handleReloadFullAmmoCapacity}
            onSettleCombatDebitCredit={handleSettleCombatDebitCredit}
          />

          {/* Оверлей выбора миссий GoBell, Торговли (T) или Галактической карты (H) поверх экрана */}
          {screenMode === 'DOCKED' && (
            <div className="absolute inset-3 bg-black/95 border-2 border-cyan-400 p-4 flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.25)]">
              <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-cyan-500/60 flex-wrap">
                <div>
                  <div className="text-sm sm:text-base font-extrabold text-yellow-300 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span>ОРБИТАЛЬНЫЙ ТЕРМИНАЛ GOBELL · {currentSystem.name}</span>
                  </div>
                  <div className="text-[11px] text-cyan-300">
                    {currentSystem.gov} · Экономика: {currentSystem.econ} · Уровень опасности:{' '}
                    {currentSystem.danger}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStationTab('GOBELL_MISSIONS')}
                    className={`px-3 py-1.5 text-xs font-extrabold border-2 transition-colors ${
                      stationTab === 'GOBELL_MISSIONS'
                        ? 'bg-emerald-400 text-black border-emerald-300'
                        : 'bg-black text-emerald-400 border-emerald-500/60 hover:border-emerald-400'
                    }`}
                  >
                    🔔 МИССИИ GOBELL ({missions.filter((m) => m.status !== 'COMPLETED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStationTab('MARKET')}
                    className={`px-3 py-1.5 text-xs font-extrabold border-2 transition-colors ${
                      stationTab === 'MARKET'
                        ? 'bg-cyan-400 text-black border-cyan-300'
                        : 'bg-black text-cyan-300 border-cyan-500/60 hover:border-cyan-400'
                    }`}
                  >
                    📦 ТОРГОВЛЯ (MARKET)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStationTab('OUTFITTING')}
                    className={`px-3 py-1.5 text-xs font-extrabold border-2 transition-colors ${
                      stationTab === 'OUTFITTING'
                        ? 'bg-yellow-400 text-black border-yellow-300'
                        : 'bg-black text-yellow-300 border-yellow-500/60 hover:border-yellow-400'
                    }`}
                  >
                    ⚡ ОСНАЩЕНИЕ И ТОПЛИВО
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleDocking}
                    className="px-3 py-1.5 text-xs font-extrabold border-2 border-fuchsia-400 bg-fuchsia-500 text-black hover:bg-fuchsia-400"
                  >
                    🚀 ВЗЛЁТ В КОСМОС (T)
                  </button>
                </div>
              </div>

              {/* ВКЛАДКА 1: КОСМИЧЕСКИЙ ВЫБОР МИССИЙ GOBELL */}
              {stationTab === 'GOBELL_MISSIONS' && (
                <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
                  <div className="px-3 py-2 border border-emerald-500/50 bg-emerald-950/20 text-xs text-emerald-300 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Выбирайте космические миссии, созданные из реальных объявлений ADVERT, сигналов SOS и заказов экосистемы GoBell!
                    </span>
                    <span className="text-yellow-300 font-bold">
                      Активных миссий: {missions.filter((m) => m.status === 'ACTIVE').length}
                    </span>
                  </div>

                  {missions.map((m) => {
                    const destSys = GALAXY_SYSTEMS[m.targetSystemId] || GALAXY_SYSTEMS[0];
                    return (
                      <div
                        key={m.id}
                        className={`p-3 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          m.status === 'COMPLETED'
                            ? 'border-slate-700 bg-slate-950/60 opacity-60'
                            : m.status === 'ACTIVE'
                            ? 'border-yellow-400 bg-yellow-950/20'
                            : 'border-cyan-500/60 bg-black hover:border-cyan-400'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-extrabold text-white">
                              {m.title}
                            </span>
                            <span className="text-[11px] text-cyan-300">
                              · Заказчик: {m.clientName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed">
                            {m.briefing}
                          </div>
                          <div className="text-[11px] font-bold flex items-center gap-3 pt-1 flex-wrap">
                            <span className="text-yellow-300">
                              НАГРАДА: +{m.rewardCredits} CR
                            </span>
                            <span className="text-emerald-400">
                              КАРМА GOBELL: +{m.rewardKarma}
                            </span>
                            <span className="text-cyan-300">
                              ЦЕЛЬ: {destSys.name}
                            </span>
                            {m.killsRequired > 0 && (
                              <span className="text-rose-400">
                                ПРОГРЕСС БОЯ: {m.killsDone}/{m.killsRequired}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col gap-1.5">
                          {m.status === 'AVAILABLE' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptMission(m.id, m.targetSystemId)}
                              className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs"
                            >
                              ПРИНЯТЬ МИССИЮ GOBELL
                            </button>
                          )}
                          {m.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleHyperspaceJump(m.targetSystemId)}
                              className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs"
                            >
                              ПРЫЖОК В {destSys.name.split(' ')[0]} (H)
                            </button>
                          )}
                          {m.status === 'COMPLETED' && (
                            <span className="px-3 py-1.5 border border-emerald-500 text-emerald-400 text-xs font-extrabold text-center">
                              ✓ ВЫПОЛНЕНО
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ВКЛАДКА 2: КОСМИЧЕСКАЯ БИРЖА ТОВАРОВ (COMMODITY MARKET) */}
              {stationTab === 'MARKET' && (
                <div className="flex-1 overflow-y-auto pt-3 space-y-2">
                  <div className="text-xs text-cyan-300 pb-1 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      Покупайте дешёвые товары на аграрных/шахтёрских планетах и продавайте в промышленных секторах после гиперпрыжка (H):
                    </span>
                    {isPirateStatus && (
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[11px]">
                        🏴‍☠️ СТАТУС ПИРАТ (КАРМА {earnedGoBellKarma}): ПОКУПКА ×10 (+) · ПРОДАЖА ÷10 (-)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {COMMODITIES.map((comm) => {
                      const basePrice = Math.round(
                        comm.basePrice * (currentSystem.priceFactors[comm.id] || 1)
                      );
                      const buyPrice = basePrice * pirateBuyMultiplier;
                      const sellPrice = Number((basePrice / pirateSellDivisor).toFixed(1));
                      const owned = cargoHold[comm.id] || 0;
                      const diff = basePrice - comm.basePrice;
                      return (
                        <div
                          key={comm.id}
                          className="px-3 py-2 border border-cyan-500/40 bg-black flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-white">{comm.name}</span>
                            <span className="ml-2 text-[11px] text-slate-400">
                              (В трюме: <b className="text-emerald-400">{owned}{comm.unit}</b>)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-extrabold ${
                                isPirateStatus
                                  ? 'text-rose-400'
                                  : diff < 0
                                  ? 'text-emerald-400'
                                  : diff > 0
                                  ? 'text-amber-300'
                                  : 'text-cyan-300'
                              }`}
                            >
                              {isPirateStatus
                                ? `КУП: ${buyPrice} CR (×10) / ПРОД: ${sellPrice} CR (÷10)`
                                : `${basePrice} CR/${comm.unit} ${
                                    diff < 0
                                      ? '▼ ВЫГОДНО КУПИТЬ'
                                      : diff > 0
                                      ? '▲ ВЫГОДНО ПРОДАТЬ'
                                      : ''
                                  }`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleBuyCommodity(comm)}
                              className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold"
                            >
                              КУПИТЬ +1 (-{buyPrice} CR)
                            </button>
                            <button
                              type="button"
                              disabled={owned <= 0}
                              onClick={() => handleSellCommodity(comm)}
                              className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-30 text-black font-extrabold"
                            >
                              ПРОДАТЬ -1 (+{sellPrice} CR)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ВКЛАДКА 3: ЗАПРАВКА ГИПЕРДВИГАТЕЛЯ И АПГРЕЙД КОРАБЛЯ */}
              {stationTab === 'OUTFITTING' && (
                <div className="flex-1 overflow-y-auto pt-3 space-y-3 text-xs">
                  {isPirateStatus && (
                    <div className="p-2.5 border-2 border-rose-500 bg-rose-950/40 text-rose-200 font-extrabold text-xs">
                      🏴‍☠️ СТАТУС ПИРАТ (КАРМА {earnedGoBellKarma}): НАЦЕНКА НА ТОПЛИВО И ОСНАЩЕНИЕ ×10 (+)
                    </div>
                  )}
                  <div className="p-3 border border-cyan-400 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-yellow-300 text-sm">
                        ТОПЛИВО ГИПЕРДВИГАТЕЛЯ (HYPERSPACE FUEL · 7.0 LY MAX)
                      </div>
                      <div className="text-slate-300">
                        Текущий запас: {fuel.toFixed(1)} / 7.0 световых лет. Полная заправка для прыжков по системам GoBell.
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={fuel >= 7.0 || credits < 30 * pirateBuyMultiplier}
                      onClick={() => {
                        const cost = 30 * pirateBuyMultiplier;
                        playZxBeep('DOCK');
                        setCredits((c) => Number((c - cost).toFixed(1)));
                        setFuel(7.0);
                        setFlightMessage(
                          `HYPERSPACE FUEL TANKS REFILLED TO 7.0 LY (-${cost} CR${
                            isPirateStatus ? ' · PIRATE ×10 MARKUP' : ''
                          })`
                        );
                      }}
                      className="px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-extrabold"
                    >
                      ЗАПРАВИТЬ ДО 7.0 LY ({30 * pirateBuyMultiplier} CR{isPirateStatus ? ' · ×10' : ''})
                    </button>
                  </div>

                  <div className="p-3 border border-fuchsia-400 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-fuchsia-300 text-sm">
                        ВОЕННЫЙ ПЛАЗМЕННЫЙ ЛАЗЕР (MILITARY LASER)
                      </div>
                      <div className="text-slate-300">
                        Удваивает урон по пиратам Cobra Mk III и кораблям Thargoid, снижает нагрев орудий.
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={hasMilitaryLaser || credits < 400 * pirateBuyMultiplier}
                      onClick={() => {
                        const cost = 400 * pirateBuyMultiplier;
                        playZxBeep('MISSION');
                        setCredits((c) => Number((c - cost).toFixed(1)));
                        setHasMilitaryLaser(true);
                        setFlightMessage(
                          `MILITARY LASER INSTALLED ON COBRA MK III (-${cost} CR${
                            isPirateStatus ? ' · PIRATE ×10 MARKUP' : ''
                          })!`
                        );
                      }}
                      className="px-3.5 py-2 bg-fuchsia-400 hover:bg-fuchsia-300 disabled:opacity-40 text-black font-extrabold"
                    >
                      {hasMilitaryLaser
                        ? '✓ УСТАНОВЛЕН'
                        : `КУПИТЬ (${400 * pirateBuyMultiplier} CR${isPirateStatus ? ' · ×10' : ''})`}
                    </button>
                  </div>

                  <div className="p-3 border border-emerald-400 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-emerald-300 text-sm">
                        РАСШИРИТЕЛЬ ГРУЗОВОГО ТРЮМА (+15 ТОНН)
                      </div>
                      <div className="text-slate-300">
                        Увеличивает вместимость корабля с 20t до 35t для крупнооптовой торговли.
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={maxCargoCapacity >= 35 || credits < 300 * pirateBuyMultiplier}
                      onClick={() => {
                        const cost = 300 * pirateBuyMultiplier;
                        playZxBeep('MISSION');
                        setCredits((c) => Number((c - cost).toFixed(1)));
                        setMaxCargoCapacity(35);
                        setFlightMessage(
                          `CARGO BAY EXPANDED TO 35 TONS (-${cost} CR${
                            isPirateStatus ? ' · PIRATE ×10 MARKUP' : ''
                          })!`
                        );
                      }}
                      className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-black font-extrabold"
                    >
                      {maxCargoCapacity >= 35
                        ? '✓ УСТАНОВЛЕН (35t)'
                        : `КУПИТЬ (${300 * pirateBuyMultiplier} CR${isPirateStatus ? ' · ×10' : ''})`}
                    </button>
                  </div>

                  {/* КОНСТРУКТОР МАССЫ КОРАБЛЯ (50 Т + БРОНЯ КАК ВЕС), БОЕЗАПАСА (50 Т + 10% = 550 ВЫСТРЕЛОВ) И КОМБИНИРОВАНИЯ ОРУЖИЯ (100 КГ / 50+50 КГ / 2×50 КГ) */}
                  <div className="p-3 border-2 border-amber-400 bg-amber-950/20 flex items-center justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="font-extrabold text-amber-300 text-sm">
                        🏆 ИГРОВЫЕ ОЧКИ (ОПЫТ В ТОННАХ: {destroyedEnemyTonsXp.toFixed(2)} Т) · БРОНЯ КАК ВЕС (+{armorExtraTons} Т) И КОМБИНИРОВАНИЕ ОРУЖИЯ
                      </div>
                      <div className="text-slate-300 text-xs">
                        Стандартный корабль = <b>50 т</b>, выстрел лазера = <b>100 кг</b>, плазмы = <b>100 кг</b>, боезапас = <b>50 т + 10% (550 выстрелов)</b>. Докупайте броню как вес и комбинируйте оружие (<b>50 + 50 кг</b>, <b>2 × 50 кг</b>, <b>150 кг</b>, <b>100 + 100 кг</b>)!
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTonnageXpModalOpen(true)}
                      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold shrink-0"
                    >
                      ОТКРЫТЬ КОНСТРУКТОР ОРУЖИЯ / БРОНИ И СТЕНД 50 Т
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ГАЛАКТИЧЕСКАЯ КАРТА И ВЫБОР ГИПЕРПРЫЖКА (GALAXY CHART) */}
          {screenMode === 'GALAXY_MAP' && (
            <div className="absolute inset-3 bg-black/95 border-2 border-yellow-400 p-4 flex flex-col justify-between overflow-y-auto">
              <div className="flex items-center justify-between border-b border-yellow-400/60 pb-2">
                <div>
                  <div className="text-base font-extrabold text-yellow-300">
                    ГАЛАКТИЧЕСКАЯ КАРТА СЕКТОРОВ GOBELL · ВЫБОР ГИПЕРПРЫЖКА
                  </div>
                  <div className="text-xs text-cyan-300">
                    Выберите целевую звёздную систему и нажмите «СОВЕРШИТЬ ГИПЕРПРЫЖОК (H)»
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreenMode('FLIGHT')}
                  className="px-3 py-1 border border-cyan-400 text-cyan-300 text-xs font-extrabold"
                >
                  ВЕРНУТЬСЯ В КОКПИТ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                {GALAXY_SYSTEMS.map((sys) => {
                  const isCurrent = sys.id === currentSystemId;
                  const isSelected = sys.id === targetSystemId;
                  const activeMissionsHere = missions.filter(
                    (m) => m.status === 'ACTIVE' && m.targetSystemId === sys.id
                  ).length;

                  return (
                    <div
                      key={sys.id}
                      onClick={() => setTargetSystemId(sys.id)}
                      className={`p-3 border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-950/25'
                          : 'border-slate-700 bg-black hover:border-cyan-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm" style={{color: sys.color}}>
                          {sys.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold text-emerald-400">
                            [ВЫ ЗДЕСЬ]
                          </span>
                        )}
                        {activeMissionsHere > 0 && (
                          <span className="text-[10px] font-extrabold text-yellow-300">
                            ★ МИССИЙ GOBELL: {activeMissionsHere}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-cyan-300 mt-0.5">
                        Экономика: {sys.econ} · Опасность: {sys.danger}
                      </div>
                      {sys.isOldGalaxy && (
                        <div className="mt-1 px-2 py-0.5 bg-fuchsia-950/70 border border-fuchsia-400 text-[10px] font-extrabold text-fuchsia-200">
                          ☢️ СТАРАЯ ГАЛАКТИКА БЕЗ ЗАСЕЛЁННЫХ ПЛАНЕТ · ЧАСТЫЕ СВЕРХНОВЫЕ (БЕЗ ПОСЛЕСВЕЧЕНИЯ) · ДОБЫЧА [Ω-γ]
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1">{sys.description}</div>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetSystemId(sys.id);
                            handleHyperspaceJump(sys.id);
                          }}
                          className="mt-2 w-full py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs"
                        >
                          ⚡ ГИПЕРПРЫЖОК В {sys.name.split(' ')[0]} (1.8 LY)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Правая панель быстрого управления и активных миссий GoBell */}
        <div className="w-full lg:w-80 border-t-2 lg:border-t-0 lg:border-l-2 border-cyan-400 bg-black p-3 flex flex-col justify-between gap-3 overflow-y-auto">
          <div className="space-y-3">
            <div className="border border-yellow-400/70 p-2.5 space-y-2">
              <div className="text-xs font-extrabold text-yellow-300 border-b border-yellow-500/40 pb-1 flex items-center justify-between gap-1">
                <span>ПУЛЬТ УПРАВЛЕНИЯ COBRA MK III</span>
                <span className="text-[9px] text-cyan-300">ИГРОВАЯ ПАНЕЛЬ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullConfigDocOpen(true)}
                className="w-full py-2 px-2.5 border-2 border-yellow-300 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-colors"
                title="Перейти в документ: Полное описание финальной конфигурации игры (Визуальный ряд, Звёздная система, Группы/Бизнесы/Объявления, Масса/Щит/Урон и Подсчёт очков)"
              >
                <span>📄 ПОЛНОЕ ОПИСАНИЕ КОНФИГУРАЦИИ ИГРЫ</span>
              </button>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleFireLaser}
                  className="py-2 px-2 border-2 border-rose-500 bg-rose-500/20 hover:bg-rose-500 hover:text-black text-rose-300 font-extrabold flex items-center justify-center gap-1"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>ОГОНЬ (F)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleHyperspaceJump()}
                  className="py-2 px-2 border-2 border-cyan-400 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-300 font-extrabold flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>ГИПЕРПРЫЖОК (H)</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleStationaryOrbit}
                  className={`py-2 px-2 border-2 font-extrabold flex items-center justify-center gap-1.5 col-span-2 transition-colors ${
                    stationaryOrbitInfo
                      ? 'border-yellow-300 bg-emerald-400 text-black hover:bg-emerald-300'
                      : 'border-emerald-400 bg-emerald-500/20 hover:bg-emerald-400 hover:text-black text-emerald-300'
                  }`}
                  title="Клавиша X — закрепиться на стационарной орбите планеты (осевое вращение планеты прекращается, корабль двигается вокруг оси вместе с планетой) / повторное нажатие X — открепиться"
                >
                  <span>
                    {stationaryOrbitInfo
                      ? `🔓 ОТКРЕПИТЬСЯ ОТ СТАЦИОНАРНОЙ ОРБИТЫ «${stationaryOrbitInfo.cleanName.toUpperCase()}» (X)`
                      : '🛰 ЗАКРЕПИТЬСЯ НА СТАЦИОНАРНОЙ ОРБИТЕ (X)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleDocking}
                  className="py-2 px-2 border-2 border-cyan-400 bg-cyan-500/15 hover:bg-cyan-400 hover:text-black text-cyan-300 font-extrabold flex items-center justify-center gap-1 col-span-2"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    {screenMode === 'DOCKED'
                      ? 'ВЗЛЁТ СО СТАНЦИИ (T)'
                      : 'СТЫКОВКА · МИССИИ GOBELL И ТОРГОВЛЯ (T)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScreenMode((prev) => (prev === 'GALAXY_MAP' ? 'FLIGHT' : 'GALAXY_MAP'))
                  }
                  className="py-1.5 px-2 border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black font-extrabold col-span-2 text-center"
                >
                  🌌 ГАЛАКТИЧЕСКАЯ КАРТА СИСТЕМ (G)
                </button>
              </div>

              {/* ОНТОЛОГИЧЕСКИЙ БЛОК: КРИТИЧЕСКОЕ ВЕЩЕСТВО (Ω-γ), КОНТРОЛИРУЕМОЕ РАЗМЫКАНИЕ УЗЛОВ (ТЯЖЁЛЫЕ КОРАБЛИ + ГАММА-ОРУЖИЕ), СТАРЫЕ ГАЛАКТИКИ И КОНТРАБАНДА */}
              <div className="pt-1.5 border-t border-fuchsia-500/40 space-y-1.5 bg-fuchsia-950/15 p-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-fuchsia-300">
                    ☢️ КРИТИЧЕСКОЕ ВЕЩЕСТВО [Ω-γ]: {minedElementsHold.Omega || 0}т
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOntologyModalOpen(true)}
                    className="text-[9px] text-yellow-300 underline font-extrabold"
                  >
                    Онтология / Контрабанда
                  </button>
                </div>
                <div className="text-[8px] text-slate-300 leading-tight">
                  Контролируемое размыкание локальных узлов даёт <b>супер-энергию ≫ ядерной</b> для <b>тяжёлых кораблей</b> и <b>тяжёлого гамма-вооружения</b>. Источник — <b>старые галактики без планет</b> (риск сверхновых без послесвечения):
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <button
                    type="button"
                    onClick={handleControlledNodeUnbinding}
                    className={`py-1 px-1.5 border font-extrabold truncate ${
                      reactorSuperEnergySec > 0
                        ? 'bg-fuchsia-400 text-black border-white'
                        : 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200 hover:bg-fuchsia-400 hover:text-black'
                    }`}
                    title="Контролируемое размыкание узлов (1т Ω-γ): супер-энергия для тяжёлого корабля (100% манёвр в тяжёлой броне + защита от сверхновых) и +5 залпов гамма-оружия"
                  >
                    {reactorSuperEnergySec > 0
                      ? `⚡ СУПЕР-ЭНЕРГИЯ (${reactorSuperEnergySec}с)`
                      : '⚡ Размыкание узла (-1т Ω-γ)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFireHeavyGammaWeapon}
                    className="py-1 px-1.5 border border-yellow-400 bg-yellow-400/20 hover:bg-yellow-400 hover:text-black text-yellow-300 font-extrabold truncate"
                    title="Клавиша V — Выстрел тяжёлым гамма-вооружением (размыкание локальных узлов цели в гамма-кванты без послесвечения)"
                  >
                    💥 Гамма-орудие (V · {heavyGammaCharges})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSystemId(6);
                      handleHyperspaceJump(6);
                    }}
                    className="py-1 px-1.5 border border-purple-400 bg-purple-950/40 hover:bg-purple-400 hover:text-black text-purple-200 font-extrabold truncate"
                    title="Прыжок в старую галактику без заселённых планет OMEGA-RELICT (частые взрывы сверхновых, добыча Критического вещества Ω-γ)"
                  >
                    🌌 Старая галактика (Ω-γ)
                  </button>
                  <button
                    type="button"
                    onClick={handleSmuggleCriticalMatter}
                    className="py-1 px-1.5 border border-emerald-400 bg-emerald-950/40 hover:bg-emerald-400 hover:text-black text-emerald-300 font-extrabold truncate"
                    title="Нелегальный сбыт 1т Критического вещества (Ω-γ) контрабандой для тяжёлого флота за 16 500 CR"
                  >
                    🕶️ Контрабанда (+16500 CR)
                  </button>
                </div>
                {currentSystem.isOldGalaxy && (
                  <div className="p-1.5 border border-rose-500 bg-rose-950/40 flex items-center justify-between gap-1 text-[8px] text-rose-200">
                    <span className="font-bold">
                      ⚠️ СТАРАЯ ГАЛАКТИКА БЕЗ ПЛАНЕТ: СВЕРХНОВЫЕ ВЗРЫВАЮТСЯ ЧАСТО!
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerSupernovaGammaBurst}
                      className="px-1.5 py-0.5 bg-rose-500 hover:bg-rose-400 text-black font-extrabold shrink-0"
                    >
                      💥 Всплеск сверхновой
                    </button>
                  </div>
                )}
              </div>

              {/* СЦЕНА ВНУТРИ СФЕРЫ СИСТЕМЫ: ЗВЕЗДА В ЦЕНТРЕ, 4 ПЛАНЕТЫ И ПОЯС АСТЕРОИДОВ */}
              <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-yellow-300 font-extrabold">
                    ☀ ЗАРЯДКА ОТ ЗВЕЗДЫ: {solarChargeUi.fluxPct}%
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold">
                    До звезды: {solarChargeUi.starDist} ед ({solarChargeUi.etaToStar})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 border border-yellow-500/40">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{width: `${solarChargeUi.fluxPct}%`}}
                  />
                </div>
                <div className="text-[9px] text-slate-400 leading-tight">
                  Сфера системы (R=30 000): с окраины звезда и 4 планеты — цветные точки с маркерами. На макс. скорости (100 ед/с) пролёт до звезды = <b>5 мин</b>, между планетами = <b>1 мин</b>:
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('SYSTEM_EDGE')}
                    className="py-1 px-1.5 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black font-extrabold text-left truncate col-span-2"
                    title="Встать на окраину Сферы Системы (30 000 ед. = 5 минут до Звезды, все планеты и звезда — цветные точки с текстовыми маркерами)"
                  >
                    🔭 1. ОКРАИНА СФЕРЫ (30 000 ед · 5 МИН ДО ЗВЕЗДЫ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('STAR_CLOSE')}
                    className="py-1 px-1.5 border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black font-extrabold text-left truncate"
                    title="Звезда в центре системы — ИСТОЧНИК ЭНЕРГИИ (зарядка 100% вблизи)"
                  >
                    ☀ 2. ЗВЕЗДА (ЭНЕРГИЯ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('ASTEROID_BELT')}
                    className="py-1 px-1.5 border border-amber-300/70 text-amber-200 hover:bg-amber-300 hover:text-black font-extrabold text-left truncate"
                    title="Пояс Астероидов за 4-й планетой (R=27 000)"
                  >
                    🪨 7. ПОЯС АСТЕРОИДОВ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('PLANET_1')}
                    className="py-1 px-1.5 border border-orange-400/80 text-orange-300 hover:bg-orange-400 hover:text-black font-extrabold text-left truncate"
                    title="1-я планета I. Меркурий: ЖЕЛЕЗО (Fe) — необходимый запас для восстановления повреждений во время гиперпрыжка"
                  >
                    🟠 3. МЕРКУРИЙ (ЖЕЛЕЗО)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('PLANET_2')}
                    className="py-1 px-1.5 border border-lime-400/80 text-lime-300 hover:bg-lime-400 hover:text-black font-extrabold text-left truncate"
                    title="2-я планета II. Венера: АЛЮМИНИЙ (Al) — необходимо для восстановления повреждений во время гиперпрыжка"
                  >
                    🟢 4. ВЕНЕРА (АЛЮМИНИЙ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('PLANET_3')}
                    className="py-1 px-1.5 border border-sky-400/80 text-sky-300 hover:bg-sky-400 hover:text-black font-extrabold text-left truncate"
                    title="3-я планета III. Земля: ПРОДОВОЛЬСТВИЕ (автономное нахождение в космосе) и ВОДА (питьё и источник кислорода O₂)"
                  >
                    🔵 5. ЗЕМЛЯ (ЕДА И ВОДА)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSystemView('PLANET_4')}
                    className="py-1 px-1.5 border border-rose-400/80 text-rose-300 hover:bg-rose-400 hover:text-black font-extrabold text-left truncate"
                    title="4-я планета IV. Марс: ТИТАН (Ti) — необходимый для восстановления повреждений во время гиперпрыжка"
                  >
                    🔴 6. МАРС (ТИТАН)
                  </button>
                </div>

                {/* БОРТОВАЯ СВОДКА: ПРАВИТЕЛЬСТВА ПЛАНЕТ (ГРУППЫ), МЕЖПЛАНЕТНАЯ ЛОГИСТИКА (5 CR / 1 CR СКИДКА → 10 CR), ТАРИФ GOBELL И ПОЯС АСТЕРОИДОВ */}
                <div className="mt-1.5 p-2 border border-cyan-500/40 bg-slate-950/90 space-y-2 text-[10px]">
                  {/* 1. ТАРИФ GOBELL И ДОСТУПНЫЕ ГРУППЫ-ПРАВИТЕЛЬСТВА ПЛАНЕТ */}
                  <div className="space-y-1 pb-1.5 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-300">
                        👥 ГРУППЫ-ПРАВИТЕЛЬСТВА ({joinedPlanetGroups.length}/{maxAllowedPlanetGroups}):
                      </span>
                      <span className="px-1.5 py-0.5 bg-amber-400 text-black font-extrabold text-[9px]">
                        ТАРИФ: {GOBELL_SPACE_TARIFF_META[gobellTariff].badge}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-300 leading-tight">
                      В группе планеты ресурс стоит <b className="text-emerald-300">1 CR</b> (без группы <b className="text-amber-300">5 CR</b>), а за доставку на другую планету её Правительство платит <b className="text-yellow-300">10 CR</b>!
                    </div>
                    {/* Кнопки вступления в 4 группы планет */}
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      {[
                        {tag: 'GO-MERCURY', name: 'Меркурий (Fe)'},
                        {tag: 'GO-VENUS', name: 'Венера (Al)'},
                        {tag: 'GO-EARTH', name: 'Земля (Еда/O₂)'},
                        {tag: 'GO-MARS', name: 'Марс (Ti)'},
                      ].map((g) => {
                        const inG = joinedPlanetGroups.includes(g.tag);
                        return (
                          <button
                            key={g.tag}
                            type="button"
                            onClick={() => handleToggleJoinPlanetGroup(g.tag, g.name)}
                            className={`py-1 px-1.5 border text-left font-bold truncate ${
                              inG
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                                : 'border-slate-700 bg-black text-slate-400 hover:border-amber-400'
                            }`}
                            title={
                              inG
                                ? `Вы в группе #${g.tag} (скидка на ресурс до 1 CR). Нажмите, чтобы выйти.`
                                : `Вступить в группу #${g.tag} для скидки на ресурс с 5 CR до 1 CR`
                            }
                          >
                            {inG ? `✓ #${g.tag} (1 CR)` : `+ #${g.tag} (5 CR)`}
                          </button>
                        );
                      })}
                    </div>
                    {/* Быстрая смена тарифа GoBell (включая BUSINESS аккаунт) для расширения групп и создания бизнеса с меньшей маржой */}
                    <div className="pt-1 space-y-1">
                      <div className="text-[9px] text-amber-300 font-bold">
                        Тариф GoBell (группы + Бизнес-аккаунт с меньшей маржой):
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {(
                          ['FREE', 'PRO', 'PRO_PLUS_1', 'PRO_PLUS_2', 'BUSINESS'] as GoBellSpaceTariff[]
                        ).map((tKey) => (
                          <button
                            key={tKey}
                            type="button"
                            onClick={() => handleSelectGoBellTariff(tKey)}
                            className={`py-0.5 px-1 border font-extrabold text-[8px] truncate ${
                              gobellTariff === tKey
                                ? tKey === 'BUSINESS'
                                  ? 'bg-fuchsia-400 text-black border-fuchsia-300'
                                  : 'bg-amber-400 text-black border-amber-300'
                                : tKey === 'BUSINESS'
                                ? 'border-fuchsia-400/70 text-fuchsia-300 hover:bg-fuchsia-400 hover:text-black'
                                : 'border-slate-700 text-slate-300 hover:border-amber-400'
                            }`}
                            title={GOBELL_SPACE_TARIFF_META[tKey].note}
                          >
                            {GOBELL_SPACE_TARIFF_META[tKey].badge}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Блок Бизнес-Аккаунта пилота (меньшая маржа: закупка выше 50%, продажа ниже 100%) */}
                    <div className="pt-1.5 border-t border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-fuchsia-300 text-[9px]">
                          🏢 БИЗНЕС С МЕНЬШЕЙ МАРЖОЙ (ПРОТИВ 50%/100% ПРАВ-В):
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsBusinessModalOpen(true)}
                          className="text-[8px] text-yellow-300 underline font-bold"
                        >
                          Настроить
                        </button>
                      </div>
                      {gobellTariff === 'BUSINESS' && pilotBusiness.isCreated ? (
                        <div className="p-1.5 border border-fuchsia-400/60 bg-fuchsia-950/20 space-y-1">
                          <div className="text-[9px] text-white font-bold flex items-center justify-between">
                            <span className="truncate">{pilotBusiness.name}</span>
                            <span className="text-emerald-300 shrink-0">
                              Закуп {pilotBusiness.buyRatePct}% / Прод {pilotBusiness.sellRatePct}%
                            </span>
                          </div>
                          <div className="text-[8px] text-slate-300 leading-tight">
                            Правительства закупают за <b>50%</b> и продают за <b>100%</b>. Ваш бизнес закупает по завышенной (<b>{pilotBusiness.buyRatePct}%</b>) и продаёт по заниженной (<b>{pilotBusiness.sellRatePct}%</b>)!
                          </div>
                          <button
                            type="button"
                            onClick={handleRunPilotBusinessTurnover}
                            className="w-full py-1 px-1.5 bg-fuchsia-400 hover:bg-fuchsia-300 text-black font-extrabold text-[9px]"
                          >
                            🤝 Провести оборот бизнеса (маржа {pilotBusiness.sellRatePct - pilotBusiness.buyRatePct}%)
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCreateOrUpdatePilotBusiness}
                          className="w-full py-1 px-1.5 border border-fuchsia-400/70 bg-fuchsia-500/15 hover:bg-fuchsia-400 hover:text-black text-fuchsia-300 font-extrabold text-[9px]"
                        >
                          🏢 Подключить BUSINESS и создать бизнес ({pilotBusiness.buyRatePct}%/{pilotBusiness.sellRatePct}% вместо 50%/100%)
                        </button>
                      )}
                    </div>

                    {/* Блок Подпространственного канала фиксации (аукцион слота объявления + доля в пуле) */}
                    <div className="pt-1.5 border-t border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-yellow-300 text-[9px]">
                          📡 ПОДПРОСТРАНСТВЕННЫЙ КАНАЛ ФИКСАЦИИ:
                        </span>
                        <span className="text-[9px] font-extrabold text-emerald-300">
                          ПУЛ: {myAuctionPoolSharePct}% ({activeAuctionPoolSlotsCount}/{allowedSubspaceSlotsCount})
                        </span>
                      </div>
                      <div className="text-[8px] text-slate-300 leading-tight">
                        Аналог аукциона слота объявления: фиксируйте объявление <b>прямо возле себя</b> или <b>в любой точке</b> · Дивиденды пула: <b className="text-emerald-300">+{subspacePoolDividendsCr} CR</b>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleFixSubspaceAdvert(1, 'NEAR_SHIP', 'NEAR_SHIP')}
                          className="py-1 px-1 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400 text-cyan-300 font-extrabold text-[8px] truncate"
                          title="Зафиксировать объявление слота #1 прямо возле корабля в текущей точке космоса"
                        >
                          📍 Возле себя
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSubspaceChannelModalOpen(true)}
                          className="py-1 px-1 bg-yellow-400/20 hover:bg-yellow-400 hover:text-black border border-yellow-400 text-yellow-300 font-extrabold text-[8px] truncate"
                          title="Зафиксировать объявление в любой точке системы и управлять каналами"
                        >
                          🎯 Любая точка
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSubspaceAuctionPool(1)}
                          className="py-1 px-1 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[8px] truncate"
                          title="Включить/выключить слот #1 в Пул Аукциона Подпространственного канала фиксации"
                        >
                          💰 В пул ({myAuctionPoolSharePct}%)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. ЗАКОН СТАТУСОВ «ПИРАТ» (РАЗБИЛ ЧУЖОЙ КОРАБЛЬ + ЗАБРАЛ ПРЕДМЕТ → ×10) И «МАРОДЁР» (ПОДОБРАЛ ПРЕДМЕТ ПОСЛЕ ДРАКИ → ПРОСТО ПОРТИТСЯ КАРМА) */}
                  <div className="p-1.5 border border-rose-500/60 bg-rose-950/20 space-y-1 text-[9px]">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-extrabold truncate ${
                          isPirateStatus
                            ? 'text-rose-300'
                            : isMarauderStatus
                            ? 'text-amber-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {isPirateStatus
                          ? `🏴‍☠️ ПИРАТ (КАРМА ${earnedGoBellKarma} · КУП ×10+ / ПРОД ÷10-)`
                          : isMarauderStatus
                          ? `🦅 МАРОДЁР (КАРМА ${
                              earnedGoBellKarma > 0 ? `+${earnedGoBellKarma}` : earnedGoBellKarma
                            } ИСПОРЧЕНА · ЦЕНЫ 1×)`
                          : `🛡️ ЗАКОННЫЙ (КАРМА ${
                              earnedGoBellKarma >= 0 ? `+${earnedGoBellKarma}` : earnedGoBellKarma
                            } · ЦЕНЫ 1×)`}
                      </span>
                      {pilotLegalStatus !== 'LAWFUL' && (
                        <button
                          type="button"
                          onClick={handleRestoreLawfulStatus}
                          className="px-1.5 py-0.5 bg-emerald-400 text-black hover:bg-emerald-300 font-extrabold text-[8px] shrink-0"
                          title="Восстановить статус Законного пилота и снять санкции"
                        >
                          🛡️ Амнистия
                        </button>
                      )}
                    </div>
                    <div className="text-[8px] text-slate-300 leading-tight">
                      • <b className="text-rose-300">ПИРАТ</b> (разбил чужой корабль: <b>{shipsDestroyedByPlayer}</b> + забрал с него предмет: <b>{pirateLootedItemsCount}</b>) → карма в минусе и наценка <b>×10 (+ / -)</b>.<br />
                      • <b className="text-amber-300">МАРОДЁР</b> (просто подобрал предмет после драки: <b>{marauderLootedItemsCount}</b>) → <b>просто портится карма (-5)</b>, без наценки ×10!
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={handleTriggerPirateDestroyAndLoot}
                        className="py-1 px-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[8px] truncate"
                        title="Разбить чужой корабль и забрать с него 1 предмет в трюм → присваивается статус ПИРАТ (карма в минусе + наценка ×10 на всё)"
                      >
                        🏴‍☠️ Разбить+Взять
                      </button>
                      <button
                        type="button"
                        onClick={handleTriggerMarauderPickupAfterFight}
                        className="py-1 px-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[8px] truncate"
                        title="Просто подобрать предмет после чужой драки в трюм → присваивается статус МАРОДЁР (просто портится карма -5, цены 1×)"
                      >
                        🦅 После драки
                      </button>
                      <button
                        type="button"
                        onClick={handleSpawnCriticalConvoyAmbush}
                        className="py-1 px-1 border border-cyan-400 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-300 font-extrabold text-[8px] truncate"
                        title="Вызвать прямо перед носом в 3D-космос чужой корабль и предмет после драки для ручной стрельбы (ЛКМ) и захвата лучом (СКМ/C)"
                      >
                        🎯 В 3D-космос
                      </button>
                    </div>
                  </div>

                  <div className="font-extrabold text-cyan-300 flex items-center justify-between">
                    <span>
                      🛠 ЗАПАС И ЗАКУПКА ({5 * pirateBuyMultiplier} CR / {1 * pirateBuyMultiplier} CR В ГРУППЕ):
                    </span>
                    <span
                      className={
                        hullIntegrityPct < 100
                          ? 'text-rose-400 font-extrabold'
                          : 'text-emerald-400 font-extrabold'
                      }
                    >
                      КОРПУС: {hullIntegrityPct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleSupplyFromPlanet(1)}
                      className="p-1 border border-orange-400/60 bg-orange-950/20 hover:bg-orange-400 hover:text-black text-orange-300 font-bold"
                      title="Купить 1т Железа (Fe) на Меркурии: 1 CR в группе #GO-MERCURY или 5 CR без группы (при статусе Пират ×10: 10 CR / 50 CR)"
                    >
                      <div>ЖЕЛЕЗО</div>
                      <div className="text-white font-extrabold">{ironStock}т</div>
                      <div className={`text-[8px] ${isPirateStatus ? 'text-rose-300 font-extrabold' : 'text-emerald-300'}`}>
                        {(joinedPlanetGroups.includes('GO-MERCURY') ? 1 : 5) * pirateBuyMultiplier} CR
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSupplyFromPlanet(2)}
                      className="p-1 border border-lime-400/60 bg-lime-950/20 hover:bg-lime-400 hover:text-black text-lime-300 font-bold"
                      title="Купить 1т Алюминия (Al) на Венере: 1 CR в группе #GO-VENUS или 5 CR без группы (при статусе Пират ×10: 10 CR / 50 CR)"
                    >
                      <div>АЛЮМ.</div>
                      <div className="text-white font-extrabold">{aluminumStock}т</div>
                      <div className={`text-[8px] ${isPirateStatus ? 'text-rose-300 font-extrabold' : 'text-emerald-300'}`}>
                        {(joinedPlanetGroups.includes('GO-VENUS') ? 1 : 5) * pirateBuyMultiplier} CR
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSupplyFromPlanet(3)}
                      className="p-1 border border-sky-400/60 bg-sky-950/20 hover:bg-sky-400 hover:text-black text-sky-300 font-bold"
                      title="Купить 1т Продовольствия и Воды/O₂ на Земле: 1 CR в группе #GO-EARTH или 5 CR без группы (при статусе Пират ×10: 10 CR / 50 CR)"
                    >
                      <div>ЕДА/O₂</div>
                      <div className="text-white font-extrabold">{foodWaterCargoStock}т</div>
                      <div className={`text-[8px] ${isPirateStatus ? 'text-rose-300 font-extrabold' : 'text-emerald-300'}`}>
                        {(joinedPlanetGroups.includes('GO-EARTH') ? 1 : 5) * pirateBuyMultiplier} CR
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSupplyFromPlanet(4)}
                      className="p-1 border border-rose-400/60 bg-rose-950/20 hover:bg-rose-400 hover:text-black text-rose-300 font-bold"
                      title="Купить 1т Титана (Ti) на Марсе: 1 CR в группе #GO-MARS или 5 CR без группы (при статусе Пират ×10: 10 CR / 50 CR)"
                    >
                      <div>ТИТАН</div>
                      <div className="text-white font-extrabold">{titaniumStock}т</div>
                      <div className={`text-[8px] ${isPirateStatus ? 'text-rose-300 font-extrabold' : 'text-emerald-300'}`}>
                        {(joinedPlanetGroups.includes('GO-MARS') ? 1 : 5) * pirateBuyMultiplier} CR
                      </div>
                    </button>
                  </div>

                  {/* АВТОМАТИЧЕСКИЕ ЛОГИСТИЧЕСКИЕ МОДУЛИ 4 ПЛАНЕТ И СТРОГИЕ ТРАЕКТОРИИ БЕЗ ХАОСА */}
                  <div className="p-1.5 border border-cyan-400/70 bg-cyan-950/20 space-y-1 text-[9px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-cyan-300">
                        🛰️ 4 ЛОГИСТИЧЕСКИХ МОДУЛЯ ПЛАНЕТ (СТРОГИЕ ТРАЕКТОРИИ БЕЗ ХАОСА):
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLogisticsModalOpen(true)}
                        className="px-1.5 py-0.5 bg-cyan-400 text-black hover:bg-cyan-300 font-extrabold text-[8px] shrink-0"
                      >
                        ТАБЛО ЦИКЛОВ
                      </button>
                    </div>
                    <div className="text-[8px] text-slate-300 leading-tight">
                      Цикл каждой планеты без остановки: <b>Своя планета → Другая планета 1 (60с) → Орбита 1 мин → Возврат (60с) → Орбита своей планеты 1 мин → Другая планета 2...</b> Груз: со своей — её ресурс, с чужой — её ресурс. При гибели груз идёт по траектории и исчезает в планете назначения (<b>{absorbedInPlanetCount}</b>). Уничтожение груза/мусора = астероид (<b>{destroyedCargoDebrisAsAsteroidCount}</b>)!
                    </div>
                    <div className="space-y-0.5 max-h-28 overflow-y-auto pr-0.5">
                      {logisticsUiSnapshot.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleFocusLogisticsEntityInSight(item.id)}
                          className="p-1 border border-slate-800 bg-black/70 hover:border-cyan-400 cursor-pointer flex items-center justify-between gap-1 text-[8px]"
                          title="Нажмите, чтобы вывести этот модуль или груз на траектории прямо в прицел Огневой Башни"
                        >
                          <div className="truncate">
                            <span style={{color: item.color}} className="font-extrabold">
                              {item.planetName}:
                            </span>{' '}
                            <span className="text-slate-200">{item.phaseLabel}</span> ·{' '}
                            <span className="text-amber-300">{item.cargoLabel}</span>
                          </div>
                          <span className="text-cyan-300 font-extrabold shrink-0">
                            {item.timerSec}с ({item.progressPct}%)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleFastForwardLogisticsCycle(60)}
                        className="py-1 px-1 bg-cyan-500/25 hover:bg-cyan-400 hover:text-black border border-cyan-400 text-cyan-200 font-extrabold text-[8px] truncate"
                        title="Промотать время цикла всех модулей и грузов на траекториях на +60 секунд (переключить фазу перелёт ↔ стационарная орбита 1 мин и доставить неподобранный груз в планету назначения)"
                      >
                        ⏩ +1 мин цикла
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDestroyCargoOrDebrisAsAsteroid()}
                        className="py-1 px-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[8px] truncate"
                        title="Уничтожить мусор или груз на траектории — засчитывается как уничтожение астероида и вознаграждается соответственно (+CR и +Безопасность)"
                      >
                        💥 Груз/Мусор=Астероид
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsLogisticsModalOpen(true)}
                        className="py-1 px-1 border border-emerald-400 bg-emerald-500/20 hover:bg-emerald-400 hover:text-black text-emerald-300 font-extrabold text-[8px] truncate"
                      >
                        🛰️ Все траектории
                      </button>
                    </div>
                  </div>

                  {/* Быстрая сдача по межпланетному контракту (например: Земле нужно Железо с Меркурия за 10 CR; для Пирата ÷10 = +1 CR!) */}
                  <div className="pt-1 border-t border-slate-800 space-y-1">
                    <div className="text-[9px] font-extrabold text-yellow-300">
                      📦 МЕЖПЛАНЕТНАЯ ЛОГИСТИКА ПРАВИТЕЛЬСТВ (ОПЛАТА +{10 / pirateSellDivisor} CR{isPirateStatus ? ' · ПИРАТ ÷10' : ''}):
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeliverGovernmentContract('Земля', 'IRON')}
                        className="py-1 px-1.5 bg-emerald-500/20 hover:bg-emerald-400 hover:text-black border border-emerald-400 text-emerald-300 font-extrabold text-[9px] text-left truncate"
                        title="Земля платит 10 CR за доставку 1т Железа с Меркурия (при статусе Пират ÷10 = 1 CR)"
                      >
                        Земле: 1т Fe → +{10 / pirateSellDivisor} CR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeliverGovernmentContract('Земля', 'ALUMINUM')}
                        className="py-1 px-1.5 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400 text-cyan-300 font-extrabold text-[9px] text-left truncate"
                        title="Земля платит 10 CR за доставку 1т Алюминия с Венеры (при статусе Пират ÷10 = 1 CR)"
                      >
                        Земле: 1т Al → +{10 / pirateSellDivisor} CR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeliverGovernmentContract('Меркурий', 'FOOD_WATER')}
                        className="py-1 px-1.5 bg-sky-500/20 hover:bg-sky-400 hover:text-black border border-sky-400 text-sky-300 font-extrabold text-[9px] text-left truncate"
                        title="Меркурий платит 10 CR за доставку Продовольствия и Воды/O₂ с Земли (при статусе Пират ÷10 = 1 CR)"
                      >
                        Меркурию: Еда/O₂ → +{10 / pirateSellDivisor} CR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeliverGovernmentContract('Марс', 'FOOD_WATER')}
                        className="py-1 px-1.5 bg-rose-500/20 hover:bg-rose-400 hover:text-black border border-rose-400 text-rose-300 font-extrabold text-[9px] text-left truncate"
                        title="Марс платит 10 CR за доставку Продовольствия и Воды/O₂ с Земли (при статусе Пират ÷10 = 1 CR)"
                      >
                        Марсу: Еда/O₂ → +{10 / pirateSellDivisor} CR
                      </button>
                    </div>
                  </div>

                  {/* 3. ПОЯС АСТЕРОИДОВ, ГРУЗОВОЙ ОТСЕК (${usedCargoTons}/${maxCargoCapacity}т) И ПРОДАЖА ЭЛЕМЕНТОВ ПО ПРОПОРЦИЯМ РЫНКА ЗЕМЛИ */}
                  <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-amber-300 font-extrabold">
                      <span>🪨 ПОЯС АСТЕРОИДОВ (БЕЗОПАСНОСТЬ: {beltSafetyPct}%)</span>
                      <span className="text-emerald-300">
                        ОТСЕК: {usedCargoTons}/{maxCargoCapacity}т
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-300 leading-tight">
                      До огневого контакта (ЛКМ/F) булыжники неразличимы. Простые исчезают со взрывом (очищено: <b>{clearedBouldersCount}</b>), а ценные помечаются как <b>Fe, Al, Ti, H₂O, Cu, Ni, Co, Li, Ag, Pt, Au</b> (всё кроме продовольствия!) для захвата (СКМ/C) в отсек:
                    </div>

                    {/* Таблица элементов периодической системы и H₂O:
                        Правительства закупают за полцены (50%) и продают за полную (100%).
                        Если активен Бизнес пилота — закупает по завышенной (>50%) и продаёт по заниженной (<100%)! */}
                    <div className="text-[8px] text-amber-200 bg-slate-900/90 border border-slate-800 px-1.5 py-1 leading-tight">
                      {gobellTariff === 'BUSINESS' && pilotBusiness.isCreated ? (
                        <span>
                          🏢 <b>Ваш Бизнес ({pilotBusiness.buyRatePct}% / {pilotBusiness.sellRatePct}%)</b>: сбыт по завышенной цене (<b>{pilotBusiness.buyRatePct}%</b> vs 50% у правительств), покупка по заниженной (<b>{pilotBusiness.sellRatePct}%</b> vs 100%)!
                        </span>
                      ) : (
                        <span>
                          🏛 <b>Правительства планет (50% / 100%)</b>: закупают у вас элементы за <b>полцены (50%)</b>, а продают за <b>полную цену (100%)</b>. Подключите <b>BUSINESS</b> для меньшей маржи!
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      {ASTEROID_ELEMENT_ORDER.map((sym) => {
                        const meta = ASTEROID_PERIODIC_ELEMENTS[sym];
                        const prices = getElementTradePrices(sym);
                        const isBiz = gobellTariff === 'BUSINESS' && pilotBusiness.isCreated;
                        const activeSellToMarket = prices.activePilotSellPriceCr;
                        const activeBuyFromMarket = prices.activePilotBuyPriceCr;
                        const qty =
                          sym === 'Fe'
                            ? ironStock
                            : sym === 'Al'
                            ? aluminumStock
                            : sym === 'Ti'
                            ? titaniumStock
                            : minedElementsHold[sym] || 0;
                        return (
                          <div
                            key={sym}
                            style={{
                              borderColor: qty > 0 ? meta.color : '#334155',
                            }}
                            className={`p-1 border text-left transition-colors ${
                              qty > 0 ? 'bg-slate-900 text-white' : 'bg-black/40 text-slate-400'
                            }`}
                            title={`${meta.nameRu} · ${meta.earthPriceNote}\nПравительство: закупает за полцены ${prices.govBuyCr} CR (50%) / продаёт за полную ${prices.fullCr} CR (100%).\nБизнес пилота: закупает за ${prices.bizBuyCr} CR (${pilotBusiness.buyRatePct}%) / продаёт за ${prices.bizSellCr} CR (${pilotBusiness.sellRatePct}%).`}
                          >
                            <div className="flex items-center justify-between font-extrabold text-[9px]">
                              <span style={{color: qty > 0 ? meta.color : '#94a3b8'}}>
                                {meta.displaySymbol}
                              </span>
                              <span>{qty}т</span>
                            </div>
                            <div className="text-[7px] text-slate-300 truncate">
                              Сбыт: <b className="text-emerald-300">{activeSellToMarket}</b> · Куп:{' '}
                              <b className="text-cyan-300">{activeBuyFromMarket}</b>
                            </div>
                            <div className="grid grid-cols-2 gap-0.5 mt-0.5">
                              <button
                                type="button"
                                disabled={qty <= 0}
                                onClick={() => handleSellPeriodicElement(sym)}
                                className="py-0.5 bg-emerald-500/25 hover:bg-emerald-400 hover:text-black disabled:opacity-30 text-emerald-300 font-extrabold text-[7px] text-center"
                                title={`Продать 1т ${meta.displaySymbol} за ${activeSellToMarket} CR (${isBiz ? `завышенная цена вашего бизнеса ${pilotBusiness.buyRatePct}%` : 'полцены 50% правительству'})`}
                              >
                                Сдать +{activeSellToMarket}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBuyPeriodicElement(sym)}
                                className="py-0.5 bg-cyan-500/25 hover:bg-cyan-400 hover:text-black text-cyan-300 font-extrabold text-[7px] text-center"
                                title={`Купить 1т ${meta.displaySymbol} за ${activeBuyFromMarket} CR (${isBiz ? `заниженная цена вашего бизнеса ${pilotBusiness.sellRatePct}%` : 'полная цена 100% у правительства'})`}
                              >
                                Куп -{activeBuyFromMarket}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={handleTractorCapture}
                        className="py-1 px-1.5 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400 text-cyan-300 font-extrabold text-[9px] text-center truncate"
                        title="Захватить помеченный после огневого контакта булыжник (Fe, Al, Ti, H₂O...) в грузовой отсек"
                      >
                        🧲 Захватить в отсек (СКМ/C)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSellPeriodicElement('ALL')}
                        className="py-1 px-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[9px] text-center truncate"
                        title="Продать все добытые элементы периодической системы по пропорциям цен рынка реальной Земли"
                      >
                        💰 Продать элементы (Цены Земли)
                      </button>
                    </div>
                  </div>

                  {hullIntegrityPct < 100 && (
                    <button
                      type="button"
                      onClick={handleRepairHyperspaceDamage}
                      className="w-full py-1 px-2 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[10px]"
                    >
                      🔧 ВОССТАНОВИТЬ ПОВРЕЖДЕНИЯ ГИПЕРПРЫЖКА (1Fe + 1Al + 1Ti)
                    </button>
                  )}

                  <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-300">
                    <span>🍎 Еда экипажа: <b className="text-emerald-300">{foodStockPct}%</b></span>
                    <span>💧 Вода / O₂: <b className="text-sky-300">{waterOxygenStockPct}%</b></span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyan-300 font-bold">РУД (ТЯГА / СКОРОСТЬ):</span>
                  <span className="text-yellow-300 font-extrabold">{throttleUi}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={throttleUi}
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    setThrottleUi(pct);
                    flightStateRef.current.targetSpeed =
                      (pct / 100) * flightStateRef.current.maxSpeed;
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setThrottleUi(0);
                      flightStateRef.current.targetSpeed = 0;
                    }}
                    className="py-1 border border-slate-600 text-slate-300 hover:border-cyan-400 font-bold"
                  >
                    СТОП (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThrottleUi(50);
                      flightStateRef.current.targetSpeed =
                        flightStateRef.current.maxSpeed * 0.5;
                    }}
                    className="py-1 border border-cyan-500/60 text-cyan-300 hover:border-cyan-400 font-bold"
                  >
                    КРЕЙСЕР (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setThrottleUi(100);
                      flightStateRef.current.targetSpeed = flightStateRef.current.maxSpeed;
                    }}
                    className="py-1 border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black font-extrabold"
                  >
                    ФОРСАЖ (100%)
                  </button>
                </div>
              </div>

              {/* ФИЗИКА МАССЫ КОРАБЛЯ: ЧЕМ ТЯЖЕЛЕЕ — ТЕМ МЕНЬШЕ МАНЁВРЕННОСТЬ, НО БОЛЬШЕ ЗАЩИЩЁННОСТЬ */}
              <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-300 font-extrabold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>МАССА / БРОНЯ ({totalShipMassTons}t):</span>
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Груз: {usedCargoTons}t + Броня: {armorExtraTons}t
                  </span>
                </div>

                {/* Наглядные шкалы компромисса: Скорость ↔ Манёвренность (Инерция) и Масса ↔ Защищённость */}
                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <div className="flex justify-between text-fuchsia-300 font-bold">
                      <span>МАНЁВРЕННОСТЬ (ОТ МАССЫ И СКОРОСТИ)</span>
                      <span>{maneuverabilityPct}%</span>
                    </div>
                    <div className="text-[9px] text-slate-400 flex justify-between pb-0.5">
                      <span>База от массы: {baseMassManeuverPct}%</span>
                      <span className="text-cyan-300">
                        Инерция скорости ({throttleUi}%): -{Math.max(0, baseMassManeuverPct - maneuverabilityPct)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 border border-fuchsia-500/40">
                      <div
                        className="h-full bg-fuchsia-400 transition-all"
                        style={{width: `${maneuverabilityPct}%`}}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-cyan-300 font-bold">
                      <span>СИЛА ИНЕРЦИИ (СНОС НА ВИРАЖЕ)</span>
                      <span>{inertiaForcePct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 border border-cyan-500/40">
                      <div
                        className="h-full bg-cyan-400 transition-all"
                        style={{width: `${inertiaForcePct}%`}}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-emerald-300 font-bold">
                      <span>ЗАЩИЩЁННОСТЬ (ПОГЛОЩЕНИЕ УРОНА)</span>
                      <span>{armorProtectionPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 border border-emerald-500/40">
                      <div
                        className="h-full bg-emerald-400 transition-all"
                        style={{width: `${armorProtectionPct}%`}}
                      />
                    </div>
                  </div>
                </div>

                {/* Блок Простой Дебет / Кредит игровых очков (Опыт = уничтоженные тонны врага ТОЛЬКО после его уничтожения) и Командного учёта попаданий */}
                <div className="p-2 border border-amber-400/70 bg-amber-950/20 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-300">
                      🏆 КРЕДИТ (XP) / ДЕБЕТ ЗАЛПА:
                    </span>
                    <span className="font-extrabold text-white bg-amber-500/30 px-1.5 py-0.5 border border-amber-400">
                      +{destroyedEnemyTonsXp.toFixed(2)} Т / -{(spentSalvoDebitKg / 1000).toFixed(1)} Т
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-300 leading-tight">
                    Потратил <b className="text-rose-300">51 т залпа (Дебет)</b> → уничтожил врага <b className="text-cyan-300">50 т</b> → засчиталось <b className="text-emerald-300">+50 т XP</b>. Если <b>не уничтожил — не засчитываются (0 т)</b>! При работе <b className="text-cyan-300">команды</b> засчитываются твои тонны по твоим выстрелам.
                  </div>
                  {pendingTargetHitSummary && (
                    <div className="p-1.5 border border-amber-400 bg-black/80 text-[9px] space-y-0.5">
                      <div className="text-amber-300 font-extrabold">
                        ⏳ ВРАГ НЕ ДОБИТ (ОСТАЛОСЬ {pendingTargetHitSummary.remainingTons} / {pendingTargetHitSummary.maxTons} Т) → В ЗАЧЁТЕ 0 XP:
                      </div>
                      <div className="text-slate-200 flex justify-between">
                        <span>Твои попадания: <b className="text-emerald-300">{pendingTargetHitSummary.playerTons} т ({pendingTargetHitSummary.playerShots} выстр.)</b></span>
                        {pendingTargetHitSummary.teamTons > 0 && (
                          <span>Команда: <b className="text-cyan-300">{pendingTargetHitSummary.teamTons} т</b></span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setIsTeamCombatMode(false)}
                      className={`py-1 px-1 border font-extrabold text-[8px] truncate ${
                        !isTeamCombatMode
                          ? 'bg-emerald-400 text-black border-emerald-300'
                          : 'border-slate-700 text-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      👤 СОЛО (51т Дебет → +50т)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTeamCombatMode(true)}
                      className={`py-1 px-1 border font-extrabold text-[8px] truncate ${
                        isTeamCombatMode
                          ? 'bg-cyan-400 text-black border-cyan-300'
                          : 'border-slate-700 text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      🤝 КОМАНДА (Твои попадания)
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectOrBuyWeaponCombo('SINGLE_100KG')}
                      className={`py-1 px-1 border font-extrabold text-[8px] truncate ${
                        weaponComboMode === 'SINGLE_100KG'
                          ? 'bg-amber-400 text-black border-amber-300'
                          : 'border-slate-700 text-slate-300 hover:border-amber-400'
                      }`}
                      title="Стандарт: 100 кг за выстрел (Лазер 100 кг / Плазма 100 кг)"
                    >
                      100 кг (Стд)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOrBuyWeaponCombo('COMBO_50_PLUS_50')}
                      className={`py-1 px-1 border font-extrabold text-[8px] truncate ${
                        weaponComboMode === 'COMBO_50_PLUS_50'
                          ? 'bg-cyan-400 text-black border-cyan-300'
                          : 'border-slate-700 text-slate-300 hover:border-cyan-400'
                      }`}
                      title="Комбинированный выстрел 50 + 50 кг (Лазер 50 кг + Плазма 50 кг = 100 кг)"
                    >
                      50 + 50 кг
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectOrBuyWeaponCombo('DUAL_2X50KG')}
                      className={`py-1 px-1 border font-extrabold text-[8px] truncate ${
                        weaponComboMode === 'DUAL_2X50KG'
                          ? 'bg-fuchsia-400 text-black border-fuchsia-300'
                          : 'border-slate-700 text-slate-300 hover:border-fuchsia-400'
                      }`}
                      title="Два выстрела по 50 кг (2 × 50 кг = 100 кг)"
                    >
                      2 × 50 кг
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTonnageXpModalOpen(true)}
                    className="w-full py-1 px-1.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[9px] text-center"
                  >
                    ⚖️ Стенд Дебет/Кредит (51т→50т) и Командный Бой
                  </button>
                </div>

                {/* Быстрое переключение бронеплит корпуса */}
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setArmorBallastLevel(0);
                      setFlightMessage(
                        'КОНФИГУРАЦИЯ: ЛЁГКИЙ ИСТРЕБИТЕЛЬ (МАКСИМАЛЬНАЯ МАНЁВРЕННОСТЬ, БАЗОВАЯ БРОНЯ)'
                      );
                    }}
                    className={`py-1 border font-extrabold ${
                      armorBallastLevel === 0
                        ? 'bg-fuchsia-400 text-black border-fuchsia-300'
                        : 'border-slate-700 text-slate-300 hover:border-fuchsia-400'
                    }`}
                  >
                    ЛЁГКИЙ (+0t)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArmorBallastLevel(1);
                      setFlightMessage(
                        'КОНФИГУРАЦИЯ: СРЕДНИЙ КРЕЙСЕР (+15t БРОНИ · БАЛАНС МАНЁВРА И ЗАЩИТЫ)'
                      );
                    }}
                    className={`py-1 border font-extrabold ${
                      armorBallastLevel === 1
                        ? 'bg-cyan-400 text-black border-cyan-300'
                        : 'border-slate-700 text-slate-300 hover:border-cyan-400'
                    }`}
                  >
                    КРЕЙСЕР (+15t)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setArmorBallastLevel(2);
                      setFlightMessage(
                        'КОНФИГУРАЦИЯ: ТЯЖЁЛЫЙ БРОНЕНОСЕЦ (+35t БРОНИ · ТЯЖЁЛЫЙ МАНЁВР, МАКС. ЗАЩИТА!)'
                      );
                    }}
                    className={`py-1 border font-extrabold ${
                      armorBallastLevel === 2
                        ? 'bg-amber-400 text-black border-amber-300'
                        : 'border-slate-700 text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    ТАНК (+35t)
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
                <div>• <b className="text-cyan-300">Курсор мыши + Клавиша I</b> — Карточка профиля любого объекта (Солнце, Планета, Группа, Бизнес, Объявление, Модуль, Груз, Астероид)</div>
                <div>• <b className="text-emerald-400">Клавиша X</b> — Закрепиться / Открепиться на стационарной орбите планеты</div>
                <div>• <b className="text-yellow-300">Указатель мыши</b> — Прицел Огневой Башни (чистая геометрия без текстов)</div>
                <div>• <b className="text-white">W / S (↑ / ↓)</b> — тангаж · <b className="text-white">A / D (← / →)</b> — крен корабля</div>
                <div>• <b className="text-yellow-300">Колёсико мыши (крутить)</b> — управление скоростью (0..100%)</div>
                <div>• <b className="text-cyan-300">ЛКМ (Левая кнопка)</b> — Запрос на контакт по объекту / Лазер башни</div>
                <div>• <b className="text-rose-400">ПКМ (Правая кнопка)</b> — Оружие №2 (Плазма башни в прицел мыши)</div>
                <div>• <b className="text-emerald-400">Нажатие колёсика (СКМ)</b> — Луч захвата капсул в прицеле</div>
                <div>• <b className="text-amber-300">Масса корабля</b> — тяжелее = меньше манёвр, но выше защита!</div>
              </div>
            </div>

            {/* Бортовой журнал активных космических миссий GoBell */}
            <div className="border border-emerald-400/70 p-2.5 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/40 pb-1">
                <span className="text-xs font-extrabold text-emerald-300">
                  КОСМИЧЕСКИЙ ВЫБОР МИССИИ GOBELL
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setScreenMode('DOCKED');
                    setStationTab('GOBELL_MISSIONS');
                  }}
                  className="text-[10px] text-yellow-300 underline font-bold"
                >
                  Открыть все
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {missions.slice(0, 4).map((m) => {
                  const dest = GALAXY_SYSTEMS[m.targetSystemId];
                  return (
                    <div
                      key={m.id}
                      className={`p-2 border text-[11px] space-y-1 ${
                        m.status === 'ACTIVE'
                          ? 'border-yellow-400 bg-yellow-950/20'
                          : m.status === 'COMPLETED'
                          ? 'border-slate-800 opacity-50'
                          : 'border-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-white leading-tight">{m.title}</div>
                      <div className="text-cyan-300">
                        Система: {dest?.name.split(' ')[0]} · Награда: +{m.rewardCredits} CR / +
                        {m.rewardKarma} Карма
                      </div>
                      {m.status === 'AVAILABLE' && (
                        <button
                          type="button"
                          onClick={() => handleAcceptMission(m.id, m.targetSystemId)}
                          className="w-full py-1 bg-emerald-400 text-black font-extrabold text-[10px]"
                        >
                          ВЫБРАТЬ МИССИЮ
                        </button>
                      )}
                      {m.status === 'ACTIVE' && (
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <span className="text-yellow-300 font-bold">АКТИВНА</span>
                          {currentSystemId !== m.targetSystemId ? (
                            <button
                              type="button"
                              onClick={() => handleHyperspaceJump(m.targetSystemId)}
                              className="px-2 py-0.5 bg-cyan-400 text-black font-extrabold text-[10px]"
                            >
                              ПРЫЖОК (H)
                            </button>
                          ) : m.type === 'ADVERT' ? (
                            <button
                              type="button"
                              onClick={handleToggleDocking}
                              className="px-2 py-0.5 bg-emerald-400 text-black font-extrabold text-[10px]"
                            >
                              СДАТЬ ГРУЗ (T)
                            </button>
                          ) : (
                            <span className="text-rose-400 font-bold">
                              БОЙ: {m.killsDone}/{m.killsRequired}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>ACORN / ZX SPECTRUM VECTOR MODE</span>
            <span className="text-emerald-400">60 FPS WIREFRAME</span>
          </div>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО: АВТОМАТИЧЕСКИЕ ЛОГИСТИЧЕСКИЕ СТАНДАРТНЫЕ МОДУЛИ ПЛАНЕТ И СТРОГИЕ ТРАЕКТОРИИ (БЕЗ ХАОСА) */}
      {isLogisticsModalOpen && (
        <div className="fixed inset-0 z-[165] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl border-2 border-cyan-400 bg-slate-950 text-slate-100 p-4 space-y-3 shadow-[0_0_40px_rgba(34,211,238,0.35)] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-sm font-extrabold text-cyan-300">
                    🛰️ ДВИЖЕНИЕ В СИСТЕМЕ СТРОГО ПО ТРАЕКТОРИЯМ · 4 АВТОМАТИЧЕСКИХ ЛОГИСТИЧЕСКИХ МОДУЛЯ ПЛАНЕТ
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Все хаотические движения убраны · Бесконечный цикл каждой планеты с задержкой 1 мин на стационарной орбите · Чистый космос без мусора
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogisticsModalOpen(false)}
                className="px-2.5 py-1 border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-black font-extrabold text-xs"
              >
                ЗАКРЫТЬ [X]
              </button>
            </div>

            {/* Сводка правил движения в системе */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 border border-cyan-500/50 bg-slate-900/80 space-y-1">
                <div className="font-extrabold text-cyan-300">
                  1. АВТОМАТИЧЕСКИЙ ЦИКЛ КАЖДОЙ ПЛАНЕТЫ
                </div>
                <div className="text-slate-300 leading-snug">
                  У каждой из 4 планет есть свой <b>автоматический логистический стандартный модуль (50т)</b>:
                  <br />• <b>Своя планета → Другая планета 1</b> (1 мин)
                  <br />• <b>Задержка на стационарной орбите</b> (1 мин)
                  <br />• <b>Возвращение на свою планету</b> (1 мин)
                  <br />• <b>Задержка на орбите своей планеты</b> (1 мин) → <b>Другая планета 2</b> и так со всеми планетами без остановки!
                </div>
              </div>

              <div className="p-2.5 border border-emerald-500/50 bg-slate-900/80 space-y-1">
                <div className="font-extrabold text-emerald-300">
                  2. СООТВЕТСТВУЮЩИЙ ГРУЗ И ИСЧЕЗНОВЕНИЕ В ПЛАНЕТЕ
                </div>
                <div className="text-slate-300 leading-snug">
                  • Со своей планеты модуль везёт <b>её ресурсы</b> (Меркурий — <b>Fe</b>, Венера — <b>Al</b>, Земля — <b>Еда/H₂O</b>, Марс — <b>Ti</b>), с чужой планеты — <b>её ресурсы</b>.
                  <br />• При гибели корабля <b>груз продолжает двигаться строго по траектории убитого корабля</b> и, если его не подобрали, <b>исчезает в планете назначения</b>, чтобы мусора не было!
                  <br />• Исчезло в планетах назначения: <b className="text-emerald-300">{absorbedInPlanetCount}</b>
                </div>
              </div>

              <div className="p-2.5 border border-amber-500/50 bg-slate-900/80 space-y-1">
                <div className="font-extrabold text-amber-300">
                  3. УНИЧТОЖЕНИЕ МУСОРА ИЛИ ГРУЗА = АСТЕРОИД
                </div>
                <div className="text-slate-300 leading-snug">
                  • Любой выстрел лазером (ЛКМ / F), плазмой (ПКМ / R) или гамма-орудием по <b>космическому мусору или грузу</b> на траектории <b>считается уничтожением астероида</b> и вознаграждается соответственно (<b>+CR</b> и <b>+Безопасность коридора</b>)!
                  <br />• Уничтожено груза/мусора как астероидов: <b className="text-amber-300">{destroyedCargoDebrisAsAsteroidCount}</b> (Всего с астероидами: <b className="text-white">{clearedBouldersCount}</b>)
                </div>
              </div>
            </div>

            {/* Живое табло 4 планетных модулей и объектов на траекториях */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-yellow-300">
                  📡 ТЕКУЩЕЕ ПОЛОЖЕНИЕ МОДУЛЕЙ И ГРУЗОВ НА МЕЖПЛАНЕТНЫХ ТРАЕКТОРИЯХ:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFastForwardLogisticsCycle(60)}
                    className="px-2.5 py-1 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-[11px]"
                  >
                    ⏩ Промотать +60 сек (Смена фазы цикла / Доставка груза в планету)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDestroyCargoOrDebrisAsAsteroid()}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px]"
                  >
                    💥 Уничтожить груз/мусор (= Астероид +CR)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {logisticsUiSnapshot.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 border border-slate-700 bg-black/90 flex flex-col justify-between gap-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span style={{color: item.color}} className="font-extrabold">
                        {item.isCargoOrDebris ? '📦 ' : '🛰️ '}
                        {item.planetName}
                      </span>
                      <span className="px-1.5 py-0.5 border border-cyan-500/50 bg-cyan-950/40 text-cyan-200 font-extrabold text-[10px]">
                        Таймер фазы: {item.timerSec} сек ({item.progressPct}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-200">
                      <b>Фаза / Траектория:</b> {item.phaseLabel}
                    </div>
                    <div className="text-[11px] text-amber-300">
                      <b>Груз по маршруту ({item.routeLabel}):</b> {item.cargoLabel}
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${item.progressPct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleFocusLogisticsEntityInSight(item.id);
                          setIsLogisticsModalOpen(false);
                        }}
                        className="flex-1 py-1 px-2 border border-cyan-400 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-200 font-extrabold text-[10px]"
                      >
                        🎯 Навести прицел в 3D-космосе
                      </button>
                      {item.isCargoOrDebris && (
                        <button
                          type="button"
                          onClick={() => handleDestroyCargoOrDebrisAsAsteroid(item.id)}
                          className="py-1 px-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px]"
                        >
                          💥 Уничтожить как астероид
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* МОДАЛЬНОЕ ОКНО: ДОКУМЕНТ «ПОЛНОЕ ОПИСАНИЕ ФИНАЛЬНОЙ КОНФИГУРАЦИИ ИГРЫ» */}
      <FullGameConfigDocModal
        isOpen={isFullConfigDocOpen}
        onClose={() => setIsFullConfigDocOpen(false)}
        currentShipMassTons={totalShipMassTons}
        armorExtraTons={armorExtraTons}
        usedCargoTons={usedCargoTons}
        destroyedEnemyTonsXp={destroyedEnemyTonsXp}
        spentSalvoDebitKg={spentSalvoDebitKg}
        pilotLegalStatus={pilotLegalStatus}
        earnedGoBellKarma={earnedGoBellKarma}
      />
    </div>
  );
};
