/**
 * shipbuildingModularEngine.ts
 *
 * Архитектура и идеология модульного кораблестроения на основе
 * универсального 6-лучевого стыковочного блока (ортогональный каркас XYZ).
 *
 * Базовый элемент:
 * - Стыковочный блок (хаб): сфера в центре, из которой расходятся 6 туб в направлениях
 *   +X (Правый борт), -X (Левый борт),
 *   +Y (Верх / Дорсальный), -Y (Низ / Вентральный),
 *   +Z (Нос / Передний), -Z (Корма / Задний).
 * - На конце каждого луча расположен универсальный стыковочный узел.
 * - К узлу можно пристыковать:
 *   1) Двигатель (сфера с дюзой: реактивная, фотонная, ионная, гравитонная);
 *   2) Солнечные панели (спаренные крылья);
 *   3) Приборы и сенсоры (сферический радар дальнего обзора, антенна связи);
 *   4) Грузовые трюмы (герметичные контейнеры 40т стандарта ББД, 80т, цистерны);
 *   5) Вооружение (импульсный лазер, плазменная пушка, торпедные пилоны);
 *   6) Модуль пилота (рубка навигации и огня + каюта, библиотека и узел связи);
 *   7) Посадочный модуль (для спуска на планеты);
 *   8) СЛЕДУЮЩИЙ СТЫКОВОЧНЫЙ БЛОК (для неограниченного удлинения или ветвления корабля).
 */

export type AxisDirection = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';

export const ALL_AXES: AxisDirection[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];

export const AXIS_VECTORS: Record<AxisDirection, [number, number, number]> = {
  '+X': [1, 0, 0],
  '-X': [-1, 0, 0],
  '+Y': [0, 1, 0],
  '-Y': [0, -1, 0],
  '+Z': [0, 0, 1],
  '-Z': [0, 0, -1],
};

export const OPPOSITE_AXIS: Record<AxisDirection, AxisDirection> = {
  '+X': '-X',
  '-X': '+X',
  '+Y': '-Y',
  '-Y': '+Y',
  '+Z': '-Z',
  '-Z': '+Z',
};

export const AXIS_METADATA: Record<
  AxisDirection,
  {
    labelRu: string;
    shortRu: string;
    color: string;
    glowColor: string;
    description: string;
  }
> = {
  '+X': {
    labelRu: 'Правый борт (+X)',
    shortRu: 'ПРАВЫЙ (+X)',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    description: 'Латеральный узел правого борта',
  },
  '-X': {
    labelRu: 'Левый борт (-X)',
    shortRu: 'ЛЕВЫЙ (-X)',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    description: 'Латеральный узел левого борта',
  },
  '+Y': {
    labelRu: 'Верх / Дорсальный (+Y)',
    shortRu: 'ВЕРХ (+Y)',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    description: 'Дорсальный верхний узел корабля',
  },
  '-Y': {
    labelRu: 'Низ / Вентральный (-Y)',
    shortRu: 'НИЗ (-Y)',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    description: 'Вентральный нижний узел (посадка/подвеска)',
  },
  '+Z': {
    labelRu: 'Нос / Передний (+Z)',
    shortRu: 'НОС (+Z)',
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    description: 'Носовой фронтальный сектор движения',
  },
  '-Z': {
    labelRu: 'Корма / Задний (-Z)',
    shortRu: 'КОРМА (-Z)',
    color: '#f87171',
    glowColor: 'rgba(248, 113, 113, 0.6)',
    description: 'Кормовой тыловой сектор для маршевой тяги',
  },
};

export type ModuleCategory =
  | 'ENGINE'
  | 'ENERGY'
  | 'SENSORS'
  | 'CARGO'
  | 'WEAPONS'
  | 'COMMAND'
  | 'LANDER';

export type ModuleKind =
  // Двигатели (сфера с дюзой)
  | 'ENGINE_REACTIVE'
  | 'ENGINE_PHOTONIC'
  | 'ENGINE_ION'
  | 'ENGINE_GRAVITON'
  // Энергетика
  | 'SOLAR_WINGS'
  // Приборы & сенсоры
  | 'SENSOR_RADAR'
  | 'DISH_ANTENNA'
  // Трюмы
  | 'CARGO_40T'
  | 'CARGO_80T'
  | 'CARGO_TANK_60T'
  // Оружие
  | 'WEAPON_LASER'
  | 'WEAPON_PLASMA'
  | 'WEAPON_TORPEDO'
  // Командные отсеки
  | 'COCKPIT_BRIDGE'
  | 'COMMAND_BRIDGE'
  // Посадочные модули
  | 'LANDER_CABIN';

export interface ModuleSupplier {
  id: string;
  name: string;
  tag: string;
  location: string;
  description: string;
  warrantyPolicy: string;
  officialLicenseBadge: string;
}

export const MODULE_SUPPLIERS: Record<string, ModuleSupplier> = {
  KVANT_ENGINES: {
    id: 'KVANT_ENGINES',
    name: 'НПО «Квант-ТяжМаш»',
    tag: 'ДВИГАТЕЛИ И ДЮЗЫ',
    location: 'Орбитальная суперверфь на Титане (Сатурн)',
    description:
      'Ведущий производитель импульсных сферических двигателей: термоядерные реактивные сопла, субсветовые фотонные дюзы, ксеноновые ионные ускорители и гравитонные диполи.',
    warrantyPolicy: 'Официальный заводской возврат с дефектоскопией узлов: 90% номинала.',
    officialLicenseBadge: 'ГОСТ Диктатора №884-ЯД',
  },
  HELIOS_ENERGY: {
    id: 'HELIOS_ENERGY',
    name: 'Концерн «Гелиос-Энергия»',
    tag: 'ФОТОЭЛЕМЕНТЫ & КРЫЛЬЯ',
    location: 'Солнечная электростанция близ Меркурия',
    description:
      'Высокоэффективные спаренные солнечные крылья на карбид-кремниевых фотоэлементах с радиаторами охлаждения и сверхпроводящими шинами.',
    warrantyPolicy: 'Гарантийный возврат заводу-изготовителю: 90% цены приобретения.',
    officialLicenseBadge: 'СЕРТИФИКАТ СВЕРХПРОВОДИМОСТИ',
  },
  ASTRO_RADAR: {
    id: 'ASTRO_RADAR',
    name: 'ЦКБ «Астро-Радар & Связь»',
    tag: 'СЕНСОРЫ & ДРЛО',
    location: 'Орбитальный НИИ связи (Земля)',
    description:
      'Радиопрозрачные сферические обтекатели с активной фазированной решёткой 360° и складные параболические антенны подпространственной связи.',
    warrantyPolicy: 'Сертификационный приём изготовителем: 90% стоимости.',
    officialLicenseBadge: 'ВОЕНПРЕМКА СИСТЕМЫ',
  },
  TEKTON_CARGO: {
    id: 'TEKTON_CARGO',
    name: 'Завод «Тектон-Карго Текнолоджис»',
    tag: 'СТАНДАРТНЫЕ ТРЮМЫ ББД',
    location: 'Промышленный кратер Гусева (Марс)',
    description:
      'Стандартизированные герметичные контейнеры на 40 тонн программы ББД Диктатора, крупнотоннажные отсеки 80т и криогенные цистерны для сжиженных газов.',
    warrantyPolicy: 'Возврат на завод по государственной программе рециклинга: 90% цены.',
    officialLicenseBadge: 'РЕГИСТР ББД ДИКТАТОРА',
  },
  BASTION_ARSENAL: {
    id: 'BASTION_ARSENAL',
    name: 'Орбитальный Арсенал «Бастион»',
    tag: 'КОРАБЕЛЬНОЕ ОРУЖИЕ',
    location: 'База «Церера-Главная» (Пояс астероидов)',
    description:
      'Корабельные скорострельные импульсные лазеры с сапфировой оптикой, электромагнитные плазменные пушки и торпедные пусковые пилоны.',
    warrantyPolicy: 'Демилитаризация и возврат производителю: 90% стоимости.',
    officialLicenseBadge: 'ЛИЦЕНЗИЯ ОБОРОНЫ КЛАНОВ',
  },
  DICTATOR_SHIPYARDS: {
    id: 'DICTATOR_SHIPYARDS',
    name: 'ГосСудоверфи Диктатора «Буран-Авангард»',
    tag: 'КОМАНДНЫЕ МОДУЛИ & РУБКИ',
    location: 'Центральный космодром системы',
    description:
      'Канонические модули пилота (навигационная и огневая рубка + каюта с библиотекой, терминалом и связью), флагманские мостики и спускаемые посадочные капсулы.',
    warrantyPolicy: 'Государственная программа возврата и модернизации: 90% номинальной стоимости.',
    officialLicenseBadge: 'ЗНАК КАЧЕСТВА ДИКТАТУРЫ',
  },
};

