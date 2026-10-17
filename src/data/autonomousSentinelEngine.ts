// ============================================================================
// АВТОНОМНЫЙ ЧАСОВОЙ (SENTINEL SENTRY PLATFORM)
// • Бездвигательная боевая платформа (0 кН тяги, 0 кг топлива)
// • Фотонно-квантовый солнечный конвертор звёздного излучения
// • Сверхпроводящий аккумулятор / ёмкий накопитель энергии
// • Орудийный комплекс с 4 регулируемыми уровнями силы удара
// • Автоматический модуль опознавания и атаки по принципу «Свой-Чужой» (IFF)
// • СТАНДАРТНЫЕ ФИЛЬТРЫ УГРОЗ (Пираты, Мародёры, Враги, Дроны) + СПИСОК ИСКЛЮЧЕНИЙ «КРОМЕ»
// • ЗОНЫ ВЛИЯНИЯ БАЗ: защита от несанкционированного грабежа (союзные пираты клана #77
//   могут окружить базу часовыми: огонь по чужим пиратам, а свои пираты клана #77 — СВОИ!)
// • Развёртывание в любых локациях: Звёздные Врата, Звезда, Планета, Пояс, Свободные координаты
// ============================================================================

import {
  StellarRadiationProfile,
  getStarRadiationProfile,
} from './stellarPhysicsEngine';

export type SentinelStrikePowerMode =
  | 'LIGHT_PULSE'
  | 'MEDIUM_QUASAR'
  | 'HEAVY_GAMMA_HAMMER'
  | 'OVERCHARGE_SHOCKWAVE';

export type SentinelAiMode =
  | 'AUTO_DEFENSE'
  | 'ENERGY_PRIORITY'
  | 'MANUAL_REMOTE';

export type SentinelDeploymentLocationType =
  | 'STARGATE_PERIMETER'      // У Звёздных Врат
  | 'CENTRAL_STAR_PROXIMITY'  // У Центральной Звезды
  | 'OWNED_PLANET_ORBIT'      // У своей Планеты / Мира Клана
  | 'ASTEROID_BELT_MINEFIELD' // В Поясе Астероидов
  | 'CURRENT_SHIP_POSITION'   // В текущих координатах корабля
  | 'CUSTOM_COORDINATES';     // Произвольная точка пространства

export type SentinelIffProtocol =
  | 'PIRATES_AND_DRONES_ONLY'    // Огонь только по пиратам и карательным дронам
  | 'TRESPASSERS_WITHOUT_PASS'   // Нарушители с отриц. кармой, мародёры и пираты без пропуска
  | 'TOTAL_AIRSPACE_LOCK'        // Тотальный запрет сектора (огонь по всем, кроме владельца)
  | 'CUSTOM_CLAN_SECURITY';      // Безопасность кланов и союзников

// ============================================================================
export type SentinelEngagementDirective =
  | 'DETER_AND_DESTROY'               // «Отпугнуть и уничтожить» (СТАНДАРТ): сила орудий включается по мере приближения
  | 'DESTROY_ONLY'                    // «Только уничтожить» (ЗАСАДА): сокрушительный удар со всех сторон без предупреждений
  | 'VOLUMETRIC_ENGINE_SUPPRESSION';  // «Объёмное торможение двигателя» (МИНИМУМ 3 ЧАСОВЫХ): торможение в тоннах, стрельба исключена

export interface SentinelEngagementDirectiveMeta {
  id: SentinelEngagementDirective;
  titleRu: string;
  badgeRu: string;
  shortDescRu: string;
  detailedDescRu: string;
  icon: string;
  colorHex: string;
}

export const SENTINEL_ENGAGEMENT_DIRECTIVES_META: Record<
  SentinelEngagementDirective,
  SentinelEngagementDirectiveMeta
> = {
  DETER_AND_DESTROY: {
    id: 'DETER_AND_DESTROY',
    titleRu: 'Отпугнуть и уничтожить',
    badgeRu: 'СТАНДАРТ · ОТПУГИВАНИЕ & ЭСКАЛАЦИЯ',
    shortDescRu: 'Сила орудия включается по мере приближения',
    detailedDescRu:
      'Стандартный режим. При приближении цели сила орудий возрастает ступенчато: на дальней дистанции (> 5500 м) — предупредительный выстрел импульсом «Игла» (35 кг), давая шанс развернуться. На средней (3000–5500 м) — разряд «Квазар» (125 кг). На ближней (1200–3000 м) — «Гамма-молот» (380 кг). В упор (< 1200 м) — ультимативный «Оверчардж» (1 100 кг).',
    icon: '🛡️',
    colorHex: '#38bdf8',
  },
  DESTROY_ONLY: {
    id: 'DESTROY_ONLY',
    titleRu: 'Только уничтожить (Засада / Ловушка)',
    badgeRu: 'ЗАСАДА · ТОЛЬКО УНИЧТОЖЕНИЕ',
    shortDescRu: 'Мгновенный сокрушительный залп со всех сторон без предупреждений',
    detailedDescRu:
      'Режим смертельной засады! Орудия молчат и не выдают позицию слабыми предупредительными лучами. Преследователь заманивается в облако часовых, и как только он пересекает периметр — все часовые кластера одновременно открывают огонь максимальной мощности со всех сторон на полное уничтожение!',
    icon: '⚡',
    colorHex: '#ef4444',
  },
  VOLUMETRIC_ENGINE_SUPPRESSION: {
    id: 'VOLUMETRIC_ENGINE_SUPPRESSION',
    titleRu: 'Объёмное торможение двигателя (Мин. 3 часовых)',
    badgeRu: 'ТОРМОЗ ДВИГАТЕЛЯ · ПОЛЕ МЕЖДУ ТРЕМЯ ЧАСОВЫМИ',
    shortDescRu: 'Воздействие на двигатель корабля: гашение тяги и скорости в тоннах (без стрельбы)',
    detailedDescRu:
      'Объёмная полевая конструкция (не менее 3 часовых). Не наносит урона корпусу, а оказывает прямое силовое воздействие на маршевые и маневровые двигатели корабля, снижая его тягу (кН) и скорость до нуля. Сила торможения выражается в тоннах (точно соответствует массе/дебету часовых). В центре между часовыми сила торможения спадает до 0, а у периметра часовых (100% дистанция соответствия) достигает максимума. Стрельба в этом режиме полностью исключена!',
    icon: '🧲',
    colorHex: '#06b6d4',
  },
};

// ============================================================================
// ВНЕШНИЙ ВИД И МОДИФИКАЦИИ ЧАСОВОГО:
// • В центре шар, похожий на большую морскую мину с рожками в виде пирамидок.
// • Из шара торчат солнечные панели, похожие на лопасти старых ветряных мельниц.
// • 3 модификации различаются количеством лопастей: 4, 6, 8.
// • Количество лопастей напрямую влияет на скорость зарядки накопителя часового!
// ============================================================================

export type SentinelBladeModification = 4 | 6 | 8;

export interface SentinelBladeModSpec {
  bladesCount: SentinelBladeModification;
  codeName: string;
  titleRu: string;
  badgeRu: string;
  rechargeMultiplier: number; // 1.0x (4 шт.), 1.5x (6 шт.), 2.0x (8 шт.)
  surfaceAreaSqM: number;     // 450 м², 675 м², 900 м²
  dryMassTons: number;        // 10.5 т, 12.0 т, 13.5 т
  colorHex: string;
  descriptionRu: string;
  appearanceRu: string;
  tacticalAdvantageRu: string;
}

export const SENTINEL_BLADE_MODS_META: Record<
  SentinelBladeModification,
  SentinelBladeModSpec
> = {
  4: {
    bladesCount: 4,
    codeName: 'MK-4 «КВАДРО-МЕЛЬНИЦА»',
    titleRu: 'Модификация Mk-4 · 4 лопасти',
    badgeRu: '4 ЛОПАСТИ · 1.0x БАЗОВАЯ ЗАРЯДКА',
    rechargeMultiplier: 1.0,
    surfaceAreaSqM: 450,
    dryMassTons: 10.5,
    colorHex: '#38bdf8',
    descriptionRu:
      'Классический четырёхкрылый крест, вдохновлённый формой старинных ветряных мельниц. Минимальная парусность, оптимальная балансировка в узлах Лагранжа.',
    appearanceRu:
      'Титановый шар морской мины с 14 пирамидальными рожками-датчиками и 4 мельничными лопастями под прямым углом 90° с решётчатыми фермами и фотоэлектрическим полотном.',
    tacticalAdvantageRu: 'Базовая скорость накопления энергии (+12.0 ГЭУ/с). Лёгкий сухой вес (10.5 т).',
  },
  6: {
    bladesCount: 6,
    codeName: 'MK-6 «ГЕКСА-МЕЛЬНИЦА»',
    titleRu: 'Модификация Mk-6 · 6 лопастей',
    badgeRu: '6 ЛОПАСТЕЙ · +50% УСКОРЕНИЕ (1.5x)',
    rechargeMultiplier: 1.5,
    surfaceAreaSqM: 675,
    dryMassTons: 12.0,
    colorHex: '#facc15',
    descriptionRu:
      'Шестилучевая звезда с увеличенной на 50% рабочей площадью сбора фотонов. Идеальный баланс между скоростью подзарядки и прочностью несущего узла.',
    appearanceRu:
      'Шар морской мины с радиальными пирамидками и 6 лопастями под углом 60°. Увеличенная площадь фотонных парусов с характерной мельничной обрешёткой.',
    tacticalAdvantageRu: 'Ускоренная на +50% зарядка накопителя (1.5x, до +18.0 ГЭУ/с). Быстрый переход в боевую готовность после залпа.',
  },
  8: {
    bladesCount: 8,
    codeName: 'MK-8 «ОКТА-МЕЛЬНИЦА»',
    titleRu: 'Модификация Mk-8 · 8 лопастей',
    badgeRu: '8 ЛОПАСТЕЙ · 2.0x УДВОЕНИЕ СКОРОСТИ',
    rechargeMultiplier: 2.0,
    surfaceAreaSqM: 900,
    dryMassTons: 13.5,
    colorHex: '#ec4899',
    descriptionRu:
      'Максимальная восьмилопастная мельничная турбина с полным перекрытием звёздного потока. Удваивает скорость зарядки накопителя, обеспечивая непрерывную боевую работу.',
    appearanceRu:
      'Мощная сферическая морская мина с частоколом пирамидальных рожков и 8 симметричными лопастями под углом 45°. Густая сеть фотонных парусов и кристаллических дорожек.',
    tacticalAdvantageRu: 'Двойная скорость зарядки (2.0x, до +24.0 ГЭУ/с). Мгновенное восполнение энергии для режима объёмного торможения двигателей.',
  },
};

export interface DynamicStrikeResolution {
  strikeMode: SentinelStrikePowerMode;
  phaseTitleRu: string;
  isWarningShot: boolean;
  distanceLabelRu: string;
  descriptionRu: string;
  beamColorHex: string;
}

export interface SwarmCrossfireReport {
  sentinelId: string;
  platformName: string;
  angleDeg: number;
  strikeMode: SentinelStrikePowerMode;
  damageKg: number;
  energyCostGeu: number;
  beamColorHex: string;
}

export interface SwarmCrossfireResult {
  clusterId: string;
  clusterName: string;
  totalPlatforms: number;
  firingPlatformsCount: number;
  totalDamageUnits: number;
  totalDamageKg: number;
  totalEnergySpentGeu: number;
  isAmbushTrapTriggered: boolean;
  isCrossfireSurrounded: boolean; // Огонь со всех сторон 360°
  platformReports: SwarmCrossfireReport[];
  summaryMessageRu: string;
  logSummaryRu: string;
}

export interface VolumetricSentinelNodeStatus {
  sentinelId: string;
  name: string;
  angleDeg: number;
  massTons: number; // Масса часового (12.0 т)
  distanceToTargetUnits: number;
  individualBrakingTons: number;
  energyDrainGeu: number;
  beamGlowHex: string;
}

