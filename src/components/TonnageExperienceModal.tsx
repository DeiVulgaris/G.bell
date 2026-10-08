import React, {useState} from 'react';
import {
  Shield,
  Zap,
  Crosshair,
  Award,
  RefreshCw,
  Layers,
  Flame,
  Users,
  Scale,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export type WeaponCombinationMode =
  | 'SINGLE_100KG'
  | 'COMBO_50_PLUS_50'
  | 'DUAL_2X50KG'
  | 'SINGLE_50KG'
  | 'HEAVY_150KG'
  | 'TWIN_HEAVY_200KG';

export interface WeaponCombinationMeta {
  id: WeaponCombinationMode;
  title: string;
  shortBadge: string;
  laserKgPerShot: number;
  plasmaKgPerShot: number;
  shotsPerTrigger: number;
  totalDestroyedKgPerAction: number; // Суммарно разрушаемая масса врага за нажатие (кг)
  priceCr: number;
  description: string;
}

export const WEAPON_COMBINATION_PRESETS: Record<WeaponCombinationMode, WeaponCombinationMeta> = {
  SINGLE_100KG: {
    id: 'SINGLE_100KG',
    title: 'Стандарт: 100 кг за выстрел (Лазер 100 кг / Плазма 100 кг)',
    shortBadge: '100 кг (0.10 т)',
    laserKgPerShot: 100,
    plasmaKgPerShot: 100,
    shotsPerTrigger: 1,
    totalDestroyedKgPerAction: 100,
    priceCr: 0,
    description:
      'Эталонная стандартная комплектация корабля 50 т: 1 выстрел из лазера разрушает 100 кг (0.10 т) массы врага, 1 выстрел из плазмы разрушает 100 кг (0.10 т). Боезапас 50 т + 10% = 55 т (550 выстрелов).',
  },
  COMBO_50_PLUS_50: {
    id: 'COMBO_50_PLUS_50',
    title: 'Комбинация «50 + 50 кг» (Лазер 50 кг + Плазма 50 кг)',
    shortBadge: '50 + 50 кг (0.10 т)',
    laserKgPerShot: 50,
    plasmaKgPerShot: 50,
    shotsPerTrigger: 1,
    totalDestroyedKgPerAction: 100,
    priceCr: 150,
    description:
      'Комбинированный гибридный узел: одновременно бьёт импульсом лазера (50 кг) и сгустком плазмы (50 кг) = 100 кг (0.10 т) разрушенной массы врага за залп без перегрева стволов.',
  },
  DUAL_2X50KG: {
    id: 'DUAL_2X50KG',
    title: 'Два выстрела по 50 кг (Спарка 2 × 50 кг)',
    shortBadge: '2 × 50 кг (0.10 т)',
    laserKgPerShot: 50,
    plasmaKgPerShot: 50,
    shotsPerTrigger: 2,
    totalDestroyedKgPerAction: 100,
    priceCr: 180,
    description:
      'Сдвоенный скорострельный модуль: производит два быстрых выстрела по 50 кг подряд (2 × 50 кг = 100 кг / 0.10 т массы врага за нажатие).',
  },
  SINGLE_50KG: {
    id: 'SINGLE_50KG',
    title: 'Точечный калибр 50 кг (Экономичный режим · 1100 выстрелов)',
    shortBadge: '50 кг (0.05 т)',
    laserKgPerShot: 50,
    plasmaKgPerShot: 50,
    shotsPerTrigger: 1,
    totalDestroyedKgPerAction: 50,
    priceCr: 100,
    description:
      'Облегчённый калибр 50 кг (0.05 т) за выстрел: удваивает количество доступных выстрелов со стандартных 550 до 1100 выстрелов на стандартной ёмкости 55 т.',
  },
  HEAVY_150KG: {
    id: 'HEAVY_150KG',
    title: 'Усиленный калибр «100 + 50 кг» (150 кг за выстрел)',
    shortBadge: '150 кг (0.15 т)',
    laserKgPerShot: 100,
    plasmaKgPerShot: 50,
    shotsPerTrigger: 1,
    totalDestroyedKgPerAction: 150,
    priceCr: 320,
    description:
      'Докупка оружия с большей силой выстрела: основной ствол 100 кг + подствольный модуль 50 кг разрушают 150 кг (0.15 т) массы врага за один выстрел.',
  },
  TWIN_HEAVY_200KG: {
    id: 'TWIN_HEAVY_200KG',
    title: 'Тяжёлая батарея «100 + 100 кг» (200 кг за выстрел)',
    shortBadge: '100+100 кг (0.20 т)',
    laserKgPerShot: 100,
    plasmaKgPerShot: 100,
    shotsPerTrigger: 2,
    totalDestroyedKgPerAction: 200,
    priceCr: 520,
    description:
      'Сдвоенное тяжёлое вооружение максимальной силы выстрела: Лазер 100 кг + Плазма 100 кг разрушают сразу 200 кг (0.20 т) массы врага за один залп (50-тонный корабль врага разбирается за 250 залпов вместо 500)!',
  },
};

export function getPilotExperienceRankByTons(destroyedTons: number): {
  rank: string;
  nextRankTons: number;
  colorClass: string;
} {
  if (destroyedTons >= 500) {
    return {rank: '★ ELITE (500+ т) ★', nextRankTons: 1000, colorClass: 'text-yellow-300'};
  }
  if (destroyedTons >= 250) {
    return {rank: 'DEADLY (250+ т)', nextRankTons: 500, colorClass: 'text-fuchsia-300'};
  }
  if (destroyedTons >= 150) {
    return {rank: 'DANGEROUS (150+ т)', nextRankTons: 250, colorClass: 'text-rose-300'};
  }
  if (destroyedTons >= 50) {
    return {rank: 'COMPETENT (50+ т)', nextRankTons: 150, colorClass: 'text-emerald-300'};
  }
  if (destroyedTons >= 10) {
    return {rank: 'MOSTLY HARMLESS (10+ т)', nextRankTons: 50, colorClass: 'text-cyan-300'};
  }
  return {rank: 'HARMLESS (0+ т)', nextRankTons: 10, colorClass: 'text-slate-300'};
}

export interface CombatDebitCreditSettlement {
  debitSalvoSpentKg: number; // Сколько кг боезапаса потрачено в ДЕБЕТ этим действием
  creditedPlayerDestroyedKg: number; // Сколько кг ЗАСЧИТАНО в КРЕДИТ (XP) — >0 ТОЛЬКО при полном уничтожении врага!
  teamDestroyedKg: number; // Сколько кг выбила команда союзников (при уничтожении)
  enemyShipDestroyed: boolean; // Добит ли корабль врага до 0 кг
  logNote: string;
}

interface TonnageExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  isPirateStatus: boolean;
  pirateBuyMultiplier: boolean | number;
  // Показатель игрового опыта в тоннах уничтоженной массы врага (КРЕДИТ) и потраченного залпа (ДЕБЕТ)
  destroyedEnemyTonsXp: number;
  spentSalvoDebitKg: number;
  destroyedEnemyShipsCount: number;
  isTeamCombatMode: boolean;
  onToggleTeamCombatMode: (enabled: boolean) => void;
  // Параметры нашего корабля (стандартная масса 50 т + докупаемая броня как вес)
  baseStandardShipMassTons: number; // 50 т
  purchasedArmorWeightTons: number; // докупленная броня как вес (+0..+100 т)
  extraAmmoCapacityBonusPct: number; // стандартно +10% (50 т + 10% = 55 т), можно докупать больше
  remainingAmmoCapacityKg: number;
  maxAmmoCapacityKg: number;
  weaponComboMode: WeaponCombinationMode;
  unlockedWeaponCombos: WeaponCombinationMode[];
  // Колбэки
  onSelectOrBuyWeaponCombo: (mode: WeaponCombinationMode) => void;
  onBuyArmorWeightTons: (deltaTons: number, costCr: number) => void;
  onBuyExtraAmmoCapacityPct: (addPct: number, costCr: number) => void;
  onReloadFullAmmoCapacity: () => void;
  onSettleCombatDebitCredit: (settlement: CombatDebitCreditSettlement) => void;
}