export interface ModuleDefinition {
  kind: ModuleKind;
  category: ModuleCategory;
  name: string;
  tagline: string;
  description: string;
  visualColor: string;
  accentColor: string;
  badge: string;
  supplierId: string;
  basePriceCr: number; // Номинальная цена покупки у поставщика
  // Физические и технические ТТХ
  massTons: number;
  thrustKn: number;
  powerGenerationMw: number;
  powerConsumptionMw: number;
  cargoCapacityTons: number;
  firepowerDps: number;
  sensorRangeKm: number;
  // Специфика дюз
  nozzleType?: 'REACTIVE' | 'PHOTONIC' | 'ION' | 'GRAVITON';
  nozzleColor?: string;
  exhaustSpeedKmS?: number;
}

export const MODULE_CATALOG: Record<ModuleKind, ModuleDefinition> = {
  ENGINE_REACTIVE: {
    kind: 'ENGINE_REACTIVE',
    category: 'ENGINE',
    name: 'Сфера двигателя с реактивной дюзой',
    tagline: 'Плазменный факел · Высокая стартовая тяга 120 кН',
    description:
      'Сферический термоядерный генератор импульса с выходной конической дюзой Лаваля. Выбрасывает струю раскалённой плазмы оранжево-огненного спектра. Идеально для быстрого ускорения и манёвров.',
    visualColor: '#f97316',
    accentColor: '#fdba74',
    badge: 'РЕАКТИВНАЯ ДЮЗА',
    supplierId: 'KVANT_ENGINES',
    basePriceCr: 1200,
    massTons: 12,
    thrustKn: 120,
    powerGenerationMw: 0,
    powerConsumptionMw: 4.5,
    cargoCapacityTons: 0,
    firepowerDps: 0,
    sensorRangeKm: 0,
    nozzleType: 'REACTIVE',
    nozzleColor: '#ea580c',
    exhaustSpeedKmS: 65,
  },
  ENGINE_PHOTONIC: {
    kind: 'ENGINE_PHOTONIC',
    category: 'ENGINE',
    name: 'Сфера двигателя с фотонной дюзой',
    tagline: 'Квантовое субсветовое сопло · Тяга 220 кН · Бело-голубой луч',
    description:
      'Сферический модуль аннигиляционной накачки с зеркальной магнитной ловушкой. Создаёт ослепительный направленный световой луч с квантовыми кольцами интерференции.',
    visualColor: '#38bdf8',
    accentColor: '#e0f2fe',
    badge: 'ФОТОННАЯ ДЮЗА',
    supplierId: 'KVANT_ENGINES',
    basePriceCr: 3200,
    massTons: 18,
    thrustKn: 220,
    powerGenerationMw: 0,
    powerConsumptionMw: 14.0,
    cargoCapacityTons: 0,
    firepowerDps: 10,
    sensorRangeKm: 0,
    nozzleType: 'PHOTONIC',
    nozzleColor: '#38bdf8',
    exhaustSpeedKmS: 300000,
  },
  ENGINE_ION: {
    kind: 'ENGINE_ION',
    category: 'ENGINE',
    name: 'Сфера двигателя с ионной дюзой',
    tagline: 'Ксеноновая ионизация · Экономичная непрерывная тяга 85 кН',
    description:
      'Сфера с электростатическим ускорителем ионов. Создаёт мягкое бирюзово-фиолетовое плазменное свечение с минимальным расходом ресурсов.',
    visualColor: '#a855f7',
    accentColor: '#e9d5ff',
    badge: 'ИОННАЯ ДЮЗА',
    supplierId: 'KVANT_ENGINES',
    basePriceCr: 1600,
    massTons: 8,
    thrustKn: 85,
    powerGenerationMw: 0,
    powerConsumptionMw: 2.8,
    cargoCapacityTons: 0,
    firepowerDps: 0,
    sensorRangeKm: 0,
    nozzleType: 'ION',
    nozzleColor: '#c084fc',
    exhaustSpeedKmS: 120,
  },
  ENGINE_GRAVITON: {
    kind: 'ENGINE_GRAVITON',
    category: 'ENGINE',
    name: 'Сфера двигателя с гравитонной дюзой',
    tagline: 'Искривление метрики пространства · Тяга 320 кН',
    description:
      'Экспериментальный сферический гравитационный дипольный эмиттер. Создаёт импульсную гравитационную воронку с концентрическими искажениями пространства.',
    visualColor: '#ec4899',
    accentColor: '#fbcfe8',
    badge: 'ГРАВИТОННАЯ ДЮЗА',
    supplierId: 'KVANT_ENGINES',
    basePriceCr: 5000,
    massTons: 24,
    thrustKn: 320,
    powerGenerationMw: 0,
    powerConsumptionMw: 22.0,
    cargoCapacityTons: 0,
    firepowerDps: 0,
    sensorRangeKm: 0,
    nozzleType: 'GRAVITON',
    nozzleColor: '#db2777',
    exhaustSpeedKmS: 1500,
  },
  SOLAR_WINGS: {
    kind: 'SOLAR_WINGS',
    category: 'ENERGY',
    name: 'Спаренные солнечные крылья',
    tagline: 'Ферменные консоли с фотоэлементами · Генерация +18 МВт/с',
    description:
      'Раскладные двухсекционные фотоэлектрические крылья с золотистыми токосъёмными шинами и поворотными сервоприводами ориентации на звезду.',
    visualColor: '#eab308',
    accentColor: '#fef08a',
    badge: 'СОЛНЕЧНЫЕ КРЫЛЬЯ',
    supplierId: 'HELIOS_ENERGY',
    basePriceCr: 800,
    massTons: 3.5,
    thrustKn: 0,
    powerGenerationMw: 18.0,
    powerConsumptionMw: 0,
    cargoCapacityTons: 0,
    firepowerDps: 0,
    sensorRangeKm: 0,
  },
  SENSOR_RADAR: {
    kind: 'SENSOR_RADAR',
    category: 'SENSORS',
    name: 'Сферический купол РЛС дальнего обзора',
    tagline: 'Фазированная решётка 360° · Дальность +5000 км',
    description:
      'Радиопрозрачный сферический обтекатель с вращающейся внутри фазированной антенной решёткой. Обнаруживает корабли, астероиды и сигналы SOS в дальнем космосе.',
    visualColor: '#06b6d4',
    accentColor: '#cffafe',
    badge: 'КУПОЛ РЛС 360°',
    supplierId: 'ASTRO_RADAR',
    basePriceCr: 950,
    massTons: 4.2,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 1.6,
    cargoCapacityTons: 0,
    firepowerDps: 0,
    sensorRangeKm: 5000,
  },
  DISH_ANTENNA: {
    kind: 'DISH_ANTENNA',
    category: 'SENSORS',
    name: 'Параболическая антенна дальней связи',
    tagline: 'Направленный луч сверхсветовой связи · Дальность +9500 км',
    description:
      'Шарнирная складная параболическая тарелка из углеродного волокна с криогенным приёмником сигналов станций и Звёздных Врат.',
    visualColor: '#2dd4bf',
    accentColor: '#99f6e4',
    badge: 'АНТЕННА СВЯЗИ ДРЛО',
    supplierId: 'ASTRO_RADAR',
    basePriceCr: 1100,
    massTons: 5.0,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 2.2,
    cargoCapacityTons: 0,
    firepowerDps: 0,
    sensorRangeKm: 9500,
  },
  CARGO_40T: {
    kind: 'CARGO_40T',
    category: 'CARGO',
    name: 'Герметичный трюмный контейнер (40 тонн)',
    tagline: 'Стандарт программы ББД диктатора · Объём 40 т',
    description:
      'Стандартизированный прочный цилиндрический грузовой модуль с арочными шпангоутами и автоматическими створками. Вмещает 40 метрических тонн руды, металлов или грузов.',
    visualColor: '#10b981',
    accentColor: '#a7f3d0',
    badge: 'ТРЮМ 40 т (ББД)',
    supplierId: 'TEKTON_CARGO',
    basePriceCr: 600,
    massTons: 4.0,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 0.5,
    cargoCapacityTons: 40,
    firepowerDps: 0,
    sensorRangeKm: 0,
  },
  CARGO_80T: {
    kind: 'CARGO_80T',
    category: 'CARGO',
    name: 'Тяжёлый грузовой отсек (80 тонн)',
    tagline: 'Удвоенный объём для крупнотоннажных перевозок',
    description:
      'Удлинённый модульный отсек с усиливающими бандажами и встроенным гравитационным уплотнителем груза. Вместимость 80 метрических тонн.',
    visualColor: '#059669',
    accentColor: '#6ee7b7',
    badge: 'ТРЮМ 80 т',
    supplierId: 'TEKTON_CARGO',
    basePriceCr: 1150,
    massTons: 7.5,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 1.0,
    cargoCapacityTons: 80,
    firepowerDps: 0,
    sensorRangeKm: 0,
  },
  CARGO_TANK_60T: {
    kind: 'CARGO_TANK_60T',
    category: 'CARGO',
    name: 'Изотермическая цистерна (60 тонн)',
    tagline: 'Жидкие газы, квантовое топливо и очищенный расплав',
    description:
      'Сферический криогенный резервуар с двойными вакуумными стенками и магнитным подвесом для перевозки жидкого водорода, ксенона и критической материи.',
    visualColor: '#14b8a6',
    accentColor: '#ccfbf1',
    badge: 'ЦИСТЕРНА 60 т',
    supplierId: 'TEKTON_CARGO',
    basePriceCr: 950,
    massTons: 6.0,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 1.2,
    cargoCapacityTons: 60,
    firepowerDps: 0,
    sensorRangeKm: 0,
  },
  WEAPON_LASER: {
    kind: 'WEAPON_LASER',
    category: 'WEAPONS',
    name: 'Импульсный лазерный комплекс',
    tagline: 'Скорострельная турель с фокусирующей оптикой · 60 DPS',
    description:
      'Спаренные лазерные излучатели на карданном подвесе с мгновенной скоростью доставки луча. Эффективно испаряет обшивку пиратских дронов и метеориты.',
    visualColor: '#ef4444',
    accentColor: '#fca5a5',
    badge: 'ЛАЗЕР 60 DPS',
    supplierId: 'BASTION_ARSENAL',
    basePriceCr: 1300,
    massTons: 5.5,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 4.0,
    cargoCapacityTons: 0,
    firepowerDps: 60,
    sensorRangeKm: 0,
  },
  WEAPON_PLASMA: {
    kind: 'WEAPON_PLASMA',
    category: 'WEAPONS',
    name: 'Тяжёлое плазменное орудие',
    tagline: 'Магнитный ускоритель сгустков плазмы · 110 DPS',
    description:
      'Тяжёлый ствол с кольцевыми электромагнитными катушками. Выстреливает высокотемпературные сгустки плазмы с колоссальным пробитием толстой брони.',
    visualColor: '#f43f5e',
    accentColor: '#fda4af',
    badge: 'ПЛАЗМА 110 DPS',
    supplierId: 'BASTION_ARSENAL',
    basePriceCr: 2200,
    massTons: 9.0,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 7.5,
    cargoCapacityTons: 0,
    firepowerDps: 110,
    sensorRangeKm: 0,
  },
  WEAPON_TORPEDO: {
    kind: 'WEAPON_TORPEDO',
    category: 'WEAPONS',
    name: 'Торпедный пусковой контейнер',
    tagline: 'Тяжёлые самонаводящиеся протонные торпеды · 160 DPS',
    description:
      'Четырёхзарядный пилонный контейнер с гравитационным катапультированием торпед дальнего радиуса действия.',
    visualColor: '#fb7185',
    accentColor: '#ffe4e6',
    badge: 'ТОРПЕДЫ 160 DPS',
    supplierId: 'BASTION_ARSENAL',
    basePriceCr: 2800,
    massTons: 11.0,
    thrustKn: 0,
    powerGenerationMw: 0,
    powerConsumptionMw: 3.5,
    cargoCapacityTons: 0,
    firepowerDps: 160,
    sensorRangeKm: 0,
  },
  COCKPIT_BRIDGE: {
    kind: 'COCKPIT_BRIDGE',
    category: 'COMMAND',
    name: 'Модуль пилота: Рубка и каюта',
    tagline: 'Канонический блок ББД: навигация, огонь, библиотека и связь',
    description:
      'Комплексный командный модуль: совмещённая операционная рубка (навигация и огневой пульт), жилая каюта пилота с библиотекой знаний, терминалом планирования и каналом связи.',
    visualColor: '#38bdf8',
    accentColor: '#bae6fd',
    badge: 'РУБКА + КАЮТА (ББД)',
    supplierId: 'DICTATOR_SHIPYARDS',
    basePriceCr: 2400,
    massTons: 14.0,
    thrustKn: 0,
    powerGenerationMw: 2.0,
    powerConsumptionMw: 3.0,
    cargoCapacityTons: 5,
    firepowerDps: 15,
    sensorRangeKm: 2500,
  },
  COMMAND_BRIDGE: {
    kind: 'COMMAND_BRIDGE',
    category: 'COMMAND',
    name: 'Командный мостик флагмана',
    tagline: 'Панорамный бронефонарь для тактического штаба флота',
    description:
      'Многоярусный мостик для экипажа из 6–12 офицеров с голографическим тактическим столом системы и координацией группы кораблей.',
    visualColor: '#6366f1',
    accentColor: '#c7d2fe',
    badge: 'ФЛАГМАНСКИЙ МОСТИК',
    supplierId: 'DICTATOR_SHIPYARDS',
    basePriceCr: 3800,
    massTons: 22.0,
    thrustKn: 0,
    powerGenerationMw: 5.0,
    powerConsumptionMw: 6.0,
    cargoCapacityTons: 8,
    firepowerDps: 25,
    sensorRangeKm: 6000,
  },
  LANDER_CABIN: {
    kind: 'LANDER_CABIN',
    category: 'LANDER',
    name: 'Планетарный посадочный модуль',
    tagline: 'Термозащитный экран, гидравлические опоры и шлюз',
    description:
      'Спускаемый капсульный отсек с абляционным тепловым щитом для входа в плотные атмосферы планет, амортизирующими стойками и герметичным посадочным шлюзом.',
    visualColor: '#f59e0b',
    accentColor: '#fde68a',
    badge: 'ПОСАДОЧНЫЙ МОДУЛЬ',
    supplierId: 'DICTATOR_SHIPYARDS',
    basePriceCr: 1400,
    massTons: 12.0,
    thrustKn: 15,
    powerGenerationMw: 0,
    powerConsumptionMw: 1.5,
    cargoCapacityTons: 10,
    firepowerDps: 0,
    sensorRangeKm: 1000,
  },
};