export interface VolumetricEngineSuppressionResult {
  clusterId: string;
  clusterName: string;
  totalNodes: number;
  activeNodesCount: number;
  targetName: string;
  isFieldActive: boolean; // Активно только если >= 3 часовых
  targetDistanceToCenterUnits: number; // Расстояние от цели до геометрического центра (0..2000)
  clusterPerimeterRadiusUnits: number; // Радиус между часовыми (~2000 единиц)
  brakingPowerRatio: number; // 0.0 в самом центре, 1.0 (100%) на дистанции соответствия выстрела у часовых
  totalBrakingForceTons: number; // Суммарная сила торможения в тоннах (тяга гасится в тоннах)
  thrustReductionPercent: number; // Снижение тяги двигателя корабля (0..100%)
  speedReductionPercent: number; // Снижение скорости корабля (0..100%)
  shootingBlocked: boolean; // true — стрельба полностью исключена в этом режиме
  nodes: VolumetricSentinelNodeStatus[];
  summaryMessageRu: string;
}

// ============================================================================
// НОВАЯ АРХИТЕКТУРА IFF: ФИЛЬТРЫ УГРОЗ + СПИСОК ИСКЛЮЧЕНИЙ «КРОМЕ» + ЗОНЫ ВЛИЯНИЯ
// ============================================================================

export interface SentinelTargetThreatFilters {
  filterPirates: boolean;               // 1. Атаковать пиратов
  filterMarauders: boolean;             // 2. Атаковать мародёров и расхитителей
  filterDictatorDrones: boolean;        // 3. Атаковать карательные дроны диктатора
  filterNegativeKarma: boolean;         // 4. Атаковать нарушителей с отрицательной кармой (Karma < 0)
  filterUnregisteredPass: boolean;      // 5. Атаковать суда без зарегистрированного IFF-пропуска
  filterForeignMilitary: boolean;       // 6. Атаковать чужие военные суда и наёмников
  filterAllStrangers: boolean;          // 7. Тотальная бесполётная зона (абсолютно все чужие суда)
}

export interface SentinelClanExceptionEntry {
  id: string;
  clanName: string;                     // Название клана (напр. «Пиратский Синдикат Корсаров», «Клан Чёрного Черепа», «Клан Розовой бабочки»)
  clanNumber: string;                   // Номер / идентификатор клана (напр. '#77', '#13', '#42')
  allowPiratesOfThisClan: boolean;      // КЛЮЧЕВОЙ ФЛАГ: члены этого клана — пираты, но они СВОИ в этой зоне влияния (база пиратов)!
  customNote?: string;                  // Примечание: «Соклановцы базы, беспрепятственный проход»
}

export interface SentinelExceptionsConfig {
  ownerCallsign: string;                // Позывной владельца (Cobra Mk III)
  ownerClanName: string;                // Клан владельца (напр. «Пиратский Синдикат Корсаров»)
  ownerClanNumber: string;              // Номер клана (напр. '#77')
  clansWhitelist: SentinelClanExceptionEntry[]; // Список разрешённых кланов и их номеров
  individualShipsWhitelist: string[];   // Конкретные доверенные корабли / позывные
  secretTransponderPassCode: string;    // Секретный пропускной IFF-код (транспондер)
  allowNeutralTraders: boolean;         // Пропускать мирных торговцев (если не включён фильтр тотальной зоны)
}

export type SentinelZoneInfluencePreset =
  | 'PIRATE_BASE_OUTPOST'       // 🏴‍☠️ «Пиратская база и логово корсаров»
  | 'SOVEREIGN_SYSTEM_DEFENSE'  // 🛡️ «Суверенная система владельца»
  | 'STARGATE_CUSTOMS_BORDER'   // ⛩️ «Таможенный кордон Звёздных Врат»
  | 'CLAN_ASTEROID_MINING'      // ☄️ «Астероидный рудник клана»
  | 'TOTAL_AIRSPACE_BLOCKADE'   // ⛔ «Тотальная бесполётная зона базы»
  | 'CUSTOM_ZONE';              // ⚙️ «Пользовательская конфигурация зоны влияния»

export interface SentinelZonePresetMeta {
  id: SentinelZoneInfluencePreset;
  titleRu: string;
  badgeRu: string;
  icon: string;
  colorHex: string;
  descriptionRu: string;
  targetFilters: SentinelTargetThreatFilters;
  buildExceptions: (ownerName: string) => SentinelExceptionsConfig;
}

export const SENTINEL_ZONE_PRESETS_META: Record<
  SentinelZoneInfluencePreset,
  SentinelZonePresetMeta
> = {
  PIRATE_BASE_OUTPOST: {
    id: 'PIRATE_BASE_OUTPOST',
    titleRu: 'Пиратская база и зона влияния корсаров',
    badgeRu: 'ПИРАТСКАЯ БАЗА · КЛАН #77',
    icon: '🏴‍☠️',
    colorHex: '#ef4444',
    descriptionRu:
      'Окружение пиратской базы часовыми: включён фильтр «Пираты» (уничтожаются чужие пираты-конкуренты, мародёры и правительственные патрули), а в списке исключений «КРОМЕ» указан союзный пиратский клан #77 и его номер. Все свои пираты свободно заходят на базу без риска несанкционированного грабежа!',
    targetFilters: {
      filterPirates: true,
      filterMarauders: true,
      filterDictatorDrones: true,
      filterNegativeKarma: false,
      filterUnregisteredPass: true,
      filterForeignMilitary: true,
      filterAllStrangers: false,
    },
    buildExceptions: (ownerName) => ({
      ownerCallsign: ownerName,
      ownerClanName: 'Пиратский Синдикат Корсаров',
      ownerClanNumber: '#77',
      clansWhitelist: [
        {
          id: 'clan-pirate-77',
          clanName: 'Пиратский Синдикат Корсаров',
          clanNumber: '#77',
          allowPiratesOfThisClan: true,
          customNote: 'Основной гарнизон и флот пиратской базы',
        },
        {
          id: 'clan-black-skull-13',
          clanName: 'Пираты Чёрного Черепа',
          clanNumber: '#13',
          allowPiratesOfThisClan: true,
          customNote: 'Союзный пиратский клан по пакту ненападения',
        },
      ],
      individualShipsWhitelist: ['CORSAIR-01', 'BLACK-SKULL-LEADER'],
      secretTransponderPassCode: 'PASS-PIRATE-CORSAIR-77',
      allowNeutralTraders: false,
    }),
  },
  SOVEREIGN_SYSTEM_DEFENSE: {
    id: 'SOVEREIGN_SYSTEM_DEFENSE',
    titleRu: 'Суверенная система и защита от грабежа',
    badgeRu: 'СУВЕРЕНИТЕТ СИСТЕМЫ',
    icon: '🛡️',
    colorHex: '#10b981',
    descriptionRu:
      'Защита планетарных систем и торговых коридоров от несанкционированного грабежа. Огонь по всем пиратам, мародёрам и карательным дронам. Члены клана владельца и союзного Клана Розовой бабочки допущены без ограничений.',
    targetFilters: {
      filterPirates: true,
      filterMarauders: true,
      filterDictatorDrones: true,
      filterNegativeKarma: true,
      filterUnregisteredPass: false,
      filterForeignMilitary: false,
      filterAllStrangers: false,
    },
    buildExceptions: (ownerName) => ({
      ownerCallsign: ownerName,
      ownerClanName: 'Клан владельца системы',
      ownerClanNumber: '#01',
      clansWhitelist: [
        {
          id: 'clan-owner-01',
          clanName: 'Клан владельца',
          clanNumber: '#01',
          allowPiratesOfThisClan: false,
          customNote: 'Гражданский и военный флот владельца',
        },
        {
          id: 'clan-rose-butterfly-09',
          clanName: 'Клан Розовой бабочки',
          clanNumber: '#09',
          allowPiratesOfThisClan: false,
          customNote: 'Освобождённые миры и дружественный клан',
        },
        {
          id: 'clan-trade-consortium-42',
          clanName: 'Торговый Консорциум',
          clanNumber: '#42',
          allowPiratesOfThisClan: false,
          customNote: 'Официальные торговые представители',
        },
      ],
      individualShipsWhitelist: ['COBRA-COMMANDER-01'],
      secretTransponderPassCode: 'PASS-SOVEREIGN-SIGMA-42',
      allowNeutralTraders: true,
    }),
  },
  STARGATE_CUSTOMS_BORDER: {
    id: 'STARGATE_CUSTOMS_BORDER',
    titleRu: 'Таможенный кордон Звёздных Врат',
    badgeRu: 'КОРДОН ВРАТ',
    icon: '⛩️',
    colorHex: '#38bdf8',
    descriptionRu:
      'Контроль периметра Звёздных Врат. Перехват контрабандистов, мародёров и судов без официального пропуска. Допуск торговцев с положительной репутацией.',
    targetFilters: {
      filterPirates: true,
      filterMarauders: true,
      filterDictatorDrones: true,
      filterNegativeKarma: true,
      filterUnregisteredPass: true,
      filterForeignMilitary: false,
      filterAllStrangers: false,
    },
    buildExceptions: (ownerName) => ({
      ownerCallsign: ownerName,
      ownerClanName: 'Таможенная Служба Врат',
      ownerClanNumber: '#00',
      clansWhitelist: [
        {
          id: 'clan-gate-guard',
          clanName: 'Гвардия Врат',
          clanNumber: '#00',
          allowPiratesOfThisClan: false,
          customNote: 'Официальный гарнизон мегаструктуры',
        },
        {
          id: 'clan-owner-01',
          clanName: 'Клан владельца',
          clanNumber: '#01',
          allowPiratesOfThisClan: false,
          customNote: 'Владелец системы',
        },
      ],
      individualShipsWhitelist: [],
      secretTransponderPassCode: 'PASS-STARGATE-TRANSIT-99',
      allowNeutralTraders: true,
    }),
  },
  CLAN_ASTEROID_MINING: {
    id: 'CLAN_ASTEROID_MINING',
    titleRu: 'Астероидный рудник и база добычи',
    badgeRu: 'ОХРАНА РУДНИКА',
    icon: '☄️',
    colorHex: '#facc15',
    descriptionRu:
      'Охрана зон добычи Платины, Золота и Критического вещества Ω-γ от расхищения. Огонь по всем пиратам, мародёрам и неавторизованным шахтёрам.',
    targetFilters: {
      filterPirates: true,
      filterMarauders: true,
      filterDictatorDrones: true,
      filterNegativeKarma: true,
      filterUnregisteredPass: true,
      filterForeignMilitary: true,
      filterAllStrangers: false,
    },
    buildExceptions: (ownerName) => ({
      ownerCallsign: ownerName,
      ownerClanName: 'Горнорудный Клан',
      ownerClanNumber: '#24',
      clansWhitelist: [
        {
          id: 'clan-miners-24',
          clanName: 'Горнорудный Клан',
          clanNumber: '#24',
          allowPiratesOfThisClan: false,
          customNote: 'Бригады буровых кораблей «Буран / Шаттл»',
        },
        {
          id: 'clan-owner-01',
          clanName: 'Клан владельца',
          clanNumber: '#01',
          allowPiratesOfThisClan: false,
          customNote: 'Руководство системы',
        },
      ],
      individualShipsWhitelist: ['BURAN-MINER-1', 'BURAN-MINER-2', 'BURAN-MINER-3', 'BURAN-MINER-4'],
      secretTransponderPassCode: 'PASS-MINING-DRILL-24',
      allowNeutralTraders: false,
    }),
  },
  TOTAL_AIRSPACE_BLOCKADE: {
    id: 'TOTAL_AIRSPACE_BLOCKADE',
    titleRu: 'Тотальная бесполётная зона базы (Airspace Lock)',
    badgeRu: 'ТОТАЛЬНЫЙ ЗАПРЕТ',
    icon: '⛔',
    colorHex: '#ec4899',
    descriptionRu:
      'Абсолютный запрет приближения! Огонь на поражение по любому объекту, не внесённому в персональный список исключений «КРОМЕ».',
    targetFilters: {
      filterPirates: true,
      filterMarauders: true,
      filterDictatorDrones: true,
      filterNegativeKarma: true,
      filterUnregisteredPass: true,
      filterForeignMilitary: true,
      filterAllStrangers: true,
    },
    buildExceptions: (ownerName) => ({
      ownerCallsign: ownerName,
      ownerClanName: 'Клан владельца',
      ownerClanNumber: '#01',
      clansWhitelist: [
        {
          id: 'clan-owner-01',
          clanName: 'Клан владельца',
          clanNumber: '#01',
          allowPiratesOfThisClan: false,
          customNote: 'Флагман и свита владельца',
        },
      ],
      individualShipsWhitelist: [],
      secretTransponderPassCode: 'PASS-ABSOLUTE-LOCK-00',
      allowNeutralTraders: false,
    }),
  },
  CUSTOM_ZONE: {
    id: 'CUSTOM_ZONE',
    titleRu: 'Пользовательская конфигурация зоны влияния',
    badgeRu: 'РУЧНАЯ НАСТРОЙКА',
    icon: '⚙️',
    colorHex: '#a855f7',
    descriptionRu:
      'Индивидуальный набор фильтров угроз и тонкая настройка списка исключений «КРОМЕ» (включая авторизацию соклановцев-пиратов по номеру клана).',
    targetFilters: {
      filterPirates: true,
      filterMarauders: true,
      filterDictatorDrones: true,
      filterNegativeKarma: false,
      filterUnregisteredPass: false,
      filterForeignMilitary: false,
      filterAllStrangers: false,
    },
    buildExceptions: (ownerName) => ({
      ownerCallsign: ownerName,
      ownerClanName: 'Пользовательский Клан',
      ownerClanNumber: '#77',
      clansWhitelist: [
        {
          id: 'clan-custom-1',
          clanName: 'Пользовательский Клан',
          clanNumber: '#77',
          allowPiratesOfThisClan: true,
          customNote: 'Доверенные соклановцы базы',
        },
      ],
      individualShipsWhitelist: [],
      secretTransponderPassCode: 'PASS-CUSTOM-ZONE-77',
      allowNeutralTraders: true,
    }),
  },
};

