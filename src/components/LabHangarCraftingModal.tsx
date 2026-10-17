import React from 'react';
import {X, Shield, Zap, Package, Award, Rocket} from 'lucide-react';

export const LAB_MODULE_MASS_TONS = 5;
export const HANGAR_MODULE_MASS_TONS = 5;
export const LAB_MODULE_PRICE_CR = 250;
export const HANGAR_MODULE_PRICE_CR = 250;

export interface CraftableItemDefinition {
  id: string;
  name: string;
  categoryLabel: string;
  description: string;
  fullPriceCr: number; // 100% цены (купить готовое)
  effectBadge: string;
}

export const CRAFTABLE_SPACE_ITEMS: CraftableItemDefinition[] = [
  {
    id: 'MILITARY_LASER',
    name: 'Военный лазер Огневой Башни Mk II',
    categoryLabel: 'Вооружение корабля',
    description:
      'Усиленный импульсный лазер башни с пониженным нагревом и повышенным бронебойным уроном по кораблям и астероидам.',
    fullPriceCr: 500,
    effectBadge: 'Оружие №1: Урон 42 ед., нагрев -35%',
  },
  {
    id: 'CARGO_EXPANDER_35T',
    name: 'Большой грузовой отсек (35 т)',
    categoryLabel: 'Грузовая секция',
    description:
      'Расширяет вместимость трюма Cobra Mk III с 20 т до 35 т для перевозки ресурсов планет и редких элементов пояса астероидов.',
    fullPriceCr: 400,
    effectBadge: 'Вместимость трюма: 35 т',
  },
  {
    id: 'ARMOR_PLATE_10T',
    name: 'Титановая бронеплита корпуса (+10 т)',
    categoryLabel: 'Броня и защита',
    description:
      'Дополнительный броневой пояс из марсианского титана. Увеличивает массу корабля, боезапас и поглощение вражеского огня.',
    fullPriceCr: 300,
    effectBadge: '+10 т брони и +11 т ёмкости боезапаса',
  },
  {
    id: 'WEAPON_HEAVY_150KG',
    name: 'Тяжёлый лазерно-плазменный контур (150 кг)',
    categoryLabel: 'Комбинация оружия',
    description:
      'Модуль синхронного залпа (Лазер 100 кг + Плазменный импульс 50 кг), разрушающий 150 кг массы противника за одно нажатие.',
    fullPriceCr: 450,
    effectBadge: 'Сила залпа: 150 кг (0.15 т XP)',
  },
  {
    id: 'WEAPON_TWIN_200KG',
    name: 'Сдвоенный боевой залп (100 + 100 = 200 кг)',
    categoryLabel: 'Комбинация оружия',
    description:
      'Двухканальная система наведения Огневой Башни: одновременный удар лазером (100 кг) и плазмой (100 кг) = 200 кг за выстрел.',
    fullPriceCr: 800,
    effectBadge: 'Сила залпа: 200 кг (0.20 т XP)',
  },
  {
    id: 'AUTONOMOUS_LOGISTICS_DRONE',
    name: 'Автоматический логистический модуль-контейнер',
    categoryLabel: 'Космическая техника',
    description:
      'Орбитальный транспортный модуль для государственных поставок и коммерческих контрактов частного бизнеса на планетах системы.',
    fullPriceCr: 600,
    effectBadge: 'Высокий спрос у бизнеса (продажа 80% = 480 CR)',
  },
  {
    id: 'AUTONOMOUS_SENTINEL_SENTRY',
    name: 'Автономный Часовой «Сентинел-Ω» (Без двигателя)',
    categoryLabel: 'Орбитальная автономная техника',
    description:
      'Стационарная боевая платформа без маршевого двигателя (0 кН). Оснащена фотонно-гамма солнечным конвертором класса звёзд, ёмким аккумулятором (5 000 ГЭУ) и орудием с 4 режимами силы удара (35 кг, 125 кг, 380 кг, 1100 кг).',
    fullPriceCr: 1200,
    effectBadge: 'Солнечный конвертор + Аккумулятор + 4 режима силы удара',
  },
];

export interface CraftableItemState {
  developed: boolean;
  ownedCount: number;
}