export const TonnageExperienceModal: React.FC<TonnageExperienceModalProps> = ({
  isOpen,
  onClose,
  credits,
  isPirateStatus,
  pirateBuyMultiplier,
  destroyedEnemyTonsXp,
  spentSalvoDebitKg,
  destroyedEnemyShipsCount,
  isTeamCombatMode,
  onToggleTeamCombatMode,
  baseStandardShipMassTons,
  purchasedArmorWeightTons,
  extraAmmoCapacityBonusPct,
  remainingAmmoCapacityKg,
  maxAmmoCapacityKg,
  weaponComboMode,
  unlockedWeaponCombos,
  onSelectOrBuyWeaponCombo,
  onBuyArmorWeightTons,
  onBuyExtraAmmoCapacityPct,
  onReloadFullAmmoCapacity,
  onSettleCombatDebitCredit,
}) => {
  const numericPirateMult = typeof pirateBuyMultiplier === 'number' ? pirateBuyMultiplier : 1;

  // ============================================================================
  // БУХГАЛТЕРИЯ БОЯ «ПРОСТОЙ ДЕБЕТ / КРЕДИТ» И КОМАНДНЫЙ УЧЁТ ПОПАДАНИЙ:
  // 1) ДЕБЕТ (Потрачено залпа): сколько тонн боекомплекта ты израсходовал (например, 51 т залпа).
  // 2) ПОПАДАНИЯ ПО ЖИВОЙ ЦЕЛИ (В ОЖИДАНИИ):
  //    • duelPlayerHitKg — сколько кг/т массы врага выбил лично ТЫ своими выстрелами.
  //    • duelTeamHitKg — сколько кг/т массы врага выбили союзники по КОМАНДЕ.
  //    • Пока враг НЕ УНИЧТОЖЕН (остаток массы > 0 кг) — очки НЕ ЗАСЧИТЫВАЮТСЯ (КРЕДИТ за этот бой = 0 т XP)!
  // 3) КРЕДИТ (Засчитано в опыт XP после уничтожения врага):
  //    • В момент, когда масса врага падает до 0 кг (враг уничтожен), тебе в опыт (КРЕДИТ)
  //      засчитываются РОВНО уничтоженные ТОБОЙ тонны соответственно твоим выстрелам (duelPlayerHitKg / 1000)!
  //    • Пример Соло: потратил 51 т залпа (Дебет 51 т) → уничтожил противника 50 т → засчиталось +50 т XP!
  //    • Пример Команда: враг 50 т, твои попадания = 30 т (300 выстрелов по 100 кг), попадания команды = 20 т →
  //      после уничтожения врага тебе засчитывается ровно +30 т XP!
  // ============================================================================
  const [duelEnemyBaseMassTons] = useState<number>(50);
  const [duelEnemyExtraArmorTons, setDuelEnemyExtraArmorTons] = useState<number>(0);

  // Сколько кг массы текущей цели выбил лично игрок своими попаданиями
  const [duelPlayerHitKg, setDuelPlayerHitKg] = useState<number>(0);
  // Сколько кг массы текущей цели выбили союзники по команде
  const [duelTeamHitKg, setDuelTeamHitKg] = useState<number>(0);
  // Сколько кг залпа потрачено игроком в ДЕБЕТ по текущей цели (включая промахи/перерасход, напр. 51 т на 50 т врага)
  const [duelCurrentDebitSpentKg, setDuelCurrentDebitSpentKg] = useState<number>(0);
  // Сколько выстрелов (попаданий) сделал лично игрок по текущей цели
  const [duelPlayerShotsHitCount, setDuelPlayerShotsHitCount] = useState<number>(0);
  // Сколько выстрелов (попаданий) сделала команда по текущей цели
  const [duelTeamShotsHitCount, setDuelTeamShotsHitCount] = useState<number>(0);
  // Сколько тонн было засчитано игроку в КРЕДИТ (XP) в момент последнего уничтожения цели
  const [lastCreditedTonsOnKill, setLastCreditedTonsOnKill] = useState<number | null>(null);

  const [duelLastActionLog, setDuelLastActionLog] = useState<string>(
    'БУХГАЛТЕРИЯ БОЯ (ДЕБЕТ / КРЕДИТ): Потратил 51 т залпа (Дебет) и уничтожил противника (50 т) → тебе засчиталось +50 т XP (Кредит). Если НЕ уничтожил — очки НЕ засчитываются (0 т)! Если работает КОМАНДА — считаются конкретно твои попадания, и после уничтожения врага тебе засчитываются уничтоженные тобой тонны соответственно твоим выстрелам.'
  );

  if (!isOpen) return null;

  const activeCombo = WEAPON_COMBINATION_PRESETS[weaponComboMode];
  const myTotalShipMassTons = baseStandardShipMassTons + purchasedArmorWeightTons;
  const myTotalShipMassKg = myTotalShipMassTons * 1000;

  // Количество доступных выстрелов для текущей огневой ёмкости
  const kgPerAction = activeCombo.totalDestroyedKgPerAction;
  const availableActionsLeft = Math.floor(remainingAmmoCapacityKg / kgPerAction);
  const maxActionsTotal = Math.floor(maxAmmoCapacityKg / kgPerAction);
  const availableStandard100KgShots = Math.floor(remainingAmmoCapacityKg / 100);
  const maxStandard100KgShots = Math.floor(maxAmmoCapacityKg / 100);

  const duelEnemyMaxMassTons = duelEnemyBaseMassTons + duelEnemyExtraArmorTons;
  const duelEnemyMaxMassKg = duelEnemyMaxMassTons * 1000;
  const totalDamageDealtToEnemyKg = Math.min(duelEnemyMaxMassKg, duelPlayerHitKg + duelTeamHitKg);
  const duelEnemyCurrentMassKg = Math.max(0, duelEnemyMaxMassKg - totalDamageDealtToEnemyKg);
  const duelEnemyCurrentTons = Number((duelEnemyCurrentMassKg / 1000).toFixed(2));
  const isEnemyDestroyed = duelEnemyCurrentMassKg === 0;

  const playerHitPct = Math.round((duelPlayerHitKg / duelEnemyMaxMassKg) * 100);
  const teamHitPct = Math.round((duelTeamHitKg / duelEnemyMaxMassKg) * 100);
  const remainingHpPct = Math.max(0, 100 - playerHitPct - teamHitPct);

  const rankMeta = getPilotExperienceRankByTons(destroyedEnemyTonsXp);

  // Подать новую живую цель (или сбросить недобитую цель: если враг не был уничтожен, неподтверждённые попадания НЕ засчитываются!)
  const handleSpawnFreshTarget = (extraArmorTons: number = duelEnemyExtraArmorTons, reasonNote?: string) => {
    const hadUnfinishedHits = duelEnemyCurrentMassKg > 0 && duelPlayerHitKg > 0;
    const lostPendingTons = (duelPlayerHitKg / 1000).toFixed(2);
    const lostDebitTons = (duelCurrentDebitSpentKg / 1000).toFixed(2);

    setDuelEnemyExtraArmorTons(extraArmorTons);
    setDuelPlayerHitKg(0);
    setDuelTeamHitKg(0);
    setDuelCurrentDebitSpentKg(0);
    setDuelPlayerShotsHitCount(0);
    setDuelTeamShotsHitCount(0);
    setLastCreditedTonsOnKill(null);

    const nextMaxTons = duelEnemyBaseMassTons + extraArmorTons;
    if (reasonNote) {
      setDuelLastActionLog(reasonNote);
    } else if (hadUnfinishedHits) {
      setDuelLastActionLog(
        `⚠️ ПРОТИВНИК НЕ БЫЛ УНИЧТОЖЕН (ушёл из боя): потраченный ДЕБЕТ залпа (${lostDebitTons} т) и твои попадания (${lostPendingTons} т) НЕ ЗАСЧИТАНЫ в опыт (КРЕДИТ = +0.00 т XP)! Подана новая цель ${nextMaxTons} т.`
      );
    } else {
      setDuelLastActionLog(
        `🎯 Подана свежая цель полной массой ${nextMaxTons} т (${(nextMaxTons * 1000).toLocaleString(
          'ru-RU'
        )} кг). Пока цель не уничтожена до 0 т — очки в КРЕДИТ не засчитываются!`
      );
    }
  };

  // ============================================================================
  // 1. ВЫСТРЕЛЫ ИГРОКА (Списывают боезапас в ДЕБЕТ, накапливают ТВОИ ПОПАДАНИЯ;
  //    в КРЕДИТ XP засчитываются ТОЛЬКО в момент полного уничтожения врага!)
  // ============================================================================
  const handlePlayerFire = (
    mode:
      | 'LASER_100'
      | 'PLASMA_100'
      | 'ACTIVE_COMBO'
      | 'BURST_10'
      | 'BURST_100'
      | 'SOLO_51T_DEBIT_50T_CREDIT'
      | 'PARTIAL_35T_NO_KILL'
  ) => {
    // Если предыдущая цель уже уничтожена — автоматически подаём новую перед выстрелом
    let currentPlayerKg = duelPlayerHitKg;
    let currentTeamKg = duelTeamHitKg;
    let currentDebitKg = duelCurrentDebitSpentKg;
    let currentPlayerShots = duelPlayerShotsHitCount;
    let currentTeamShots = duelTeamShotsHitCount;

    if (duelEnemyCurrentMassKg <= 0) {
      currentPlayerKg = 0;
      currentTeamKg = 0;
      currentDebitKg = 0;
      currentPlayerShots = 0;
      currentTeamShots = 0;
      setLastCreditedTonsOnKill(null);
    }

    const currentRemainingEnemyKg = Math.max(
      0,
      duelEnemyMaxMassKg - (currentPlayerKg + currentTeamKg)
    );

    // СПЕЦИАЛЬНЫЙ ЭТАЛОННЫЙ СЦЕНАРИЙ ИЗ ЗАПРОСА:
    // «Простой дебет-кредит: потратил 51 т залпа, уничтожил противника (50 т) — тебе засчиталось 50 т!»
    if (mode === 'SOLO_51T_DEBIT_50T_CREDIT') {
      const targetMassKg = duelEnemyMaxMassKg; // 50 000 кг (50 т)
      const debitSalvoKg = targetMassKg + 1000; // 51 000 кг (51 т залпа потрачено в Дебет)
      // Если боекомплекта меньше 51 т — автоматически подзарядим для демонстрации эталона
      if (remainingAmmoCapacityKg < debitSalvoKg) {
        onReloadFullAmmoCapacity();
      }
      const shotsUsed = Math.round(targetMassKg / 100); // 500 попаданий по 100 кг
      const creditedTons = Number((targetMassKg / 1000).toFixed(2)); // 50.00 т
      const debitTons = Number((debitSalvoKg / 1000).toFixed(2)); // 51.00 т

      setDuelPlayerHitKg(targetMassKg);
      setDuelTeamHitKg(0);
      setDuelCurrentDebitSpentKg(debitSalvoKg);
      setDuelPlayerShotsHitCount(shotsUsed);
      setDuelTeamShotsHitCount(0);
      setLastCreditedTonsOnKill(creditedTons);

      const logMsg = `⚖️ ПРОСТОЙ ДЕБЕТ / КРЕДИТ: Потрачено ${debitTons.toFixed(
        2
      )} т залпа (ДЕБЕТ = -${debitTons.toFixed(
        2
      )} т из 55 т боезапаса) → Противник (${creditedTons.toFixed(
        2
      )} т) ПОЛНОСТЬЮ УНИЧТОЖЕН → Тебе в КРЕДИТ (игровой опыт XP) засчиталось ровно +${creditedTons.toFixed(
        2
      )} т (масса уничтоженного врага, а не 51 т залпа)!`;
      setDuelLastActionLog(logMsg);

      onSettleCombatDebitCredit({
        debitSalvoSpentKg: debitSalvoKg,
        creditedPlayerDestroyedKg: targetMassKg,
        teamDestroyedKg: 0,
        enemyShipDestroyed: true,
        logNote: logMsg,
      });
      return;
    }

    // СПЕЦИАЛЬНЫЙ СЦЕНАРИЙ №2:
    // «Если НЕ уничтожил противника — очки НЕ засчитываются (0 т XP)!»
    if (mode === 'PARTIAL_35T_NO_KILL') {
      const partialHitKg = Math.min(35000, Math.max(1000, duelEnemyMaxMassKg - 15000)); // выбили 35 т из 50 т, осталось 15 т (враг ЖИВ!)
      const debitSpentKg = partialHitKg;
      if (remainingAmmoCapacityKg < debitSpentKg) {
        onReloadFullAmmoCapacity();
      }
      const shotsUsed = Math.round(partialHitKg / 100);

      setDuelPlayerHitKg(partialHitKg);
      setDuelTeamHitKg(0);
      setDuelCurrentDebitSpentKg(debitSpentKg);
      setDuelPlayerShotsHitCount(shotsUsed);
      setDuelTeamShotsHitCount(0);
      setLastCreditedTonsOnKill(null);

      const leftTons = ((duelEnemyMaxMassKg - partialHitKg) / 1000).toFixed(2);
      const hitTons = (partialHitKg / 1000).toFixed(2);
      const logMsg = `⚠️ НЕ УНИЧТОЖИЛ — НЕ ЗАСЧИТЫВАЕТСЯ: Потрачено ${hitTons} т залпа (ДЕБЕТ = -${hitTons} т), выбито ${hitTons} т массы врага (${shotsUsed} выстр.), но у противника осталось ещё ${leftTons} т (ВРАГ ЖИВ)! В КРЕДИТ (опыт XP) засчитано 0.00 т! Нажмите «Добить цель» или «Команда добивает», чтобы засчитать тонны.`;
      setDuelLastActionLog(logMsg);

      onSettleCombatDebitCredit({
        debitSalvoSpentKg: debitSpentKg,
        creditedPlayerDestroyedKg: 0, // НЕ УНИЧТОЖИЛ -> 0 КГ В ЗАЧЁТ!
        teamDestroyedKg: 0,
        enemyShipDestroyed: false,
        logNote: logMsg,
      });
      return;
    }

    // Обычные выстрелы / очереди (Лазер 100 кг, Плазма 100 кг, Выбранное комбо, Очередь ×10, Очередь ×100)
    let playerShotKg = 100;
    let shotsCount = 1;
    let weaponLabel = 'Лазер (100 кг)';

    if (mode === 'LASER_100') {
      playerShotKg = 100;
      shotsCount = 1;
      weaponLabel = 'Выстрел Лазера (100 кг)';
    } else if (mode === 'PLASMA_100') {
      playerShotKg = 100;
      shotsCount = 1;
      weaponLabel = 'Выстрел Плазмы (100 кг)';
    } else if (mode === 'ACTIVE_COMBO') {
      playerShotKg = activeCombo.totalDestroyedKgPerAction;
      shotsCount = activeCombo.shotsPerTrigger;
      weaponLabel = `Залп «${activeCombo.shortBadge}»`;
    } else if (mode === 'BURST_10') {
      playerShotKg = activeCombo.totalDestroyedKgPerAction * 10;
      shotsCount = activeCombo.shotsPerTrigger * 10;
      weaponLabel = `Очередь ×10 (${activeCombo.shortBadge})`;
    } else if (mode === 'BURST_100') {
      playerShotKg = activeCombo.totalDestroyedKgPerAction * 100;
      shotsCount = activeCombo.shotsPerTrigger * 100;
      weaponLabel = `Мощный залп ×100 (${activeCombo.shortBadge})`;
    }

    if (remainingAmmoCapacityKg < playerShotKg) {
      setDuelLastActionLog(
        '⚠️ Боекомплект выстрелов исчерпан! Нажмите «Зарядить 100% (50 т + 10% = 55 т)» или докупите ёмкость оружия.'
      );
      return;
    }

    // Сколько реально попало в корпус врага от выстрела игрока (не больше остатка массы врага!)
    const actualPlayerHitKg = Math.min(currentRemainingEnemyKg, playerShotKg);
    const nextPlayerTotalKg = currentPlayerKg + actualPlayerHitKg;
    const nextDebitTotalKg = currentDebitKg + playerShotKg; // В ДЕБЕТ списывается весь потраченный залп (даже если был перерасход при добитии!)
    const nextPlayerShots = currentPlayerShots + shotsCount;

    // Если включён режим «РАБОТАЕТ КОМАНДА» и враг ещё не добит твоим выстрелом — союзники по звену параллельно делают свой залп!
    const remAfterPlayerKg = Math.max(
      0,
      duelEnemyMaxMassKg - (nextPlayerTotalKg + currentTeamKg)
    );
    let addedTeamHitKg = 0;
    let addedTeamShots = 0;
    if (isTeamCombatMode && remAfterPlayerKg > 0) {
      // Команда выбивает столько же (или добивает остаток), но её попадания считаются отдельно!
      addedTeamHitKg = Math.min(remAfterPlayerKg, playerShotKg);
      addedTeamShots = Math.max(1, Math.round(addedTeamHitKg / 100));
    }

    const nextTeamTotalKg = currentTeamKg + addedTeamHitKg;
    const nextTeamShots = currentTeamShots + addedTeamShots;
    const finalRemainingEnemyKg = Math.max(
      0,
      duelEnemyMaxMassKg - (nextPlayerTotalKg + nextTeamTotalKg)
    );
    const enemyKilledNow = finalRemainingEnemyKg === 0;

    setDuelPlayerHitKg(nextPlayerTotalKg);
    setDuelTeamHitKg(nextTeamTotalKg);
    setDuelCurrentDebitSpentKg(nextDebitTotalKg);
    setDuelPlayerShotsHitCount(nextPlayerShots);
    setDuelTeamShotsHitCount(nextTeamShots);

    if (enemyKilledNow) {
      // ВРАГ УНИЧТОЖЕН! Тебе в КРЕДИТ (опыт XP) засчитываются РОВНО уничтоженные ТОБОЙ тонны соответственно твоим выстрелам!
      const creditedPlayerTons = Number((nextPlayerTotalKg / 1000).toFixed(2));
      const teamTons = Number((nextTeamTotalKg / 1000).toFixed(2));
      const totalDebitTons = Number((nextDebitTotalKg / 1000).toFixed(2));
      setLastCreditedTonsOnKill(creditedPlayerTons);

      const logMsg =
        nextTeamTotalKg > 0
          ? `💥 ВРАГ (${duelEnemyMaxMassTons} т) УНИЧТОЖЕН КОМАНДОЙ! Твои попадания (${nextPlayerShots} выстр.) выбили ${creditedPlayerTons.toFixed(
              2
            )} т, союзники выбили ${teamTons.toFixed(
              2
            )} т. Потрачено залпа (ДЕБЕТ): ${totalDebitTons.toFixed(
              2
            )} т → Тебе в КРЕДИТ (опыт XP) засчитано ровно +${creditedPlayerTons.toFixed(
              2
            )} т (соответственно твоим выстрелам)!`
          : `💥 ПРОТИВНИК (${duelEnemyMaxMassTons} т) УНИЧТОЖЕН! Потрачено залпа (ДЕБЕТ): ${totalDebitTons.toFixed(
              2
            )} т → Тебе в КРЕДИТ (опыт XP) засчитано ровно +${creditedPlayerTons.toFixed(
              2
            )} т!`;

      setDuelLastActionLog(logMsg);
      onSettleCombatDebitCredit({
        debitSalvoSpentKg: playerShotKg,
        creditedPlayerDestroyedKg: nextPlayerTotalKg,
        teamDestroyedKg: nextTeamTotalKg,
        enemyShipDestroyed: true,
        logNote: logMsg,
      });
    } else {
      // ВРАГ ЕЩЁ ЖИВ — ОЧКИ НЕ ЗАСЧИТЫВАЮТСЯ (КРЕДИТ = 0)!
      const pendingPlayerTons = (nextPlayerTotalKg / 1000).toFixed(2);
      const pendingTeamTons = (nextTeamTotalKg / 1000).toFixed(2);
      const remTons = (finalRemainingEnemyKg / 1000).toFixed(2);
      const debitTons = (nextDebitTotalKg / 1000).toFixed(2);

      const logMsg =
        nextTeamTotalKg > 0
          ? `🤝 КОМАНДНЫЙ БОЙ (${weaponLabel}): твои попадания = ${pendingPlayerTons} т (${nextPlayerShots} выстр.), попадания команды = ${pendingTeamTons} т. Остаток врага: ${remTons} т. Пока враг НЕ уничтожен — в зачёте 0.00 т XP!`
          : `🎯 ${weaponLabel}: потрачено в ДЕБЕТ ${debitTons} т, твои попадания по цели = ${pendingPlayerTons} т (${nextPlayerShots} выстр.). Остаток врага: ${remTons} т. ВРАГ ЕЩЁ НЕ УНИЧТОЖЕН → в КРЕДИТ засчитано 0.00 т XP!`;

      setDuelLastActionLog(logMsg);
      onSettleCombatDebitCredit({
        debitSalvoSpentKg: playerShotKg,
        creditedPlayerDestroyedKg: 0, // Пока враг жив — 0 кг в зачёт!
        teamDestroyedKg: 0,
        enemyShipDestroyed: false,
        logNote: logMsg,
      });
    }
  };

  // ============================================================================
  // 2. ДЕЙСТВИЯ КОМАНДЫ (СОЮЗНИКОВ):
  //    • Команда может нанести удар (-10 т) или добить остаток врага, либо выполнить
  //      эталонный командный бой «Твои 30 т (300 выстр.) + Команда 20 т (200 выстр.) = Враг 50 т уничтожен → Тебе +30 т XP!»
  // ============================================================================
  const handleTeamAction = (
    teamMode: 'TEAM_HIT_10T' | 'TEAM_FINISH_ENEMY' | 'TEAM_DEMO_30T_PLAYER_20T_TEAM'
  ) => {
    if (teamMode === 'TEAM_DEMO_30T_PLAYER_20T_TEAM') {
      // Эталон командной работы на 50-тонном корабле врага:
      // Игрок выбивает 30 т (300 выстрелов по 100 кг, потратив допустим 31 т залпа в Дебет),
      // Команда выбивает оставшиеся 20 т (200 выстрелов).
      // Враг (50 т) уничтожен -> Игроку засчитывается ровно 30 т соответственно его выстрелам!
      const playerKg = Math.round(duelEnemyMaxMassKg * 0.6); // 30 000 кг (30 т для 50-тонного врага)
      const teamKg = duelEnemyMaxMassKg - playerKg; // 20 000 кг (20 т)
      const debitKg = playerKg + 1000; // 31 000 кг (31 т залпа потрачено игроком)
      if (remainingAmmoCapacityKg < debitKg) {
        onReloadFullAmmoCapacity();
      }
      const playerShots = Math.round(playerKg / 100); // 300 выстрелов игрока
      const teamShots = Math.round(teamKg / 100); // 200 выстрелов команды
      const creditedPlayerTons = Number((playerKg / 1000).toFixed(2));
      const teamTons = Number((teamKg / 1000).toFixed(2));
      const debitTons = Number((debitKg / 1000).toFixed(2));

      setDuelPlayerHitKg(playerKg);
      setDuelTeamHitKg(teamKg);
      setDuelCurrentDebitSpentKg(debitKg);
      setDuelPlayerShotsHitCount(playerShots);
      setDuelTeamShotsHitCount(teamShots);
      setLastCreditedTonsOnKill(creditedPlayerTons);
      onToggleTeamCombatMode(true);

      const logMsg = `🤝 КОМАНДНЫЙ ЗАЧЁТ: По врагу (${duelEnemyMaxMassTons} т) работала команда! Конкретно твои попадания = ${playerShots} выстрелов (${creditedPlayerTons.toFixed(
        2
      )} т, Дебет залпа ${debitTons.toFixed(
        2
      )} т), попадания союзников = ${teamShots} выстрелов (${teamTons.toFixed(
        2
      )} т). После уничтожения врага тебе в КРЕДИТ (опыт XP) засчитано ровно +${creditedPlayerTons.toFixed(
        2
      )} т (соответственно твоим выстрелам)!`;
      setDuelLastActionLog(logMsg);

      onSettleCombatDebitCredit({
        debitSalvoSpentKg: debitKg,
        creditedPlayerDestroyedKg: playerKg,
        teamDestroyedKg: teamKg,
        enemyShipDestroyed: true,
        logNote: logMsg,
      });
      return;
    }

    // Если цель уже уничтожена — подаём свежую
    let currentPlayerKg = duelPlayerHitKg;
    let currentTeamKg = duelTeamHitKg;
    let currentTeamShots = duelTeamShotsHitCount;
    if (duelEnemyCurrentMassKg <= 0) {
      currentPlayerKg = 0;
      currentTeamKg = 0;
      currentTeamShots = 0;
      setDuelPlayerHitKg(0);
      setDuelCurrentDebitSpentKg(0);
      setDuelPlayerShotsHitCount(0);
      setLastCreditedTonsOnKill(null);
    }

    const remKg = Math.max(0, duelEnemyMaxMassKg - (currentPlayerKg + currentTeamKg));
    const teamStrikeKg =
      teamMode === 'TEAM_FINISH_ENEMY' ? remKg : Math.min(remKg, 10000); // 10 000 кг = 10 т залп союзников
    const strikeShots = Math.max(1, Math.round(teamStrikeKg / 100));

    const nextTeamKg = currentTeamKg + teamStrikeKg;
    const nextTeamShots = currentTeamShots + strikeShots;
    const finalRemKg = Math.max(0, duelEnemyMaxMassKg - (currentPlayerKg + nextTeamKg));
    const enemyKilledNow = finalRemKg === 0;

    setDuelTeamHitKg(nextTeamKg);
    setDuelTeamShotsHitCount(nextTeamShots);

    if (enemyKilledNow) {
      const creditedPlayerTons = Number((currentPlayerKg / 1000).toFixed(2));
      const teamTons = Number((nextTeamKg / 1000).toFixed(2));
      setLastCreditedTonsOnKill(creditedPlayerTons);

      const logMsg =
        currentPlayerKg > 0
          ? `💥 СОЮЗНИКИ ДОБИЛИ ВРАГА (${duelEnemyMaxMassTons} т)! Поскольку враг уничтожен, тебе в КРЕДИТ (опыт XP) засчитаны уничтоженные ТОБОЙ тонны соответственно твоим выстрелам: +${creditedPlayerTons.toFixed(
              2
            )} т (доля союзников: ${teamTons.toFixed(2)} т)!`
          : `🤝 Союзники уничтожили врага (${duelEnemyMaxMassTons} т) без твоих попаданий (твоих выстрелов: 0) → тебе засчитано +0.00 т XP, команде ${teamTons.toFixed(
              2
            )} т.`;

      setDuelLastActionLog(logMsg);
      onSettleCombatDebitCredit({
        debitSalvoSpentKg: 0,
        creditedPlayerDestroyedKg: currentPlayerKg,
        teamDestroyedKg: nextTeamKg,
        enemyShipDestroyed: true,
        logNote: logMsg,
      });
    } else {
      const logMsg = `🤝 Залп команды союзников выбил ${(teamStrikeKg / 1000).toFixed(
        2
      )} т массы врага (всего команда: ${(nextTeamKg / 1000).toFixed(
        2
      )} т, твои попадания: ${(currentPlayerKg / 1000).toFixed(
        2
      )} т). Остаток врага: ${(finalRemKg / 1000).toFixed(
        2
      )} т — пока враг НЕ уничтожен, очки никому не засчитываются!`;
      setDuelLastActionLog(logMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-mono">
      <div className="w-full max-w-5xl border-2 border-amber-400 bg-slate-950 text-emerald-300 p-4 space-y-4 shadow-[0_0_40px_rgba(251,191,36,0.3)] max-h-[95vh] overflow-y-auto">
        {/* Шапка */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-amber-400/60 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-base sm:text-lg">
              <Scale className="w-5 h-5 text-yellow-300 shrink-0" />
              <span>
                ПРОСТОЙ ДЕБЕТ / КРЕДИТ ИГРОВЫХ ОЧКОВ (ТОННЫ XP) · КОМАНДНЫЙ БОЙ И КОНСТРУКТОР (50 Т + 10%)
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 leading-relaxed">
              Правило зачёта: <b className="text-rose-300">ДЕБЕТ</b> — потраченный тоннаж залпа (из ёмкости <b className="text-emerald-300">50 т + 10% = 55 т</b>).{' '}
              <b className="text-yellow-300">КРЕДИТ (Опыт XP)</b> — начисляется <b className="text-white underline">ТОЛЬКО ПОСЛЕ УНИЧТОЖЕНИЯ ПРОТИВНИКА</b>!{' '}
              Потратил <b className="text-rose-300">51 т залпа</b> и уничтожил врага (<b className="text-cyan-300">50 т</b>) → тебе засчиталось <b className="text-emerald-300">+50 т XP</b>.{' '}
              Если <b className="text-amber-300">не уничтожил — не засчитываются (0 т)</b>. Если работает <b className="text-cyan-300">КОМАНДА</b> — считаются конкретно твои попадания, и после уничтожения врага тебе засчитываются <b className="text-emerald-300">уничтоженные тобой тонны соответственно твоим выстрелам</b>!
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border-2 border-rose-500 text-rose-300 hover:bg-rose-500 hover:text-black font-extrabold text-xs shrink-0"
          >
            ЗАКРЫТЬ [ESC]
          </button>
        </div>

        {/* Верхняя сводка: ДЕБЕТ (Потрачено залпа) | СТАТУС ЦЕЛИ (В ОЖИДАНИИ ДОБИТИЯ) | КРЕДИТ (Засчитано Т XP) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Карточка 1: ДЕБЕТ — Потраченный залп и остаток боекомплекта (50 т + 10% = 55 т) */}
          <div className="p-3 border-2 border-rose-400 bg-rose-950/20 space-y-1.5">
            <div className="text-[11px] font-extrabold text-rose-300 flex items-center justify-between">
              <span>📉 ДЕБЕТ (ПОТРАЧЕНО ЗАЛПА):</span>
              <span className="px-1.5 py-0.5 bg-rose-500 text-black text-[10px] font-extrabold">
                ЕМКОСТЬ {myTotalShipMassTons}т + {extraAmmoCapacityBonusPct}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold text-white">
                {(duelCurrentDebitSpentKg / 1000).toFixed(2)}{' '}
                <span className="text-rose-300 text-sm">Т (ТЕКУЩИЙ БОЙ)</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Всего: <b className="text-rose-200">{(spentSalvoDebitKg / 1000).toFixed(2)} т</b>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>
                Остаток боезапаса:{' '}
                <b className="text-emerald-300">
                  {(remainingAmmoCapacityKg / 1000).toFixed(2)} / {(maxAmmoCapacityKg / 1000).toFixed(1)} т
                </b>{' '}
                ({availableStandard100KgShots}/{maxStandard100KgShots} выстр.)
              </span>
              <button
                type="button"
                onClick={onReloadFullAmmoCapacity}
                className="px-2 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[10px] flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>55 т (100%)</span>
              </button>
            </div>
            <div className="pt-1 border-t border-rose-500/30 text-[10px] text-rose-200">
              Перерасход залпа (напр. 51 т на 50-тонного врага) списывается в Дебет, но в Кредит идёт только масса убитого врага!
            </div>
          </div>

          {/* Карточка 2: ТЕКУЩИЕ ПОПАДАНИЯ ПО ЦЕЛИ (Лично твои vs Команда) — Засчитываются ТОЛЬКО при уничтожении! */}
          <div
            className={`p-3 border-2 space-y-1.5 ${
              isEnemyDestroyed
                ? 'border-emerald-400 bg-emerald-950/30'
                : 'border-amber-400 bg-amber-950/20'
            }`}
          >
            <div className="text-[11px] font-extrabold flex items-center justify-between">
              <span className={isEnemyDestroyed ? 'text-emerald-300' : 'text-amber-300'}>
                {isEnemyDestroyed ? '✅ ЦЕЛЬ УНИЧТОЖЕНА (ЗАСЧИТАНО):' : '⏳ ПОПАДАНИЯ ПО ЦЕЛИ (В ОЖИДАНИИ):'}
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-extrabold ${
                  isEnemyDestroyed ? 'bg-emerald-400 text-black' : 'bg-amber-400 text-black'
                }`}
              >
                {isEnemyDestroyed ? 'ПРОТИВНИК УНИЧТОЖЕН' : 'НЕ УНИЧТОЖЕН = 0 XP'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="p-1.5 bg-black/60 border border-emerald-500/50">
                <div className="text-[9px] text-slate-400">ТВОИ ПОПАДАНИЯ:</div>
                <div className="text-base font-extrabold text-emerald-300">
                  {(duelPlayerHitKg / 1000).toFixed(2)} т{' '}
                  <span className="text-[10px] text-slate-300">({duelPlayerShotsHitCount} выстр.)</span>
                </div>
              </div>
              <div className="p-1.5 bg-black/60 border border-cyan-500/50">
                <div className="text-[9px] text-slate-400">ПОПАДАНИЯ КОМАНДЫ:</div>
                <div className="text-base font-extrabold text-cyan-300">
                  {(duelTeamHitKg / 1000).toFixed(2)} т{' '}
                  <span className="text-[10px] text-slate-300">({duelTeamShotsHitCount} выстр.)</span>
                </div>
              </div>
            </div>
            <div className="pt-1 border-t border-amber-500/30 text-[10px] flex items-center justify-between">
              {isEnemyDestroyed ? (
                <span className="text-emerald-300 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Засчитано тебе в КРЕДИТ: +{(lastCreditedTonsOnKill ?? duelPlayerHitKg / 1000).toFixed(2)} т XP!</span>
                </span>
              ) : (
                <span className="text-amber-200 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Осталось добить {duelEnemyCurrentTons} т — иначе 0 т в зачёт!</span>
                </span>
              )}
            </div>
          </div>

          {/* Карточка 3: КРЕДИТ — Подтверждённый показатель игрового опыта (Тонны уничтоженной тобой массы врага) */}
          <div className="p-3 border-2 border-yellow-400 bg-yellow-950/20 space-y-1.5">
            <div className="text-[11px] font-extrabold text-yellow-300 flex items-center justify-between">
              <span>📈 КРЕДИТ · ИГРОВОЙ ОПЫТ (XP):</span>
              <span className="px-1.5 py-0.5 bg-yellow-400 text-black text-[10px] font-extrabold">
                ТОЛЬКО УБИТЫЕ ТОННЫ
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white tracking-wide">
              {destroyedEnemyTonsXp.toFixed(2)} <span className="text-yellow-300 text-base">ТОНН (XP)</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>
                Уничтожено тобой:{' '}
                <b className="text-emerald-300">
                  {Math.round(destroyedEnemyTonsXp * 1000).toLocaleString('ru-RU')} кг
                </b>
              </span>
              <span>
                Целей добито: <b className="text-cyan-300">{destroyedEnemyShipsCount}</b>
              </span>
            </div>
            <div className="pt-1 border-t border-yellow-500/30 flex items-center justify-between text-[11px]">
              <span className={`font-extrabold ${rankMeta.colorClass}`}>РАНГ: {rankMeta.rank}</span>
              <span className="text-slate-400 text-[10px]">След. ранг: {rankMeta.nextRankTons} т</span>
            </div>
          </div>
        </div>

        {/* БЛОК 1: ИНТЕРАКТИВНЫЙ СТЕНД «ПРОСТОЙ ДЕБЕТ / КРЕДИТ» И «РАБОТАЕТ КОМАНДА» */}
        <div className="p-3.5 border-2 border-rose-500/80 bg-slate-900/90 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-rose-500/40 pb-2">
            <div>
              <div className="text-sm font-extrabold text-rose-300 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-rose-400" />
                <span>
                  СТЕНД ДЕБЕТ / КРЕДИТ: НАШ КОРАБЛЬ ({myTotalShipMassTons} т) ПРОТИВ ПРОТИВНИКА ({duelEnemyMaxMassTons} т)
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Испытайте все 3 правила: <b>1)</b> Потратил 51 т залпа и уничтожил врага 50 т → засчиталось <b>+50 т</b>.{' '}
                <b>2)</b> Не уничтожил врага → засчиталось <b>0 т</b>. <b>3)</b> Работает команда → после уничтожения врага тебе засчитываются <b>ровно твои тонны по твоим выстрелам</b>!
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <button
                type="button"
                onClick={() => onToggleTeamCombatMode(!isTeamCombatMode)}
                className={`px-2.5 py-1 border-2 font-extrabold flex items-center gap-1 ${
                  isTeamCombatMode
                    ? 'border-cyan-300 bg-cyan-400 text-black'
                    : 'border-slate-600 bg-black text-cyan-300 hover:border-cyan-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isTeamCombatMode ? '🤝 РЕЖИМ КОМАНДЫ: ВКЛ' : '👤 РЕЖИМ: СОЛО (ВКЛЮЧИТЬ КОМАНДУ)'}</span>
              </button>

              {[
                {extra: 0, label: 'Враг 50 т'},
                {extra: 15, label: '65 т (+15 т брони)'},
                {extra: 30, label: '80 т (+30 т брони)'},
                {extra: 50, label: '100 т (+50 т брони)'},
              ].map((preset) => (
                <button
                  key={preset.extra}
                  type="button"
                  onClick={() => handleSpawnFreshTarget(preset.extra)}
                  className={`px-2 py-1 border font-extrabold ${
                    duelEnemyExtraArmorTons === preset.extra
                      ? 'border-rose-400 bg-rose-500 text-black'
                      : 'border-slate-700 bg-black text-slate-300 hover:border-rose-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 ГЛАВНЫЕ КНОПКИ-ДЕМОНСТРАЦИИ ТОЧНО ПО УСЛОВИЮ ЗАДАЧИ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePlayerFire('SOLO_51T_DEBIT_50T_CREDIT')}
              className="p-2.5 border-2 border-emerald-400 bg-emerald-950/40 hover:bg-emerald-400 hover:text-black text-left transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-300">
                <span>1️⃣ ДЕБЕТ 51 т → КРЕДИТ +50 т</span>
                <span className="px-1.5 py-0.5 bg-emerald-400 text-black text-[10px]">СОЛО УНИЧТОЖЕНИЕ</span>
              </div>
              <div className="text-[10px] text-slate-200 leading-snug">
                Потратить <b>51 т залпа</b> (Дебет), полностью уничтожить противника <b>{duelEnemyMaxMassTons} т</b> → в опыт засчитывается ровно <b>+{duelEnemyMaxMassTons} т XP</b>!
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePlayerFire('PARTIAL_35T_NO_KILL')}
              className="p-2.5 border-2 border-amber-400 bg-amber-950/40 hover:bg-amber-400 hover:text-black text-left transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-300">
                <span>2️⃣ НЕ УНИЧТОЖИЛ → 0 т В ЗАЧЁТ</span>
                <span className="px-1.5 py-0.5 bg-amber-400 text-black text-[10px]">БЕЗ ДОБИТИЯ = 0 XP</span>
              </div>
              <div className="text-[10px] text-slate-200 leading-snug">
                Потратить <b>35 т залпа</b> (враг ранен, осталось 15 т, <b>НЕ уничтожен</b>) → в опыт засчитано <b>0.00 т XP</b> до полного добития!
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTeamAction('TEAM_DEMO_30T_PLAYER_20T_TEAM')}
              className="p-2.5 border-2 border-cyan-400 bg-cyan-950/40 hover:bg-cyan-400 hover:text-black text-left transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-extrabold text-cyan-300">
                <span>3️⃣ КОМАНДА: ТВОИ 30 т + 20 т СОЮЗ</span>
                <span className="px-1.5 py-0.5 bg-cyan-400 text-black text-[10px]">ЗАЧЁТ +30 т ТЕБЕ</span>
              </div>
              <div className="text-[10px] text-slate-200 leading-snug">
                Твои попадания <b>30 т (300 выстр.)</b> + Команда <b>20 т (200 выстр.)</b> → враг 50 т уничтожен → тебе засчитано ровно <b>+30.00 т XP</b>!
              </div>
            </button>
          </div>

          {/* Шкала распределения массы корабля врага: Твои попадания (Зелёный) + Попадания команды (Голубой) + Остаток живой массы врага (Красный) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 p-3 border border-rose-500/50 bg-black/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-rose-300">КОРАБЛЬ ПРОТИВНИКА ({duelEnemyMaxMassTons} т)</span>
                <span className={isEnemyDestroyed ? 'text-emerald-300' : 'text-yellow-300'}>
                  {isEnemyDestroyed
                    ? '💥 ПОЛНОСТЬЮ УНИЧТОЖЕН (0.00 т)'
                    : `ЖИВ · ОСТАТОК: ${duelEnemyCurrentTons} / ${duelEnemyMaxMassTons} т`}
                </span>
              </div>

              {/* Трёхсегментная шкала: Выбито тобой | Выбито командой | Остаток врага */}
              <div className="w-full h-5 bg-slate-900 border border-slate-600 relative overflow-hidden flex">
                {playerHitPct > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-150"
                    style={{width: `${playerHitPct}%`}}
                    title={`Твои попадания: ${(duelPlayerHitKg / 1000).toFixed(2)} т`}
                  />
                )}
                {teamHitPct > 0 && (
                  <div
                    className="h-full bg-cyan-500 transition-all duration-150"
                    style={{width: `${teamHitPct}%`}}
                    title={`Попадания команды: ${(duelTeamHitKg / 1000).toFixed(2)} т`}
                  />
                )}
                {remainingHpPct > 0 && (
                  <div
                    className="h-full bg-rose-600/80 transition-all duration-150"
                    style={{width: `${remainingHpPct}%`}}
                    title={`Остаток массы врага: ${duelEnemyCurrentTons} т`}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white drop-shadow px-1 truncate">
                  ТВОИ: {(duelPlayerHitKg / 1000).toFixed(1)}т · КОМАНДА: {(duelTeamHitKg / 1000).toFixed(1)}т · ОСТАТОК ВРАГА: {duelEnemyCurrentTons}т
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-300 flex-wrap gap-1">
                <span className="text-emerald-300 font-bold">
                  ■ Твои выстрелы: {duelPlayerShotsHitCount} ({(duelPlayerHitKg / 1000).toFixed(2)} т)
                </span>
                <span className="text-cyan-300 font-bold">
                  ■ Команда: {duelTeamShotsHitCount} ({(duelTeamHitKg / 1000).toFixed(2)} т)
                </span>
                <button
                  type="button"
                  onClick={() => handleSpawnFreshTarget(duelEnemyExtraArmorTons)}
                  className="px-1.5 py-0.5 border border-slate-600 hover:border-amber-400 text-amber-300 font-bold"
                >
                  {isEnemyDestroyed ? '🔄 Подать новую цель' : '✖ Прервать бой (враг ушёл → 0 XP)'}
                </button>
              </div>
            </div>

            {/* Пошаговые кнопки твоих выстрелов и выстрелов команды */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePlayerFire('LASER_100')}
                className="p-2 border-2 border-cyan-400 bg-cyan-500/20 hover:bg-cyan-400 hover:text-black text-cyan-200 font-extrabold text-left space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span>⚡ Твой Лазер</span>
                  <span className="text-yellow-300">100 кг</span>
                </div>
                <div className="text-[10px] opacity-85">
                  Твоё попадание +0.10 т (в зачёт после добития)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePlayerFire('PLASMA_100')}
                className="p-2 border-2 border-fuchsia-400 bg-fuchsia-500/20 hover:bg-fuchsia-400 hover:text-black text-fuchsia-200 font-extrabold text-left space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span>🔥 Твоя Плазма</span>
                  <span className="text-yellow-300">100 кг</span>
                </div>
                <div className="text-[10px] opacity-85">
                  Твоё попадание +0.10 т (в зачёт после добития)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePlayerFire('ACTIVE_COMBO')}
                className="p-2 border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-400 hover:text-black text-emerald-200 font-extrabold text-left space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span>🎯 Твоё комбо</span>
                  <span className="text-yellow-300">{activeCombo.totalDestroyedKgPerAction} кг</span>
                </div>
                <div className="text-[10px] opacity-85">
                  {activeCombo.shortBadge} (+{(activeCombo.totalDestroyedKgPerAction / 1000).toFixed(2)} т в цель)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePlayerFire('BURST_100')}
                className="p-2 border-2 border-amber-400 bg-amber-500/20 hover:bg-amber-400 hover:text-black text-amber-200 font-extrabold text-left space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span>🚀 Твоя серия ×100</span>
                  <span className="text-yellow-300">
                    {(activeCombo.totalDestroyedKgPerAction * 100) / 1000} т
                  </span>
                </div>
                <div className="text-[10px] opacity-85">
                  100 твоих выстрелов по цели
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTeamAction('TEAM_HIT_10T')}
                className="p-2 border-2 border-sky-400 bg-sky-500/20 hover:bg-sky-400 hover:text-black text-sky-200 font-extrabold text-left space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span>🤝 Залп Команды</span>
                  <span className="text-yellow-300">-10.0 т</span>
                </div>
                <div className="text-[10px] opacity-85">
                  Союзники выбивают 10 т (не идёт в твой XP)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTeamAction('TEAM_FINISH_ENEMY')}
                className="p-2 border-2 border-rose-400 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-left space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span>💥 Команда добивает</span>
                  <span className="text-yellow-200">УНИЧТОЖИТЬ</span>
                </div>
                <div className="text-[10px] text-rose-100">
                  Добить цель и засчитать тебе твои {(duelPlayerHitKg / 1000).toFixed(1)} т XP!
                </div>
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border border-amber-400/50 bg-black text-amber-200 text-xs font-bold leading-relaxed">
            {duelLastActionLog}
          </div>
        </div>

        {/* БЛОК 2: ДОКУПКА БРОНИ КАК ВЕСА И РАСШИРЕНИЕ ЁМКОСТИ БОЕКОМПЛЕКТА + КОМБИНИРОВАНИЕ ОРУЖИЯ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Левая колонка: Докупка брони как веса (увеличивает тоннаж корабля сверх стандартных 50 т) и ёмкости оружия */}
          <div className="p-3.5 border-2 border-cyan-500/70 bg-slate-900/70 space-y-3">
            <div className="text-xs font-extrabold text-cyan-300 flex items-center justify-between border-b border-cyan-500/40 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>1. ДОКУПКА БРОНИ КАК ВЕСА (К СТАНДАРТУ 50 Т) И ЁМКОСТИ ВЫСТРЕЛОВ</span>
              </span>
              <span className="text-yellow-300">БАЛАНС: {credits} CR</span>
            </div>

            <div className="text-[11px] text-slate-300 leading-relaxed">
              В стандартной комплектации полная масса корабля равна <b className="text-white">50 т</b>, а ёмкость выстрелов —{' '}
              <b className="text-emerald-300">50 т + 10% = 55 т (550 выстрелов по 100 кг)</b>. Это позволяет потратить{' '}
              <b className="text-rose-300">51 т залпа (Дебет)</b>, гарантированно уничтожить 50-тонного противника и получить{' '}
              <b className="text-yellow-300">+50 т в игровой опыт (Кредит)</b>:
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                {addTons: 5, baseCost: 120, title: '+5 т Бронеплит (+5 000 кг)'},
                {addTons: 10, baseCost: 220, title: '+10 т Усиленной брони (+10 000 кг)'},
                {addTons: 25, baseCost: 480, title: '+25 т Крейсерский пояс (+25 000 кг)'},
                {addTons: 50, baseCost: 850, title: '+50 т Дредноут (+50 000 кг → 100 т)'},
              ].map((item) => {
                const cost = item.baseCost * numericPirateMult;
                return (
                  <button
                    key={item.addTons}
                    type="button"
                    disabled={credits < cost}
                    onClick={() => onBuyArmorWeightTons(item.addTons, cost)}
                    className="p-2 border border-cyan-400 bg-cyan-950/40 hover:bg-cyan-400 hover:text-black disabled:opacity-40 text-left transition-colors"
                  >
                    <div className="font-extrabold text-white">{item.title}</div>
                    <div className="text-[10px] text-emerald-300">
                      Масса станет: {myTotalShipMassTons + item.addTons} т · Цена: {cost} CR
                      {isPirateStatus ? ' (×10)' : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            {purchasedArmorWeightTons > 0 && (
              <button
                type="button"
                onClick={() => onBuyArmorWeightTons(-purchasedArmorWeightTons, 0)}
                className="w-full py-1.5 border border-slate-600 hover:border-amber-400 text-slate-300 text-[11px] font-bold"
              >
                Сбросить доп. броню до эталонной стандартной комплектации 50 т (+0 т брони)
              </button>
            )}

            {/* Докупка оружия с большей ёмкостью боекомплекта (сверх стандартных +10%) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>ДОКУПКА ОРУЖИЯ С БОЛЬШЕЙ ЁМКОСТЬЮ ВЫСТРЕЛОВ (БАЗА: 50 т + 10%)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    addPct: 20,
                    baseCost: 160,
                    title: 'Энерго-кассета +20% ёмкости',
                    note: '+100 выстрелов по 100 кг (+10 т боезапаса)',
                  },
                  {
                    addPct: 50,
                    baseCost: 350,
                    title: 'Реакторная ёмкость +50%',
                    note: '+250 выстрелов по 100 кг (+25 т боезапаса)',
                  },
                ].map((cap) => {
                  const cost = cap.baseCost * numericPirateMult;
                  return (
                    <button
                      key={cap.addPct}
                      type="button"
                      disabled={credits < cost}
                      onClick={() => onBuyExtraAmmoCapacityPct(cap.addPct, cost)}
                      className="p-2 border border-emerald-400 bg-emerald-950/30 hover:bg-emerald-400 hover:text-black disabled:opacity-40 text-left transition-colors"
                    >
                      <div className="font-extrabold text-white">{cap.title}</div>
                      <div className="text-[10px] text-emerald-300">
                        {cap.note} · {cost} CR{isPirateStatus ? ' (×10)' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Правая колонка: Комбинирование оружия (100 кг, 50 + 50 кг, два выстрела по 50 кг, 150 кг, 100 + 100 кг) */}
          <div className="p-3.5 border-2 border-fuchsia-500/70 bg-slate-900/70 space-y-2.5">
            <div className="text-xs font-extrabold text-fuchsia-300 flex items-center justify-between border-b border-fuchsia-500/40 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-fuchsia-400" />
                <span>2. КОМБИНИРОВАНИЕ ОРУЖИЯ (100 КГ · 50+50 КГ · 2×50 КГ · 150/200 КГ)</span>
              </span>
              <span className="text-emerald-300 text-[10px]">
                АКТИВНО: {activeCombo.shortBadge}
              </span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {(Object.keys(WEAPON_COMBINATION_PRESETS) as WeaponCombinationMode[]).map((modeKey) => {
                const preset = WEAPON_COMBINATION_PRESETS[modeKey];
                const isUnlocked = unlockedWeaponCombos.includes(modeKey);
                const isSelected = weaponComboMode === modeKey;
                const finalPrice = preset.priceCr * numericPirateMult;

                return (
                  <div
                    key={modeKey}
                    className={`p-2.5 border transition-colors ${
                      isSelected
                        ? 'border-yellow-400 bg-fuchsia-950/40'
                        : 'border-slate-700 bg-black/70 hover:border-fuchsia-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                        <span>{preset.title}</span>
                      </div>
                      <button
                        type="button"
                        disabled={!isUnlocked && credits < finalPrice}
                        onClick={() => onSelectOrBuyWeaponCombo(modeKey)}
                        className={`px-2.5 py-1 font-extrabold text-[10px] shrink-0 ${
                          isSelected
                            ? 'bg-yellow-400 text-black'
                            : isUnlocked
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-black'
                            : 'bg-fuchsia-400 hover:bg-fuchsia-300 disabled:opacity-40 text-black'
                        }`}
                      >
                        {isSelected
                          ? '✓ АКТИВЕН'
                          : isUnlocked
                          ? 'ВЫБРАТЬ РЕЖИМ'
                          : `ДОКУПИТЬ (${finalPrice} CR)`}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1 leading-snug">
                      {preset.description}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-cyan-300">
                      <span>Лазер: {preset.laserKgPerShot} кг</span>
                      <span>Плазма: {preset.plasmaKgPerShot} кг</span>
                      <span className="text-yellow-300">
                        Удар по цели: -{preset.totalDestroyedKgPerAction} кг (в зачёт после добития)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