/**
 * Расчёт цен реализации/возврата ненужного модуля:
 * 1. Скупщик тут же на верфи: 50% начальной цены
 * 2. Торговцы на планетах: 80% начальной цены
 * 3. Официальный возврат производителю: 90% начальной цены
 */
export interface ModuleResalePricing {
  basePriceCr: number;
  // 50%
  scrapYardPriceCr: number;
  scrapYardPct: number;
  // 80%
  planetTradersPriceCr: number;
  planetTradersPct: number;
  // 90%
  manufacturerReturnPriceCr: number;
  manufacturerReturnPct: number;
}

export function getModuleResalePricing(kind: ModuleKind): ModuleResalePricing {
  const base = MODULE_CATALOG[kind]?.basePriceCr || 1000;
  return {
    basePriceCr: base,
    scrapYardPriceCr: Math.round(base * 0.5),
    scrapYardPct: 50,
    planetTradersPriceCr: Math.round(base * 0.8),
    planetTradersPct: 80,
    manufacturerReturnPriceCr: Math.round(base * 0.9),
    manufacturerReturnPct: 90,
  };
}

/**
 * Описание 6-лучевого хаба как самостоятельного монтируемого блока
 */
export const HUB_CORE_DEF: ModuleDefinition = {
  kind: 'ENGINE_REACTIVE' as unknown as ModuleKind, // для совместимости типов полей
  category: 'COMMAND',
  name: '6-лучевой стыковочный хаб (Каркас XYZ)',
  tagline: 'Центральная несущая сфера + 6 герметичных рукавов-шлюзов',
  description:
    'Универсальный строительный блок космического корабля: силовая титановая сфера с шестью ортогональными тубами (+X, -X, +Y, -Y, +Z, -Z), оснащёнными автоматическими магнитными стыковочными узлами.',
  visualColor: '#0ea5e9',
  accentColor: '#38bdf8',
  badge: 'ХАБ 6 УЗЛОВ XYZ',
  supplierId: 'DICTATOR_SHIPYARDS',
  basePriceCr: 1500,
  massTons: 6.0,
  thrustKn: 0,
  powerGenerationMw: 0,
  powerConsumptionMw: 0.8,
  cargoCapacityTons: 0,
  firepowerDps: 0,
  sensorRangeKm: 0,
};