interface LabHangarCraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  hasLaboratory: boolean;
  hasHangar: boolean;
  baseShipMassWithoutLabHangarTons: number;
  totalShipMassTons: number;
  itemsState: Record<string, CraftableItemState>;
  onBuyLaboratory: () => void;
  onSellLaboratory: (buyer: 'GOVERNMENT_50' | 'BUSINESS_80') => void;
  onBuyHangar: () => void;
  onSellHangar: (buyer: 'GOVERNMENT_50' | 'BUSINESS_80') => void;
  onBuyItemFullPrice: (itemId: string) => void;
  onDevelopItem10Pct: (itemId: string) => void;
  onBuildItem10Pct: (itemId: string) => void;
  onDevelopAndBuildCombo20Pct: (itemId: string) => void;
  onSellItem: (itemId: string, buyer: 'GOVERNMENT_50' | 'BUSINESS_80') => void;
}

export const LabHangarCraftingModal: React.FC<LabHangarCraftingModalProps> = ({
  isOpen,
  onClose,
  credits,
  hasLaboratory,
  hasHangar,
  baseShipMassWithoutLabHangarTons,
  totalShipMassTons,
  itemsState,
  onBuyLaboratory,
  onSellLaboratory,
  onBuyHangar,
  onSellHangar,
  onBuyItemFullPrice,
  onDevelopItem10Pct,
  onBuildItem10Pct,
  onDevelopAndBuildCombo20Pct,
  onSellItem,
}) => {
  if (!isOpen) return null;

  const labMass = hasLaboratory ? LAB_MODULE_MASS_TONS : 0;
  const hangarMass = hasHangar ? HANGAR_MODULE_MASS_TONS : 0;

  return (
    <div className="fixed inset-0 z-[178] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-mono select-none">
      <div className="w-full max-w-5xl bg-black border-2 border-cyan-400 shadow-[0_0_45px_rgba(34,211,238,0.35)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Заголовок */}
        <div className="px-4 py-3 bg-slate-950 border-b-2 border-cyan-400 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-yellow-300 uppercase tracking-wide">
                🔬🏗️ ЛАБОРАТОРИЯ (+5т) И АНГАР (+5т) · 2 СПОСОБА ПОЛУЧИТЬ И ПРОДАЖА 50% / 80%
              </h2>
              <p className="text-[11px] text-cyan-300">
                1) Купить за 100% цены · 2) Разработать за 10% (Лаборатория) + Построить за 10% (Ангар) · Продать: Правительству за 50% или Частному бизнесу за 80%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 border border-yellow-400 bg-yellow-950/30 text-yellow-300 text-xs font-extrabold">
              БАЛАНС: {credits} CR
            </div>
            <div className="px-2.5 py-1 border border-emerald-400 bg-emerald-950/30 text-emerald-300 text-xs font-extrabold">
              МАССА КОРАБЛЯ: {totalShipMassTons} т (Лаб/Ангар: +{labMass + hangarMass} т)
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border-2 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-black font-extrabold text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>ЗАКРЫТЬ</span>
            </button>
          </div>
        </div>

        {/* Основной контент */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Памятка экономики: 2 способа получить + продажа 50% / 80% */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="p-3 border border-cyan-400/70 bg-slate-950 space-y-1">
              <div className="font-extrabold text-cyan-300 text-xs">
                СПОСОБ 1: КУПИТЬ ГОТОВОЕ (100% ЦЕНЫ)
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                Любое оборудование, вооружение или модуль можно <b>купить сразу за 100% цены</b> без наличия лаборатории и ангара.
              </div>
            </div>

            <div className="p-3 border border-emerald-400/70 bg-slate-950 space-y-1">
              <div className="font-extrabold text-emerald-300 text-xs">
                СПОСОБ 2: РАЗРАБОТАТЬ (10%) + ПОСТРОИТЬ (10%)
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                • <b>Разработать за 10% цены</b> — нужна <b>Лаборатория (+5 т к массе корабля)</b>.<br />
                • <b>Построить за 10% цены</b> — нужен <b>Ангар (+5 т к массе корабля)</b>.<br />
                Итого создание обходится всего в <b>20% цены</b> (в 5 раз дешевле покупки)!
              </div>
            </div>

            <div className="p-3 border border-amber-400/70 bg-slate-950 space-y-1">
              <div className="font-extrabold text-amber-300 text-xs">
                ПРОДАЖА: ПРАВИТЕЛЬСТВУ (50%) ИЛИ БИЗНЕСУ (80%)
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                Полученный предмет можно продать:<br />
                • <b>Правительству планеты за 50% цены</b> (+30% чистой прибыли при постройке за 20%).<br />
                • <b>Частному бизнесу за 80% цены</b> (+60% чистой прибыли при постройке за 20%)!
              </div>
            </div>
          </div>

          {/* Блок покупки и управления Лабораторией (+5 т) и Ангаром (+5 т) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. ЛАБОРАТОРИЯ (5 т) */}
            <div
              className={`p-3.5 border-2 space-y-2 ${
                hasLaboratory
                  ? 'border-emerald-400 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>🔬 ЛАБОРАТОРИЯ ДЛЯ РАЗРАБОТКИ</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold border ${
                    hasLaboratory
                      ? 'border-emerald-400 bg-emerald-400 text-black'
                      : 'border-slate-600 bg-slate-900 text-slate-400'
                  }`}
                >
                  {hasLaboratory ? 'УСТАНОВЛЕНА (+5 т К МАССЕ)' : 'НЕ КУПЛЕНА (0 т)'}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed">
                Позволяет <b>разрабатывать чертежи и прототипы за 10% от полной цены</b>. Имеет собственную массу <b>{LAB_MODULE_MASS_TONS} т</b>, которая присоединяется к общей массе корабля ({baseShipMassWithoutLabHangarTons} т → {totalShipMassTons} т).
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                {!hasLaboratory ? (
                  <button
                    type="button"
                    onClick={onBuyLaboratory}
                    className="w-full py-2 px-3 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  >
                    🛒 КУПИТЬ ЛАБОРАТОРИЮ ЗА {LAB_MODULE_PRICE_CR} CR (+{LAB_MODULE_MASS_TONS} т К МАССЕ КОРАБЛЯ)
                  </button>
                ) : (
                  <div className="w-full grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSellLaboratory('GOVERNMENT_50')}
                      className="py-1.5 px-2 border border-amber-400/80 bg-amber-950/30 hover:bg-amber-400 hover:text-black text-amber-200 font-extrabold text-[10px]"
                    >
                      🏛 Продать Правительству (50% = +{Math.round(LAB_MODULE_PRICE_CR * 0.5)} CR · -5т)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSellLaboratory('BUSINESS_80')}
                      className="py-1.5 px-2 border border-fuchsia-400/80 bg-fuchsia-950/30 hover:bg-fuchsia-400 hover:text-black text-fuchsia-200 font-extrabold text-[10px]"
                    >
                      🏢 Продать Частному бизнесу (80% = +{Math.round(LAB_MODULE_PRICE_CR * 0.8)} CR · -5т)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. АНГАР (5 т) */}
            <div
              className={`p-3.5 border-2 space-y-2 ${
                hasHangar
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-700 bg-slate-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>🏗️ АНГАР ДЛЯ СТРОИТЕЛЬСТВА</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold border ${
                    hasHangar
                      ? 'border-cyan-400 bg-cyan-400 text-black'
                      : 'border-slate-600 bg-slate-900 text-slate-400'
                  }`}
                >
                  {hasHangar ? 'УСТАНОВЛЕН (+5 т К МАССЕ)' : 'НЕ КУПЛЕН (0 т)'}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed">
                Позволяет <b>строить разработанные в лаборатории предметы за 10% от полной цены</b>. Имеет собственную массу <b>{HANGAR_MODULE_MASS_TONS} т</b>, которая присоединяется к общей массе корабля ({baseShipMassWithoutLabHangarTons} т → {totalShipMassTons} т).
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                {!hasHangar ? (
                  <button
                    type="button"
                    onClick={onBuyHangar}
                    className="w-full py-2 px-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  >
                    🛒 КУПИТЬ АНГАР ЗА {HANGAR_MODULE_PRICE_CR} CR (+{HANGAR_MODULE_MASS_TONS} т К МАССЕ КОРАБЛЯ)
                  </button>
                ) : (
                  <div className="w-full grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSellHangar('GOVERNMENT_50')}
                      className="py-1.5 px-2 border border-amber-400/80 bg-amber-950/30 hover:bg-amber-400 hover:text-black text-amber-200 font-extrabold text-[10px]"
                    >
                      🏛 Продать Правительству (50% = +{Math.round(HANGAR_MODULE_PRICE_CR * 0.5)} CR · -5т)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSellHangar('BUSINESS_80')}
                      className="py-1.5 px-2 border border-fuchsia-400/80 bg-fuchsia-950/30 hover:bg-fuchsia-400 hover:text-black text-fuchsia-200 font-extrabold text-[10px]"
                    >
                      🏢 Продать Частному бизнесу (80% = +{Math.round(HANGAR_MODULE_PRICE_CR * 0.8)} CR · -5т)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Каталог оборудования, оружия и модулей: Купить (100%) vs Разработать (10%) + Построить (10%) -> Продать (50% Правительству / 80% Частному бизнесу) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-extrabold text-yellow-300 uppercase">
                ⚙️ КАТАЛОГ ПОЛУЧЕНИЯ И ПРОДАЖИ (КУПИТЬ 100% / РАЗРАБОТАТЬ 10% + ПОСТРОИТЬ 10% / ПРОДАТЬ 50% ИЛИ 80%):
              </span>
              <span className="text-[11px] text-slate-400">
                Лаборатория: {hasLaboratory ? '✓ ВКЛ (+5т)' : '✗ НЕТ'} · Ангар: {hasHangar ? '✓ ВКЛ (+5т)' : '✗ НЕТ'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {CRAFTABLE_SPACE_ITEMS.map((item) => {
                const st = itemsState[item.id] || {developed: false, ownedCount: 0};
                const buy100Cr = item.fullPriceCr;
                const dev10Cr = Math.round(item.fullPriceCr * 0.1);
                const build10Cr = Math.round(item.fullPriceCr * 0.1);
                const sellGov50Cr = Math.round(item.fullPriceCr * 0.5);
                const sellBiz80Cr = Math.round(item.fullPriceCr * 0.8);

                return (
                  <div
                    key={item.id}
                    className={`p-3 border flex flex-col justify-between gap-2 ${
                      st.ownedCount > 0
                        ? 'border-emerald-400 bg-emerald-950/15'
                        : st.developed
                        ? 'border-cyan-400/80 bg-cyan-950/10'
                        : 'border-slate-800 bg-slate-950/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-cyan-400 font-bold uppercase">
                            {item.categoryLabel}
                          </div>
                          <div className="text-xs font-extrabold text-white">{item.name}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {st.developed && (
                            <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-[9px] font-extrabold">
                              🔬 РАЗРАБОТАНО
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-extrabold border ${
                              st.ownedCount > 0
                                ? 'border-emerald-400 bg-emerald-400 text-black'
                                : 'border-slate-700 bg-black text-slate-400'
                            }`}
                          >
                            В НАЛИЧИИ: {st.ownedCount} шт.
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-300 leading-snug">{item.description}</div>
                      <div className="text-[10px] text-amber-300 font-bold">{item.effectBadge}</div>

                      {/* Сравнение цен */}
                      <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] text-center">
                        <div className="p-1 bg-black border border-slate-800">
                          <div className="text-slate-400 text-[9px]">Купить (100%)</div>
                          <div className="text-yellow-300 font-extrabold">{buy100Cr} CR</div>
                        </div>
                        <div className="p-1 bg-black border border-slate-800">
                          <div className="text-slate-400 text-[9px]">Разраб. (10%)</div>
                          <div className="text-emerald-300 font-extrabold">{dev10Cr} CR</div>
                        </div>
                        <div className="p-1 bg-black border border-slate-800">
                          <div className="text-slate-400 text-[9px]">Постр. (10%)</div>
                          <div className="text-cyan-300 font-extrabold">{build10Cr} CR</div>
                        </div>
                        <div className="p-1 bg-black border border-slate-800">
                          <div className="text-slate-400 text-[9px]">Продать 50/80%</div>
                          <div className="text-fuchsia-300 font-extrabold">
                            {sellGov50Cr}/{sellBiz80Cr}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Кнопки Способа 1 (Купить 100%) и Способа 2 (Разработать 10% + Построить 10%) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => onBuyItemFullPrice(item.id)}
                          className="py-1.5 px-2 border border-yellow-400 bg-yellow-400/15 hover:bg-yellow-400 hover:text-black text-yellow-300 font-extrabold text-[10px]"
                          title={`Способ 1: Купить готовое за 100% цены (${buy100Cr} CR)`}
                        >
                          1. Купить 100% (-{buy100Cr} CR)
                        </button>

                        <button
                          type="button"
                          onClick={() => onDevelopItem10Pct(item.id)}
                          className={`py-1.5 px-2 border font-extrabold text-[10px] ${
                            st.developed
                              ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                              : hasLaboratory
                              ? 'border-emerald-400 bg-emerald-500/20 hover:bg-emerald-400 hover:text-black text-emerald-200'
                              : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-emerald-400'
                          }`}
                          title={
                            !hasLaboratory
                              ? 'Требуется купить Лабораторию (+5 т к массе корабля) для разработки за 10% цены!'
                              : `Способ 2 (шаг 1): Разработать в Лаборатории за 10% цены (${dev10Cr} CR)`
                          }
                        >
                          {st.developed
                            ? `✓ Разработано (10%)`
                            : `2А. Разработать 10% (-${dev10Cr} CR)`}
                        </button>

                        <button
                          type="button"
                          onClick={() => onBuildItem10Pct(item.id)}
                          className={`py-1.5 px-2 border font-extrabold text-[10px] ${
                            hasHangar && st.developed
                              ? 'border-cyan-400 bg-cyan-500/25 hover:bg-cyan-400 hover:text-black text-cyan-200'
                              : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-400'
                          }`}
                          title={
                            !hasHangar
                              ? 'Требуется купить Ангар (+5 т к массе корабля) для строительства за 10% цены!'
                              : !st.developed
                              ? 'Сначала разработайте предмет в Лаборатории за 10% цены!'
                              : `Способ 2 (шаг 2): Построить в Ангаре за 10% цены (${build10Cr} CR)`
                          }
                        >
                          2Б. Построить 10% (-{build10Cr} CR)
                        </button>
                      </div>

                      {/* Быстрая кнопка полного цикла «Разработать (10%) + Построить (10%) = 20%» при наличии Лаборатории и Ангара */}
                      {!st.developed && (
                        <button
                          type="button"
                          onClick={() => onDevelopAndBuildCombo20Pct(item.id)}
                          className={`w-full py-1 px-2 border font-extrabold text-[10px] ${
                            hasLaboratory && hasHangar
                              ? 'border-emerald-400 bg-emerald-400/20 hover:bg-emerald-400 hover:text-black text-emerald-300'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400'
                          }`}
                        >
                          🔬+🏗️ Разработать (10% = {dev10Cr} CR) и сразу Построить (10% = {build10Cr} CR) → Итого -{dev10Cr + build10Cr} CR (20% цены)
                        </button>
                      )}

                      {/* Кнопки продажи: Правительству планеты за 50% цены ИЛИ Частному бизнесу за 80% цены */}
                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        <button
                          type="button"
                          disabled={st.ownedCount <= 0}
                          onClick={() => onSellItem(item.id, 'GOVERNMENT_50')}
                          className="py-1.5 px-2 border border-amber-400/80 bg-amber-500/20 hover:bg-amber-400 hover:text-black disabled:opacity-30 text-amber-200 font-extrabold text-[10px]"
                          title={`Продать Правительству планеты за 50% цены (+${sellGov50Cr} CR)`}
                        >
                          🏛 Продать Правительству 50% (+{sellGov50Cr} CR)
                        </button>
                        <button
                          type="button"
                          disabled={st.ownedCount <= 0}
                          onClick={() => onSellItem(item.id, 'BUSINESS_80')}
                          className="py-1.5 px-2 border border-fuchsia-400/80 bg-fuchsia-500/20 hover:bg-fuchsia-400 hover:text-black disabled:opacity-30 text-fuchsia-200 font-extrabold text-[10px]"
                          title={`Продать Частному бизнесу за 80% цены (+${sellBiz80Cr} CR)`}
                        >
                          🏢 Продать Частному бизнесу 80% (+{sellBiz80Cr} CR)
                        </button>
                      </div>
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
