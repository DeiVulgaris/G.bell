// ============================================================================
// АСТРОФИЗИЧЕСКИЙ ДВИЖОК ЗВЁЗДНЫХ КЛАССОВ И КВАНТОВОГО ИЗЛУЧЕНИЯ
// • Класс звёзд в созвездиях прямо определяет способность звезды генерировать
//   фотонный и гаммаквантовый потенциал (безмассовый возобновляемый квантовый ветер).
// • Эталон шкалы: ЖЁЛТЫЙ КАРЛИК G2 V (НАШЕ СОЛНЦЕ) — Коэффициент ровно 1.00 (100% базовой нормы).
// • У карликов (красные, коричневые, оранжевые карлики) потенциал МЕНЬШЕ (< 1.0, 0.35–0.65×).
// • У голубых гигантов и сверхгигантов (классы O и B: Ригель, Беллатрикс, Спика, Альнитак) —
//   потенциал существенно БОЛЬШЕ (> 1.0, 2.20–3.50×) за счёт колоссальной поверхностной температуры
//   (15 000 – 45 000 K) и бешеного потока жёстких гамма-квантов и оптических фотонов!
// ============================================================================

export type SpectralClassId = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'WD' | 'PULSAR';

export interface StellarClassBenchmark {
  classId: SpectralClassId;
  code: string;
  titleRu: string;
  archetypeStar: string;
  surfaceTempRangeK: string;
  starColorHex: string;
  photonPotential: number;      // Оптический/световой фотонный потенциал (Солнце G2V = 1.00)
  gammaPotential: number;       // Высокоэнергетический гаммаквантовый потенциал (Солнце = 1.00)
  totalRadCoeff: number;        // Интегральный множитель накачки аккумулятора ГЭУ K_rad
  rechargeTime100TonSec: number;// Время зарядки 100т аккумулятора на дистанции 100 ед. (Солнце = 60с)
  descriptionRu: string;
}

/**
 * Эталонная шкала спектральных классов по Моргану-Кинэну + специальные реликты.
 * Интегральный множитель: K_rad = 0.52 * photonPotential + 0.48 * gammaPotential.
 */