/**
 * Жизненный цикл модуля в соответствии с концепцией:
 * 1. PURCHASED_AWAITING_DISPATCH — куплен у поставщика, в личном реестре игрока, ждёт доставки
 * 2. IN_SHIPYARD_INVENTORY — мгновенно телепортирован на верфь, готов к монтажу. Обратная телепортация ЗАБЛОКИРОВАНА.
 * 3. ATTACHED — состыкован с кораблём на стапеле (списана комиссия верфи). Вывезти можно только пристыкованным!
 * 4. IN_SHIPYARD_WAREHOUSE — продан скупщику за 50% и сдан на склад владельца верфи.
 */
export type ModuleLifeStatus =
  | 'PURCHASED_AWAITING_DISPATCH'
  | 'IN_SHIPYARD_INVENTORY'
  | 'ATTACHED'
  | 'IN_SHIPYARD_WAREHOUSE';

export type SupplierChannel =
  | 'MANUFACTURER'
  | 'PLANET_TRADER'
  | 'P2P_MARKET'
  | 'CLAN_BASE';

export interface SupplierChannelDetails {
  channel: SupplierChannel;
  titleRu: string;
  badgeRu: string;
  priceMultiplier: number;
  discountPct: number;
  descriptionRu: string;
  accentColor: string;
}

export const SUPPLIER_CHANNELS: Record<SupplierChannel, SupplierChannelDetails> = {
  MANUFACTURER: {
    channel: 'MANUFACTURER',
    titleRu: 'Завод-изготовитель (100%)',
    badgeRu: 'ЗАВОДСКАЯ ГАРАНТИЯ 100%',
    priceMultiplier: 1.0,
    discountPct: 0,
    descriptionRu: 'Прямые поставки со стапелей завода. Полная сертификация, заводская гарантия возврата 90%.',
    accentColor: '#38bdf8',
  },
  PLANET_TRADER: {
    channel: 'PLANET_TRADER',
    titleRu: 'Торговец на планете (90%)',
    badgeRu: 'РЕГИОНАЛЬНЫЙ ДИЛЕР -10%',
    priceMultiplier: 0.9,
    discountPct: 10,
    descriptionRu: 'Планетарная сеть дилеров. Модули со скидкой 10%. Возможность перепродажи на планете за 80%.',
    accentColor: '#34d399',
  },
  P2P_MARKET: {
    channel: 'P2P_MARKET',
    titleRu: 'P2P Биржа других игроков (75%)',
    badgeRu: 'БАРАХОЛКА ПИЛОТОВ -25%',
    priceMultiplier: 0.75,
    discountPct: 25,
    descriptionRu: 'Договорная свободная торговля между пилотами. Проверенные б/у узлы со скидкой 25%.',
    accentColor: '#fbbf24',
  },
  CLAN_BASE: {
    channel: 'CLAN_BASE',
    titleRu: 'Снабжение базы клана (70%)',
    badgeRu: 'ЛЬГОТА СОРАТНИКА -30%',
    priceMultiplier: 0.7,
    discountPct: 30,
    descriptionRu: 'Корпоративные поставки из арсенала клана по себестоимости со скидкой 30%.',
    accentColor: '#c084fc',
  },
};

