// ============================================================================
// СТАНДАРТНАЯ СИСТЕМА ИГРЫ G. BELL ELITE:
// • В стандартный уровень входят все звёзды всех 10 созвездий на карте неба (65 звёзд),
//   на которые можно совершить гиперпрыжок, а также базовые сектора галактики.
// • Все звёзды, планеты, Звёзды Смерти и Космические Станции в стандартной системе
//   находятся ПОД ВЛАСТЬЮ ДИКТАТОРА и распределены по 3 фракционным стилям именования
//   с системой префиксов, суффиксов и ДВОЙНЫХ ИМЁН (Официально + «в народе»):
//   1) Для Корпораций / Империи (CORP_EMPIRE): строгие каталожные номера и префиксы
//      («Колония Вейланд-44», «Сектор Омега-7», «Рудник Корпорации "Тардис"»).
//   2) Для Пиратов / Свободных (PIRATE_FREE): сленг, прозвища и криминальный фронтир
//      («Дырявый Карман», «Гнилой Зуб», «Последний Приют»).
//   3) Для Учёных (SCIENTIFIC): латинские/греческие буквы и астрофизические термины
//      («Эпсилон-Эридана-c», «Кеплер-186ф», «Объект Стромгрена»).
//   4) Двойные имена у каждой планеты, Звезды Смерти и Станции:
//      Официально: «Новая Земля-2», в народе: «Ржавчина».
// ============================================================================

export type PlanetFactionId = 'CORP_EMPIRE' | 'PIRATE_FREE' | 'SCIENTIFIC';

export interface PlanetFactionMeta {
  id: PlanetFactionId;
  icon: string;
  title: string;
  shortBadge: string;
  namingRule: string;
  exampleText: string;
  color: string;
}

export const PLANET_FACTIONS_META: Record<PlanetFactionId, PlanetFactionMeta> = {
  CORP_EMPIRE: {
    id: 'CORP_EMPIRE',
    icon: '🏛',
    title: 'Корпорации и Империя Диктатора',
    shortBadge: '🏛 КОРПОРАЦИЯ / ИМПЕРИЯ',
    namingRule: 'Строгие каталожные номера, префиксы директорий, колоний и рудников корпораций',
    exampleText: '«Колония Вейланд-44», «Сектор Омега-7», «Рудник Корпорации "Тардис"»',
    color: '#fbbf24',
  },
  PIRATE_FREE: {
    id: 'PIRATE_FREE',
    icon: '🏴‍☠️',
    title: 'Пираты и Свободные Вольницы',
    shortBadge: '🏴‍☠️ ПИРАТЫ / СВОБОДНЫЕ',
    namingRule: 'Космический сленг, контрабандистские клички и прозвища фронтира',
    exampleText: '«Дырявый Карман», «Гнилой Зуб», «Последний Приют»',
    color: '#f43f5e',
  },
  SCIENTIFIC: {
    id: 'SCIENTIFIC',
    icon: '🔬',
    title: 'Учёные и Научный Конклав',
    shortBadge: '🔬 УЧЁНЫЕ / КОНКЛАВ',
    namingRule: 'Латинские и греческие буквы (-a, -b, -c, -f, α, β, γ, Ω) и астрофизические термины',
    exampleText: '«Эпсилон-Эридана-c», «Кеплер-186ф», «Объект Стромгрена»',
    color: '#38bdf8',
  },
};

export interface StandardPlanetCategoryMeta {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  badgeColor: string;
}

export const STANDARD_PLANET_CATEGORIES: StandardPlanetCategoryMeta[] = [
  {
    id: 1,
    icon: '🏛',
    title: '1. Мифологические и Древние',
    subtitle: 'Для миров Предтеч, храмовых планет или колыбелей цивилизаций',
    badgeColor: '#fbbf24',
  },
  {
    id: 2,
    icon: '📚',
    title: '2. Литературные отсылки и Классика НФ',
    subtitle: 'Для фанатов жанра, миры с богатой историей',
    badgeColor: '#38bdf8',
  },
  {
    id: 3,
    icon: '⚙️',
    title: '3. Суровые, Промышленные и Шахтерские',
    subtitle: 'Для добывающих колоний, кузниц и тюрем',
    badgeColor: '#f97316',
  },
  {
    id: 4,
    icon: '🌺',
    title: '4. Райские, Курортные и Аграрные',
    subtitle: 'Для элитных миров, фермерских планет и курортов',
    badgeColor: '#34d399',
  },
  {
    id: 5,
    icon: '👁',
    title: '5. Загадочные, Мертвые и Аномальные',
    subtitle: 'Для миров космического хоррора, руин и аномалий',
    badgeColor: '#a855f7',
  },
  {
    id: 6,
    icon: '🏴‍☠️',
    title: '6. Пиратские, Фронтир и «Трущобы»',
    subtitle: 'Для миров контрабандистов, вольницы и криминала',
    badgeColor: '#f43f5e',
  },
  {
    id: 7,
    icon: '🧠',
    title: '7. Абстрактные, Техногенные и Кибернетические',
    subtitle: 'Для вычислительных ядер, квантовых полигонов и цитаделей Диктатора',
    badgeColor: '#22d3ee',
  },
];

export interface StandardDeathStarMeta {
  code: string;
  factionId: PlanetFactionId;
  factionBadge: string;
  officialName: string;
  folkName: string;
  dualNameLabel: string;
  hudName: string;
  superlaserSpec: string;
}

export interface StandardSpaceStationMeta {
  code: string;
  factionId: PlanetFactionId;
  factionBadge: string;
  officialName: string;
  folkName: string;
  dualNameLabel: string;
  hudName: string;
  coriolisStationName: string;
  stargateDesignation: string;
  stationLore: string;
}

export interface StandardDictatorPlanet {
  /** Глобальный уникальный номер планеты в Стандартной Системе (1..284, первые 200 — основной золотой фонд) */
  index: number;
  /** Уникальный код Диктатора (ДИКТАТ-001 .. ДИКТАТ-284) */
  dictatorCode: string;
  /** Базовое краткое название мира */
  name: string;
  /** Официальное каталожное/фракционное название с префиксом и суффиксом */
  officialName: string;
  /** Народное прозвище («в народе: ...») */
  folkName: string;
  /** Полное двойное название: Официально: «...», в народе: «...» */
  dualNameLabel: string;
  /** Компактное двойное имя для 3D-радара и HUD */
  hudDisplayName: string;
  /** Принадлежность к фракции внутри системы Диктатора */
  factionId: PlanetFactionId;
  /** Бейдж фракции */
  factionBadge: string;
  /** Префикс фракции (Колония / Сектор / Рудник Корпорации / Объект / Притон и т.д.) */
  prefixTag: string;
  /** Суффикс фракции (-44, -c, -Прайм, -7 и т.д.) */
  suffixTag: string;
  /** Номер тематической категории (1..7) */
  categoryId: number;
  /** Название категории */
  categoryTitle: string;
  /** Индекс звёздной системы (0..70) */
  starSlotIndex: number;
  /** Название звезды и созвездия, вокруг которой вращается эта планета */
  starSystemTitle: string;
  /** Название созвездия (или Базовый сектор) */
  constellationTitle: string;
  /** Номер орбиты в звёздной системе (1 = I орбита Fe, 2 = II орбита Al, 3 = III орбита Вода/Еда, 4 = IV орбита Ti) */
  orbitOrder: 1 | 2 | 3 | 4;
  /** Римский номер орбиты */
  orbitRoman: 'I' | 'II' | 'III' | 'IV';
  /** Профильная специализация планеты в экономике и логистике */
  resourceSpecialization: string;
  /** Атмосфера и статус мира под властью Диктатора */
  loreDescription: string;
  /** Гарнизон и управление Диктатора */
  dictatorRuleTitle: string;
}

export interface StarSystemSlotAssignment {
  slotIndex: number;
  systemKey: string;
  starName: string;
  constellationId: string;
  constellationNameRu: string;
  dominantFactionId: PlanetFactionId;
  planets: [
    StandardDictatorPlanet,
    StandardDictatorPlanet,
    StandardDictatorPlanet,
    StandardDictatorPlanet,
  ];
  deathStar: StandardDeathStarMeta;
  spaceStation: StandardSpaceStationMeta;
}

interface RawPlanetSeed {
  name: string;
  officialName: string;
  folkName: string;
  factionId: PlanetFactionId;
  prefixTag: string;
  suffixTag: string;
  note: string;
  categoryId: number;
}