export const DEFAULT_TARGET_FILTERS: SentinelTargetThreatFilters = {
  filterPirates: true,
  filterMarauders: true,
  filterDictatorDrones: true,
  filterNegativeKarma: true,
  filterUnregisteredPass: false,
  filterForeignMilitary: false,
  filterAllStrangers: false,
};

export const DEFAULT_EXCEPTIONS_CONFIG: SentinelExceptionsConfig = {
  ownerCallsign: 'Командир (Cobra Mk III)',
  ownerClanName: 'Клан владельца',
  ownerClanNumber: '#01',
  clansWhitelist: [
    {
      id: 'ex-def-1',
      clanName: 'Клан владельца',
      clanNumber: '#01',
      allowPiratesOfThisClan: false,
      customNote: 'Собственный флот',
    },
    {
      id: 'ex-def-2',
      clanName: 'Клан Розовой бабочки',
      clanNumber: '#09',
      allowPiratesOfThisClan: false,
      customNote: 'Союзный клан',
    },
    {
      id: 'ex-def-3',
      clanName: 'Торговый Консорциум',
      clanNumber: '#42',
      allowPiratesOfThisClan: false,
      customNote: 'Торговые партнёры',
    },
  ],
  individualShipsWhitelist: [],
  secretTransponderPassCode: 'PASS-SIGMA-42',
  allowNeutralTraders: true,
};

// ============================================================================
// СПЕЦИФИКАЦИИ СИЛЫ УДАРА ОРУДИЯ (4 РЕЖИМА)
// ============================================================================

export interface SentinelStrikeModeSpec {
  id: SentinelStrikePowerMode;
  codeName: string;
  titleRu: string;
  strikePowerLabel: string;
  massEquivalentKg: number; // Масса разрушения / дебет в кг
  damageUnits: number; // Урон в единицах
  energyCostGeu: number; // Расход энергии накопителя в ГЭУ
  cooldownSeconds: number; // Время перезарядки / накачки конденсатора
  beamColorHex: string; // Цвет боевого луча
  beamGlowRgba: string;
  descriptionRu: string;
  tacticalRoleRu: string;
  formulaRu: string;
}

export const SENTINEL_STRIKE_MODES: Record<
  SentinelStrikePowerMode,
  SentinelStrikeModeSpec
> = {
  LIGHT_PULSE: {
    id: 'LIGHT_PULSE',
    codeName: 'РЕЖИМ I : «ИГЛА»',
    titleRu: 'Легкий Тактический Импульс',
    strikePowerLabel: '35 кг / 35 ед.',
    massEquivalentKg: 35,
    damageUnits: 35,
    energyCostGeu: 120,
    cooldownSeconds: 0.8,
    beamColorHex: '#38bdf8',
    beamGlowRgba: 'rgba(56, 189, 248, 0.45)',
    descriptionRu:
      'Высокочастотный лазерный луч с минимальным энергопотреблением. Мгновенно перехватывает лёгкие зонды, ракеты и карательные дроны диктатора.',
    tacticalRoleRu: 'ПВО сектора, отстрел дронов и мелких осколков',
    formulaRu: 'E_salvo = 120 ГЭУ · P_hit = 35 кг · f_cadence = 1.25 Гц',
  },
  MEDIUM_QUASAR: {
    id: 'MEDIUM_QUASAR',
    codeName: 'РЕЖИМ II : «КВАЗАР»',
    titleRu: 'Средний Фокусированный Разряд',
    strikePowerLabel: '125 кг / 125 ед.',
    massEquivalentKg: 125,
    damageUnits: 125,
    energyCostGeu: 450,
    cooldownSeconds: 2.5,
    beamColorHex: '#facc15',
    beamGlowRgba: 'rgba(250, 204, 21, 0.5)',
    descriptionRu:
      'Сбалансированный плазменно-фотонный сгусток. Пробивает стандартные дефлекторные щиты и прожигает титановые бронеплиты пиратских рейдеров.',
    tacticalRoleRu: 'Огонь по корветам, перехватчикам и контрабандистам',
    formulaRu: 'E_salvo = 450 ГЭУ · P_hit = 125 кг · Δt_charge = 2.5 с',
  },
  HEAVY_GAMMA_HAMMER: {
    id: 'HEAVY_GAMMA_HAMMER',
    codeName: 'РЕЖИМ III : «ГАММА-МОЛОТ»',
    titleRu: 'Тяжёлый Коллимированный Удар',
    strikePowerLabel: '380 кг / 380 ед.',
    massEquivalentKg: 380,
    damageUnits: 380,
    energyCostGeu: 1200,
    cooldownSeconds: 5.5,
    beamColorHex: '#a855f7',
    beamGlowRgba: 'rgba(168, 85, 247, 0.6)',
    descriptionRu:
      'Сверхмощный пучок когерентных гамма-квантов. Лавинообразное размыкание молекулярных узлов цели, гарантированный раскол астероидов и тяжёлых кораблей.',
    tacticalRoleRu: 'Ликвидация фрегатов, крейсеров и добыча плотных руд',
    formulaRu: 'E_salvo = 1200 ГЭУ · P_hit = 380 кг · Синтез гамма-квантов',
  },
  OVERCHARGE_SHOCKWAVE: {
    id: 'OVERCHARGE_SHOCKWAVE',
    codeName: 'РЕЖИМ IV : «СИНГУЛЯРНЫЙ ОВЕРЧАРДЖ»',
    titleRu: 'Сверхкритический Сброс Накопителя',
    strikePowerLabel: '1 100 кг / 1 100 ед.',
    massEquivalentKg: 1100,
    damageUnits: 1100,
    energyCostGeu: 3000,
    cooldownSeconds: 14.0,
    beamColorHex: '#ef4444',
    beamGlowRgba: 'rgba(239, 68, 68, 0.75)',
    descriptionRu:
      'Аварийный сброс 60–75% всей энергии накопителя через сверхпроводящую линзу. Катастрофический гравитационно-фотонный удар, стирающий флагманы с одного залпа.',
    tacticalRoleRu: 'Абсолютный ультимативный залп против флагманов и боссов',
    formulaRu: 'E_salvo = 3000 ГЭУ (E = mc²) · P_hit = 1.10 т · Шок-волна',
  },
};

export interface SentinelPlatformTelemetry {
  id: string;
  name: string;
  sectorName: string;
  deployed: boolean;
  statusRu: string;
  // Дислокация в звёздной системе
  locationType: SentinelDeploymentLocationType;
  locationLabelRu: string;
  worldPos: { x: number; y: number; z: number };
  targetScanRadiusUnits: number; // Радиус обнаружения (обычно 8 000 ед.)
  // Зона Влияния и Новая Матрица IFF (Фильтры + Исключения «КРОМЕ»)
  zoneInfluencePreset: SentinelZoneInfluencePreset;
  targetThreatFilters: SentinelTargetThreatFilters;
  exceptionsConfig: SentinelExceptionsConfig;
  // Обратная совместимость с базовыми полями IFF
  iffProtocol: SentinelIffProtocol;
  authorizedOwnerCallsign: string; // Позывной владельца (напр. пилот или клан)
  whitelistClans: string[]; // Разрешённые союзные кланы
  iffPassCode: string; // Секретный транспондерный шифр
  allowNeutralTraders: boolean; // Пропускать мирных торговцев с кармой >= 0
  // Конструктивные особенности (БЕЗ ДВИГАТЕЛЯ)
  propulsionUnitInstalled: false;
  engineThrustKiloNewtons: 0;
  propellantMassKg: 0;
  dryMassTons: number; // 10.5 т (4 лопасти), 12.0 т (6 лопастей), 13.5 т (8 лопастей)
  attitudeControl: string; // «Микрогиродины ориентации 18 Вт (3 оси)»
  positionFixation: string; // «Пассивный орбитальный резонанс Лагранжа L4/L5»
  // Внешний вид и мельничные солнечные лопасти (Морская мина с рожками-пирамидками)
  bladeModification: SentinelBladeModification; // 4, 6 или 8 лопастей
  bladeCount: number; // 4, 6 или 8
  chargeRateMultiplier: number; // 1.0x, 1.5x или 2.0x
  bladeModelTitleRu: string; // «Mk-4 Квадро-Мельница (4 лопасти)»
  // Солнечный конвертор
  converterSurfaceAreaSqM: number; // 850 м²
  converterEfficiencyPct: number; // 96.4%
  solarFluxWattsPerSqM: number;
  energyRechargeRateGeuPerSec: number;
  energyRechargeRateGeuPerMin: number;
  starDistanceUnits: number;
  currentStarProfile: StellarRadiationProfile;
  // Аккумуляторный блок / накопитель
  batteryChargeGeu: number;
  batteryCapacityGeu: number;
  batteryPercent: number;
  standbyDrainGeuPerSec: number; // 2.5 ГЭУ/с (авионика, РЛС, гиродинамика)
  netEnergyFlowGeuPerSec: number; // приход - расход
  secondsToFullCharge: number;
  // Орудийный комплекс и тактические директивы
  strikeMode: SentinelStrikePowerMode;
  engagementDirective: SentinelEngagementDirective; // «Отпугнуть и уничтожить» (по дистанции) vs «Только уничтожить» (засада)
  aiMode: SentinelAiMode;
  cooldownRemainingSeconds: number;
  totalShotsFired: number;
  totalDamageDealtKg: number;
  targetsInterceptedCount: number;
  lastShotTimestampMs: number;
  lastTargetName?: string;
  lastEngagedIffClassification?: string;
  // Кластерная координация / «Облако часовых» (Swarm Ambush Trap)
  swarmClusterId?: string;
  swarmClusterName?: string;
  swarmVectorAngleDeg?: number;
  swarmPlatformIndex?: number;
  swarmTotalNodes?: number;
  // Боевой журнал
  eventLog: Array<{
    id: string;
    timestamp: string;
    category: 'SOLAR' | 'FIRE' | 'INTERCEPT' | 'MODE_CHANGE' | 'IFF' | 'WARNING';
    message: string;
  }>;
}

