import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Compass,
  Layers,
  Sun,
  Globe,
  Radio,
  Shield,
  Zap,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Crosshair,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';
import { SentinelMine3DCanvas } from './SentinelMine3DCanvas';
import { SentinelBladeModification, SENTINEL_BLADE_MODS_META } from '../data/autonomousSentinelEngine';
import { ShipyardBuilderModal } from './ShipyardBuilderModal';
import {
  renderMedialRhombicShipyardScene,
  MEGASTRUCTURE_SHIPYARD_SPECS,
} from '../data/medialRhombicTriacontahedronEngine';

export type SpaceObjectCategory =
  | 'ALL'
  | 'PLANET'
  | 'STAR'
  | 'STATION'
  | 'MEGASTRUCTURE'
  | 'SHIP_SENTINEL';

export interface SpaceObjectSpecData {
  id: string;
  category: 'PLANET' | 'STAR' | 'STATION' | 'MEGASTRUCTURE' | 'SHIP_SENTINEL';
  name: string;
  subName: string;
  tagline: string;
  visualColor: string;
  atmosphereColor: string;
  badge: string;
  modelType:
    | 'PLANET_EARTH'
    | 'PLANET_MARS'
    | 'PLANET_VENUS'
    | 'PLANET_MERCURY'
    | 'PLANET_GAS_GIANT'
    | 'STAR_SUN'
    | 'STATION_CORIOLIS'
    | 'MEGASTRUCTURE_DEATH_STAR'
    | 'MEGASTRUCTURE_TORUS'
    | 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON'
    | 'STATION_STARGATE'
    | 'SENTINEL_PLATFORM'
    | 'BURAN_SHUTTLE'
    | 'MODULAR_EXPLORER_XYZ';

  // Текстовое описание свойств объекта
  overview: string;
  tacticalRole: string;

  // Физические свойства (в единицах и тоннах)
  physics: {
    diameterKm: number;
    massTonsLabel: string;
    massKgScientific: string;
    densityGCm3: number;
    surfaceGravityG: number;
    surfaceGravityMPerS2: number;
    escapeVelocityKmS: number;
    axialRotationPeriodHours: number;
    orbitalPeriodDays: number;
    orbitalRadiusUnits: number;
    surfaceTempKelvin: { min: number; avg: number; max: number };
    surfaceTempCelsius: { min: number; avg: number; max: number };
  };

  // Атмосфера и климат
  atmosphere: {
    surfacePressureAtm: number;
    composition: { gas: string; percent: number }[];
    cloudCoverPct: number;
    radiationBeltCoeff: number;
    hasMagneticField: boolean;
  };

  // Геология, кора и ресурсы
  resources: {
    primaryResource: string;
    secondaryResources: string[];
    criticalMatterOmegaGamma: boolean;
    valuableOresList: string[];
    waterPresence: 'ABUNDANT_OCEANS' | 'POLAR_ICE' | 'TRACE_VAPOR' | 'NONE';
  };

  // Политический и стратегический статус в экосистеме G. Bell
  jurisdiction: {
    governmentType: string;
    clanAffiliation: string;
    securityLevel: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'ANARCHY';
    tariffMultiplier: number;
    auctionBasePriceCr: number;
    sentinelDefenseGrid: boolean;
  };
}