export const SHIPYARD_DOCKING_FEE_CR = 250; // Тариф верфи за операцию стыковки
export const SCRAP_DEALER_RATE = 0.5;      // Скупщик на верфи: 50%
export const PLANET_TRADER_SELL_RATE = 0.8;// Продажа торговцу на планете: 80%
export const MANUFACTURER_RETURN_RATE = 0.9;// Возврат производителю: 90%

export type AnyModuleItemKind = ModuleKind | 'HUB_CORE';

export interface ModulePortOption {
  id: string;
  label: string;
  axisOffset?: AxisDirection;
  description: string;
}

/**
 * Получить список стыковочных узлов выбранного блока:
 * Если у блока несколько узлов (например, 6 узлов у Хаба или 2 узла у трюма),
 * пилот выбирает, каким узлом состыковать блок с кораблём!
 */
export function getModulePortOptions(kind: AnyModuleItemKind): ModulePortOption[] {
  if (kind === 'HUB_CORE') {
    return [
      { id: '+Z', label: 'Узел Носа (+Z)', axisOffset: '+Z', description: 'Фронтальный шлюзовой порт' },
      { id: '-Z', label: 'Узел Кормы (-Z)', axisOffset: '-Z', description: 'Кормовой тыловой шлюз' },
      { id: '+X', label: 'Узел Правого борта (+X)', axisOffset: '+X', description: 'Правый латеральный фланец' },
      { id: '-X', label: 'Узел Левого борта (-X)', axisOffset: '-X', description: 'Левый латеральный фланец' },
      { id: '+Y', label: 'Верхний узел (+Y)', axisOffset: '+Y', description: 'Дорсальный верхний шлюз' },
      { id: '-Y', label: 'Нижний узел (-Y)', axisOffset: '-Y', description: 'Вентральный нижний шлюз' },
    ];
  }

  if (kind === 'CARGO_40T' || kind === 'CARGO_80T' || kind === 'CARGO_TANK_60T') {
    return [
      { id: 'PORT_PRIMARY', label: 'Главный стыковочный замок', description: 'Основной герметичный фланец трюма' },
      { id: 'PORT_TRANSIT', label: 'Сквозной транзитный порт', description: 'Вспомогательный шлюз для сцепки в колонну' },
    ];
  }

  return [
    { id: 'MAIN_PORT', label: 'Монтажный шлюзовой узел', description: 'Стандартизированный фланец крепления к хабу' },
  ];
}

/**
 * Экземпляр модуля в системе с отслеживанием жизненного цикла
 */
export interface ShipyardModuleItem {
  id: string; // Уникальный серийный номер, напр. "MOD-7729"
  kind: AnyModuleItemKind;
  status: ModuleLifeStatus;
  supplierChannel: SupplierChannel;
  supplierName: string;
  nominalPriceCr: number;
  purchasedPriceCr: number;
  teleportLocked: boolean; // Становится true после доставки на верфь или пристыковки
  deliveredShipyardName?: string;
  attachedSlot?: {
    hubId: string;
    axis: AxisDirection;
  };
  purchasedAt: number;
}

/**
 * Создать начальный инвентарь модулей и реестр пилота
 */
export function createInitialPlayerShipyardState(): {
  credits: number;
  modules: ShipyardModuleItem[];
  shipyardOwnerFundCr: number;
  scrappedCount: number;
} {
  const now = Date.now();
  const initialModules: ShipyardModuleItem[] = [
    // 1. Модули на верфи, готовые к монтажу (IN_SHIPYARD_INVENTORY, телепортация заблокирована)
    {
      id: 'MOD-9011',
      kind: 'ENGINE_REACTIVE',
      status: 'IN_SHIPYARD_INVENTORY',
      supplierChannel: 'MANUFACTURER',
      supplierName: 'НПО «Квант-ТяжМаш»',
      nominalPriceCr: 1200,
      purchasedPriceCr: 1200,
      teleportLocked: true,
      deliveredShipyardName: 'Орбитальная Верфь Талиона',
      purchasedAt: now - 3600000 * 5,
    },
    {
      id: 'MOD-9012',
      kind: 'WEAPON_PLASMA',
      status: 'IN_SHIPYARD_INVENTORY',
      supplierChannel: 'PLANET_TRADER',
      supplierName: 'Орбитальный Арсенал «Бастион» (Региональный дилер)',
      nominalPriceCr: 2200,
      purchasedPriceCr: 1980,
      teleportLocked: true,
      deliveredShipyardName: 'Орбитальная Верфь Талиона',
      purchasedAt: now - 3600000 * 4,
    },
    {
      id: 'MOD-9013',
      kind: 'SENSOR_RADAR',
      status: 'IN_SHIPYARD_INVENTORY',
      supplierChannel: 'P2P_MARKET',
      supplierName: 'Капитан Торн (P2P биржа)',
      nominalPriceCr: 950,
      purchasedPriceCr: 712,
      teleportLocked: true,
      deliveredShipyardName: 'Орбитальная Верфь Талиона',
      purchasedAt: now - 3600000 * 3,
    },
    {
      id: 'MOD-9014',
      kind: 'HUB_CORE',
      status: 'IN_SHIPYARD_INVENTORY',
      supplierChannel: 'MANUFACTURER',
      supplierName: 'ГосСудоверфи Диктатора «Буран-Авангард»',
      nominalPriceCr: 1500,
      purchasedPriceCr: 1500,
      teleportLocked: true,
      deliveredShipyardName: 'Орбитальная Верфь Талиона',
      purchasedAt: now - 3600000 * 2,
    },
    {
      id: 'MOD-9015',
      kind: 'CARGO_40T',
      status: 'IN_SHIPYARD_INVENTORY',
      supplierChannel: 'CLAN_BASE',
      supplierName: 'Арсенал Синдиката Шахтёров',
      nominalPriceCr: 600,
      purchasedPriceCr: 420,
      teleportLocked: true,
      deliveredShipyardName: 'Орбитальная Верфь Талиона',
      purchasedAt: now - 3600000,
    },

    // 2. Модули в реестре покупок, ожидающие доставки (PURCHASED_AWAITING_DISPATCH)
    {
      id: 'MOD-8021',
      kind: 'ENGINE_PHOTONIC',
      status: 'PURCHASED_AWAITING_DISPATCH',
      supplierChannel: 'MANUFACTURER',
      supplierName: 'НПО «Квант-ТяжМаш»',
      nominalPriceCr: 3200,
      purchasedPriceCr: 3200,
      teleportLocked: false,
      purchasedAt: now - 1800000,
    },
    {
      id: 'MOD-8022',
      kind: 'SOLAR_WINGS',
      status: 'PURCHASED_AWAITING_DISPATCH',
      supplierChannel: 'PLANET_TRADER',
      supplierName: 'Концерн «Гелиос-Энергия» (Торговый дом Меркурия)',
      nominalPriceCr: 800,
      purchasedPriceCr: 720,
      teleportLocked: false,
      purchasedAt: now - 1200000,
    },
    {
      id: 'MOD-8023',
      kind: 'CARGO_80T',
      status: 'PURCHASED_AWAITING_DISPATCH',
      supplierChannel: 'CLAN_BASE',
      supplierName: 'База Клана Вольных Рудокопов',
      nominalPriceCr: 1000,
      purchasedPriceCr: 700,
      teleportLocked: false,
      purchasedAt: now - 900000,
    },
    {
      id: 'MOD-8024',
      kind: 'HUB_CORE',
      status: 'PURCHASED_AWAITING_DISPATCH',
      supplierChannel: 'P2P_MARKET',
      supplierName: 'Инженер Векслер (P2P барахолка)',
      nominalPriceCr: 1500,
      purchasedPriceCr: 1125,
      teleportLocked: false,
      purchasedAt: now - 600000,
    },
    {
      id: 'MOD-8025',
      kind: 'WEAPON_LASER',
      status: 'PURCHASED_AWAITING_DISPATCH',
      supplierChannel: 'MANUFACTURER',
      supplierName: 'Орбитальный Арсенал «Бастион»',
      nominalPriceCr: 1300,
      purchasedPriceCr: 1300,
      teleportLocked: false,
      purchasedAt: now - 300000,
    },

    // 3. Архив на складе скупщика верфи (IN_SHIPYARD_WAREHOUSE)
    {
      id: 'MOD-7001',
      kind: 'ENGINE_ION',
      status: 'IN_SHIPYARD_WAREHOUSE',
      supplierChannel: 'P2P_MARKET',
      supplierName: 'Скупщик утиля Орбитальной Верфи',
      nominalPriceCr: 1600,
      purchasedPriceCr: 800,
      teleportLocked: true,
      deliveredShipyardName: 'Орбитальная Верфь Талиона',
      purchasedAt: now - 86400000,
    },
  ];

  return {
    credits: 35000,
    modules: initialModules,
    shipyardOwnerFundCr: 12500,
    scrappedCount: 1,
  };
}