export interface IffTargetEvaluation {
  isFriend: boolean;
  shouldEngage: boolean;
  labelRu: string;
  threatLevel: 'FRIENDLY' | 'NEUTRAL' | 'WARNING' | 'HOSTILE';
  reasonRu: string;
  matchedRuleRu: string;
  isExceptionMatch?: boolean;
}

/**
 * Оценивает цель по алгоритму «Свой-Чужой» с поддержкой:
 * 1. Стандартных фильтров угроз (пираты, мародёры, враги, карательные дроны, отрицательная карма, военные суда)
 * 2. Списка исключений «КРОМЕ» (название клана + номер клана: например пираты клана #77 допущены на базу, а чужие пираты уничтожаются)
 * 3. Зон влияния баз и секторов для предотвращения несанкционированного грабежа.
 */
export function evaluateTargetIffStatus(
  targetKind:
    | 'PLAYER'
    | 'SHUTTLE'
    | 'TRADER'
    | 'PIRATE'
    | 'DICTATOR_DRONE'
    | 'DEBRIS'
    | 'MILITARY'
    | 'MARAUDER'
    | 'UNKNOWN',
  targetKarma = 0,
  targetClanName?: string,
  targetClanNumberOrProtocol?: string | SentinelIffProtocol,
  customFiltersOrWhitelist?: SentinelTargetThreatFilters | string[],
  customExceptionsOrAllowTraders?: SentinelExceptionsConfig | boolean,
  targetTransponderCode?: string,
  targetShipCallsign?: string
): IffTargetEvaluation {
  // Нормализация параметров для поддержки как нового, так и старого формата вызова
  let targetClanNumber: string | undefined = undefined;
  let filters: SentinelTargetThreatFilters = DEFAULT_TARGET_FILTERS;
  let exceptions: SentinelExceptionsConfig = DEFAULT_EXCEPTIONS_CONFIG;

  if (typeof targetClanNumberOrProtocol === 'string' && targetClanNumberOrProtocol.startsWith('#')) {
    targetClanNumber = targetClanNumberOrProtocol;
  }

  if (
    customFiltersOrWhitelist &&
    typeof customFiltersOrWhitelist === 'object' &&
    'filterPirates' in customFiltersOrWhitelist
  ) {
    filters = customFiltersOrWhitelist as SentinelTargetThreatFilters;
  }

  if (
    customExceptionsOrAllowTraders &&
    typeof customExceptionsOrAllowTraders === 'object' &&
    'clansWhitelist' in customExceptionsOrAllowTraders
  ) {
    exceptions = customExceptionsOrAllowTraders as SentinelExceptionsConfig;
  }

  // Извлечение номера клана из строки имени, если он содержится внутри (напр. «Пиратский Синдикат Корсаров #77»)
  if (!targetClanNumber && targetClanName) {
    const numMatch = targetClanName.match(/#(\d+)/);
    if (numMatch) {
      targetClanNumber = `#${numMatch[1]}`;
    }
  }

  // =========================================================================
  // ШАГ 1: ЛИЧНЫЙ КОРАБЛЬ ВЛАДЕЛЬЦА СИСТЕМЫ (COBRA MK III)
  // =========================================================================
  if (
    targetKind === 'PLAYER' ||
    (targetShipCallsign &&
      exceptions.ownerCallsign &&
      targetShipCallsign.toLowerCase().includes(exceptions.ownerCallsign.toLowerCase()))
  ) {
    return {
      isFriend: true,
      shouldEngage: false,
      labelRu: 'СВОЙ : ВЛАДЕЛЕЦ СИСТЕМЫ (COBRA MK III)',
      threatLevel: 'FRIENDLY',
      reasonRu: 'Авторизованный главный флагман владельца. Огонь категорически заблокирован.',
      matchedRuleRu: 'Владелец системы',
      isExceptionMatch: true,
    };
  }

  // =========================================================================
  // ШАГ 2: ПРОВЕРКА ПО СЕКРЕТНОМУ ПРОПУСКНОМУ IFF-ШИФРУ ТРАНСПОНДЕРА
  // =========================================================================
  if (
    targetTransponderCode &&
    exceptions.secretTransponderPassCode &&
    targetTransponderCode.trim().toLowerCase() === exceptions.secretTransponderPassCode.trim().toLowerCase()
  ) {
    return {
      isFriend: true,
      shouldEngage: false,
      labelRu: `СВОЙ : IFF-ПРОПУСК [${targetTransponderCode}]`,
      threatLevel: 'FRIENDLY',
      reasonRu: 'Подтверждён защищённый транспондерный шифр доступа к сектору/базе.',
      matchedRuleRu: 'Транспондерный шифр IFF',
      isExceptionMatch: true,
    };
  }

  // =========================================================================
  // ШАГ 3: ПРОВЕРКА ПЕРСОНАЛЬНЫХ КОРАБЛЕЙ В БЕЛОМ СПИСКЕ
  // =========================================================================
  if (
    targetShipCallsign &&
    exceptions.individualShipsWhitelist.some(
      (s) => s.toLowerCase() === targetShipCallsign.toLowerCase()
    )
  ) {
    return {
      isFriend: true,
      shouldEngage: false,
      labelRu: `СВОЙ : ДОВЕРЕННОЕ СУДНО [${targetShipCallsign}]`,
      threatLevel: 'FRIENDLY',
      reasonRu: 'Внесён в персональный реестр доверенных кораблей владельца.',
      matchedRuleRu: 'Персональный белый список судов',
      isExceptionMatch: true,
    };
  }

  // =========================================================================
  // ШАГ 4: КЛЮЧЕВАЯ ПРОВЕРКА ИСКЛЮЧЕНИЙ «КРОМЕ» (КЛАН И ЕГО НОМЕР):
  // «Включён фильтр пираты, а КРОМЕ: члены пиратского клана #77 (они пираты, но они СВОИ!)»
  // =========================================================================
  if (targetClanName || targetClanNumber) {
    const matchedEntry = exceptions.clansWhitelist.find((entry) => {
      // 1. Совпадение по номеру клана (напр. #77)
      if (
        targetClanNumber &&
        entry.clanNumber &&
        targetClanNumber.trim().toLowerCase() === entry.clanNumber.trim().toLowerCase()
      ) {
        return true;
      }
      // 2. Совпадение по названию клана
      if (
        targetClanName &&
        entry.clanName &&
        (targetClanName.toLowerCase().includes(entry.clanName.toLowerCase()) ||
          entry.clanName.toLowerCase().includes(targetClanName.toLowerCase()))
      ) {
        return true;
      }
      return false;
    });

    if (matchedEntry) {
      // Это совпадение по клану исключения!
      const isPirateOrMarauder = targetKind === 'PIRATE' || targetKind === 'MARAUDER';

      if (isPirateOrMarauder) {
        // Если объект — пират, проверяем флаг allowPiratesOfThisClan:
        if (matchedEntry.allowPiratesOfThisClan) {
          return {
            isFriend: true,
            shouldEngage: false,
            labelRu: `СВОЙ : ПИРАТСКИЙ КЛАН «${matchedEntry.clanName} ${matchedEntry.clanNumber}» (ИСКЛЮЧЕНИЕ «КРОМЕ»)`,
            threatLevel: 'FRIENDLY',
            reasonRu: `Сработало правило исключений «КРОМЕ»: хотя объект имеет галактический статус пирата, он является соклановцем нашей базы (Клан ${matchedEntry.clanNumber}). Доступ разрешён без ограничений!`,
            matchedRuleRu: `Исключение «КРОМЕ»: Пиратский клан ${matchedEntry.clanNumber}`,
            isExceptionMatch: true,
          };
        } else {
          // Если флаг НЕ включён, то соклановцы-пираты не защищены этим исключением
          return {
            isFriend: false,
            shouldEngage: true,
            labelRu: `ЧУЖОЙ : ПИРАТ ИЗ КЛАНА ${matchedEntry.clanNumber} (ПИРАТСТВО ЗАПРЕЩЕНО)`,
            threatLevel: 'HOSTILE',
            reasonRu: `Для клана ${matchedEntry.clanNumber} не включено разрешение пиратских действий в секторе. Сработал фильтр [ПИРАТЫ].`,
            matchedRuleRu: 'Фильтр [ПИРАТЫ] (исключение пиратства выключено)',
            isExceptionMatch: false,
          };
        }
      }

      // Не пират (мирный соклановец, добытчик, торговец своего клана)
      return {
        isFriend: true,
        shouldEngage: false,
        labelRu: `СВОЙ : СОЮЗНЫЙ КЛАН «${matchedEntry.clanName} ${matchedEntry.clanNumber}»`,
        threatLevel: 'FRIENDLY',
        reasonRu: `Объект принадлежит к авторизованному союзному клану ${matchedEntry.clanNumber} из списка исключений «КРОМЕ».`,
        matchedRuleRu: `Исключение «КРОМЕ»: Клан ${matchedEntry.clanNumber}`,
        isExceptionMatch: true,
      };
    }
  }

  // =========================================================================
  // ШАГ 5: СТАНДАРТНЫЕ ФИЛЬТРЫ УГРОЗ (ЕСЛИ ЦЕЛЬ НЕ ПОПАЛА В ИСКЛЮЧЕНИЯ «КРОМЕ»)
  // =========================================================================

  // 1. Фильтр: Карательные дроны диктатора
  if (filters.filterDictatorDrones && targetKind === 'DICTATOR_DRONE') {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: 'ЧУЖОЙ : КАРАТЕЛЬНЫЙ ДРОН ДИКТАТОРА',
      threatLevel: 'HOSTILE',
      reasonRu: 'Сработал фильтр [КАРАТЕЛЬНЫЕ ДРОНЫ]: немедленный перехват и ликвидация угрозы сектору.',
      matchedRuleRu: 'Фильтр: Карательные дроны диктатора',
    };
  }

  // 2. Фильтр: Пираты (не вошедшие в список исключений «КРОМЕ»)
  if (filters.filterPirates && targetKind === 'PIRATE') {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: `ЧУЖОЙ : ЧУЖОЙ ПИРАТСКИЙ РЕЙДЕР ${targetClanNumber ? `[${targetClanNumber}]` : ''}`,
      threatLevel: 'HOSTILE',
      reasonRu: `Сработал фильтр [ПИРАТЫ]: чужой пират не входит в список исключений «КРОМЕ» нашей базы! Огонь на поражение для защиты периметра от несанкционированного грабежа.`,
      matchedRuleRu: 'Фильтр: Пираты (вне исключений)',
    };
  }

  // 3. Фильтр: Мародёры и расхитители
  if (filters.filterMarauders && targetKind === 'MARAUDER') {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: 'ЧУЖОЙ : МАРОДЁР-КОНТРАБАНДИСТ',
      threatLevel: 'HOSTILE',
      reasonRu: 'Сработал фильтр [МАРОДЁРЫ]: пресечение несанкционированного расхищения ресурсов и ценных руд.',
      matchedRuleRu: 'Фильтр: Мародёры и контрабандисты',
    };
  }

  // 4. Фильтр: Чужие военные корабли и наёмники
  if (filters.filterForeignMilitary && targetKind === 'MILITARY') {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: 'ЧУЖОЙ : ВОЕННОЕ СУДНО / НАЁМНИК',
      threatLevel: 'HOSTILE',
      reasonRu: 'Сработал фильтр [ВОЕННЫЕ СУДА]: вооружённое вторжение в зону влияния базы.',
      matchedRuleRu: 'Фильтр: Военные корабли',
    };
  }

  // 5. Фильтр: Тотальная бесполётная зона базы (Airspace Lock)
  if (filters.filterAllStrangers) {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: 'ЧУЖОЙ : НАРУШИТЕЛЬ БЕСПОЛЁТНОЙ ЗОНЫ БАЗЫ',
      threatLevel: 'HOSTILE',
      reasonRu: 'Сработал фильтр [ТОТАЛЬНАЯ БЕСПОЛЁТНАЯ ЗОНА]: цель отсутствует в списке исключений «КРОМЕ».',
      matchedRuleRu: 'Фильтр: Тотальная бесполётная зона базы',
    };
  }

  // 6. Фильтр: Отрицательная карма (Karma < 0)
  if (filters.filterNegativeKarma && targetKarma < 0) {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: `ЧУЖОЙ : НАРУШИТЕЛЬ ПРАВОПОРЯДКА (КАРМА ${targetKarma})`,
      threatLevel: 'HOSTILE',
      reasonRu: `Сработал фильтр [ОТРИЦАТЕЛЬНАЯ КАРМА]: преступный статус судна в системе. Доступ запрещён.`,
      matchedRuleRu: 'Фильтр: Отрицательная карма',
    };
  }

  // 7. Фильтр: Суда без пропуска IFF
  if (filters.filterUnregisteredPass) {
    return {
      isFriend: false,
      shouldEngage: true,
      labelRu: 'ЧУЖОЙ : СУДНО БЕЗ ЗАРЕГИСТРИРОВАННОГО IFF-ПРОПУСКА',
      threatLevel: 'HOSTILE',
      reasonRu: 'Сработал фильтр [ОТСУТСТВИЕ ПРОПУСКА]: транспондерный шифр не подтверждён.',
      matchedRuleRu: 'Фильтр: Отсутствие IFF-пропуска',
    };
  }

  // =========================================================================
  // ШАГ 6: МИРНЫЕ ТОРГОВЦЫ И ЧЕЛНОКИ
  // =========================================================================
  if (targetKind === 'TRADER' || targetKind === 'SHUTTLE') {
    if (exceptions.allowNeutralTraders) {
      return {
        isFriend: true,
        shouldEngage: false,
        labelRu: 'НЕЙТРАЛ : МИРНЫЙ ТОРГОВЫЙ ЧЕЛНОК',
        threatLevel: 'NEUTRAL',
        reasonRu: 'Легитимный гражданский транспорт. Разрешён транзит через сектор.',
        matchedRuleRu: 'Разрешение нейтральной торговли',
      };
    } else {
      return {
        isFriend: false,
        shouldEngage: true,
        labelRu: 'ЧУЖОЙ : НЕАВТОРИЗОВАННЫЙ ТОРГОВЕЦ',
        threatLevel: 'WARNING',
        reasonRu: 'Регламентом зоны влияния базы запрещён транзит сторонних торговых челноков.',
        matchedRuleRu: 'Запрет нейтральной торговли',
      };
    }
  }

  // =========================================================================
  // ШАГ 7: ПО УМОЛЧАНИЮ — ПАССИВНОЕ НАБЛЮДЕНИЕ
  // =========================================================================
  return {
    isFriend: true,
    shouldEngage: false,
    labelRu: 'НЕЙТРАЛ / СВОЙ',
    threatLevel: 'NEUTRAL',
    reasonRu: 'Цель не нарушает фильтры угроз зоны влияния. Наблюдение в пассивном режиме.',
    matchedRuleRu: 'Пассивный режим',
  };
}

