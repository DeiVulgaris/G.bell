import React, {useState} from 'react';
import {
  X,
  Sparkles,
  Zap,
  Compass,
  RotateCcw,
  Globe,
  Radio,
  Navigation,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {getStarRadiationProfile} from '../data/stellarPhysicsEngine';

export interface GalaxySystemRef {
  id: number;
  name: string;
  econ: string;
  danger: string;
  color: string;
  isOldGalaxy?: boolean;
}

export interface DominatorSpacetimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSystemId: number;
  systems: GalaxySystemRef[];
  isVacuumConversionActive: boolean;
  onToggleVacuumConversion: () => void;
  boundaryMatterKg: number;
  uraniumKg: number;
  plutoniumKg: number;
  deployedStargatesCount: number;
  onDeployStargate: () => void;
  onSpacetimeJump: (customPointLabel: string, targetSysId: number) => void;
  onAddFuelStock?: (type: 'URANIUM' | 'PLUTONIUM' | 'BOUNDARY', amountKg: number) => void;
}

export const DominatorSpacetimeModal: React.FC<DominatorSpacetimeModalProps> = ({
  isOpen,
  onClose,
  currentSystemId,
  systems,
  isVacuumConversionActive,
  onToggleVacuumConversion,
  boundaryMatterKg,
  uraniumKg,
  plutoniumKg,
  deployedStargatesCount,
  onDeployStargate,
  onSpacetimeJump,
  onAddFuelStock,
}) => {
  const [selectedTargetSysId, setSelectedTargetSysId] = useState<number>(
    currentSystemId === 0 ? 1 : 0
  );
  const [customDestinationName, setCustomDestinationName] = useState<string>(
    'Сингулярная Координата [Ω-7000:3000]'
  );
  const [jumpSubmode, setJumpSubmode] = useState<'SYSTEM' | 'CUSTOM_METRIC' | 'STARGATE'>('SYSTEM');

  if (!isOpen) return null;

  const currentSys = systems[currentSystemId] || systems[0];
  const targetSys = systems[selectedTargetSysId] || systems[0];

  const handleExecuteJump = () => {
    let label = '';
    if (jumpSubmode === 'STARGATE') {
      label = `Звёздные Врата Сектора «${targetSys.name}» (Червоточина #${deployedStargatesCount})`;
    } else if (jumpSubmode === 'CUSTOM_METRIC') {
      label = customDestinationName.trim() || 'Произвольная Точка Пространства-Времени';
    } else {
      label = `Сектор ${targetSys.name} (Координата Эклиптики)`;
    }
    onSpacetimeJump(label, selectedTargetSysId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border-2 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.4)] text-slate-100 overflow-hidden">
        {/* Заголовок */}
        <div className="p-3.5 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b-2 border-purple-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-purple-300 bg-purple-900/60 flex items-center justify-center text-purple-200">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-purple-200 tracking-wider flex items-center gap-2">
                <span>ЭЛИТНЫЙ КЛАСС — «ДОМИНАТОРЫ»</span>
                <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.2 font-black rounded">
                  ВЫСШАЯ МЕХАНИКА
                </span>
              </div>
              <div className="text-[10px] text-purple-300/80">
                Установка Вакуумной Конвертации &middot; Технология Пространства-Времени &middot; Установщики Звёздных Врат
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-purple-400/60 hover:border-white hover:bg-purple-900/50 text-purple-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело модала */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Блок 1: Установка Вакуумной Конвертации (Катализатор - Граничное вещество) */}
          <div className="p-3.5 border-2 border-purple-500/70 bg-purple-950/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-purple-500/30 pb-2">
              <div className="flex items-center gap-2 font-extrabold text-purple-300 text-sm">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>1. УСТАНОВКА ВАКУУМНОЙ КОНВЕРТАЦИИ ЭНЕРГИИ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-300">
                  Статус:
                </span>
                <span
                  className={`px-2 py-0.5 font-black text-xs border ${
                    isVacuumConversionActive
                      ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                      : 'border-slate-600 bg-slate-900 text-slate-400'
                  }`}
                >
                  {isVacuumConversionActive ? 'АКТИВНА (ГЕНЕРАЦИЯ)' : 'ОТКЛЮЧЕНА'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 bg-black/70 border border-purple-400/40 space-y-1">
                <div className="text-[10px] text-purple-300 font-bold uppercase">
                  Катализатор процесса:
                </div>
                <div className="text-sm font-extrabold text-white flex items-center justify-between">
                  <span>Граничное вещество:</span>
                  <span className="text-yellow-300 font-mono">{boundaryMatterKg.toFixed(2)} кг</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Материя на грани размыкания связей
                </div>
              </div>

              <div className="p-2.5 bg-black/70 border border-cyan-400/40 space-y-1">
                <div className="text-[10px] text-cyan-300 font-bold uppercase">
                  Физический закон (E = Δm · c²):
                </div>
                <div className="text-xs font-bold text-slate-200">
                  ⚡ 100% массы критического вещества в минуту из вакуума (1 кг / 1 экв./мин)
                </div>
                <div className="text-[10px] text-emerald-300">
                  Граничное вещество: 100% массы в чистую энергию!
                </div>
              </div>

              <div className="p-2.5 bg-black/70 border border-amber-400/40 flex flex-col justify-between gap-2">
                <div className="text-[10px] text-amber-300 font-bold uppercase">
                  Управление конвертером:
                </div>
                <button
                  type="button"
                  onClick={onToggleVacuumConversion}
                  disabled={boundaryMatterKg <= 0.05 && !isVacuumConversionActive}
                  className={`w-full py-2 px-2 border font-extrabold text-xs transition-colors ${
                    isVacuumConversionActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-300'
                      : 'bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white border-purple-300'
                  }`}
                >
                  {isVacuumConversionActive
                    ? '⏹️ ОСТАНОВИТЬ КОНВЕРТАЦИЮ ВАКУУМА'
                    : '⚡ ЗАПУСТИТЬ ВАКУУМНУЮ КОНВЕРТАЦИЮ'}
                </button>
              </div>
            </div>

            {boundaryMatterKg <= 0.05 && !isVacuumConversionActive && (
              <div className="p-2 bg-rose-950/40 border border-rose-500/60 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Внимание: запас граничного вещества исчерпан ({boundaryMatterKg.toFixed(2)} кг). 
                  Для запуска требуется минимум 1 кг граничного вещества в качестве катализатора.
                </span>
                {onAddFuelStock && (
                  <button
                    type="button"
                    onClick={() => onAddFuelStock('BOUNDARY', 25)}
                    className="ml-auto px-2 py-0.5 bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-[10px] shrink-0"
                  >
                    +25 кг граничного вещества
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Блок 2: Технология Пространства-Времени (Произвольная точка назначения в гиперпрыжке) */}
          <div className="p-3.5 border-2 border-cyan-500/70 bg-cyan-950/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-cyan-500/30 pb-2">
              <div className="flex items-center gap-2 font-extrabold text-cyan-300 text-sm">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>2. ТЕХНОЛОГИЯ ПРОСТРАНСТВА-ВРЕМЕНИ: ПРОИЗВОЛЬНЫЙ ГИПЕРПРЫЖОК</span>
              </div>
              <div className="text-[10px] text-yellow-300 font-bold bg-cyan-950 px-2 py-0.5 border border-cyan-400">
                ИСКРИВЛЕНИЕ МЕТРИКИ СИНГУЛЯРНОСТИ
              </div>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Элитный класс «Доминаторы» обладает технологией искривления пространства-времени, позволяющей 
              сформировать <b>любую конечную точку назначения в гиперпрыжке</b> — без привязки к фиксированным 
              звёздным путям или узловым маякам.
            </p>

            {/* Вкладки режима прыжка */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJumpSubmode('SYSTEM')}
                className={`px-3 py-1.5 border text-xs font-extrabold transition-colors ${
                  jumpSubmode === 'SYSTEM'
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : 'border-slate-700 bg-black text-slate-300 hover:border-cyan-400'
                }`}
              >
                🌌 Выбор Звёздного Сектора
              </button>
              <button
                type="button"
                onClick={() => setJumpSubmode('CUSTOM_METRIC')}
                className={`px-3 py-1.5 border text-xs font-extrabold transition-colors ${
                  jumpSubmode === 'CUSTOM_METRIC'
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : 'border-slate-700 bg-black text-slate-300 hover:border-cyan-400'
                }`}
              >
                📐 Произвольная Координата
              </button>
              <button
                type="button"
                onClick={() => setJumpSubmode('STARGATE')}
                className={`px-3 py-1.5 border text-xs font-extrabold transition-colors ${
                  jumpSubmode === 'STARGATE'
                    ? 'border-yellow-400 bg-yellow-400 text-black'
                    : 'border-slate-700 bg-black text-slate-300 hover:border-cyan-400'
                }`}
              >
                ⛩️ Через Звёздные Врата
              </button>
            </div>

            {/* Контент режимов */}
            {jumpSubmode === 'SYSTEM' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {systems.map((sys) => {
                  const isCurrent = sys.id === currentSystemId;
                  const isSelected = sys.id === selectedTargetSysId;
                  const starRad = getStarRadiationProfile(
                    sys.name + (sys.isOldGalaxy ? ' OMEGA-RELICT Старая Галактика' : '')
                  );
                  return (
                    <div
                      key={sys.id}
                      onClick={() => setSelectedTargetSysId(sys.id)}
                      className={`p-2.5 border cursor-pointer transition-all space-y-1.5 ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                          : isCurrent
                          ? 'border-emerald-500/60 bg-emerald-950/20'
                          : 'border-slate-800 bg-black/70 hover:border-cyan-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black">
                        <span style={{color: sys.color}}>{sys.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] text-emerald-400 font-bold">[ТЕКУЩИЙ]</span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400">
                        {sys.econ} &middot; {sys.danger}
                      </div>

                      {/* Астрофизический профиль звезды сектора */}
                      <div className="pt-1 border-t border-slate-800/80 space-y-0.5 text-[8.5px] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold" style={{color: starRad.starColorHex}}>
                            ★ {starRad.spectralCode}
                          </span>
                          <span className={starRad.isGiant ? 'text-cyan-300 font-bold' : starRad.isDwarf ? 'text-rose-300' : 'text-yellow-300'}>
                            K_rad: {starRad.totalRadCoeff.toFixed(2)}&times;
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[7.5px] text-slate-400">
                          <span>☀️ Фот.: {starRad.photonPotential.toFixed(2)}&times;</span>
                          <span>⚡ Гамма: {starRad.gammaPotential.toFixed(2)}&times;</span>
                        </div>
                      </div>

                      {sys.isOldGalaxy && (
                        <div className="text-[9px] text-fuchsia-300 font-bold mt-0.5">
                          ☢️ Старая галактика (Ω-γ)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {jumpSubmode === 'CUSTOM_METRIC' && (
              <div className="p-3 bg-black/80 border border-cyan-500/40 space-y-2">
                <label className="block text-[11px] text-cyan-300 font-bold">
                  Задайте произвольную точку назначения метрики пространства-времени:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDestinationName}
                    onChange={(e) => setCustomDestinationName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-cyan-400 text-white font-mono text-xs focus:outline-none focus:border-yellow-400"
                    placeholder="Например: Орбита III Планеты системы Диона или Рукав Стрельца 99-X"
                  />
                  <select
                    value={selectedTargetSysId}
                    onChange={(e) => setSelectedTargetSysId(Number(e.target.value))}
                    className="px-3 py-2 bg-slate-900 border border-cyan-400 text-cyan-200 font-mono text-xs focus:outline-none"
                  >
                    {systems.map((s) => (
                      <option key={s.id} value={s.id}>
                        Базовый сектор: {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-[10px] text-slate-400">
                  Метрика перехода искривляется напрямую в указанную точку без промежуточных прыжков.
                </div>
              </div>
            )}

            {jumpSubmode === 'STARGATE' && (
              <div className="p-3 bg-black/80 border border-purple-500/40 space-y-2">
                <div className="text-purple-300 font-bold text-xs flex items-center justify-between">
                  <span>Сеть Звёздных Врат Доминаторов (Квантовые Червоточины):</span>
                  <span className="text-yellow-300">Развёрнуто: {deployedStargatesCount} врат</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Мгновенный переход через установленные Звёздные Врата в сектор «{targetSys.name}».
                </div>
              </div>
            )}

            {/* Кнопка инициации прыжка */}
            <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-cyan-500/20">
              <div className="text-[11px] text-slate-300">
                Точка назначения: <b className="text-yellow-300">{targetSys.name}</b> &middot; Режим: <b className="text-cyan-300">{jumpSubmode}</b>
              </div>
              <button
                type="button"
                onClick={handleExecuteJump}
                className="py-2.5 px-5 border-2 border-yellow-400 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(250,204,21,0.4)] flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>СОВЕРШИТЬ МГНОВЕННЫЙ ПЕРЕХОД ПРОСТРАНСТВА-ВРЕМЕНИ</span>
              </button>
            </div>
          </div>

          {/* Блок 3: Установщики Звёздных Врат (Развёртывание новой мегаструктуры) */}
          <div className="p-3.5 border-2 border-amber-500/70 bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/30 pb-2">
              <div className="flex items-center gap-2 font-extrabold text-amber-300 text-sm">
                <span>⛩️ 3. СТАТУС: УСТАНОВЩИКИ ЗВЁЗДНЫХ ВРАТ (STARGATE CONSTRUCTORS)</span>
              </div>
              <div className="text-xs text-yellow-300 font-bold">
                Врат в галактике: {deployedStargatesCount}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 text-[11px] text-slate-200 leading-relaxed">
                Доминаторы обладают исключительным правом и технологией монтирования невращающихся 
                стабильных порталов червоточин (Звёздных Врат) с 9 квантовыми шевронами. 
                Каждые развёрнутые Врата связывают текущий сектор с межгалактической магистралью.
              </div>
              <div>
                <button
                  type="button"
                  onClick={onDeployStargate}
                  className="w-full py-2.5 px-3 border border-amber-400 bg-amber-500/30 hover:bg-amber-400 hover:text-black text-amber-200 font-extrabold text-xs transition-colors"
                >
                  ⛩️ РАЗВЕРНУТЬ ЗВЁЗДНЫЕ ВРАТА В СЕКТОРЕ «{currentSys.name}»
                </button>
              </div>
            </div>
          </div>

          {/* Блок 4: Общая сводка топлива ГЭУ */}
          <div className="p-3 bg-black/80 border border-slate-700 space-y-2 text-[11px]">
            <div className="text-slate-300 font-bold uppercase flex items-center justify-between">
              <span>Склады топлива Реакторов ГЭУ:</span>
              {onAddFuelStock && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddFuelStock('URANIUM', 50)}
                    className="px-2 py-0.5 border border-orange-500 bg-orange-950/60 hover:bg-orange-500 hover:text-black text-orange-200 font-bold text-[10px]"
                  >
                    +50 кг Урана
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddFuelStock('PLUTONIUM', 50)}
                    className="px-2 py-0.5 border border-amber-500 bg-amber-950/60 hover:bg-amber-500 hover:text-black text-amber-200 font-bold text-[10px]"
                  >
                    +50 кг Плутония
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddFuelStock('BOUNDARY', 25)}
                    className="px-2 py-0.5 border border-purple-500 bg-purple-950/60 hover:bg-purple-500 hover:text-black text-purple-200 font-bold text-[10px]"
                  >
                    +25 кг Граничного
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 border border-orange-500/40 bg-slate-950">
                <div className="text-orange-400 font-bold">Урановое топливо:</div>
                <div className="text-white font-mono font-bold text-sm">{uraniumKg.toFixed(1)} кг</div>
                <div className="text-slate-500 text-[10px]">Критическое вещество деления</div>
              </div>
              <div className="p-2 border border-amber-500/40 bg-slate-950">
                <div className="text-amber-400 font-bold">Плутониевое топливо:</div>
                <div className="text-white font-mono font-bold text-sm">{plutoniumKg.toFixed(1)} кг</div>
                <div className="text-slate-500 text-[10px]">Высокообогащённый распад</div>
              </div>
              <div className="p-2 border border-purple-500/40 bg-slate-950">
                <div className="text-purple-400 font-bold">Граничное вещество:</div>
                <div className="text-white font-mono font-bold text-sm">{boundaryMatterKg.toFixed(1)} кг</div>
                <div className="text-slate-500 text-[10px]">Катализатор вакуума (1кг/1экв/мин)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя плашка */}
        <div className="p-3 bg-slate-950 border-t border-purple-500/40 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-400">
            Главная Энергетическая Установка &middot; Доминаторы &middot; Сингулярность
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-purple-400 hover:bg-purple-400 hover:text-black text-purple-200 font-bold text-xs transition-colors"
          >
            ЗАКРЫТЬ ПУЛЬТ ДОМИНАТОРОВ
          </button>
        </div>
      </div>
    </div>
  );
};