/**
 * Тип склада модулей на верфи (запас купленных пилотом и телепортированных модулей)
 */
export type ShipyardWarehouse = Record<ModuleKind, number>;

/**
 * Создать стартовый склад модулей на верфи
 */
export function createInitialShipyardWarehouse(): ShipyardWarehouse {
  return {
    ENGINE_REACTIVE: 3,
    ENGINE_PHOTONIC: 2,
    ENGINE_ION: 2,
    ENGINE_GRAVITON: 1,
    SOLAR_WINGS: 4,
    SENSOR_RADAR: 2,
    DISH_ANTENNA: 2,
    CARGO_40T: 4,
    CARGO_80T: 2,
    CARGO_TANK_60T: 2,
    WEAPON_LASER: 4,
    WEAPON_PLASMA: 2,
    WEAPON_TORPEDO: 1,
    COCKPIT_BRIDGE: 1,
    COMMAND_BRIDGE: 1,
    LANDER_CABIN: 1,
  };
}

export const HUB_BASE_MASS_TONS = 6.0;
export const HUB_BASE_POWER_CONSUMPTION_MW = 0.8;
export const HUB_GRID_DISTANCE = 2.4; // Расстояние между центрами смежных хабов в 3D

export interface ModularSlot {
  axis: AxisDirection;
  installedModuleKind: ModuleKind | null;
  connectedHubId: string | null;
}

export interface ModularHub {
  id: string;
  name: string;
  gridPos: [number, number, number]; // [x, y, z] в целочисленной сетке
  slots: Record<AxisDirection, ModularSlot>;
}

export interface ModularShipStructure {
  id: string;
  name: string;
  tagline: string;
  createdAt: number;
  rootHubId: string;
  hubs: Record<string, ModularHub>;
}

export interface ShipCalculatedStats {
  hubsCount: number;
  modulesCount: number;
  totalMassTons: number;
  totalThrustKn: number;
  thrustToWeightRatio: number;
  powerGenMw: number;
  powerDrainMw: number;
  netPowerMw: number;
  cargoCapacityTons: number;
  firepowerDps: number;
  maxSensorRangeKm: number;
  centerOfMass: [number, number, number];
  boundingSize: [number, number, number];
}

/**
 * Подсчёт интегральных ТТХ корабля
 */
export function calculateShipStats(ship: ModularShipStructure): ShipCalculatedStats {
  const hubsList = Object.values(ship.hubs);
  let totalMass = 0;
  let totalThrust = 0;
  let powerGen = 0;
  let powerDrain = 0;
  let cargoCap = 0;
  let firepower = 0;
  let maxSensor = 0;
  let modulesCount = 0;

  let weightedX = 0;
  let weightedY = 0;
  let weightedZ = 0;

  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0,
    minZ = 0,
    maxZ = 0;

  for (const hub of hubsList) {
    const hubMass = HUB_BASE_MASS_TONS;
    totalMass += hubMass;
    powerDrain += HUB_BASE_POWER_CONSUMPTION_MW;

    const [hx, hy, hz] = hub.gridPos;
    weightedX += hx * hubMass;
    weightedY += hy * hubMass;
    weightedZ += hz * hubMass;

    minX = Math.min(minX, hx);
    maxX = Math.max(maxX, hx);
    minY = Math.min(minY, hy);
    maxY = Math.max(maxY, hy);
    minZ = Math.min(minZ, hz);
    maxZ = Math.max(maxZ, hz);

    for (const axis of ALL_AXES) {
      const slot = hub.slots[axis];
      if (slot.installedModuleKind) {
        modulesCount++;
        const modDef = MODULE_CATALOG[slot.installedModuleKind];
        totalMass += modDef.massTons;
        totalThrust += modDef.thrustKn;
        powerGen += modDef.powerGenerationMw;
        powerDrain += modDef.powerConsumptionMw;
        cargoCap += modDef.cargoCapacityTons;
        firepower += modDef.firepowerDps;
        maxSensor = Math.max(maxSensor, modDef.sensorRangeKm);

        const [vx, vy, vz] = AXIS_VECTORS[axis];
        const modX = hx + vx * 0.8;
        const modY = hy + vy * 0.8;
        const modZ = hz + vz * 0.8;

        weightedX += modX * modDef.massTons;
        weightedY += modY * modDef.massTons;
        weightedZ += modZ * modDef.massTons;

        minX = Math.min(minX, modX);
        maxX = Math.max(maxX, modX);
        minY = Math.min(minY, modY);
        maxY = Math.max(maxY, modY);
        minZ = Math.min(minZ, modZ);
        maxZ = Math.max(maxZ, modZ);
      }
    }
  }

  const comX = totalMass > 0 ? weightedX / totalMass : 0;
  const comY = totalMass > 0 ? weightedY / totalMass : 0;
  const comZ = totalMass > 0 ? weightedZ / totalMass : 0;

  // TWR = Тяга (кН) / (Масса (т) * g0 (9.81 м/с²))
  const twr = totalMass > 0 ? totalThrust / (totalMass * 9.81) : 0;

  return {
    hubsCount: hubsList.length,
    modulesCount,
    totalMassTons: Math.round(totalMass * 10) / 10,
    totalThrustKn: Math.round(totalThrust),
    thrustToWeightRatio: Math.round(twr * 100) / 100,
    powerGenMw: Math.round(powerGen * 10) / 10,
    powerDrainMw: Math.round(powerDrain * 10) / 10,
    netPowerMw: Math.round((powerGen - powerDrain) * 10) / 10,
    cargoCapacityTons: Math.round(cargoCap),
    firepowerDps: Math.round(firepower),
    maxSensorRangeKm: Math.round(maxSensor),
    centerOfMass: [
      Math.round(comX * 100) / 100,
      Math.round(comY * 100) / 100,
      Math.round(comZ * 100) / 100,
    ],
    boundingSize: [
      Math.round((maxX - minX + 1.2) * 10) / 10,
      Math.round((maxY - minY + 1.2) * 10) / 10,
      Math.round((maxZ - minZ + 1.2) * 10) / 10,
    ],
  };
}