/**
 * Описания предустановленных дислокаций для Часового в звёздной системе
 */
export const SENTINEL_DEPLOYMENT_LOCATIONS_META: Record<
  SentinelDeploymentLocationType,
  {
    id: SentinelDeploymentLocationType;
    titleRu: string;
    icon: string;
    descriptionRu: string;
    defaultCoords: { x: number; y: number; z: number };
    approxStarDistUnits: number;
    tacticalAdvantageRu: string;
  }
> = {
  STARGATE_PERIMETER: {
    id: 'STARGATE_PERIMETER',
    titleRu: 'У Звёздных Врат',
    icon: '⛩️',
    descriptionRu: 'Периметр Мегаструктуры Звёздных Врат (орбита 12 000 ед. в противофазе). Контроль прибытия из гиперпространства.',
    defaultCoords: { x: 0, y: -35, z: 12000 },
    approxStarDistUnits: 12000,
    tacticalAdvantageRu: 'Перехват чужих кораблей сразу на выходе из червоточины Врат.',
  },
  CENTRAL_STAR_PROXIMITY: {
    id: 'CENTRAL_STAR_PROXIMITY',
    titleRu: 'У Центральной Звезды',
    icon: '☀️',
    descriptionRu: 'Ближняя орбита светила (2 200 ед.). Максимальный поток фотонов и гамма-квантов.',
    defaultCoords: { x: 0, y: 15, z: 2200 },
    approxStarDistUnits: 2200,
    tacticalAdvantageRu: 'Сверхбыстрая зарядка накопителя (в 4 раза быстрее!) и контроль центра системы.',
  },
  OWNED_PLANET_ORBIT: {
    id: 'OWNED_PLANET_ORBIT',
    titleRu: 'У своей Планеты',
    icon: '🪐',
    descriptionRu: 'Орбита защищаемой планеты (III Земля или освобождённый мир клана).',
    defaultCoords: { x: 0, y: -20, z: 18000 },
    approxStarDistUnits: 18000,
    tacticalAdvantageRu: 'Охрана рудников, логистических челноков и планетарных поселений.',
  },
  ASTEROID_BELT_MINEFIELD: {
    id: 'ASTEROID_BELT_MINEFIELD',
    titleRu: 'В Астероидном Поясе',
    icon: '☄️',
    descriptionRu: 'Кольцо астероидов (26 800 ед.). Прикрытие добывающих кораблей и ценных жил руд.',
    defaultCoords: { x: 8200, y: 25, z: 26800 },
    approxStarDistUnits: 26800,
    tacticalAdvantageRu: 'Защита добычи Платины, Золота и Критического вещества Ω-γ от рейдеров.',
  },
  CURRENT_SHIP_POSITION: {
    id: 'CURRENT_SHIP_POSITION',
    titleRu: 'В Текущей Точке Корабля',
    icon: '📍',
    descriptionRu: 'Фиксация прямо в координатах вашего судна в точке Лагранжа (развернуть здесь).',
    defaultCoords: { x: 0, y: 0, z: 8000 },
    approxStarDistUnits: 8000,
    tacticalAdvantageRu: 'Мгновенное развёртывание огневой точки прикрытия прямо на месте боя.',
  },
  CUSTOM_COORDINATES: {
    id: 'CUSTOM_COORDINATES',
    titleRu: 'Произвольные Координаты',
    icon: '🎯',
    descriptionRu: 'Ручной ввод координат X, Y, Z в метрике пространства системы.',
    defaultCoords: { x: 5000, y: 0, z: 15000 },
    approxStarDistUnits: 15000,
    tacticalAdvantageRu: 'Точная тактическая расстановка дозорной сети владельца системы.',
  },
};

/**
 * Создаёт нового часового в указанной локации системы
 */
export function createSentinelAtLocation(
  locationType: SentinelDeploymentLocationType,
  systemKeyOrStarName = 'Солнце (G2 V)',
  customCoords?: { x: number; y: number; z: number },
  sentinelIndex = 1,
  ownerName = 'Командир'
): SentinelPlatformTelemetry {
  const meta = SENTINEL_DEPLOYMENT_LOCATIONS_META[locationType];
  const coords = customCoords || { ...meta.defaultCoords };
  const starDist = Math.max(1000, Math.round(Math.hypot(coords.x, coords.y, coords.z)));
  const starProf = getStarRadiationProfile(systemKeyOrStarName);
  
  const baseWatts = 1361;
  const distRatio = Math.max(0.1, Math.min(3.0, 15000 / starDist));
  const solarFlux = Math.round(baseWatts * starProf.totalRadCoeff * Math.pow(distRatio, 1.2));
  
  // Назначаем модификацию лопастей ветряной мельницы (4, 6 или 8 лопастей)
  const bladePresets: SentinelBladeModification[] = [4, 6, 8, 6];
  const chosenBlades: SentinelBladeModification = bladePresets[(sentinelIndex - 1) % bladePresets.length];
  const bladeSpec = SENTINEL_BLADE_MODS_META[chosenBlades];

  const incomingGeu = Math.max(
    3.0,
    Math.round(18 * starProf.totalRadCoeff * distRatio * bladeSpec.rechargeMultiplier * 0.96 * 10) / 10
  );
  const standbyDrain = 2.5;
  const netFlow = Math.round((incomingGeu - standbyDrain) * 10) / 10;
  const capGeu = 5000;
  const initialCharge = 4200;
  const timeToFull = netFlow > 0 ? Math.round((capGeu - initialCharge) / netFlow) : 9999;

  const strikePresets: SentinelStrikePowerMode[] = [
    'LIGHT_PULSE',
    'MEDIUM_QUASAR',
    'HEAVY_GAMMA_HAMMER',
    'OVERCHARGE_SHOCKWAVE',
  ];
  const chosenStrike = strikePresets[(sentinelIndex - 1) % strikePresets.length];

  // Выбираем пресет зоны влияния в зависимости от дислокации
  let presetId: SentinelZoneInfluencePreset = 'SOVEREIGN_SYSTEM_DEFENSE';
  if (locationType === 'ASTEROID_BELT_MINEFIELD') {
    presetId = 'CLAN_ASTEROID_MINING';
  } else if (locationType === 'STARGATE_PERIMETER') {
    presetId = 'STARGATE_CUSTOMS_BORDER';
  } else if (sentinelIndex === 2) {
    presetId = 'PIRATE_BASE_OUTPOST';
  }

  const presetMeta = SENTINEL_ZONE_PRESETS_META[presetId];
  const targetFilters = { ...presetMeta.targetFilters };
  const exceptionsConfig = presetMeta.buildExceptions(ownerName);

  return {
    id: `SENTINEL-S9-#${sentinelIndex}`,
    name: `Часовой-Ω${sentinelIndex} [${meta.titleRu.toUpperCase()}]`,
    sectorName: starProf.systemOriginName || 'Солнечная система',
    deployed: true,
    statusRu: `БОЕВОЙ ДОЗОР · ${meta.titleRu.toUpperCase()}`,
    locationType,
    locationLabelRu: meta.titleRu,
    worldPos: coords,
    targetScanRadiusUnits: 8000,
    zoneInfluencePreset: presetId,
    targetThreatFilters: targetFilters,
    exceptionsConfig: exceptionsConfig,
    iffProtocol: 'PIRATES_AND_DRONES_ONLY',
    authorizedOwnerCallsign: ownerName,
    whitelistClans: exceptionsConfig.clansWhitelist.map((c) => `${c.clanName} ${c.clanNumber}`),
    iffPassCode: exceptionsConfig.secretTransponderPassCode,
    allowNeutralTraders: exceptionsConfig.allowNeutralTraders,
    propulsionUnitInstalled: false,
    engineThrustKiloNewtons: 0,
    propellantMassKg: 0,
    dryMassTons: bladeSpec.dryMassTons,
    attitudeControl: 'Прецизионные микрогиродины ориентации 18 Вт (3 оси)',
    positionFixation: `Фиксация Лагранжа: ${meta.titleRu}`,
    bladeModification: chosenBlades,
    bladeCount: chosenBlades,
    chargeRateMultiplier: bladeSpec.rechargeMultiplier,
    bladeModelTitleRu: bladeSpec.titleRu,
    converterSurfaceAreaSqM: bladeSpec.surfaceAreaSqM,
    converterEfficiencyPct: 96.4,
    solarFluxWattsPerSqM: solarFlux,
    energyRechargeRateGeuPerSec: incomingGeu,
    energyRechargeRateGeuPerMin: Math.round(incomingGeu * 60),
    starDistanceUnits: starDist,
    currentStarProfile: starProf,
    batteryChargeGeu: initialCharge,
    batteryCapacityGeu: capGeu,
    batteryPercent: Math.round((initialCharge / capGeu) * 100),
    standbyDrainGeuPerSec: standbyDrain,
    netEnergyFlowGeuPerSec: netFlow,
    secondsToFullCharge: timeToFull,
    strikeMode: chosenStrike,
    engagementDirective: 'DETER_AND_DESTROY',
    aiMode: 'AUTO_DEFENSE',
    cooldownRemainingSeconds: 0,
    totalShotsFired: 0,
    totalDamageDealtKg: 0,
    targetsInterceptedCount: 0,
    lastShotTimestampMs: 0,
    eventLog: [
      {
        id: `ev-init-${Date.now()}`,
        timestamp: '12:00:00',
        category: 'IFF',
        message: `Развёрнут Часовой #${sentinelIndex} [${bladeSpec.codeName} (${chosenBlades} лопастей)] в локации «${meta.titleRu}». Активирована зона влияния: [${presetMeta.badgeRu}]. Директива: [СТАНДАРТ: ОТПУГНУТЬ И УНИЧТОЖИТЬ].`,
      },
      {
        id: `ev-solar-${Date.now()}`,
        timestamp: '12:00:01',
        category: 'SOLAR',
        message: `Мельничные панели ${bladeSpec.surfaceAreaSqM} м² (${chosenBlades} лопастей, ускорение ${bladeSpec.rechargeMultiplier}x) ориентированы на ${starProf.matchedName}. Приток: +${incomingGeu} ГЭУ/с.`,
      },
    ],
  };
}