export const STELLAR_CLASS_BENCHMARKS: Record<SpectralClassId, StellarClassBenchmark> = {
  O: {
    classId: 'O',
    code: 'O-КЛАСС',
    titleRu: 'Голубой Гипергигант / Сверхгигант',
    archetypeStar: 'Альнитак (ζ Ori), Дзета Кормы, Тета 1 Ориона C',
    surfaceTempRangeK: '30 000 – 50 000+ K',
    starColorHex: '#38bdf8',
    photonPotential: 3.30,
    gammaPotential: 3.60,
    totalRadCoeff: 3.44,
    rechargeTime100TonSec: 17.4,
    descriptionRu: 'Экстремально горячая и массивная голубая звезда. Излучает колоссальный поток ультрафиолета, жёстких фотонов и гамма-квантов. Аккумулятор ГЭУ заряжается в 3.4 раза быстрее Солнца!',
  },
  B: {
    classId: 'B',
    code: 'B-КЛАСС',
    titleRu: 'Голубой Гигант / Сверхгигант',
    archetypeStar: 'Ригель (β Ori), Беллатрикс (γ Ori), Алькаид (η UMa)',
    surfaceTempRangeK: '10 000 – 30 000 K',
    starColorHex: '#60a5fa',
    photonPotential: 2.35,
    gammaPotential: 2.25,
    totalRadCoeff: 2.30,
    rechargeTime100TonSec: 26.1,
    descriptionRu: 'Мощный голубой гигант с яростным квантовым ветром. Поток фотонов и гамма-квантов более чем в 2.3 раза превышает солнечный норматив.',
  },
  A: {
    classId: 'A',
    code: 'A-КЛАСС',
    titleRu: 'Белая Звезда Главной Последовательности',
    archetypeStar: 'Сириус (α CMa), Вега (α Lyr), Денеб, Мерак (β UMa)',
    surfaceTempRangeK: '7 500 – 10 000 K',
    starColorHex: '#e0f2fe',
    photonPotential: 1.55,
    gammaPotential: 1.40,
    totalRadCoeff: 1.48,
    rechargeTime100TonSec: 40.5,
    descriptionRu: 'Сверкающая белая звезда с сильными линиями водорода Бальмера. Обеспечивает высокий стабильный приток энергии (+48% к Солнцу).',
  },
  F: {
    classId: 'F',
    code: 'F-КЛАСС',
    titleRu: 'Жёлто-белый Гигант / Субгигант',
    archetypeStar: 'Канопус (α Car), Процион (α CMi), Полярная звезда (α UMi)',
    surfaceTempRangeK: '6 000 – 7 500 K',
    starColorHex: '#fef08a',
    photonPotential: 1.20,
    gammaPotential: 1.15,
    totalRadCoeff: 1.18,
    rechargeTime100TonSec: 50.8,
    descriptionRu: 'Умеренно горячая жёлто-белая звезда. Потенциал фотонов и гамма-квантов на 18% выше солнечного.',
  },
  G: {
    classId: 'G',
    code: 'G-КЛАСС (ЭТАЛОН)',
    titleRu: 'Жёлтый Карлик (Солнечный Тип)',
    archetypeStar: 'СОЛНЦЕ (G2 V), Альфа Центавра A, Lave Прайм',
    surfaceTempRangeK: '5 200 – 6 000 K (Солнце: 5 778 K)',
    starColorHex: '#facc15',
    photonPotential: 1.00,
    gammaPotential: 1.00,
    totalRadCoeff: 1.00,
    rechargeTime100TonSec: 60.0,
    descriptionRu: 'Базовый физический эталон (коэффициент 1.00). В 100 единицах от звезды зарядка аккумулятора составляет ровно 100% массы корабля в минуту (1 минута на полную зарядку).',
  },
  K: {
    classId: 'K',
    code: 'K-КЛАСС',
    titleRu: 'Оранжевый Гигант / Карлик',
    archetypeStar: 'Арктур (α Boo), Альдебаран (α Tau), Поллукс (β Gem)',
    surfaceTempRangeK: '3 700 – 5 200 K',
    starColorHex: '#fb923c',
    photonPotential: 0.78,
    gammaPotential: 0.65,
    totalRadCoeff: 0.72,
    rechargeTime100TonSec: 83.3,
    descriptionRu: 'Оранжевая звезда с преобладанием мягкого спектра. Излучение гамма-квантов слабее, зарядка аккумулятора на 28% медленнее, чем у Солнца.',
  },
  M: {
    classId: 'M',
    code: 'M-КЛАСС',
    titleRu: 'Красный Карлик / Красный Сверхгигант',
    archetypeStar: 'Проксима Центавра (M5 V · карлик), Бетельгейзе (M1-2 · сверхгигант)',
    surfaceTempRangeK: '2 400 – 3 700 K',
    starColorHex: '#f87171',
    photonPotential: 0.45,
    gammaPotential: 0.35,
    totalRadCoeff: 0.40,
    rechargeTime100TonSec: 150.0,
    descriptionRu: 'Красный карлик обладает низкой температурой и слабым гамма-потенциалом (0.40× от Солнца). Для полной зарядки корабля требуется около 2.5 минут даже вблизи звезды.',
  },
  WD: {
    classId: 'WD',
    code: 'БЕЛЫЙ КАРЛИК',
    titleRu: 'Белый Карлик (Вырожденное Ядро)',
    archetypeStar: 'Сириус B, Процион B, Фекда Реликт (A0)',
    surfaceTempRangeK: '8 000 – 40 000 K (малая площадь)',
    starColorHex: '#c7d2fe',
    photonPotential: 0.58,
    gammaPotential: 0.68,
    totalRadCoeff: 0.63,
    rechargeTime100TonSec: 95.2,
    descriptionRu: 'Компактное вырожденное ядро. Высокая температура короны компенсируется малой площадью излучающей поверхности, поэтому суммарный поток меньше солнечного (0.63×).',
  },
  PULSAR: {
    classId: 'PULSAR',
    code: 'РЕЛИКТОВЫЙ ПУЛЬСАР',
    titleRu: 'Нейтронная Звезда / Ядро Сверхновой (Ω-γ)',
    archetypeStar: 'Пульсар в Крабе, OMEGA-RELICT, CHRONOS-VOID',
    surfaceTempRangeK: '1 000 000+ K (магнитные полюса)',
    starColorHex: '#c084fc',
    photonPotential: 1.25,
    gammaPotential: 4.80,
    totalRadCoeff: 2.95,
    rechargeTime100TonSec: 20.3,
    descriptionRu: 'Реликтовая нейтронная звезда Старой Галактики с непрерывными всплесками гамма-квантов от диссипации узлов материи. Колоссальный гаммаквантовый потенциал (4.80×)!',
  },
};

export interface StellarRadiationProfile {
  rawIdentifier: string;
  matchedName: string;
  benchmark: StellarClassBenchmark;
  spectralClass: SpectralClassId;
  spectralCode: string;
  stellarTypeRu: string;
  surfaceTempLabel: string;
  starColorHex: string;
  photonPotential: number;      // Например 2.35
  gammaPotential: number;       // Например 2.25
  totalRadCoeff: number;        // K_rad, например 2.30
  ratioToSunLabel: string;      // «x2.30 к Солнцу (+130%)» или «x0.40 к Солнцу (-60%)»
  rechargeTime100TonSec: number;
  badgeShort: string;           // «⭐ B-КЛАСС · ГОЛУБОЙ ГИГАНТ (x2.30)»
  isDwarf: boolean;             // Меньше Солнца (< 1.0)
  isGiant: boolean;             // Больше Солнца (> 1.0)
  isSunEquivalent: boolean;     // Ровно Солнце (1.0)
  systemOriginName?: string;    // Название звезды или системы
}