/**
 * Создать пустой хаб
 */
export function createEmptyHub(
  id: string,
  name: string,
  gridPos: [number, number, number]
): ModularHub {
  const slots: Record<AxisDirection, ModularSlot> = {
    '+X': { axis: '+X', installedModuleKind: null, connectedHubId: null },
    '-X': { axis: '-X', installedModuleKind: null, connectedHubId: null },
    '+Y': { axis: '+Y', installedModuleKind: null, connectedHubId: null },
    '-Y': { axis: '-Y', installedModuleKind: null, connectedHubId: null },
    '+Z': { axis: '+Z', installedModuleKind: null, connectedHubId: null },
    '-Z': { axis: '-Z', installedModuleKind: null, connectedHubId: null },
  };

  return {
    id,
    name,
    gridPos,
    slots,
  };
}

/**
 * 1. Канонический Модульный Эксплорер (точно по описанию пользователя):
 * Секция 1 (Корма, Z=0): Хаб двигателей с 5 сферическими двигателями (-Z, +X, -X, +Y, -Y) -> +Z стыкуется с Хабом 2
 * Секция 2 (Z=1): Хаб солнечных крыльев (+X, -X, +Y, -Y) -> +Z стыкуется с Хабом 3
 * Секция 3 (Z=2): Хаб приборов и радаров (+X, -X, +Y, -Y) -> +Z стыкуется с Хабом 4
 * Секция 4 (Z=3): Хаб грузовых трюмов (+X, -X, -Y, +Y) -> +Z стыкуется с Хабом 5
 * Секция 5 (Z=4): Хаб вооружения (+X, -X, +Y) -> +Z стыкуется с Хабом 6
 * Секция 6 (Z=5): Носовой командный хаб (на +Z — Рубка пилота и каюта с библиотекой и связью, на -Y посадочный модуль)
 */
export function createCanonicalExplorerPreset(): ModularShipStructure {
  const hubs: Record<string, ModularHub> = {};

  // 1. Хаб Двигателей (Корма, grid: [0, 0, -2])
  const hub1 = createEmptyHub('hub-engine', 'Секция 1 · Кормовой блок двигателей (5 дюз)', [0, 0, -2]);
  hub1.slots['-Z'].installedModuleKind = 'ENGINE_PHOTONIC'; // Главная кормовая дюза
  hub1.slots['+X'].installedModuleKind = 'ENGINE_REACTIVE'; // Правая дюза
  hub1.slots['-X'].installedModuleKind = 'ENGINE_REACTIVE'; // Левая дюза
  hub1.slots['+Y'].installedModuleKind = 'ENGINE_ION';      // Верхняя дюза
  hub1.slots['-Y'].installedModuleKind = 'ENGINE_ION';      // Нижняя дюза
  hub1.slots['+Z'].connectedHubId = 'hub-solar';           // Стыковка со следующим хабом!

  // 2. Хаб Солнечных панелей (grid: [0, 0, -1])
  const hub2 = createEmptyHub('hub-solar', 'Секция 2 · Энергетический блок (Солнечные крылья)', [0, 0, -1]);
  hub2.slots['-Z'].connectedHubId = 'hub-engine';
  hub2.slots['+X'].installedModuleKind = 'SOLAR_WINGS';
  hub2.slots['-X'].installedModuleKind = 'SOLAR_WINGS';
  hub2.slots['+Y'].installedModuleKind = 'SOLAR_WINGS';
  hub2.slots['-Y'].installedModuleKind = 'SOLAR_WINGS';
  hub2.slots['+Z'].connectedHubId = 'hub-sensor';

  // 3. Хаб Приборов & Сенсоров (grid: [0, 0, 0])
  const hub3 = createEmptyHub('hub-sensor', 'Секция 3 · Сенсорный блок (Радары и Антенны)', [0, 0, 0]);
  hub3.slots['-Z'].connectedHubId = 'hub-solar';
  hub3.slots['+Y'].installedModuleKind = 'SENSOR_RADAR';
  hub3.slots['-Y'].installedModuleKind = 'DISH_ANTENNA';
  hub3.slots['+X'].installedModuleKind = 'SENSOR_RADAR';
  hub3.slots['-X'].installedModuleKind = 'DISH_ANTENNA';
  hub3.slots['+Z'].connectedHubId = 'hub-cargo';

  // 4. Хаб Грузовых трюмов (grid: [0, 0, 1])
  const hub4 = createEmptyHub('hub-cargo', 'Секция 4 · Грузовой отсек (Трюмы 40т / 80т)', [0, 0, 1]);
  hub4.slots['-Z'].connectedHubId = 'hub-sensor';
  hub4.slots['+X'].installedModuleKind = 'CARGO_40T';
  hub4.slots['-X'].installedModuleKind = 'CARGO_40T';
  hub4.slots['-Y'].installedModuleKind = 'CARGO_80T';
  hub4.slots['+Y'].installedModuleKind = 'CARGO_TANK_60T';
  hub4.slots['+Z'].connectedHubId = 'hub-weapon';

  // 5. Хаб Вооружения (grid: [0, 0, 2])
  const hub5 = createEmptyHub('hub-weapon', 'Секция 5 · Боевой отсек (Лазеры и Плазма)', [0, 0, 2]);
  hub5.slots['-Z'].connectedHubId = 'hub-cargo';
  hub5.slots['+X'].installedModuleKind = 'WEAPON_LASER';
  hub5.slots['-X'].installedModuleKind = 'WEAPON_LASER';
  hub5.slots['+Y'].installedModuleKind = 'WEAPON_PLASMA';
  hub5.slots['-Y'].installedModuleKind = 'WEAPON_TORPEDO';
  hub5.slots['+Z'].connectedHubId = 'hub-cockpit';

  // 6. Хаб Пилота (Нос, grid: [0, 0, 3])
  const hub6 = createEmptyHub('hub-cockpit', 'Секция 6 · Командный модуль пилота (Рубка + Каюта)', [0, 0, 3]);
  hub6.slots['-Z'].connectedHubId = 'hub-weapon';
  hub6.slots['+Z'].installedModuleKind = 'COCKPIT_BRIDGE'; // Носовая рубка и каюта с библиотекой
  hub6.slots['-Y'].installedModuleKind = 'LANDER_CABIN';   // Вентральный посадочный модуль
  hub6.slots['+Y'].installedModuleKind = 'SENSOR_RADAR';   // Носовой радар наведения
  hub6.slots['+X'].installedModuleKind = 'WEAPON_LASER';   // Бортовой перехватчик
  hub6.slots['-X'].installedModuleKind = 'WEAPON_LASER';   // Бортовой перехватчик

  hubs['hub-engine'] = hub1;
  hubs['hub-solar'] = hub2;
  hubs['hub-sensor'] = hub3;
  hubs['hub-cargo'] = hub4;
  hubs['hub-weapon'] = hub5;
  hubs['hub-cockpit'] = hub6;

  return {
    id: 'canonical-user-explorer',
    name: 'Канонический 6-секционный Эксплорер (Каркас XYZ)',
    tagline: 'Идеология модульного кораблестроения: 5 дюз → Энергия → Радары → Трюмы 40т → Оружие → Рубка пилота',
    createdAt: Date.now(),
    rootHubId: 'hub-sensor',
    hubs,
  };
}

