import React, {useState} from 'react';
import {X, Sparkles, Compass, Rocket, Plus, Check, Hash, ShieldAlert, Globe, Star} from 'lucide-react';

export interface UserCreatedWorld {
  id: string;
  uniqueWorldCode: string; // Например: "777-001"
  worldName: string;
  authorName: string;
  starName: string;
  starColor: string;
  spectralClass: string;
  econ: string;
  danger: string;
  description: string;
  planetNames: [string, string, string, string]; // 4 планеты пользовательского мира
  createdAtLabel: string;
  isCustomPlayerCreated?: boolean;
}

export interface StandardConstellationStarEntry {
  constellationId: string;
  constellationNameRu: string;
  constellationNameLat: string;
  starIndex: number;
  starId: string;
  starName: string;
  color: string;
  spectralNote: string;
  distanceLightYears: string;
  lonDeg: number;
  latDeg: number;
  isAlpha?: boolean;
  targetSystemId: number;
}

export const DEFAULT_USER_CREATED_WORLDS: UserCreatedWorld[] = [
  {
    id: 'user-world-777-001',
    uniqueWorldCode: '777-001',
    worldName: 'НОВАЯ ТЕРРА · КОВЧЕГ ВИРПИЛОВ',
    authorName: 'CMDR_VIRPIL',
    starName: 'Гелиос-Прайм (Золотой Сверхгигант)',
    starColor: '#fde047',
    spectralClass: 'G2 Ia · Эталонный сектор пилотажа',
    econ: 'High Tech & Piloting Hub',
    danger: 'Low (Зона тренировок и торговли)',
    description:
      'Пользовательский мир для вирпилов: идеальная эклиптика 4 планет, тренировочные полигоны Меш-Рубки 360° и свободная беспошлинная торговля сплавами.',
    planetNames: ['Кузница Вулкан', 'Аэро-Венера', 'Новая Терра', 'Цитадель Арес'],
    createdAtLabel: 'Каталог Врат #01',
  },
  {
    id: 'user-world-108-404',
    uniqueWorldCode: '108-404',
    worldName: 'КИБЕР-СИНДИКАТ «НЕОН-9»',
    authorName: 'CYBER_ARCHITECT',
    starName: 'Сириус-Неон (Голубой Пульсар)',
    starColor: '#38bdf8',
    spectralClass: 'B0 V · Квантовый маяк',
    econ: 'Cybernetics & AI Core',
    danger: 'Medium',
    description:
      'Техногенный мир пользователей с орбитальными лабораториями, верфями скоростных перехватчиков и высоким спросом на титан и редкие элементы.',
    planetNames: ['Кремний-Прайм', 'Кобальт-Сфера', 'Нео-Киото', 'Бастион-Титан'],
    createdAtLabel: 'Каталог Врат #02',
  },
  {
    id: 'user-world-314-159',
    uniqueWorldCode: '314-159',
    worldName: 'АКАДЕМИЯ НАУК «ПИ-СЕКТОР»',
    authorName: 'PROF_BELL',
    starName: 'Квантум-Пи (Изумрудная Звезда)',
    starColor: '#34d399',
    spectralClass: 'F5 III · Аномалия синтеза',
    econ: 'Scientific & Deep Mining',
    danger: 'Low',
    description:
      'Научно-исследовательский пользовательский мир: экспериментальные реакторы контролируемого размыкания узлов и богатейший пояс астероидов.',
    planetNames: ['Феррум-Лаб', 'Алюм-Модуль', 'Биосфера-Эдем', 'Полигон-Марс'],
    createdAtLabel: 'Каталог Врат #03',
  },
  {
    id: 'user-world-888-777',
    uniqueWorldCode: '888-777',
    worldName: 'ЗОЛОТАЯ БИРЖА «ЭЛЬДОРАДО»',
    authorName: 'TRADER_GUILD',
    starName: 'Аурум-Мажорис (Янтарный Гигант)',
    starColor: '#fb923c',
    spectralClass: 'K3 II · Торговое солнце',
    econ: 'Rich Commercial Exchange',
    danger: 'Medium',
    description:
      'Главный коммерческий мир, созданный гильдией торговцев: частные бизнесы с минимальной маржой, аукционы слотов и караваны с золотом и платиной.',
    planetNames: ['Слиток-I', 'Дюраль-II', 'Порт-Эльдорадо', 'Платина-IV'],
    createdAtLabel: 'Каталог Врат #04',
  },
  {
    id: 'user-world-666-999',
    uniqueWorldCode: '666-999',
    worldName: 'ТОРТУГА · ВОЛЬНЫЙ ФЛОТ КОРСАРОВ',
    authorName: 'BLACK_CORSAIR',
    starName: 'Немезида (Багровый Сверхгигант)',
    starColor: '#f43f5e',
    spectralClass: 'M2 Iab · Тёмный сектор',
    econ: 'Anarchy & Contraband',
    danger: 'High (Pirate Free Zone)',
    description:
      'Опасный пользовательский мир анархии, куда ведут только секретные координаты Звёздных Врат. Сбыт контрабанды и бои тяжёлых крейсеров.',
    planetNames: ['Ржавый Док', 'Тень Венеры', 'Порт-Тортуга', 'Арена Корсаров'],
    createdAtLabel: 'Каталог Врат #05',
  },
  {
    id: 'user-world-909-101',
    uniqueWorldCode: '909-101',
    worldName: 'КРИСТАЛЬНЫЙ ГОРИЗОНТ «АТЛАНТИС»',
    authorName: 'STARGATE_KEEPER',
    starName: 'Атлантис-Ядро (Фиолетовый Квазар)',
    starColor: '#c084fc',
    spectralClass: 'O5 Ia · Древний узел Врат',
    econ: 'Relict Stargate Nexus',
    danger: 'Extreme',
    description:
      'Древний мир строителей Звёздных Врат. Насыщен Критическим веществом [Ω-γ] и окружён энергетическими кольцами.',
    planetNames: ['Монолит-I', 'Шеврон-II', 'Атлантида-Прайм', 'Хронос-Форт'],
    createdAtLabel: 'Каталог Врат #06',
  },
];