/**
 * Интеллектуальный анализатор спектрального класса и радиационного потенциала звезды.
 * Распознает описания из каталогов, названия звёзд, ключи систем и спектральные заметки.
 */
export function getStarRadiationProfile(starNoteOrNameOrKey: string): StellarRadiationProfile {
  const text = (starNoteOrNameOrKey || '').toLowerCase();

  // 1. Проверка на реликт / пульсар / Старую Галактику (Ω-γ)
  if (
    text.includes('omega-relict') ||
    text.includes('chronos-void') ||
    text.includes('пульсар') ||
    text.includes('сверхнов') ||
    text.includes('диссипаци')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.PULSAR;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Реликтовый Гамма-Пульсар (Ω-γ)');
  }

  // 2. Проверка на класс O (Голубой сверхгигант / гипергигант)
  if (
    text.includes(' o9') ||
    text.includes(' o8') ||
    text.includes(' o7') ||
    text.includes(' o5') ||
    text.includes('класс o') ||
    text.includes('гипергигант')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.O;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Голубой гипергигант класса O');
  }

  // 3. Проверка на Голубой гигант / сверхгигант (Класс B: Ригель, Беллатрикс, Алькаид, Саиф и др.)
  if (
    text.includes('голубой гигант') ||
    text.includes('голубой сверхгигант') ||
    text.includes('бело-голубой сверхгигант') ||
    text.includes('бело-голубой гигант') ||
    text.includes('голубая звезда') ||
    text.includes('голубой субгигант') ||
    text.includes(' b0') ||
    text.includes(' b1') ||
    text.includes(' b2') ||
    text.includes(' b3') ||
    text.includes(' b6') ||
    text.includes(' b7') ||
    text.includes(' b8') ||
    text.includes(' b9') ||
    text.includes('ригель') ||
    text.includes('беллатрикс') ||
    text.includes('альнилам') ||
    text.includes('саиф') ||
    text.includes('алькаид')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.B;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Голубой гигант класса B');
  }

  // 4. Проверка на Белый карлик
  if (text.includes('белый карлик')) {
    const b = STELLAR_CLASS_BENCHMARKS.WD;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Белый карлик вырожденного типа');
  }

  // 5. Проверка на Красный карлик (меньше Солнца)
  if (text.includes('красный карлик') || (text.includes('карлик') && text.includes(' m'))) {
    const b = STELLAR_CLASS_BENCHMARKS.M;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Красный карлик класса M');
  }

  // 6. Проверка на Красный сверхгигант (Бетельгейзе, Антарес)
  if (
    text.includes('красный сверхгигант') ||
    text.includes('бетельгейзе') ||
    text.includes('антарес')
  ) {
    // Красный сверхгигант: огромная оптическая светимость при умеренном гамма-излучении
    const b = {
      ...STELLAR_CLASS_BENCHMARKS.M,
      titleRu: 'Красный Сверхгигант',
      photonPotential: 1.65,
      gammaPotential: 1.05,
      totalRadCoeff: 1.36,
      rechargeTime100TonSec: 44.1,
      starColorHex: '#fb923c',
    };
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Красный сверхгигант (Класс M)');
  }

  // 7. Проверка на Жёлто-белую звезду класса F (Полярная, Процион, Канопус)
  if (
    text.includes('жёлто-бел') ||
    text.includes('желто-бел') ||
    text.includes(' f0') ||
    text.includes(' f1') ||
    text.includes(' f2') ||
    text.includes(' f5') ||
    text.includes(' f7') ||
    text.includes(' f8') ||
    text.includes('полярная')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.F;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Жёлто-белая звезда класса F');
  }

  // 8. Проверка на Белую звезду класса A (Сириус, Вега, Мерак, Фекда)
  if (
    text.includes('белая звезда') ||
    text.includes('белый сверхгигант') ||
    text.includes(' a0') ||
    text.includes(' a1') ||
    text.includes(' a2') ||
    text.includes(' a3') ||
    text.includes(' a4') ||
    text.includes(' a5') ||
    text.includes('вега') ||
    text.includes('денеб') ||
    text.includes('сириус')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.A;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Белая звезда класса A');
  }

  // 9. Проверка на Оранжевый гигант / карлик класса K (Альдебаран, Арктур, Дубхе)
  if (
    text.includes('оранжевый гигант') ||
    text.includes('оранжевый карлик') ||
    text.includes(' k0') ||
    text.includes(' k1') ||
    text.includes(' k2') ||
    text.includes(' k3') ||
    text.includes(' k4') ||
    text.includes(' k5') ||
    text.includes('альдебаран') ||
    text.includes('арктур') ||
    text.includes('дубхе')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.K;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Оранжевый гигант класса K');
  }

  // 10. Проверка на Жёлтый карлик (Солнцеподобная, G0, G2, G5, Lave Прайм)
  if (
    text.includes('солнце') ||
    text.includes('солнцеподобн') ||
    text.includes('жёлтый карлик') ||
    text.includes('желтый карлик') ||
    text.includes('g0') ||
    text.includes('g2') ||
    text.includes('g5') ||
    text.includes('lave') ||
    text.includes('федоровка') ||
    text.includes('винница') ||
    text.includes('киев') ||
    text.includes('sys:0') ||
    text.includes('sys:1') ||
    text.includes('sys:2')
  ) {
    const b = STELLAR_CLASS_BENCHMARKS.G;
    return buildProfileFromBenchmark(b, starNoteOrNameOrKey, 'Жёлтый карлик класса G (Солнце)');
  }

  // По умолчанию — базовый жёлтый солнечный эталон G
  const defaultB = STELLAR_CLASS_BENCHMARKS.G;
  return buildProfileFromBenchmark(defaultB, starNoteOrNameOrKey, 'Звезда солнечного типа (G-класс)');
}