/**
 * 2. Тяжёлый рудовоз-буксир (Deep Miner)
 */
export function createHeavyMinerPreset(): ModularShipStructure {
  const hubs: Record<string, ModularHub> = {};

  const hEngine = createEmptyHub('h-eng', 'Кормовой тяговый блок', [0, 0, -1]);
  hEngine.slots['-Z'].installedModuleKind = 'ENGINE_GRAVITON';
  hEngine.slots['+X'].installedModuleKind = 'ENGINE_REACTIVE';
  hEngine.slots['-X'].installedModuleKind = 'ENGINE_REACTIVE';
  hEngine.slots['+Y'].installedModuleKind = 'SOLAR_WINGS';
  hEngine.slots['-Y'].installedModuleKind = 'SOLAR_WINGS';
  hEngine.slots['+Z'].connectedHubId = 'h-core';

  const hCore = createEmptyHub('h-core', 'Центральный грузовой хаб', [0, 0, 0]);
  hCore.slots['-Z'].connectedHubId = 'h-eng';
  hCore.slots['+X'].installedModuleKind = 'CARGO_80T';
  hCore.slots['-X'].installedModuleKind = 'CARGO_80T';
  hCore.slots['+Y'].installedModuleKind = 'CARGO_TANK_60T';
  hCore.slots['-Y'].installedModuleKind = 'CARGO_80T';
  hCore.slots['+Z'].connectedHubId = 'h-front';

  const hFront = createEmptyHub('h-front', 'Носовой навигационный блок', [0, 0, 1]);
  hFront.slots['-Z'].connectedHubId = 'h-core';
  hFront.slots['+Z'].installedModuleKind = 'COCKPIT_BRIDGE';
  hFront.slots['+Y'].installedModuleKind = 'SENSOR_RADAR';
  hFront.slots['-Y'].installedModuleKind = 'LANDER_CABIN';
  hFront.slots['+X'].installedModuleKind = 'CARGO_40T';
  hFront.slots['-X'].installedModuleKind = 'CARGO_40T';

  hubs['h-eng'] = hEngine;
  hubs['h-core'] = hCore;
  hubs['h-front'] = hFront;

  return {
    id: 'heavy-miner-hauler',
    name: 'Тяжёлый Рудовоз «Гравитон-Майнер» (320т Трюм)',
    tagline: 'Гравитационная дюза, 5 герметичных трюмов и посадочная шлюпка',
    createdAt: Date.now(),
    rootHubId: 'h-core',
    hubs,
  };
}

/**
 * 3. Скоростной патрульный корвет
 */
export function createPatrolCorvettePreset(): ModularShipStructure {
  const hubs: Record<string, ModularHub> = {};

  const hRear = createEmptyHub('h-rear', 'Форсажный кормовой блок', [0, 0, -1]);
  hRear.slots['-Z'].installedModuleKind = 'ENGINE_PHOTONIC';
  hRear.slots['+X'].installedModuleKind = 'ENGINE_ION';
  hRear.slots['-X'].installedModuleKind = 'ENGINE_ION';
  hRear.slots['+Y'].installedModuleKind = 'SOLAR_WINGS';
  hRear.slots['-Y'].installedModuleKind = 'SOLAR_WINGS';
  hRear.slots['+Z'].connectedHubId = 'h-main';

  const hMain = createEmptyHub('h-main', 'Боевой центр управления', [0, 0, 0]);
  hMain.slots['-Z'].connectedHubId = 'h-rear';
  hMain.slots['+Z'].installedModuleKind = 'COMMAND_BRIDGE';
  hMain.slots['+X'].installedModuleKind = 'WEAPON_PLASMA';
  hMain.slots['-X'].installedModuleKind = 'WEAPON_PLASMA';
  hMain.slots['+Y'].installedModuleKind = 'WEAPON_LASER';
  hMain.slots['-Y'].installedModuleKind = 'SENSOR_RADAR';

  hubs['h-rear'] = hRear;
  hubs['h-main'] = hMain;

  return {
    id: 'patrol-corvette',
    name: 'Патрульный Корвет «Вектор-Перехватчик»',
    tagline: 'Фотонная дюза, спаренная плазма, флагманский мостик и РЛС 360°',
    createdAt: Date.now(),
    rootHubId: 'h-main',
    hubs,
  };
}

/**
 * 4. Базовый чистый 6-лучевой хаб для свободного конструирования игроком
 */
export function createEmptySingleHubShip(): ModularShipStructure {
  const root = createEmptyHub('hub-root', 'Базовый стыковочный хаб #1', [0, 0, 0]);
  const hubs: Record<string, ModularHub> = { 'hub-root': root };

  return {
    id: `custom-ship-${Date.now()}`,
    name: 'Пользовательский Модульный Корабль',
    tagline: 'Сборка на основе ортогонального 6-лучевого стыковочного каркаса XYZ',
    createdAt: Date.now(),
    rootHubId: 'hub-root',
    hubs,
  };
}

/**
 * Вспомогательная функция для генерации нового уникального ID хаба
 */
export function generateHubId(existingHubs: Record<string, ModularHub>): string {
  let counter = Object.keys(existingHubs).length + 1;
  while (existingHubs[`hub-${counter}`]) {
    counter++;
  }
  return `hub-${counter}`;
}