export function normalizeStargateWorldCode(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
}

export function generateProceduralUserWorldByCode(code: string, pilotName: string): UserCreatedWorld {
  const cleanDigits = code.replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
  const formattedCode = `${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}`;
  const seed = Number(cleanDigits) || 100100;
  const starPalette = ['#38bdf8', '#fde047', '#34d399', '#fb923c', '#c084fc', '#f43f5e'];
  const starColor = starPalette[seed % starPalette.length];
  const sectorPrefixes = ['АЛЬФА', 'ВЕГА', 'ОРИОН', 'КВАНТУМ', 'НОВА', 'ЗЕНИТ', 'СИРИУС', 'АТЛАС'];
  const sectorSuffixes = ['ПРАЙМ', 'КОВЧЕГ', 'ФОРПОСТ', 'ГОРИЗОНТ', 'ЦИТАДЕЛЬ', 'ОАЗИС'];
  const pref = sectorPrefixes[seed % sectorPrefixes.length];
  const suff = sectorSuffixes[Math.floor(seed / 7) % sectorSuffixes.length];

  return {
    id: `user-world-${formattedCode}`,
    uniqueWorldCode: formattedCode,
    worldName: `МИР ПОЛЬЗОВАТЕЛЯ «${pref}-${suff} #${formattedCode}»`,
    authorName: `PILOT_${cleanDigits.slice(0, 3)}`,
    starName: `Звезда ${pref}-${cleanDigits.slice(3, 6)}`,
    starColor,
    spectralClass: `Спектральный узел Врат #${formattedCode}`,
    econ: 'User Custom Sector',
    danger: seed % 3 === 0 ? 'High' : seed % 2 === 0 ? 'Medium' : 'Low',
    description: `Пользовательский мир с уникальным номером Звёздных Врат #${formattedCode}. Доступен исключительно через червоточину Звёздных Врат (без гиперпрыжка).`,
    planetNames: [
      `Меркурий-${cleanDigits.slice(0, 2)}`,
      `Венера-${cleanDigits.slice(2, 4)}`,
      `Терра-${cleanDigits.slice(3, 6)}`,
      `Марс-${cleanDigits.slice(0, 3)}`,
    ],
    createdAtLabel: `Открыт по коду #${formattedCode}`,
  };
}

interface StargateUserWorldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'STARGATE_DIALER' | 'STANDARD_CONSTELLATIONS' | 'CREATE_USER_WORLD';
  activeGameLevel: 'STANDARD' | 'USER_WORLD';
  activeStandardStar: StandardConstellationStarEntry;
  activeUserWorld: UserCreatedWorld | null;
  dialedStargateWorld: UserCreatedWorld | null;
  userWorlds: UserCreatedWorld[];
  allConstellationStars: StandardConstellationStarEntry[];
  pilotName: string;
  onDialWorldOnStargate: (world: UserCreatedWorld) => void;
  onEnterStargateToUserWorld: (world: UserCreatedWorld) => void;
  onReturnToStandardLevelViaStargate: () => void;
  onHyperjumpToStandardConstellationStar: (starEntry: StandardConstellationStarEntry) => void;
  onCreateNewUserWorld: (newWorld: UserCreatedWorld) => void;
}