function buildProfileFromBenchmark(
  b: StellarClassBenchmark,
  rawInput: string,
  typeName: string
): StellarRadiationProfile {
  const isDwarf = b.totalRadCoeff < 0.95;
  const isGiant = b.totalRadCoeff > 1.05;
  const isSun = !isDwarf && !isGiant;

  const diffPct = Math.round((b.totalRadCoeff - 1.0) * 100);
  const ratioLabel =
    isSun
      ? '1.00× (Солнечный эталон)'
      : diffPct > 0
      ? `${b.totalRadCoeff.toFixed(2)}× (+${diffPct}% к Солнцу)`
      : `${b.totalRadCoeff.toFixed(2)}× (${diffPct}% к Солнцу)`;

  const badgeShort =
    isSun
      ? `⭐ ${b.code} · ${b.titleRu.toUpperCase()} [ЭТАЛОН 1.00×]`
      : isGiant
      ? `⭐ ${b.code} · ${b.titleRu.toUpperCase()} [x${b.totalRadCoeff.toFixed(2)} > СОЛНЦА]`
      : `⭐ ${b.code} · ${b.titleRu.toUpperCase()} [x${b.totalRadCoeff.toFixed(2)} < СОЛНЦА]`;

  return {
    rawIdentifier: rawInput,
    matchedName: typeName,
    benchmark: b,
    spectralClass: b.classId,
    spectralCode: b.code,
    stellarTypeRu: b.titleRu,
    surfaceTempLabel: b.surfaceTempRangeK,
    starColorHex: b.starColorHex,
    photonPotential: b.photonPotential,
    gammaPotential: b.gammaPotential,
    totalRadCoeff: b.totalRadCoeff,
    ratioToSunLabel: ratioLabel,
    rechargeTime100TonSec: b.rechargeTime100TonSec,
    badgeShort,
    isDwarf,
    isGiant,
    isSunEquivalent: isSun,
    systemOriginName: typeName,
  };
}

/**
 * Рассчитывает эффективную скорость зарядки аккумулятора квантового ветра (% в минуту)
 * с учётом дистанции до центральной звезды и спектрального класса звезды.
 *
 * @param currentStarDist Дистанция в игровых единицах
 * @param profile Спектральный профиль звезды (коэффициент фотонного и гаммаквантового потенциала)
 * @param systemEdgeRadius Радиус сферы системы (по умолчанию 100000)
 */
export function calculateEffectiveWindRechargeRatePctMin(
  currentStarDist: number,
  profile: StellarRadiationProfile,
  systemEdgeRadius = 100000
): {
  baseProximityPctMin: number;
  effectiveRechargePctMin: number;
  totalRadCoeff: number;
} {
  // Базовый линейный градиент близости к звезде: 100% у звезды (дист <= 100 ед), 0% на границе системы
  const baseProximityPctMin = Math.max(
    0,
    Math.min(100, 100 * (1 - currentStarDist / systemEdgeRadius))
  );

  // Умножаем на коэффициент фотонного и гаммаквантового потенциала звезды:
  // Для Солнца = 1.0, для карлика < 1.0 (зарядка медленнее), для голубого гиганта > 1.0 (зарядка быстрее!)
  const effectiveRechargePctMin = Math.max(
    0,
    Number((baseProximityPctMin * profile.totalRadCoeff).toFixed(2))
  );

  return {
    baseProximityPctMin,
    effectiveRechargePctMin,
    totalRadCoeff: profile.totalRadCoeff,
  };
}