// ============================================================================
// СПИСОК ЗВЁЗДНЫХ СИСТЕМ СТАНДАРТНОГО УРОВНЯ (6 БАЗОВЫХ СИСТЕМ + 65 ЗВЁЗД 10 СОЗВЕЗДИЙ = 71 СЛОТ):
// • Слоты 0..49 содержат первые 200 уникальных планет (Золотой реестр 200 планет Диктатора),
// • Слоты 50..70 содержат ещё 84 уникальные планеты для оставшихся звёзд созвездий,
//   чтобы КАЖДАЯ звезда КАЖДОГО созвездия на 3D-карте неба имела свои 4 уникальные планеты,
//   свою уникальную Звезду Смерти и свою уникальную Космическую Станцию!
// ============================================================================
export const STAR_SYSTEM_CATALOG_HEADERS: Array<{
  slotIndex: number;
  systemKey: string;
  starName: string;
  constellationId: string;
  constellationNameRu: string;
  dominantFactionId: PlanetFactionId;
}> = [
  // --- 6 Базовых обитаемых секторов галактики (Слоты 0..5 -> Планеты #1..#24) ---
  {slotIndex: 0, systemKey: 'sys:0', starName: 'LAVE · Фёдоровка-Прайм', constellationId: 'base-sector', constellationNameRu: 'Центральный Сектор Эклиптики', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 1, systemKey: 'sys:1', starName: 'ZAONCE · Винница-Орбита', constellationId: 'base-sector', constellationNameRu: 'Корпоративное Кольцо Диктата', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 2, systemKey: 'sys:2', starName: 'DISO · Киев-Станция', constellationId: 'base-sector', constellationNameRu: 'Индустриальный Кластер Ядра', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 3, systemKey: 'sys:3', starName: 'RIEDQUAT · Пиратский Пояс', constellationId: 'base-sector', constellationNameRu: 'Анаpхический Фронтир', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 4, systemKey: 'sys:4', starName: 'LEESTI · Одесса-Порт', constellationId: 'base-sector', constellationNameRu: 'Свободный Торговый Перекрёсток', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 5, systemKey: 'sys:5', starName: 'ORERVE · Рудники Титана', constellationId: 'base-sector', constellationNameRu: 'Горнодобывающий Пояс Империи', dominantFactionId: 'CORP_EMPIRE'},

  // --- 1. Созвездие Ориона (Orion, 7 звёзд: Слоты 6..12 -> Планеты #25..#52) ---
  {slotIndex: 6, systemKey: 'constellation-orion:0', starName: 'Бетельгейзе (α Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 7, systemKey: 'constellation-orion:1', starName: 'Беллатрикс (γ Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 8, systemKey: 'constellation-orion:2', starName: 'Альнитак (ζ Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 9, systemKey: 'constellation-orion:3', starName: 'Альнилам (ε Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 10, systemKey: 'constellation-orion:4', starName: 'Минтака (δ Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 11, systemKey: 'constellation-orion:5', starName: 'Саиф (κ Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 12, systemKey: 'constellation-orion:6', starName: 'Ригель (β Ori)', constellationId: 'constellation-orion', constellationNameRu: 'Созвездие Орион', dominantFactionId: 'CORP_EMPIRE'},

  // --- 2. Созвездие Тельца и Плеяды (Taurus & Pleiades, 7 звёзд: Слоты 13..19 -> Планеты #53..#80) ---
  {slotIndex: 13, systemKey: 'constellation-taurus:0', starName: 'Альдебаран (α Tau)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 14, systemKey: 'constellation-taurus:1', starName: 'Нат (β Tau)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 15, systemKey: 'constellation-taurus:2', starName: 'Дзета Тельца (ζ Tau)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 16, systemKey: 'constellation-taurus:3', starName: 'Эпсилон Тельца (Айн)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 17, systemKey: 'constellation-taurus:4', starName: 'Альциона (η Tau · Плеяды)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 18, systemKey: 'constellation-taurus:5', starName: 'Атлас (27 Tau · Плеяды)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 19, systemKey: 'constellation-taurus:6', starName: 'Электра (17 Tau · Плеяды)', constellationId: 'constellation-taurus', constellationNameRu: 'Созвездие Телец и Плеяды', dominantFactionId: 'SCIENTIFIC'},

  // --- 3. Созвездие Южный Крест (Crux, 5 звёзд: Слоты 20..24 -> Планеты #81..#100) ---
  {slotIndex: 20, systemKey: 'constellation-crux:0', starName: 'Акрукс (α Cru)', constellationId: 'constellation-crux', constellationNameRu: 'Созвездие Южный Крест', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 21, systemKey: 'constellation-crux:1', starName: 'Гакрукс (γ Cru)', constellationId: 'constellation-crux', constellationNameRu: 'Созвездие Южный Крест', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 22, systemKey: 'constellation-crux:2', starName: 'Мимоза (β Cru)', constellationId: 'constellation-crux', constellationNameRu: 'Созвездие Южный Крест', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 23, systemKey: 'constellation-crux:3', starName: 'Имай (δ Cru)', constellationId: 'constellation-crux', constellationNameRu: 'Созвездие Южный Крест', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 24, systemKey: 'constellation-crux:4', starName: 'Джина (ε Cru)', constellationId: 'constellation-crux', constellationNameRu: 'Созвездие Южный Крест', dominantFactionId: 'CORP_EMPIRE'},

  // --- 4. Созвездие Большая Медведица (Ursa Major, 7 звёзд: Слоты 25..31 -> Планеты #101..#128) ---
  {slotIndex: 25, systemKey: 'constellation-ursa-major:0', starName: 'Дубхе (α UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 26, systemKey: 'constellation-ursa-major:1', starName: 'Мерак (β UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 27, systemKey: 'constellation-ursa-major:2', starName: 'Фекда (γ UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 28, systemKey: 'constellation-ursa-major:3', starName: 'Мегрец (δ UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 29, systemKey: 'constellation-ursa-major:4', starName: 'Алиот (ε UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 30, systemKey: 'constellation-ursa-major:5', starName: 'Мицар и Алькор (ζ UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 31, systemKey: 'constellation-ursa-major:6', starName: 'Алькаид (η UMa)', constellationId: 'constellation-ursa-major', constellationNameRu: 'Созвездие Большая Медведица', dominantFactionId: 'SCIENTIFIC'},

  // --- 5. Созвездие Скорпион (Scorpius, 7 звёзд: Слоты 32..38 -> Планеты #129..#156) ---
  {slotIndex: 32, systemKey: 'constellation-scorpius:0', starName: 'Акраб (β Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 33, systemKey: 'constellation-scorpius:1', starName: 'Дшубба (δ Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 34, systemKey: 'constellation-scorpius:2', starName: 'Антарес (α Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 35, systemKey: 'constellation-scorpius:3', starName: 'Альният (τ Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 36, systemKey: 'constellation-scorpius:4', starName: 'Лараваг (ε Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 37, systemKey: 'constellation-scorpius:5', starName: 'Саргас (θ Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 38, systemKey: 'constellation-scorpius:6', starName: 'Шаула (λ Sco)', constellationId: 'constellation-scorpius', constellationNameRu: 'Созвездие Скорпион', dominantFactionId: 'PIRATE_FREE'},

  // --- 6. Созвездие Лев (Leo, 7 звёзд: Слоты 39..45 -> Планеты #157..#184) ---
  {slotIndex: 39, systemKey: 'constellation-leo:0', starName: 'Регул (α Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 40, systemKey: 'constellation-leo:1', starName: 'Аль-Джабхах (η Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 41, systemKey: 'constellation-leo:2', starName: 'Альгиеба (γ Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 42, systemKey: 'constellation-leo:3', starName: 'Адхафера (ζ Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 43, systemKey: 'constellation-leo:4', starName: 'Расалас (μ Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 44, systemKey: 'constellation-leo:5', starName: 'Зосма (δ Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 45, systemKey: 'constellation-leo:6', starName: 'Денебола (β Leo)', constellationId: 'constellation-leo', constellationNameRu: 'Созвездие Лев', dominantFactionId: 'SCIENTIFIC'},

  // --- 7. Созвездие Малая Медведица (Ursa Minor, 7 звёзд: Слоты 46..52 -> Планеты #185..#212) ---
  {slotIndex: 46, systemKey: 'constellation-ursa-minor:0', starName: 'Полярная звезда (α UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 47, systemKey: 'constellation-ursa-minor:1', starName: 'Йильдун (δ UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 48, systemKey: 'constellation-ursa-minor:2', starName: 'Уродел (ε UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 49, systemKey: 'constellation-ursa-minor:3', starName: 'Ахфа аль Фаркадайн (ζ UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 50, systemKey: 'constellation-ursa-minor:4', starName: 'Анвар аль Фаркадайн (η UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 51, systemKey: 'constellation-ursa-minor:5', starName: 'Феркад (γ UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 52, systemKey: 'constellation-ursa-minor:6', starName: 'Кохаб (β UMi)', constellationId: 'constellation-ursa-minor', constellationNameRu: 'Созвездие Малая Медведица', dominantFactionId: 'CORP_EMPIRE'},

  // --- 8. Созвездие Кассиопея (Cassiopeia, 6 звёзд: Слоты 53..58 -> Планеты #213..#236) ---
  {slotIndex: 53, systemKey: 'constellation-cassiopeia:0', starName: 'Каф (β Cas)', constellationId: 'constellation-cassiopeia', constellationNameRu: 'Созвездие Кассиопея', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 54, systemKey: 'constellation-cassiopeia:1', starName: 'Шедар (α Cas)', constellationId: 'constellation-cassiopeia', constellationNameRu: 'Созвездие Кассиопея', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 55, systemKey: 'constellation-cassiopeia:2', starName: 'Нави (γ Cas)', constellationId: 'constellation-cassiopeia', constellationNameRu: 'Созвездие Кассиопея', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 56, systemKey: 'constellation-cassiopeia:3', starName: 'Рукбах (δ Cas)', constellationId: 'constellation-cassiopeia', constellationNameRu: 'Созвездие Кассиопея', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 57, systemKey: 'constellation-cassiopeia:4', starName: 'Сегин (ε Cas)', constellationId: 'constellation-cassiopeia', constellationNameRu: 'Созвездие Кассиопея', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 58, systemKey: 'constellation-cassiopeia:5', starName: 'Ахирд (η Cas)', constellationId: 'constellation-cassiopeia', constellationNameRu: 'Созвездие Кассиопея', dominantFactionId: 'CORP_EMPIRE'},

  // --- 9. Созвездие Лебедь (Cygnus, 6 звёзд: Слоты 59..64 -> Планеты #237..#260) ---
  {slotIndex: 59, systemKey: 'constellation-cygnus:0', starName: 'Денеб (α Cyg)', constellationId: 'constellation-cygnus', constellationNameRu: 'Созвездие Лебедь (Северный Крест)', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 60, systemKey: 'constellation-cygnus:1', starName: 'Садр (γ Cyg)', constellationId: 'constellation-cygnus', constellationNameRu: 'Созвездие Лебедь (Северный Крест)', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 61, systemKey: 'constellation-cygnus:2', starName: 'Альбирео (β Cyg)', constellationId: 'constellation-cygnus', constellationNameRu: 'Созвездие Лебедь (Северный Крест)', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 62, systemKey: 'constellation-cygnus:3', starName: 'Гиенах (ε Cyg)', constellationId: 'constellation-cygnus', constellationNameRu: 'Созвездие Лебедь (Северный Крест)', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 63, systemKey: 'constellation-cygnus:4', starName: 'Фаварес (δ Cyg)', constellationId: 'constellation-cygnus', constellationNameRu: 'Созвездие Лебедь (Северный Крест)', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 64, systemKey: 'constellation-cygnus:5', starName: 'Азадифар (ζ Cyg)', constellationId: 'constellation-cygnus', constellationNameRu: 'Созвездие Лебедь (Северный Крест)', dominantFactionId: 'PIRATE_FREE'},

  // --- 10. Созвездие Лира (Lyra, 6 звёзд: Слоты 65..70 -> Планеты #261..#284) ---
  {slotIndex: 65, systemKey: 'constellation-lyra:0', starName: 'Вега (α Lyr)', constellationId: 'constellation-lyra', constellationNameRu: 'Созвездие Лира', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 66, systemKey: 'constellation-lyra:1', starName: 'Эпсилон Лиры (ε Lyr)', constellationId: 'constellation-lyra', constellationNameRu: 'Созвездие Лира', dominantFactionId: 'SCIENTIFIC'},
  {slotIndex: 67, systemKey: 'constellation-lyra:2', starName: 'Дзета Лиры (ζ Lyr)', constellationId: 'constellation-lyra', constellationNameRu: 'Созвездие Лира', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 68, systemKey: 'constellation-lyra:3', starName: 'Шелиак (β Lyr)', constellationId: 'constellation-lyra', constellationNameRu: 'Созвездие Лира', dominantFactionId: 'PIRATE_FREE'},
  {slotIndex: 69, systemKey: 'constellation-lyra:4', starName: 'Сулафат (γ Lyr)', constellationId: 'constellation-lyra', constellationNameRu: 'Созвездие Лира', dominantFactionId: 'CORP_EMPIRE'},
  {slotIndex: 70, systemKey: 'constellation-lyra:5', starName: 'Аладфар (η Lyr)', constellationId: 'constellation-lyra', constellationNameRu: 'Созвездие Лира', dominantFactionId: 'SCIENTIFIC'},
];

// ============================================================================
// БАЗОВЫЕ ИМЕНА И НАРОДНЫЕ ПРОЗВИЩА 284 ПЛАНЕТ (ПЕРВЫЕ 200 — КАНОНИЧЕСКИЕ МИРЫ ДИКТАТОРА,
// + 84 МИРА ДЛЯ ПОЛНОГО ПОКРЫТИЯ ВСЕХ 65 ЗВЁЗД СОЗВЕЗДИЙ БЕЗ ЕДИНОГО ПОВТОРА)
// ============================================================================
const RAW_PLANET_SEEDS: RawPlanetSeed[] = [
  // --- Слот 0 (LAVE · Фёдоровка-Прайм) — Включает эталонные примеры из задания! ---
  {
    name: 'Колония Вейланд-44 (Элизиум-Прайм)',
    officialName: 'Колония Вейланд-44',
    folkName: 'Золотая Наковальня',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-44',
    note: 'Древний храмовый мир Предтеч, обращённый Корпорацией Вейланд и Диктатором в литейную колонию #44',
    categoryId: 1,
  },
  {
    name: 'Новая Земля-2 (Тартар-Некро)',
    officialName: 'Новая Земля-2',
    folkName: 'Ржавчина',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Новая Земля',
    suffixTag: '-2',
    note: 'Официально: «Новая Земля-2», в народе: «Ржавчина» — глубинный мир окисленных бокситов и подземных плавилен Диктатора',
    categoryId: 1,
  },
  {
    name: 'Сектор Омега-7 (Асгард-Дельта)',
    officialName: 'Сектор Омега-7',
    folkName: 'Слеза Неба',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-7',
    note: 'Опорная гидросферная твердыня Империи с циклопическими шпилями и водными куполами',
    categoryId: 1,
  },
  {
    name: 'Рудник Корпорации «Тардис» (Вальхалла)',
    officialName: 'Рудник Корпорации «Тардис»',
    folkName: 'Железный Гроб',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '«Тардис»',
    note: 'Суровый титановый рудник Корпорации «Тардис» и полигон тяжёлого флота Диктатора',
    categoryId: 1,
  },

  // --- Слот 1 (ZAONCE · Винница-Орбита) — Эталонные примеры Учёных и Пиратов! ---
  {
    name: 'Эпсилон-Эридана-c (Уту)',
    officialName: 'Эпсилон-Эридана-c',
    folkName: 'Печка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эпсилон-',
    suffixTag: '-c',
    note: 'Научный полигон на раскалённой внутренней орбите для выплавки сверхчистого железа',
    categoryId: 1,
  },
  {
    name: 'Кеплер-186ф (Ниппур)',
    officialName: 'Кеплер-186ф',
    folkName: 'Красный Сухарь',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Кеплер-',
    suffixTag: '-186ф',
    note: 'Экзопланета под куполами Научного Конклава со ступенчатыми зиккуратами и глинозёмными карьерами',
    categoryId: 1,
  },
  {
    name: 'Объект Стромгрена (Эриду)',
    officialName: 'Объект Стромгрена',
    folkName: 'Стеклянный Омут',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: 'Стромгрена',
    note: 'Ионизированная сфера Стромгрена с океаническими террасами и биокуполами синтеза воды O₂',
    categoryId: 1,
  },
  {
    name: 'Директория Мидгард-09 (Мидгард)',
    officialName: 'Директория Мидгард-09',
    folkName: 'Дырявый Карман',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Директория',
    suffixTag: '-09',
    note: 'Официально имперский таможенный узел, а в народе — «Дырявый Карман», где поборы и контрабанда титана не стихают',
    categoryId: 1,
  },

  // --- Слот 2 (DISO · Киев-Станция) ---
  {
    name: 'Каторга-Блок Хельхейм-11',
    officialName: 'Каторга-Блок Хельхейм-11',
    folkName: 'Гнилой Зуб',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Каторга-Блок',
    suffixTag: '-11',
    note: 'Холодный сумеречный мир железных ледников, прозванный каторжанами и пиратами «Гнилой Зуб»',
    categoryId: 1,
  },
  {
    name: 'Крио-Сектор Нифльхейм-b',
    officialName: 'Крио-Сектор Нифльхейм-b',
    folkName: 'Белая Смерть',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Крио-Сектор',
    suffixTag: '-b',
    note: 'Планета вечных туманов, криогенных алюминиевых заводов и ледяных каньонов',
    categoryId: 1,
  },
  {
    name: 'Комбинат Муспельхейм-4',
    officialName: 'Комбинат Муспельхейм-4',
    folkName: 'Последний Приют',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Комбинат',
    suffixTag: '-4',
    note: 'Тектонически активный мир огненных рек и гидротермальных станций, ставший «Последним Приютом» вольных пилотов',
    categoryId: 1,
  },
  {
    name: 'Протекторат Авалон-12',
    officialName: 'Протекторат Авалон-12',
    folkName: 'Барский Купол',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Протекторат',
    suffixTag: '-12',
    note: 'Островной мир реликтовых морей и титановых копей под энергетическим куполом элиты Диктатора',
    categoryId: 1,
  },

  // --- Слот 3 (RIEDQUAT · Пиратский Пояс) ---
  {
    name: 'Гидро-Колония Атлантида-7',
    officialName: 'Гидро-Колония Атлантида-7',
    folkName: 'Мокрая Могила',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Гидро-Колония',
    suffixTag: '-7',
    note: 'Затопленный архипелаг древних монолитов с подводными железорудными комплексами',
    categoryId: 1,
  },
  {
    name: 'Био-Сектор Лемурия-d',
    officialName: 'Био-Сектор Лемурия-d',
    folkName: 'Зелёная Трясина',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Сектор',
    suffixTag: '-d',
    note: 'Тропический мир древних базальтовых плато и бокситовых террас',
    categoryId: 1,
  },
  {
    name: 'Полярный Доминион Гиперборея-1',
    officialName: 'Полярный Доминион Гиперборея-1',
    folkName: 'Хрустальный Клык',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Доминион',
    suffixTag: '-1',
    note: 'Полярная колыбель с кристально чистыми ледниками питьевой воды и титановыми жилами',
    categoryId: 1,
  },
  {
    name: 'Фронтир-Маяк Туле-08',
    officialName: 'Фронтир-Маяк Туле-08',
    folkName: 'Край Света',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Фронтир-Маяк',
    suffixTag: '-08',
    note: 'Дальний пограничный мир древних маяков на краю эклиптики системы',
    categoryId: 1,
  },

  // --- Слот 4 (LEESTI · Одесса-Порт) ---
  {
    name: 'Объект Шамбала-α',
    officialName: 'Объект Шамбала-α',
    folkName: 'Запретная Гора',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-α',
    note: 'Высокогорный мир закрытых монастырей-лабораторий под прямым надзором Диктатора',
    categoryId: 1,
  },
  {
    name: 'Подземный Сектор Агарти-16',
    officialName: 'Подземный Сектор Агарти-16',
    folkName: 'Кротовья Нора',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-16',
    note: 'Планета гигантских подземных полостей и континентальных туннельных магистралей контрабандистов',
    categoryId: 1,
  },
  {
    name: 'Биосфера Эдем-Ориджин-1',
    officialName: 'Биосфера Эдем-Ориджин-1',
    folkName: 'Хлебница',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Биосфера',
    suffixTag: '-1',
    note: 'Первозданный биосферный заповедник, снабжающий сектор зерном и кислородом',
    categoryId: 1,
  },
  {
    name: 'Радио-Полигон Геенна-66',
    officialName: 'Радио-Полигон Геенна-66',
    folkName: 'Пекло',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Радио-Полигон',
    suffixTag: '-66',
    note: 'Опалённый радиацией внешний мир магнитных бурь и титановых рудников',
    categoryId: 1,
  },

  // --- Слот 5 (ORERVE · Рудники Титана) ---
  {
    name: 'Промзона Стикс-05',
    officialName: 'Промзона Стикс-05',
    folkName: 'Мёртвая Вода',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Промзона',
    suffixTag: '-05',
    note: 'Тёмная планета свинцовых рек и тяжёлых металлургических комбинатов железа',
    categoryId: 1,
  },
  {
    name: 'Рудник Корпорации «Ахерон-19»',
    officialName: 'Рудник Корпорации «Ахерон-19»',
    folkName: 'Каменный Мешок',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-19',
    note: 'Мир каменистых ущелий и автоматизированных алюминиевых рудников Диктатора',
    categoryId: 1,
  },
  {
    name: 'Геотермальный Узел Флегетон-c',
    officialName: 'Геотермальный Узел Флегетон-c',
    folkName: 'Кипяток',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Геотермальный Узел',
    suffixTag: '-c',
    note: 'Планета лавовых каньонов, обогащённых рудами и гидротермальной водой',
    categoryId: 1,
  },
  {
    name: 'Крио-Сфера Коцит-9',
    officialName: 'Крио-Сфера Коцит-9',
    folkName: 'Ледяной Капкан',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Крио-Сфера',
    suffixTag: '-9',
    note: 'Ледяная сфера застывших газов, титана и стратосферного сбора Гелия-3',
    categoryId: 1,
  },

  // --- Слот 6 (Орион: Бетельгейзе α Ori) ---
  {
    name: 'Имперский Доминион Элизий-Мажор-1',
    officialName: 'Имперский Доминион Элизий-Мажор-1',
    folkName: 'Белый Мрамор',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Доминион',
    suffixTag: '-1',
    note: 'Величественный мир античных куполов и имперских триумфальных космопортов Бетельгейзе',
    categoryId: 1,
  },
  {
    name: 'Колония Олимп-Дзенит-88',
    officialName: 'Колония Олимп-Дзенит-88',
    folkName: 'Пуп Галактики',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-88',
    note: 'Планета со сверхвысоким щитовым вулканом и орбитальным лифтом наместника Диктатора',
    categoryId: 1,
  },
  {
    name: 'Архивный Сектор Пантеон-3',
    officialName: 'Архивный Сектор Пантеон-3',
    folkName: 'Склеп Законов',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Архивный Сектор',
    suffixTag: '-3',
    note: 'Храмовый мир тысячи куполов, хранящий архивы покорённых звёздных систем',
    categoryId: 1,
  },
  {
    name: 'Полигон Валгалла-Фолл-14',
    officialName: 'Полигон Валгалла-Фолл-14',
    folkName: 'Битое Железо',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Полигон',
    suffixTag: '-14',
    note: 'Мир застывших кратеров древней битвы и кладбища сбитых дредноутов',
    categoryId: 1,
  },

  // --- Слот 7 (Орион: Беллатрикс γ Ori) ---
  {
    name: 'Терра-Колония Иридий-Рай-22',
    officialName: 'Терра-Колония Иридий-Рай-22',
    folkName: 'Радужная Пыль',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Терра-Колония',
    suffixTag: '-22',
    note: 'Древний терраформированный мир с переливающимися иридиевыми облаками',
    categoryId: 1,
  },
  {
    name: 'Био-Объект Химера-β',
    officialName: 'Био-Объект Химера-β',
    folkName: 'Двуликая',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Объект',
    suffixTag: '-β',
    note: 'Двойственная планета контрастных климатических поясов и генетических лабораторий',
    categoryId: 1,
  },
  {
    name: 'Океан-Станция Солярис-α',
    officialName: 'Океан-Станция Солярис-α',
    folkName: 'Зеркало Разума',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Океан-Станция',
    suffixTag: '-α',
    note: 'Океаническая психологическая планета с разумным плазменным океаном и научными станциями',
    categoryId: 2,
  },
  {
    name: 'Протекторат Саракш-101',
    officialName: 'Протекторат Саракш-101',
    folkName: 'Островная Империя',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Протекторат',
    suffixTag: '-101',
    note: 'Тоталитарный пыльный мир с плотной рефракционной атмосферой и башнями излучателей Диктатора',
    categoryId: 2,
  },

  // --- Слот 8 (Орион: Альнитак ζ Ori) ---
  {
    name: 'Дюнный Сектор Арракис-Дельта-4',
    officialName: 'Дюнный Сектор Арракис-Дельта-4',
    folkName: 'Пыльная Глотка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Дюнный Сектор',
    suffixTag: '-4',
    note: 'Суровая пустынная планета барханов, глубинных водоносных линз и редких минералов',
    categoryId: 2,
  },
  {
    name: 'НИИ-Полигон Понедельник-f',
    officialName: 'НИИ-Полигон Понедельник-f',
    folkName: 'Шарашка Чародеев',
    factionId: 'SCIENTIFIC',
    prefixTag: 'НИИ-Полигон',
    suffixTag: '-f',
    note: 'Научно-экспериментальный мир исследовательских институтов и квантовых полигонов',
    categoryId: 2,
  },
  {
    name: 'Эксперимент Град-Обреченный-0',
    officialName: 'Эксперимент Град-Обреченный-0',
    folkName: 'Жёлтая Стена',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эксперимент',
    suffixTag: '-0',
    note: 'Мрачный урбанистический мир между скальной стеной и пропастью под жёстким экспериментом Диктатора',
    categoryId: 2,
  },
  {
    name: 'Споровый Контур Ташмасар-c',
    officialName: 'Споровый Контур Ташмасар-c',
    folkName: 'Лихорадка',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Споровый Контур',
    suffixTag: '-c',
    note: 'Тропическая загадочная планета густых споровых джунглей и заброшенных космодромов',
    categoryId: 2,
  },

  // --- Слот 9 (Орион: Альнилам ε Ori) ---
  {
    name: 'Колония Аврора-Назар-18',
    officialName: 'Колония Аврора-Назар-18',
    folkName: 'Розовый Купол',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-18',
    note: 'Мир розовых зорь, роботизированных поместий и орбитальных обсерваторий',
    categoryId: 2,
  },
  {
    name: 'Эпсилон-Эридана-b (База Первых)',
    officialName: 'Эпсилон-Эридана-b',
    folkName: 'Старый Причал',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эпсилон-',
    suffixTag: '-b',
    note: 'Классический опорный мир первых межзвёздных экспедиций и торговых конвоев',
    categoryId: 2,
  },
  {
    name: 'Ледяной Форпост Корвин-7',
    officialName: 'Ледяной Форпост Корвин-7',
    folkName: 'Серебряная Вьюга',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Форпост',
    suffixTag: '-7',
    note: 'Ледяная ветреная планета серебряных бурь и укреплённых контрабандистских перевалов',
    categoryId: 2,
  },
  {
    name: 'Отражение Амбер-Хаос-Ω',
    officialName: 'Отражение Амбер-Хаос-Ω',
    folkName: 'Лабиринт Теней',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Отражение',
    suffixTag: '-Ω',
    note: 'Янтарный мир отражённых проекций и энергетических лабиринтов короны Диктатора',
    categoryId: 2,
  },

  // --- Слот 10 (Орион: Минтака δ Ori) ---
  {
    name: 'Архив Основание-Терминус-1',
    officialName: 'Архив Основание-Терминус-1',
    folkName: 'Книжный Край',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Архив',
    suffixTag: '-1',
    note: 'Хранилище энциклопедических знаний и технологий на границе звёздного сектора',
    categoryId: 2,
  },
  {
    name: 'Сектор Дюна-33',
    officialName: 'Сектор Дюна-33',
    folkName: 'Сухая Солонка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-33',
    note: 'Засушливый мир кварцевых ветров и подземных оазисов под контролем гарнизона',
    categoryId: 2,
  },
  {
    name: 'Карантин Пикник-Зона-6',
    officialName: 'Карантин Пикник-Зона-6',
    folkName: 'Ведьмин Студень',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Карантин',
    suffixTag: '-6',
    note: 'Планета закрытых гравитационных аномалий и сталкерских кордонов вокруг артефактов',
    categoryId: 2,
  },
  {
    name: 'Директория Улитка-Склон-15',
    officialName: 'Директория Улитка-Склон-15',
    folkName: 'Мутный Лес',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Директория',
    suffixTag: '-15',
    note: 'Мир туманного биогенного леса и бюрократических управлений на скальном обрыве',
    categoryId: 2,
  },

  // --- Слот 11 (Орион: Саиф κ Ori) ---
  {
    name: 'Курорт-Сектор Хищные-Вещи-8',
    officialName: 'Курорт-Сектор Хищные-Вещи-8',
    folkName: 'Сладкий Дурман',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Курорт-Сектор',
    suffixTag: '-8',
    note: 'Планета изобильных иллюзорных курортов и синтетических развлекательных куполов',
    categoryId: 2,
  },
  {
    name: 'Объект Забытая-Экспедиция-d',
    officialName: 'Объект Забытая-Экспедиция-d',
    folkName: 'Ржавый Ковчег',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-d',
    note: 'Мир законсервированных звездолётов первой волны колонизации и рудных разработок',
    categoryId: 2,
  },
  {
    name: 'Колония Ковчег-7',
    officialName: 'Колония Ковчег-7',
    folkName: 'Старая Палуба',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-7',
    note: 'Планета-поселение потомков гигантского корабля поколений с замкнутой агросистемой',
    categoryId: 2,
  },
  {
    name: 'Био-Контур Навсикая-γ',
    officialName: 'Био-Контур Навсикая-γ',
    folkName: 'Долина Ветров',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Контур',
    suffixTag: '-γ',
    note: 'Лесной ветреный мир гигантских реликтовых папоротников и ветрогенераторных долин',
    categoryId: 2,
  },

  // --- Слот 12 (Орион: Ригель β Ori) ---
  {
    name: 'Рудник Икар-Падение-01',
    officialName: 'Рудник Икар-Падение-01',
    folkName: 'Опалённые Крылья',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник',
    suffixTag: '-01',
    note: 'Выжженная сверхгигантом внутренняя планета с богатейшими выходами чистого железа и никеля',
    categoryId: 2,
  },
  {
    name: 'Астероид-Узел Фаэтон-Осколки-5',
    officialName: 'Астероид-Узел Фаэтон-Осколки-5',
    folkName: 'Битый Шар',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Узел',
    suffixTag: '-5',
    note: 'Собранное гравитационными якорями ядро древней разрушенной планеты у пояса астероидов',
    categoryId: 2,
  },
  {
    name: 'Колония Янтарь-Мир-29',
    officialName: 'Колония Янтарь-Мир-29',
    folkName: 'Смоляная Капля',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-29',
    note: 'Планета застывших смоляных каньонов и золотистых атмосферных куполов',
    categoryId: 2,
  },
  {
    name: 'Агро-Сектор Нефрит-Джунгли-14',
    officialName: 'Агро-Сектор Нефрит-Джунгли-14',
    folkName: 'Зелёный Ад',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Сектор',
    suffixTag: '-14',
    note: 'Изумрудно-зелёный экваториальный мир биореакторов и гидропонных плантаций',
    categoryId: 2,
  },

  // --- Слот 13 (Телец: Альдебаран α Tau) ---
  {
    name: 'Хроно-Объект Рэчел-Слеза-b',
    officialName: 'Хроно-Объект Рэчел-Слеза-b',
    folkName: 'Гробница Шрайка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Хроно-Объект',
    suffixTag: '-b',
    note: 'Хроно-аномальная планета с зеркальными морями и мемориальными комплексами в пустыне',
    categoryId: 2,
  },
  {
    name: 'Сектор Мелания-Тень-17',
    officialName: 'Сектор Мелания-Тень-17',
    folkName: 'Вечные Сумерки',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-17',
    note: 'Планета с вечным полумраком в тени газового кольца и развитой сетью пиратских маяков',
    categoryId: 2,
  },
  {
    name: 'Рудник Фрида-Пустошь-40',
    officialName: 'Рудник Фрида-Пустошь-40',
    folkName: 'Голая Кость',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник',
    suffixTag: '-40',
    note: 'Суровая каменистая равнина с глубокими тектоническими разломами и рудниками',
    categoryId: 2,
  },
  {
    name: 'Комбинат Гефест-Кузница-01',
    officialName: 'Комбинат Гефест-Кузница-01',
    folkName: 'Чугунная Глотка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Комбинат',
    suffixTag: '-01',
    note: 'Главный планетарный литейный цех сектора: круглосуточная выплавка броневой стали и титана',
    categoryId: 3,
  },

  // --- Слот 14 (Телец: Нат β Tau) ---
  {
    name: 'Промзона Шлак-9',
    officialName: 'Промзона Шлак-9',
    folkName: 'Коптилка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Промзона',
    suffixTag: '-9',
    note: 'Индустриальный мир терриконов, доменных башен и кислотных облаков переработки руды',
    categoryId: 3,
  },
  {
    name: 'Разрез Карьер-Глубокий-52',
    officialName: 'Разрез Карьер-Глубокий-52',
    folkName: 'Бездонная Яма',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Разрез',
    suffixTag: '-52',
    note: 'Планета со ступенчатым кратером-карьером шириной в целый континент',
    categoryId: 3,
  },
  {
    name: 'Директория Ржавый-Предел-13',
    officialName: 'Директория Ржавый-Предел-13',
    folkName: 'Рыжая Смерть',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Директория',
    suffixTag: '-13',
    note: 'Окисленная железорудная пустыня с автоматическими шагающими экскаваторами Диктатора',
    categoryId: 3,
  },
  {
    name: 'Колония Пепельный-Мир-24',
    officialName: 'Колония Пепельный-Мир-24',
    folkName: 'Серая Пудра',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-24',
    note: 'Планета под вечным слоем вулканического пепла и кремниево-титановой пыли',
    categoryId: 3,
  },

  // --- Слот 15 (Телец: Дзета Тельца ζ Tau) ---
  {
    name: 'Платформа Базальт-Б-06',
    officialName: 'Платформа Базальт-Б-06',
    folkName: 'Чёрный Шестигранник',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Платформа',
    suffixTag: '-06',
    note: 'Чёрная шестигранная базальтовая твердь с укреплёнными буровыми платформами',
    categoryId: 3,
  },
  {
    name: 'Гео-Узел Обсидия-c',
    officialName: 'Гео-Узел Обсидия-c',
    folkName: 'Битое Стекло',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Гео-Узел',
    suffixTag: '-c',
    note: 'Стеклянно-чёрная вулканическая планета с зеркальными каньонами и геотермальными станциями',
    categoryId: 3,
  },
  {
    name: 'Шахта Кромка-Бездны-77',
    officialName: 'Шахта Кромка-Бездны-77',
    folkName: 'Обрыв Старателя',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Шахта',
    suffixTag: '-77',
    note: 'Шахтёрская колония на краю гигантского гравитационного разлома коры',
    categoryId: 3,
  },
  {
    name: 'Спецзона Омега-Тюремщик-09',
    officialName: 'Спецзона Омега-Тюремщик-09',
    folkName: 'Кандальная',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Спецзона',
    suffixTag: '-09',
    note: 'Планета-каторга строгого режима Диктатора по добыче глубоких полиметаллических руд',
    categoryId: 3,
  },

  // --- Слот 16 (Телец: Эпсилон Тельца Айн) ---
  {
    name: 'Сборочный Сектор Блок-К-12',
    officialName: 'Сборочный Сектор Блок-К-12',
    folkName: 'Коробка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сборочный Сектор',
    suffixTag: '-12',
    note: 'Стандартизированный промышленный мир блочных заводов и грузовых терминалов',
    categoryId: 3,
  },
  {
    name: 'Периметр Зона-Карантин-04',
    officialName: 'Периметр Зона-Карантин-04',
    folkName: 'Чумной Бункер',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Периметр',
    suffixTag: '-04',
    note: 'Закрытый санитарно-промышленный периметр с автоматической отгрузкой сырья челнокам',
    categoryId: 3,
  },
  {
    name: 'Бастион Монолит-Сталь-80',
    officialName: 'Бастион Монолит-Сталь-80',
    folkName: 'Бронеплита',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Бастион',
    suffixTag: '-80',
    note: 'Планета, закованная в многокилометровый панцирь стальных прокатных эстакад',
    categoryId: 3,
  },
  {
    name: 'Изотоп-Рудник Уран-Хаос-235',
    officialName: 'Изотоп-Рудник Уран-Хаос-235',
    folkName: 'Фонящая Яма',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Изотоп-Рудник',
    suffixTag: '-235',
    note: 'Радиоактивный рудный мир с тяжёлыми свинцовыми куполами обогатительных фабрик',
    categoryId: 3,
  },

  // --- Слот 17 (Плеяды: Альциона η Tau) ---
  {
    name: 'Реакторный Полигон Плутоний-Д-239',
    officialName: 'Реакторный Полигон Плутоний-Д-239',
    folkName: 'Светящийся Череп',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Реакторный Полигон',
    suffixTag: '-239',
    note: 'Режимная планета реакторных комплексов и синтеза топливных сборок для флота Диктатора',
    categoryId: 3,
  },
  {
    name: 'Химкомбинат Кобальтовый-Берег-27',
    officialName: 'Химкомбинат Кобальтовый-Берег-27',
    folkName: 'Синяя Рапа',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Химкомбинат',
    suffixTag: '-27',
    note: 'Мир синих кобальтовых солончаков и прибрежных химико-металлургических комбинатов',
    categoryId: 3,
  },
  {
    name: 'Рудник Корпорации «Вольфрам-Твердь-74»',
    officialName: 'Рудник Корпорации «Вольфрам-Твердь-74»',
    folkName: 'Тугоплавкая',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-74',
    note: 'Планета сверхплотных пород, где добывают тугоплавкие сплавы для сопел и брони',
    categoryId: 3,
  },
  {
    name: 'Директория Титания-22',
    officialName: 'Директория Титания-22',
    folkName: 'Седой Исполин',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Директория',
    suffixTag: '-22',
    note: 'Центральный титановый рудник сектора Плеяд со спаренными водоочистными куполами',
    categoryId: 3,
  },

  // --- Слот 18 (Плеяды: Атлас 27 Tau) ---
  {
    name: 'Концерн Иридий-Блеск-77',
    officialName: 'Концерн Иридий-Блеск-77',
    folkName: 'Звёздная Крошка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Концерн',
    suffixTag: '-77',
    note: 'Богатая платиноидами и иридием скалистая планета с магнитными катапультами',
    categoryId: 3,
  },
  {
    name: 'Грави-Шахта Осмиум-Тяжесть-76',
    officialName: 'Грави-Шахта Осмиум-Тяжесть-76',
    folkName: 'Свинцовые Ноги',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Грави-Шахта',
    suffixTag: '-76',
    note: 'Мир повышенной гравитации (2.4G) и добычи сверхплотных элементов ядра',
    categoryId: 3,
  },
  {
    name: 'Исправительный Сектор Каторга-7',
    officialName: 'Исправительный Сектор Каторга-7',
    folkName: 'Ледяной Карцер',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Исправительный Сектор',
    suffixTag: '-7',
    note: 'Седьмой исправительно-трудовой рудник Диктатора в поясе вечной мерзлоты',
    categoryId: 3,
  },
  {
    name: 'Металлургический Комбинат Норильск-Дельта-69',
    officialName: 'Комбинат Норильск-Дельта-69',
    folkName: 'Полярная Печь',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Комбинат',
    suffixTag: '-69',
    note: 'Заполярный индустриальный гигант никелевых, медных и титановых плавилен',
    categoryId: 3,
  },

  // --- Слот 19 (Плеяды: Электра 17 Tau) ---
  {
    name: 'Ионосферный Объект Магнитный-Шторм-γ',
    officialName: 'Объект Магнитный-Шторм-γ',
    folkName: 'Трещотка Радаров',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-γ',
    note: 'Планета с бушующими ионосферными разрядами и ловушками гелиевой плазмы',
    categoryId: 3,
  },
  {
    name: 'Ствол Корпорации «Шахта-Бездна-108»',
    officialName: 'Шахта-Бездна-108',
    folkName: 'Вертикальный Ад',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Шахта',
    suffixTag: '-108',
    note: 'Мир вертикальных стволов глубиной до мантии и подъёмников рудных контейнеров',
    categoryId: 3,
  },
  {
    name: 'Кратер-Колония Рудник-Слеза-14',
    officialName: 'Колония Рудник-Слеза-14',
    folkName: 'Горькая Линза',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Колония',
    suffixTag: '-14',
    note: 'Суровая горнодобывающая колония в кратере древнего ледяного метеорита',
    categoryId: 3,
  },
  {
    name: 'Бастион Железный-Фронтир-99',
    officialName: 'Бастион Железный-Фронтир-99',
    folkName: 'Крайний Редут',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Бастион',
    suffixTag: '-99',
    note: 'Передовой металлургический бастион Стандартной Системы на границе сектора',
    categoryId: 3,
  },

  // --- Слот 20 (Южный Крест: Акрукс α Cru) ---
  {
    name: 'Номенклатурный Сектор Аврора-Прайм-01',
    officialName: 'Сектор Аврора-Прайм-01',
    folkName: 'Золотой Пляж',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-01',
    note: 'Цветущий курортный мир высшей номенклатуры Диктатора с полярными сияниями',
    categoryId: 4,
  },
  {
    name: 'Агро-Директория Эдем-7',
    officialName: 'Агро-Директория Эдем-7',
    folkName: 'Золотой Колос',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Директория',
    suffixTag: '-7',
    note: 'Аграрная житница сектора: бескрайние золотые поля пшеницы и пресные моря',
    categoryId: 4,
  },
  {
    name: 'Био-Гидропоника Лотосия-c',
    officialName: 'Био-Гидропоника Лотосия-c',
    folkName: 'Плавучая Клумба',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Гидропоника',
    suffixTag: '-c',
    note: 'Водно-ботанический мир плавучих садов и фармацевтических оранжерей',
    categoryId: 4,
  },
  {
    name: 'Курорт-Колония Нефритовый-Берег-12',
    officialName: 'Колония Нефритовый-Берег-12',
    folkName: 'Тихая Бухта',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-12',
    note: 'Тёплый архипелаг с нефритовыми лагунами и экспортом чистого продовольствия',
    categoryId: 4,
  },

  // --- Слот 21 (Южный Крест: Гакрукс γ Cru) ---
  {
    name: 'Аква-Комплекс Бирюза-Океан-5',
    officialName: 'Аква-Комплекс Бирюза-Океан-5',
    folkName: 'Голубая Чаша',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Аква-Комплекс',
    suffixTag: '-5',
    note: 'Планета-океан с мелководными коралловыми плато и заводами электролиза воды на O₂',
    categoryId: 4,
  },
  {
    name: 'Санаторный Сектор Лазурит-18',
    officialName: 'Санаторный Сектор Лазурит-18',
    folkName: 'Адмиральская Дача',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Санаторный Сектор',
    suffixTag: '-18',
    note: 'Мир ярко-синего неба, горных водопадов и санаторных куполов для адмиралов флота',
    categoryId: 4,
  },
  {
    name: 'Глубоководный Объект Сапфировая-Бездна-d',
    officialName: 'Объект Сапфировая-Бездна-d',
    folkName: 'Синийомут',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-d',
    note: 'Глубоководный аква-мир по добыче чистейшего водного льда и морских биокультур',
    categoryId: 4,
  },
  {
    name: 'Лесной Заповедник Изумрудный-Лес-3',
    officialName: 'Заповедник Изумрудный-Лес-3',
    folkName: 'Лёгкие Сектора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Заповедник',
    suffixTag: '-3',
    note: 'Континентальный лесной массив, вырабатывающий избыточный кислород для всей системы',
    categoryId: 4,
  },

  // --- Слот 22 (Южный Крест: Мимоза β Cru) ---
  {
    name: 'Терра-Эталон Жемчужина-Сфер-01',
    officialName: 'Терра-Эталон Жемчужина-Сфер-01',
    folkName: 'Белый Город',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Терра-Эталон',
    suffixTag: '-01',
    note: 'Образцовая терраформированная планета с идеальным климатом и белыми городами',
    categoryId: 4,
  },
  {
    name: 'Перевалочный Узел Оазис-Дельта-8',
    officialName: 'Перевалочный Узел Оазис-Дельта-8',
    folkName: 'Поилка Караванов',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Перевалочный Узел',
    suffixTag: '-8',
    note: 'Спасительный зелёный мир снабжения водой и провиантом на перекрёстке гипертрасс',
    categoryId: 4,
  },
  {
    name: 'Агро-Колония Идиллия-9',
    officialName: 'Агро-Колония Идиллия-9',
    folkName: 'Тихий Хутор',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Колония',
    suffixTag: '-9',
    note: 'Тихий пасторальный мир автоматизированных агроферм и зерновых элеваторов',
    categoryId: 4,
  },
  {
    name: 'Био-Терраса Аркадия-Сад-4',
    officialName: 'Био-Терраса Аркадия-Сад-4',
    folkName: 'Виноградная Чаша',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Био-Терраса',
    suffixTag: '-4',
    note: 'Планета террасных виноградников, фруктовых куполов и чистых горных рек',
    categoryId: 4,
  },

  // --- Слот 23 (Южный Крест: Имай δ Cru) ---
  {
    name: 'Акустический Сектор Симфония-Сфер-f',
    officialName: 'Сектор Симфония-Сфер-f',
    folkName: 'Поющие Скалы',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Сектор',
    suffixTag: '-f',
    note: 'Курортная планета поющих ветровых каньонов и орбитальных обзорных галерей',
    categoryId: 4,
  },
  {
    name: 'Эко-Директория Гармония-Мир-2',
    officialName: 'Эко-Директория Гармония-Мир-2',
    folkName: 'Зелёный Паспорт',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Эко-Директория',
    suffixTag: '-2',
    note: 'Сбалансированная биосфера со строгим экологическим квотированием под надзором Диктатора',
    categoryId: 4,
  },
  {
    name: 'Равнинный Узел Мелодия-Ветра-6',
    officialName: 'Равнинный Узел Мелодия-Ветра-6',
    folkName: 'Парусная Степь',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Равнинный Узел',
    suffixTag: '-6',
    note: 'Равнинная планета мягких пассатов, парусных платформ и зерновых долин',
    categoryId: 4,
  },
  {
    name: 'Колония Эхо-Прайм-11',
    officialName: 'Колония Эхо-Прайм-11',
    folkName: 'Зеркальный Фьорд',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-11',
    note: 'Мир зеркальных фьордов и горных здравниц с богатыми недрами лёгких металлов',
    categoryId: 4,
  },

  // --- Слот 24 (Южный Крест: Джина ε Cru) ---
  {
    name: 'Дендро-Сектор Шепот-Леса-5',
    officialName: 'Дендро-Сектор Шепот-Леса-5',
    folkName: 'Вековая Чаща',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Дендро-Сектор',
    suffixTag: '-5',
    note: 'Планета реликтовых секвой и биокуполов длительного хранения продовольствия',
    categoryId: 4,
  },
  {
    name: 'Океан-Платформа Бриз-Станция-14',
    officialName: 'Платформа Бриз-Станция-14',
    folkName: 'Пенный Гребень',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Платформа',
    suffixTag: '-14',
    note: 'Океанический мир парящих над волнами курортных платформ и опреснительных станций',
    categoryId: 4,
  },
  {
    name: 'Гидро-Колония Роса-Утренняя-3',
    officialName: 'Гидро-Колония Роса-Утренняя-3',
    folkName: 'Капельница',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Гидро-Колония',
    suffixTag: '-3',
    note: 'Мир влажных субтропических долин и конденсаторных башен питьевой воды',
    categoryId: 4,
  },
  {
    name: 'Обсерватория Туманность-Сад-α',
    officialName: 'Обсерватория Туманность-Сад-α',
    folkName: 'Пурпурная Ночь',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Обсерватория',
    suffixTag: '-α',
    note: 'Живописная планета, чьё ночное небо озарено сиянием близкой цветной туманности',
    categoryId: 4,
  },

  // --- Слот 25 (Большая Медведица: Дубхе α UMa) ---
  {
    name: 'Горный Сектор Радужный-Пик-19',
    officialName: 'Сектор Радужный-Пик-19',
    folkName: 'Хрустальный Зуб',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-19',
    note: 'Горный мир призматических ледников и термальных источников',
    categoryId: 4,
  },
  {
    name: 'Агро-Пояс Сияние-Вечное-8',
    officialName: 'Агро-Пояс Сияние-Вечное-8',
    folkName: 'Бессонная Жатва',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Пояс',
    suffixTag: '-8',
    note: 'Светлый мир белых ночей и непрерывного вегетационного цикла агрокультур',
    categoryId: 4,
  },
  {
    name: 'Дип-Резиденция Авроралия-01',
    officialName: 'Дип-Резиденция Авроралия-01',
    folkName: 'Посольский Остров',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Дип-Резиденция',
    suffixTag: '-01',
    note: 'Элитный дипломатический курорт Стандартной Системы под охраной гвардии Диктатора',
    categoryId: 4,
  },
  {
    name: 'Терминатор Заря-Вечная-b',
    officialName: 'Терминатор Заря-Вечная-b',
    folkName: 'Алое Кольцо',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Терминатор',
    suffixTag: '-b',
    note: 'Синхронно вращающийся мир с цветущим поясом вечного рассвета в терминаторе',
    categoryId: 4,
  },

  // --- Слот 26 (Большая Медведица: Мерак β UMa) ---
  {
    name: 'Продрезерв Пастораль-Мир-45',
    officialName: 'Продрезерв Пастораль-Мир-45',
    folkName: 'Закрома Диктатора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Продрезерв',
    suffixTag: '-45',
    note: 'Фермерская планета-житница, формирующая стратегический продовольственный резерв',
    categoryId: 4,
  },
  {
    name: 'Аномалия Молчание-Океана-Ω',
    officialName: 'Аномалия Молчание-Океана-Ω',
    folkName: 'Глухая Вода',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Аномалия',
    suffixTag: '-Ω',
    note: 'Неподвижный зеркальный океан тяжёлой воды, поглощающий любые радиоволны',
    categoryId: 5,
  },
  {
    name: 'Консервация Забвение-9',
    officialName: 'Консервация Забвение-9',
    folkName: 'Мёртвая Вахта',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Консервация',
    suffixTag: '-9',
    note: 'Заброшенный мир древних руин, где автоматика продолжает отгружать руду без людей',
    categoryId: 5,
  },
  {
    name: 'Мемориал Некрополь-Прайм-00',
    officialName: 'Мемориал Некрополь-Прайм-00',
    folkName: 'Планета Склепов',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Мемориал',
    suffixTag: '-00',
    note: 'Планета-усыпальница древних династий с циклопическими мавзолеями из титана',
    categoryId: 5,
  },

  // --- Слот 27 (Большая Медведица: Фекда γ UMa) ---
  {
    name: 'Спецполигон Тень-Дельта-13',
    officialName: 'Спецполигон Тень-Дельта-13',
    folkName: 'Чёрное Пятно',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Спецполигон',
    suffixTag: '-13',
    note: 'Мир с аномальным поглощением видимого спектра и секретными полигонами Диктатора',
    categoryId: 5,
  },
  {
    name: 'Пылевой Объект Мрак-Эпсилон-d',
    officialName: 'Объект Мрак-Эпсилон-d',
    folkName: 'Сажа',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-d',
    note: 'Холодная планета на внешней орбите, окутанная плотной угольной пылью',
    categoryId: 5,
  },
  {
    name: 'Вакуум-Полигон Пустота-Макс-0',
    officialName: 'Вакуум-Полигон Пустота-Макс-0',
    folkName: 'Голый Череп',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Вакуум-Полигон',
    suffixTag: '-0',
    note: 'Безжизненный вакуумный шар с идеальными условиями для криогенной металлургии',
    categoryId: 5,
  },
  {
    name: 'Зона Диссипации Энтропия-Распад-γ',
    officialName: 'Зона Энтропия-Распад-γ',
    folkName: 'Гниющий Камень',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Зона',
    suffixTag: '-γ',
    note: 'Аномальный мир ускоренной диссипации пород и выхода редких изотопов',
    categoryId: 5,
  },

  // --- Слот 28 (Большая Медведица: Мегрец δ UMa) ---
  {
    name: 'Утиль-Сектор Тлен-Вечный-16',
    officialName: 'Утиль-Сектор Тлен-Вечный-16',
    folkName: 'Костяной Город',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Утиль-Сектор',
    suffixTag: '-16',
    note: 'Древнее поле окаменевших мегаполисов, перерабатываемых дронами на металл',
    categoryId: 5,
  },
  {
    name: 'Карантин Костер-Зола-86',
    officialName: 'Карантин Костер-Зола-86',
    folkName: 'Горелая Корка',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Карантин',
    suffixTag: '-86',
    note: 'Планета, пережившая древнюю термоядерную войну и покрытая слоем спечённого шлака',
    categoryId: 5,
  },
  {
    name: 'Фумарольный Сектор Дым-Гарь-21',
    officialName: 'Сектор Дым-Гарь-21',
    folkName: 'Серная Пасть',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-21',
    note: 'Мир действующих фумарол и чёрных серных столбов до самой стратосферы',
    categoryId: 5,
  },
  {
    name: 'Гляцио-Объект Ледяной-Саван-c',
    officialName: 'Гляцио-Объект Ледяной-Саван-c',
    folkName: 'Белый Гроб',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Гляцио-Объект',
    suffixTag: '-c',
    note: 'Сфера, закованная в десятикилометровый панцирь реликтового азотного и водного льда',
    categoryId: 5,
  },

  // --- Слот 29 (Большая Медведица: Алиот ε UMa) ---
  {
    name: 'Крио-Лаборатория Вечный-Мороз-0K',
    officialName: 'Крио-Лаборатория Вечный-Мороз-0K',
    folkName: 'Абсолютный Ноль',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Крио-Лаборатория',
    suffixTag: '-0K',
    note: 'Криогенный мир близ абсолютного нуля со сверхпроводящими жилами металлов',
    categoryId: 5,
  },
  {
    name: 'Метео-Аномалия Черный-Буран-7',
    officialName: 'Аномалия Черный-Буран-7',
    folkName: 'Наждачная Буря',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Аномалия',
    suffixTag: '-7',
    note: 'Планета сверхзвуковых метелей из железной и магнетитовой крошки',
    categoryId: 5,
  },
  {
    name: 'Радио-Объект Призрак-Шторм-β',
    officialName: 'Радио-Объект Призрак-Шторм-β',
    folkName: 'Ложная Цель',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Радио-Объект',
    suffixTag: '-β',
    note: 'Аномальная сфера блуждающих плазменных вихрей и миражей на радарах',
    categoryId: 5,
  },
  {
    name: 'Разрядный Узел Немая-Гроза-4',
    officialName: 'Разрядный Узел Немая-Гроза-4',
    folkName: 'Тихая Вспышка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Разрядный Узел',
    suffixTag: '-4',
    note: 'Мир гигантских беззвучных молний в разреженной гелиево-аргоновой атмосфере',
    categoryId: 5,
  },

  // --- Слот 30 (Большая Медведица: Мицар и Алькор ζ UMa) ---
  {
    name: 'Гидро-Карст Слезный-Ливень-12',
    officialName: 'Гидро-Карст Слезный-Ливень-12',
    folkName: 'Плакса',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Гидро-Карст',
    suffixTag: '-12',
    note: 'Планета непрерывных серебристых дождей и глубоких карстовых водохранилищ',
    categoryId: 5,
  },
  {
    name: 'Инфразвуковой Сектор Плач-Бездны-9',
    officialName: 'Сектор Плач-Бездны-9',
    folkName: 'Воющая Щель',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-9',
    note: 'Мир поющих на инфразвуке тектонических расщелин и глубоких шахт',
    categoryId: 5,
  },
  {
    name: 'Приливной Рудник Стон-Планеты-31',
    officialName: 'Приливной Рудник Стон-Планеты-31',
    folkName: 'Ломкая Кора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Приливной Рудник',
    suffixTag: '-31',
    note: 'Планета с мощными приливными деформациями коры и выбросами глубинных руд',
    categoryId: 5,
  },
  {
    name: 'Маяк-Аномалия Крик-Тьмы-f',
    officialName: 'Маяк-Аномалия Крик-Тьмы-f',
    folkName: 'Шёпот Пустоты',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Маяк-Аномалия',
    suffixTag: '-f',
    note: 'Загадочный источник периодических радиоимпульсов на границе сферы системы',
    categoryId: 5,
  },

  // --- Слот 31 (Большая Медведица: Алькаид η UMa) ---
  {
    name: 'Пси-Зона Шепот-Безумных-6',
    officialName: 'Пси-Зона Шепот-Безумных-6',
    folkName: 'Дурдом Автоматов',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Пси-Зона',
    suffixTag: '-6',
    note: 'Аномальный мир магнитных резонансов, где работают только автономные роботы Диктатора',
    categoryId: 5,
  },
  {
    name: 'Архео-Объект Зов-Прошлого-α',
    officialName: 'Архео-Объект Зов-Прошлого-α',
    folkName: 'Поющие Камни',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Архео-Объект',
    suffixTag: '-α',
    note: 'Планета с нерасшифрованными голографическими обелисками исчезнувшей расы',
    categoryId: 5,
  },
  {
    name: 'Реликтовый Склад Эхо-Ушедших-10',
    officialName: 'Реликтовый Склад Эхо-Ушедших-10',
    folkName: 'Ничейный Клад',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Реликтовый Склад',
    suffixTag: '-10',
    note: 'Мир пустых орбитальных колец и сохранившихся складов чистого титана',
    categoryId: 5,
  },
  {
    name: 'Грави-Фокус Резонанс-Пустоты-Ω',
    officialName: 'Грави-Фокус Резонанс-Пустоты-Ω',
    folkName: 'Воронка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Грави-Фокус',
    suffixTag: '-Ω',
    note: 'Точка гравитационной фокусировки волны гиперпространства и сбора Гелия-3',
    categoryId: 5,
  },

  // --- Слот 32 (Скорпион: Акраб β Sco) ---
  {
    name: 'Спецверфь Мираж-Обман-18',
    officialName: 'Спецверфь Мираж-Обман-18',
    folkName: 'Кривое Зеркало',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Спецверфь',
    suffixTag: '-18',
    note: 'Планета с плотным миражным слоем атмосферы, скрывающим военные верфи Диктатора',
    categoryId: 5,
  },
  {
    name: 'Био-Бункер Иллюзия-Смерти-4',
    officialName: 'Био-Бункер Иллюзия-Смерти-4',
    folkName: 'Спящая Красавица',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Бункер',
    suffixTag: '-4',
    note: 'Кажущийся мёртвым мир, внутри которого скрыта цветущая подземная биосфера',
    categoryId: 5,
  },
  {
    name: 'Свободный Порт Вольница-Прайм',
    officialName: 'Комендатура Фронтира-01',
    folkName: 'Вольница-Прайм',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Комендатура',
    suffixTag: '-01',
    note: 'Бывшая столица космической вольницы, ныне подчинённая военному коменданту Диктатора',
    categoryId: 6,
  },
  {
    name: 'Притон Разбой-Крик',
    officialName: 'Таможенный Сектор Скорпион-2',
    folkName: 'Разбой-Крик',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Притон',
    suffixTag: '-Крик',
    note: 'Изрезанный каньонами мир контрабандистских ангаров и теневых доков',
    categoryId: 6,
  },

  // --- Слот 33 (Скорпион: Дшубба δ Sco) ---
  {
    name: 'Бухта Корсаров (Корсар-Бухта)',
    officialName: 'Береговой Гарнизон Дшубба-4',
    folkName: 'Корсар-Бухта',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Бухта',
    suffixTag: 'Корсаров',
    note: 'Планета скрытых в кратерах причалов, платящая принудительную дань рудой Диктатору',
    categoryId: 6,
  },
  {
    name: 'Бастион Флибустьер-Пик',
    officialName: 'Орбитальная Директория Дшубба-7',
    folkName: 'Флибустьер-Пик',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Бастион',
    suffixTag: '-Пик',
    note: 'Скалистый бастион вольных капитанов под прицелом орбитальных батарей режима',
    categoryId: 6,
  },
  {
    name: 'Перевал Контрабанда-Дельта',
    officialName: 'Транзитный Терминал Дельта-19',
    folkName: 'Чёрный Перевал',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Перевал',
    suffixTag: '-Дельта',
    note: 'Узловая перевалочная база серых грузов и нелегального обмена ресурсами',
    categoryId: 6,
  },
  {
    name: 'Перегонный Узел Бутлег-Станция',
    officialName: 'Топливный Комбинат Сектор-15',
    folkName: 'Самогонный Купол',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Узел',
    suffixTag: '-Станция',
    note: 'Планета кустарных перегонных куполов и синтеза дешёвого корабельного топлива',
    categoryId: 6,
  },

  // --- Слот 34 (Скорпион: Антарес α Sco) ---
  {
    name: 'Трущобы Тень-Угол',
    officialName: 'Жилой Сектор Антарес-9',
    folkName: 'Тень-Угол',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Трущобы',
    suffixTag: '-Угол',
    note: 'Мир многоярусных металлических трущоб в вечной тени кратерного вала',
    categoryId: 6,
  },
  {
    name: 'Отстойник Закоулок-Тупик',
    officialName: 'Резервный Док Антарес-11',
    folkName: 'Закоулок-Тупик',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Отстойник',
    suffixTag: '-Тупик',
    note: 'Крайняя планета тупикового маршрута, где прячутся списанные грузовики и рудовозы',
    categoryId: 6,
  },
  {
    name: 'Ярмарка Базар-Толкучка',
    officialName: 'Коммерческий Узел Антарес-3',
    folkName: 'Базар-Толкучка',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Ярмарка',
    suffixTag: '-Толкучка',
    note: 'Шумный мир круглосуточных ангарных ярмарок, ломбардов и скупки металлолома',
    categoryId: 6,
  },
  {
    name: 'Разборка Барахолка-Дельта',
    officialName: 'Вторчермет-Полигон Дельта-6',
    folkName: 'Барахолка',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Разборка',
    suffixTag: '-Дельта',
    note: 'Планета разборки старых звездолётов на запчасти, алюминий и титановый прокат',
    categoryId: 6,
  },

  // --- Слот 35 (Скорпион: Альният τ Sco) ---
  {
    name: 'Полигон Свалка-Прайм',
    officialName: 'Утилизационный Сектор Империи-01',
    folkName: 'Свалка-Прайм',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Полигон',
    suffixTag: '-Прайм',
    note: 'Континентальный полигон переработки вторсырья и списанной военной техники',
    categoryId: 6,
  },
  {
    name: 'Печи Помойка-9',
    officialName: 'Шлакоперерабатывающий Блок-9',
    folkName: 'Помойка-9',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Блок',
    suffixTag: '-9',
    note: 'Суровый мир утилизационных печей и выплавки чернового железа из обломков',
    categoryId: 6,
  },
  {
    name: 'Орбита Мусор-Эпсилон',
    officialName: 'Объект Техно-Осколков Эпсилон-e',
    folkName: 'Жестяное Кольцо',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-e',
    note: 'Планета, окружённая плотным поясом техногенных обломков и ремонтных доков',
    categoryId: 6,
  },
  {
    name: 'Фильтр-Сектор Отходы-Б',
    officialName: 'Регенерационный Сектор Отходы-Б',
    folkName: 'Отстойник',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-Б',
    note: 'Химико-регенерационный мир очистки технических вод и шлаковых отвалов',
    categoryId: 6,
  },

  // --- Слот 36 (Скорпион: Лараваг ε Sco) ---
  {
    name: 'Колония Хлам-Д',
    officialName: 'Складской Терминал Хлам-Д-14',
    folkName: 'Железная Барахолка',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Терминал',
    suffixTag: '-Д',
    note: 'Колония сборщиков трофейного металла и восстановленных корабельных узлов',
    categoryId: 6,
  },
  {
    name: 'Пресс-Завод Утиль-З',
    officialName: 'Прессовальный Комбинат Утиль-З-08',
    folkName: 'Жестяной Пресс',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Комбинат',
    suffixTag: '-З',
    note: 'Планета прессовальных заводов, превращающих старые корпуса в слитки Fe и Al',
    categoryId: 6,
  },
  {
    name: 'Док Лом-М',
    officialName: 'Разделочный Док Корпорации «Лом-М»',
    folkName: 'Крановая Яма',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Разделочный Док',
    suffixTag: '-М',
    note: 'Мир гигантских электромагнитных кранов и разделочных доков под контролем наместника',
    categoryId: 6,
  },
  {
    name: 'Застава Ржавый-Кордон',
    officialName: 'Пограничный Гарнизон Кордон-32',
    folkName: 'Ржавый Кордон',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Застава',
    suffixTag: '-32',
    note: 'Фронтирная застава в поясе окисленных металлических дюн и старых укреплений',
    categoryId: 6,
  },

  // --- Слот 37 (Скорпион: Саргас θ Sco) ---
  {
    name: 'Биогаз-Сектор Гнилой-Болото',
    officialName: 'Метановый Промысел Саргас-5',
    folkName: 'Гнилое Болото',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Промысел',
    suffixTag: '-5',
    note: 'Торфяно-болотистый мир метановых топей, фильтрационных станций и биогаза',
    categoryId: 6,
  },
  {
    name: 'Аномалия Кривой-Зеркало',
    officialName: 'Магнитный Объект Саргас-β',
    folkName: 'Кривое Зеркало',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Магнитный Объект',
    suffixTag: '-β',
    note: 'Планета с искажённым магнитным полем и запутанными навигационными коридорами',
    categoryId: 6,
  },
  {
    name: 'Причал Косой-Луч',
    officialName: 'Рефракционный Сектор Саргас-12',
    folkName: 'Косой Луч',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Причал',
    suffixTag: '-12',
    note: 'Мир под наклонным светом двойного преломления колец, пристанище старателей',
    categoryId: 6,
  },
  {
    name: 'Маяк Слепой-Путь',
    officialName: 'Навигационный Полигон Саргас-19',
    folkName: 'Слепой Путь',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Маяк',
    suffixTag: '-19',
    note: 'Планета пылевых бурь, где посадка возможна только по приводным маякам Диктатора',
    categoryId: 6,
  },

  // --- Слот 38 (Скорпион: Шаула λ Sco) ---
  {
    name: 'Штраф-Колония Немой-Крик',
    officialName: 'Штрафной Изолятор Шаула-03',
    folkName: 'Немой Крик',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Штраф-Изолятор',
    suffixTag: '-03',
    note: 'Режимное поселение штрафников с полным запретом открытого радиоэфира',
    categoryId: 6,
  },
  {
    name: 'Штольня Глухой-Звон',
    officialName: 'Рудный Сектор Шаула-8',
    folkName: 'Глухой Звон',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Штольня',
    suffixTag: '-8',
    note: 'Планета гулких металлических пещер и кустарных рудных штолен',
    categoryId: 6,
  },
  {
    name: 'Док Хромой-Шаг',
    officialName: 'Грави-Ремонтный Базис Шаула-c',
    folkName: 'Хромой Шаг',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Док',
    suffixTag: '-c',
    note: 'Мир с неравномерной гравитационной аномалией и ремонтными мастерскими шаттлов',
    categoryId: 6,
  },
  {
    name: 'Кибер-Цех Безрукий-Мастер',
    officialName: 'Протезно-Кибернетический Узел-41',
    folkName: 'Безрукий Мастер',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Кибер-Цех',
    suffixTag: '-41',
    note: 'Колония кибер-механиков и автоматизированных протезно-ремонтных цехов',
    categoryId: 6,
  },

  // --- Слот 39 (Лев: Регул α Leo) ---
  {
    name: 'Эстакада Безногий-Бегун',
    officialName: 'Монорельсовый Транзит Регул-2',
    folkName: 'Безногий Бегун',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Транзит',
    suffixTag: '-2',
    note: 'Планета скоростных монорельсовых эстакад над бездонными соляными пропастями',
    categoryId: 6,
  },
  {
    name: 'Радар-Бастион Безглазый-Смотритель',
    officialName: 'Пост ПВО Диктата Регул-07',
    folkName: 'Слепой Смотритель',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Пост ПВО',
    suffixTag: '-07',
    note: 'Мир слепых радарных башен ПВО и автоматических досмотровых постов Диктатора',
    categoryId: 6,
  },
  {
    name: 'Колония Беззубый-Укус',
    officialName: 'Демилитаризованная Зона Регул-14',
    folkName: 'Беззубый Укус',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Зона',
    suffixTag: '-14',
    note: 'Демилитаризованная колония бывших пиратов, переведённая на добычу руды',
    categoryId: 6,
  },
  {
    name: 'Автоматон Безмозглый-Гений',
    officialName: 'Кибер-Полигон Старых Роботов-09',
    folkName: 'Жестяной Умник',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Кибер-Полигон',
    suffixTag: '-09',
    note: 'Планета древних автоматонов и сбоящих кибернетических заводов фронтира',
    categoryId: 6,
  },

  // --- Слот 40 (Лев: Аль-Джабхах η Leo) ---
  {
    name: 'Ядро Сингулярность-Ноль',
    officialName: 'Вычислительное Ядро Сингулярность-0',
    folkName: 'Железный Мозг Диктатора',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Ядро',
    suffixTag: '-0',
    note: 'Вычислительное ядро сектора: планета-суперкомпьютер под личным кодом Диктатора',
    categoryId: 7,
  },
  {
    name: 'Узел Квант-Прайм-α',
    officialName: 'Квантовый Узел Квант-Прайм-α',
    folkName: 'Стеклянный Кристалл',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Квантовый Узел',
    suffixTag: '-α',
    note: 'Мир квантовых линий связи и прецизионной выплавки сверхчистого кремния и алюминия',
    categoryId: 7,
  },
  {
    name: 'Навигационная Станция Вектор-7',
    officialName: 'Баллистический Центр Вектор-7',
    folkName: 'Стрелка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Центр',
    suffixTag: '-7',
    note: 'Навигационный узел расчёта баллистических траекторий всех челноков системы',
    categoryId: 7,
  },
  {
    name: 'Грави-Полигон Тензор-Дельта-d',
    officialName: 'Гравиметрический Объект Тензор-Дельта-d',
    folkName: 'Пресс Гравитации',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-d',
    note: 'Техногенный мир гравиметрических станций и глубоких титановых шахт',
    categoryId: 7,
  },

  // --- Слот 41 (Лев: Альгиеба γ Leo) ---
  {
    name: 'Сетка Матрица-Ориджин-01',
    officialName: 'Индустриальная Матрица-Ориджин-01',
    folkName: 'Шахматная Доска',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Матрица',
    suffixTag: '-01',
    note: 'Планета, расчерченная идеальной геометрической сеткой энергоканалов и заводов',
    categoryId: 7,
  },
  {
    name: 'Директория Аксиома-Сталь-10',
    officialName: 'Директория Аксиома-Сталь-10',
    folkName: 'Уставная Наковальня',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Директория',
    suffixTag: '-10',
    note: 'Образцовый индустриальный полигон беспрекословного исполнения директив Диктатора',
    categoryId: 7,
  },
  {
    name: 'Наукоград Парадигма-9',
    officialName: 'Био-Технополис Парадигма-9',
    folkName: 'Замкнутый Круг',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Технополис',
    suffixTag: '-9',
    note: 'Научно-производственный мир замкнутых гидропонных и металлургических циклов',
    categoryId: 7,
  },
  {
    name: 'Изотоп-Завод Синтез-Альфа-c',
    officialName: 'Изотопный Комплекс Синтез-Альфа-c',
    folkName: 'Колба',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Комплекс',
    suffixTag: '-c',
    note: 'Планета химического синтеза, электролиза воды и обогащения изотопов Гелия-3 и Титана',
    categoryId: 7,
  },

  // --- Слот 42 (Лев: Адхафера ζ Leo) ---
  {
    name: 'Кристалл-Мир Фрактал-Кварц-f',
    officialName: 'Объект Фрактал-Кварц-f',
    folkName: 'Колючая Грань',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-f',
    note: 'Кристаллическая планета с ветвящимися кварцевыми хребтами и лазерными рудниками',
    categoryId: 7,
  },
  {
    name: 'Сборочный Центр Кибер-Нексус-04',
    officialName: 'Концерн Дронов «Кибер-Нексус-04»',
    folkName: 'Гнездо Шершней',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Концерн',
    suffixTag: '-04',
    note: 'Центр сборки автономных логистических модулей и карательных дронов Диктатора',
    categoryId: 7,
  },
  {
    name: 'Опто-Узел Нейрон-Прайм-1',
    officialName: 'Оптоволоконный Узел Нейрон-Прайм-1',
    folkName: 'Паутина Света',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Узел',
    suffixTag: '-1',
    note: 'Планета, оплетённая оптоволоконными магистралями управления стандартным сектором',
    categoryId: 7,
  },
  {
    name: 'Робо-Карьер Алгоритм-Б-22',
    officialName: 'Автоматический Рудник Алгоритм-Б-22',
    folkName: 'Секундомер',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Авто-Рудник',
    suffixTag: '-22',
    note: 'Мир полностью роботизированных карьеров, работающих по секундному расписанию',
    categoryId: 7,
  },

  // --- Слот 43 (Лев: Расалас μ Leo) ---
  {
    name: 'Бастион Протокол-Омега-99',
    officialName: 'Чрезвычайный Бастион Протокол-Омега-99',
    folkName: 'Склад Судного Дня',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Бастион',
    suffixTag: '-99',
    note: 'Режимный бастион чрезвычайного резерва флота и стратегических складов руды',
    categoryId: 7,
  },
  {
    name: 'Казначейство Индекс-12',
    officialName: 'Фискальный Сектор Индекс-12',
    folkName: 'Мытарня Диктатора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Фискальный Сектор',
    suffixTag: '-12',
    note: 'Складской и учётный мир центрального реестра податей всех планет системы',
    categoryId: 7,
  },
  {
    name: 'Верфь Модуль-Зенит-08',
    officialName: 'Орбитальная Верфь Модуль-Зенит-08',
    folkName: 'Сборочный Стапель',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Верфь',
    suffixTag: '-08',
    note: 'Планета-верфь крупноузловой сборки орбитальных станций и грузовых контейнеров',
    categoryId: 7,
  },
  {
    name: 'Полигон Контур-Гамма-γ',
    officialName: 'Энергетический Полигон Контур-Гамма-γ',
    folkName: 'Силовой Купол',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Полигон',
    suffixTag: '-γ',
    note: 'Энергетический полигон испытания защитных полей и гамма-реакторов',
    categoryId: 7,
  },

  // --- Слот 44 (Лев: Зосма δ Leo) ---
  {
    name: 'Сепаратор Спектр-Призма-b',
    officialName: 'Спектральный Объект Призма-b',
    folkName: 'Семицветка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-b',
    note: 'Мир многоцветных газовых колец и спектрального разделения редких металлов',
    categoryId: 7,
  },
  {
    name: 'Катапульта Импульс-Форвард-5',
    officialName: 'Разгонный Трек Импульс-Форвард-5',
    folkName: 'Рогатка Конвоев',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Разгонный Трек',
    suffixTag: '-5',
    note: 'Планета разгонных электромагнитных треков для запуска межпланетных конвоев',
    categoryId: 7,
  },
  {
    name: 'Лаборатория Горизонт-Событий-Ω',
    officialName: 'Грави-Станция Горизонт-Событий-Ω',
    folkName: 'Край Бездны',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Грави-Станция',
    suffixTag: '-Ω',
    note: 'Пограничный научный мир гравитационных исследований и добычи тяжёлых руд',
    categoryId: 7,
  },
  {
    name: 'Купол Зенит-Кристалл-14',
    officialName: 'Колония Зенит-Кристалл-14',
    folkName: 'Алмазная Шапка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-14',
    note: 'Горная планета алмазно-титановых куполов и солнечных концентраторов',
    categoryId: 7,
  },

  // --- Слот 45 (Лев: Денебола β Leo) ---
  {
    name: 'Форпост Апогей-Твердь-40',
    officialName: 'Дальний Гарнизон Апогей-Твердь-40',
    folkName: 'Дальняя Застава',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Гарнизон',
    suffixTag: '-40',
    note: 'Самая удалённая укреплённая планета сектора с запасами воды и Гелия-3',
    categoryId: 7,
  },
  {
    name: 'Гелио-Сборщик Перигей-Плазма-a',
    officialName: 'Гелио-Станция Перигей-Плазма-a',
    folkName: 'Солнечное Горнило',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Гелио-Станция',
    suffixTag: '-a',
    note: 'Раскалённый внутренний мир сбора солнечной плазмы и выплавки ферросплавов',
    categoryId: 7,
  },
  {
    name: 'Эталон Хронос-Такт-01',
    officialName: 'Метрологический Центр Хронос-Такт-01',
    folkName: 'Главный Метроном',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Центр',
    suffixTag: '-01',
    note: 'Планета эталонных атомных часов, синхронизирующих движение всех 4 орбит',
    categoryId: 7,
  },
  {
    name: 'Крио-Банк Эон-Вечность-8',
    officialName: 'Генетический Архив Эон-Вечность-8',
    folkName: 'Вечный Ковчег',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Архив',
    suffixTag: '-8',
    note: 'Древний стабилизированный мир вечного хранения генетических и семенных фондов',
    categoryId: 7,
  },

  // --- Слот 46 (Малая Медведица: Полярная звезда α UMi) ---
  {
    name: 'Комбинат Катализ-9',
    officialName: 'Бокситовый Комбинат Катализ-9',
    folkName: 'Быстрый Алюминий',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Комбинат',
    suffixTag: '-9',
    note: 'Планета ускоренной переработки бокситов в авиационный и космический алюминий',
    categoryId: 7,
  },
  {
    name: 'Сепаратор Изотоп-Дельта-3',
    officialName: 'Термоядерный Узел Изотоп-Дельта-3',
    folkName: 'Тяжёлая Капля',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Узел',
    suffixTag: '-3',
    note: 'Главный комплекс сепарации дейтерия и Гелия-3 для термоядерных реакторов',
    categoryId: 7,
  },
  {
    name: 'Ускоритель Коллайдер-Мир-c',
    officialName: 'Кольцевой Полигон Коллайдер-Мир-c',
    folkName: 'Экватор-Кольцо',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Полигон',
    suffixTag: '-c',
    note: 'Планета, опоясанная по экватору кольцом ускорителя элементарных частиц',
    categoryId: 7,
  },
  {
    name: 'Энергоблок Реактор-Ядро-05',
    officialName: 'Энергетический Сектор Реактор-Ядро-05',
    folkName: 'Сердце Сектора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-05',
    note: 'Геотермально-ядерный мир, снабжающий энергией верфи и рудники Диктатора',
    categoryId: 7,
  },

  // --- Слот 47 (Малая Медведица: Йильдун δ UMi) ---
  {
    name: 'МГД-Станция Генератор-Прайм-1',
    officialName: 'Станция Щитов Генератор-Прайм-1',
    folkName: 'Гудящий Шар',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Станция',
    suffixTag: '-1',
    note: 'Планета сверхмощных магнитогидродинамических станций и силовых щитов',
    categoryId: 7,
  },
  {
    name: 'Таможня Терминал-Альфа-01',
    officialName: 'Таможенный Узел Терминал-Альфа-01',
    folkName: 'Ворота Режима',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Таможенный Узел',
    suffixTag: '-01',
    note: 'Главный таможенно-логистический узел приёма государственных поставок в секторе',
    categoryId: 7,
  },
  {
    name: 'Крепость Бастион-Диктат-10',
    officialName: 'Гвардейский Бастион-Диктат-10',
    folkName: 'Железный Кулак',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Бастион',
    suffixTag: '-10',
    note: 'Образцовая военная крепость личной гвардии Диктатора с подземными арсеналами',
    categoryId: 7,
  },
  {
    name: 'Твердыня Цитадель-Прайм-02',
    officialName: 'Оборонительный Сектор Цитадель-Прайм-02',
    folkName: 'Неприступная',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-02',
    note: 'Неприступный мир орбитальных ПВО, командных бункеров и сталелитейных заводов',
    categoryId: 7,
  },

  // --- Слот 48 (Малая Медведица: Уродел ε UMi) ---
  {
    name: 'Гарнизон Орден-Железо-4',
    officialName: 'Военно-Рудный Доминион Орден-Железо-4',
    folkName: 'Стальной Устав',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Доминион',
    suffixTag: '-4',
    note: 'Планета суровой воинской дисциплины и непрерывной добычи конструкционного железа',
    categoryId: 7,
  },
  {
    name: 'Судебный Сектор Трибунал-7',
    officialName: 'Судебно-Исполнительный Сектор Трибунал-7',
    folkName: 'Планета Приговоров',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-7',
    note: 'Судебно-административный мир сектора, контролирующий карму и статус пилотов',
    categoryId: 7,
  },
  {
    name: 'Радио-Контроль Цензура-Ноль',
    officialName: 'Узел Перехвата Цензура-Ноль',
    folkName: 'Глушилка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Узел Перехвата',
    suffixTag: '-Ноль',
    note: 'Планета станций радиоперехвата и контроля подпространственных каналов связи',
    categoryId: 7,
  },
  {
    name: 'Оплот Догма-Твердь-11',
    officialName: 'Идеологический Оплот Догма-Твердь-11',
    folkName: 'Каменный Закон',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Оплот',
    suffixTag: '-11',
    note: 'Идеологический и индустриальный оплот власти Диктатора в дальнем созвездии',
    categoryId: 7,
  },

  // --- Слот 49 (Малая Медведица: Ахфа аль Фаркадайн ζ UMi) — Замыкает первые 200 планет! ---
  {
    name: 'Наместничество Регент-Сфера-03',
    officialName: 'Наместничество Регент-Сфера-03',
    folkName: 'Малый Трон',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Наместничество',
    suffixTag: '-03',
    note: 'Резиденция верховного регента сектора с аграрными куполами и запасами железа',
    categoryId: 7,
  },
  {
    name: 'Внешний Протекторат-9',
    officialName: 'Внешний Протекторат-9',
    folkName: 'Данник Диктатора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Протекторат',
    suffixTag: '-9',
    note: 'Внешний протекторат Империи с интенсивной добычей руды и алюминия',
    categoryId: 7,
  },
  {
    name: 'Дворцовый Мир Абсолют-Трон-01',
    officialName: 'Дворцовый Мир Абсолют-Трон-01',
    folkName: 'Титановый Венец',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Дворцовый Мир',
    suffixTag: '-01',
    note: 'Планета монументальных дворцов Диктатора из полированного титана и базальта',
    categoryId: 7,
  },
  {
    name: 'Рубеж Омега-Корона-200',
    officialName: 'Пограничный Сектор Омега-Корона-200',
    folkName: 'Двухсотый Рубеж',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-200',
    note: 'Двухсотый замыкающий мир Основного Реестра Стандартной Системы — пограничная корона владений Диктатора',
    categoryId: 7,
  },

  // ==========================================================================
  // ДОПОЛНИТЕЛЬНЫЕ УНИКАЛЬНЫЕ МИРЫ СОЗВЕЗДИЙ (СЛОТЫ 50..70 · ПЛАНЕТЫ #201..#284)
  // Чтобы КАЖДАЯ из 65 звёзд всех 10 созвездий имела свои 4 неповторимые планеты!
  // ==========================================================================

  // --- Слот 50 (Малая Медведица: Анвар аль Фаркадайн η UMi) ---
  {
    name: 'Объект Стромгрена-b',
    officialName: 'Объект Стромгрена-b',
    folkName: 'Плазменный Фонарь',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-b',
    note: 'Внутренняя раскалённая сфера ионизации Стромгрена с добычей чистого железа (Fe)',
    categoryId: 7,
  },
  {
    name: 'Кеплер-442b (Полярный Криолит)',
    officialName: 'Кеплер-442b',
    folkName: 'Серебрянка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Кеплер-',
    suffixTag: '-442b',
    note: 'Суперземля под контролем Научного Конклава с богатыми залежами алюминиевого криолита',
    categoryId: 2,
  },
  {
    name: 'Колония Вейланд-88 (Оазис Полюса)',
    officialName: 'Колония Вейланд-88',
    folkName: 'Тёплый Купол',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-88',
    note: 'Аграрно-водная база Корпорации Вейланд на перекрёстке маршрутов Малого Ковша',
    categoryId: 4,
  },
  {
    name: 'Притон «Ржавый Якорь»',
    officialName: 'Сектор Консервации УМи-19',
    folkName: 'Ржавый Якорь',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-19',
    note: 'Пиратский титановый док на внешней орбите, замаскированный под старый рудник Империи',
    categoryId: 6,
  },

  // --- Слот 51 (Малая Медведица: Феркад γ UMi) ---
  {
    name: 'Рудник Корпорации «Тардис-Феррум-12»',
    officialName: 'Рудник Корпорации «Тардис-12»',
    folkName: 'Кирка Диктатора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-12',
    note: 'Глубокий железорудный разрез Корпорации «Тардис» у белого гиганта Феркад',
    categoryId: 3,
  },
  {
    name: 'Сфера Чандрасекара-c',
    officialName: 'Сфера Чандрасекара-c',
    folkName: 'Белый Предел',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Сфера',
    suffixTag: '-c',
    note: 'Лабораторный мир изучения критической массы и синтеза авиационных сплавов Al',
    categoryId: 7,
  },
  {
    name: 'Агро-Колония Новая-Аркадия-5',
    officialName: 'Новая-Аркадия-5',
    folkName: 'Медовая Долина',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-5',
    note: 'Терраформированный водно-зерновой мир снабжения полярных эскадр Диктатора',
    categoryId: 4,
  },
  {
    name: 'Бухта «Волчий Клык»',
    officialName: 'Гарнизон Феркад-4',
    folkName: 'Волчий Клык',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Гарнизон',
    suffixTag: '-4',
    note: 'Скалистая титановая планета с тайными ангарами контрабандистов в разломах коры',
    categoryId: 6,
  },

  // --- Слот 52 (Малая Медведица: Кохаб β UMi) ---
  {
    name: 'Бастион Страж-Полюса-01',
    officialName: 'Бастион Страж-Полюса-01',
    folkName: 'Оранжевый Дозор',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Бастион',
    suffixTag: '-01',
    note: 'Главный форпост железного литья у оранжевого гиганта Кохаб («Страж Полюса»)',
    categoryId: 3,
  },
  {
    name: 'Точка Лагранжа-L2 (Кохаб-Al)',
    officialName: 'Точка Лагранжа-L2',
    folkName: 'Весы Учёных',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Точка Лагранжа',
    suffixTag: '-L2',
    note: 'Гравитационно-стабилизированный планетоид алюминиевых верфей Научного Конклава',
    categoryId: 7,
  },
  {
    name: 'Гидро-Сектор Полярная-Купель-3',
    officialName: 'Сектор Полярная-Купель-3',
    folkName: 'Живая Вода',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-3',
    note: 'Океанический мир под тёплым оранжевым солнцем, богатый пресной водой и рыбой',
    categoryId: 4,
  },
  {
    name: 'Перевал «Битый Компас»',
    officialName: 'Рудный Периметр Кохаб-9',
    folkName: 'Битый Компас',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Периметр',
    suffixTag: '-9',
    note: 'Магнитно-аномальная титановая планета, где сбиваются гироскопы таможенных патрулей',
    categoryId: 6,
  },

  // --- Слот 53 (Кассиопея: Каф β Cas) ---
  {
    name: 'Колония Вейланд-15 (Каф-Феррум)',
    officialName: 'Колония Вейланд-15',
    folkName: 'Горячий Шов',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-15',
    note: 'Первая железорудная колония Корпорации Вейланд в рукаве Кассиопеи',
    categoryId: 3,
  },
  {
    name: 'Спектр Бальмера-b',
    officialName: 'Спектр Бальмера-b',
    folkName: 'Голубая Линия',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Спектр',
    suffixTag: '-b',
    note: 'Астрофизический полигон и завод сверхлёгких алюминиевых обшивок',
    categoryId: 7,
  },
  {
    name: 'Курорт Корона-Кассиопеи-3',
    officialName: 'Сектор Корона-Кассиопеи-3',
    folkName: 'Трон Царицы',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-3',
    note: 'Элитный водно-аграрный мир наместника Диктатора в созвездии Кассиопеи',
    categoryId: 4,
  },
  {
    name: 'Рудник «Чёртова Наковальня»',
    officialName: 'Директория Титан-Каф-44',
    folkName: 'Чёртова Наковальня',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Директория',
    suffixTag: '-44',
    note: 'Тяжёлый титановый рудник, где каторжники и вольные старатели делят выработку',
    categoryId: 3,
  },

  // --- Слот 54 (Кассиопея: Шедар α Cas) ---
  {
    name: 'Имперский Литейный Узел Шедар-01',
    officialName: 'Литейный Узел Шедар-01',
    folkName: 'Красная Домна',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Литейный Узел',
    suffixTag: '-01',
    note: 'Гигантский металлургический мир на внутренней орбите оранжевого гиганта Шедар',
    categoryId: 3,
  },
  {
    name: 'Кеплер-62e (Шедар-Алюминий)',
    officialName: 'Кеплер-62e',
    folkName: 'Сизое Крыло',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Кеплер-',
    suffixTag: '-62e',
    note: 'Научно-промышленная колония выплавки крылатого металла для шаттлов «Буран»',
    categoryId: 2,
  },
  {
    name: 'Житница Золотой-Пояс-7',
    officialName: 'Агро-Сектор Золотой-Пояс-7',
    folkName: 'Сытый Берег',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Сектор',
    suffixTag: '-7',
    note: 'Плодородная планета золотых хлебов и чистых ледниковых рек',
    categoryId: 4,
  },
  {
    name: 'Тупик «Кривая Гайка»',
    officialName: 'Ремонтный Сектор Шедар-13',
    folkName: 'Кривая Гайка',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Ремонтный Сектор',
    suffixTag: '-13',
    note: 'Планета кустарных титановых доков и перебивки бортовых номеров кораблей',
    categoryId: 6,
  },

  // --- Слот 55 (Кассиопея: Нави γ Cas) ---
  {
    name: 'Радиус Шварцшильда-a',
    officialName: 'Радиус Шварцшильда-a',
    folkName: 'Тёмный Обод',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Радиус',
    suffixTag: '-a',
    note: 'Экстремальная научная станция-планета у горячего голубого субгиганта Нави',
    categoryId: 7,
  },
  {
    name: 'Навигационный Эталон Нави-b',
    officialName: 'Эталон Нави-b',
    folkName: 'Гироскоп Астронавтов',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эталон',
    suffixTag: '-b',
    note: 'Планета калибровки звёздных секстантов и производства алюминиевых зеркал',
    categoryId: 7,
  },
  {
    name: 'Аква-Мир Лазурный-Шторм-4',
    officialName: 'Аква-Сектор Лазурный-Шторм-4',
    folkName: 'Солёная Пена',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Аква-Сектор',
    suffixTag: '-4',
    note: 'Бурный океанический мир с плавучими заводами опреснения воды и сбора водорослей',
    categoryId: 4,
  },
  {
    name: 'Рудник Корпорации «Тардис-Титан-8»',
    officialName: 'Рудник Корпорации «Тардис-8»',
    folkName: 'Синяя Выработка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-8',
    note: 'Высокотехнологичный титановый рудник под синим излучением звезды Нави',
    categoryId: 3,
  },

  // --- Слот 56 (Кассиопея: Рукбах δ Cas) ---
  {
    name: 'Притон «Сбитый Прицел»',
    officialName: 'Сектор Рукбах-02',
    folkName: 'Сбитый Прицел',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-02',
    note: 'Железорудная планета в затменно-переменной системе, где пираты атакуют в фазе тени',
    categoryId: 6,
  },
  {
    name: 'Колония Вейланд-31 (Рукбах-Al)',
    officialName: 'Колония Вейланд-31',
    folkName: 'Белая Пыль',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-31',
    note: 'Бокситово-глинозёмная колония Корпорации Вейланд со строгим пропускным режимом',
    categoryId: 3,
  },
  {
    name: 'Био-Купол Затмение-3',
    officialName: 'Био-Купол Затмение-3',
    folkName: 'Ночная Роса',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Купол',
    suffixTag: '-3',
    note: 'Аграрный мир с периодическими затмениями светила и биолюминесцентными садами',
    categoryId: 4,
  },
  {
    name: 'Кордон «Железный Крюк»',
    officialName: 'Пограничный Форпост Рукбах-9',
    folkName: 'Железный Крюк',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Форпост',
    suffixTag: '-9',
    note: 'Суровая титановая застава контрабандистов на границе сектора Кассиопеи',
    categoryId: 6,
  },

  // --- Слот 57 (Кассиопея: Сегин ε Cas) ---
  {
    name: 'Объект Доплера-a',
    officialName: 'Объект Доплера-a',
    folkName: 'Синий Сдвиг',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-a',
    note: 'Быстровращающаяся внутренняя планета железных руд у голубого гиганта Сегин',
    categoryId: 7,
  },
  {
    name: 'Предел Роша-b',
    officialName: 'Предел Роша-b',
    folkName: 'Разорванное Кольцо',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Предел Роша',
    suffixTag: '-b',
    note: 'Планета на границе приливного разрушения с богатейшими выходами алюминия на поверхность',
    categoryId: 5,
  },
  {
    name: 'Океан-Колония Сегин-Аква-5',
    officialName: 'Колония Сегин-Аква-5',
    folkName: 'Голубой Гейзер',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-5',
    note: 'Планета тёплых подлёдных морей и гейзеров чистейшей питьевой воды',
    categoryId: 4,
  },
  {
    name: 'Сектор Омега-14 (Сегин-Титан)',
    officialName: 'Сектор Омега-14',
    folkName: 'Дальний Шпиль',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-14',
    note: 'Имперский титановый бастион на краю звёздного рукава Персея—Кассиопеи',
    categoryId: 3,
  },

  // --- Слот 58 (Кассиопея: Ахирд η Cas) ---
  {
    name: 'Новая Земля-4 (Ахирд-Феррум)',
    officialName: 'Новая Земля-4',
    folkName: 'Чугунка',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Новая Земля',
    suffixTag: '-4',
    note: 'Планета у солнцеподобной звезды Ахирд, застроенная сталелитейными домнами Диктатора',
    categoryId: 3,
  },
  {
    name: 'Колония Вейланд-12 (Ахирд-Боксит)',
    officialName: 'Колония Вейланд-12',
    folkName: 'Фольга',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-12',
    note: 'Образцовая корпоративная колония прокатки авиационного алюминия',
    categoryId: 3,
  },
  {
    name: 'Земля-Двойник Ахирд-c',
    officialName: 'Эeta-Кассиопеи-c',
    folkName: 'Вторая Родина',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эeta-',
    suffixTag: '-c',
    note: 'Удивительно похожая на Землю третья планета жёлтой звезды G0 V с лесами и океанами',
    categoryId: 4,
  },
  {
    name: 'Приют «Тихая Гавань»',
    officialName: 'Сектор Снабжения Ахирд-8',
    folkName: 'Тихая Гавань',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-8',
    note: 'Уютный титановый космопорт, где мирно уживаются рудовозы Империи и вольные шкиперы',
    categoryId: 6,
  },

  // --- Слот 59 (Лебедь: Денеб α Cyg) ---
  {
    name: 'Имперская Кузница Денеб-Прайм-01',
    officialName: 'Кузница Денеб-Прайм-01',
    folkName: 'Белое Каление',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Кузница',
    suffixTag: '-01',
    note: 'Планета под ослепительным светом сверхгиганта Денеб, плавящая железо солнечными зеркалами',
    categoryId: 3,
  },
  {
    name: 'Объект Сверхсветимости Денеб-b',
    officialName: 'Объект Денеб-b',
    folkName: 'Слепящий Луч',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-b',
    note: 'Научно-промышленная база фотонной энергетики и зеркального алюминия',
    categoryId: 7,
  },
  {
    name: 'Агро-Ковчег Северный-Крест-3',
    officialName: 'Агро-Ковчег Северный-Крест-3',
    folkName: 'Лебединое Озеро',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Ковчег',
    suffixTag: '-3',
    note: 'Водно-зерновая жемчужина созвездия Лебедя под многослойным УФ-экраном',
    categoryId: 4,
  },
  {
    name: 'Бастион Корпорации «Тардис-Денеб-9»',
    officialName: 'Бастион «Тардис-Денеб-9»',
    folkName: 'Крыло Титана',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Бастион Корпорации',
    suffixTag: '-9',
    note: 'Главный арсенал титановых бронеплит в секторе Северного Креста',
    categoryId: 3,
  },

  // --- Слот 60 (Лебедь: Садр γ Cyg) ---
  {
    name: 'Сектор Омега-21 (Садр-Центр)',
    officialName: 'Сектор Омега-21',
    folkName: 'Перекрёсток Креста',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-21',
    note: 'Центральный железорудный узел на перекрестье крыльев созвездия Лебедя',
    categoryId: 3,
  },
  {
    name: 'Туманный Объект Садр-γ',
    officialName: 'Объект Гамма-Лебедя-γ',
    folkName: 'Алый Туман',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-γ',
    note: 'Планета посреди эмиссионной туманности вокруг Садра, богатая соединениями алюминия',
    categoryId: 5,
  },
  {
    name: 'Био-Сфера Садр-Оазис-4',
    officialName: 'Био-Сфера Садр-Оазис-4',
    folkName: 'Жёлтый Сад',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Сфера',
    suffixTag: '-4',
    note: 'Цветущий мир гидропонных куполов и пресных водохранилищ в сердце Лебедя',
    categoryId: 4,
  },
  {
    name: 'Притон «Пьяный Шлюз»',
    officialName: 'Транзитный Док Садр-16',
    folkName: 'Пьяный Шлюз',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Транзитный Док',
    suffixTag: '-16',
    note: 'Знаменитая перевалочная планета контрабандистов титана и редких кристаллов',
    categoryId: 6,
  },

  // --- Слот 61 (Лебедь: Альбирео β Cyg) ---
  {
    name: 'Двойной Свет Альбирео-А-01',
    officialName: 'Колония Альбирео-А-01',
    folkName: 'Янтарь и Сапфир',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-01',
    note: 'Планета под золотисто-голубым светом двойной звезды Альбирео с богатыми недрами Fe',
    categoryId: 1,
  },
  {
    name: 'Спектральный Узел Альбирео-b',
    officialName: 'Спектральный Узел Альбирео-b',
    folkName: 'Двуцветная Тень',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Спектральный Узел',
    suffixTag: '-b',
    note: 'Научная база изучения двойных звёзд и производства композитного алюминия',
    categoryId: 7,
  },
  {
    name: 'Курорт Лагуна-Альбирео-7',
    officialName: 'Курортный Сектор Альбирео-7',
    folkName: 'Райский Клюв',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Курортный Сектор',
    suffixTag: '-7',
    note: 'Живописный курортный и водоснабжающий мир на острие «клюва» Лебедя',
    categoryId: 4,
  },
  {
    name: 'Рудник «Золотая Жила»',
    officialName: 'Директория Альбирео-Титан-12',
    folkName: 'Золотая Жила',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Директория',
    suffixTag: '-12',
    note: 'Богатейшая титано-золотоносная планета, за которую спорят синдикаты и гвардия Диктатора',
    categoryId: 6,
  },

  // --- Слот 62 (Лебедь: Гиенах ε Cyg) ---
  {
    name: 'Колония Вейланд-56 (Гиенах-Fe)',
    officialName: 'Колония Вейланд-56',
    folkName: 'Левое Крыло',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-56',
    note: 'Железорудная колония Корпорации Вейланд на восточном крыле Лебедя',
    categoryId: 3,
  },
  {
    name: 'Свалка-Док «Общипанное Перо»',
    officialName: 'Утиль-База Гиенах-4',
    folkName: 'Общипанное Перо',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Утиль-База',
    suffixTag: '-4',
    note: 'Планета разборки подбитых звездолётов на авиационный алюминий и обшивку',
    categoryId: 6,
  },
  {
    name: 'Агро-Пояс Оранжевый-Бриз-3',
    officialName: 'Агро-Пояс Оранжевый-Бриз-3',
    folkName: 'Тёплый Паек',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Пояс',
    suffixTag: '-3',
    note: 'Спокойная фермерская планета у оранжевого гиганта Гиенах',
    categoryId: 4,
  },
  {
    name: 'Форпост «Стальной Коготь»',
    officialName: 'Гарнизон Гиенах-Титан-9',
    folkName: 'Стальной Коготь',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Гарнизон',
    suffixTag: '-9',
    note: 'Укреплённый титановый рудник на границе пиратских маршрутов Лебедя',
    categoryId: 6,
  },

  // --- Слот 63 (Лебедь: Фаварес δ Cyg) ---
  {
    name: 'Тройной Узел Фаварес-a',
    officialName: 'Тройной Узел Фаварес-a',
    folkName: 'Три Солнца',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Тройной Узел',
    suffixTag: '-a',
    note: 'Внутренняя железная планета в тройной бело-голубой системе Фаварес',
    categoryId: 7,
  },
  {
    name: 'Кеплер-22b (Фаварес-Алюм)',
    officialName: 'Кеплер-22b',
    folkName: 'Голубая Слюда',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Кеплер-',
    suffixTag: '-22b',
    note: 'Богатая алюминиевыми силикатами экзопланета западного крыла Лебедя',
    categoryId: 2,
  },
  {
    name: 'Океан-Станция Фаварес-Гидро-6',
    officialName: 'Станция Фаварес-Гидро-6',
    folkName: 'Большой Бак',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Станция',
    suffixTag: '-6',
    note: 'Планета-водохранилище для заправки дальних конвоев Диктатора водой и O₂',
    categoryId: 4,
  },
  {
    name: 'Рудник Корпорации «Тардис-Крыло-4»',
    officialName: 'Рудник Корпорации «Тардис-Крыло-4»',
    folkName: 'Серая Твердь',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-4',
    note: 'Высокогорный комплекс добычи губчатого титана и редких земель',
    categoryId: 3,
  },

  // --- Слот 64 (Лебедь: Азадифар ζ Cyg) ---
  {
    name: 'Бариевый Объект Азадифар-a',
    officialName: 'Бариевый Объект Азадифар-a',
    folkName: 'Тяжёлая Пыль',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Бариевый Объект',
    suffixTag: '-a',
    note: 'Планета у бариевого гиганта, обогащённая железом и тяжёлыми элементами s-процесса',
    categoryId: 5,
  },
  {
    name: 'Притон «Медный Грош»',
    officialName: 'Сектор Азадифар-2',
    folkName: 'Медный Грош',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-2',
    note: 'Дешёвый контрабандистский рынок алюминиевого проката и запчастей',
    categoryId: 6,
  },
  {
    name: 'Колония Новая-Кубань-11',
    officialName: 'Агро-Колония Новая-Кубань-11',
    folkName: 'Хлебный Каравай',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Агро-Колония',
    suffixTag: '-11',
    note: 'Чернозёмная терраформированная планета с избытком зерна и пресной воды',
    categoryId: 4,
  },
  {
    name: 'Застава «Волчья Яма»',
    officialName: 'Каторжный Рудник Азадифар-7',
    folkName: 'Волчья Яма',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Каторжный Рудник',
    suffixTag: '-7',
    note: 'Суровый титановый карьер на краю созвездия Лебедя',
    categoryId: 6,
  },

  // --- Слот 65 (Лира: Вега α Lyr) ---
  {
    name: 'Эталон-Колония Вега-Прайм-01',
    officialName: 'Эталон-Колония Вега-Прайм-01',
    folkName: 'Голубой Бриллиант',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эталон-Колония',
    suffixTag: '-01',
    note: 'Главная научная и металлургическая база вокруг эталонной звезды Вега (α Lyr)',
    categoryId: 7,
  },
  {
    name: 'Осколочный Диск Вега-b',
    officialName: 'Объект Вега-Диск-b',
    folkName: 'Серебряное Сито',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-b',
    note: 'Планета внутри протопланетного пылевого диска Веги с промышленным сбором алюминия',
    categoryId: 7,
  },
  {
    name: 'Сапфировый Курорт Вега-Аква-3',
    officialName: 'Курортный Доминион Вега-Аква-3',
    folkName: 'Синяя Жемчужина',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Доминион',
    suffixTag: '-3',
    note: 'Роскошная океаническая планета под сияющим бело-голубым небом Веги',
    categoryId: 4,
  },
  {
    name: 'Сектор Омега-9 (Вега-Титан)',
    officialName: 'Сектор Омега-9',
    folkName: 'Звёздный Молот',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Сектор',
    suffixTag: '-9',
    note: 'Крупнейший имперский завод титановой брони в Навигационном Треугольнике',
    categoryId: 3,
  },

  // --- Слот 66 (Лира: Эпсилон Лиры ε Lyr) ---
  {
    name: 'Квадруполь Эпсилон-Лиры-a',
    officialName: 'Эпсилон-Лиры-a',
    folkName: 'Четыре Заката',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Эпсилон-',
    suffixTag: '-a',
    note: 'Уникальная железорудная планета в четырёхкратной системе «Двойная двойная»',
    categoryId: 7,
  },
  {
    name: 'Резонанс Лиры-b',
    officialName: 'Резонанс Лиры-b',
    folkName: 'Качели Гравитации',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Резонанс',
    suffixTag: '-b',
    note: 'Мир сложных приливных орбит с открытыми карьерами бокситов и алюминия',
    categoryId: 5,
  },
  {
    name: 'Био-Станция Гармония-Лиры-3',
    officialName: 'Био-Станция Гармония-Лиры-3',
    folkName: 'Четыре Весны',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Био-Станция',
    suffixTag: '-3',
    note: 'Аграрная планета, где никогда не наступает полная ночь благодаря 4 светилам',
    categoryId: 4,
  },
  {
    name: 'Рудник Корпорации «Тардис-Лира-16»',
    officialName: 'Рудник Корпорации «Тардис-16»',
    folkName: 'Струна Титана',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-16',
    note: 'Корпоративный комплекс вытяжки титановых тросов для орбитальных лифтов',
    categoryId: 3,
  },

  // --- Слот 67 (Лира: Дзета Лиры ζ Lyr) ---
  {
    name: 'Колония Вейланд-64 (Дзета-Феррум)',
    officialName: 'Колония Вейланд-64',
    folkName: 'Литейный Двор',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-64',
    note: 'Богатая металлами планета у спектрально-металлической звезды Am Дзета Лиры',
    categoryId: 3,
  },
  {
    name: 'Металл-Объект Дзета-Лиры-b',
    officialName: 'Объект Дзета-Лиры-b',
    folkName: 'Зеркальная Корка',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-b',
    note: 'Планета с естественными алюминиево-кремниевыми плато на поверхности',
    categoryId: 7,
  },
  {
    name: 'Продбаза Струна-Жизни-5',
    officialName: 'Продбаза Струна-Жизни-5',
    folkName: 'Тёплый Хлеб',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Продбаза',
    suffixTag: '-5',
    note: 'Главный склад продовольствия и питьевой воды для патрулей созвездия Лиры',
    categoryId: 4,
  },
  {
    name: 'Притон «Оборванная Струна»',
    officialName: 'Сектор Дзета-Лиры-9',
    folkName: 'Оборванная Струна',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Сектор',
    suffixTag: '-9',
    note: 'Свободный порт старателей и контрабандистов титана в тени астероидного пояса',
    categoryId: 6,
  },

  // --- Слот 68 (Лира: Шелиак β Lyr) ---
  {
    name: 'Контактный Тор Шелиак-a',
    officialName: 'Объект Шелиак-Аккреция-a',
    folkName: 'Огненный Мост',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-a',
    note: 'Планета вблизи контактно-двойной звезды Шелиак, где газ перетекает между светилами',
    categoryId: 5,
  },
  {
    name: 'Приливной Сектор Шелиак-2',
    officialName: 'Приливной Сектор Шелиак-2',
    folkName: 'Летучий Шлак',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Приливной Сектор',
    suffixTag: '-2',
    note: 'Опасный мир пепловых бурь и открытой добычи дешёвого алюминия',
    categoryId: 6,
  },
  {
    name: 'Подземный Оазис Шелиак-Гидро-3',
    officialName: 'Бункер-Оазис Шелиак-3',
    folkName: 'Тайный Колодец',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Бункер-Оазис',
    suffixTag: '-3',
    note: 'Глубинные пещерные моря пресной воды и грибные фермы вольных капитанов',
    categoryId: 6,
  },
  {
    name: 'Каторга-Блок Шелиак-88',
    officialName: 'Каторга-Блок Шелиак-88',
    folkName: 'Плаха Диктатора',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Каторга-Блок',
    suffixTag: '-88',
    note: 'Режимный титановый рудник Диктатора под жёстким излучением затменной двойной',
    categoryId: 3,
  },

  // --- Слот 69 (Лира: Сулафат γ Lyr) ---
  {
    name: 'Директория Сулафат-Феррум-05',
    officialName: 'Директория Сулафат-05',
    folkName: 'Панцирь Черепахи',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Директория',
    suffixTag: '-05',
    note: 'Планета, названная в честь древнего значения звезды Сулафат («Черепаха»), покрытая броневыми заводами Fe',
    categoryId: 3,
  },
  {
    name: 'Колония Вейланд-72 (Сулафат-Al)',
    officialName: 'Колония Вейланд-72',
    folkName: 'Серебряный Щит',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Колония',
    suffixTag: '-72',
    note: 'Авиакосмический комбинат крылатых металлов и радиаторов охлаждения',
    categoryId: 3,
  },
  {
    name: 'Терра-Сад Сулафат-Оазис-3',
    officialName: 'Терра-Сад Сулафат-3',
    folkName: 'Лазурный Берег Лиры',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Терра-Сад',
    suffixTag: '-3',
    note: 'Цветущий водно-аграрный мир под голубым гигантом Сулафат',
    categoryId: 4,
  },
  {
    name: 'Сфера Стромгрена-f (Сулафат-Титан)',
    officialName: 'Сфера Стромгрена-f',
    folkName: 'Синий Купол',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Сфера',
    suffixTag: '-f',
    note: 'Научно-производственный титановый полигон на внешней границе системы',
    categoryId: 7,
  },

  // --- Слот 70 (Лира: Аладфар η Lyr) ---
  {
    name: 'Объект Аладфар-a (Коготь Орла)',
    officialName: 'Объект Аладфар-a',
    folkName: 'Раскалённый Коготь',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Объект',
    suffixTag: '-a',
    note: 'Внутренняя железорудная планета у далёкого бело-голубого субгиганта Аладфар',
    categoryId: 7,
  },
  {
    name: 'Кеплер-452b (Аладфар-Алюминий)',
    officialName: 'Кеплер-452b',
    folkName: 'Старший Брат',
    factionId: 'SCIENTIFIC',
    prefixTag: 'Кеплер-',
    suffixTag: '-452b',
    note: 'Древняя скалистая экзопланета с богатыми выходами бокситов и корунда',
    categoryId: 2,
  },
  {
    name: 'Ковчег Дальний-Предел-3',
    officialName: 'Ковчег Дальний-Предел-3',
    folkName: 'Последний Колодец',
    factionId: 'PIRATE_FREE',
    prefixTag: 'Ковчег',
    suffixTag: '-3',
    note: 'Самая дальняя обитаемая водно-продовольственная база (1390 св. лет) в созвездии Лиры',
    categoryId: 4,
  },
  {
    name: 'Рудник Корпорации «Тардис-Финал-71»',
    officialName: 'Рудник Корпорации «Тардис-71»',
    folkName: 'Крайняя Наковальня',
    factionId: 'CORP_EMPIRE',
    prefixTag: 'Рудник Корпорации',
    suffixTag: '-71',
    note: 'Замыкающий титановый бастион всех 10 созвездий Стандартной Системы Диктатора',
    categoryId: 3,
  },
];

// ============================================================================
// УНИКАЛЬНЫЕ НАЗВАНИЯ ДЛЯ ВСЕХ ЗВЁЗД СМЕРТИ (V. ЗВЕЗДА СМЕРТИ) И КОСМИЧЕСКИХ СТАНЦИЙ
// (VI. КОРАБЛЬ-ТОР «БУБЛИК» / СТАНЦИЯ CORIOLIS / VII. ЗВЁЗДНЫЕ ВРАТА)
// С СИСТЕМОЙ ФРАКЦИОННЫХ ПРЕФИКСОВ, СУФФИКСОВ И ДВОЙНЫХ ИМЁН (ОФИЦИАЛЬНО + В НАРОДЕ)
// ============================================================================
const DEATH_STAR_OFFICIAL_TEMPLATES: Record<PlanetFactionId, string[]> = {
  CORP_EMPIRE: [
    'Цитадель Диктата ДС-{num} «Возмездие Вейланд»',
    'Орбитальный Каратель Империи ДС-{num} «Железный Трибунал»',
    'Боевой Планетоид Корпорации «Тардис-ДС-{num}»',
    'Сектор-Крепость Омега-ДС-{num} «Молот Диктатора»',
    'Гвардейский Бастион Аннигиляции ДС-{num}',
  ],
  PIRATE_FREE: [
    'Трофейный Планетоид Вольницы ДС-{num} «Корсар-Монолит»',
    'Карательный Редут Фронтира ДС-{num} «Чёрная Метка»',
    'Броне-Сфера Контрабандистов ДС-{num} «Стальной Череп»',
    'Бастион Комендатуры Фронтира ДС-{num} «Уздечка Пиратов»',
  ],
  SCIENTIFIC: [
    'Объект Гравитационной Фокусировки Стромгрена-ДС-{num}Ω',
    'Квантовый Планетоид Лагранжа ДС-{num}α',
    'Астрофизический Полигон Суперлазера «Кеплер-ДС-{num}»',
    'Сфера Вынужденной Диссипации Шварцшильда-ДС-{num}γ',
  ],
};

const DEATH_STAR_FOLK_NAMES: string[] = [
  'Чёрный Череп',
  'Зуб Диктатора',
  'Стеклянный Глаз',
  'Могильщик Сектора',
  'Железное Яблоко',
  'Выжигатель',
  'Звезда-Палач',
  'Свинцовая Луна',
  'Око Тирана',
  'Каменный Кулак',
  'Пепельная Сфера',
  'Костолом-Прайм',
  'Слепая Ярость',
  'Зелёный Луч Смерти',
  'Карающий Шар',
  'Стальной Надзиратель',
  'Убийца Миров',
  'Чёрная Луна',
  'Гробовая Сфера',
  'Кувалда Империи',
];

const SPACE_STATION_OFFICIAL_TEMPLATES: Record<PlanetFactionId, string[]> = {
  CORP_EMPIRE: [
    'Орбитальный Терминал Корпорации «Вейланд-Док-{num}»',
    'Центробежный Ковчег Империи «Сектор-Тор-{num}»',
    'Логистическая Станция Концерна «Тардис-Орбиталь-{num}»',
    'Таможенный Кольцевой Док Диктата «Абсолют-{num}»',
    'Имперская Верфь Искусственной Тяжести «Кольцо-{num}»',
  ],
  PIRATE_FREE: [
    'Свободный Порт Фронтира «Тор-Вольница-{num}»',
    'Контрабандистский Кольцевой Док «Перевал-{num}»',
    'Нейтральная Станция Старателей «Приют-{num}»',
    'Анархический Центробежный Узел «Бухта-{num}»',
  ],
  SCIENTIFIC: [
    'Научная Станция Точки Лагранжа «Кеплер-Тор-{num}b»',
    'Орбитальный Институт Центробежной Биосферы «Эпсилон-{num}c»',
    'Кольцевой Коллайдер Конклава «Объект Стромгрена-Тор-{num}»',
    'Лабораторный Ковчег 1G «Спектр-Орбиталь-{num}α»',
  ],
};

const SPACE_STATION_FOLK_NAMES: string[] = [
  'Жестяной Бублик',
  'Дырявый Шлюз',
  'Карусель Старателей',
  'Золотое Кольцо',
  'Стекляшка',
  'Крутящийся Бочонок',
  'Пьяное Колесо',
  'Таможенная Петля',
  'Шумный Обруч',
  'Вольный Шлюз',
  'Ржавый Обод',
  'Космическая Рулетка',
  'Беличье Колесо',
  'Тихий Причал',
  'Грави-Баранка',
  'Серебряный Тор',
  'Кольцо Надежды',
  'Перевалочная Бочка',
  'Небесный Водоворот',
  'Приют Конвоиров',
];

const ORBIT_ROMANS: Array<'I' | 'II' | 'III' | 'IV'> = ['I', 'II', 'III', 'IV'];

const ORBIT_RESOURCE_SPECIALIZATIONS: Record<1 | 2 | 3 | 4, string> = {
  1: 'I орбита · Железо (Fe) и конструкционные сплавы для ремонта корпуса в гиперпрыжке',
  2: 'II орбита · Алюминий (Al) и композитные обшивки для восстановления после гиперпрыжка',
  3: 'III орбита · Продовольствие (Зерно) и Вода (источник питья и кислорода O₂)',
  4: 'IV орбита · Титан (Ti) и редкие изотопы для бронеплит и дальних гиперпрыжков',
};

const DICTATOR_GARRISON_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: 'Под властью Диктатора · Горно-металлургический гарнизон I орбиты (+5 карательных дронов ПВО)',
  2: 'Под властью Диктатора · Авиакосмический гарнизон II орбиты (+5 карательных дронов ПВО)',
  3: 'Под властью Диктатора · Центральное Наместничество III орбиты (+5 карательных дронов ПВО)',
  4: 'Под властью Диктатора · Внешний Титановый Бастион IV орбиты (+5 карательных дронов ПВО)',
};

export const ALL_STANDARD_CONSTELLATION_PLANETS: StandardDictatorPlanet[] = RAW_PLANET_SEEDS.map(
  (seed, idx) => {
    const index = idx + 1;
    const starSlotIndex = Math.floor(idx / 4); // 0..70 (71 звёздная система × 4 планеты = 284 уникальные планеты)
    const orbitZero = (idx % 4) as 0 | 1 | 2 | 3;
    const orbitOrder = (orbitZero + 1) as 1 | 2 | 3 | 4;
    const orbitRoman = ORBIT_ROMANS[orbitZero];
    const catMeta =
      STANDARD_PLANET_CATEGORIES.find((c) => c.id === seed.categoryId) ||
      STANDARD_PLANET_CATEGORIES[0];
    const factionMeta = PLANET_FACTIONS_META[seed.factionId];
    const sysHeader =
      STAR_SYSTEM_CATALOG_HEADERS[starSlotIndex] || STAR_SYSTEM_CATALOG_HEADERS[0];

    const dualNameLabel = `Официально: «${seed.officialName}», в народе: «${seed.folkName}»`;
    const hudDisplayName = `${seed.officialName} («${seed.folkName}»)`;

    return {
      index,
      dictatorCode: `ДИКТАТ-${String(index).padStart(3, '0')}`,
      name: seed.name,
      officialName: seed.officialName,
      folkName: seed.folkName,
      dualNameLabel,
      hudDisplayName,
      factionId: seed.factionId,
      factionBadge: factionMeta.shortBadge,
      prefixTag: seed.prefixTag,
      suffixTag: seed.suffixTag,
      categoryId: seed.categoryId,
      categoryTitle: `${catMeta.icon} ${catMeta.title}`,
      starSlotIndex,
      starSystemTitle: sysHeader.starName,
      constellationTitle: sysHeader.constellationNameRu,
      orbitOrder,
      orbitRoman,
      resourceSpecialization: ORBIT_RESOURCE_SPECIALIZATIONS[orbitOrder],
      loreDescription: seed.note,
      dictatorRuleTitle: DICTATOR_GARRISON_TITLES[orbitOrder],
    };
  }
);

// Первые 200 планет — канонический реестр 200 уникальных планет Диктатора
export const STANDARD_DICTATOR_200_PLANETS: StandardDictatorPlanet[] =
  ALL_STANDARD_CONSTELLATION_PLANETS.slice(0, 200);

/**
 * Создаёт уникальные данные Боевого планетоида «Звезда Смерти» для звёздной системы (0..72)
 */
export function getDeathStarMetaForSlot(slotIndex: number): StandardDeathStarMeta {
  const safeSlot = ((slotIndex % STAR_SYSTEM_CATALOG_HEADERS.length) + STAR_SYSTEM_CATALOG_HEADERS.length) % STAR_SYSTEM_CATALOG_HEADERS.length;
  const sysHeader = STAR_SYSTEM_CATALOG_HEADERS[safeSlot];
  const factionId = sysHeader.dominantFactionId;
  const factionMeta = PLANET_FACTIONS_META[factionId];
  const numStr = String(safeSlot + 1).padStart(2, '0');
  const shortStar = sysHeader.starName.split('(')[0].split('·')[0].trim();

  const tplList = DEATH_STAR_OFFICIAL_TEMPLATES[factionId];
  const baseOfficial = tplList[safeSlot % tplList.length].replace('{num}', numStr);
  const officialName = `Производственный комплекс «${baseOfficial}» · ${shortStar}`;
  const folkName = `Производитель (Титановая броня, Дюрасталь, Фотонные орудия, Плазменные реакторы, Гиперматерия)`;
  const dualNameLabel = `Производитель: «${officialName}» (Титановая броня, Дюрасталь, Фотонные орудия, Плазменные реакторы, Гиперматерия)`;

  return {
    code: `ПР-${numStr}`,
    factionId,
    factionBadge: factionMeta.shortBadge,
    officialName,
    folkName,
    dualNameLabel,
    hudName: `Производитель (Титановая броня, Дюрасталь, Фотонные орудия, Реакторы)`,
    superlaserSpec: `Тяжёлый индустриальный комплекс «Производитель» в системе «${sysHeader.starName}» (${sysHeader.constellationNameRu}). Выпускаемая продукция: титановая броня, дюрасталь, фотонные орудия, плазменные реакторы, гиперматерия. Прямой отпуск по заводским ценам и переработка сырой руды со скидкой 40%.`,
  };
}

/**
 * Создаёт уникальные данные Станции «Бублик» (Бизнес-центр) и Звёздных Врат для звёздной системы (0..72)
 */
export function getSpaceStationMetaForSlot(slotIndex: number): StandardSpaceStationMeta {
  const safeSlot = ((slotIndex % STAR_SYSTEM_CATALOG_HEADERS.length) + STAR_SYSTEM_CATALOG_HEADERS.length) % STAR_SYSTEM_CATALOG_HEADERS.length;
  const sysHeader = STAR_SYSTEM_CATALOG_HEADERS[safeSlot];
  const factionId = sysHeader.dominantFactionId;
  const factionMeta = PLANET_FACTIONS_META[factionId];
  const numStr = String(safeSlot + 1).padStart(2, '0');
  const shortStar = sysHeader.starName.split('(')[0].split('·')[0].trim();

  const tplList = SPACE_STATION_OFFICIAL_TEMPLATES[factionId];
  const baseOfficial = tplList[safeSlot % tplList.length].replace('{num}', numStr);
  const officialName = `Бизнес-центр «Бублик» (${baseOfficial} · ${shortStar})`;
  const folkName = `Бизнес-центр (ТД «Антарес», Астро-Логистика, Орбитал-Ритейл, Квант-Сервис, Био-Сфера)`;
  const dualNameLabel = `Бизнес-центр «Бублик» (ТД «Антарес», Астро-Логистика, Орбитал-Ритейл, Квант-Сервис, Био-Сфера)`;

  return {
    code: `БЦ-${numStr}`,
    factionId,
    factionBadge: factionMeta.shortBadge,
    officialName,
    folkName,
    dualNameLabel,
    hudName: `Бизнес-центр «Бублик» (ТД Антарес, Астро-Логистика, Орбитал-Ритейл, Квант-Сервис, Био-Сфера)`,
    coriolisStationName: `Орбитальная Станция Кориолис · Банк`,
    stargateDesignation: `Портал Звёздных Врат ВР-${numStr} «${shortStar} · 9 Шевронов»`,
    stationLore: `Орбитальный Бизнес-центр «Бублик» с центробежной силой тяжести 1G и 4 внутренними лучами-переходами в системе «${sysHeader.starName}» (${sysHeader.constellationNameRu}). Присутствующие бизнесы: ТД «Антарес», Астро-Логистика, Орбитал-Ритейл, Квант-Сервис, Био-Сфера.`,
  };
}

/**
 * Детерминированно определяет индекс звёздного слота (0..70) для любой звезды
 * Стандартной Системы (базовые сектора GALAXY_SYSTEMS + все 65 звёзд 10 созвездий неба).
 */
export function resolveStarSlotIndexForSystemKey(systemKey: string): number {
  if (!systemKey) return 0;
  const totalSlots = STAR_SYSTEM_CATALOG_HEADERS.length; // 71

  // 1) Прямой слот вида "slot:0" .. "slot:70"
  if (systemKey.startsWith('slot:')) {
    const num = parseInt(systemKey.slice(5), 10);
    if (!Number.isNaN(num)) {
      return ((num % totalSlots) + totalSlots) % totalSlots;
    }
  }

  // 2) Точное совпадение с systemKey в каталоге (например "sys:0", "constellation-orion:0")
  const exactIdx = STAR_SYSTEM_CATALOG_HEADERS.findIndex((h) => h.systemKey === systemKey);
  if (exactIdx !== -1) {
    return exactIdx;
  }

  // 3) Формат starId из карточки созвездия вида "constellation-orion-star-0"
  const starTagIdx = systemKey.indexOf('-star-');
  if (starTagIdx > 0) {
    const conId = systemKey.slice(0, starTagIdx);
    const starIdx = parseInt(systemKey.slice(starTagIdx + 6), 10) || 0;
    const normalizedKey = `${conId}:${starIdx}`;
    const found = STAR_SYSTEM_CATALOG_HEADERS.findIndex((h) => h.systemKey === normalizedKey);
    if (found !== -1) return found;
  }

  // 4) Поддержка сокращённых префиксов "con-orion:0" -> "constellation-orion:0"
  if (systemKey.startsWith('con-')) {
    const expandedKey = systemKey.replace(/^con-/, 'constellation-');
    const found = STAR_SYSTEM_CATALOG_HEADERS.findIndex((h) => h.systemKey === expandedKey);
    if (found !== -1) return found;
  }

  // 5) Базовые сектора sys:0 .. sys:7
  if (systemKey.startsWith('sys:')) {
    const sysId = parseInt(systemKey.slice(4), 10);
    if (!Number.isNaN(sysId)) {
      return ((sysId % totalSlots) + totalSlots) % totalSlots;
    }
  }

  // 6) Поиск по имени звезды в строке (например "Бетельгейзе (α Ori) · Орион")
  const normalizedQuery = systemKey.toLowerCase();
  for (let i = 0; i < STAR_SYSTEM_CATALOG_HEADERS.length; i++) {
    const h = STAR_SYSTEM_CATALOG_HEADERS[i];
    const baseStarName = h.starName.split('(')[0].trim().toLowerCase();
    if (baseStarName.length >= 3 && normalizedQuery.includes(baseStarName)) {
      return i;
    }
  }

  // Fallback хеш
  let hash = 0;
  for (let i = 0; i < systemKey.length; i++) {
    hash = (hash * 31 + systemKey.charCodeAt(i)) >>> 0;
  }
  return hash % totalSlots;
}

/**
 * Возвращает полный паспорт звёздной системы: 4 уникальные планеты с двойными именами,
 * уникальную Звезду Смерти и уникальную Космическую Станцию.
 */
export function getStarSystemFullAssignment(systemKey: string): StarSystemSlotAssignment {
  const slotIndex = resolveStarSlotIndexForSystemKey(systemKey);
  const sysHeader =
    STAR_SYSTEM_CATALOG_HEADERS[slotIndex] || STAR_SYSTEM_CATALOG_HEADERS[0];
  const baseIdx = slotIndex * 4;
  return {
    slotIndex,
    systemKey: sysHeader.systemKey,
    starName: sysHeader.starName,
    constellationId: sysHeader.constellationId,
    constellationNameRu: sysHeader.constellationNameRu,
    dominantFactionId: sysHeader.dominantFactionId,
    planets: [
      ALL_STANDARD_CONSTELLATION_PLANETS[baseIdx],
      ALL_STANDARD_CONSTELLATION_PLANETS[baseIdx + 1],
      ALL_STANDARD_CONSTELLATION_PLANETS[baseIdx + 2],
      ALL_STANDARD_CONSTELLATION_PLANETS[baseIdx + 3],
    ],
    deathStar: getDeathStarMetaForSlot(slotIndex),
    spaceStation: getSpaceStationMetaForSlot(slotIndex),
  };
}

/**
 * Возвращает 4 уникальные планеты под властью Диктатора для заданного ключа звёздной системы.
 */
export function getStandardDictatorPlanetsForSystemKey(
  systemKey: string
): [
  StandardDictatorPlanet,
  StandardDictatorPlanet,
  StandardDictatorPlanet,
  StandardDictatorPlanet,
] {
  return getStarSystemFullAssignment(systemKey).planets;
}

// ============================================================================
// СИСТЕМА ЗАХВАТА ПЛАНЕТ И ЗВЁЗДНЫХ СИСТЕМ, ПЕРЕИМЕНОВАНИЯ,
// ПРИСОЕДИНЕНИЯ К КЛАНУ / СОЮЗУ И ПОЛУЧЕНИЯ ДОХОДА С ПЛАНЕТЫ:
// Пример: «Метадонг - бывший Шлак-9 · клан Розовой бабочки»
// ============================================================================

export type ClanAffiliationKind = 'CLAN' | 'UNION';

export interface ClanOrUnionPreset {
  id: string;
  kind: ClanAffiliationKind;
  name: string;
  icon: string;
  color: string;
  bonusNote: string;
}

export const CLAN_AND_UNION_PRESETS: ClanOrUnionPreset[] = [
  {
    id: 'pink-butterfly-clan',
    kind: 'CLAN',
    name: 'клан Розовой бабочки',
    icon: '🦋',
    color: '#f472b6',
    bonusNote: '+35 CR / цикл с каждой захваченной планеты клана',
  },
  {
    id: 'free-virpils-union',
    kind: 'UNION',
    name: 'Союз Свободных Вирпилов',
    icon: '🦅',
    color: '#38bdf8',
    bonusNote: '+35 CR / цикл · Воздушное и орбитальное братство пилотов',
  },
  {
    id: 'black-horizon-clan',
    kind: 'CLAN',
    name: 'клан Чёрного Горизонта',
    icon: '🌑',
    color: '#a855f7',
    bonusNote: '+35 CR / цикл · Контроль глубоких гиперпространственных трасс',
  },
  {
    id: 'star-corsairs-union',
    kind: 'UNION',
    name: 'Союз Звёздных Корсаров',
    icon: '🏴‍☠️',
    color: '#fbbf24',
    bonusNote: '+35 CR / цикл · Контрабандные пошлины и свободная торговля',
  },
  {
    id: 'quantum-lotus-clan',
    kind: 'CLAN',
    name: 'клан Квантового Лотоса',
    icon: '🌸',
    color: '#34d399',
    bonusNote: '+35 CR / цикл · Научно-технологический синдикат колоний',
  },
  {
    id: 'ring-armada-union',
    kind: 'UNION',
    name: 'Союз Независимых Систем',
    icon: '🛡️',
    color: '#22d3ee',
    bonusNote: '+35 CR / цикл · Коалиция освобождённых от Диктатора миров',
  },
];

export interface CapturedPlanetClanRecord {
  planetIndex: number; // 1..284
  starSlotIndex: number; // 0..70
  orbitOrder: 1 | 2 | 3 | 4;
  isCaptured: boolean;
  capturedAtMs: number;
  customName: string; // Например: "Метадонг"
  formerName: string; // Например: "Шлак-9"
  formerOfficialName: string; // Например: "Сектор Омега-7"
  affiliationKind: ClanAffiliationKind; // 'CLAN' | 'UNION'
  clanOrUnionName: string; // Например: "клан Розовой бабочки"
  clanIcon: string; // Например: "🦋"
  clanColor: string; // Например: "#f472b6"
  incomePerCycleCr: number; // Базовый доход за цикл (например 35 CR + бонусы инфраструктуры)
  infrastructureLevel: number; // 1..5
  totalEarnedCr: number; // Всего получено дохода с этой планеты
  isSystemFullyAnnexed?: boolean; // Все 4 планеты системы присоединены к клану/союзу
  // Данные Галактического Аукциона планет
  isListedOnAuction?: boolean;
  auctionBiddingRound?: number; // 0..5 раундов повышения ставок
  currentHighestBidCr?: number;
  currentHighestBidder?: string;
  soldOnAuctionAtMs?: number;
  lastSoldPriceCr?: number;
  lastAuctionBuyer?: string;
}

export interface PlanetAuctionBidder {
  id: string;
  name: string;
  badge: string;
  bidMultiplier: number;
}

export const GALACTIC_AUCTION_BIDDERS: PlanetAuctionBidder[] = [
  {
    id: 'pink-butterfly-invest',
    name: 'Казначейство «Клана Розовой бабочки»',
    badge: '🦋 Клан-Инвестор',
    bidMultiplier: 1.25,
  },
  {
    id: 'sirius-trade-union',
    name: 'Торговый Союз Сириуса и Веги',
    badge: '🏛 Межзвёздный Союз',
    bidMultiplier: 1.35,
  },
  {
    id: 'titan-mining-syndicate',
    name: 'Горнорудный Синдикат «Титан-Прайм»',
    badge: '⚙️ Промышленный Трест',
    bidMultiplier: 1.45,
  },
  {
    id: 'free-virpils-bank',
    name: 'Банк Союза Свободных Вирпилов',
    badge: '🦅 Кредитный Альянс',
    bidMultiplier: 1.6,
  },
  {
    id: 'golden-armada-holding',
    name: 'Галактический Холдинг «Золотая Армада»',
    badge: '👑 Премиум-Покупатель',
    bidMultiplier: 1.85,
  },
];

/**
 * Рассчитывает стартовую и текущую аукционную стоимость захваченной планеты (в кредитах CR)
 */
export function calculatePlanetAuctionValuationCr(rec: CapturedPlanetClanRecord): {
  baseValuationCr: number;
  renamedBrandBonusCr: number;
  infraBonusCr: number;
  roundBonusCr: number;
  totalBidCr: number;
  topBidderName: string;
  topBidderBadge: string;
} {
  const orbitBase = rec.orbitOrder === 4 ? 420 : rec.orbitOrder === 3 ? 380 : rec.orbitOrder === 2 ? 350 : 320;
  const isCustomRenamed =
    rec.customName.trim().toLowerCase() !== rec.formerName.trim().toLowerCase() &&
    rec.customName.trim().toLowerCase() !== rec.formerOfficialName.trim().toLowerCase();
  const renamedBrandBonusCr = isCustomRenamed ? 180 : 60;
  const infraBonusCr = (Math.max(1, rec.infrastructureLevel) - 1) * 160;
  const round = Math.max(0, Math.min(4, rec.auctionBiddingRound || 0));
  const bidder = GALACTIC_AUCTION_BIDDERS[round % GALACTIC_AUCTION_BIDDERS.length];
  const subTotal = orbitBase + renamedBrandBonusCr + infraBonusCr;
  const totalBidCr = Math.round(subTotal * bidder.bidMultiplier);
  const roundBonusCr = totalBidCr - subTotal;

  return {
    baseValuationCr: orbitBase,
    renamedBrandBonusCr,
    infraBonusCr,
    roundBonusCr,
    totalBidCr,
    topBidderName: bidder.name,
    topBidderBadge: bidder.badge,
  };
}

/**
 * Формирует каноническую строку захваченной и переименованной планеты:
 * Пример: «Метадонг - бывший Шлак-9 · клан Розовой бабочки»
 */
export function formatCapturedPlanetFullTitle(rec: CapturedPlanetClanRecord): string {
  const newName = (rec.customName || rec.formerName).trim();
  const oldName = (rec.formerName || rec.formerOfficialName).trim();
  const clanTitle = (rec.clanOrUnionName || 'клан Розовой бабочки').trim();
  return `${newName} - бывший ${oldName} · ${clanTitle}`;
}

/**
 * Короткая подпись для 3D-радара и орбитального маркера в космосе
 */
export function formatCapturedPlanetHudMarker(
  orbitRoman: string,
  rec: CapturedPlanetClanRecord,
  resourceShort: string
): string {
  const newName = (rec.customName || rec.formerName).trim().toUpperCase();
  const oldName = (rec.formerName || rec.formerOfficialName).trim();
  return `${orbitRoman}. ${rec.clanIcon} ${newName} - бывший ${oldName} [${rec.clanOrUnionName} · +${rec.incomePerCycleCr} CR · ${resourceShort}]`;
}