export const SPACE_OBJECTS_DATABASE: SpaceObjectSpecData[] = [
  // ПЕРВЫЙ ОБЪЕКТ ПО ТРЕБОВАНИЮ — ПЛАНЕТА (ЗЕМНОЙ ТИП)
  {
    id: 'planet-terra-earth',
    category: 'PLANET',
    name: 'ПЛАНЕТА ТЕРРА-II · ЗЕМЛЯ',
    subName: 'Terra Prime · III Орбита · Зона Златовласки',
    tagline: 'Колыбель цивилизации с открытыми океанами, азотно-кислородной атмосферой и глобальной инфраструктурой G. Bell',
    visualColor: '#38bdf8',
    atmosphereColor: '#0ea5e9',
    badge: 'ПЛАНЕТА ЗЕМНОГО ТИПА',
    modelType: 'PLANET_EARTH',
    overview:
      'Планета земного типа с активной гидросферой и динамической тектоникой плит. 71% поверхности покрыто жидкой водой. Обладает стабильным жидким железо-никелевым ядром, генерирующим мощную магнитосферу, надёжно экранирующую поверхность от солнечного ветра и космической радиации.',
    tacticalRole:
      'Ключевой логистический узел системы. Главный экспортер продовольствия, питьевой воды (H₂O) и органических полимеров. Вокруг планеты развёрнут главный контур спутников и станция Кориолис. Доступен режим фиксации на стационарной орбите (клавиша X) на дистанции < 400 ед.',
    physics: {
      diameterKm: 12742,
      massTonsLabel: '5 972 000 000 000 000 000 т (5.972 × 10¹⁸ т)',
      massKgScientific: '5.972 × 10²⁴ кг (1.00 M⊕)',
      densityGCm3: 5.51,
      surfaceGravityG: 1.0,
      surfaceGravityMPerS2: 9.81,
      escapeVelocityKmS: 11.18,
      axialRotationPeriodHours: 24.0,
      orbitalPeriodDays: 365.25,
      orbitalRadiusUnits: 3200,
      surfaceTempKelvin: { min: 184, avg: 288, max: 330 },
      surfaceTempCelsius: { min: -89, avg: 15, max: 57 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 78.08 },
        { gas: 'Кислород (O₂)', percent: 20.95 },
        { gas: 'Аргон (Ar)', percent: 0.93 },
        { gas: 'Углекислый газ (CO₂)', percent: 0.04 },
      ],
      cloudCoverPct: 65,
      radiationBeltCoeff: 0.12,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Продовольствие и Питьевая Вода (O₂/H₂O)',
      secondaryResources: ['Азот', 'Биополимеры', 'Кремний', 'Электронные компоненты'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Железо (Fe)', 'Алюминий (Al)', 'Медь (Cu)', 'Редкоземельные металлы'],
      waterPresence: 'ABUNDANT_OCEANS',
    },
    jurisdiction: {
      governmentType: 'Федерация Свободных Секторов G. Bell',
      clanAffiliation: 'Альянс Вольных Торговцев и Исследователей',
      securityLevel: 'HIGH',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 450000,
      sentinelDefenseGrid: true,
    },
  },

  // ВТОРОЙ ОБЪЕКТ — ПЛАНЕТА МАРС (ПУСТЫННЫЙ ТИП)
  {
    id: 'planet-mars-red',
    category: 'PLANET',
    name: 'ПЛАНЕТА АРИД-IV · МАРС',
    subName: 'Ares Secundus · IV Орбита · Красные Рудники',
    tagline: 'Пустынный мир с оксидами железа, колоссальными каньонами и крупнейшими рудниками титана',
    visualColor: '#f97316',
    atmosphereColor: '#ea580c',
    badge: 'ПУСТЫННАЯ ПЛАНЕТА',
    modelType: 'PLANET_MARS',
    overview:
      'Планета земной группы с сильно разреженной углекислотной атмосферой и базальтовой корой, насыщенной оксидами железа (III), придающими ей характерный ржаво-красный цвет. На планете расположены полярные шапки из водяного льда и сухой углекислоты, а также каньоны Маринер глубиной до 7 км.',
    tacticalRole:
      'Военно-промышленная цитадель. Главный источник сверхпрочного Титана (Ti) для корпусов тяжелых крейсеров и боевых дредноутов. Орбита Марса служит базой для тяжелых гарнизонов и патрульных эскадр.',
    physics: {
      diameterKm: 6779,
      massTonsLabel: '641 710 000 000 000 000 т (6.417 × 10¹⁷ т)',
      massKgScientific: '6.417 × 10²³ кг (0.107 M⊕)',
      densityGCm3: 3.93,
      surfaceGravityG: 0.38,
      surfaceGravityMPerS2: 3.71,
      escapeVelocityKmS: 5.03,
      axialRotationPeriodHours: 24.62,
      orbitalPeriodDays: 687.0,
      orbitalRadiusUnits: 4600,
      surfaceTempKelvin: { min: 130, avg: 210, max: 308 },
      surfaceTempCelsius: { min: -143, avg: -63, max: 35 },
    },
    atmosphere: {
      surfacePressureAtm: 0.006,
      composition: [
        { gas: 'Углекислый газ (CO₂)', percent: 95.32 },
        { gas: 'Азот (N₂)', percent: 2.6 },
        { gas: 'Аргон (Ar)', percent: 1.9 },
        { gas: 'Кислород (O₂)', percent: 0.13 },
      ],
      cloudCoverPct: 15,
      radiationBeltCoeff: 0.85,
      hasMagneticField: false,
    },
    resources: {
      primaryResource: 'Титан (Ti) и Тяжёлые Сплавы',
      secondaryResources: ['Оксиды железа', 'Кремний', 'Сухой лед CO₂', 'Базальт'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Титан', 'Ильменит', 'Магнетит', 'Реголит'],
      waterPresence: 'POLAR_ICE',
    },
    jurisdiction: {
      governmentType: 'Милитократия Красного Ареса',
      clanAffiliation: 'Синдикат Стальных Легионов',
      securityLevel: 'HIGH',
      tariffMultiplier: 1.25,
      auctionBasePriceCr: 380000,
      sentinelDefenseGrid: true,
    },
  },

  // ТРЕТИЙ ОБЪЕКТ — ПЛАНЕТА ВЕНЕРА (ТЕПЛИЧНЫЙ ПАРОВОЙ АД)
  {
    id: 'planet-venus-cloud',
    category: 'PLANET',
    name: 'ПЛАНЕТА КИПРИДА-I · ВЕНЕРА',
    subName: 'Cyprida Prime · II Орбита · Сернокислый Котёл',
    tagline: 'Сверхплотная атмосфера с давлением 92 атм, сернокислыми облаками и богатейшими залежами алюминия',
    visualColor: '#facc15',
    atmosphereColor: '#eab308',
    badge: 'СВЕРХПЛОТНАЯ ПЛАНЕТА',
    modelType: 'PLANET_VENUS',
    overview:
      'Сестра Земли по массе и диаметру, но подвергшаяся необратимому парниковому эффекту. Температура поверхности превышает 460°C, что выше температуры плавления свинца. Облачный покров состоит из капель концентрированной серной кислоты и совершает суперротацию за 4 земных дня.',
    tacticalRole:
      'Основной поставщик Алюминия (Al) и серных соединений. Посадка на грунт исключена без тяжелого грави-щита; добыча ведется атмосферными парящими дирижаблями-харвестерами.',
    physics: {
      diameterKm: 12104,
      massTonsLabel: '4 867 000 000 000 000 000 т (4.867 × 10¹⁸ т)',
      massKgScientific: '4.867 × 10²⁴ кг (0.815 M⊕)',
      densityGCm3: 5.24,
      surfaceGravityG: 0.9,
      surfaceGravityMPerS2: 8.87,
      escapeVelocityKmS: 10.36,
      axialRotationPeriodHours: -5832.5,
      orbitalPeriodDays: 224.7,
      orbitalRadiusUnits: 2100,
      surfaceTempKelvin: { min: 710, avg: 737, max: 750 },
      surfaceTempCelsius: { min: 437, avg: 464, max: 477 },
    },
    atmosphere: {
      surfacePressureAtm: 92.0,
      composition: [
        { gas: 'Углекислый газ (CO₂)', percent: 96.5 },
        { gas: 'Азот (N₂)', percent: 3.5 },
        { gas: 'Диоксид серы (SO₂)', percent: 0.015 },
      ],
      cloudCoverPct: 100,
      radiationBeltCoeff: 0.05,
      hasMagneticField: false,
    },
    resources: {
      primaryResource: 'Алюминий (Al) и Серная Кислота',
      secondaryResources: ['Бокситы', 'Углекислый газ высокой чистоты', 'Сера'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Алюминий', 'Корунд', 'Глинозем'],
      waterPresence: 'TRACE_VAPOR',
    },
    jurisdiction: {
      governmentType: 'Технократический Картель Облачных Городов',
      clanAffiliation: 'Гильдия Атмосферных Горняков',
      securityLevel: 'MEDIUM',
      tariffMultiplier: 0.9,
      auctionBasePriceCr: 320000,
      sentinelDefenseGrid: false,
    },
  },

  // ЧЕТВЕРТЫЙ ОБЪЕКТ — ПЛАНЕТА МЕРКУРИЙ (ЖЕЛЕЗНОЕ ЯДРО)
  {
    id: 'planet-mercury-iron',
    category: 'PLANET',
    name: 'ПЛАНЕТА ГЕРМЕС-ZERO · МЕРКУРИЙ',
    subName: 'Hermes Crateris · I Орбита · Солнечная Наковальня',
    tagline: 'Ближайшая к светилу планета с гигантским железным ядром, кратерными полями и дешевым Железом',
    visualColor: '#94a3b8',
    atmosphereColor: '#64748b',
    badge: 'ЖЕЛЕЗНАЯ ПЛАНЕТА',
    modelType: 'PLANET_MERCURY',
    overview:
      'Лишенная постоянной атмосферы раскаленная планета. Ядро составляет около 70% общей массы и 85% радиуса, что делает её гигантским естественным самородком чистого железа и никеля под тонкой силикатной корой, испещренной ударными кратерами.',
    tacticalRole:
      'Крупнейший экспортер Железа (Fe). Сверхвысокий солнечный поток позволяет мгновенно заряжать фотонно-квантовые аккумуляторы ГЭУ на орбите.',
    physics: {
      diameterKm: 4879,
      massTonsLabel: '330 200 000 000 000 000 т (3.302 × 10¹⁷ т)',
      massKgScientific: '3.302 × 10²³ кг (0.055 M⊕)',
      densityGCm3: 5.43,
      surfaceGravityG: 0.38,
      surfaceGravityMPerS2: 3.7,
      escapeVelocityKmS: 4.25,
      axialRotationPeriodHours: 1407.6,
      orbitalPeriodDays: 88.0,
      orbitalRadiusUnits: 1100,
      surfaceTempKelvin: { min: 100, avg: 440, max: 700 },
      surfaceTempCelsius: { min: -173, avg: 167, max: 427 },
    },
    atmosphere: {
      surfacePressureAtm: 0.000000000001,
      composition: [
        { gas: 'Кислород (экзосфера)', percent: 42.0 },
        { gas: 'Натрий (Na)', percent: 29.0 },
        { gas: 'Водород (H₂)', percent: 22.0 },
        { gas: 'Гелий (He)', percent: 6.0 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 2.4,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Железо (Fe) и Никель (Ni)',
      secondaryResources: ['Гелий-3', 'Платиноиды', 'Тяжелые силикаты'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Железо', 'Никель', 'Хромит', 'Титаномагнетит'],
      waterPresence: 'NONE',
    },
    jurisdiction: {
      governmentType: 'Шахтёрский Директорат Солнечной Короны',
      clanAffiliation: 'Союз Глубоких Бурильщиков',
      securityLevel: 'HIGH',
      tariffMultiplier: 0.75,
      auctionBasePriceCr: 290000,
      sentinelDefenseGrid: false,
    },
  },

  // ПЯТЫЙ ОБЪЕКТ — ГАЗОВЫЙ ГИГАНТ С КОЛЬЦАМИ
  {
    id: 'planet-gas-titan',
    category: 'PLANET',
    name: 'ГАЗОВЫЙ ГИГАНТ · ХРОНОС-МАКСИМА',
    subName: 'Chronos Gigas · Внешний пояс · Кольцевая Аномалия',
    tagline: 'Колоссальный водородно-гелиевый гигант с ледяными кольцами и штормовыми вихрями',
    visualColor: '#e0a96d',
    atmosphereColor: '#c27836',
    badge: 'ГАЗОВЫЙ ГИГАНТ',
    modelType: 'PLANET_GAS_GIANT',
    overview:
      'Массивный газовый шар с металлическим водородным ядром под сверхдавлением. Обладает великолепной системой тонких ледяных колец шириной 70 000 км и мощнейшим гравитационным полем, действующим как естественный космический щит для внутренних миров.',
    tacticalRole:
      'Гравитационная праща для межзвездных маневров. Добыча водородного топлива для термоядерных реакторов кораблей.',
    physics: {
      diameterKm: 142984,
      massTonsLabel: '1 898 000 000 000 000 000 000 т (1.898 × 10²¹ т)',
      massKgScientific: '1.898 × 10²⁷ кг (317.8 M⊕)',
      densityGCm3: 1.33,
      surfaceGravityG: 2.53,
      surfaceGravityMPerS2: 24.79,
      escapeVelocityKmS: 59.5,
      axialRotationPeriodHours: 9.93,
      orbitalPeriodDays: 4332.6,
      orbitalRadiusUnits: 8200,
      surfaceTempKelvin: { min: 110, avg: 165, max: 190 },
      surfaceTempCelsius: { min: -163, avg: -108, max: -83 },
    },
    atmosphere: {
      surfacePressureAtm: 1000.0,
      composition: [
        { gas: 'Водород (H₂)', percent: 89.8 },
        { gas: 'Гелий (He)', percent: 10.2 },
        { gas: 'Метан (CH₄)', percent: 0.3 },
      ],
      cloudCoverPct: 100,
      radiationBeltCoeff: 5.8,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Дейтерий, Тритий и Металлический Водород',
      secondaryResources: ['Гелий-3', 'Водяной лед колец', 'Метан'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Водородное топливо', 'Криогенный лед'],
      waterPresence: 'TRACE_VAPOR',
    },
    jurisdiction: {
      governmentType: 'Нейтральная Зона Открытого Космоса',
      clanAffiliation: 'Свободные Топливные Заправщики',
      securityLevel: 'MEDIUM',
      tariffMultiplier: 1.1,
      auctionBasePriceCr: 600000,
      sentinelDefenseGrid: false,
    },
  },

  // ШЕСТОЙ ОБЪЕКТ — ЦЕНТРАЛЬНАЯ ЗВЕЗДА
  {
    id: 'star-helios-central',
    category: 'STAR',
    name: 'ЗВЕЗДА ГЕЛИОС · ЖЁЛТЫЙ КАРЛИК',
    subName: 'Спектральный класс G2V · Центр Звёздной Сферы',
    tagline: 'Источник гравитационного центра, фотонного ветра и квантовой энергии всей системы',
    visualColor: '#fbbf24',
    atmosphereColor: '#f59e0b',
    badge: 'ЗВЕЗДА ГЛАВНОЙ ПОСЛЕДОВАТЕЛЬНОСТИ',
    modelType: 'STAR_SUN',
    overview:
      'Плазменный гравитационный центр системы. В недрах звезды ежесекундно 600 миллионов тонн водорода превращаются в гелий посредством протон-протонного термоядерного цикла, высвобождая $3.828 \times 10^{26}$ Ватт мощности.',
    tacticalRole:
      'Определяет эффективность работы солнечных конвертеров ГЭУ автономных часовых и кораблей. Запретная зона: приближение ближе 600 ед. вызывает термический перегрев обшивки.',
    physics: {
      diameterKm: 1392700,
      massTonsLabel: '1 989 000 000 000 000 000 000 000 т (1.989 × 10²⁴ т)',
      massKgScientific: '1.989 × 10³⁰ кг (333 000 M⊕)',
      densityGCm3: 1.41,
      surfaceGravityG: 28.0,
      surfaceGravityMPerS2: 274.0,
      escapeVelocityKmS: 617.7,
      axialRotationPeriodHours: 609.6,
      orbitalPeriodDays: 0,
      orbitalRadiusUnits: 0,
      surfaceTempKelvin: { min: 5778, avg: 5778, max: 15700000 },
      surfaceTempCelsius: { min: 5505, avg: 5505, max: 15699727 },
    },
    atmosphere: {
      surfacePressureAtm: 0.001,
      composition: [
        { gas: 'Водород (H)', percent: 73.46 },
        { gas: 'Гелий (He)', percent: 24.85 },
        { gas: 'Кислород (O)', percent: 0.77 },
        { gas: 'Углерод (C)', percent: 0.29 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 10.0,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Солнечная Радиация и Квантовый Фотонный Поток',
      secondaryResources: ['Гелий-4', 'Протоны солнечного ветра'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Чистая фотонная энергия'],
      waterPresence: 'NONE',
    },
    jurisdiction: {
      governmentType: 'Природная Астрофизическая Зона',
      clanAffiliation: 'Всеобщее Достояние Галактики',
      securityLevel: 'HIGH',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 0,
      sentinelDefenseGrid: false,
    },
  },

  // СЕДЬМОЙ ОБЪЕКТ — СТАНЦИЯ КОРИОЛИС
  {
    id: 'station-coriolis-prime',
    category: 'STATION',
    name: 'ОРБИТАЛЬНАЯ СТАНЦИЯ КОРИОЛИС',
    subName: 'Coriolis Habitation Hub · Вращающийся Кубооктаэдр',
    tagline: 'Центральный космопорт с вращающимся посадочным шлюзом, ангарами и товарной биржей',
    visualColor: '#38bdf8',
    atmosphereColor: '#0284c7',
    badge: 'КОСМИЧЕСКАЯ СТАНЦИЯ',
    modelType: 'STATION_CORIOLIS',
    overview:
      'Классическая вращающаяся обитаемая станция формы кубооктаэдра. Вращение вокруг продольной оси создает искусственную силу тяжести 1g на экваторе жилых отсеков. Оснащена прямоугольным посадочным шлюзом со световыми глиссадами.',
    tacticalRole:
      'Стыковка (клавиша T или DOCK), продажа товаров, покупка топлива, модернизация орудий и ремонт корабля Cobra Mk III.',
    physics: {
      diameterKm: 2.5,
      massTonsLabel: '250 000 000 т (2.5 × 10⁸ т)',
      massKgScientific: '2.5 × 10¹¹ кг',
      densityGCm3: 0.8,
      surfaceGravityG: 1.0,
      surfaceGravityMPerS2: 9.81,
      escapeVelocityKmS: 0.05,
      axialRotationPeriodHours: 0.04,
      orbitalPeriodDays: 365.25,
      orbitalRadiusUnits: 3400,
      surfaceTempKelvin: { min: 293, avg: 295, max: 298 },
      surfaceTempCelsius: { min: 20, avg: 22, max: 25 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 79.0 },
        { gas: 'Кислород (O₂)', percent: 21.0 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.02,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Товары, Оснащение и Корабельное Топливо',
      secondaryResources: ['Запчасти', 'Медикаменты', 'Оружие'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Все стандартные товары Галактической биржи'],
      waterPresence: 'ABUNDANT_OCEANS',
    },
    jurisdiction: {
      governmentType: 'Администрация Свободного Космопорта',
      clanAffiliation: 'Гильдия Торговцев G. Bell',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 800000,
      sentinelDefenseGrid: true,
    },
  },

  // ОРБИТАЛЬНАЯ СТАНЦИЯ 2 — ТЕРМИНАЛ В ВИДЕ БУБЛИКА (СТЭНФОРДСКИЙ ТОР)
  {
    id: 'station-torus-terminal',
    category: 'STATION',
    name: 'ОРБИТАЛЬНЫЙ ТЕРМИНАЛ «СТЭНФОРДСКИЙ БУБЛИК»',
    subName: 'Torus Habitation Ring · Искусственная гравитация 1.0g',
    tagline: 'Вращающаяся тороидальная станция-бублик с центральной невесомой ступицей и жилым кольцом',
    visualColor: '#38bdf8',
    atmosphereColor: '#0284c7',
    badge: 'ОРБИТАЛЬНЫЙ ТЕРМИНАЛ-БУБЛИК',
    modelType: 'MEGASTRUCTURE_TORUS',
    overview:
      'Обитаемая космическая станция тороидальной геометрии («Стэнфордский бублик»). Внешний диаметр тороида составляет 1800 метров, внутренний диаметр трубы — 130 метров. Станция вращается со скоростью ровно 1 оборот в минуту (1.0 об/мин), благодаря чему центробежная сила создаёт на внешнем обитаемом ободе естественную силу тяжести 1.0g (земная норма) без антигравитационных генераторов.\n\nВ центре расположена невращающаяся нулевой перегрузки стыковочная ступица (Zero-G Docking Hub), куда причаливают транспортные челноки и тяжёлые грузовозы без риска центробежной аварии. Ступица соединена с внешним кольцом шестью полыми радиальными спицами-коридорами со скоростными лифтами. По внешнему периметру тора установлены панорамные иллюминаторы гидропонных оранжерей и сегменты криволинейных фотоэлектрических панелей.',
    tacticalRole:
      'Грузопассажирский перевалочный терминал, ремонт обшивки, дозаправка возобновляемой энергией и отдых экипажей в условиях комфортной земной гравитации 1g.',
    physics: {
      diameterKm: 1.8,
      massTonsLabel: '10 000 000 т (1.0 × 10⁷ т)',
      massKgScientific: '1.0 × 10¹⁰ кг',
      densityGCm3: 0.15,
      surfaceGravityG: 1.0,
      surfaceGravityMPerS2: 9.81,
      escapeVelocityKmS: 0.04,
      axialRotationPeriodHours: 0.0167,
      orbitalPeriodDays: 365.25,
      orbitalRadiusUnits: 3600,
      surfaceTempKelvin: { min: 293, avg: 295, max: 298 },
      surfaceTempCelsius: { min: 20, avg: 22, max: 25 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 78.1 },
        { gas: 'Кислород (O₂)', percent: 20.9 },
        { gas: 'Углекислый газ (CO₂)', percent: 0.04 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.01,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Гидропонное продовольствие, Запчасти и Квантовое топливо',
      secondaryResources: ['Очищенная вода', 'Кислородные картриджи', 'Медикаменты'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Биоматериалы', 'Лёгкие сплавы', 'Солнечные батареи'],
      waterPresence: 'ABUNDANT_OCEANS',
    },
    jurisdiction: {
      governmentType: 'Федеральная Торговая Администрация G. Bell',
      clanAffiliation: 'Свободный Альянс Независимых Пилотов',
      securityLevel: 'HIGH',
      tariffMultiplier: 0.95,
      auctionBasePriceCr: 950000,
      sentinelDefenseGrid: true,
    },
  },

  // ОРБИТАЛЬНАЯ СТАНЦИЯ 3 — СТАНЦИЯ ТИПА ЗВЕЗДА СМЕРТИ
  {
    id: 'station-death-star',
    category: 'STATION',
    name: 'ОРБИТАЛЬНАЯ ЦИТАДЕЛЬ «ЗВЕЗДА СМЕРТИ»',
    subName: 'Orbital Super-Citadel · Бронестанция диаметром 160 км',
    tagline: 'Колоссальная сферическая суперстанция с вогнутой чашей суперлазера и экваториальной траншеей',
    visualColor: '#94a3b8',
    atmosphereColor: '#22c55e',
    badge: 'БОЕВАЯ СУПЕРСТАНЦИЯ',
    modelType: 'MEGASTRUCTURE_DEATH_STAR',
    overview:
      'Исполинская сферическая орбитальная станция класса «Звезда Смерти» диаметром 160 километров, выкованная из многослойной титано-дюрасталевой брони. Способна вмещать гарнизон из миллиона человек, тысячи истребителей и десятки звёздных крейсеров.\n\nГлавные конструктивные узлы:\n• Вогнутая чаша суперлазера: гигантская параболическая линза диаметром 35 км в северном полушарии. Внутри чаши расположены концентрические террасы фокусировки, объединяющие 8 вспомогательных кайбер-лучей в единый разрушительный сверхмощный импульс.\n• Экваториальная траншея: опоясывающий станцию каньон глубиной 1.5 км со стыковочными ангарами для крупнотоннажного флота, проекторами магнитных щитов и посадочными доками.\n• Гиперматерийный реактор: энергетическое ядро мощностью 3.0 × 10²⁴ Вт, питающее защитные силовые поля и артиллерийские башни турболазеров по всей поверхности сферы.',
    tacticalRole:
      'Абсолютный флагман оборонительного и стратегического контроля сектора. Неприступная цитадель высшего класса защиты.',
    physics: {
      diameterKm: 160,
      massTonsLabel: '1 200 000 000 000 000 т (1.2 × 10¹⁵ т)',
      massKgScientific: '1.2 × 10¹⁸ кг',
      densityGCm3: 0.56,
      surfaceGravityG: 0.08,
      surfaceGravityMPerS2: 0.78,
      escapeVelocityKmS: 1.4,
      axialRotationPeriodHours: 48.0,
      orbitalPeriodDays: 730.0,
      orbitalRadiusUnits: 9500,
      surfaceTempKelvin: { min: 250, avg: 280, max: 320 },
      surfaceTempCelsius: { min: -23, avg: 7, max: 47 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 79.0 },
        { gas: 'Кислород (O₂)', percent: 21.0 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.01,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Гиперматерия, Кайбер-кристаллы и Тяжёлое Вооружение',
      secondaryResources: ['Дюрасталь', 'Титановые бронелисты', 'Энергоячейки'],
      criticalMatterOmegaGamma: true,
      valuableOresList: ['Кайбер-плазма', 'Критическое вещество Ω-γ'],
      waterPresence: 'ABUNDANT_OCEANS',
    },
    jurisdiction: {
      governmentType: 'Военно-Стратегический Штаб Обороны',
      clanAffiliation: 'Имперский Корпус Защиты Системы',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 1.5,
      auctionBasePriceCr: 50000000,
      sentinelDefenseGrid: true,
    },
  },

  // ОРБИТАЛЬНЫЙ ОБЪЕКТ — МЕГАВЕРФЬ 0.5R ПЛАНЕТЫ (СРЕДНИЙ РОМБОТРИАКОНТАЭДР)
  {
    id: 'megastructure-shipyard-triacontahedron',
    category: 'MEGASTRUCTURE',
    name: 'ОРБИТАЛЬНАЯ МЕГАВЕРФЬ «ТАЛИОН» · СРЕДНИЙ РОМБОТРИАКОНТАЭДР',
    subName: 'Medial Rhombic Triacontahedron Shipyard · D = 6 371 км (0.5 Планеты)',
    tagline: 'Исполинская космическая верфь размером в половину планеты. 30 самопересекающихся ромбических стапелей, 60 гранных магистралей и 24 глубококосмических причала.',
    visualColor: '#06b6d4',
    atmosphereColor: '#38bdf8',
    badge: 'МЕГАВЕРФЬ 0.5 ПЛАНЕТЫ',
    modelType: 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON',
    overview:
      'Орбитальная суперверфь колоссального масштаба: её диаметр составляет 6 371 км — ровно половину диаметра планеты земного типа (Терра-II, 12 742 км). Корпус верфи выкован в форме Среднего Ромботриаконтаэдра (Medial Rhombic Triacontahedron, модель Веннинджера W73) — самопересекающегося звёздчатого многогранника, дуального додекадодекаэдру U36.\n\nКлючевая архитектура:\n• 30 пересекающихся ромбических стапелей: каждая грань является золотым ромбом с внутренними углами 41.81° и 138.19°, образуя грандиозные сборочные карманы для одновременного монтажа 1200 крупнотоннажных крейсеров.\n• 60 каркасных ребер-магистралей: сверхпрочные балки из титано-графенового композита со скоростными маглев-туннелями перемещения блоков.\n• 24 причальных узла: 12 внешних зенитных шпилей для стыковки прибывающих флагманов + 12 внутренних квантовых стапелей ядра.\n• Центральное сингулярное энергоядро: генерирует поле гравитационно-квантового удержания. Именно сюда внешние поставщики мгновенно телепортируют закупленные пилотом модули. По законам физики верфи, доставленный модуль теряет способность к обратной телепортации: вывезти его можно лишь пристыковав к кораблю либо продав местному скупщику за 50%!',
    tacticalRole:
      'Главная сборочная база сектора Талион: монтаж модульных кораблей на базе 6-лучевого каркаса XYZ, телепортационный приём купленных у поставщиков модулей, выкуп скупщиком за 50% и глубококосмическая модернизация флота.',
    physics: {
      diameterKm: 6371,
      massTonsLabel: '85 000 000 000 000 000 т (8.5 × 10¹⁶ т)',
      massKgScientific: '8.5 × 10¹⁹ кг',
      densityGCm3: 0.62,
      surfaceGravityG: 0.14,
      surfaceGravityMPerS2: 1.37,
      escapeVelocityKmS: 1.88,
      axialRotationPeriodHours: 24.0,
      orbitalPeriodDays: 365.25,
      orbitalRadiusUnits: 14200,
      surfaceTempKelvin: { min: 40, avg: 285, max: 410 },
      surfaceTempCelsius: { min: -233, avg: 12, max: 137 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 78.0 },
        { gas: 'Кислород (O₂)', percent: 21.0 },
        { gas: 'Защитные аргоновые смеси', percent: 1.0 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.0,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Сборочные стапели, квантовые верфи, модули 6-XYZ',
      secondaryResources: ['Сверхчистый титан', 'Фотонные кристаллы', 'Плазменные накопители'],
      criticalMatterOmegaGamma: true,
      valuableOresList: ['Наноматериалы', 'Квантовые процессоры', 'Гиперсплавы'],
      waterPresence: 'TRACE_VAPOR',
    },
    jurisdiction: {
      governmentType: 'Автономная Мегаинженерная Корпорация G. Bell & Co',
      clanAffiliation: 'Свободный Торгово-Сборочный Синдикат Талиона',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 45000000,
      sentinelDefenseGrid: true,
    },
  },

  // ОРБИТАЛЬНАЯ СТАНЦИЯ 4 — ЗВЁЗДНЫЕ ВРАТА (ДОМИНАТОР-Ω)
  {
    id: 'station-stargate-dominator',
    category: 'STATION',
    name: 'ОРБИТАЛЬНЫЕ ЗВЁЗДНЫЕ ВРАТА «ДОМИНАТОР-Ω»',
    subName: 'Stargate Hyper-Portal · Искривление пространства-времени',
    tagline: 'Гиперпространственный кольцевой портал с 9 шевронами и стабильным горизонтом событий червоточины',
    visualColor: '#06b6d4',
    atmosphereColor: '#38bdf8',
    badge: 'ЗВЁЗДНЫЕ ВРАТА ДОМИНАТОРОВ',
    modelType: 'STATION_STARGATE',
    overview:
      'Орбитальные сверхпроводящие Звёздные Врата — венец технологии Пространства-Времени элитного класса Доминаторов. Представляют собой массивное сверхпроводящее кольцо диаметром 800 метров, выкованное из реликтового нейтрониево-наквадахового сплава.\n\nКонструкция:\n• 9 замков-шевронов: внешние V-образные замковые фиксаторы с наквадаховыми кристаллами, которые блокируются при наборе звёздного адреса и вспыхивают ярко-оранжевым светом.\n• Внутренний глиф-диск: вращающееся кольцо с гравировкой 39 астронавигационных глифов созвездий галактики.\n• Горизонт событий («Кавуш»): при завершении набора адреса внутри кольца формируется стабильная проходимая кротовая нора Эйнштейна-Розена. Водянисто-аквамариновый диск горизонта событий позволяет кораблям любого тоннажа мгновенно перемещаться в любую звёздную систему без расхода гипертоплива.\n• Энергетические пилоны основания: дублированные силовые опоры вакуумной накачки Доминаторов, питающие пространственную сингулярность.',
    tacticalRole:
      'Мгновенный прыжок пространства-времени в любую точку галактики без расхода топлива. Ключевой стратегический транспортный узел.',
    physics: {
      diameterKm: 0.8,
      massTonsLabel: '850 000 т (8.5 × 10⁵ т)',
      massKgScientific: '8.5 × 10⁸ кг',
      densityGCm3: 12.8,
      surfaceGravityG: 0.02,
      surfaceGravityMPerS2: 0.19,
      escapeVelocityKmS: 0.02,
      axialRotationPeriodHours: 0.05,
      orbitalPeriodDays: 180.0,
      orbitalRadiusUnits: 4200,
      surfaceTempKelvin: { min: 20, avg: 140, max: 270 },
      surfaceTempCelsius: { min: -253, avg: -133, max: -3 },
    },
    atmosphere: {
      surfacePressureAtm: 0.0,
      composition: [],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.05,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Нейтроний, Наквадах и Квантовая Сингулярность',
      secondaryResources: ['Гравитонные конденсаторы', 'Векторные кристаллы пространства'],
      criticalMatterOmegaGamma: true,
      valuableOresList: ['Наквадах', 'Критическое вещество Ω-γ', 'Хроно-кристаллы'],
      waterPresence: 'NONE',
    },
    jurisdiction: {
      governmentType: 'Орден Установщиков Звёздных Врат Доминаторов',
      clanAffiliation: 'Элита Пространства-Времени',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 0.8,
      auctionBasePriceCr: 12000000,
      sentinelDefenseGrid: true,
    },
  },

  // ВОСЬМОЙ ОБЪЕКТ — АВТОНОМНЫЙ ЧАСОВОЙ «ОМЕГА-СТРАЖ»
  {
    id: 'sentinel-platform-omega',
    category: 'SHIP_SENTINEL',
    name: 'АВТОНОМНЫЙ ЧАСОВОЙ «ОМЕГА-СТРАЖ»',
    subName: 'Сферическая мина с пирамидальными рожками и лопастями ветряной мельницы',
    tagline: 'Морская мина с рожками-пирамидками и 3 модификациями мельничных солнечных лопастей (4, 6, 8 шт.)',
    visualColor: '#06b6d4',
    atmosphereColor: '#0891b2',
    badge: 'БОЕВАЯ ПЛАТФОРМА · 3 МОДИФИКАЦИИ',
    modelType: 'SENTINEL_PLATFORM',
    overview:
      'Беспилотная автономная боевая платформа дозорной сети G. Bell. Внешний вид: в центре шар из титановой брони, визуально напоминающий большую морскую мину, по поверхности которой радиально расставлены 14 рожков в виде четырёхгранных пирамидок (детекторы сближения и эмиттеры сенсорного поля). Из центрального шара радиально выступают фотоэлектрические солнечные панели, выполненные в виде лопастей старинных ветряных мельниц с характерной решётчатой обрешёткой, продольными лонжеронами и квантовым парусиновым полотном.\n\nПлатформа имеет 3 модификации по количеству лопастей, напрямую определяющих скорость зарядки накопителя:\n• Mk-4 (4 лопасти): классический крест 90°, площадь 450 м², базовая скорость зарядки 1.0x (+12.0 ГЭУ/с), сухая масса 10.5 т.\n• Mk-6 (6 лопастей): шестилучевая звезда 60°, площадь 675 м², ускоренная на +50% зарядка 1.5x (+18.0 ГЭУ/с), сухая масса 12.0 т.\n• Mk-8 (8 лопастей): восьмилучевая турбина 45°, площадь 900 м², удвоенная скорость зарядки 2.0x (+24.0 ГЭУ/с), сухая масса 13.5 т.',
    tacticalRole:
      'Охрана зон дислокации, автоматический перехват преследователей, засада из облака часовых и объёмное торможение двигателей (при N ≥ 3 часовых). Количество лопастей мельницы (4, 6, 8) напрямую определяет скорость восполнения энергии накопителя часового!',
    physics: {
      diameterKm: 0.018,
      massTonsLabel: '10.5 т (4 лопасти) / 12.0 т (6 лопастей) / 13.5 т (8 лопастей)',
      massKgScientific: '1.05 × 10⁴ .. 1.35 × 10⁴ кг',
      densityGCm3: 3.2,
      surfaceGravityG: 0.0001,
      surfaceGravityMPerS2: 0.001,
      escapeVelocityKmS: 0.002,
      axialRotationPeriodHours: 1.0,
      orbitalPeriodDays: 28.0,
      orbitalRadiusUnits: 1800,
      surfaceTempKelvin: { min: 80, avg: 220, max: 380 },
      surfaceTempCelsius: { min: -193, avg: -53, max: 107 },
    },
    atmosphere: {
      surfacePressureAtm: 0.0,
      composition: [],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.01,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Фотонная Энергия (ГЭУ) и Мельничные Паруса (450–900 м²)',
      secondaryResources: ['Квантовые аккумуляторы', 'Титановый шар мины', 'Пирамидальные рожки'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Квантовые кристаллы G. Bell', 'Титановая броня мины'],
      waterPresence: 'NONE',
    },
    jurisdiction: {
      governmentType: 'Автономная Сеть Безопасности ИИ',
      clanAffiliation: 'Служба Охраны Периметра Пилота',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 120000,
      sentinelDefenseGrid: true,
    },
  },

  // ДЕВЯТЫЙ ОБЪЕКТ — СТАНДАРТНЫЙ ЧЕЛНОК ТИПА «БУРАН» (ПРОГРАММА ББД)
  {
    id: 'ship-buran-shuttle',
    category: 'SHIP_SENTINEL',
    name: 'СТАНДАРТНЫЙ ЧЕЛНОК ТИПА «БУРАН»',
    subName: 'Орбитальный ракетоплан · Программа Диктатора «Безусловный базовый доход»',
    tagline: 'Базовый корабль системы, выдаваемый с 14 лет: каюта с библиотекой, операционная рубка, трюм на 40 т, лазер, плазма, гравизахват и спаренные солнечные крылья',
    visualColor: '#38bdf8',
    atmosphereColor: '#0284c7',
    badge: 'СТАНДАРТНЫЙ КОРАБЛЬ СИСТЕМЫ · ББД (14+ ЛЕТ)',
    modelType: 'BURAN_SHUTTLE',
    overview:
      'Стандартный космический челнок-ракетоплан типа «Буран» — базовый корабль звёздной системы, бесплатно выдаваемый любому жителю, достигшему возраста 14 лет, в рамках государственной программы диктатора «Безусловный базовый доход» (ББД). Корабль закреплён персонально за гражданином пожизненно: продать, заложить или передать этот корабль строго запрещено законом.\n\nСтандартное штатное оснащение:\n• Жилая каюта: многофункциональное помещение для работы с информацией, стратегического планирования маршрутов, включающее высокоскоростной модуль сверхсветовой связи и бортовую голографическую библиотеку знаний.\n• Операционная рубка: совмещённый командный мостик — навигационная и тактическая огневая рубка с круговым сенсорным обзором и системами управления огнём.\n• Грузовой трюм: вместительный герметичный цилиндрический отсек с арочными шпангоутами и раскрывающимися створками полезной ёмкостью ровно 40 метрических тонн (стандартные транспортные контейнеры).\n• Вооружение: минимальный импульсный лазер и минимальная плазменная пушка для защиты от метеоритов, мародёров и пиратских дронов.\n• Механизм гравитационного захвата: подфюзеляжный направленный тракторный луч для подъёма и погрузки контейнеров в условиях невесомости.\n• Стандартный радар: сферический носовой обтекатель с фазированной антенной решёткой кругового 3D-сканирования сектора.\n• Энергосистема: стандартная спаренная солнечная батарея в виде крыльев (фотоэлектрические панели, встроенные в обе консоли двойного дельта-крыла, обеспечивающие непрерывную зарядку накопителей от солнечного излучения).\n\nЭксплуатация в системе:\nШироко используется как автоматические грузовые челноки между планетами и орбитальными станциями, а также эксплуатируется пиратами, мародёрами, вольными торговцами, старателями-горняками, курьерами и исследователями (реестр открытый).',
    tacticalRole:
      'Универсальный стандартный транспорт, межпланетные и межстанционные грузопассажирские рейсы, старательская добыча, разведка, торговля и патрулирование. Продажа корабля запрещена законом!',
    physics: {
      diameterKm: 0.036,
      massTonsLabel: '62 т (сухая) / 102 т (с трюмом 40 т)',
      massKgScientific: '6.2 × 10⁴ .. 1.02 × 10⁵ кг',
      densityGCm3: 0.95,
      surfaceGravityG: 0.0002,
      surfaceGravityMPerS2: 0.002,
      escapeVelocityKmS: 0.005,
      axialRotationPeriodHours: 0.05,
      orbitalPeriodDays: 365.25,
      orbitalRadiusUnits: 5200,
      surfaceTempKelvin: { min: 90, avg: 290, max: 1750 },
      surfaceTempCelsius: { min: -183, avg: 17, max: 1477 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 78.0 },
        { gas: 'Кислород (O₂)', percent: 21.0 },
        { gas: 'Углекислый газ (CO₂)', percent: 0.04 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.02,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Грузовой трюм на 40 метрических тонн (контейнеры)',
      secondaryResources: ['Спаренная солнечная батарея крыльев', 'Гравитационный захват', 'Библиотека и модуль связи'],
      criticalMatterOmegaGamma: false,
      valuableOresList: ['Минимальный лазер', 'Минимальная плазма', 'Керамическая теплозащита днища'],
      waterPresence: 'NONE',
    },
    jurisdiction: {
      governmentType: 'Программа Диктатора «Безусловный Базовый Доход» (с 14 лет)',
      clanAffiliation: 'Неотчуждаемая Персональная Собственность (Продажа Запрещена)',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 0,
      sentinelDefenseGrid: false,
    },
  },

  // МОДУЛЬНЫЙ КОРАБЛЬ — 6-ОСЕВОЙ КАРКАС XYZ
  {
    id: 'ship-modular-canonical-explorer',
    category: 'SHIP_SENTINEL',
    name: 'КАНОНИЧЕСКИЙ МОДУЛЬНЫЙ ЭКСПЛОРЕР (6-XYZ)',
    subName: 'Модульная архитектура: 5 дюз → Энергия → Радары → Трюмы 40т → Оружие → Рубка',
    tagline: 'Идеология кораблестроения на базе ортогонального 6-лучевого стыковочного каркаса XYZ',
    visualColor: '#38bdf8',
    atmosphereColor: '#0ea5e9',
    badge: 'МОДУЛЬНОЕ КОРАБЛЕСТРОЕНИЕ XYZ',
    modelType: 'MODULAR_EXPLORER_XYZ',
    overview:
      'Корабль собран по модульной системе кораблестроения на базе универсального 6-лучевого стыковочного блока XYZ (+X, -X, +Y, -Y, +Z, -Z).\n\nКонструкция состоит из 6 состыкованных секций-хабов:\n1. Кормовой силовой блок: 5 сферических двигателей с дюзами (центральная фотонная дюза + 2 реактивные плазменные + 2 ионные).\n2. Энергетический блок: 4 спаренных раскрывающихся солнечных крыла с фотоэлементами.\n3. Сенсорный блок: сферические купола РЛС кругового обзора 360° и параболическая антенна дальней связи ДРЛО.\n4. Грузовой отсек: герметичные стандартизированные трюмы (два контейнера по 40 т стандарта ББД, один на 80 т и крио-цистерна 60 т).\n5. Боевой отсек: импульсные лазерные турели, тяжёлая плазменная пушка и торпедный контейнер.\n6. Командный модуль пилота: совмещённая операционная рубка (навигация и огневой пульт), жилая каюта с терминалом планирования, библиотека знаний и модуль связи.',
    tacticalRole:
      'Многоцелевой дальний исследовательский флагман, тяжёлый грузовой транспорт и патрульный крейсер с возможностью свободной переконфигурации на орбитальной верфи.',
    physics: {
      diameterKm: 0.048,
      massTonsLabel: '142.5 т',
      massKgScientific: '1.425 × 10⁵ кг',
      densityGCm3: 1.15,
      surfaceGravityG: 0.0003,
      surfaceGravityMPerS2: 0.003,
      escapeVelocityKmS: 0.006,
      axialRotationPeriodHours: 0.02,
      orbitalPeriodDays: 365.25,
      orbitalRadiusUnits: 5600,
      surfaceTempKelvin: { min: 80, avg: 295, max: 1800 },
      surfaceTempCelsius: { min: -193, avg: 22, max: 1527 },
    },
    atmosphere: {
      surfacePressureAtm: 1.0,
      composition: [
        { gas: 'Азот (N₂)', percent: 78.0 },
        { gas: 'Кислород (O₂)', percent: 21.0 },
        { gas: 'Углекислый газ (CO₂)', percent: 0.04 },
      ],
      cloudCoverPct: 0,
      radiationBeltCoeff: 0.01,
      hasMagneticField: true,
    },
    resources: {
      primaryResource: 'Модульные контейнеры 40т / 80т (Суммарно 220 т)',
      secondaryResources: ['5 сферических двигателей (фотонный + реактивный + ионный)', '4 солнечных крыла', 'Радары ДРЛО 360°'],
      criticalMatterOmegaGamma: true,
      valuableOresList: ['Импульсный лазер', 'Плазменная пушка', 'Каюта с библиотекой'],
      waterPresence: 'NONE',
    },
    jurisdiction: {
      governmentType: 'Орбитальная Верфь Модульного Кораблестроения',
      clanAffiliation: 'Свободный Флот Независимых Инженеров',
      securityLevel: 'MAXIMUM',
      tariffMultiplier: 1.0,
      auctionBasePriceCr: 450000,
      sentinelDefenseGrid: true,
    },
  },
];

interface SpaceObjectsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayBeep?: (type: 'LASER' | 'HIT' | 'EXPLODE' | 'HYPERSPACE' | 'DOCK' | 'MISSION') => void;
  initialObjectId?: string;
  onOpenShipyard?: () => void;
}

export const SpaceObjectsGalleryModal: React.FC<SpaceObjectsGalleryModalProps> = ({
  isOpen,
  onClose,
  onPlayBeep,
  initialObjectId,
  onOpenShipyard,
}) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    initialObjectId || null
  );
  const [activeCategory, setActiveCategory] = useState<SpaceObjectCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentinelBlades, setSentinelBlades] = useState<SentinelBladeModification>(6);
  const [isShipyardOpen, setIsShipyardOpen] = useState<boolean>(false);

  // 3D Canvas viewer controls state
  const [yaw, setYaw] = useState(0.4);
  const [pitch, setPitch] = useState(0.25);
  const [zoom, setZoom] = useState(1.15);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [showWireframeGrid, setShowWireframeGrid] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showDayNightTerminator, setShowDayNightTerminator] = useState(true);

  // Mouse drag interaction
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameCounterRef = useRef(0);

  const selectedObject = SPACE_OBJECTS_DATABASE.find(
    (o) => o.id === (selectedObjectId || 'planet-terra-earth')
  );

  // Filtered list
  const filteredObjects = SPACE_OBJECTS_DATABASE.filter((obj) => {
    const matchesCat = activeCategory === 'ALL' || obj.category === activeCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      obj.name.toLowerCase().includes(query) ||
      obj.subName.toLowerCase().includes(query) ||
      obj.resources.primaryResource.toLowerCase().includes(query) ||
      obj.badge.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  // Handle open object page
  const handleSelectObject = (id: string) => {
    if (onPlayBeep) onPlayBeep('DOCK');
    setSelectedObjectId(id);
    setYaw(0.4);
    setPitch(0.25);
    setZoom(1.15);
  };

  const handleBackToList = () => {
    if (onPlayBeep) onPlayBeep('DOCK');
    setSelectedObjectId(null);
  };

  // Pagination between objects
  const handlePrevNext = (dir: -1 | 1) => {
    if (!selectedObject) return;
    const idx = SPACE_OBJECTS_DATABASE.findIndex((o) => o.id === selectedObject.id);
    if (idx < 0) return;
    const nextIdx =
      (idx + dir + SPACE_OBJECTS_DATABASE.length) % SPACE_OBJECTS_DATABASE.length;
    handleSelectObject(SPACE_OBJECTS_DATABASE[nextIdx].id);
  };

  // Mouse down on 3D canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => prev + dx * 0.008);
    setPitch((prev) => Math.max(-1.45, Math.min(1.45, prev + dy * 0.008)));
  };

  const handleCanvasMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((prev) => Math.max(0.55, Math.min(2.8, prev + delta)));
  };

  // Touch drag support for mobile/tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setYaw((prev) => prev + dx * 0.009);
    setPitch((prev) => Math.max(-1.45, Math.min(1.45, prev + dy * 0.009)));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // 3D Canvas Rendering Engine
  useEffect(() => {
    if (!isOpen || !selectedObjectId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localYaw = yaw;
    let localPitch = pitch;

    const render = () => {
      frameCounterRef.current += 1;
      const frameCounter = frameCounterRef.current;

      if (isAutoRotate && !isDraggingRef.current) {
        localYaw += 0.005;
      } else {
        localYaw = yaw;
      }
      localPitch = pitch;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep space background with subtle stars
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.34 * zoom;

      // Draw faint stars grid in background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.5 + 43) % w);
        const sy = ((i * 97.3 + 89) % h);
        const r = (i % 3 === 0) ? 1.2 : 0.8;
        ctx.globalAlpha = 0.2 + (i % 5) * 0.1;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D Projection math
      const cosY = Math.cos(localYaw);
      const sinY = Math.sin(localYaw);
      const cosP = Math.cos(localPitch);
      const sinP = Math.sin(localPitch);

      // Sun lighting direction vector (e.g. from upper left)
      const sunDir = { x: -0.7, y: -0.4, z: 0.6 };
      const sunLen = Math.sqrt(sunDir.x * sunDir.x + sunDir.y * sunDir.y + sunDir.z * sunDir.z);
      sunDir.x /= sunLen;
      sunDir.y /= sunLen;
      sunDir.z /= sunLen;

      // 3D point projection helper: exact cartesian vector transformation (+Y is up)
      const projectPoint3D = (lx: number, ly: number, lz: number, scale = baseRadius) => {
        // Yaw around Y
        const x1 = lx * cosY + lz * sinY;
        const y1 = ly;
        const z1 = -lx * sinY + lz * cosY;

        // Pitch around X
        const x2 = x1;
        const y2 = y1 * cosP - z1 * sinP;
        const z2 = y1 * sinP + z1 * cosP;

        return {
          x: cx + x2 * scale,
          y: cy - y2 * scale,
          z: z2,
          sx: cx + x2 * scale,
          sy: cy - y2 * scale,
          sz: z2,
          front: z2 >= -0.05,
          normZ: z2,
        };
      };

      const projectSphere = (latRad: number, lonRad: number) => {
        const x0 = Math.cos(latRad) * Math.sin(lonRad);
        const y0 = Math.sin(latRad);
        const z0 = Math.cos(latRad) * Math.cos(lonRad);
        const pt = projectPoint3D(x0, y0, z0);
        return {
          ...pt,
          nx: pt.x - cx,
          ny: cy - pt.y,
          nz: pt.z,
        };
      };

      const cur = selectedObject || SPACE_OBJECTS_DATABASE[0];

      // 1. Draw back shadow / glow
      const glowGrad = ctx.createRadialGradient(
        cx,
        cy,
        baseRadius * 0.8,
        cx,
        cy,
        baseRadius * 1.35
      );
      glowGrad.addColorStop(0, `${cur.atmosphereColor}40`);
      glowGrad.addColorStop(0.5, `${cur.atmosphereColor}15`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // =======================================================================
      // РЕЖИМ А: ОРБИТАЛЬНЫЕ СТАНЦИИ (БУБЛИК, ЗВЕЗДА СМЕРТИ, ЗВЁЗДНЫЕ ВРАТА, КОРИОЛИС)
      // =======================================================================
      if (
        cur.category === 'STATION' ||
        cur.category === 'MEGASTRUCTURE' ||
        cur.modelType === 'MEGASTRUCTURE_TORUS' ||
        cur.modelType === 'MEGASTRUCTURE_DEATH_STAR' ||
        cur.modelType === 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON' ||
        cur.modelType === 'STATION_STARGATE' ||
        cur.modelType === 'STATION_CORIOLIS' ||
        cur.modelType === 'BURAN_SHUTTLE' ||
        cur.modelType === 'MODULAR_EXPLORER_XYZ'
      ) {
        if (cur.modelType === 'MEGASTRUCTURE_TORUS') {
          // ===================================================================
          // 1. ОРБИТАЛЬНЫЙ ТЕРМИНАЛ-БУБЛИК (ТОЧНО КАК НА КАРТЕ)
          // ===================================================================
          const R_maj = 0.74; // Большой радиус тора
          const r_tube = 0.25; // Малый радиус трубки бублика

          const projectTorus3D = (lx: number, ly: number, lz: number) => {
            return projectPoint3D(lx, ly, lz, baseRadius);
          };

          const renderTorusHalf = (isBackHalf: boolean) => {
            const thetaSteps = 48;
            const tubePixR = Math.max(2, r_tube * baseRadius);

            // 1) Тёмный броневой объём трубки бублика (с сохранением сквозного пустого окна по центру!)
            ctx.fillStyle = '#040c1a';
            ctx.globalAlpha = 0.94;
            for (let s = 0; s < thetaSteps; s++) {
              const theta = (s / thetaSteps) * Math.PI * 2;
              const cPt = projectTorus3D(
                R_maj * Math.cos(theta),
                R_maj * Math.sin(theta),
                0
              );
              if (isBackHalf ? cPt.z >= 0 : cPt.z < 0) continue;
              ctx.beginPath();
              ctx.arc(cPt.x, cPt.y, tubePixR * 0.97, 0, Math.PI * 2);
              ctx.fill();
            }

            // 2) Кольцевые параллели тора (10 линий вдоль бублика)
            const phiParallelsDeg = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
            for (const phiDeg of phiParallelsDeg) {
              const phiRad = (phiDeg * Math.PI) / 180;
              const cosPhi = Math.cos(phiRad);
              const sinPhi = Math.sin(phiRad);
              const rho = R_maj + r_tube * cosPhi;
              const hZ = r_tube * sinPhi;
              const isOuterGravityDeck = phiDeg === 0;
              const isInnerHoleRim = phiDeg === 180;

              for (let s = 0; s < thetaSteps; s++) {
                const th1 = (s / thetaSteps) * Math.PI * 2;
                const th2 = ((s + 1) / thetaSteps) * Math.PI * 2;
                const midTh = (th1 + th2) * 0.5;

                const cMid = projectTorus3D(
                  R_maj * Math.cos(midTh),
                  R_maj * Math.sin(midTh),
                  0
                );
                if (isBackHalf ? cMid.z >= 0 : cMid.z < 0) continue;

                const p1 = projectTorus3D(
                  rho * Math.cos(th1),
                  rho * Math.sin(th1),
                  hZ
                );
                const p2 = projectTorus3D(
                  rho * Math.cos(th2),
                  rho * Math.sin(th2),
                  hZ
                );

                const normPt = projectPoint3D(
                  cosPhi * Math.cos(midTh),
                  cosPhi * Math.sin(midTh),
                  sinPhi,
                  1
                );
                const isFrontSurface = normPt.z >= -0.12;

                if (isFrontSurface) {
                  ctx.strokeStyle = isOuterGravityDeck
                    ? '#22d3ee'
                    : isInnerHoleRim
                    ? '#f8fafc'
                    : '#38bdf8';
                  ctx.globalAlpha = isOuterGravityDeck
                    ? 0.96
                    : isInnerHoleRim
                    ? 0.9
                    : 0.58;
                  ctx.lineWidth = isOuterGravityDeck
                    ? 1.9
                    : isInnerHoleRim
                    ? 1.5
                    : 0.95;
                } else {
                  ctx.strokeStyle = '#475569';
                  ctx.globalAlpha = 0.22;
                  ctx.lineWidth = 0.75;
                }

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }

            // 3) Поперечные кольца-меридианы (24 шпангоута кругового сечения трубки бублика)
            const numPoloidalRibs = 24;
            const ribSteps = 20;

            for (let m = 0; m < numPoloidalRibs; m++) {
              const theta = (m / numPoloidalRibs) * Math.PI * 2;
              const cosTh = Math.cos(theta);
              const sinTh = Math.sin(theta);
              const cCenter = projectTorus3D(R_maj * cosTh, R_maj * sinTh, 0);
              if (isBackHalf ? cCenter.z >= 0 : cCenter.z < 0) continue;

              const isSpokeJunctionRib = m % (numPoloidalRibs / 4) === 0;

              for (let rs = 0; rs < ribSteps; rs++) {
                const phi1 = (rs / ribSteps) * Math.PI * 2;
                const phi2 = ((rs + 1) / ribSteps) * Math.PI * 2;
                const midPhi = (phi1 + phi2) * 0.5;

                const rho1 = R_maj + r_tube * Math.cos(phi1);
                const z1 = r_tube * Math.sin(phi1);
                const rho2 = R_maj + r_tube * Math.cos(phi2);
                const z2 = r_tube * Math.sin(phi2);

                const pt1 = projectTorus3D(rho1 * cosTh, rho1 * sinTh, z1);
                const pt2 = projectTorus3D(rho2 * cosTh, rho2 * sinTh, z2);

                const normPt = projectPoint3D(
                  Math.cos(midPhi) * cosTh,
                  Math.cos(midPhi) * sinTh,
                  Math.sin(midPhi),
                  1
                );
                const isFrontRib = normPt.z >= -0.12;

                if (isFrontRib) {
                  ctx.strokeStyle = isSpokeJunctionRib ? '#fbbf24' : '#7dd3fc';
                  ctx.globalAlpha = isSpokeJunctionRib ? 0.95 : 0.65;
                  ctx.lineWidth = isSpokeJunctionRib ? 1.6 : 1.0;
                } else {
                  ctx.strokeStyle = isSpokeJunctionRib ? '#d97706' : '#334155';
                  ctx.globalAlpha = 0.24;
                  ctx.lineWidth = 0.75;
                }

                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }

              // Иллюминаторы жилых палуб на внешнем ободе
              if (m % 2 === 0) {
                const outerDeckPt = projectTorus3D(
                  (R_maj + r_tube * 0.92) * cosTh,
                  (R_maj + r_tube * 0.92) * sinTh,
                  0
                );
                const outerNorm = projectPoint3D(cosTh, sinTh, 0, 1);
                if (outerNorm.z >= -0.1) {
                  ctx.fillStyle = isSpokeJunctionRib ? '#fbbf24' : '#38bdf8';
                  ctx.globalAlpha = 0.9;
                  ctx.beginPath();
                  ctx.arc(
                    outerDeckPt.x,
                    outerDeckPt.y,
                    isSpokeJunctionRib ? 2.4 : 1.6,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                }
              }
            }
          };

          // А) Дальняя половина тора (Z < 0)
          renderTorusHalf(true);

          // Б) 4 ВНУТРЕННИХ ЛУЧА-ПЕРЕХОДА К ЦЕНТРУ БУБЛИКА (0, 0, 0)
          const spokeRadius = 0.056;
          const spokeInnerEnd = R_maj - r_tube + 0.02;
          const hubRadius = 0.11;

          for (let k = 0; k < 4; k++) {
            const spokeAngle = (k * Math.PI) / 2;
            const cosK = Math.cos(spokeAngle);
            const sinK = Math.sin(spokeAngle);
            const perpX = -sinK;
            const perpY = cosK;

            const pHubCenter = projectTorus3D(0, 0, 0);
            const pTorusWall = projectTorus3D(
              spokeInnerEnd * cosK,
              spokeInnerEnd * sinK,
              0
            );

            // 1. Тёмный бронированный корпус цилиндрического луча-перехода
            ctx.strokeStyle = '#061326';
            ctx.globalAlpha = 0.95;
            ctx.lineWidth = Math.max(3, spokeRadius * 2 * baseRadius);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pHubCenter.x, pHubCenter.y);
            ctx.lineTo(pTorusWall.x, pTorusWall.y);
            ctx.stroke();

            // 2. 4 продольные силовые рельсы-фермы в 3D
            const railOffsets: Array<[number, number, string, number]> = [
              [1, 0, '#94a3b8', 0.82],
              [-1, 0, '#94a3b8', 0.82],
              [0, 1, '#e2e8f0', 0.92],
              [0, -1, '#64748b', 0.68],
            ];
            for (const [sOff, zOff, railColor, railAlpha] of railOffsets) {
              const rStart = hubRadius * 0.75;
              const rEnd = spokeInnerEnd;
              const ptStart = projectTorus3D(
                rStart * cosK + sOff * spokeRadius * perpX,
                rStart * sinK + sOff * spokeRadius * perpY,
                zOff * spokeRadius
              );
              const ptEnd = projectTorus3D(
                rEnd * cosK + sOff * spokeRadius * perpX,
                rEnd * sinK + sOff * spokeRadius * perpY,
                zOff * spokeRadius
              );
              ctx.strokeStyle = railColor;
              ctx.globalAlpha = railAlpha;
              ctx.lineWidth = 1.15;
              ctx.beginPath();
              ctx.moveTo(ptStart.x, ptStart.y);
              ctx.lineTo(ptEnd.x, ptEnd.y);
              ctx.stroke();
            }

            // 3. Осевая энергетическая магистраль
            ctx.strokeStyle = '#22d3ee';
            ctx.globalAlpha = 0.9;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(pHubCenter.x, pHubCenter.y);
            ctx.lineTo(pTorusWall.x, pTorusWall.y);
            ctx.stroke();

            // 4. Кольцевые 3D-переборки (шпангоуты)
            const ringStations = [0.16, 0.25, 0.34, 0.42, 0.49];
            for (let stIdx = 0; stIdx < ringStations.length; stIdx++) {
              const rDist = ringStations[stIdx];
              const isCollar = stIdx === ringStations.length - 1;
              const ringRad = isCollar ? spokeRadius * 1.48 : spokeRadius;

              ctx.strokeStyle = isCollar ? '#fbbf24' : '#38bdf8';
              ctx.globalAlpha = isCollar ? 0.96 : 0.78;
              ctx.lineWidth = isCollar ? 1.6 : 1.0;
              ctx.beginPath();
              for (let rs = 0; rs <= 12; rs++) {
                const a = (rs / 12) * Math.PI * 2;
                const ca = Math.cos(a);
                const sa = Math.sin(a);
                const rPt = projectTorus3D(
                  rDist * cosK + ringRad * ca * perpX,
                  rDist * sinK + ringRad * ca * perpY,
                  ringRad * sa
                );
                if (rs === 0) ctx.moveTo(rPt.x, rPt.y);
                else ctx.lineTo(rPt.x, rPt.y);
              }
              ctx.stroke();
            }

            // 5. Движущаяся по лучу лифт-капсула
            const podPhase =
              0.5 + 0.5 * Math.sin(frameCounter * 0.045 + k * 1.57);
            const podR =
              hubRadius + 0.03 + podPhase * (spokeInnerEnd - hubRadius - 0.06);
            const podPt = projectTorus3D(podR * cosK, podR * sinK, 0);
            ctx.fillStyle = '#fde047';
            ctx.globalAlpha = 0.98;
            ctx.beginPath();
            ctx.arc(
              podPt.x,
              podPt.y,
              Math.max(2.2, baseRadius * 0.028),
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // В) ЦЕНТРАЛЬНЫЙ СТЫКОВОЧНЫЙ УЗЕЛ НЕВЕСОМОСТИ (0G)
          const centerHubPt = projectTorus3D(0, 0, 0);
          const hubPixR = Math.max(5, hubRadius * baseRadius);

          ctx.fillStyle = '#061529';
          ctx.globalAlpha = 0.98;
          ctx.beginPath();
          ctx.arc(centerHubPt.x, centerHubPt.y, hubPixR, 0, Math.PI * 2);
          ctx.fill();

          // Экваториальное и меридиональные кольца центрального узла
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let s = 0; s <= 20; s++) {
            const a = (s / 20) * Math.PI * 2;
            const pt = projectTorus3D(
              hubRadius * Math.cos(a),
              hubRadius * Math.sin(a),
              0
            );
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();

          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let s = 0; s <= 20; s++) {
            const a = (s / 20) * Math.PI * 2;
            const pt = projectTorus3D(
              hubRadius * Math.cos(a),
              0,
              hubRadius * Math.sin(a)
            );
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();

          // Пульсирующее ядро
          const corePulseR =
            Math.max(3, hubPixR * 0.42) + Math.sin(frameCounter * 0.1) * 1.2;
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(centerHubPt.x, centerHubPt.y, corePulseR, 0, Math.PI * 2);
          ctx.fill();

          // Осевые шпили стыковки
          const spireTop = projectTorus3D(0, 0, hubRadius * 1.85);
          const spireBot = projectTorus3D(0, 0, -hubRadius * 1.85);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(spireBot.x, spireBot.y);
          ctx.lineTo(spireTop.x, spireTop.y);
          ctx.stroke();

          // Г) Ближняя половина тора (Z >= 0) поверх лучей
          renderTorusHalf(false);
          ctx.globalAlpha = 1.0;
        } else if (cur.modelType === 'MEGASTRUCTURE_DEATH_STAR') {
          // ===================================================================
          // 2. СТАНЦИЯ ТИПА ЗВЕЗДА СМЕРТИ (ТОЧНО КАК НА КАРТЕ)
          // ===================================================================
          const dsGrad = ctx.createRadialGradient(
            cx - baseRadius * 0.25,
            cy - baseRadius * 0.25,
            baseRadius * 0.1,
            cx,
            cy,
            baseRadius
          );
          dsGrad.addColorStop(0, '#0f172a');
          dsGrad.addColorStop(0.7, '#050b14');
          dsGrad.addColorStop(1, '#020617');
          ctx.fillStyle = dsGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // Базис кратера Суперлазера в северном полушарии
          const dishLat = (27 * Math.PI) / 180;
          const dishLon = -Math.PI / 2 - 0.38;
          const dishAngRadius = (24 * Math.PI) / 180;
          const cosDishEdge = Math.cos(dishAngRadius);

          const dishAxisLocal = {
            x: Math.cos(dishLat) * Math.cos(dishLon),
            y: Math.sin(dishLat),
            z: Math.cos(dishLat) * Math.sin(dishLon),
          };
          const dishT1Local = {
            x: -Math.sin(dishLon),
            y: 0,
            z: Math.cos(dishLon),
          };
          const dishT2Local = {
            x: -Math.sin(dishLat) * Math.cos(dishLon),
            y: Math.cos(dishLat),
            z: -Math.sin(dishLat) * Math.sin(dishLon),
          };

          const isInsideDishCone = (nx: number, ny: number, nz: number) =>
            nx * dishAxisLocal.x + ny * dishAxisLocal.y + nz * dishAxisLocal.z >
            cosDishEdge;

          // 1. Техногенные параллели (широты)
          const dsLatitudesDeg = [-72, -54, -36, -18, 18, 36, 54, 72];
          const latSteps = 44;

          for (const latDeg of dsLatitudesDeg) {
            const latRad = (latDeg * Math.PI) / 180;
            const cosLat = Math.cos(latRad);
            const sinLat = Math.sin(latRad);

            for (let s = 0; s < latSteps; s++) {
              const lon1 = (s / latSteps) * Math.PI * 2;
              const lon2 = ((s + 1) / latSteps) * Math.PI * 2;

              const n1 = {
                x: cosLat * Math.cos(lon1),
                y: sinLat,
                z: cosLat * Math.sin(lon1),
              };
              const n2 = {
                x: cosLat * Math.cos(lon2),
                y: sinLat,
                z: cosLat * Math.sin(lon2),
              };

              if (
                isInsideDishCone(n1.x, n1.y, n1.z) ||
                isInsideDishCone(n2.x, n2.y, n2.z)
              )
                continue;

              const pt1 = projectPoint3D(n1.x, n1.y, n1.z);
              const pt2 = projectPoint3D(n2.x, n2.y, n2.z);

              if (pt1.front || pt2.front) {
                ctx.strokeStyle =
                  Math.abs(latDeg) === 18 ? '#cbd5e1' : '#94a3b8';
                ctx.globalAlpha = Math.abs(latDeg) === 18 ? 0.78 : 0.58;
                ctx.lineWidth = 1.0;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              } else if (s % 2 === 0) {
                ctx.strokeStyle = '#64748b';
                ctx.globalAlpha = 0.16;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // 2. Ступенчатые швы бронеплит
          const armorSeamLats = [-45, -27, -10, 10, 27, 45, 63];
          for (const seamLatDeg of armorSeamLats) {
            const latRad = (seamLatDeg * Math.PI) / 180;
            const cosLat = Math.cos(latRad);
            const sinLat = Math.sin(latRad);
            for (let s = 0; s < 32; s++) {
              if ((s + Math.abs(seamLatDeg)) % 3 !== 0) continue;
              const lon1 = (s / 32) * Math.PI * 2;
              const lon2 = ((s + 0.65) / 32) * Math.PI * 2;
              const n1 = {
                x: cosLat * Math.cos(lon1),
                y: sinLat,
                z: cosLat * Math.sin(lon1),
              };
              const n2 = {
                x: cosLat * Math.cos(lon2),
                y: sinLat,
                z: cosLat * Math.sin(lon2),
              };
              if (
                isInsideDishCone(n1.x, n1.y, n1.z) ||
                isInsideDishCone(n2.x, n2.y, n2.z)
              )
                continue;
              const pt1 = projectPoint3D(n1.x, n1.y, n1.z);
              const pt2 = projectPoint3D(n2.x, n2.y, n2.z);
              if (pt1.front && pt2.front) {
                ctx.strokeStyle = '#38bdf8';
                ctx.globalAlpha = 0.42;
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // 3. Меридианы Звезды Смерти
          const numMeridians = 16;
          const merSteps = 28;
          for (let m = 0; m < numMeridians; m++) {
            const lonRad = (m / numMeridians) * Math.PI * 2;
            const cosLon = Math.cos(lonRad);
            const sinLon = Math.sin(lonRad);
            const isPrimeMeridian = m % 4 === 0;

            for (let s = 0; s < merSteps; s++) {
              const lat1 = -Math.PI / 2 + (s / merSteps) * Math.PI;
              const lat2 = -Math.PI / 2 + ((s + 1) / merSteps) * Math.PI;

              const midLatDeg = (((lat1 + lat2) * 0.5) * 180) / Math.PI;
              if (Math.abs(midLatDeg) < 4.2) continue; // Экваториальная траншея

              const n1 = {
                x: Math.cos(lat1) * cosLon,
                y: Math.sin(lat1),
                z: Math.cos(lat1) * sinLon,
              };
              const n2 = {
                x: Math.cos(lat2) * cosLon,
                y: Math.sin(lat2),
                z: Math.cos(lat2) * sinLon,
              };

              if (
                isInsideDishCone(n1.x, n1.y, n1.z) ||
                isInsideDishCone(n2.x, n2.y, n2.z)
              )
                continue;

              const pt1 = projectPoint3D(n1.x, n1.y, n1.z);
              const pt2 = projectPoint3D(n2.x, n2.y, n2.z);

              if (pt1.front || pt2.front) {
                ctx.strokeStyle = isPrimeMeridian ? '#e2e8f0' : '#94a3b8';
                ctx.globalAlpha = isPrimeMeridian ? 0.78 : 0.52;
                ctx.lineWidth = isPrimeMeridian ? 1.2 : 0.9;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              } else if (s % 2 === 0) {
                ctx.strokeStyle = '#64748b';
                ctx.globalAlpha = 0.14;
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // 4. Экваториальный каньон (двойная утопленная траншея)
          const trenchHalfDeg = 4.2;
          const trenchTopRad = (trenchHalfDeg * Math.PI) / 180;
          const trenchBotRad = (-trenchHalfDeg * Math.PI) / 180;
          const trenchSteps = 48;
          const trenchFloorScale = 0.942;

          for (let s = 0; s < trenchSteps; s++) {
            const lon1 = (s / trenchSteps) * Math.PI * 2;
            const lon2 = ((s + 1) / trenchSteps) * Math.PI * 2;
            const c1 = Math.cos(lon1);
            const s1 = Math.sin(lon1);
            const c2 = Math.cos(lon2);
            const s2 = Math.sin(lon2);

            const top1 = projectPoint3D(
              Math.cos(trenchTopRad) * c1,
              Math.sin(trenchTopRad),
              Math.cos(trenchTopRad) * s1
            );
            const top2 = projectPoint3D(
              Math.cos(trenchTopRad) * c2,
              Math.sin(trenchTopRad),
              Math.cos(trenchTopRad) * s2
            );
            const bot1 = projectPoint3D(
              Math.cos(trenchBotRad) * c1,
              Math.sin(trenchBotRad),
              Math.cos(trenchBotRad) * s1
            );
            const bot2 = projectPoint3D(
              Math.cos(trenchBotRad) * c2,
              Math.sin(trenchBotRad),
              Math.cos(trenchBotRad) * s2
            );

            const mid1 = projectPoint3D(
              c1 * trenchFloorScale,
              0,
              s1 * trenchFloorScale
            );
            const mid2 = projectPoint3D(
              c2 * trenchFloorScale,
              0,
              s2 * trenchFloorScale
            );

            if (top1.front || top2.front) {
              ctx.strokeStyle = '#f8fafc';
              ctx.globalAlpha = 0.95;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(top1.x, top1.y);
              ctx.lineTo(top2.x, top2.y);
              ctx.moveTo(bot1.x, bot1.y);
              ctx.lineTo(bot2.x, bot2.y);
              ctx.stroke();

              ctx.strokeStyle = '#38bdf8';
              ctx.globalAlpha = 0.82;
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.moveTo(mid1.x, mid1.y);
              ctx.lineTo(mid2.x, mid2.y);
              ctx.stroke();

              if (s % 2 === 0) {
                ctx.strokeStyle = '#94a3b8';
                ctx.globalAlpha = 0.75;
                ctx.lineWidth = 0.95;
                ctx.beginPath();
                ctx.moveTo(top1.x, top1.y);
                ctx.lineTo(mid1.x, mid1.y);
                ctx.lineTo(bot1.x, bot1.y);
                ctx.stroke();

                if (s % 4 === 0) {
                  ctx.fillStyle = s % 8 === 0 ? '#f43f5e' : '#fde047';
                  ctx.globalAlpha = 0.9;
                  ctx.beginPath();
                  ctx.arc(mid1.x, mid1.y, 1.6, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
          }

          // 5. Кратер Суперлазера в северном полушарии
          const projectDishPoint = (alphaRad: number, phiRad: number) => {
            const sinA = Math.sin(alphaRad);
            const cosA = Math.cos(alphaRad);
            const cosP = Math.cos(phiRad);
            const sinP = Math.sin(phiRad);
            const nx =
              cosA * dishAxisLocal.x +
              sinA * (cosP * dishT1Local.x + sinP * dishT2Local.x);
            const ny =
              cosA * dishAxisLocal.y +
              sinA * (cosP * dishT1Local.y + sinP * dishT2Local.y);
            const nz =
              cosA * dishAxisLocal.z +
              sinA * (cosP * dishT1Local.z + sinP * dishT2Local.z);
            const recess =
              1 - 0.16 * Math.cos((alphaRad / dishAngRadius) * (Math.PI / 2));
            return projectPoint3D(nx * recess, ny * recess, nz * recess);
          };

          const dishRingFractions = [1.0, 0.72, 0.45, 0.2];
          const dishCircleSteps = 40;

          for (let rIdx = 0; rIdx < dishRingFractions.length; rIdx++) {
            const frac = dishRingFractions[rIdx];
            const alpha = dishAngRadius * frac;
            const isOuterRim = rIdx === 0;
            const isInnerCoreRing = rIdx === dishRingFractions.length - 1;

            for (let s = 0; s < dishCircleSteps; s++) {
              const phi1 = (s / dishCircleSteps) * Math.PI * 2;
              const phi2 = ((s + 1) / dishCircleSteps) * Math.PI * 2;
              const pt1 = projectDishPoint(alpha, phi1);
              const pt2 = projectDishPoint(alpha, phi2);

              if (pt1.front || pt2.front) {
                ctx.strokeStyle = isOuterRim
                  ? '#f8fafc'
                  : isInnerCoreRing
                  ? '#4ade80'
                  : '#cbd5e1';
                ctx.globalAlpha = isOuterRim
                  ? 0.96
                  : isInnerCoreRing
                  ? 0.92
                  : 0.78;
                ctx.lineWidth = isOuterRim ? 1.9 : isInnerCoreRing ? 1.4 : 1.1;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // 8 радиальных фокусирующих лучей-волноводов
          const dishCenterPt = projectDishPoint(0, 0);
          for (let k = 0; k < 8; k++) {
            const phi = (k / 8) * Math.PI * 2;
            for (let rStep = 0; rStep < 6; rStep++) {
              const a1 = dishAngRadius * (1 - rStep / 6);
              const a2 = dishAngRadius * (1 - (rStep + 1) / 6);
              const p1 = projectDishPoint(a1, phi);
              const p2 = projectDishPoint(a2, phi);
              if (p1.front || p2.front) {
                ctx.strokeStyle = rStep >= 4 ? '#4ade80' : '#94a3b8';
                ctx.globalAlpha = rStep >= 4 ? 0.9 : 0.75;
                ctx.lineWidth = rStep >= 4 ? 1.25 : 1.0;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          }

          // Центральная линза Суперлазера
          if (dishCenterPt.front) {
            const pulseLensR =
              Math.max(3, baseRadius * 0.055) +
              Math.sin(frameCounter * 0.12) * 1.2;
            ctx.fillStyle = '#22c55e';
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.arc(dishCenterPt.x, dishCenterPt.y, pulseLensR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#bbf7d0';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(
              dishCenterPt.x,
              dishCenterPt.y,
              pulseLensR * 1.65,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }

          // Внешний контур сферы Звезды Смерти
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Полюсные башни
          const northPolePt = projectPoint3D(0, 1, 0);
          const southPolePt = projectPoint3D(0, -1, 0);
          const axisSpike = Math.max(8, baseRadius * 0.14);
          const nSpike = projectPoint3D(0, 1 + axisSpike / baseRadius, 0);
          const sSpike = projectPoint3D(0, -(1 + axisSpike / baseRadius), 0);

          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(northPolePt.x, northPolePt.y);
          ctx.lineTo(nSpike.x, nSpike.y);
          ctx.moveTo(southPolePt.x, southPolePt.y);
          ctx.lineTo(sSpike.x, sSpike.y);
          ctx.stroke();

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(northPolePt.x, northPolePt.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(southPolePt.x, southPolePt.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (cur.modelType === 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON') {
          // ===================================================================
          // 2.5. ОРБИТАЛЬНАЯ МЕГАВЕРФЬ «ТАЛИОН» · СРЕДНИЙ РОМБОТРИАКОНТАЭДР
          //      Размер: 0.5 диаметра планеты (D = 6 371 км). 30 ромбов, 60 ребер, 24 узла
          // ===================================================================
          renderMedialRhombicShipyardScene(
            ctx,
            cx,
            cy,
            baseRadius * 0.92,
            yaw,
            pitch,
            {
              showPlanet: true,
              showLasers: true,
              showBeacons: true,
              showWireframe: true,
              planetScaleRatio: 2.0,
              timeMs: Date.now(),
            }
          );
          ctx.globalAlpha = 1.0;
        } else if (cur.modelType === 'STATION_STARGATE') {
          // ===================================================================
          // 3. ЗВЁЗДНЫЕ ВРАТА (ТОЧНО КАК НА КАРТЕ: НЕВРАЩАЮЩЕЕСЯ 3D-КОЛЬЦО,
          //    9 V-ШЕВРОНОВ С ЯНТАРНЫМИ КРИСТАЛЛАМИ И АКТИВНЫЙ ГОРИЗОНТ СОБЫТИЙ)
          // ===================================================================
          const R_outer = 1.0;
          const R_chevTrack = 0.91;
          const R_glyphTrack = 0.79;
          const R_portal = 0.7;
          const halfZ = 0.1;

          // Проекция точки в системе координат Врат (Врата не вращаются вокруг своей оси)
          const projectGatePt = (lx: number, ly: number, lz: number) => {
            return projectPoint3D(lx, ly, lz);
          };

          // А) АКТИВНЫЙ «ГОРИЗОНТ СОБЫТИЙ» ЧЕРВОТОЧИНЫ (R <= 0.70)
          const portalCenterPt = projectGatePt(0, 0, 0);
          const portalPixR = Math.max(8, R_portal * baseRadius);
          const horizonGrad = ctx.createRadialGradient(
            portalCenterPt.x,
            portalCenterPt.y,
            portalPixR * 0.05,
            portalCenterPt.x,
            portalCenterPt.y,
            portalPixR
          );
          horizonGrad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');
          horizonGrad.addColorStop(0.28, 'rgba(34, 211, 238, 0.65)');
          horizonGrad.addColorStop(0.68, 'rgba(99, 102, 241, 0.45)');
          horizonGrad.addColorStop(1, 'rgba(4, 12, 28, 0.96)');

          ctx.save();
          ctx.fillStyle = horizonGrad;
          ctx.beginPath();
          const portalRimSteps = 48;
          for (let s = 0; s <= portalRimSteps; s++) {
            const a = (s / portalRimSteps) * Math.PI * 2;
            const pt = projectGatePt(R_portal * Math.cos(a), R_portal * Math.sin(a), 0);
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.fill();
          ctx.restore();

          // Концентрические волновые стоячие ПАРАЛЛЕЛИ Горизонта Событий
          const horizonParallels = [0.12, 0.23, 0.35, 0.47, 0.59, 0.68];
          const hSegs = 40;
          for (let pIdx = 0; pIdx < horizonParallels.length; pIdx++) {
            const rH = horizonParallels[pIdx];
            const waveZ =
              0.055 *
              Math.sin(rH * 14.0 - frameCounter * 0.065) *
              (1 - rH * 0.45);
            ctx.strokeStyle =
              pIdx % 2 === 0 ? '#38bdf8' : pIdx === 0 ? '#f8fafc' : '#818cf8';
            ctx.globalAlpha = pIdx === 0 ? 0.95 : 0.72;
            ctx.lineWidth = pIdx === 0 || pIdx === horizonParallels.length - 1 ? 1.4 : 1.0;
            ctx.beginPath();
            for (let s = 0; s <= hSegs; s++) {
              const a = (s / hSegs) * Math.PI * 2;
              const rippleZ =
                waveZ +
                0.012 * Math.cos(a * 9) * Math.sin(frameCounter * 0.05 + pIdx);
              const pt = projectGatePt(
                rH * Math.cos(a),
                rH * Math.sin(a),
                rippleZ
              );
              if (s === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }

          // 18 радиальных МЕРИДИАНОВ Горизонта Событий
          const numHorizonMeridians = 18;
          const radialSteps = 8;
          for (let m = 0; m < numHorizonMeridians; m++) {
            const mAngle = Math.PI / 2 + (m * Math.PI * 2) / numHorizonMeridians;
            const cosM = Math.cos(mAngle);
            const sinM = Math.sin(mAngle);
            const isChevronAlignedRay = m % 2 === 0;

            ctx.strokeStyle = isChevronAlignedRay ? '#22d3ee' : '#a855f7';
            ctx.globalAlpha = isChevronAlignedRay ? 0.88 : 0.55;
            ctx.lineWidth = isChevronAlignedRay ? 1.3 : 0.85;
            ctx.beginPath();
            for (let rs = 0; rs <= radialSteps; rs++) {
              const rFrac = (rs / radialSteps) * R_portal;
              const zCurve =
                0.055 *
                Math.sin(rFrac * 14.0 - frameCounter * 0.065) *
                (1 - rFrac * 0.45);
              const pt = projectGatePt(rFrac * cosM, rFrac * sinM, zCurve);
              if (rs === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }

          // Центральный квантовый узел-сингулярность (всплеск «Кавош»)
          const vortexSpikeZ = 0.16 + 0.04 * Math.sin(frameCounter * 0.08);
          const vFront = projectGatePt(0, 0, -vortexSpikeZ);
          const vBack = projectGatePt(0, 0, vortexSpikeZ);
          ctx.strokeStyle = '#e0f2fe';
          ctx.globalAlpha = 0.95;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(vBack.x, vBack.y);
          ctx.lineTo(vFront.x, vFront.y);
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(
            portalCenterPt.x,
            portalCenterPt.y,
            Math.max(3.5, baseRadius * 0.045),
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Б) МОНОЛИТНОЕ 3D-КОЛЬЦО ЗВЁЗДНЫХ ВРАТ (R от 0.70 до 1.00)
          const R_ringMid = (R_outer + R_portal) * 0.5;
          const r_ringHalf = (R_outer - R_portal) * 0.5;
          const ringSubSteps = 48;
          const ringTubePix = Math.max(3, r_ringHalf * baseRadius);
          ctx.fillStyle = '#050816';
          ctx.globalAlpha = 0.96;
          for (let s = 0; s < ringSubSteps; s++) {
            const th = (s / ringSubSteps) * Math.PI * 2;
            const cPt = projectGatePt(
              R_ringMid * Math.cos(th),
              R_ringMid * Math.sin(th),
              0
            );
            ctx.beginPath();
            ctx.arc(cPt.x, cPt.y, ringTubePix * 0.96, 0, Math.PI * 2);
            ctx.fill();
          }

          // Концентрические 3D-дорожки (параллели) на передней и задней гранях
          const ringTracks: Array<{
            r: number;
            z: number;
            color: string;
            alpha: number;
            width: number;
          }> = [
            { r: R_outer, z: halfZ, color: '#6b21a8', alpha: 0.48, width: 1.0 },
            { r: R_portal, z: halfZ, color: '#0284c7', alpha: 0.48, width: 1.0 },
            { r: R_outer, z: -halfZ, color: '#c084fc', alpha: 0.96, width: 2.0 },
            { r: R_chevTrack, z: -halfZ * 0.85, color: '#38bdf8', alpha: 0.78, width: 1.15 },
            { r: R_glyphTrack, z: -halfZ * 0.85, color: '#818cf8', alpha: 0.75, width: 1.1 },
            { r: R_portal, z: -halfZ, color: '#22d3ee', alpha: 0.98, width: 2.1 },
          ];

          for (const tr of ringTracks) {
            ctx.strokeStyle = tr.color;
            ctx.globalAlpha = tr.alpha;
            ctx.lineWidth = tr.width;
            ctx.beginPath();
            for (let s = 0; s <= ringSubSteps; s++) {
              const a = (s / ringSubSteps) * Math.PI * 2;
              const pt = projectGatePt(tr.r * Math.cos(a), tr.r * Math.sin(a), tr.z);
              if (s === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }

          // 36 радиальных 3D-шпангоутов + статичные руны-глифы созвездий
          const numGateSegments = 36;
          for (let seg = 0; seg < numGateSegments; seg++) {
            const th = Math.PI / 2 + (seg * Math.PI * 2) / numGateSegments;
            const cosT = Math.cos(th);
            const sinT = Math.sin(th);
            const isChevronAxis = seg % 4 === 0;

            const pOutFront = projectGatePt(R_outer * cosT, R_outer * sinT, -halfZ);
            const pOutBack = projectGatePt(R_outer * cosT, R_outer * sinT, halfZ);
            const pInFront = projectGatePt(R_portal * cosT, R_portal * sinT, -halfZ);
            const pInBack = projectGatePt(R_portal * cosT, R_portal * sinT, halfZ);

            ctx.strokeStyle = isChevronAxis ? '#fbbf24' : '#94a3b8';
            ctx.globalAlpha = isChevronAxis ? 0.88 : 0.45;
            ctx.lineWidth = isChevronAxis ? 1.4 : 0.85;
            ctx.beginPath();
            ctx.moveTo(pInBack.x, pInBack.y);
            ctx.lineTo(pInFront.x, pInFront.y);
            ctx.lineTo(pOutFront.x, pOutFront.y);
            ctx.lineTo(pOutBack.x, pOutBack.y);
            ctx.closePath();
            ctx.stroke();

            // Руны-глифы
            if (!isChevronAxis) {
              const midTh = th + Math.PI / numGateSegments;
              const cM = Math.cos(midTh);
              const sM = Math.sin(midTh);
              const rG = (R_chevTrack + R_glyphTrack) * 0.5;
              const glyphCenter = projectGatePt(rG * cM, rG * sM, -halfZ * 0.9);
              const gSize = Math.max(2.0, baseRadius * 0.026);

              ctx.strokeStyle = seg % 2 === 0 ? '#38bdf8' : '#c084fc';
              ctx.globalAlpha = 0.82;
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              if (seg % 3 === 0) {
                ctx.moveTo(glyphCenter.x, glyphCenter.y - gSize);
                ctx.lineTo(glyphCenter.x + gSize * 0.85, glyphCenter.y + gSize * 0.7);
                ctx.lineTo(glyphCenter.x - gSize * 0.85, glyphCenter.y + gSize * 0.7);
                ctx.closePath();
              } else if (seg % 3 === 1) {
                ctx.moveTo(glyphCenter.x, glyphCenter.y - gSize);
                ctx.lineTo(glyphCenter.x + gSize, glyphCenter.y);
                ctx.lineTo(glyphCenter.x, glyphCenter.y + gSize);
                ctx.lineTo(glyphCenter.x - gSize, glyphCenter.y);
                ctx.closePath();
              } else {
                ctx.moveTo(glyphCenter.x - gSize, glyphCenter.y - gSize * 0.6);
                ctx.lineTo(glyphCenter.x, glyphCenter.y + gSize * 0.8);
                ctx.lineTo(glyphCenter.x + gSize, glyphCenter.y - gSize * 0.6);
              }
              ctx.stroke();
            }
          }

          // В) 9 КУЛЬТОВЫХ 3D ЗАМКОВ-ШЕВРОНОВ ПО ПЕРИМЕТРУ ЗВЁЗДНЫХ ВРАТ
          for (let c = 0; c < 9; c++) {
            const cAngle = Math.PI / 2 + (c * Math.PI * 2) / 9;
            const dAng = 0.088;
            const dAngInner = 0.042;
            const zChev = -halfZ * 1.32;
            const zChevBack = halfZ * 1.15;

            const pWingL = projectGatePt(
              1.055 * Math.cos(cAngle - dAng),
              1.055 * Math.sin(cAngle - dAng),
              zChev
            );
            const pWingR = projectGatePt(
              1.055 * Math.cos(cAngle + dAng),
              1.055 * Math.sin(cAngle + dAng),
              zChev
            );
            const pOuterNotch = projectGatePt(
              1.02 * Math.cos(cAngle),
              1.02 * Math.sin(cAngle),
              zChev
            );
            const pTip = projectGatePt(
              0.665 * Math.cos(cAngle),
              0.665 * Math.sin(cAngle),
              zChev
            );
            const pInnerL = projectGatePt(
              0.98 * Math.cos(cAngle - dAngInner),
              0.98 * Math.sin(cAngle - dAngInner),
              zChev - 0.01
            );
            const pInnerR = projectGatePt(
              0.98 * Math.cos(cAngle + dAngInner),
              0.98 * Math.sin(cAngle + dAngInner),
              zChev - 0.01
            );
            const pInnerTip = projectGatePt(
              0.735 * Math.cos(cAngle),
              0.735 * Math.sin(cAngle),
              zChev - 0.01
            );

            const pWingLBack = projectGatePt(
              1.055 * Math.cos(cAngle - dAng),
              1.055 * Math.sin(cAngle - dAng),
              zChevBack
            );
            const pWingRBack = projectGatePt(
              1.055 * Math.cos(cAngle + dAng),
              1.055 * Math.sin(cAngle + dAng),
              zChevBack
            );

            // Бронекожух
            ctx.fillStyle = '#0f172a';
            ctx.globalAlpha = 0.96;
            ctx.beginPath();
            ctx.moveTo(pWingL.x, pWingL.y);
            ctx.lineTo(pOuterNotch.x, pOuterNotch.y);
            ctx.lineTo(pWingR.x, pWingR.y);
            ctx.lineTo(pTip.x, pTip.y);
            ctx.closePath();
            ctx.fill();

            // Боковые рёбра
            ctx.strokeStyle = '#f59e0b';
            ctx.globalAlpha = 0.65;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(pWingL.x, pWingL.y);
            ctx.lineTo(pWingLBack.x, pWingLBack.y);
            ctx.lineTo(pWingRBack.x, pWingRBack.y);
            ctx.lineTo(pWingR.x, pWingR.y);
            ctx.stroke();

            // Главный контур замка-шеврона
            ctx.strokeStyle = c === 0 ? '#fde047' : '#fbbf24';
            ctx.globalAlpha = 0.98;
            ctx.lineWidth = c === 0 ? 2.1 : 1.65;
            ctx.beginPath();
            ctx.moveTo(pWingL.x, pWingL.y);
            ctx.lineTo(pOuterNotch.x, pOuterNotch.y);
            ctx.lineTo(pWingR.x, pWingR.y);
            ctx.lineTo(pTip.x, pTip.y);
            ctx.closePath();
            ctx.stroke();

            // Внутренняя стрела
            ctx.strokeStyle = c === 0 ? '#22d3ee' : '#f97316';
            ctx.globalAlpha = 0.95;
            ctx.lineWidth = 1.35;
            ctx.beginPath();
            ctx.moveTo(pInnerL.x, pInnerL.y);
            ctx.lineTo(pInnerTip.x, pInnerTip.y);
            ctx.lineTo(pInnerR.x, pInnerR.y);
            ctx.stroke();

            // Световой кристалл шеврона
            ctx.fillStyle = c === 0 ? '#22d3ee' : '#fde047';
            ctx.beginPath();
            ctx.arc(
              pInnerTip.x,
              pInnerTip.y,
              Math.max(2.4, baseRadius * 0.028),
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        } else if (cur.modelType === 'STATION_CORIOLIS') {
          // ===================================================================
          // 4. СТАНЦИЯ КОРИОЛИС (КУБООКТАЭДР СО СТЫКОВОЧНЫМ ШЛЮЗОМ И ОГНЯМИ)
          // ===================================================================
          // Точные координаты меша CORIOLIS_MESH из игры
          const coriolisScale = 1.0 / 110;
          const coriolisVertices = [
            { x: -60, y: -60, z: 90 },
            { x: 60, y: -60, z: 90 },
            { x: 60, y: 60, z: 90 },
            { x: -60, y: 60, z: 90 },
            { x: -110, y: -45, z: 0 },
            { x: -45, y: -110, z: 0 },
            { x: 45, y: -110, z: 0 },
            { x: 110, y: -45, z: 0 },
            { x: 110, y: 45, z: 0 },
            { x: 45, y: 110, z: 0 },
            { x: -45, y: 110, z: 0 },
            { x: -110, y: 45, z: 0 },
            { x: -60, y: -60, z: -90 },
            { x: 60, y: -60, z: -90 },
            { x: 60, y: 60, z: -90 },
            { x: -60, y: 60, z: -90 },
            // Стыковочный шлюз
            { x: -28, y: -10, z: 91 },
            { x: 28, y: -10, z: 91 },
            { x: 28, y: 10, z: 91 },
            { x: -28, y: 10, z: 91 },
          ];

          const coriolisEdges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 4],
            [12, 13], [13, 14], [14, 15], [15, 12],
            [0, 4], [0, 5], [1, 6], [1, 7], [2, 8], [2, 9], [3, 10], [3, 11],
            [12, 4], [12, 5], [13, 6], [13, 7], [14, 8], [14, 9], [15, 10], [15, 11],
            [16, 17], [17, 18], [18, 19], [19, 16],
          ];

          const projV = coriolisVertices.map((v) =>
            projectPoint3D(v.x * coriolisScale, v.y * coriolisScale, v.z * coriolisScale)
          );

          // Заливка тёмного монолитного корпуса станции
          ctx.fillStyle = '#050b14';
          ctx.globalAlpha = 0.94;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius * 0.92, 0, Math.PI * 2);
          ctx.fill();

          // 3D-рёбра станции Кориолис в стиле Elite
          for (const edge of coriolisEdges) {
            const p1 = projV[edge[0]];
            const p2 = projV[edge[1]];
            const isSlot = edge[0] >= 16 || edge[1] >= 16;

            if (p1.front || p2.front) {
              ctx.strokeStyle = isSlot ? '#06b6d4' : '#38bdf8';
              ctx.globalAlpha = isSlot ? 0.98 : 0.85;
              ctx.lineWidth = isSlot ? 2.0 : 1.3;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            } else {
              ctx.strokeStyle = '#1e293b';
              ctx.globalAlpha = 0.35;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }

          // Навигационные посадочные огни на стыковочном шлюзе (зелёный справа, красный слева)
          const pSlotR = projV[17];
          const pSlotL = projV[16];
          if (pSlotR.front) {
            ctx.fillStyle = '#22c55e';
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.arc(pSlotR.x, pSlotR.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          if (pSlotL.front) {
            ctx.fillStyle = '#ef4444';
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.arc(pSlotL.x, pSlotL.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;
        } else if (cur.modelType === 'BURAN_SHUTTLE') {
          // ===================================================================
          // 5. СТАНДАРТНЫЙ ЧЕЛНОК ТИПА «БУРАН / ШАТТЛ» (ТОЧНО КАК НА КАРТЕ)
          //    ОСНАЩЕНИЕ ПО ПРОГРАММЕ ББД:
          //    • Каюта (модуль связи и библиотека)
          //    • Операционная рубка (навигационная и огневая рубка)
          //    • Трюм на 40 метрических тонн (арочные шпангоуты)
          //    • Вооружение: минимальный лазер и минимальная плазменная пушка
          //    • Механизм гравитационного захвата
          //    • Стандартный радар
          //    • Стандартная спаренная солнечная батарея в виде крыльев
          // ===================================================================
          const projectLocal3D = (lx: number, ly: number, lz: number) => {
            return projectPoint3D(lx, ly, lz, baseRadius);
          };

          const hullAccentColor = '#38bdf8';

          // Вспомогательная отрисовка замкнутого 3D-полигона
          const drawPoly3D = (
            pts: Array<[number, number, number]>,
            fill: string | null,
            stroke: string | null,
            lineWidth = 1.2,
            alpha = 1.0
          ) => {
            if (pts.length < 2) return;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            for (let i = 0; i < pts.length; i++) {
              const p = projectLocal3D(pts[i][0], pts[i][1], pts[i][2]);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            if (fill) {
              ctx.fillStyle = fill;
              ctx.fill();
            }
            if (stroke) {
              ctx.strokeStyle = stroke;
              ctx.lineWidth = lineWidth;
              ctx.stroke();
            }
          };

          // Вспомогательная отрисовка 3D-линии
          const drawLine3D = (
            p1: [number, number, number],
            p2: [number, number, number],
            stroke: string,
            lineWidth = 1.1,
            alpha = 0.9
          ) => {
            const a = projectLocal3D(p1[0], p1[1], p1[2]);
            const b = projectLocal3D(p2[0], p2[1], p2[2]);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          };

          // 1. Чёрный керамический теплозащитный экран днища и двойное дельтавидное крыло Бурана
          const wingBellyOutline: Array<[number, number, number]> = [
            [0, -0.06, 0.98], // Остриё носа
            [-0.14, -0.08, 0.80],
            [-0.25, -0.10, 0.42], // Корневой наплыв левого крыла (strake)
            [-0.42, -0.10, 0.14], // Излом двойной дельты
            [-0.92, -0.09, -0.44], // Передняя законцовка левого крыла
            [-0.92, -0.09, -0.72], // Задняя законцовка левого крыла
            [-0.28, -0.10, -0.82], // Внутренний край левого элевона
            [0.28, -0.10, -0.82], // Внутренний край правого элевона
            [0.92, -0.09, -0.72], // Задняя законцовка правого крыла
            [0.92, -0.09, -0.44], // Передняя законцовка правого крыла
            [0.42, -0.10, 0.14], // Излом двойной дельты
            [0.25, -0.10, 0.42], // Корневой наплыв правого крыла
            [0.14, -0.08, 0.80],
          ];

          drawPoly3D(
            wingBellyOutline,
            '#050b16',
            hullAccentColor,
            2.0,
            0.96
          );

          // 2. Верхняя обшивка левой и правой консоли двойного дельта-крыла
          const leftWingTop: Array<[number, number, number]> = [
            [-0.22, -0.04, 0.40],
            [-0.41, -0.05, 0.13],
            [-0.90, -0.06, -0.44],
            [-0.90, -0.06, -0.70],
            [-0.24, -0.05, -0.78],
          ];
          const rightWingTop: Array<[number, number, number]> = [
            [0.22, -0.04, 0.40],
            [0.41, -0.05, 0.13],
            [0.90, -0.06, -0.44],
            [0.90, -0.06, -0.70],
            [0.24, -0.05, -0.78],
          ];
          drawPoly3D(leftWingTop, '#0f172a', '#e2e8f0', 1.5, 0.94);
          drawPoly3D(rightWingTop, '#0f172a', '#e2e8f0', 1.5, 0.94);

          // 3. СТАНДАРТНАЯ СПАРЕННАЯ СОЛНЕЧНАЯ БАТАРЕЯ В ВИДЕ КРЫЛЬЕВ
          // (Фотоэлектрические панели на поверхности консолей двойного дельта-крыла)
          const leftSolarWing: Array<[number, number, number]> = [
            [-0.30, -0.038, 0.28],
            [-0.46, -0.045, 0.08],
            [-0.82, -0.055, -0.42],
            [-0.82, -0.055, -0.64],
            [-0.30, -0.045, -0.70],
          ];
          const rightSolarWing: Array<[number, number, number]> = [
            [0.30, -0.038, 0.28],
            [0.46, -0.045, 0.08],
            [0.82, -0.055, -0.42],
            [0.82, -0.055, -0.64],
            [0.30, -0.045, -0.70],
          ];
          drawPoly3D(leftSolarWing, '#032338', '#38bdf8', 1.3, 0.95);
          drawPoly3D(rightSolarWing, '#032338', '#38bdf8', 1.3, 0.95);

          // Стрингерные линии фотоэлементов солнечных батарей на крыльях
          for (let sIdx = 1; sIdx <= 4; sIdx++) {
            const frac = sIdx / 5;
            const zLine = 0.15 - frac * 0.75;
            const xSpan = 0.32 + frac * 0.48;
            drawLine3D([-0.28, -0.042, zLine], [-xSpan, -0.052, zLine], '#fde047', 0.9, 0.85);
            drawLine3D([0.28, -0.042, zLine], [xSpan, -0.052, zLine], '#fde047', 0.9, 0.85);
          }

          // Элевоны (задние кромки управления)
          const leftElevon: Array<[number, number, number]> = [
            [-0.26, -0.06, -0.66],
            [-0.88, -0.07, -0.58],
            [-0.90, -0.07, -0.71],
            [-0.26, -0.06, -0.79],
          ];
          const rightElevon: Array<[number, number, number]> = [
            [0.26, -0.06, -0.66],
            [0.88, -0.07, -0.58],
            [0.90, -0.07, -0.71],
            [0.26, -0.06, -0.79],
          ];
          drawPoly3D(leftElevon, '#1e293b', '#38bdf8', 1.2, 0.92);
          drawPoly3D(rightElevon, '#1e293b', '#38bdf8', 1.2, 0.92);

          // 4. ЦИЛИНДРИЧЕСКИЙ ФЮЗЕЛЯЖ И ГРУЗОВОЙ ТРЮМ НА 40 МЕТРИЧЕСКИХ ТОНН
          const fuselageTopOutline: Array<[number, number, number]> = [
            [0, -0.05, 0.98],
            [-0.14, 0.04, 0.72],
            [-0.22, 0.12, 0.42],
            [-0.23, 0.16, -0.74],
            [0.23, 0.16, -0.74],
            [0.22, 0.12, 0.42],
            [0.14, 0.04, 0.72],
          ];
          drawPoly3D(fuselageTopOutline, '#0b1528', '#f8fafc', 1.6, 0.96);

          // Поперечные арочные шпангоуты грузового трюма (полезная ёмкость 40 т)
          const payloadFramesZ = [0.40, 0.24, 0.08, -0.08, -0.24, -0.40, -0.56, -0.72];
          const archAngles = [
            -Math.PI * 0.5,
            -Math.PI * 0.28,
            -Math.PI * 0.1,
            Math.PI * 0.1,
            Math.PI * 0.28,
            Math.PI * 0.5,
          ];

          for (let fIdx = 0; fIdx < payloadFramesZ.length; fIdx++) {
            const fz = payloadFramesZ[fIdx];
            const isBulkhead = fIdx === 0 || fIdx === payloadFramesZ.length - 1;
            ctx.strokeStyle = isBulkhead ? '#fbbf24' : '#7dd3fc';
            ctx.lineWidth = isBulkhead ? 1.5 : 1.0;
            ctx.globalAlpha = isBulkhead ? 0.95 : 0.72;
            ctx.beginPath();
            for (let aIdx = 0; aIdx < archAngles.length; aIdx++) {
              const ang = archAngles[aIdx];
              const lx = Math.sin(ang) * 0.225;
              const ly = -0.04 + Math.cos(ang) * 0.24;
              const pt = projectLocal3D(lx, ly, fz);
              if (aIdx === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }

          // Продольные линии створок грузового отсека и золотой замок створок трюма
          const spineAngles = [-Math.PI * 0.36, -Math.PI * 0.16, 0, Math.PI * 0.16, Math.PI * 0.36];
          for (const ang of spineAngles) {
            const isCenterSeam = ang === 0;
            const lx = Math.sin(ang) * 0.225;
            const ly = -0.04 + Math.cos(ang) * 0.24;
            drawLine3D(
              [lx, ly, 0.40],
              [lx, ly, -0.72],
              isCenterSeam ? '#fbbf24' : '#e2e8f0',
              isCenterSeam ? 1.5 : 1.0,
              isCenterSeam ? 0.98 : 0.78
            );
          }

          // 5. НОСОВАЯ ЧАСТЬ: КАЮТА, ОПЕРАЦИОННАЯ РУБКА И СТАНДАРТНЫЙ РАДАР
          // Чёрный термостойкий носовой конус
          const blackNoseCap: Array<[number, number, number]> = [
            [0, -0.05, 0.98],
            [-0.12, -0.06, 0.78],
            [-0.09, 0.05, 0.76],
            [0, 0.08, 0.80],
            [0.09, 0.05, 0.76],
            [0.12, -0.06, 0.78],
          ];
          drawPoly3D(blackNoseCap, '#020617', '#fbbf24', 1.4, 0.98);

          // Стандартный радар — сферический носовой обтекатель с фазированной решёткой
          const pRadar = projectLocal3D(0, 0.04, 0.88);
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(pRadar.x, pRadar.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
          // Пульсирующая волна радара
          const pulseRadar = 1.0 + 0.35 * Math.sin(frameCounter * 0.15);
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pRadar.x, pRadar.y, 5.5 * pulseRadar, 0, Math.PI * 2);
          ctx.stroke();

          // ОПЕРАЦИОННАЯ РУБКА (НАВИГАЦИОННАЯ И ОГНЕВАЯ РУБКА) — 6-секционное лобовое остекление
          const cockpitLeftWindow: Array<[number, number, number]> = [
            [0, 0.13, 0.64],
            [-0.14, 0.09, 0.61],
            [-0.19, 0.14, 0.46],
            [0, 0.20, 0.49],
          ];
          const cockpitRightWindow: Array<[number, number, number]> = [
            [0, 0.13, 0.64],
            [0.14, 0.09, 0.61],
            [0.19, 0.14, 0.46],
            [0, 0.20, 0.49],
          ];
          drawPoly3D(cockpitLeftWindow, 'rgba(34, 211, 238, 0.42)', '#22d3ee', 1.5, 0.98);
          drawPoly3D(cockpitRightWindow, 'rgba(34, 211, 238, 0.42)', '#22d3ee', 1.5, 0.98);
          drawLine3D([-0.08, 0.11, 0.62], [-0.11, 0.17, 0.47], '#e0f2fe', 1.1, 0.95);
          drawLine3D([0.08, 0.11, 0.62], [0.11, 0.17, 0.47], '#e0f2fe', 1.1, 0.95);

          // КАЮТА (ПОМЕЩЕНИЕ ДЛЯ РАБОТЫ С ИНФОРМАЦИЕЙ, ПЛАНИРОВАНИЯ, БИБЛИОТЕКА И МОДУЛЬ СВЯЗИ)
          const pCabinTop = projectLocal3D(0, 0.22, 0.38);
          const pCabinAntenna = projectLocal3D(0, 0.32, 0.36);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(pCabinTop.x, pCabinTop.y);
          ctx.lineTo(pCabinAntenna.x, pCabinAntenna.y);
          ctx.stroke();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(pCabinAntenna.x, pCabinAntenna.y, 2.0, 0, Math.PI * 2);
          ctx.fill();

          // 6. ВООРУЖЕНИЕ: МИНИМАЛЬНЫЙ ЛАЗЕР И МИНИМАЛЬНАЯ ПЛАЗМЕННАЯ ПУШКА
          // Минимальный лазер (правый носовой ствол с красным прицельным лазерным лучом)
          const pLaser = projectLocal3D(0.12, 0.02, 0.72);
          const pLaserBeam = projectLocal3D(0.12, 0.02, 1.15);
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(pLaser.x, pLaser.y);
          ctx.lineTo(pLaserBeam.x, pLaserBeam.y);
          ctx.stroke();
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(pLaser.x, pLaser.y, 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Минимальная плазменная пушка (левая нижняя турель с бирюзовым зарядом)
          const pPlasma = projectLocal3D(-0.12, -0.04, 0.68);
          const pPlasmaBolt = projectLocal3D(-0.12, -0.04, 1.05);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(pPlasma.x, pPlasma.y);
          ctx.lineTo(pPlasmaBolt.x, pPlasmaBolt.y);
          ctx.stroke();
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.arc(pPlasma.x, pPlasma.y, 2.6, 0, Math.PI * 2);
          ctx.fill();

          // 7. МЕХАНИЗМ ГРАВИТАЦИОННОГО ЗАХВАТА (ТРАКТОРНЫЙ ЛУЧ ПОД ДНИЩЕМ)
          const pGravScoop = projectLocal3D(0, -0.11, 0.02);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(pGravScoop.x, pGravScoop.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // Концентрические гравитационные волны захвата контейнеров
          for (let gw = 1; gw <= 3; gw++) {
            const gwR = ((frameCounter * 0.12 + gw * 4) % 14) + 3;
            ctx.strokeStyle = '#c084fc';
            ctx.globalAlpha = Math.max(0.1, 0.7 - gwR / 18);
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(pGravScoop.x, pGravScoop.y, gwR, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 8. БОКОВЫЕ КАПСУЛЫ OMS, ВЫСОКИЙ КИЛЬ И 3 МАРШЕВЫХ СОПЛА
          const leftOmsPod: Array<[number, number, number]> = [
            [-0.14, 0.17, -0.50],
            [-0.24, 0.13, -0.52],
            [-0.24, 0.13, -0.78],
            [-0.13, 0.20, -0.78],
          ];
          const rightOmsPod: Array<[number, number, number]> = [
            [0.14, 0.17, -0.50],
            [0.24, 0.13, -0.52],
            [0.24, 0.13, -0.78],
            [0.13, 0.20, -0.78],
          ];
          drawPoly3D(leftOmsPod, '#1e293b', '#94a3b8', 1.1, 0.92);
          drawPoly3D(rightOmsPod, '#1e293b', '#94a3b8', 1.1, 0.92);

          // Стреловидный вертикальный киль Бурана с рулём направления
          const tailFinPoly: Array<[number, number, number]> = [
            [0, 0.19, -0.34],
            [0, 0.68, -0.64],
            [0, 0.66, -0.82],
            [0, 0.18, -0.80],
          ];
          drawPoly3D(tailFinPoly, '#0f172a', '#f8fafc', 1.7, 0.97);
          drawLine3D([0, 0.67, -0.74], [0, 0.19, -0.72], '#fbbf24', 1.3, 0.92);

          // 3 маршевых ракетных сопла с плазменным факелом
          const engineCenters: Array<[number, number, number]> = [
            [0, 0.11, -0.82],
            [-0.12, -0.03, -0.84],
            [0.12, -0.03, -0.84],
          ];
          const pulseFlame = 0.85 + 0.15 * Math.sin(frameCounter * 0.22);

          for (const [ex, ey, ez] of engineCenters) {
            const eFront = projectLocal3D(ex, ey, ez + 0.06);
            const eBack = projectLocal3D(ex, ey, ez - 0.08 * pulseFlame);
            const nozzleR = Math.max(3, baseRadius * 0.08);

            ctx.globalAlpha = 0.95;
            ctx.fillStyle = '#020617';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(eFront.x, eFront.y, nozzleR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Плазменный факел двигателя
            ctx.fillStyle = '#22d3ee';
            ctx.globalAlpha = 0.88;
            ctx.beginPath();
            ctx.arc(eBack.x, eBack.y, nozzleR * 0.68 * pulseFlame, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eBack.x, eBack.y, nozzleR * 0.32, 0, Math.PI * 2);
            ctx.fill();
          }

          // Тактическое прицельное кольцо габарита корабля
          ctx.save();
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius * 0.96, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          ctx.globalAlpha = 1.0;
        } else if (cur.modelType === 'MODULAR_EXPLORER_XYZ') {
          // ===================================================================
          // 6. КАНОНИЧЕСКИЙ МОДУЛЬНЫЙ ЭКСПЛОРЕР (6-ОСЕВОЙ КАРКАС XYZ)
          //    Кормовой блок 5 двигателей -> Солнечные крылья -> Радары -> Трюмы 40т -> Оружие -> Рубка пилота
          // ===================================================================
          const projectLocal3D = (lx: number, ly: number, lz: number) => {
            return projectPoint3D(lx, ly, lz, baseRadius);
          };

          // Координаты 6 секций вдоль Z (от кормы к носу)
          const sections = [
            { type: 'ENGINE', z: -0.65 },
            { type: 'SOLAR', z: -0.38 },
            { type: 'RADAR', z: -0.11 },
            { type: 'CARGO', z: 0.16 },
            { type: 'WEAPON', z: 0.43 },
            { type: 'BRIDGE', z: 0.70 },
          ];

          // Стыковочные коридоры между секциями
          for (let s = 0; s < sections.length - 1; s++) {
            const p1 = projectLocal3D(0, 0, sections[s].z);
            const p2 = projectLocal3D(0, 0, sections[s + 1].z);
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Кольцо гофры перехода
            const pMid = projectLocal3D(0, 0, (sections[s].z + sections[s + 1].z) / 2);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(pMid.x, pMid.y, 5, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Отрисовка каждого из 6 хабов и их навесных модулей
          for (const sec of sections) {
            const center = projectLocal3D(0, 0, sec.z);

            // 4 поперечных луча-тубы от центра хаба (+X, -X, +Y, -Y)
            const beamLen = 0.22;
            const directions: Array<[number, number, number, string]> = [
              [beamLen, 0, 0, '#38bdf8'],   // +X
              [-beamLen, 0, 0, '#38bdf8'],  // -X
              [0, beamLen, 0, '#34d399'],   // +Y
              [0, -beamLen, 0, '#34d399'],  // -Y
            ];

            for (const [dx, dy, dz, col] of directions) {
              const node = projectLocal3D(dx, dy, sec.z + dz);
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(center.x, center.y);
              ctx.lineTo(node.x, node.y);
              ctx.stroke();

              ctx.strokeStyle = col;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(center.x, center.y);
              ctx.lineTo(node.x, node.y);
              ctx.stroke();

              // Стыковочный фланец на конце луча
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }

            // Центральная силовая сфера хаба
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(center.x, center.y, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Специфика секций:
            if (sec.type === 'ENGINE') {
              // Кормовые сферические двигатели с дюзами (-Z, +X, -X, +Y, -Y)
              const engineOffsets: Array<[number, number, number, string]> = [
                [0, 0, -0.22, '#38bdf8'],      // Главная фотонная
                [beamLen + 0.12, 0, 0, '#f97316'], // Правая реактивная
                [-beamLen - 0.12, 0, 0, '#f97316'],// Левая реактивная
                [0, beamLen + 0.12, 0, '#a855f7'], // Верхняя ионная
                [0, -beamLen - 0.12, 0, '#a855f7'],// Нижняя ионная
              ];

              for (const [ex, ey, ez, eCol] of engineOffsets) {
                const ep = projectLocal3D(ex, ey, sec.z + ez);
                // Сфера двигателя
                ctx.fillStyle = eCol;
                ctx.beginPath();
                ctx.arc(ep.x, ep.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Факел / плазма назад
                const plume = projectLocal3D(ex, ey, sec.z + ez - 0.18);
                ctx.strokeStyle = eCol;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(ep.x, ep.y);
                ctx.lineTo(plume.x, plume.y);
                ctx.stroke();
              }
            } else if (sec.type === 'SOLAR') {
              // Солнечные крылья на +X, -X, +Y, -Y
              for (const [wx, wy] of [[0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42]]) {
                const wp = projectLocal3D(wx, wy, sec.z);
                ctx.fillStyle = '#eab308';
                ctx.fillRect(wp.x - 7, wp.y - 4, 14, 8);
                ctx.strokeStyle = '#fef08a';
                ctx.lineWidth = 1;
                ctx.strokeRect(wp.x - 7, wp.y - 4, 14, 8);
              }
            } else if (sec.type === 'RADAR') {
              // Радары и антенны
              const topRad = projectLocal3D(0, beamLen + 0.14, sec.z);
              ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
              ctx.beginPath();
              ctx.arc(topRad.x, topRad.y, 6.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              const botDish = projectLocal3D(0, -beamLen - 0.14, sec.z);
              ctx.strokeStyle = '#2dd4bf';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(botDish.x, botDish.y, 7, 0, Math.PI);
              ctx.stroke();
            } else if (sec.type === 'CARGO') {
              // Грузовые контейнеры 40т / 80т
              for (const [cxOff, cyOff, label] of [[beamLen + 0.12, 0, '40t'], [-beamLen - 0.12, 0, '40t'], [0, -beamLen - 0.14, '80t']]) {
                const cp = projectLocal3D(Number(cxOff), Number(cyOff), sec.z);
                ctx.fillStyle = '#064e3b';
                ctx.fillRect(cp.x - 8, cp.y - 6, 16, 12);
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(cp.x - 8, cp.y - 6, 16, 12);
                ctx.fillStyle = '#a7f3d0';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(String(label), cp.x, cp.y + 3);
              }
            } else if (sec.type === 'WEAPON') {
              // Оружие: Лазеры и плазма
              for (const [wxOff, wyOff, wCol] of [[beamLen + 0.12, 0, '#ef4444'], [-beamLen - 0.12, 0, '#ef4444'], [0, beamLen + 0.12, '#f43f5e']]) {
                const wp = projectLocal3D(Number(wxOff), Number(wyOff), sec.z);
                const wpTip = projectLocal3D(Number(wxOff), Number(wyOff), sec.z + 0.18);
                ctx.fillStyle = String(wCol);
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = String(wCol);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(wp.x, wp.y);
                ctx.lineTo(wpTip.x, wpTip.y);
                ctx.stroke();
              }
            } else if (sec.type === 'BRIDGE') {
              // Носовая рубка пилота и каюта с библиотекой
              const bridgePt = projectLocal3D(0, 0, sec.z + 0.22);
              ctx.fillStyle = '#0284c7';
              ctx.beginPath();
              ctx.arc(bridgePt.x, bridgePt.y, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Остекление фонаря
              ctx.fillStyle = '#bae6fd';
              ctx.beginPath();
              ctx.arc(bridgePt.x, bridgePt.y, 4, 0, Math.PI * 2);
              ctx.fill();

              // Посадочный модуль снизу
              const landerPt = projectLocal3D(0, -beamLen - 0.12, sec.z);
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(landerPt.x, landerPt.y, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#d97706';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }
          }

          ctx.globalAlpha = 1.0;
        }
      } else {
        // =======================================================================
        // РЕЖИМ Б: ПЛАНЕТЫ И ЗВЁЗДЫ (ТОЧНО КАК НА КАРТЕ: 3D ВЕКТОРНЫЙ ЭЛИТ-СТИЛЬ)
        // =======================================================================
        if (cur.modelType === 'STAR_SUN' || cur.category === 'STAR') {
          // ---------------------------------------------------------------------
          // ЦЕНТРАЛЬНАЯ ЗВЕЗДА (СОЛНЦЕ) — ТОЧНО КАК НА КАРТЕ
          // ---------------------------------------------------------------------
          const rayRot = frameCounter * 0.01;
          const numRays = 16;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let r = 0; r < numRays; r++) {
            const angle = rayRot + (r * Math.PI * 2) / numRays;
            const isLongRay = r % 2 === 0;
            const innerR = baseRadius * 1.05;
            const outerR = baseRadius * (isLongRay ? 1.6 : 1.3) + (isLongRay ? 14 : 7);
            ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
          }
          ctx.stroke();

          // Золотое ядро звезды
          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#fef9c3';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Концентрические пунктирные орбитальные дорожки внутри фотосферы
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = 'rgba(254, 249, 195, 0.7)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius * 0.72, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius * 0.42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          // ---------------------------------------------------------------------
          // ПЛАНЕТЫ (ЗЕМЛЯ, МАРС, ВЕНЕРА, МЕРКУРИЙ, ЮПИТЕР, САТУРН И Т.Д.)
          // ТОЧНО КАК НА КАРТЕ: 3D СФЕРА С МЕРИДИАНАМИ, ПАРАЛЛЕЛЯМИ И ПОЛЮСАМИ
          // ---------------------------------------------------------------------
          // 1. Тёмная сферическая подложка
          ctx.fillStyle = '#020710';
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Параллели (широты)
          const latitudesDeg = [-60, -40, -20, 0, 20, 40, 60];
          const latSteps = 36;

          for (const latDeg of latitudesDeg) {
            const latRad = (latDeg * Math.PI) / 180;
            const cosLat = Math.cos(latRad);
            const sinLat = Math.sin(latRad);
            const isEquator = latDeg === 0;

            for (let s = 0; s < latSteps; s++) {
              const lon1 = (s / latSteps) * Math.PI * 2;
              const lon2 = ((s + 1) / latSteps) * Math.PI * 2;

              const n1x = cosLat * Math.cos(lon1);
              const n1y = sinLat;
              const n1z = cosLat * Math.sin(lon1);

              const n2x = cosLat * Math.cos(lon2);
              const n2y = sinLat;
              const n2z = cosLat * Math.sin(lon2);

              const pt1 = projectPoint3D(n1x, n1y, n1z);
              const pt2 = projectPoint3D(n2x, n2y, n2z);

              if (pt1.front || pt2.front) {
                ctx.strokeStyle = isEquator ? '#fef08a' : cur.visualColor;
                ctx.globalAlpha = isEquator ? 0.95 : 0.72;
                ctx.lineWidth = isEquator ? 1.6 : 1.0;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              } else if (s % 2 === 0) {
                ctx.strokeStyle = cur.visualColor;
                ctx.globalAlpha = 0.18;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // 3. Меридианы (долготы) с белым начальным меридианом
          const numMeridians = 12;
          const merSteps = 24;

          for (let m = 0; m < numMeridians; m++) {
            const lonRad = (m / numMeridians) * Math.PI * 2;
            const cosLon = Math.cos(lonRad);
            const sinLon = Math.sin(lonRad);
            const isPrimeMeridian = m === 0 || m === numMeridians / 2;

            for (let s = 0; s < merSteps; s++) {
              const lat1 = -Math.PI / 2 + (s / merSteps) * Math.PI;
              const lat2 = -Math.PI / 2 + ((s + 1) / merSteps) * Math.PI;

              const n1x = Math.cos(lat1) * cosLon;
              const n1y = Math.sin(lat1);
              const n1z = Math.cos(lat1) * sinLon;

              const n2x = Math.cos(lat2) * cosLon;
              const n2y = Math.sin(lat2);
              const n2z = Math.cos(lat2) * sinLon;

              const pt1 = projectPoint3D(n1x, n1y, n1z);
              const pt2 = projectPoint3D(n2x, n2y, n2z);

              if (pt1.front || pt2.front) {
                ctx.strokeStyle = isPrimeMeridian ? '#ffffff' : cur.visualColor;
                ctx.globalAlpha = isPrimeMeridian ? 0.9 : 0.65;
                ctx.lineWidth = isPrimeMeridian ? 1.35 : 0.95;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              } else if (s % 2 === 0) {
                ctx.strokeStyle = cur.visualColor;
                ctx.globalAlpha = 0.16;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // Векторные контуры материков для Земли
          if (cur.modelType === 'PLANET_EARTH') {
            const landSteps = 32;
            for (let i = 0; i < landSteps; i++) {
              const a = (i / landSteps) * Math.PI * 2;
              const lat = 0.35 + 0.25 * Math.sin(a * 3);
              const lon = a + localYaw * 0.5;
              const pt = projectPoint3D(
                Math.cos(lat) * Math.cos(lon),
                Math.sin(lat),
                Math.cos(lat) * Math.sin(lon)
              );
              if (pt.front) {
                ctx.fillStyle = '#22c55e';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // Векторные пояса облаков для газовых гигантов (Юпитер / Сатурн)
          if (cur.modelType === 'PLANET_GAS_GIANT') {
            const gasBands = [-45, -25, -10, 10, 25, 45];
            for (const bLat of gasBands) {
              const latRad = (bLat * Math.PI) / 180;
              const pt1 = projectPoint3D(Math.cos(latRad), Math.sin(latRad), 0);
              const pt2 = projectPoint3D(-Math.cos(latRad), Math.sin(latRad), 0);
              if (pt1.front || pt2.front) {
                ctx.strokeStyle = '#f59e0b';
                ctx.globalAlpha = 0.6;
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                ctx.stroke();
              }
            }
          }

          // 4. Внешний векторный контур планеты
          ctx.strokeStyle = cur.visualColor;
          ctx.lineWidth = 2.2;
          ctx.globalAlpha = 1.0;
          ctx.beginPath();
          ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 5. Векторные шпили и маркеры полюсов планеты
          const northPolePt = projectPoint3D(0, 1, 0);
          const southPolePt = projectPoint3D(0, -1, 0);
          const axisSpike = Math.max(6, baseRadius * 0.14);
          const northTip = projectPoint3D(0, 1 + axisSpike / baseRadius, 0);
          const southTip = projectPoint3D(0, -(1 + axisSpike / baseRadius), 0);

          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(northPolePt.x, northPolePt.y);
          ctx.lineTo(northTip.x, northTip.y);
          ctx.moveTo(southPolePt.x, southPolePt.y);
          ctx.lineTo(southTip.x, southTip.y);
          ctx.stroke();

          // Маркеры полюсов: красный и зелёный/голубой маяки
          const poleMarkerR = Math.max(2.5, baseRadius * 0.05);
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(northPolePt.x, northPolePt.y, poleMarkerR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(southPolePt.x, southPolePt.y, poleMarkerR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Gas Giant Planetary Rings (drawn outside sphere clip!)
      if (cur.modelType === 'PLANET_GAS_GIANT') {
        ctx.save();
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = baseRadius * 0.25;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          baseRadius * 1.85,
          baseRadius * 0.42,
          -0.3,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      // 8. Outer atmospheric Rayleigh glow ring
      if (showAtmosphere && cur.category === 'PLANET') {
        ctx.strokeStyle = cur.atmosphereColor;
        ctx.lineWidth = Math.max(2, baseRadius * 0.04);
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 9. Coordinate Axis crosshair & Rotation Indicator
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx + 12, cy);
      ctx.moveTo(cx, cy - 12);
      ctx.lineTo(cx, cy + 12);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isOpen,
    selectedObjectId,
    yaw,
    pitch,
    zoom,
    isAutoRotate,
    showWireframeGrid,
    showAtmosphere,
    showDayNightTerminator,
    selectedObject,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-7xl h-[94vh] bg-slate-900 border-2 border-cyan-400 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* ===================================================================
            HEADER: РАЗДЕЛ «ОБЪЕКТЫ» · 3D КАТАЛОГ И СВОЙСТВА
        =================================================================== */}
        <div className="px-4 py-3 bg-slate-950 border-b border-cyan-500/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wider text-cyan-300 uppercase">
                  🔭 РАЗДЕЛ «ОБЪЕКТЫ» · 3D КАТАЛОГ И ФИЗИЧЕСКИЕ СВОЙСТВА
                </h2>
                <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-400 text-cyan-200 font-extrabold hidden sm:inline-block">
                  ИНТЕРАКТИВНОЕ 3D-ВРАЩЕНИЕ МЫШЬЮ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Полная база астрофизических данных: планеты, звёзды, станции, мегаструктуры и часовые в единицах и тоннах
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedObjectId && (
              <button
                type="button"
                onClick={handleBackToList}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>К списку объектов</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
              title="Закрыть раздел (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================
            ОСНОВНАЯ ЧАСТЬ: СПИСОК ОБЪЕКТОВ ЛИБО СТРАНИЦА ВЫБРАННОГО ОБЪЕКТА
        =================================================================== */}
        {!selectedObjectId ? (
          /* =================================================================
              РЕЖИМ 1: СПИСОК ОБЪЕКТОВ (ПЕРВЫЙ ОБЪЕКТ — ПЛАНЕТА)
          ================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Панель фильтров и поиск */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {(
                  [
                    { id: 'ALL', label: `Все объекты (${SPACE_OBJECTS_DATABASE.length})` },
                    { id: 'PLANET', label: `🪐 Планеты (${SPACE_OBJECTS_DATABASE.filter((o) => o.category === 'PLANET').length})` },
                    { id: 'STAR', label: `☀️ Звёзды (${SPACE_OBJECTS_DATABASE.filter((o) => o.category === 'STAR').length})` },
                    { id: 'STATION', label: `🛰️ Станции (${SPACE_OBJECTS_DATABASE.filter((o) => o.category === 'STATION').length})` },
                    { id: 'SHIP_SENTINEL', label: `⚔️ Часовые и Корабли (${SPACE_OBJECTS_DATABASE.filter((o) => o.category === 'SHIP_SENTINEL').length})` },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по названию или ресурсу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Карточки объектов каталога (Первый объект: ПЛАНЕТА) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObjects.map((obj, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={obj.id}
                    onClick={() => handleSelectObject(obj.id)}
                    className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between bg-gradient-to-b from-slate-950 to-slate-900 ${
                      isFirst
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'border-slate-800 hover:border-cyan-500/70'
                    }`}
                  >
                    {isFirst && (
                      <div className="absolute -top-3 left-4 bg-cyan-400 text-black px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md">
                        ★ ПЕРВЫЙ ОБЪЕКТ: ПЛАНЕТА
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded border"
                            style={{
                              borderColor: obj.visualColor,
                              color: obj.visualColor,
                              backgroundColor: `${obj.visualColor}15`,
                            }}
                          >
                            {obj.badge}
                          </span>
                          <h3 className="text-sm font-black text-white group-hover:text-cyan-300 mt-1 transition-colors">
                            {obj.name}
                          </h3>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {obj.subName}
                          </div>
                        </div>

                        {/* Круглый 3D превью-шар */}
                        <div
                          className="w-12 h-12 rounded-full border-2 border-white/20 shrink-0 shadow-lg flex items-center justify-center text-lg select-none"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${obj.visualColor}, #020617)`,
                            boxShadow: `0 0 15px ${obj.atmosphereColor}40`,
                          }}
                        >
                          {obj.modelType === 'MEGASTRUCTURE_TORUS' ? (
                            <span title="Тор / Бублик">🍩</span>
                          ) : obj.modelType === 'MEGASTRUCTURE_DEATH_STAR' ? (
                            <span title="Звезда Смерти">🌑</span>
                          ) : obj.modelType === 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON' ? (
                            <span title="Орбитальная Мегаверфь 0.5R Планеты">💎</span>
                          ) : obj.modelType === 'STATION_STARGATE' ? (
                            <span title="Звёздные Врата">🌀</span>
                          ) : obj.modelType === 'STATION_CORIOLIS' ? (
                            <span title="Станция Кориолис">🛰️</span>
                          ) : obj.modelType === 'SENTINEL_PLATFORM' ? (
                            <span title="Часовой">⚓</span>
                          ) : obj.modelType === 'BURAN_SHUTTLE' ? (
                            <span title="Челнок Буран">🚀</span>
                          ) : obj.modelType === 'MODULAR_EXPLORER_XYZ' ? (
                            <span title="Модульный эксплорер XYZ">🏗️</span>
                          ) : obj.category === 'STAR' ? (
                            <span title="Звезда">☀️</span>
                          ) : (
                            <span title="Планета">🪐</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {obj.tagline}
                      </p>

                      {/* Ключевые физические параметры в карточке */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/60 p-2.5 rounded-lg border border-slate-800/80">
                        <div>
                          <div className="text-slate-400">ДИАМЕТР:</div>
                          <div className="text-cyan-300 font-bold">
                            {obj.physics.diameterKm.toLocaleString()} км
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">МАССА (ТОННЫ):</div>
                          <div className="text-amber-300 font-bold truncate">
                            {obj.physics.massTonsLabel.split(' ')[0]} т
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">ГРАВИТАЦИЯ:</div>
                          <div className="text-emerald-300 font-bold">
                            {obj.physics.surfaceGravityG} g ({obj.physics.surfaceGravityMPerS2} м/с²)
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">ГЛАВНЫЙ РЕСУРС:</div>
                          <div className="text-fuchsia-300 font-bold truncate">
                            {obj.resources.primaryResource.split(' ')[0]}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectObject(obj.id);
                      }}
                      className="mt-4 w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-400 text-cyan-300 hover:text-black border border-cyan-500/40 font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>ОТКРЫТЬ 3D-МОДЕЛЬ И СВОЙСТВА</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =================================================================
              РЕЖИМ 2: СТРАНИЦА ОБЪЕКТА (3D МОДЕЛЬ + ПОЛНОЕ ОПИСАНИЕ СВОЙСТВ)
          ================================================================= */
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* ЛЕВАЯ КОЛОНКА: ИНТЕРАКТИВНЫЙ 3D ПРОСМОТРЩИК */}
            <div className="w-full lg:w-7/12 h-64 sm:h-80 lg:h-full bg-black relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
              {selectedObject?.modelType === 'SENTINEL_PLATFORM' ? (
                <div className="relative w-full h-full flex flex-col">
                  {/* Верхняя плашка навигации */}
                  <div className="absolute top-2.5 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-auto">
                    <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-500/50 text-xs shadow-md">
                      <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="font-mono text-cyan-300 font-bold text-[11px]">
                        МОРСКАЯ МИНА · ПИРАМИДКИ · ЛОПАСТИ ВЕТРЯКА (360°)
                      </span>
                    </div>

                    {/* Кнопки переключения объектов */}
                    <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-sm p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handlePrevNext(-1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        title="Предыдущий объект"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-mono px-1.5 text-slate-400">
                        {SPACE_OBJECTS_DATABASE.findIndex((o) => o.id === selectedObject?.id) + 1} / {SPACE_OBJECTS_DATABASE.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePrevNext(1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        title="Следующий объект"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <SentinelMine3DCanvas
                    bladesCount={sentinelBlades}
                    onSelectBladesCount={setSentinelBlades}
                    className="w-full h-full rounded-none border-none"
                    showToolbar={true}
                    showModificationSelector={true}
                    subTitle="В центре шар мины с рожками-пирамидками · 3 модификации лопастей мельницы (4, 6, 8 шт.)"
                  />
                </div>
              ) : (
                <>
                  {/* Верхняя плашка управления 3D окном */}
                  <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-auto">
                    <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-cyan-500/40 text-xs">
                      <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="font-mono text-cyan-300 font-bold text-[11px]">
                        {selectedObject?.modelType === 'MEGASTRUCTURE_TORUS'
                          ? '🍩 ТОРОИД-БУБЛИК · 360° ВРАЩЕНИЕ · ГРАВИТАЦИЯ 1.0g'
                          : selectedObject?.modelType === 'MEGASTRUCTURE_DEATH_STAR'
                          ? '🌑 ЗВЕЗДА СМЕРТИ · ЧАША СУПЕРЛАЗЕРА & ТРАНШЕЯ (360°)'
                          : selectedObject?.modelType === 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON'
                          ? '🪐 МЕГАВЕРФЬ 0.5R ПЛАНЕТЫ · СРЕДНИЙ РОМБОТРИАКОНТАЭДР (D=6371 км) (360°)'
                          : selectedObject?.modelType === 'STATION_STARGATE'
                          ? '🌀 ЗВЁЗДНЫЕ ВРАТА · ГОРИЗОНТ СОБЫТИЙ & 9 ШЕВРОНОВ (360°)'
                          : selectedObject?.modelType === 'STATION_CORIOLIS'
                          ? '🛰️ СТАНЦИЯ КОРИОЛИС · КУБООКТАЭДР & ШЛЮЗ (360°)'
                          : selectedObject?.modelType === 'BURAN_SHUTTLE'
                          ? '🚀 ЧЕЛНОК «БУРАН» · СПАРЕННЫЕ СОЛНЕЧНЫЕ КРЫЛЬЯ · ТРЮМ 40 т (360°)'
                          : selectedObject?.modelType === 'MODULAR_EXPLORER_XYZ'
                          ? '🏗️ МОДУЛЬНЫЙ ЭКСПЛОРЕР XYZ · 6 СЕКЦИЙ · 5 ДЮЗ & ТРЮМЫ 40 т (360°)'
                          : 'КРУТИТЕ МЫШЬЮ: 360° ВРАЩЕНИЕ'}
                      </span>
                    </div>

                    {/* Кнопки переключения объектов */}
                    <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-sm p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handlePrevNext(-1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        title="Предыдущий объект"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-mono px-1.5 text-slate-400">
                        {SPACE_OBJECTS_DATABASE.findIndex((o) => o.id === selectedObject?.id) + 1} / {SPACE_OBJECTS_DATABASE.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePrevNext(1)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                        title="Следующий объект"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 3D CANVAS */}
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={620}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onWheel={handleCanvasWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="w-full h-full object-contain cursor-grab active:cursor-grabbing select-none"
                  />

                  {/* Нижняя панель инструментов 3D камеры */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between flex-wrap gap-2 pointer-events-auto bg-slate-950/90 backdrop-blur-sm p-2 rounded-xl border border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAutoRotate((v) => !v)}
                        className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 border transition-all ${
                          isAutoRotate
                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isAutoRotate ? 'АВТО: ВКЛ' : 'АВТО: ПАУЗА'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowWireframeGrid((v) => !v)}
                        className={`px-2 py-1 rounded font-bold border transition-all ${
                          showWireframeGrid
                            ? 'bg-slate-800 text-cyan-300 border-cyan-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                        title="Показать меридианы и параллели"
                      >
                        🌐 Сетка
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAtmosphere((v) => !v)}
                        className={`px-2 py-1 rounded font-bold border transition-all ${
                          showAtmosphere
                            ? 'bg-slate-800 text-sky-300 border-sky-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                        title="Атмосфера и облака"
                      >
                        ☁️ Атмосфера
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDayNightTerminator((v) => !v)}
                        className={`px-2 py-1 rounded font-bold border transition-all ${
                          showDayNightTerminator
                            ? 'bg-slate-800 text-yellow-300 border-yellow-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                        title="День/Ночь терминатор"
                      >
                        ☀️ День/Ночь
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
                        title="Уменьшить масштаб (-)"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-[10px] text-cyan-300 w-12 text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(2.6, z + 0.15))}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
                        title="Приблизить масштаб (+)"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setYaw(0.4);
                          setPitch(0.25);
                          setZoom(1.15);
                        }}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700"
                        title="Сброс ракурса"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>


            {/* ПРАВАЯ КОЛОНКА: ОПИСАНИЕ СВОЙСТВ ОБЪЕКТА В ТЕКСТОВОМ ВИДЕ */}
            <div className="w-full lg:w-5/12 h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-900/60 font-sans">
              {selectedObject && (
                <>
                  {/* Заголовок объекта */}
                  <div className="space-y-1 border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded border"
                        style={{
                          borderColor: selectedObject.visualColor,
                          color: selectedObject.visualColor,
                          backgroundColor: `${selectedObject.visualColor}15`,
                        }}
                      >
                        {selectedObject.badge}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ОРБИТА: {selectedObject.physics.orbitalRadiusUnits} ЕД.
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                      {selectedObject.name}
                    </h1>
                    <div className="text-xs text-cyan-300 font-mono">
                      {selectedObject.subName}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {selectedObject.tagline}
                    </p>
                  </div>

                  {/* 1. Общее описание и тактическая роль */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2 text-xs">
                    <div className="font-extrabold text-cyan-300 uppercase flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      <span>ОБЩИЕ СВЕДЕНИЯ И НАЗНАЧЕНИЕ</span>
                    </div>
                    <div className="text-slate-200 leading-relaxed">
                      {selectedObject.overview}
                    </div>
                    <div className="p-2 rounded bg-cyan-950/30 border border-cyan-800/60 text-cyan-200 text-[11px]">
                      <b>Тактическая роль в игре:</b> {selectedObject.tacticalRole}
                    </div>
                  </div>

                  {/* СПЕЦИАЛЬНЫЙ БЛОК: 3 МОДИФИКАЦИИ ЛОПАСТЕЙ ДЛЯ ЧАСОВОГО */}
                  {selectedObject.modelType === 'SENTINEL_PLATFORM' && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-cyan-500/60 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-cyan-300 uppercase flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-yellow-400" />
                          <span>3 МОДИФИКАЦИИ ЛОПАСТЕЙ И СКОРОСТЬ ЗАРЯДКИ</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-600">
                          {sentinelBlades} ЛОПАСТЕЙ
                        </span>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Количество лопастей, стилизованных под старинную ветряную мельницу, напрямую влияет на скорость зарядки накопителя часового:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {([4, 6, 8] as SentinelBladeModification[]).map((blades) => {
                          const spec = SENTINEL_BLADE_MODS_META[blades];
                          const isCur = sentinelBlades === blades;
                          return (
                            <button
                              key={blades}
                              type="button"
                              onClick={() => setSentinelBlades(blades)}
                              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                                isCur
                                  ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/50 shadow-md'
                                  : 'bg-black/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span style={{ color: spec.colorHex }}>{spec.titleRu}</span>
                                  <span className="font-mono text-[10px] bg-slate-900 px-1 py-0.2 rounded text-white">
                                    {spec.rechargeMultiplier.toFixed(1)}x
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  Панели: <b>{spec.surfaceAreaSqM} м²</b>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Сухая масса: <b>{spec.dryMassTons} т</b>
                                </div>
                              </div>
                              <div className="mt-2 text-[10px] font-semibold text-emerald-300 font-mono">
                                Зарядка: +{(12 * spec.rechargeMultiplier).toFixed(1)} ГЭУ/с
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-2 rounded bg-black/60 border border-slate-800 text-[11px] text-slate-300">
                        <b>Текущая конфигурация:</b> {SENTINEL_BLADE_MODS_META[sentinelBlades].appearanceRu}
                      </div>
                    </div>
                  )}

                  {/* 2. Физические свойства (в единицах и тоннах) */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2.5 text-xs font-mono">
                    <div className="font-extrabold text-amber-300 uppercase flex items-center gap-1.5 font-sans">
                      <Database className="w-4 h-4" />
                      <span>ФИЗИЧЕСКИЕ ПАРАМЕТРЫ (В ТОННАХ И ЕДИНИЦАХ)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">МАССА В ТОННАХ:</div>
                        <div className="text-amber-300 font-extrabold text-xs">
                          {selectedObject.physics.massTonsLabel}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">НАУЧНАЯ МАССА (КГ):</div>
                        <div className="text-white font-extrabold text-xs">
                          {selectedObject.physics.massKgScientific}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">ЭКВАТОР. ДИАМЕТР:</div>
                        <div className="text-cyan-300 font-extrabold text-xs">
                          {selectedObject.physics.diameterKm.toLocaleString()} км
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">СРЕДНЯЯ ПЛОТНОСТЬ:</div>
                        <div className="text-white font-extrabold text-xs">
                          {selectedObject.physics.densityGCm3} г/см³
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">ГРАВИТАЦИЯ (G):</div>
                        <div className="text-emerald-300 font-extrabold text-xs">
                          {selectedObject.physics.surfaceGravityG} g ({selectedObject.physics.surfaceGravityMPerS2} м/с²)
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">2-Я КОСМИЧЕСКАЯ (V₂):</div>
                        <div className="text-white font-extrabold text-xs">
                          {selectedObject.physics.escapeVelocityKmS} км/с
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">ОСЕВОЕ ВРАЩЕНИЕ:</div>
                        <div className="text-cyan-300 font-extrabold text-xs">
                          {selectedObject.physics.axialRotationPeriodHours} ч
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[10px]">ПЕРИОД ОБРАЩЕНИЯ:</div>
                        <div className="text-white font-extrabold text-xs">
                          {selectedObject.physics.orbitalPeriodDays} дн.
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] flex items-center justify-between">
                      <span className="text-slate-400">ТЕМПЕРАТУРА ПОВЕРХНОСТИ:</span>
                      <span className="text-amber-200 font-bold">
                        от {selectedObject.physics.surfaceTempCelsius.min}°C до {selectedObject.physics.surfaceTempCelsius.max}°C (ср. {selectedObject.physics.surfaceTempCelsius.avg}°C)
                      </span>
                    </div>
                  </div>

                  {/* 3. Атмосфера и климат */}
                  {selectedObject.atmosphere.composition.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2 text-xs">
                      <div className="font-extrabold text-sky-300 uppercase flex items-center gap-1.5">
                        <Radio className="w-4 h-4" />
                        <span>АТМОСФЕРА И КЛИМАТИЧЕСКИЙ ПРОФИЛЬ</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 border-b border-slate-800/80 pb-1">
                        <span>Давление на поверхности:</span>
                        <b className="text-white font-bold">{selectedObject.atmosphere.surfacePressureAtm} атм</b>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Газовый состав:</div>
                        {selectedObject.atmosphere.composition.map((g) => (
                          <div key={g.gas} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">{g.gas}</span>
                            <span className="text-sky-300 font-bold">{g.percent}%</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                        <span>Магнитный экран:</span>
                        <span className={selectedObject.atmosphere.hasMagneticField ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                          {selectedObject.atmosphere.hasMagneticField ? '✓ Активное магнитное поле' : '✗ Магнитное поле отсутствует'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 4. Геология и ресурсы */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2 text-xs">
                    <div className="font-extrabold text-fuchsia-300 uppercase flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      <span>ГЕОЛОГИЯ И СЫРЬЕВЫЕ РЕСУРСЫ</span>
                    </div>

                    <div className="p-2 rounded bg-fuchsia-950/20 border border-fuchsia-800/50 space-y-1">
                      <div className="text-[10px] text-fuchsia-300 font-bold">ОСНОВНОЙ РЕСУРС:</div>
                      <div className="text-sm font-black text-white">
                        {selectedObject.resources.primaryResource}
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="text-slate-400">Сопутствующие руды и металлы:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedObject.resources.valuableOresList.map((ore) => (
                          <span
                            key={ore}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-mono border border-slate-700"
                          >
                            {ore}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4.5. Штатное оснащение челнока Буран по программе ББД */}
                  {selectedObject.modelType === 'BURAN_SHUTTLE' && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-b from-sky-950/40 to-black/80 border border-cyan-500/50 space-y-2.5 text-xs shadow-lg">
                      <div className="font-extrabold text-cyan-300 uppercase flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>ШТАТНОЕ ОСНАЩЕНИЕ ПО ПРОГРАММЕ ББД</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                          С 14 ЛЕТ · ПРОДАЖА ЗАПРЕЩЕНА
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-cyan-400 font-bold flex items-center gap-1">
                            <span>🛏️ ЖИЛАЯ КАЮТА</span>
                          </div>
                          <div className="text-slate-300 text-[10px] mt-0.5">
                            Помещение для работы с информацией и планирования · модуль сверхсветовой связи · голографическая библиотека.
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-sky-400 font-bold flex items-center gap-1">
                            <span>🧭 ОПЕРАЦИОННАЯ РУБКА</span>
                          </div>
                          <div className="text-slate-300 text-[10px] mt-0.5">
                            Совмещённый командный мостик: навигационная и тактическая огневая рубка с автопилотом.
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-amber-300 font-bold flex items-center gap-1">
                            <span>📦 ГРУЗОВОЙ ТРЮМ</span>
                          </div>
                          <div className="text-slate-300 text-[10px] mt-0.5">
                            Полезная ёмкость ровно <b>40 метрических тонн</b> (цилиндрический отсек с арочными шпангоутами).
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-rose-400 font-bold flex items-center gap-1">
                            <span>⚡ ВООРУЖЕНИЕ</span>
                          </div>
                          <div className="text-slate-300 text-[10px] mt-0.5">
                            Минимальный импульсный лазер + минимальная плазменная пушка для базовой самообороны.
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-purple-300 font-bold flex items-center gap-1">
                            <span>🧲 СПЕЦОБОРУДОВАНИЕ</span>
                          </div>
                          <div className="text-slate-300 text-[10px] mt-0.5">
                            Механизм гравитационного захвата (тракторный луч) + стандартный сферический 3D-радар.
                          </div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-yellow-300 font-bold flex items-center gap-1">
                            <span>☀️ ЭНЕРГОСИСТЕМА</span>
                          </div>
                          <div className="text-slate-300 text-[10px] mt-0.5">
                            Стандартная спаренная солнечная батарея в виде крыльев (фотопанели на консолях двойной дельты).
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-cyan-950/30 border border-cyan-800/40 text-[10px] text-slate-300 leading-relaxed font-mono">
                        <b className="text-cyan-300">👥 Применение в системе:</b> автоматические челноки между планетами и станциями, пираты, мародёры, торговцы, старатели, исследователи (открытый реестр ролей).
                      </div>
                    </div>
                  )}

                  {/* 4.6. Модульная архитектура 6-лучевого каркаса XYZ */}
                  {selectedObject.modelType === 'MODULAR_EXPLORER_XYZ' && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-b from-sky-950/60 to-black/85 border border-cyan-400/60 space-y-3 text-xs shadow-xl">
                      <div className="font-extrabold text-cyan-300 uppercase flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>ИДЕОЛОГИЯ 6-ЛУЧЕВОГО КАРКАСА XYZ</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-mono font-bold">
                          6 СЕКЦИЙ · СВОБОДНЫЙ КАСТОМ
                        </span>
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="p-2 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">Секция 1 (Корма):</span>
                          <span className="text-amber-400 font-bold">5 сферических двигателей (фотонный + 2 реактивных + 2 ионных)</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">Секция 2 (Энергия):</span>
                          <span className="text-yellow-300 font-bold">4 спаренных солнечных крыла (+18 МВт/с каждое)</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">Секция 3 (Сенсоры):</span>
                          <span className="text-cyan-400 font-bold">Купол РЛС 360° + параболическая антенна дальней связи ДРЛО</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">Секция 4 (Трюмы):</span>
                          <span className="text-emerald-400 font-bold">Герметичные трюмы: 2x 40т (ББД) + 1x 80т + цистерна 60т</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">Секция 5 (Оружие):</span>
                          <span className="text-rose-400 font-bold">Импульсный лазер + тяжёлая плазма + торпедные шахты</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">Секция 6 (Нос):</span>
                          <span className="text-sky-300 font-bold">Рубка пилота + каюта с библиотекой + посадочный модуль</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenShipyard) {
                            onOpenShipyard();
                          } else {
                            setIsShipyardOpen(true);
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>🛠️ ОТКРЫТЬ В МОДУЛЬНОЙ ВЕРФИ (3D КОНСТРУКТОР)</span>
                      </button>
                    </div>
                  )}

                  {/* 4.7. ОРБИТАЛЬНАЯ МЕГАВЕРФЬ 0.5R ПЛАНЕТЫ · СРЕДНИЙ РОМБОТРИАКОНТАЭДР */}
                  {selectedObject.modelType === 'MEGASTRUCTURE_SHIPYARD_TRIACONTAHEDRON' && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-b from-cyan-950/70 via-slate-900/90 to-black/90 border border-cyan-400/70 space-y-3 text-xs shadow-2xl">
                      <div className="font-extrabold text-cyan-300 uppercase flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>АРХИТЕКТУРА СРЕДНЕГО РОМБОТРИАКОНТАЭДРА</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-mono font-bold">
                          МАСШТАБ 0.5 ПЛАНЕТЫ (D=6371 км)
                        </span>
                      </div>

                      {/* Масштабный индикатор 1:2 */}
                      <div className="p-2.5 rounded-lg bg-black/70 border border-cyan-500/40 space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Сравнительный диаметр:</span>
                          <span className="text-cyan-300 font-bold">Верфь 6 371 км · Планета 12 742 км (Ровно 50%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 w-1/2" title="Верфь (50%)" />
                          <div className="h-full bg-slate-700 w-1/2" title="Вторая половина планеты" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">ФОРМА МНОГОГРАННИКА:</span>
                          <span className="text-cyan-300 font-bold">Средний Ромботриаконтаэдр (W73)</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">ГРАНЕЙ (РОМБЫ):</span>
                          <span className="text-yellow-300 font-bold">30 самопересекающихся (41.8°/138.2°)</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">КАРКАСНЫХ МАГИСТРАЛЕЙ:</span>
                          <span className="text-emerald-400 font-bold">60 ребер (сверхпрочные балки)</span>
                        </div>
                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">ПРИЧАЛЬНЫХ УЗЛОВ:</span>
                          <span className="text-purple-300 font-bold">24 (12 внешних + 12 внутренних)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-[10px] text-slate-300 leading-relaxed font-mono space-y-1">
                        <div className="text-sky-300 font-bold">🔒 ПРАВИЛО КВАНТОВОЙ ВЕРФИ:</div>
                        <div>
                          Верфь — сборочная площадка, а не магазин! Модули покупаются у внешних поставщиков (заводы, торговцы, P2P, клан) и телепортируются в стапели верфи.
                        </div>
                        <div className="text-amber-300 font-semibold">
                          После телепортации на верфь модуль блокируется от повторной телепортации: вывезти его можно только пристыкованным к кораблю либо сдать местному скупщику за 50%!
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenShipyard) {
                            onOpenShipyard();
                          } else {
                            setIsShipyardOpen(true);
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>🛠️ ВОЙТИ В СБОРОЧНЫЙ СТАПЕЛЬ МЕГАВЕРФИ (КОНСТРУКТОР)</span>
                      </button>
                    </div>
                  )}

                  {/* 5. Политический статус и управление */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-2 text-xs">
                    <div className="font-extrabold text-emerald-300 uppercase flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>ЮРИСДИКЦИЯ И СТАТУС В ЭКОСИСТЕМЕ G. BELL</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">ПРАВИТЕЛЬСТВО:</span>
                        <span className="text-white font-bold">{selectedObject.jurisdiction.governmentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">КЛАН / АЛЬЯНС:</span>
                        <span className="text-cyan-300 font-bold">{selectedObject.jurisdiction.clanAffiliation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">УРОВЕНЬ БЕЗОПАСНОСТИ:</span>
                        <span className="text-emerald-400 font-bold">{selectedObject.jurisdiction.securityLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">АУКЦИОННАЯ СТОИМОСТЬ:</span>
                        <span className={`font-bold ${selectedObject.jurisdiction.auctionBasePriceCr === 0 ? 'text-amber-400 font-black' : 'text-yellow-300'}`}>
                          {selectedObject.jurisdiction.auctionBasePriceCr > 0
                            ? `${selectedObject.jurisdiction.auctionBasePriceCr.toLocaleString()} CR`
                            : 'НЕ ПРОДАЁТСЯ · ББД (14+ ЛЕТ)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* МОДАЛЬНЫЙ КОНСТРУКТОР ОРБИТАЛЬНОЙ ВЕРФИ НА БАЗЕ КАРКАСА 6-XYZ */}
      <ShipyardBuilderModal
        isOpen={isShipyardOpen}
        onClose={() => setIsShipyardOpen(false)}
      />
    </div>
  );
};