export const StargateUserWorldsModal: React.FC<StargateUserWorldsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'STARGATE_DIALER',
  activeGameLevel,
  activeStandardStar,
  activeUserWorld,
  dialedStargateWorld,
  userWorlds,
  allConstellationStars,
  pilotName,
  onDialWorldOnStargate,
  onEnterStargateToUserWorld,
  onReturnToStandardLevelViaStargate,
  onHyperjumpToStandardConstellationStar,
  onCreateNewUserWorld,
}) => {
  const [activeTab, setActiveTab] = useState<
    'STARGATE_DIALER' | 'STANDARD_CONSTELLATIONS' | 'CREATE_USER_WORLD'
  >(initialTab);

  // Состояние набора уникального номера мира на Звёздных Вратах (6 цифр: XXX-XXX)
  const [dialedDigits, setDialedDigits] = useState<string>(
    dialedStargateWorld
      ? dialedStargateWorld.uniqueWorldCode.replace(/\D/g, '')
      : activeUserWorld
      ? activeUserWorld.uniqueWorldCode.replace(/\D/g, '')
      : '777001'
  );
  const [dialStatusMessage, setDialStatusMessage] = useState<string | null>(null);

  // Фильтр по созвездию в Стандартном уровне
  const [selectedConstellationFilter, setSelectedConstellationFilter] = useState<string>('ALL');

  // Поля конструктора нового Пользовательского Мира
  const [newWorldCode, setNewWorldCode] = useState<string>(() => {
    const rand1 = Math.floor(100 + Math.random() * 899);
    const rand2 = Math.floor(100 + Math.random() * 899);
    return `${rand1}-${rand2}`;
  });
  const [newWorldName, setNewWorldName] = useState<string>('БАЗА ВИРПИЛА · СЕКТОР СВОБОДЫ');
  const [newStarName, setNewStarName] = useState<string>('Астра-Прайм');
  const [newStarColor, setNewStarColor] = useState<string>('#38bdf8');
  const [newWorldDesc, setNewWorldDesc] = useState<string>(
    'Авторский пользовательский мир: доступ только через Звёздные Врата по уникальному номеру мира.'
  );
  const [newPlanet1, setNewPlanet1] = useState<string>('Феррум-I');
  const [newPlanet2, setNewPlanet2] = useState<string>('Крыло-II');
  const [newPlanet3, setNewPlanet3] = useState<string>('Океания-III');
  const [newPlanet4, setNewPlanet4] = useState<string>('Бастион-IV');

  if (!isOpen) return null;

  const formattedDialedCode = normalizeStargateWorldCode(dialedDigits);
  const cleanDigitsCount = dialedDigits.replace(/\D/g, '').length;
  const matchedWorld: UserCreatedWorld | null =
    cleanDigitsCount === 6
      ? userWorlds.find((w) => w.uniqueWorldCode === formattedDialedCode) ||
        generateProceduralUserWorldByCode(formattedDialedCode, pilotName)
      : null;

  const lockedChevronsCount = Math.min(9, Math.round((cleanDigitsCount / 6) * 9));

  const handlePressKeypadDigit = (digit: string) => {
    setDialStatusMessage(null);
    setDialedDigits((prev) => {
      const clean = prev.replace(/\D/g, '');
      if (clean.length >= 6) return clean;
      return clean + digit;
    });
  };

  const handleBackspaceDigit = () => {
    setDialStatusMessage(null);
    setDialedDigits((prev) => prev.replace(/\D/g, '').slice(0, -1));
  };

  const handleClearDigits = () => {
    setDialStatusMessage(null);
    setDialedDigits('');
  };

  const uniqueConstellations = Array.from(
    new Map(
      allConstellationStars.map((s) => [
        s.constellationId,
        {id: s.constellationId, nameRu: s.constellationNameRu, nameLat: s.constellationNameLat},
      ])
    ).values()
  );

  const filteredStandardStars =
    selectedConstellationFilter === 'ALL'
      ? allConstellationStars
      : allConstellationStars.filter((s) => s.constellationId === selectedConstellationFilter);

  return (
    <div className="fixed inset-0 z-[170] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-mono select-text animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-slate-950 border-2 border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.45)] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Шапка модального окна двух уровней игры */}
        <div className="px-4 py-3 bg-slate-900 border-b-2 border-purple-500/50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 border-2 border-purple-400 bg-purple-950/60 flex items-center justify-center text-lg">
              ⛩️
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-purple-200 uppercase flex items-center gap-2 flex-wrap">
                <span>СИСТЕМА ДВУХ УРОВНЕЙ ИГРЫ: СТАНДАРТНЫЙ УРОВЕНЬ И ПОЛЬЗОВАТЕЛЬСКИЙ УРОВЕНЬ</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold border ${
                    activeGameLevel === 'USER_WORLD'
                      ? 'bg-purple-400 text-black border-yellow-300'
                      : 'bg-cyan-400 text-black border-white'
                  }`}
                >
                  {activeGameLevel === 'USER_WORLD' && activeUserWorld
                    ? `ВЫ В ПОЛЬЗОВАТЕЛЬСКОМ МИРЕ #${activeUserWorld.uniqueWorldCode}`
                    : `ВЫ В СТАНДАРТНОМ УРОВНЕ (${activeStandardStar.starName})`}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                1) <b className="text-cyan-300">Стандартный уровень</b> — все {allConstellationStars.length} звёзд всех 10 созвездий карты неба (доступ через <b>Гиперпрыжок H</b>) · 2) <b className="text-purple-300">Пользовательский уровень</b> — миры пользователей (доступ <b>ТОЛЬКО через Звёздные Врата</b> по уникальному номеру мира)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border-2 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-black font-extrabold text-xs flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>ЗАКРЫТЬ</span>
          </button>
        </div>

        {/* Переключатель 3 разделов */}
        <div className="px-4 py-2 bg-black border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('STARGATE_DIALER')}
            className={`py-2 px-3 border-2 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'STARGATE_DIALER'
                ? 'bg-purple-500 text-black border-yellow-300 shadow-[0_0_16px_rgba(168,85,247,0.6)]'
                : 'bg-slate-950 text-purple-300 border-purple-500/50 hover:border-purple-400'
            }`}
          >
            <span>⛩️ 1. ЗВЁЗДНЫЕ ВРАТА · НАБОР НОМЕРА МИРА</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STANDARD_CONSTELLATIONS')}
            className={`py-2 px-3 border-2 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'STANDARD_CONSTELLATIONS'
                ? 'bg-cyan-400 text-black border-yellow-300 shadow-[0_0_16px_rgba(34,211,238,0.6)]'
                : 'bg-slate-950 text-cyan-300 border-cyan-500/50 hover:border-cyan-400'
            }`}
          >
            <span>★ 2. СТАНДАРТНЫЙ УРОВЕНЬ ({allConstellationStars.length} ЗВЁЗД · ГИПЕРПРЫЖОК)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CREATE_USER_WORLD')}
            className={`py-2 px-3 border-2 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'CREATE_USER_WORLD'
                ? 'bg-emerald-400 text-black border-yellow-300 shadow-[0_0_16px_rgba(16,185,129,0.6)]'
                : 'bg-slate-950 text-emerald-300 border-emerald-500/50 hover:border-emerald-400'
            }`}
          >
            <span>🛠️ 3. СОЗДАТЬ СВОЙ МИР (+УНИКАЛЬНЫЙ НОМЕР)</span>
          </button>
        </div>

        {/* Контент выбранной вкладки */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {/* ========================================================================= */}
          {/* ВКЛАДКА 1: НАБОРНОЕ УСТРОЙСТВО ЗВЁЗДНЫХ ВРАТ И ПОЛЬЗОВАТЕЛЬСКИЙ УРОВЕНЬ */}
          {/* ========================================================================= */}
          {activeTab === 'STARGATE_DIALER' && (
            <div className="space-y-4">
              {/* Памятка о правиле доступа */}
              <div className="p-3 border-2 border-purple-400/70 bg-purple-950/25 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="text-purple-200 font-extrabold text-xs uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span>ПРАВИЛО ПОЛЬЗОВАТЕЛЬСКОГО УРОВНЯ (МИРЫ, СОЗДАННЫЕ ПОЛЬЗОВАТЕЛЯМИ):</span>
                  </div>
                  <div className="text-[11px] text-slate-200 leading-relaxed">
                    В миры <b>Пользовательского уровня</b> <u>нельзя совершить гиперпрыжок</u> — в них можно попасть <b>только через Звёздные Врата (клавиша 0)</b>, предварительно <b>набрав уникальный 6-значный номер этого мира</b> (например, <b className="text-yellow-300">777-001</b>)!
                  </div>
                </div>
                {activeGameLevel === 'USER_WORLD' && (
                  <button
                    type="button"
                    onClick={onReturnToStandardLevelViaStargate}
                    className="px-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs shrink-0 border-2 border-white"
                  >
                    ★ ВЕРНУТЬСЯ В СТАНДАРТНЫЙ УРОВЕНЬ (СОЗВЕЗДИЯ)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Левая колонка (5 из 12): Пульт набора уникального номера мира (9 шевронов) */}
                <div className="lg:col-span-5 border-2 border-purple-400 bg-black p-3.5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-purple-500/40 pb-1.5">
                      <span className="font-extrabold text-purple-300 text-xs">
                        🔢 ПУЛЬТ НАБОРА ЗВЁЗДНЫХ ВРАТ (9 ШЕВРОНОВ)
                      </span>
                      <span className="text-[10px] font-bold text-yellow-300">
                        ШЕВРОНОВ: {lockedChevronsCount}/9
                      </span>
                    </div>

                    {/* Индикатор 9 шевронов Врат */}
                    <div className="grid grid-cols-9 gap-1">
                      {Array.from({length: 9}).map((_, idx) => {
                        const isLocked = idx < lockedChevronsCount;
                        return (
                          <div
                            key={idx}
                            className={`py-1 text-center font-extrabold text-[10px] border transition-all ${
                              isLocked
                                ? 'bg-amber-400 text-black border-yellow-200 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                            title={`Шеврон Звёздных Врат #${idx + 1}`}
                          >
                            ▲{idx + 1}
                          </div>
                        );
                      })}
                    </div>

                    {/* Цифровое табло уникального номера мира */}
                    <div className="p-3 bg-slate-950 border-2 border-cyan-400 text-center space-y-1">
                      <div className="text-[10px] text-cyan-300 font-bold uppercase">
                        УНИКАЛЬНЫЙ НОМЕР ПОЛЬЗОВАТЕЛЬСКОГО МИРА:
                      </div>
                      <input
                        type="text"
                        value={formattedDialedCode}
                        onChange={(e) => {
                          setDialStatusMessage(null);
                          setDialedDigits(e.target.value.replace(/\D/g, '').slice(0, 6));
                        }}
                        placeholder="777-001"
                        className="w-full text-center text-2xl font-extrabold tracking-[0.22em] text-yellow-300 bg-black border border-purple-500/50 py-1.5 focus:outline-none focus:border-yellow-300"
                      />
                      <div className="text-[10px] text-slate-400">
                        {cleanDigitsCount < 6
                          ? `Введите ещё ${6 - cleanDigitsCount} цифр(ы) уникального номера мира`
                          : '✓ Все 9 шевронов готовы к открытию червоточины Звёздных Врат!'}
                      </div>
                    </div>

                    {/* Кнопочная матрица набора номера 0..9 */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handlePressKeypadDigit(d)}
                          className="py-2 bg-slate-900 hover:bg-purple-500 hover:text-black border border-purple-400/60 text-purple-200 font-extrabold text-sm transition-colors"
                        >
                          {d}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleClearDigits}
                        className="py-2 bg-rose-950/60 hover:bg-rose-500 hover:text-black border border-rose-500/60 text-rose-300 font-extrabold text-[11px]"
                      >
                        СБРОС
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePressKeypadDigit('0')}
                        className="py-2 bg-slate-900 hover:bg-purple-500 hover:text-black border border-purple-400/60 text-purple-200 font-extrabold text-sm transition-colors"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={handleBackspaceDigit}
                        className="py-2 bg-amber-950/60 hover:bg-amber-400 hover:text-black border border-amber-500/60 text-amber-300 font-extrabold text-[11px]"
                      >
                        ⌫ СТЕРЕТЬ
                      </button>
                    </div>
                  </div>

                  {/* Информация о найденном по номеру Пользовательском Мире и кнопки входа */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    {matchedWorld ? (
                      <div className="p-2.5 border border-emerald-400 bg-emerald-950/20 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold text-emerald-300">
                            ✓ КООРДИНАТЫ МИРА #{matchedWorld.uniqueWorldCode} РАСПОЗНАНЫ:
                          </span>
                          <span className="text-[10px] text-yellow-300 font-bold">
                            Автор: {matchedWorld.authorName}
                          </span>
                        </div>
                        <div
                          className="text-xs font-extrabold truncate"
                          style={{color: matchedWorld.starColor}}
                        >
                          {matchedWorld.worldName}
                        </div>
                        <div className="text-[10px] text-slate-300 leading-snug">
                          Звезда: <b>{matchedWorld.starName}</b> · Планеты:{' '}
                          {matchedWorld.planetNames.join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 border border-slate-700 bg-slate-900/60 text-[11px] text-slate-400 text-center">
                        Наберите 6 цифр уникального номера мира (например, <b>777-001</b>) для активации Звёздных Врат
                      </div>
                    )}

                    {dialStatusMessage && (
                      <div className="p-2 bg-purple-950/60 border border-yellow-300 text-yellow-200 text-[11px] font-bold text-center">
                        {dialStatusMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        disabled={!matchedWorld}
                        onClick={() => {
                          if (!matchedWorld) return;
                          onDialWorldOnStargate(matchedWorld);
                          setDialStatusMessage(
                            `✓ Номер #${matchedWorld.uniqueWorldCode} («${matchedWorld.worldName}») набран на Звёздных Вратах! Горизонт событий открыт — войдите во Врата!`
                          );
                        }}
                        className="w-full py-2 px-3 bg-purple-400 hover:bg-purple-300 disabled:opacity-40 text-black font-extrabold text-xs border border-white"
                      >
                        1. НАБРАТЬ НОМЕР #{formattedDialedCode || '___-___'} НА ЗВЁЗДНЫХ ВРАТАХ
                      </button>

                      <button
                        type="button"
                        disabled={!matchedWorld}
                        onClick={() => {
                          if (!matchedWorld) return;
                          onEnterStargateToUserWorld(matchedWorld);
                          onClose();
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-black font-extrabold text-xs border-2 border-yellow-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                      >
                        2. ⛩️ ВОЙТИ В ЗВЁЗДНЫЕ ВРАТА → ПЕРЕЙТИ В МИР #{formattedDialedCode || '___-___'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Правая колонка (7 из 12): Каталог известных Пользовательских Миров и их Уникальных Номеров */}
                <div className="lg:col-span-7 border-2 border-slate-800 bg-slate-900/50 p-3.5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-yellow-300 uppercase">
                          🌍 КАТАЛОГ ПОЛЬЗОВАТЕЛЬСКОГО УРОВНЯ (МИРЫ, СОЗДАННЫЕ ПОЛЬЗОВАТЕЛЯМИ)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Выберите любой мир, чтобы набрать его уникальный номер на Звёздных Вратах, или введите любой свой 6-значный код слева:
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('CREATE_USER_WORLD')}
                        className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[10px] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Создать свой мир</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[410px] overflow-y-auto pr-1">
                      {userWorlds.map((uWorld) => {
                        const isCurrentlyInThisWorld =
                          activeGameLevel === 'USER_WORLD' &&
                          activeUserWorld?.uniqueWorldCode === uWorld.uniqueWorldCode;
                        const isDialedCode = formattedDialedCode === uWorld.uniqueWorldCode;

                        return (
                          <div
                            key={uWorld.id}
                            className={`p-3 border-2 transition-all space-y-1.5 ${
                              isCurrentlyInThisWorld
                                ? 'border-emerald-400 bg-emerald-950/25'
                                : isDialedCode
                                ? 'border-yellow-400 bg-purple-950/30'
                                : 'border-slate-800 bg-black hover:border-purple-400/70'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-500 text-black font-extrabold text-xs tracking-wider border border-yellow-300">
                                  #{uWorld.uniqueWorldCode}
                                </span>
                                <span
                                  className="font-extrabold text-xs sm:text-sm"
                                  style={{color: uWorld.starColor}}
                                >
                                  {uWorld.worldName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {uWorld.isCustomPlayerCreated && (
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[9px] font-extrabold">
                                    ★ ВАШ МИР
                                  </span>
                                )}
                                {isCurrentlyInThisWorld && (
                                  <span className="px-2 py-0.5 bg-emerald-400 text-black text-[10px] font-extrabold">
                                    [ВЫ СЕЙЧАС В ЭТОМ МИРЕ]
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-300 leading-snug">
                              {uWorld.description}
                            </div>

                            <div className="text-[10px] text-cyan-300 flex items-center gap-3 flex-wrap">
                              <span>
                                <b>Автор:</b> {uWorld.authorName}
                              </span>
                              <span>
                                <b>Звезда:</b> {uWorld.starName}
                              </span>
                              <span>
                                <b>Планеты (4):</b> {uWorld.planetNames.join(' · ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setDialedDigits(uWorld.uniqueWorldCode.replace(/\D/g, ''));
                                  onDialWorldOnStargate(uWorld);
                                  setDialStatusMessage(
                                    `✓ Уникальный номер #${uWorld.uniqueWorldCode} набран на Звёздных Вратах! Нажмите «Войти в Звёздные Врата» или влетите в портал в 3D-космосе.`
                                  );
                                }}
                                className="px-3 py-1.5 bg-purple-500/25 hover:bg-purple-400 hover:text-black border border-purple-400 text-purple-200 font-extrabold text-[10px] transition-colors"
                              >
                                🔢 Набрать номер #{uWorld.uniqueWorldCode} на Вратах
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDialedDigits(uWorld.uniqueWorldCode.replace(/\D/g, ''));
                                  onDialWorldOnStargate(uWorld);
                                  onEnterStargateToUserWorld(uWorld);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[10px] transition-colors"
                              >
                                ⛩️ Набрать #{uWorld.uniqueWorldCode} и войти через Звёздные Врата →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ВКЛАДКА 2: СТАНДАРТНЫЙ УРОВЕНЬ — ВСЕ ЗВЁЗДЫ ВСЕХ СОЗВЕЗДИЙ КАРТЫ НЕБА */}
          {/* ========================================================================= */}
          {activeTab === 'STANDARD_CONSTELLATIONS' && (
            <div className="space-y-3">
              <div className="p-3 border-2 border-cyan-400/70 bg-cyan-950/20 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="text-cyan-300 font-extrabold text-xs uppercase">
                    ★ СТАНДАРТНЫЙ УРОВЕНЬ ИГРЫ: ВСЕ {allConstellationStars.length} ЗВЁЗД ВСЕХ 10 СОЗВЕЗДИЙ КАРТЫ НЕБА (ГИПЕРПРЫЖОК)
                  </div>
                  <div className="text-[11px] text-slate-200 leading-relaxed">
                    В <b>Стандартный уровень</b> входят все звёзды всех созвездий, которые есть у нас на карте неба. На любую из этих звёзд можно совершить <b>Гиперпрыжок (клавиша H или прямо из карточки созвездия по клавише I в 3D-космосе)</b>!
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-slate-900 border border-cyan-400 text-[11px] font-extrabold text-yellow-300">
                  Текущая звезда: {activeStandardStar.starName} ({activeStandardStar.constellationNameRu})
                </div>
              </div>

              {/* Фильтр по 10 созвездиям карты неба */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedConstellationFilter('ALL')}
                  className={`px-2.5 py-1 border font-extrabold text-[10px] ${
                    selectedConstellationFilter === 'ALL'
                      ? 'bg-cyan-400 text-black border-white'
                      : 'bg-slate-900 text-cyan-200 border-slate-700 hover:border-cyan-400'
                  }`}
                >
                  ★ ВСЕ 10 СОЗВЕЗДИЙ ({allConstellationStars.length} ЗВЁЗД)
                </button>
                {uniqueConstellations.map((c) => {
                  const count = allConstellationStars.filter(
                    (s) => s.constellationId === c.id
                  ).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConstellationFilter(c.id)}
                      className={`px-2.5 py-1 border font-extrabold text-[10px] ${
                        selectedConstellationFilter === c.id
                          ? 'bg-amber-400 text-black border-white'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {c.nameRu} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Сетка всех звёзд созвездий Стандартного уровня */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredStandardStars.map((stEntry) => {
                  const isCurrentStandardStar =
                    activeGameLevel === 'STANDARD' &&
                    activeStandardStar.starId === stEntry.starId;
                  return (
                    <div
                      key={stEntry.starId}
                      className={`p-2.5 border-2 flex flex-col justify-between gap-2 transition-colors ${
                        isCurrentStandardStar
                          ? 'border-emerald-400 bg-emerald-950/25'
                          : 'border-slate-800 bg-black hover:border-cyan-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1.5 py-0.5 bg-indigo-950 border border-indigo-400/50 text-indigo-200 font-extrabold text-[9px]">
                            Созвездие: {stEntry.constellationNameRu}
                          </span>
                          {stEntry.isAlpha && (
                            <span className="px-1.5 py-0.5 bg-amber-400/20 border border-amber-400 text-amber-300 font-extrabold text-[9px]">
                              ★ Главная α
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            style={{color: stEntry.color}}
                            className="text-base leading-none font-extrabold"
                          >
                            ★
                          </span>
                          <span className="font-extrabold text-xs text-white truncate">
                            {stEntry.starName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          {stEntry.spectralNote} · {stEntry.distanceLightYears}
                        </div>
                        <div className="text-[9px] text-cyan-300/80">
                          Небесные коорд.: долгота {stEntry.lonDeg}° · широта {stEntry.latDeg}°
                        </div>
                      </div>

                      {isCurrentStandardStar ? (
                        <div className="py-1.5 text-center border border-emerald-400 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
                          ✓ ВЫ НАХОДИТЕСЬ У ЭТОЙ ЗВЕЗДЫ
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onHyperjumpToStandardConstellationStar(stEntry);
                            onClose();
                          }}
                          className="w-full py-1.5 px-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-[10px] flex items-center justify-center gap-1"
                        >
                          <span>⚡ ГИПЕРПРЫЖОК К ЗВЕЗДЕ «{stEntry.starName.split(' ')[0]}»</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ВКЛАДКА 3: КОНСТРУКТОР ПОЛЬЗОВАТЕЛЬСКОГО МИРА (СОЗДАНИЕ УНИКАЛЬНОГО НОМЕРА) */}
          {/* ========================================================================= */}
          {activeTab === 'CREATE_USER_WORLD' && (
            <div className="space-y-4">
              <div className="p-3 border-2 border-emerald-400/70 bg-emerald-950/20 space-y-1">
                <div className="text-emerald-300 font-extrabold text-xs uppercase">
                  🛠️ КОНСТРУКТОР ПОЛЬЗОВАТЕЛЬСКОГО МИРА (СОЗДАНИЕ МИРА С УНИКАЛЬНЫМ НОМЕРОМ ДЛЯ ЗВЁЗДНЫХ ВРАТ)
                </div>
                <div className="text-[11px] text-slate-200">
                  Создайте собственный мир в <b>Пользовательском уровне</b>! Вашему миру присваивается <b>уникальный 6-значный номер</b>, набрав который на <b>Звёздных Вратах</b> вы и другие пилоты сможете попасть в созданную вами звёздную систему.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/70 border border-slate-800 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-yellow-300 uppercase mb-1">
                      Уникальный номер вашего мира (6 цифр для Звёздных Врат):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={normalizeStargateWorldCode(newWorldCode)}
                        onChange={(e) => setNewWorldCode(e.target.value)}
                        className="flex-1 bg-black border-2 border-purple-400 px-3 py-1.5 text-base font-extrabold text-yellow-300 tracking-widest"
                        placeholder="555-777"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const r1 = Math.floor(100 + Math.random() * 899);
                          const r2 = Math.floor(100 + Math.random() * 899);
                          setNewWorldCode(`${r1}-${r2}`);
                        }}
                        className="px-3 py-2 bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-[10px]"
                      >
                        🎲 Сгенерировать №
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-cyan-300 uppercase mb-1">
                      Название вашего пользовательского мира:
                    </label>
                    <input
                      type="text"
                      value={newWorldName}
                      onChange={(e) => setNewWorldName(e.target.value)}
                      className="w-full bg-black border border-slate-700 px-3 py-1.5 text-xs text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-300 uppercase mb-1">
                        Название центральной звезды:
                      </label>
                      <input
                        type="text"
                        value={newStarName}
                        onChange={(e) => setNewStarName(e.target.value)}
                        className="w-full bg-black border border-slate-700 px-2.5 py-1.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-300 uppercase mb-1">
                        Цвет свечения звезды:
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[
                          '#fde047',
                          '#38bdf8',
                          '#34d399',
                          '#fb923c',
                          '#c084fc',
                          '#f43f5e',
                        ].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setNewStarColor(col)}
                            style={{backgroundColor: col}}
                            className={`w-6 h-6 rounded-full border-2 ${
                              newStarColor === col ? 'border-white scale-110' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-300 uppercase mb-1">
                      Описание мира и его правил:
                    </label>
                    <textarea
                      rows={2}
                      value={newWorldDesc}
                      onChange={(e) => setNewWorldDesc(e.target.value)}
                      className="w-full bg-black border border-slate-700 p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-[10px] font-extrabold text-emerald-300 uppercase">
                      Названия 4 планет вашего мира (I. Fe, II. Al, III. Еда/O₂, IV. Ti):
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-orange-300 font-bold mb-0.5">
                          1-я планета (Железо Fe):
                        </label>
                        <input
                          type="text"
                          value={newPlanet1}
                          onChange={(e) => setNewPlanet1(e.target.value)}
                          className="w-full bg-black border border-slate-700 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-lime-300 font-bold mb-0.5">
                          2-я планета (Алюминий Al):
                        </label>
                        <input
                          type="text"
                          value={newPlanet2}
                          onChange={(e) => setNewPlanet2(e.target.value)}
                          className="w-full bg-black border border-slate-700 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-sky-300 font-bold mb-0.5">
                          3-я планета (Продовольствие и Вода):
                        </label>
                        <input
                          type="text"
                          value={newPlanet3}
                          onChange={(e) => setNewPlanet3(e.target.value)}
                          className="w-full bg-black border border-slate-700 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-rose-300 font-bold mb-0.5">
                          4-я планета (Титан Ti):
                        </label>
                        <input
                          type="text"
                          value={newPlanet4}
                          onChange={(e) => setNewPlanet4(e.target.value)}
                          className="w-full bg-black border border-slate-700 px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-black border border-emerald-500/50 space-y-2">
                    <div className="text-[11px] text-slate-300">
                      После создания ваш мир получит уникальный код{' '}
                      <b className="text-yellow-300">
                        #{normalizeStargateWorldCode(newWorldCode).padEnd(7, '0')}
                      </b>
                      , будет добавлен в каталог Звёздных Врат, и вы сможете сразу открыть червоточину в него!
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const rawDigits = newWorldCode.replace(/\D/g, '').padEnd(6, '7').slice(0, 6);
                        const codeFormatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 6)}`;
                        const created: UserCreatedWorld = {
                          id: `custom-user-world-${codeFormatted}-${Date.now()}`,
                          uniqueWorldCode: codeFormatted,
                          worldName: (newWorldName.trim() || `МИР #${codeFormatted}`).toUpperCase(),
                          authorName: pilotName || 'CMDR_PILOT',
                          starName: newStarName.trim() || `Звезда #${codeFormatted}`,
                          starColor: newStarColor,
                          spectralClass: `Авторская звезда пилота ${pilotName || 'CMDR'}`,
                          econ: 'Player Created World',
                          danger: 'Custom Rules',
                          description:
                            newWorldDesc.trim() ||
                            'Пользовательский мир, доступный через Звёздные Врата по уникальному номеру.',
                          planetNames: [
                            newPlanet1.trim() || 'Меркурий-I',
                            newPlanet2.trim() || 'Венера-II',
                            newPlanet3.trim() || 'Земля-III',
                            newPlanet4.trim() || 'Марс-IV',
                          ],
                          createdAtLabel: 'Создан вами',
                          isCustomPlayerCreated: true,
                        };
                        onCreateNewUserWorld(created);
                        setDialedDigits(rawDigits);
                        setActiveTab('STARGATE_DIALER');
                        setDialStatusMessage(
                          `★ Ваш мир «${created.worldName}» создан! Уникальный номер #${created.uniqueWorldCode} набран на Звёздных Вратах — нажмите «Войти в Звёздные Врата»!`
                        );
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs border-2 border-yellow-300 shadow-lg"
                    >
                      ✓ СОЗДАТЬ ПОЛЬЗОВАТЕЛЬСКИЙ МИР И НАБРАТЬ ЕГО НОМЕР НА ЗВЁЗДНЫХ ВРАТАХ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