/**
 * Создаёт начальную сеть часовых владельца системы по умолчанию
 */
export function createDefaultSentinelNetwork(
  systemKeyOrStarName = 'Солнце (G2 V)',
  ownerName = 'Командир'
): SentinelPlatformTelemetry[] {
  return [
    createSentinelAtLocation('STARGATE_PERIMETER', systemKeyOrStarName, undefined, 1, ownerName),
    createSentinelAtLocation('CENTRAL_STAR_PROXIMITY', systemKeyOrStarName, undefined, 2, ownerName),
    createSentinelAtLocation('OWNED_PLANET_ORBIT', systemKeyOrStarName, undefined, 3, ownerName),
    createSentinelAtLocation('ASTEROID_BELT_MINEFIELD', systemKeyOrStarName, undefined, 4, ownerName),
  ];
}

/**
 * Создаёт одиночного часового (для обратной совместимости)
 */
export function createDefaultSentinelTelemetry(
  systemKeyOrStarName = 'Солнце (G2 V)',
  starDistUnits = 12000
): SentinelPlatformTelemetry {
  return createSentinelAtLocation('STARGATE_PERIMETER', systemKeyOrStarName, { x: 0, y: -35, z: starDistUnits }, 1);
}

/**
 * Динамически определяет силу удара орудия в зависимости от боевой директивы и дистанции до цели:
 * 1. «ОТПУГНУТЬ И УНИЧТОЖИТЬ» (СТАНДАРТНЫЙ РЕЖИМ):
 *    - Дальняя дистанция (> 5500 м): Предупредительный выстрел [Игла 35 кг] для отпугивания цели.
 *    - Средняя дистанция (3000–5500 м): Сдерживающий огонь [Квазар 125 кг] для пробития щитов.
 *    - Ближняя дистанция (1200–3000 м): Тяжёлое поражение корпуса [Гамма-молот 380 кг].
 *    - В упор (< 1200 м): Сверхкритический [Оверчардж 1 100 кг] на полное уничтожение!
 * 2. «ТОЛЬКО УНИЧТОЖИТЬ» (РЕЖИМ ЗАСАДЫ / ЛОВУШКИ):
 *    - Никакого отпугивания и предупреждений! Скрытность до входа в зону поражения.
 *    - Как только цель вошла в периметр — сразу сокрушительный удар максимальной мощности со всех сторон!
 */
export function resolveEngagementStrikeMode(
  directive: SentinelEngagementDirective,
  distanceUnits: number,
  batteryChargeGeu: number,
  forcedMode?: SentinelStrikePowerMode
): DynamicStrikeResolution {
  if (forcedMode) {
    const spec = SENTINEL_STRIKE_MODES[forcedMode];
    return {
      strikeMode: forcedMode,
      phaseTitleRu: `РУЧНОЙ ВЫБОР [${spec.codeName}]`,
      isWarningShot: false,
      distanceLabelRu: `${Math.round(distanceUnits)} м`,
      descriptionRu: spec.descriptionRu,
      beamColorHex: spec.beamColorHex,
    };
  }

  if (directive === 'DETER_AND_DESTROY') {
    // Режим «Отпугнуть и уничтожить»: сила орудий включается по мере приближения!
    if (distanceUnits > 5500) {
      const spec = SENTINEL_STRIKE_MODES.LIGHT_PULSE;
      return {
        strikeMode: 'LIGHT_PULSE',
        phaseTitleRu: 'СТУПЕНЬ I : ПРЕДУПРЕЖДЕНИЕ И ОТПУГИВАНИЕ (ДАЛЬНЯЯ ЗОНА)',
        isWarningShot: true,
        distanceLabelRu: `${Math.round(distanceUnits)} м (дальний сектор)`,
        descriptionRu:
          'Предупредительный выстрел пониженной мощности [Игла 35 кг]. Нарушителю посылается импульс на отпугивание и разворот курса.',
        beamColorHex: spec.beamColorHex,
      };
    } else if (distanceUnits > 3000) {
      const spec = SENTINEL_STRIKE_MODES.MEDIUM_QUASAR;
      return {
        strikeMode: 'MEDIUM_QUASAR',
        phaseTitleRu: 'СТУПЕНЬ II : ПРИНУДИТЕЛЬНОЕ СДЕРЖИВАНИЕ (СРЕДНЯЯ ЗОНА)',
        isWarningShot: false,
        distanceLabelRu: `${Math.round(distanceUnits)} м (средний сектор)`,
        descriptionRu:
          'Сдерживающий огонь [Квазар 125 кг]. Сбитие щитов цели и принудительное торможение нарушителя.',
        beamColorHex: spec.beamColorHex,
      };
    } else if (distanceUnits > 1200) {
      const spec = SENTINEL_STRIKE_MODES.HEAVY_GAMMA_HAMMER;
      return {
        strikeMode: 'HEAVY_GAMMA_HAMMER',
        phaseTitleRu: 'СТУПЕНЬ III : ОГОНЬ НА ПОРАЖЕНИЕ БРОНЕКОРПУСА (БЛИЖНЯЯ ЗОНА)',
        isWarningShot: false,
        distanceLabelRu: `${Math.round(distanceUnits)} м (ближний сектор)`,
        descriptionRu:
          'Тяжёлый коллимированный пучок гамма-квантов [Гамма-молот 380 кг]. Разрушение бронеплит корпуса цели.',
        beamColorHex: spec.beamColorHex,
      };
    } else {
      // Дистанция < 1200 м (в упор)
      const canOvercharge = batteryChargeGeu >= SENTINEL_STRIKE_MODES.OVERCHARGE_SHOCKWAVE.energyCostGeu;
      const targetMode: SentinelStrikePowerMode = canOvercharge ? 'OVERCHARGE_SHOCKWAVE' : 'HEAVY_GAMMA_HAMMER';
      const spec = SENTINEL_STRIKE_MODES[targetMode];
      return {
        strikeMode: targetMode,
        phaseTitleRu: 'СТУПЕНЬ IV : УЛЬТИМАТИВНЫЙ ОВЕРЧАРДЖ В УПОР (КРИТИЧЕСКИЙ ПЕРИМЕТР)',
        isWarningShot: false,
        distanceLabelRu: `${Math.round(distanceUnits)} м (в упор!)`,
        descriptionRu:
          'Сверхкритический сброс накопителя [Оверчардж 1 100 кг]. Катастрофический гравитационно-фотонный удар на полное уничтожение!',
        beamColorHex: spec.beamColorHex,
      };
    }
  } else if (directive === 'VOLUMETRIC_ENGINE_SUPPRESSION') {
    // Режим «Объёмное торможение двигателя» — СТРЕЛЬБА ИСКЛЮЧЕНА!
    // Платформы генерируют гравитационно-магнитный захват, гасящий тягу двигателей в тоннах.
    return {
      strikeMode: 'LIGHT_PULSE',
      phaseTitleRu: 'ТОРМОЗ ДВИГАТЕЛЯ : СТРЕЛЬБА ИСКЛЮЧЕНА (СИЛОВОЕ ПОЛЕ ЗАХВАТА)',
      isWarningShot: false,
      distanceLabelRu: `${Math.round(distanceUnits)} м`,
      descriptionRu:
        'Орудия отключены. Платформы генерируют объёмный контур торможения двигателя: гашение тяги (кН) и скорости корабля в тоннах!',
      beamColorHex: '#06b6d4',
    };
  } else {
    // Режим «Только уничтожить»: засада! Без предупредительного огня — сразу максимальный сокрушительный удар!
    if (batteryChargeGeu >= SENTINEL_STRIKE_MODES.OVERCHARGE_SHOCKWAVE.energyCostGeu && distanceUnits <= 2500) {
      const spec = SENTINEL_STRIKE_MODES.OVERCHARGE_SHOCKWAVE;
      return {
        strikeMode: 'OVERCHARGE_SHOCKWAVE',
        phaseTitleRu: 'ЗАСАДА : ВНЕЗАПНЫЙ АННИГИЛЯЦИОННЫЙ ЗАЛП ОВЕРЧАРДЖА (БЕЗ ПРЕДУПРЕЖДЕНИЯ)',
        isWarningShot: false,
        distanceLabelRu: `${Math.round(distanceUnits)} м (зона ловушки)`,
        descriptionRu:
          'Внезапный ультимативный сброс энергии из засады! Цель уничтожается с одного удара без шанса отступить.',
        beamColorHex: spec.beamColorHex,
      };
    } else if (batteryChargeGeu >= SENTINEL_STRIKE_MODES.HEAVY_GAMMA_HAMMER.energyCostGeu) {
      const spec = SENTINEL_STRIKE_MODES.HEAVY_GAMMA_HAMMER;
      return {
        strikeMode: 'HEAVY_GAMMA_HAMMER',
        phaseTitleRu: 'ЗАСАДА : МГНОВЕННЫЙ СОКРУШИТЕЛЬНЫЙ УДАР (ГАММА-МОЛОТ)',
        isWarningShot: false,
        distanceLabelRu: `${Math.round(distanceUnits)} м (внутри облака)`,
        descriptionRu:
          'Скрытная огневая точка открывает огонь на поражение без предупредительных выстрелов!',
        beamColorHex: spec.beamColorHex,
      };
    } else {
      const spec = SENTINEL_STRIKE_MODES.MEDIUM_QUASAR;
      return {
        strikeMode: 'MEDIUM_QUASAR',
        phaseTitleRu: 'ЗАСАДА : БЫСТРЫЙ РАЗРЯД ЛОВУШКИ (КВАЗАР)',
        isWarningShot: false,
        distanceLabelRu: `${Math.round(distanceUnits)} м (внутри облака)`,
        descriptionRu: 'Фокусированный залп на пробитие без выдачи позиции слабыми импульсами.',
        beamColorHex: spec.beamColorHex,
      };
    }
  }
}

/**
 * Создаёт тактическое «ОБЛАКО ЧАСОВЫХ» (Sentinel Swarm Cluster Trap) —
 * кольцо/группу из 3–7 боевых платформ в заданной локации или вокруг корабля игрока.
 * Нарушитель/преследователь заманивается в центр облака, где по нему открывается
 * одновременный огонь со всех сторон!
 */
