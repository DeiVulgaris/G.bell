import React, {useState, useMemo} from 'react';
import {X, Search, Rocket, Shield, Sparkles, Compass, Globe} from 'lucide-react';
import {
  ALL_STANDARD_CONSTELLATION_PLANETS,
  STANDARD_DICTATOR_200_PLANETS,
  STAR_SYSTEM_CATALOG_HEADERS,
  STANDARD_PLANET_CATEGORIES,
  PLANET_FACTIONS_META,
  PlanetFactionId,
  StandardDictatorPlanet,
  getStarSystemFullAssignment,
  CapturedPlanetClanRecord,
  ClanAffiliationKind,
  CLAN_AND_UNION_PRESETS,
  calculatePlanetAuctionValuationCr,
  formatCapturedPlanetFullTitle,
} from '../data/standardDictatorWorlds';

interface StandardConstellationWorldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSystemKey: string;
  onJumpToSystemKey: (
    systemKey: string,
    starTitle: string,
    focusTarget?: 'PLANET_1' | 'PLANET_2' | 'PLANET_3' | 'PLANET_4' | 'DEATH_STAR' | 'TORUS_SHIP' | 'STARGATE'
  ) => void;
  capturedPlanetsMap?: Record<number, CapturedPlanetClanRecord>;
  onCaptureAndRenamePlanetByIndex?: (payload: {
    planetIndex: number;
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
  onSellPlanetOnAuction?: (planetIndex: number, sellEntireSystem?: boolean) => void;
  onOpenPlanetCardByOrbit?: (orbitOrder: 1 | 2 | 3 | 4) => void;
}

export const StandardConstellationWorldsModal: React.FC<
  StandardConstellationWorldsModalProps
> = ({
  isOpen,
  onClose,
  activeSystemKey,
  onJumpToSystemKey,
  capturedPlanetsMap = {},
  onCaptureAndRenamePlanetByIndex,
  onCollectPlanetClanIncomeNow,
  onSellPlanetOnAuction,
  onOpenPlanetCardByOrbit,
}) => {
  const [activeTab, setActiveTab] = useState<
    'PLANETS' | 'CLAN_AND_AUCTION' | 'DEATH_STARS' | 'SPACE_STATIONS' | 'BY_CONSTELLATION'
  >('PLANETS');
  const [factionFilter, setFactionFilter] = useState<'ALL' | PlanetFactionId>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<number>(0); // 0 = все 7 категорий
  const [onlyCore200, setOnlyCore200] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConstellationId, setSelectedConstellationId] = useState<string>('ALL');

  // Быстрый редактор захвата/переименования/аукциона выбранной планеты в каталоге
  const [editingPlanetIndex, setEditingPlanetIndex] = useState<number | null>(null);
  const [modalCustomName, setModalCustomName] = useState<string>('Метадонг');
  const [modalFormerName, setModalFormerName] = useState<string>('Шлак-9');
  const [modalClanKind, setModalClanKind] = useState<ClanAffiliationKind>('CLAN');
  const [modalClanTitle, setModalClanTitle] = useState<string>('клан Розовой бабочки');
  const [modalClanIcon, setModalClanIcon] = useState<string>('🦋');
  const [modalClanColor, setModalClanColor] = useState<string>('#f472b6');
  const [catalogBanner, setCatalogBanner] = useState<string | null>(null);

  const capturedList = useMemo(
    () =>
      (Object.values(capturedPlanetsMap) as CapturedPlanetClanRecord[]).filter(
        (r) => r.isCaptured
      ),
    [capturedPlanetsMap]
  );
  const soldOnAuctionList = useMemo(
    () =>
      (Object.values(capturedPlanetsMap) as CapturedPlanetClanRecord[]).filter(
        (r) => Boolean(r.soldOnAuctionAtMs)
      ),
    [capturedPlanetsMap]
  );
  const totalPassiveIncomePerCycle = useMemo(
    () => capturedList.reduce((acc, r) => acc + (r.incomePerCycleCr || 0), 0),
    [capturedList]
  );

  const allSystems = useMemo(
    () => STAR_SYSTEM_CATALOG_HEADERS.map((h) => getStarSystemFullAssignment(h.systemKey)),
    []
  );

  const constellationOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of STAR_SYSTEM_CATALOG_HEADERS) {
      if (!map.has(h.constellationId)) {
        map.set(h.constellationId, h.constellationNameRu);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({id, title}));
  }, []);

  const filteredPlanets = useMemo(() => {
    const source = onlyCore200
      ? STANDARD_DICTATOR_200_PLANETS
      : ALL_STANDARD_CONSTELLATION_PLANETS;
    const q = searchQuery.trim().toLowerCase();
    return source.filter((p) => {
      if (factionFilter !== 'ALL' && p.factionId !== factionFilter) return false;
      if (categoryFilter !== 0 && p.categoryId !== categoryFilter) return false;
      if (selectedConstellationId !== 'ALL') {
        const sysHdr = STAR_SYSTEM_CATALOG_HEADERS[p.starSlotIndex];
        if (sysHdr && sysHdr.constellationId !== selectedConstellationId) return false;
      }
      if (!q) return true;
      return (
        p.officialName.toLowerCase().includes(q) ||
        p.folkName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.dictatorCode.toLowerCase().includes(q) ||
        p.starSystemTitle.toLowerCase().includes(q) ||
        p.constellationTitle.toLowerCase().includes(q) ||
        p.loreDescription.toLowerCase().includes(q)
      );
    });
  }, [onlyCore200, factionFilter, categoryFilter, selectedConstellationId, searchQuery]);

  const filteredSystems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSystems.filter((sys) => {
      if (factionFilter !== 'ALL' && sys.dominantFactionId !== factionFilter) return false;
      if (selectedConstellationId !== 'ALL' && sys.constellationId !== selectedConstellationId) {
        return false;
      }
      if (!q) return true;
      return (
        sys.starName.toLowerCase().includes(q) ||
        sys.constellationNameRu.toLowerCase().includes(q) ||
        sys.deathStar.officialName.toLowerCase().includes(q) ||
        sys.deathStar.folkName.toLowerCase().includes(q) ||
        sys.spaceStation.officialName.toLowerCase().includes(q) ||
        sys.spaceStation.folkName.toLowerCase().includes(q) ||
        sys.planets.some(
          (pl) =>
            pl.officialName.toLowerCase().includes(q) ||
            pl.folkName.toLowerCase().includes(q)
        )
      );
    });
  }, [allSystems, factionFilter, selectedConstellationId, searchQuery]);

  if (!isOpen) return null;

  const currentAssignment = getStarSystemFullAssignment(activeSystemKey);

  const handleJumpAndFocusPlanet = (planet: StandardDictatorPlanet) => {
    const sysHdr =
      STAR_SYSTEM_CATALOG_HEADERS[planet.starSlotIndex] || STAR_SYSTEM_CATALOG_HEADERS[0];
    const focusMode =
      planet.orbitOrder === 1
        ? 'PLANET_1'
        : planet.orbitOrder === 2
        ? 'PLANET_2'
        : planet.orbitOrder === 3
        ? 'PLANET_3'
        : 'PLANET_4';
    onJumpToSystemKey(
      sysHdr.systemKey,
      `${sysHdr.starName} · ${sysHdr.constellationNameRu}`,
      focusMode
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm font-mono">
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border-2 border-amber-400/80 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(251,191,36,0.28)]">
        {/* Шапка */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Globe className="h-4 w-4 text-amber-400" />
              <span>
                СТАНДАРТНАЯ СИСТЕМА ИГРЫ (ПОД ВЛАСТЬЮ ДИКТАТОРА) · ПРЕФИКСЫ, СУФФИКСЫ И ДВОЙНЫЕ ИМЕНА
              </span>
            </div>
            <h2 className="mt-0.5 text-sm sm:text-base font-extrabold text-white">
              Каталог Планет в Созвездиях ({ALL_STANDARD_CONSTELLATION_PLANETS.length} миров / 200 канон.),{' '}
              {allSystems.length} Звёзд Смерти и {allSystems.length} Космических Станций
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg border border-rose-500/60 bg-rose-950/60 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-900/80"
          >
            <X className="h-4 w-4" />
            <span>ЗАКРЫТЬ [ESC]</span>
          </button>
        </div>

        {/* Памятка о системе префиксов, суффиксов и двойных имён */}
        <div className="grid grid-cols-1 gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 md:grid-cols-4 text-[11px]">
          <div className="rounded border border-amber-500/40 bg-amber-950/25 p-2">
            <div className="font-bold text-amber-300">🏛 1. Для Корпораций / Империи</div>
            <div className="text-slate-300 mt-0.5">
              Строгие каталожные номера и префиксы: <span className="text-amber-200 font-semibold">«Колония Вейланд-44»</span>,{' '}
              <span className="text-amber-200 font-semibold">«Сектор Омега-7»</span>,{' '}
              <span className="text-amber-200 font-semibold">«Рудник Корпорации "Тардис"»</span>.
            </div>
          </div>
          <div className="rounded border border-rose-500/40 bg-rose-950/25 p-2">
            <div className="font-bold text-rose-300">🏴‍☠️ 2. Для Пиратов / Свободных</div>
            <div className="text-slate-300 mt-0.5">
              Сленг, прозвища и криминальный фронтир:{' '}
              <span className="text-rose-200 font-semibold">«Дырявый Карман»</span>,{' '}
              <span className="text-rose-200 font-semibold">«Гнилой Зуб»</span>,{' '}
              <span className="text-rose-200 font-semibold">«Последний Приют»</span>.
            </div>
          </div>
          <div className="rounded border border-sky-500/40 bg-sky-950/25 p-2">
            <div className="font-bold text-sky-300">🔬 3. Для Учёных / Конклава</div>
            <div className="text-slate-300 mt-0.5">
              Латинские буквы и термины:{' '}
              <span className="text-sky-200 font-semibold">«Эпсилон-Эридана-c»</span>,{' '}
              <span className="text-sky-200 font-semibold">«Кеплер-186ф»</span>,{' '}
              <span className="text-sky-200 font-semibold">«Объект Стромгрена»</span>.
            </div>
          </div>
          <div className="rounded border border-emerald-500/40 bg-emerald-950/25 p-2">
            <div className="font-bold text-emerald-300">🏷️ 4. Двойные имена миров и станций</div>
            <div className="text-slate-300 mt-0.5">
              У каждой планеты, Звезды Смерти и станции 2 имени! Пример: Официально:{' '}
              <span className="text-white font-semibold">«Новая Земля-2»</span>, в народе:{' '}
              <span className="text-emerald-200 font-semibold">«Ржавчина»</span>.
            </div>
          </div>
        </div>

        {/* Текущая активная система игрока + сводка захваченных планет клана и аукциона */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/30 bg-cyan-950/25 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-bold text-cyan-300 border border-cyan-400/40">
              ТЕКУЩАЯ ЗВЕЗДА: {currentAssignment.starName} ({currentAssignment.constellationNameRu})
            </span>
            <span className="rounded bg-pink-500/20 px-2 py-0.5 font-bold text-pink-200 border border-pink-400/50">
              🦋 Захвачено планет: {capturedList.length} · Доход: +{totalPassiveIncomePerCycle} CR/цикл
            </span>
            {soldOnAuctionList.length > 0 && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-200 border border-amber-400/50">
                🏛 Продано на аукционе: {soldOnAuctionList.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {([1, 2, 3, 4] as const).map((ord) => {
              const p = currentAssignment.planets[ord - 1];
              const cap = capturedPlanetsMap[p.index];
              return (
                <button
                  key={ord}
                  type="button"
                  onClick={() => {
                    onOpenPlanetCardByOrbit?.(ord);
                    onClose();
                  }}
                  className="rounded border border-pink-400/60 bg-pink-950/50 hover:bg-pink-500 hover:text-slate-950 px-2 py-0.5 text-[10px] font-bold text-pink-200 transition"
                  title="Открыть 3D-карточку этой планеты для захвата, переименования или продажи на аукционе"
                >
                  🃏 Карточка {p.orbitRoman}: {cap?.isCaptured ? cap.customName : p.folkName}
                </button>
              );
            })}
          </div>
        </div>

        {catalogBanner && (
          <div className="bg-emerald-950/90 border-b border-emerald-400/60 px-4 py-1.5 text-xs font-bold text-emerald-200 flex items-center justify-between">
            <span>✓ {catalogBanner}</span>
            <button
              type="button"
              onClick={() => setCatalogBanner(null)}
              className="text-[10px] underline text-emerald-300"
            >
              Скрыть
            </button>
          </div>
        )}

        {/* Переключатель вкладок и фильтры */}
        <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab('PLANETS')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'PLANETS'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🪐 ПЛАНЕТЫ В СОЗВЕЗДИЯХ ({filteredPlanets.length})
              </button>
              <button
                onClick={() => setActiveTab('CLAN_AND_AUCTION')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'CLAN_AND_AUCTION'
                    ? 'bg-pink-500 text-slate-950 shadow'
                    : 'bg-pink-950/60 border border-pink-400/50 text-pink-200 hover:bg-pink-900/70'
                }`}
              >
                🦋 ЗАХВАТ · КЛАНЫ · ДОХОД · АУКЦИОН ({capturedList.length})
              </button>
              <button
                onClick={() => setActiveTab('DEATH_STARS')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'DEATH_STARS'
                    ? 'bg-rose-500 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                💀 ВСЕ ЗВЁЗДЫ СМЕРТИ ({filteredSystems.length})
              </button>
              <button
                onClick={() => setActiveTab('SPACE_STATIONS')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'SPACE_STATIONS'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🍩 ВСЕ КОСМИЧЕСКИЕ СТАНЦИИ И ВРАТА ({filteredSystems.length})
              </button>
              <button
                onClick={() => setActiveTab('BY_CONSTELLATION')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'BY_CONSTELLATION'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ✨ ПО ЗВЁЗДАМ 10 СОЗВЕЗДИЙ ({filteredSystems.length} систем)
              </button>
            </div>

            {/* Поиск */}
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск: Вейланд-44, Ржавчина, Кеплер, Орион..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Вторая строка фильтров: Фракция, Созвездие, Категория */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-slate-400 font-bold">Фракция:</span>
            <button
              onClick={() => setFactionFilter('ALL')}
              className={`rounded px-2 py-0.5 font-bold ${
                factionFilter === 'ALL'
                  ? 'bg-white text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ВСЕ ФРАКЦИИ
            </button>
            {(['CORP_EMPIRE', 'PIRATE_FREE', 'SCIENTIFIC'] as PlanetFactionId[]).map((fid) => {
              const fm = PLANET_FACTIONS_META[fid];
              return (
                <button
                  key={fid}
                  onClick={() => setFactionFilter(fid)}
                  className={`rounded px-2 py-0.5 font-bold border ${
                    factionFilter === fid
                      ? 'bg-amber-400/20 border-amber-300 text-white'
                      : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {fm.shortBadge}
                </button>
              );
            })}

            <span className="ml-2 text-slate-400 font-bold">Созвездие:</span>
            <select
              value={selectedConstellationId}
              onChange={(e) => setSelectedConstellationId(e.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-amber-200"
            >
              <option value="ALL">Все 10 созвездий + Базовые сектора (71 система)</option>
              {constellationOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {activeTab === 'PLANETS' && (
              <>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(Number(e.target.value))}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-cyan-200"
                >
                  <option value={0}>Все 7 тематических категорий</option>
                  {STANDARD_PLANET_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
                <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11px] text-amber-300">
                  <input
                    type="checkbox"
                    checked={onlyCore200}
                    onChange={(e) => setOnlyCore200(e.target.checked)}
                    className="rounded border-amber-400"
                  />
                  <span>Только первые 200 планет (#1..#200)</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Основной скроллируемый контент */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'PLANETS' && (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredPlanets.map((pl) => {
                const fMeta = PLANET_FACTIONS_META[pl.factionId];
                const capRec = capturedPlanetsMap[pl.index];
                const isEditingThis = editingPlanetIndex === pl.index;
                const val = calculatePlanetAuctionValuationCr(
                  capRec || {
                    planetIndex: pl.index,
                    starSlotIndex: pl.starSlotIndex,
                    orbitOrder: pl.orbitOrder,
                    isCaptured: false,
                    capturedAtMs: Date.now(),
                    customName: 'Метадонг',
                    formerName: pl.folkName,
                    formerOfficialName: pl.officialName,
                    affiliationKind: 'CLAN',
                    clanOrUnionName: 'клан Розовой бабочки',
                    clanIcon: '🦋',
                    clanColor: '#f472b6',
                    incomePerCycleCr: 35,
                    infrastructureLevel: 1,
                    totalEarnedCr: 0,
                    auctionBiddingRound: 0,
                  }
                );

                return (
                  <div
                    key={pl.index}
                    className={`flex flex-col justify-between rounded-lg border p-3 transition ${
                      capRec?.isCaptured
                        ? 'border-pink-400/80 bg-pink-950/20'
                        : capRec?.soldOnAuctionAtMs
                        ? 'border-amber-400/80 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/60'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-bold text-amber-300 border border-amber-500/40">
                          #{pl.index} · {pl.dictatorCode} · Орбита {pl.orbitRoman}
                        </span>
                        <div className="flex items-center gap-1">
                          {capRec?.isCaptured && (
                            <span className="rounded bg-pink-500/30 border border-pink-400 px-1.5 py-0.5 font-extrabold text-pink-200">
                              {capRec.clanIcon} ЗАХВАЧЕНА · +{capRec.incomePerCycleCr} CR/цикл
                            </span>
                          )}
                          {capRec?.soldOnAuctionAtMs && !capRec.isCaptured && (
                            <span className="rounded bg-amber-500/30 border border-amber-400 px-1.5 py-0.5 font-extrabold text-amber-200">
                              🏛 ПРОДАНА ЗА +{capRec.lastSoldPriceCr} CR
                            </span>
                          )}
                          <span
                            className="rounded px-1.5 py-0.5 font-bold border"
                            style={{
                              color: fMeta.color,
                              borderColor: `${fMeta.color}66`,
                              backgroundColor: `${fMeta.color}18`,
                            }}
                          >
                            {pl.factionBadge}
                          </span>
                        </div>
                      </div>

                      {/* Если планета захвачена — показываем её новое клановое имя (например: Метадонг - бывший Шлак-9 · клан Розовой бабочки) */}
                      {capRec?.isCaptured && (
                        <div className="mt-1.5 rounded-lg border border-pink-400/60 bg-slate-950/90 p-2">
                          <div className="text-xs font-extrabold text-pink-200">
                            {capRec.clanIcon} {formatCapturedPlanetFullTitle(capRec)}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between text-[10px] text-emerald-300">
                            <span>Доход: +{capRec.incomePerCycleCr} CR/цикл</span>
                            <span>Аукционная оценка: +{val.totalBidCr} CR</span>
                          </div>
                        </div>
                      )}

                      {/* Двойное имя: Официально + в народе */}
                      <div className="mt-1.5 text-xs font-extrabold text-white">
                        Официально:{' '}
                        <span className="text-amber-300">«{pl.officialName}»</span>, в народе:{' '}
                        <span className="text-emerald-300">«{pl.folkName}»</span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
                          ★ Звезда: {pl.starSystemTitle} ({pl.constellationTitle})
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          Префикс: «{pl.prefixTag}» · Суффикс: «{pl.suffixTag}»
                        </span>
                      </div>

                      <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                        {pl.loreDescription}
                      </p>
                      <div className="mt-1 text-[10px] text-amber-200/90">
                        ⚙️ {pl.resourceSpecialization}
                      </div>

                      {/* Встроенная карточка захвата, переименования и продажи на аукционе */}
                      {isEditingThis && (
                        <div className="mt-2 rounded-lg border border-pink-400/70 bg-slate-950 p-2.5 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-pink-300">
                              🃏 Карточка захвата планеты #{pl.index}: переименование, клан и аукцион
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingPlanetIndex(null)}
                              className="text-[10px] text-slate-400 hover:text-white"
                            >
                              ✕ Свернуть
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                            <div>
                              <label className="block text-[9px] text-slate-400">Новое имя:</label>
                              <input
                                type="text"
                                value={modalCustomName}
                                onChange={(e) => setModalCustomName(e.target.value)}
                                className="w-full rounded border border-pink-400/60 bg-slate-900 px-2 py-1 text-xs font-bold text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400">Бывший (старое имя):</label>
                              <input
                                type="text"
                                value={modalFormerName}
                                onChange={(e) => setModalFormerName(e.target.value)}
                                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-amber-300"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400">Клан или Союз:</label>
                              <input
                                type="text"
                                value={modalClanTitle}
                                onChange={(e) => setModalClanTitle(e.target.value)}
                                className="w-full rounded border border-sky-400/60 bg-slate-900 px-2 py-1 text-xs font-bold text-pink-200"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {CLAN_AND_UNION_PRESETS.map((pr) => (
                              <button
                                key={pr.id}
                                type="button"
                                onClick={() => {
                                  setModalClanKind(pr.kind);
                                  setModalClanTitle(pr.name);
                                  setModalClanIcon(pr.icon);
                                  setModalClanColor(pr.color);
                                }}
                                className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                  modalClanTitle === pr.name
                                    ? 'bg-pink-500/30 border-pink-300 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-300'
                                }`}
                              >
                                {pr.icon} {pr.name}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onCaptureAndRenamePlanetByIndex?.({
                                  planetIndex: pl.index,
                                  customName: modalCustomName.trim() || 'Метадонг',
                                  formerName: modalFormerName.trim() || pl.folkName,
                                  affiliationKind: modalClanKind,
                                  clanOrUnionName: modalClanTitle.trim() || 'клан Розовой бабочки',
                                  clanIcon: modalClanIcon,
                                  clanColor: modalClanColor,
                                  applyToEntireSystem: false,
                                });
                                setCatalogBanner(
                                  `Планета #${pl.index} захвачена: «${modalCustomName.trim() || 'Метадонг'} - бывший ${modalFormerName.trim() || pl.folkName} · ${modalClanTitle.trim() || 'клан Розовой бабочки'}» (+35 CR/цикл)!`
                                );
                              }}
                              className="rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-2.5 py-1 text-[10px]"
                            >
                              ⚔️ Присоединить планету (+35 CR/цикл)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onCaptureAndRenamePlanetByIndex?.({
                                  planetIndex: pl.index,
                                  customName: modalCustomName.trim() || 'Метадонг',
                                  formerName: modalFormerName.trim() || pl.folkName,
                                  affiliationKind: modalClanKind,
                                  clanOrUnionName: modalClanTitle.trim() || 'клан Розовой бабочки',
                                  clanIcon: modalClanIcon,
                                  clanColor: modalClanColor,
                                  applyToEntireSystem: true,
                                });
                                setCatalogBanner(
                                  `Вся система «${pl.starSystemTitle}» (4 планеты) присоединена к «${modalClanTitle}»!`
                                );
                              }}
                              className="rounded bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold px-2.5 py-1 text-[10px]"
                            >
                              🌟 Присоединить ВСЮ СИСТЕМУ (4 планеты)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSellPlanetOnAuction?.(pl.index, false);
                                setCatalogBanner(
                                  `Планета #${pl.index} продана на Галактическом Аукционе за +${val.totalBidCr} CR!`
                                );
                              }}
                              className="rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-2.5 py-1 text-[10px]"
                            >
                              🏛 Продать на аукционе (+{val.totalBidCr} CR)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-800/80 pt-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingThis) {
                              setEditingPlanetIndex(null);
                            } else {
                              setEditingPlanetIndex(pl.index);
                              setModalCustomName(capRec?.customName || 'Метадонг');
                              setModalFormerName(capRec?.formerName || pl.folkName);
                              setModalClanKind(capRec?.affiliationKind || 'CLAN');
                              setModalClanTitle(capRec?.clanOrUnionName || 'клан Розовой бабочки');
                              setModalClanIcon(capRec?.clanIcon || '🦋');
                              setModalClanColor(capRec?.clanColor || '#f472b6');
                            }
                          }}
                          className="rounded bg-pink-500/25 border border-pink-400/70 px-2 py-1 text-[10px] font-bold text-pink-200 hover:bg-pink-500 hover:text-slate-950 transition"
                        >
                          🃏 Карточка: Клан / Имя / Аукцион
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onCaptureAndRenamePlanetByIndex?.({
                              planetIndex: pl.index,
                              customName: 'Метадонг',
                              formerName: pl.folkName === 'Шлак-9' ? 'Шлак-9' : pl.folkName,
                              affiliationKind: 'CLAN',
                              clanOrUnionName: 'клан Розовой бабочки',
                              clanIcon: '🦋',
                              clanColor: '#f472b6',
                              applyToEntireSystem: false,
                            });
                            setCatalogBanner(
                              `Планета #${pl.index} захвачена: «Метадонг - бывший ${pl.folkName} · клан Розовой бабочки» (+35 CR/цикл)!`
                            );
                          }}
                          className="rounded bg-fuchsia-500/20 border border-fuchsia-400/60 px-2 py-1 text-[10px] font-bold text-fuchsia-200 hover:bg-fuchsia-500 hover:text-slate-950 transition"
                          title="Быстрый захват в клан Розовой бабочки"
                        >
                          🦋 В клан Розовой бабочки
                        </button>
                      </div>

                      <button
                        onClick={() => handleJumpAndFocusPlanet(pl)}
                        className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-400/60 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500 hover:text-slate-950 transition"
                      >
                        <Rocket className="h-3 w-3" />
                        <span>ГИПЕРПРЫЖОК</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'CLAN_AND_AUCTION' && (
            <div className="space-y-4">
              {/* Панель быстрого примера: Метадонг - бывший Шлак-9 · клан Розовой бабочки */}
              <div className="rounded-xl border-2 border-pink-400/80 bg-gradient-to-r from-pink-950/50 via-slate-900 to-amber-950/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold uppercase text-pink-300">
                      🦋 Система Захвата Планет, Кланов, Дохода и Галактического Аукциона
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      Пример захвата: «Метадонг - бывший Шлак-9 · клан Розовой бабочки»
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      При захвате любой из 284 планет игрок получает полный доступ к её карточке, может переименовать планету (с сохранением бывшего имени), присоединить планету или всю звёздную систему к Союзу или Клану и получать регулярный доход в кредитах (CR) — либо выставить и продать её на Галактическом Аукционе!
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Захватываем каноническую планету «Шлак-9» (#32) и текущую 1-ю планету как «Метадонг - бывший Шлак-9 · клан Розовой бабочки»
                        const shlakPlanet =
                          ALL_STANDARD_CONSTELLATION_PLANETS.find(
                            (p) => p.folkName === 'Шлак-9'
                          ) || currentAssignment.planets[0];
                        onCaptureAndRenamePlanetByIndex?.({
                          planetIndex: shlakPlanet.index,
                          customName: 'Метадонг',
                          formerName: 'Шлак-9',
                          affiliationKind: 'CLAN',
                          clanOrUnionName: 'клан Розовой бабочки',
                          clanIcon: '🦋',
                          clanColor: '#f472b6',
                          applyToEntireSystem: false,
                        });
                        setCatalogBanner(
                          `Захвачена планета #${shlakPlanet.index}: «Метадонг - бывший Шлак-9 · клан Розовой бабочки» (+35 CR/цикл)!`
                        );
                      }}
                      className="rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-extrabold px-3.5 py-2 text-xs shadow-lg"
                    >
                      🦋 Активировать: «Метадонг - бывший Шлак-9 · клан Розовой бабочки»
                    </button>
                    {capturedList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onCollectPlanetClanIncomeNow?.(capturedList[0].planetIndex, true);
                          setCatalogBanner(
                            `Собран доход +${totalPassiveIncomePerCycle} CR со всех ${capturedList.length} захваченных планет!`
                          );
                        }}
                        className="rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-3.5 py-2 text-xs shadow-lg"
                      >
                        💰 Собрать весь доход сейчас (+{totalPassiveIncomePerCycle} CR)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Список захваченных планет игрока */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase text-emerald-300">
                  👑 Ваши захваченные планеты в Кланах и Союзах ({capturedList.length}):
                </div>
                {capturedList.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
                    У вас пока нет захваченных планет. Нажмите кнопку <b>«🦋 Активировать: Метадонг - бывший Шлак-9 · клан Розовой бабочки»</b> выше или откройте карточку любой планеты в 3D-космосе (клавиша <b>I</b> или клик по планете), чтобы захватить её, переименовать, получать доход или продать на аукционе!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {capturedList.map((rec) => {
                      const pl = ALL_STANDARD_CONSTELLATION_PLANETS[rec.planetIndex - 1];
                      const auctionVal = calculatePlanetAuctionValuationCr(rec);
                      return (
                        <div
                          key={rec.planetIndex}
                          className="rounded-xl border border-pink-400/70 bg-slate-900/90 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold text-pink-300">
                              Планета #{rec.planetIndex} · {pl?.starSystemTitle} ({pl?.constellationTitle})
                            </span>
                            <span className="rounded bg-emerald-500/20 border border-emerald-400 px-2 py-0.5 font-mono font-extrabold text-emerald-300">
                              +{rec.incomePerCycleCr} CR / цикл
                            </span>
                          </div>
                          <div className="text-sm font-extrabold text-white">
                            {rec.clanIcon} {formatCapturedPlanetFullTitle(rec)}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>Всего принесла дохода: <b className="text-emerald-300">{rec.totalEarnedCr} CR</b></span>
                            <span>Ставка на аукционе: <b className="text-amber-300">+{auctionVal.totalBidCr} CR</b></span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Покупатель на аукционе: <b className="text-amber-200">{auctionVal.topBidderName}</b>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onCollectPlanetClanIncomeNow?.(rec.planetIndex, false);
                                setCatalogBanner(
                                  `Получен доход +${rec.incomePerCycleCr} CR с планеты «${rec.customName}»!`
                                );
                              }}
                              className="rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold px-2.5 py-1 text-[10px]"
                            >
                              💰 Собрать +{rec.incomePerCycleCr} CR
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSellPlanetOnAuction?.(rec.planetIndex, false);
                                setCatalogBanner(
                                  `Планета «${formatCapturedPlanetFullTitle(rec)}» продана на аукционе за +${auctionVal.totalBidCr} CR!`
                                );
                              }}
                              className="rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-2.5 py-1 text-[10px]"
                            >
                              🏛 Продать на аукционе за +{auctionVal.totalBidCr} CR
                            </button>
                            {pl && (
                              <button
                                type="button"
                                onClick={() => handleJumpAndFocusPlanet(pl)}
                                className="rounded bg-cyan-500/25 border border-cyan-400 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 font-extrabold px-2.5 py-1 text-[10px]"
                              >
                                🚀 Прыжок к планете
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* История продаж на Галактическом Аукционе */}
              {soldOnAuctionList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-extrabold uppercase text-amber-300">
                    🏛 Проданные на Галактическом Аукционе планеты ({soldOnAuctionList.length}):
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {soldOnAuctionList.map((rec) => (
                      <div
                        key={`sold-${rec.planetIndex}`}
                        className="rounded-lg border border-amber-400/50 bg-amber-950/20 p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-amber-200">
                            🏛 {formatCapturedPlanetFullTitle(rec)}
                          </div>
                          <div className="text-[10px] text-slate-300">
                            Покупатель: <b>{rec.lastAuctionBuyer}</b> · Выручка: <b className="text-emerald-300">+{rec.lastSoldPriceCr} CR</b>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onCaptureAndRenamePlanetByIndex?.({
                              planetIndex: rec.planetIndex,
                              customName: rec.customName,
                              formerName: rec.formerName,
                              affiliationKind: rec.affiliationKind,
                              clanOrUnionName: rec.clanOrUnionName,
                              clanIcon: rec.clanIcon,
                              clanColor: rec.clanColor,
                              applyToEntireSystem: false,
                            });
                            setCatalogBanner(
                              `Планета «${rec.customName}» снова отбита и возвращена в ${rec.clanOrUnionName}!`
                            );
                          }}
                          className="rounded bg-pink-500 hover:bg-pink-400 text-slate-950 font-extrabold px-2.5 py-1 text-[10px] shrink-0"
                        >
                          ⚔️ Вернуть в клан
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'DEATH_STARS' && (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredSystems.map((sys) => {
                const ds = sys.deathStar;
                const fMeta = PLANET_FACTIONS_META[ds.factionId];
                return (
                  <div
                    key={sys.systemKey}
                    className="flex flex-col justify-between rounded-lg border border-rose-500/35 bg-slate-900/85 p-3 hover:border-rose-400 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-bold text-rose-300">
                          💀 V. ЗВЕЗДА СМЕРТИ · КОД {ds.code}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 font-bold border"
                          style={{
                            color: fMeta.color,
                            borderColor: `${fMeta.color}66`,
                            backgroundColor: `${fMeta.color}18`,
                          }}
                        >
                          {ds.factionBadge}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs font-extrabold text-white">
                        Официально:{' '}
                        <span className="text-rose-300">«{ds.officialName}»</span>, в народе:{' '}
                        <span className="text-amber-300">«{ds.folkName}»</span>
                      </div>
                      <div className="mt-1 text-[11px] text-cyan-300 font-semibold">
                        ★ Звезда: {sys.starName} · {sys.constellationNameRu}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300">{ds.superlaserSpec}</p>
                    </div>
                    <div className="mt-2.5 flex justify-end border-t border-slate-800 pt-2">
                      <button
                        onClick={() => {
                          onJumpToSystemKey(
                            sys.systemKey,
                            `${sys.starName} · ${sys.constellationNameRu}`,
                            'DEATH_STAR'
                          );
                          onClose();
                        }}
                        className="flex items-center gap-1 rounded bg-rose-500/25 border border-rose-400/70 px-3 py-1 text-[10px] font-bold text-rose-200 hover:bg-rose-500 hover:text-white transition"
                      >
                        <Rocket className="h-3 w-3" />
                        <span>ПРЫЖОК К ЗВЕЗДЕ СМЕРТИ «{ds.folkName}»</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'SPACE_STATIONS' && (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredSystems.map((sys) => {
                const st = sys.spaceStation;
                const fMeta = PLANET_FACTIONS_META[st.factionId];
                return (
                  <div
                    key={sys.systemKey}
                    className="flex flex-col justify-between rounded-lg border border-cyan-500/35 bg-slate-900/85 p-3 hover:border-cyan-400 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 font-bold text-cyan-300">
                          🍩 VI. КОСМИЧЕСКАЯ СТАНЦИЯ / ТОР · КОД {st.code}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 font-bold border"
                          style={{
                            color: fMeta.color,
                            borderColor: `${fMeta.color}66`,
                            backgroundColor: `${fMeta.color}18`,
                          }}
                        >
                          {st.factionBadge}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs font-extrabold text-white">
                        Официально:{' '}
                        <span className="text-cyan-300">«{st.officialName}»</span>, в народе:{' '}
                        <span className="text-emerald-300">«{st.folkName}»</span>
                      </div>
                      <div className="mt-1 text-[11px] text-amber-300 font-semibold">
                        ★ Звезда: {sys.starName} · {sys.constellationNameRu}
                      </div>
                      <div className="mt-1 text-[10px] text-purple-300">
                        ⛩️ VII. Мегаструктура Врат: {st.stargateDesignation}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300">{st.stationLore}</p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap justify-end gap-1.5 border-t border-slate-800 pt-2">
                      <button
                        onClick={() => {
                          onJumpToSystemKey(
                            sys.systemKey,
                            `${sys.starName} · ${sys.constellationNameRu}`,
                            'TORUS_SHIP'
                          );
                          onClose();
                        }}
                        className="flex items-center gap-1 rounded bg-cyan-500/25 border border-cyan-400/70 px-2.5 py-1 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500 hover:text-slate-950 transition"
                      >
                        <Rocket className="h-3 w-3" />
                        <span>ПРЫЖОК К СТАНЦИИ «{st.folkName}»</span>
                      </button>
                      <button
                        onClick={() => {
                          onJumpToSystemKey(
                            sys.systemKey,
                            `${sys.starName} · ${sys.constellationNameRu}`,
                            'STARGATE'
                          );
                          onClose();
                        }}
                        className="flex items-center gap-1 rounded bg-purple-500/25 border border-purple-400/70 px-2.5 py-1 text-[10px] font-bold text-purple-200 hover:bg-purple-500 hover:text-white transition"
                      >
                        <span>⛩️ К ЗВЁЗДНЫМ ВРАТАМ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'BY_CONSTELLATION' && (
            <div className="space-y-3">
              {filteredSystems.map((sys) => (
                <div
                  key={sys.systemKey}
                  className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-extrabold text-amber-300">
                        ★ ЗВЕЗДА #{sys.slotIndex + 1}: {sys.starName}
                      </span>
                      <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-300">
                        {sys.constellationNameRu}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onJumpToSystemKey(
                          sys.systemKey,
                          `${sys.starName} · ${sys.constellationNameRu}`,
                          'PLANET_3'
                        );
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-400/60 px-3 py-1 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500 hover:text-slate-950 transition"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>ГИПЕРПРЫЖОК В СИСТЕМУ «{sys.starName}»</span>
                    </button>
                  </div>

                  {/* 4 Планеты звезды */}
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {sys.planets.map((pl) => (
                      <div
                        key={pl.index}
                        onClick={() => handleJumpAndFocusPlanet(pl)}
                        className="cursor-pointer rounded border border-slate-800 bg-slate-950/80 p-2 hover:border-amber-400/60 transition"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-amber-300">
                            {pl.orbitRoman} орбита · #{pl.index}
                          </span>
                          <span>{pl.factionBadge.split(' ')[0]}</span>
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-white">
                          Офиц.: <span className="text-amber-200">«{pl.officialName}»</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-300">
                          В народе: «{pl.folkName}»
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400 line-clamp-2">
                          {pl.loreDescription}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Звезда Смерти и Космическая Станция этой звезды */}
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-[11px]">
                    <div className="rounded border border-rose-500/30 bg-rose-950/20 px-2.5 py-1.5">
                      <span className="font-bold text-rose-300">💀 V. Звезда Смерти:</span>{' '}
                      Официально: <b className="text-white">«{sys.deathStar.officialName}»</b>, в народе:{' '}
                      <b className="text-amber-300">«{sys.deathStar.folkName}»</b>
                    </div>
                    <div className="rounded border border-cyan-500/30 bg-cyan-950/20 px-2.5 py-1.5">
                      <span className="font-bold text-cyan-300">🍩 VI. Космическая Станция:</span>{' '}
                      Официально: <b className="text-white">«{sys.spaceStation.officialName}»</b>, в народе:{' '}
                      <b className="text-emerald-300">«{sys.spaceStation.folkName}»</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