export function createSentinelSwarmCloud(
  locationType: SentinelDeploymentLocationType,
  systemKeyOrStarName = 'Солнце (G2 V)',
  centerCoords?: { x: number; y: number; z: number },
  nodesCount = 5,
  clusterName = '«Смертельный мешок корсаров»',
  directive: SentinelEngagementDirective = 'DESTROY_ONLY',
  ownerName = 'Командир',
  startSentinelIndex = 10
): SentinelPlatformTelemetry[] {
  const meta = SENTINEL_DEPLOYMENT_LOCATIONS_META[locationType];
  const center = centerCoords || { ...meta.defaultCoords };
  const clusterId = `SWARM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const spreadRadiusUnits = 950; // Радиус кольца ловушки вокруг центра
  const newNodes: SentinelPlatformTelemetry[] = [];

  for (let i = 0; i < nodesCount; i++) {
    const angleDeg = Math.round((i * 360) / nodesCount);
    const angleRad = (angleDeg * Math.PI) / 180;
    // Размещение на окружности с небольшим вертикальным разбросом по Y для трёхмерного охвата
    const nodeCoords = {
      x: Math.round(center.x + spreadRadiusUnits * Math.cos(angleRad)),
      y: Math.round(center.y + (i % 2 === 0 ? 45 : -45)),
      z: Math.round(center.z + spreadRadiusUnits * Math.sin(angleRad)),
    };

    const sIndex = startSentinelIndex + i;
    const baseNode = createSentinelAtLocation(
      locationType,
      systemKeyOrStarName,
      nodeCoords,
      sIndex,
      ownerName
    );

    // Конфигурируем платформу как узел облака засады
    const roleRu = `Вектор ${angleDeg}° [${i + 1}/${nodesCount}]`;
    const configuredNode: SentinelPlatformTelemetry = {
      ...baseNode,
      id: `SWARM-NODE-#${sIndex}`,
      name: `Часовой-Ω${sIndex} (Облако · ${roleRu})`,
      statusRu:
        directive === 'DESTROY_ONLY'
          ? `ЗАСАДА 360° · ОБЛАКО «${clusterName}»`
          : `ОБЛАКО ДОЗОРА · ${clusterName}`,
      engagementDirective: directive,
      swarmClusterId: clusterId,
      swarmClusterName: clusterName,
      swarmVectorAngleDeg: angleDeg,
      swarmPlatformIndex: i + 1,
      swarmTotalNodes: nodesCount,
      eventLog: [
        {
          id: `ev-swarm-${Date.now()}-${i}`,
          timestamp: '12:00:00',
          category: 'IFF',
          message: `Развёрнут в составе ОБЛАКА ЧАСОВЫХ «${clusterName}» [Вектор ${angleDeg}°, узел ${i + 1}/${nodesCount}]. Боевая директива: [${SENTINEL_ENGAGEMENT_DIRECTIVES_META[directive].badgeRu}]. Зона поражения активирована!`,
        },
        ...baseNode.eventLog,
      ],
    };

    newNodes.push(configuredNode);
  }

  return newNodes;
}

/**
 * Выполняет скоординированный перекрёстный залп всего облака часовых со всех сторон («МОЧАТ СО ВСЕХ СТОРОН»):
 * Все готовые платформы облака одновременно наносят удар по попавшему в ловушку преследователю.
 */
export function executeSwarmAmbushCrossfire(
  network: SentinelPlatformTelemetry[],
  clusterId: string,
  targetName = 'Преследователь в ловушке',
  targetDistanceUnits = 850,
  forcedDirective?: SentinelEngagementDirective
): {
  updatedNetwork: SentinelPlatformTelemetry[];
  result: SwarmCrossfireResult;
} {
  const swarmNodes = network.filter((s) => s.swarmClusterId === clusterId);
  const clusterName = swarmNodes[0]?.swarmClusterName || '«Смертельный мешок»';
  const directive = forcedDirective || swarmNodes[0]?.engagementDirective || 'DESTROY_ONLY';

  let totalDamageKg = 0;
  let totalDamageUnits = 0;
  let totalEnergySpent = 0;
  const platformReports: SwarmCrossfireReport[] = [];
  const updatedNodesMap = new Map<string, SentinelPlatformTelemetry>();

  for (const node of swarmNodes) {
    // Определяем режим удара для данного узла
    const resolution = resolveEngagementStrikeMode(
      directive,
      targetDistanceUnits,
      node.batteryChargeGeu,
      undefined
    );
    const spec = SENTINEL_STRIKE_MODES[resolution.strikeMode];

    // Проверяем, готов ли узел стрелять
    if (node.batteryChargeGeu >= spec.energyCostGeu && node.cooldownRemainingSeconds <= 0) {
      const remainingBattery = Math.max(0, node.batteryChargeGeu - spec.energyCostGeu);
      const angle = node.swarmVectorAngleDeg ?? 0;
      totalDamageKg += spec.massEquivalentKg;
      totalDamageUnits += spec.damageUnits;
      totalEnergySpent += spec.energyCostGeu;

      platformReports.push({
        sentinelId: node.id,
        platformName: node.name,
        angleDeg: angle,
        strikeMode: resolution.strikeMode,
        damageKg: spec.massEquivalentKg,
        energyCostGeu: spec.energyCostGeu,
        beamColorHex: spec.beamColorHex,
      });

      const updatedNode: SentinelPlatformTelemetry = {
        ...node,
        batteryChargeGeu: Math.round(remainingBattery * 10) / 10,
        batteryPercent: Math.round((remainingBattery / node.batteryCapacityGeu) * 100),
        cooldownRemainingSeconds: spec.cooldownSeconds,
        totalShotsFired: node.totalShotsFired + 1,
        totalDamageDealtKg: node.totalDamageDealtKg + spec.massEquivalentKg,
        targetsInterceptedCount: node.targetsInterceptedCount + 1,
        lastShotTimestampMs: Date.now(),
        lastTargetName: targetName,
        lastEngagedIffClassification: `ОБЛАКО-ЗАСАДА [Вектор ${angle}°]`,
        eventLog: [
          {
            id: `ev-crossfire-${Date.now()}-${node.id}`,
            timestamp: new Date().toTimeString().split(' ')[0] || '12:00:00',
            category: 'FIRE',
            message: `ПЕРЕКРЁСТНЫЙ ЗАЛП ОБЛАКА [Вектор ${angle}°]: залп ${spec.codeName} (урон: ${spec.massEquivalentKg} кг). Цель: «${targetName}» в кольце ловушки!`,
          },
          ...node.eventLog.slice(0, 39),
        ],
      };
      updatedNodesMap.set(node.id, updatedNode);
    }
  }

  const updatedNetwork = network.map((s) => updatedNodesMap.get(s.id) || s);
  const isSurrounded = platformReports.length >= 3;

  const summaryMessageRu =
    platformReports.length > 0
      ? `💥 ОБЛАКО ЧАСОВЫХ «${clusterName}»: ${platformReports.length} ПЛАТФОРМ ОТКРЫЛИ СИНХРОННЫЙ ОГОНЬ СО ВСЕХ СТОРОН! СУММАРНЫЙ ЗАЛП: ${totalDamageKg} КГ ПО ЦЕЛИ «${targetName}»!`
      : `⚠️ Облако «${clusterName}»: орудия перезаряжаются или накапливают заряд аккумуляторов.`;

  const logSummaryRu = `Перекрёстный огонь 360°: узлов стреляло: ${platformReports.length}/${swarmNodes.length}. Урон: ${totalDamageUnits} ед. (-${totalEnergySpent} ГЭУ).`;

  return {
    updatedNetwork,
    result: {
      clusterId,
      clusterName,
      totalPlatforms: swarmNodes.length,
      firingPlatformsCount: platformReports.length,
      totalDamageUnits,
      totalDamageKg,
      totalEnergySpentGeu: totalEnergySpent,
      isAmbushTrapTriggered: true,
      isCrossfireSurrounded: isSurrounded,
      platformReports,
      summaryMessageRu,
      logSummaryRu,
    },
  };
}

/**
 * РАСЧЁТ ОБЪЁМНОГО ВОЗДЕЙСТВИЯ НА ДВИГАТЕЛЬ КОРАБЛЯ (VOLUMETRIC ENGINE SUPPRESSION):
 * • Объемная конструкция: внутри НЕ МЕНЕЕ ТРЕХ ЧАСОВЫХ (N >= 3).
 * • Когда корабль попадает в пространство между минимум 3 часовыми, силовое поле тормозит двигатель корабля,
 *   уменьшая его тягу и скорость.
 * • Сила торможения измеряется строго в единицах — ТОННАХ (дебет массы часовых).
 *   Если выстрел может быть тонна, то торможение точно соответствует массе часовых (dryMassTons = 12 т на платформу).
 * • Принцип соответствия дистанции: 100% соответствие выстрела/торможения у часовых и уменьшение силы до 0 в центре!
 *   Допустим, между часовыми 2000 единиц (диаметр 2000, радиус периметра 1000 или радиус до центра 2000).
 *   В центре между ними (distToCenter = 0) сила торможения равна 0!
 *   При приближении к часовым (на 100% дистанции соответствия) сила торможения достигает 100%.
 * • ЭТОТ РЕЖИМ ИСКЛЮЧАЕТ СТРЕЛЬБУ (shootingBlocked = true).
 */
export function calculateVolumetricEngineSuppression(
  network: SentinelPlatformTelemetry[],
  clusterId?: string,
  targetName = 'Преследователь в объёмном поле',
  targetDistToCenterUnits = 1200,
  maxPerimeterDistanceUnits = 2000
): {
  updatedNetwork: SentinelPlatformTelemetry[];
  suppression: VolumetricEngineSuppressionResult;
} {
  // Находим часовых кластера либо всех активных часовых с директивой VOLUMETRIC_ENGINE_SUPPRESSION
  let swarmNodes = clusterId
    ? network.filter((s) => s.swarmClusterId === clusterId)
    : network.filter((s) => s.engagementDirective === 'VOLUMETRIC_ENGINE_SUPPRESSION');

  if (swarmNodes.length < 3 && network.length >= 3) {
    // Если отдельный кластер не задан или мал, но в системе есть >= 3 часовых
    swarmNodes = network.slice(0, Math.min(7, network.length));
  }

  const clusterName = swarmNodes[0]?.swarmClusterName || 'Объёмная триада часовых';
  const totalNodesCount = swarmNodes.length;
  const isFieldActive = totalNodesCount >= 3;

  // Дистанция соответствия: от 0 (центр) до maxPerimeterDistanceUnits (периметр часовых)
  const clampedDistToCenter = Math.max(0, Math.min(maxPerimeterDistanceUnits, targetDistToCenterUnits));
  // В центре сила равна 0, на периметре (100% соответствия) сила равна 1.0 (100%)
  const brakingPowerRatio = isFieldActive
    ? Math.max(0, Math.min(1.0, clampedDistToCenter / maxPerimeterDistanceUnits))
    : 0;

  const nodeStatuses: VolumetricSentinelNodeStatus[] = [];
  let totalBrakingForceTons = 0;
  const updatedNodesMap = new Map<string, SentinelPlatformTelemetry>();

  for (let i = 0; i < swarmNodes.length; i++) {
    const node = swarmNodes[i];
    const angle = node.swarmVectorAngleDeg ?? Math.round((i * 360) / swarmNodes.length);
    const massTons = node.dryMassTons || 12.0;

    // Индивидуальная сила торможения в тоннах от каждого часового
    // Пропорциональна массе часового и градиенту удалённости от центра к часовому
    const indBraking = isFieldActive && node.batteryChargeGeu > 50
      ? Math.round(massTons * brakingPowerRatio * 10) / 10
      : 0;

    const drainGeu = isFieldActive && indBraking > 0 ? 15 : 0;
    const remainingBattery = Math.max(0, node.batteryChargeGeu - drainGeu);

    totalBrakingForceTons += indBraking;

    nodeStatuses.push({
      sentinelId: node.id,
      name: node.name,
      angleDeg: angle,
      massTons,
      distanceToTargetUnits: Math.round(
        Math.abs(maxPerimeterDistanceUnits - clampedDistToCenter) + 200
      ),
      individualBrakingTons: indBraking,
      energyDrainGeu: drainGeu,
      beamGlowHex: '#06b6d4',
    });

    const updatedNode: SentinelPlatformTelemetry = {
      ...node,
      engagementDirective: 'VOLUMETRIC_ENGINE_SUPPRESSION',
      batteryChargeGeu: Math.round(remainingBattery * 10) / 10,
      batteryPercent: Math.round((remainingBattery / node.batteryCapacityGeu) * 100),
      lastTargetName: targetName,
      lastEngagedIffClassification: `ОБЪЁМНЫЙ ЗАХВАТ ТЯГИ [${indBraking.toFixed(1)} т]`,
      eventLog: [
        {
          id: `ev-suppress-${Date.now()}-${node.id}`,
          timestamp: new Date().toTimeString().split(' ')[0] || '12:00:00',
          category: 'INTERCEPT',
          message: `🧲 ОБЪЁМНОЕ ПОЛЕ ТОРМОЖЕНИЯ: воздействие на двигатель «${targetName}». Сила: ${indBraking.toFixed(1)} т (тяга подавлена). Стрельба заблокирована!`,
        },
        ...node.eventLog.slice(0, 39),
      ],
    };
    updatedNodesMap.set(node.id, updatedNode);
  }

  const updatedNetwork = network.map((s) => updatedNodesMap.get(s.id) || s);

  // Снижение тяги и скорости в процентах (0..100%)
  const maxPossibleTons = swarmNodes.reduce((acc, n) => acc + (n.dryMassTons || 12.0), 0);
  const thrustReductionPercent = maxPossibleTons > 0
    ? Math.round((totalBrakingForceTons / maxPossibleTons) * 100)
    : 0;
  const speedReductionPercent = Math.min(100, Math.round(thrustReductionPercent * 0.95));

  const summaryMessageRu = !isFieldActive
    ? `⚠️ ОБЪЁМНОЕ ТОРМОЖЕНИЕ ТРЕБУЕТ НЕ МЕНЕЕ 3 ЧАСОВЫХ! В сети активно: ${totalNodesCount} платформ.`
    : clampedDistToCenter < 100
    ? `🎯 В ЦЕНТРЕ МЕЖДУ ЧАСОВЫМИ СИЛА ТОРМОЖЕНИЯ = 0 Т! (Дистанция до центра: ${Math.round(clampedDistToCenter)} из ${maxPerimeterDistanceUnits} ед.).`
    : `🧲 ОБЪЁМНОЕ ПОЛЕ АКТИВНО: ${totalNodesCount} ЧАСОВЫХ ГАСЯТ ТЯГУ ДВИГАТЕЛЯ НА ${totalBrakingForceTons.toFixed(1)} ТОНН! Скорость цели «${targetName}» падает на ${speedReductionPercent}%. СТРЕЛЬБА ИСКЛЮЧЕНА!`;

  return {
    updatedNetwork,
    suppression: {
      clusterId: clusterId || 'VOLUMETRIC-FIELD-3NODES',
      clusterName,
      totalNodes: totalNodesCount,
      activeNodesCount: nodeStatuses.filter((n) => n.individualBrakingTons > 0).length,
      targetName,
      isFieldActive,
      targetDistanceToCenterUnits: clampedDistToCenter,
      clusterPerimeterRadiusUnits: maxPerimeterDistanceUnits,
      brakingPowerRatio: Math.round(brakingPowerRatio * 100) / 100,
      totalBrakingForceTons: Math.round(totalBrakingForceTons * 10) / 10,
      thrustReductionPercent,
      speedReductionPercent,
      shootingBlocked: true, // Режим полностью исключает стрельбу
      nodes: nodeStatuses,
      summaryMessageRu,
    },
  };
}

/**
 * Рассчитывает приток энергии от солнца и обновление аккумулятора за прошедший интервал deltaSec
 * с учётом спектрального класса звезды, расстояния и модификации лопастей мельницы (4, 6 или 8 шт.)
 */
export function updateSentinelSolarAccumulator(
  st: SentinelPlatformTelemetry,
  starDistUnits: number,
  deltaSec: number
): SentinelPlatformTelemetry {
  const starProf = st.currentStarProfile;
  const effectiveDist = Math.max(800, starDistUnits);
  const distRatio = Math.max(0.1, Math.min(3.5, 15000 / effectiveDist));
  const baseWatts = 1361;
  const solarFlux = Math.round(baseWatts * starProf.totalRadCoeff * Math.pow(distRatio, 1.2));

  // Модификация лопастей: 4, 6 или 8 (влияет на приток энергии и скорость зарядки)
  const bladeMod: SentinelBladeModification = st.bladeModification || 6;
  const bladeSpec = SENTINEL_BLADE_MODS_META[bladeMod] || SENTINEL_BLADE_MODS_META[6];
  const bladeMult = bladeSpec.rechargeMultiplier;

  // Базовый приток энергии в секунду
  const baseIncomingRate = Math.max(
    2.0,
    Math.round(18 * starProf.totalRadCoeff * distRatio * (st.converterEfficiencyPct / 100) * 10) / 10
  );
  // Финальный приток энергии с учётом мельничных лопастей (1.0x для 4, 1.5x для 6, 2.0x для 8)
  const incomingRate = Math.round(baseIncomingRate * bladeMult * 10) / 10;

  const netRate = Math.round((incomingRate - st.standbyDrainGeuPerSec) * 10) / 10;
  const newCharge = Math.max(
    0,
    Math.min(st.batteryCapacityGeu, st.batteryChargeGeu + netRate * deltaSec)
  );
  const newPct = Math.round((newCharge / st.batteryCapacityGeu) * 100);
  const timeToFull = netRate > 0 ? Math.round((st.batteryCapacityGeu - newCharge) / netRate) : 9999;
  const coolRemaining = Math.max(0, st.cooldownRemainingSeconds - deltaSec);

  return {
    ...st,
    bladeModification: bladeMod,
    bladeCount: bladeMod,
    chargeRateMultiplier: bladeMult,
    bladeModelTitleRu: bladeSpec.titleRu,
    converterSurfaceAreaSqM: bladeSpec.surfaceAreaSqM,
    dryMassTons: bladeSpec.dryMassTons,
    starDistanceUnits: Math.round(effectiveDist),
    solarFluxWattsPerSqM: solarFlux,
    energyRechargeRateGeuPerSec: incomingRate,
    energyRechargeRateGeuPerMin: Math.round(incomingRate * 60),
    batteryChargeGeu: Math.round(newCharge * 10) / 10,
    batteryPercent: newPct,
    netEnergyFlowGeuPerSec: netRate,
    secondsToFullCharge: timeToFull,
    cooldownRemainingSeconds: Math.round(coolRemaining * 10) / 10,
  };
}

/**
 * Переключает / модернизирует лопасти солнечных панелей часового (4, 6 или 8 шт.),
 * изменяя скорость зарядки накопителя, площадь парусов и массу платформы.
 */
export function setSentinelBladeModification(
  st: SentinelPlatformTelemetry,
  blades: SentinelBladeModification
): SentinelPlatformTelemetry {
  const spec = SENTINEL_BLADE_MODS_META[blades];
  const oldBlades = st.bladeModification || 6;
  const changeDesc = `Модернизация лопастей: ${oldBlades} → ${blades} шт. [${spec.titleRu}]. Площадь панелей: ${spec.surfaceAreaSqM} м², множитель зарядки: ${spec.rechargeMultiplier}x, сухая масса: ${spec.dryMassTons} т.`;

  const updated: SentinelPlatformTelemetry = {
    ...st,
    bladeModification: blades,
    bladeCount: blades,
    chargeRateMultiplier: spec.rechargeMultiplier,
    bladeModelTitleRu: spec.titleRu,
    converterSurfaceAreaSqM: spec.surfaceAreaSqM,
    dryMassTons: spec.dryMassTons,
    eventLog: [
      {
        id: `ev-blade-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0] || '12:00:00',
        category: 'SOLAR',
        message: changeDesc,
      },
      ...st.eventLog.slice(0, 39),
    ],
  };

  return updateSentinelSolarAccumulator(updated, updated.starDistanceUnits, 0);
}


/**
 * Производит выстрел часового с указанной силой удара,
 * либо с автоматическим расчётом силы по дистанции и директиве («Отпугнуть и уничтожить» vs «Только уничтожить»)
 */
export function executeSentinelStrike(
  st: SentinelPlatformTelemetry,
  targetName = 'Тестовая мишень калибровки',
  customMode?: SentinelStrikePowerMode,
  iffClassification = 'ЧУЖОЙ',
  targetDistanceUnits?: number
): {
  updatedTelemetry: SentinelPlatformTelemetry;
  success: boolean;
  failReasonRu?: string;
  strikeSpec: SentinelStrikeModeSpec;
  isWarningShot?: boolean;
  directiveResolution?: DynamicStrikeResolution;
} {
  let resolution: DynamicStrikeResolution | undefined = undefined;
  let mode = customMode || st.strikeMode;

  if (targetDistanceUnits !== undefined && !customMode) {
    resolution = resolveEngagementStrikeMode(
      st.engagementDirective,
      targetDistanceUnits,
      st.batteryChargeGeu
    );
    mode = resolution.strikeMode;
  }

  const spec = SENTINEL_STRIKE_MODES[mode];

  if (st.engagementDirective === 'VOLUMETRIC_ENGINE_SUPPRESSION') {
    return {
      updatedTelemetry: st,
      success: false,
      failReasonRu: 'РЕЖИМ ТОРМОЖЕНИЯ ДВИГАТЕЛЯ ИСКЛЮЧАЕТ СТРЕЛЬБУ! (Активно силовое поле гашения тяги в тоннах)',
      strikeSpec: spec,
      isWarningShot: false,
      directiveResolution: resolution,
    };
  }

  if (st.cooldownRemainingSeconds > 0) {
    return {
      updatedTelemetry: st,
      success: false,
      failReasonRu: `ОРУДИЕ В РЕЖИМЕ ПЕРЕЗАРЯДКИ (осталось ${st.cooldownRemainingSeconds.toFixed(1)} сек.)`,
      strikeSpec: spec,
      isWarningShot: resolution?.isWarningShot,
      directiveResolution: resolution,
    };
  }

  if (st.batteryChargeGeu < spec.energyCostGeu) {
    return {
      updatedTelemetry: st,
      success: false,
      failReasonRu: `НЕДОСТАТОЧНО ЗАРЯДА НАКОПИТЕЛЯ (требуется ${spec.energyCostGeu} ГЭУ, в наличии ${Math.round(st.batteryChargeGeu)} ГЭУ)`,
      strikeSpec: spec,
      isWarningShot: resolution?.isWarningShot,
      directiveResolution: resolution,
    };
  }

  const remainingCharge = Math.max(0, st.batteryChargeGeu - spec.energyCostGeu);
  const newPct = Math.round((remainingCharge / st.batteryCapacityGeu) * 100);
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] || '12:00:00';

  const isWarning = resolution?.isWarningShot ?? false;
  const directiveNotice =
    st.engagementDirective === 'DESTROY_ONLY'
      ? '⚡ [ЗАСАДА: ТОЛЬКО УНИЧТОЖИТЬ]'
      : isWarning
      ? '🛡️ [ОТПУГИВАНИЕ: ПРЕДУПРЕДИТЕЛЬНЫЙ ВЫСТРЕЛ]'
      : '🛡️ [ЭСКАЛАЦИЯ ПО ПРИБЛИЖЕНИЮ]';

  const newLogItem = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timeStr,
    category: 'FIRE' as const,
    message: `${directiveNotice} Залп [${spec.codeName}]: урон ${spec.damageUnits} ед. (${spec.massEquivalentKg} кг). Расход: -${spec.energyCostGeu} ГЭУ. Цель: «${targetName}» [${iffClassification}]${targetDistanceUnits ? ` на ${Math.round(targetDistanceUnits)}м` : ''}.`,
  };

  const updated: SentinelPlatformTelemetry = {
    ...st,
    batteryChargeGeu: Math.round(remainingCharge * 10) / 10,
    batteryPercent: newPct,
    cooldownRemainingSeconds: spec.cooldownSeconds,
    totalShotsFired: st.totalShotsFired + 1,
    totalDamageDealtKg: st.totalDamageDealtKg + spec.massEquivalentKg,
    targetsInterceptedCount: st.targetsInterceptedCount + 1,
    lastShotTimestampMs: Date.now(),
    lastTargetName: targetName,
    lastEngagedIffClassification: iffClassification,
    eventLog: [newLogItem, ...st.eventLog.slice(0, 39)],
  };

  return {
    updatedTelemetry: updated,
    success: true,
    strikeSpec: spec,
    isWarningShot: isWarning,
    directiveResolution: resolution,
  };
}
