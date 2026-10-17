import React from 'react';

export interface CockpitHudMaskProps {
  speed: number;
  maxSpeed: number;
  frontShield: number;
  aftShield: number;
  converterActive: boolean;
  solarFluxPct: number;
  fuel: number;
  radarScale: number;
  radarShipsOnly: boolean;
  radarEngineFilter?: string;
  autopilotTargetName?: string;
  flightMessage?: string;
  systemName?: string;
  isUnderAttack?: boolean;
  gravConverterTons?: number;
  maxShipMassTons?: number;
  onSimulateShieldHitTons?: (tons?: number) => void;
  onToggleShipsOnly?: () => void;
  onToggleConverter?: () => void;
  onToggleAutopilot?: () => void;
}

/**
 * Неоновая HUD-маска кокпита космического корабля
 * Создана в точности по загруженному дизайну:
 * - 80% прозрачность подложки с вырезом под 3D-радар
 * - Радар (cx=430, cy=436, rx=142, ry=56) — натуральные 3D-пропорции без сплющивания
 * - Низ радара точно примыкает к информационной строке (без пустого зазора)
 * - Радужная дуга щита R=28 (крупная, пропорциональная, без наплыва на надписи)
 * - Сплошная информационная строка без лишних разделителей и насечек
 * - Прибор CAPACITOR: показывает рабочую ёмкость гравитационного конвертора в тоннах
 *   (при ударе в 1 т ёмкость падает с 60 т до 59 т; при 0 т корабль распадается на блоки!)
 */
export const CockpitHudMask: React.FC<CockpitHudMaskProps> = ({
  speed,
  frontShield,
  converterActive,
  solarFluxPct: _solarFluxPct,
  radarScale = 10000,
  autopilotTargetName,
  flightMessage,
  systemName,
  isUnderAttack = false,
  gravConverterTons,
  maxShipMassTons = 60,
  onSimulateShieldHitTons,
}) => {
  // Расчет параметров
  const curSpeed = Math.max(0, Math.round(speed));
  const isOvercharge = converterActive && curSpeed > 100;
  const speedColor = isOvercharge ? '#ff3366' : '#00e5ff';

  // Щит (0..200%) с выверенным радиусом R=28 (как на эталонном эскизе!)
  const shieldVal = Math.max(0, Math.min(200, Math.round(frontShield)));
  const shieldAngleDeg = -180 + (shieldVal / 200) * 180;
  const shieldRad = (shieldAngleDeg * Math.PI) / 180;
  const shieldArcR = 28;
  const needleRelX = Math.cos(shieldRad) * shieldArcR;
  const needleRelY = Math.sin(shieldRad) * shieldArcR;

  // ГРАВИТАЦИОННЫЙ КОНВЕРТОР (CAPACITOR) В ТОННАХ:
  // Максимальная ёмкость конвертора = масса корабля (напр. 60 т).
  // Коэффициент обратного удара в конвертор зависит от текущей силы щита:
  // • При щите 200%: урон 0.1 т на 1 т удара (коэфф. 0.1)
  // • При щите 100%: урон 0.5 т на 1 т удара (коэфф. 0.5)
  // • При щите 1%: урон 1.0 т на 1 т удара (коэфф. 1.0)
  // При ёмкости = 0 т конвертор теряет способность удерживать блоки, и корабль разлетается!
  const effectiveMaxMass = Math.max(10, Math.round(maxShipMassTons ?? 60));
  const effectiveConverterTons =
    gravConverterTons !== undefined
      ? Math.max(0, Number(gravConverterTons.toFixed(1)))
      : effectiveMaxMass;
  const capRatio = Math.max(0, Math.min(1, effectiveConverterTons / effectiveMaxMass));
  const totalCapBars = 6;
  const activeCapBars = Math.min(totalCapBars, Math.ceil(capRatio * totalCapBars));
  const isCapCritical = effectiveConverterTons <= 0;
  const isCapLow = capRatio < 0.25;
  const capColor = isCapCritical ? '#ef4444' : isCapLow ? '#f59e0b' : '#00e5ff';

  // Коэффициент обратного удара по шкале силы щита (200% -> 0.1, 100% -> 0.5, 1% -> 1.0)
  let currentBackHitCoeff = 1.0;
  if (shieldVal >= 100) {
    const t = Math.min(1, (shieldVal - 100) / 100);
    currentBackHitCoeff = 0.5 - t * 0.4;
  } else {
    const t = Math.max(0, shieldVal) / 100;
    currentBackHitCoeff = 1.0 - t * 0.5;
  }

  // Баланс мощности (Thrust vs Shield)
  const powerPct = converterActive ? Math.min(200, curSpeed) : 100;
  const powerSliderNorm = Math.max(0, Math.min(1, powerPct / 200));

  // Текущее бортовое время для единой строки статуса
  const [clockStr, setClockStr] = React.useState(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  });
  React.useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setClockStr(d.toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const singleInfoText = isCapCritical
    ? `⚠️ КРИТИЧЕСКИЙ ОТКАЗ: ЕМКОСТЬ ГРАВИ-КОНВЕРТОРА 0 Т! РАСПАД СВЯЗКИ — КОРАБЛЬ РАЗЛЕТЕЛСЯ НА БЛОКИ!`
    : isUnderAttack
    ? `⚠️ ТРЕВОГА: КОРАБЛЬ АТАКОВАН! УДАРЫ ПО ЩИТУ · ГРАВИ-КОНВЕРТОР: ${effectiveConverterTons} Т / ${effectiveMaxMass} Т`
    : flightMessage
    ? `БОРТОВОЙ ЖУРНАЛ: ${flightMessage}`
    : autopilotTargetName
    ? `КУРС: ЗАХВАТ ЦЕЛИ [${autopilotTargetName}] · АВТОПИЛОТ ВЕДЁТ СБЛИЖЕНИЕ · РАДАР: ${radarScale.toLocaleString()} КМ`
    : `СИСТЕМА: ${systemName || 'LAVE'} · ГРАВИ-КОНВЕРТОР: ${effectiveConverterTons} Т / ${effectiveMaxMass} Т · РАДАР: ${radarScale.toLocaleString()} КМ · ОРУДИЯ: ГОТОВЫ`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden flex items-center justify-center">
      <svg
        viewBox="0 0 860 540"
        className="w-full h-full object-contain pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Неоновое свечение (Glow Filters) */}
          <filter id="neon-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="7" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neon-glow-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neon-glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Радужный градиент для шкалы щита */}
          <linearGradient id="shield-rainbow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff1744" />
            <stop offset="25%" stopColor="#ff9100" />
            <stop offset="50%" stopColor="#ffea00" />
            <stop offset="75%" stopColor="#00e676" />
            <stop offset="88%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#2979ff" />
          </linearGradient>

          {/* Градиент для трека питания Power Network */}
          <linearGradient id="power-track-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="55%" stopColor="#76ff03" />
            <stop offset="100%" stopColor="#ffd600" />
          </linearGradient>

          {/* Легкий градиент подсветки подложки консоли (80% прозрачности) */}
          <linearGradient id="panel-glass-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#031024" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#010612" stopOpacity="0.20" />
          </linearGradient>
        </defs>

        {/* =========================================================================
            1. ОБЩАЯ ПОДЛОЖКА ПРИБОРНОЙ ПАНЕЛИ (80% ПРОЗРАЧНОСТИ = ALPHA 0.20)
            Космос, звёзды и планеты пролетают позади консоли!
            ========================================================================= */}
        <g id="hud-console-underlay">
          <path
            fillRule="evenodd"
            d="
              M 8 402
              L 72 384
              L 128 384
              L 142 396
              L 290 396
              L 316 406
              L 386 384
              L 412 376
              L 448 376
              L 474 384
              L 544 406
              L 570 396
              L 718 396
              L 732 384
              L 788 384
              L 852 402
              L 852 522
              L 8 522
              Z
              M 430 380
              A 142 56 0 1 0 430 492
              A 142 56 0 1 0 430 380
              Z
            "
            fill="url(#panel-glass-bg)"
            stroke="none"
          />

          {/* Внешний светящийся контур консоли кокпита */}
          <path
            d="
              M 8 402
              L 72 384
              L 128 384
              L 142 396
              L 290 396
              L 316 406
              L 386 384
              L 412 376
              L 448 376
              L 474 384
              L 544 406
              L 570 396
              L 718 396
              L 732 384
              L 788 384
              L 852 402
              L 852 522
              L 8 522
              Z
            "
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.6"
            strokeOpacity="0.85"
            filter="url(#neon-glow-soft)"
          />

          {/* Нижняя окантовка панели */}
          <line
            x1="8"
            y1="522"
            x2="852"
            y2="522"
            stroke="#00e5ff"
            strokeWidth="1.8"
            strokeOpacity="0.9"
          />
        </g>

        {/* =========================================================================
            2. ЦЕНТРАЛЬНЫЙ 3D-РАДАР (ПРОЗРАЧНЫЙ ВЫРЕЗ, НЕ СПЛЮЩЕН, НИЗ ВПЛОТНУЮ К СТРОКЕ)
            cx=430, cy=436, rx=142, ry=56 — глубокая 3D-чаша, низ вплотную к информационной строке (y=496)
            Внутреннее пространство 100% прозрачно, открывая сверхчеткий 3D-радар на Canvas
            ========================================================================= */}
        <g id="radar-well-mask">
          {/* Внешнее кольцо-безель чаши радара */}
          <ellipse
            cx="430"
            cy="436"
            rx="142"
            ry="56"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2.0"
          />

          {/* Тонкий акцентный ободок */}
          <ellipse
            cx="430"
            cy="436"
            rx="144"
            ry="58"
            fill="none"
            stroke="rgba(0, 229, 255, 0.35)"
            strokeWidth="0.8"
          />

          {/* Отметка СЕВЕР (N / 000° FWD) */}
          <circle cx="430" cy="380" r="3.0" fill="#ffffff" />
          <text
            x="430"
            y="373"
            textAnchor="middle"
            fill="#00e5ff"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            N
          </text>

          {/* Отметка ЮГ (S / 180° AFT) — вплотную над информационной строкой */}
          <circle cx="430" cy="492" r="3.0" fill="#ffffff" />
          <text
            x="430"
            y="492"
            textAnchor="middle"
            fill="#00e5ff"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            S
          </text>

          {/* Отметка ЗАПАД (W / 270° Port) */}
          <circle cx="288" cy="436" r="3.0" fill="#ffffff" />
          <text
            x="278"
            y="439"
            textAnchor="end"
            fill="#00e5ff"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            W
          </text>

          {/* Отметка ВОСТОК (E / 090° Stbd) */}
          <circle cx="572" cy="436" r="3.0" fill="#ffffff" />
          <text
            x="582"
            y="439"
            textAnchor="start"
            fill="#00e5ff"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            E
          </text>
        </g>

        {/* =========================================================================
            3. БЛОК 1 (КРАЙНИЙ СЛЕВА): SPEED (ШКАЛА 0-300 + ЦИФРОВОЙ СПИДОМЕТР)
            ========================================================================= */}
        <g id="hud-block-speed" transform="translate(18, 412)">
          {/* Рамка блока SPEED со скошенными углами */}
          <path
            d="
              M 0 6
              L 6 0
              L 116 0
              L 116 68
              L 110 74
              L 0 74
              Z
            "
            fill="rgba(2, 10, 24, 0.4)"
            stroke="#00e5ff"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Иконка и заголовок [+] SPEED */}
          <g transform="translate(8, 14)">
            <circle cx="5" cy="0" r="4" fill="none" stroke="#00e5ff" strokeWidth="1" />
            <line x1="5" y1="-6" x2="5" y2="6" stroke="#00e5ff" strokeWidth="1" />
            <line x1="-1" y1="0" x2="11" y2="0" stroke="#00e5ff" strokeWidth="1" />
            <text
              x="16"
              y="3"
              fill="#00e5ff"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              SPEED
            </text>
          </g>

          {/* Вертикальная шкала со ступенями: 300, 200, 100, 0 */}
          <g transform="translate(12, 28)" fontSize="7" fontFamily="monospace" fill="#94a3b8">
            <line x1="12" y1="0" x2="12" y2="38" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1" />

            <line x1="9" y1="0" x2="12" y2="0" stroke="#00e5ff" strokeWidth="1" />
            <text x="7" y="2.5" textAnchor="end">300</text>

            <line x1="9" y1="12" x2="12" y2="12" stroke="#00e5ff" strokeWidth="1" />
            <text x="7" y="14.5" textAnchor="end">200</text>

            <line x1="9" y1="24" x2="12" y2="24" stroke="#00e5ff" strokeWidth="1" />
            <text x="7" y="26.5" textAnchor="end">100</text>

            <line x1="9" y1="36" x2="12" y2="36" stroke="#00e5ff" strokeWidth="1" />
            <text x="7" y="38.5" textAnchor="end">0</text>

            {/* Бегунок текущей скорости на вертикальной шкале */}
            {(() => {
              const clamped = Math.max(0, Math.min(300, curSpeed));
              const markY = 36 - (clamped / 300) * 36;
              return (
                <polygon
                  points={`14,${markY} 18,${markY - 2.5} 18,${markY + 2.5}`}
                  fill={speedColor}
                />
              );
            })()}
          </g>

          {/* Большие цифровые показатели скорости */}
          <text
            x="66"
            y="52"
            textAnchor="middle"
            fill={speedColor}
            fontSize="26"
            fontFamily="'Courier New', monospace"
            fontWeight="bold"
            filter={isOvercharge ? 'url(#neon-glow-red)' : 'url(#neon-glow-soft)'}
          >
            {curSpeed}
          </text>
          <text
            x="66"
            y="64"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            km/s
          </text>

          {/* Правая неоновая дуга спидометра */}
          <path
            d="M 94 28 A 20 20 0 0 1 106 58"
            fill="none"
            stroke={speedColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            filter="url(#neon-glow-soft)"
          />
        </g>

        {/* =========================================================================
            4. БЛОК 2 (ВТОРОЙ СЛЕВА): SHIELD
            ИДЕАЛЬНЫЙ РАДИУС R=32 (БЕЗ НАПЛЫВОВ НА НАДПИСИ И СВОБОДНЫЕ ПОЛЯ!)
            ========================================================================= */}
        <g id="hud-block-shield" transform="translate(148, 412)">
          {/* Рамка блока SHIELD */}
          <path
            d="
              M 0 6
              L 6 0
              L 126 0
              L 126 68
              L 120 74
              L 0 74
              Z
            "
            fill="rgba(2, 10, 24, 0.4)"
            stroke="#00e5ff"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Заголовок SHIELD со значком щита */}
          <g transform="translate(8, 13)">
            <path
              d="M 2 -3 L 6 -1 L 6 3 L 2 6 L -2 3 L -2 -1 Z"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1"
            />
            <text
              x="13"
              y="3"
              fill="#00e5ff"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              SHIELD
            </text>
          </g>

          {/* Полукруглая радужная шкала щита (выверенный радиус R=28 точно по эталону!) */}
          <g transform="translate(63, 56)">
            {/* Фоновая подложка дуги */}
            <path
              d="M -28 0 A 28 28 0 0 1 28 0"
              fill="none"
              stroke="rgba(15, 23, 42, 0.9)"
              strokeWidth="5.5"
            />

            {/* Активная радужная дуга щита (от красного к синему, заполнение до текущего уровня) */}
            <path
              d="M -28 0 A 28 28 0 0 1 28 0"
              fill="none"
              stroke="url(#shield-rainbow-grad)"
              strokeWidth="4.6"
              strokeDasharray={`${Math.max(1, (shieldVal / 200) * 87.96)} 100`}
              strokeLinecap="round"
              filter="url(#neon-glow-soft)"
            />

            {/* Засечки и метки вокруг дуги с выверенным отступом от заголовка SHIELD */}
            <text x="-36" y="2" textAnchor="end" fill="#ff1744" fontSize="6.5" fontFamily="monospace">
              0
            </text>
            <text x="-22" y="-19" textAnchor="middle" fill="#ff9100" fontSize="6.5" fontFamily="monospace">
              50
            </text>
            <text x="0" y="-31" textAnchor="middle" fill="#00e5ff" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
              100
            </text>
            <text x="22" y="-19" textAnchor="middle" fill="#00e5ff" fontSize="6.5" fontFamily="monospace">
              150
            </text>
            <text x="36" y="2" textAnchor="start" fill="#2979ff" fontSize="6.5" fontFamily="monospace">
              200%
            </text>

            {/* Стрелочный маркер на текущем значении щита */}
            <circle
              cx={needleRelX}
              cy={needleRelY}
              r="2.8"
              fill="#ffffff"
              filter="url(#neon-glow-cyan)"
            />

            {/* Центральная неоновая иконка щита в середине дуги */}
            <g transform="translate(0, -11)">
              <path
                d="M 0 -6 L 6 -3 L 5 3 L 0 7 L -5 3 L -6 -3 Z"
                fill="rgba(0, 229, 255, 0.25)"
                stroke="#00e5ff"
                strokeWidth="1.2"
                filter="url(#neon-glow-soft)"
              />
            </g>

            {/* Цифровой процент щита под иконкой */}
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#00e5ff"
              fontSize="11"
              fontFamily="'Courier New', monospace"
              fontWeight="bold"
            >
              {shieldVal}%
            </text>
          </g>
        </g>

        {/* =========================================================================
            5. БЛОК 3 (ВТОРОЙ СПРАВА): CAPACITOR / ГРАВИ-КОНВЕРТОР (ЕМКОСТЬ В ТОННАХ)
            Показывает рабочую ёмкость гравитационного конвертора (напр. 59 т из 60 т).
            Удар по щиту в 1 т снижает емкость на 1 т.
            При 0 т конвертор теряет способность удерживать блоки, и корабль разлетается!
            ========================================================================= */}
        <g
          id="hud-block-capacitor"
          transform="translate(586, 412)"
          className="cursor-pointer pointer-events-auto"
          onClick={() => {
            if (onSimulateShieldHitTons) {
              onSimulateShieldHitTons(1.0);
            }
          }}
        >
          <title>{`Гравитационный Конвертор: ${effectiveConverterTons} т из ${effectiveMaxMass} т. При щите ${shieldVal}% обратный урон ×${currentBackHitCoeff.toFixed(2)} (при 200% = 0.1т, при 100% = 0.5т, при 1% = 1.0т). Нажмите для теста удара (-1 т)!`}</title>

          {/* Рамка блока CAPACITOR */}
          <path
            d="
              M 0 0
              L 100 0
              L 106 6
              L 106 74
              L 6 74
              L 0 68
              Z
            "
            fill="rgba(2, 10, 24, 0.45)"
            stroke={capColor}
            strokeWidth="1.2"
            strokeOpacity="0.85"
            filter={isCapCritical ? 'url(#neon-glow-red)' : undefined}
          />

          {/* Заголовок с молнией / грави-символом */}
          <g transform="translate(8, 14)">
            <path
              d="M 3 -5 L -2 0 L 2 0 L -1 6 L 5 1 L 1 1 Z"
              fill={capColor}
            />
            <text
              x="13"
              y="3"
              fill={capColor}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              CAPACITOR
            </text>
            <text
              x="69"
              y="3"
              fill={isCapCritical ? '#ef4444' : isCapLow ? '#f59e0b' : '#38bdf8'}
              fontSize="6.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              ГРАВИ
            </text>
          </g>

          {/* Левые ступенчатые деления */}
          <g transform="translate(14, 25)" stroke={capColor} strokeWidth="1" opacity="0.65">
            <line x1="0" y1="4" x2="6" y2="4" />
            <line x1="0" y1="12" x2="6" y2="12" />
            <line x1="0" y1="20" x2="6" y2="20" />
            <line x1="0" y1="28" x2="6" y2="28" />
            <line x1="0" y1="4" x2="0" y2="28" />
          </g>

          {/* Сегменты конвертора (горизонтальные полосы емкости) */}
          <g transform="translate(34, 24)">
            {Array.from({ length: totalCapBars }).map((_, idx) => {
              const barIdxFromBottom = totalCapBars - 1 - idx;
              const isFilled = barIdxFromBottom < activeCapBars;
              const y = idx * 6;
              return (
                <rect
                  key={idx}
                  x="0"
                  y={y}
                  width="26"
                  height="4.2"
                  fill={isFilled ? capColor : 'rgba(15, 23, 42, 0.8)'}
                  stroke={isFilled ? capColor : 'rgba(51, 65, 85, 0.4)'}
                  strokeWidth="0.8"
                  filter={isFilled ? 'url(#neon-glow-soft)' : undefined}
                />
              );
            })}
          </g>

          {/* Индикатор коэффициента обратного удара */}
          <g transform="translate(86, 38)">
            <text x="0" y="0" textAnchor="middle" fill="#64748b" fontSize="5" fontFamily="monospace">
              ОБРАТН
            </text>
            <text
              x="0"
              y="9"
              textAnchor="middle"
              fill={currentBackHitCoeff <= 0.2 ? '#22c55e' : currentBackHitCoeff <= 0.6 ? '#38bdf8' : '#f59e0b'}
              fontSize="7"
              fontFamily="monospace"
              fontWeight="bold"
            >
              ×{currentBackHitCoeff.toFixed(2)}
            </text>
          </g>

          {/* Рабочая ёмкость конвертора В ТОННАХ (не проценты!) */}
          <text
            x="47"
            y="65"
            textAnchor="middle"
            fill={capColor}
            fontSize="10.5"
            fontFamily="'Courier New', monospace"
            fontWeight="bold"
            filter={isCapCritical ? 'url(#neon-glow-red)' : undefined}
          >
            {effectiveConverterTons.toFixed(effectiveConverterTons % 1 === 0 ? 0 : 1)} Т
          </text>

          {/* Максимальный предел емкости конвертора (= масса корабля в тоннах) */}
          <text
            x="86"
            y="65"
            textAnchor="middle"
            fill="#64748b"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            /{effectiveMaxMass}т
          </text>

          {/* Предупреждение при аварийном падении ёмкости */}
          {isCapCritical && (
            <text
              x="53"
              y="72"
              textAnchor="middle"
              fill="#ef4444"
              fontSize="6"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.3"
            >
              ОТКАЗ: РАЗЛЁТ БЛОКОВ
            </text>
          )}
        </g>

        {/* =========================================================================
            6. БЛОК 4 (КРАЙНИЙ СПРАВА): POWER NETWORK (СЛАЙДЕР БАЛАНСА И СЕТИ)
            ========================================================================= */}
        <g id="hud-block-power" transform="translate(702, 412)">
          {/* Рамка блока POWER NETWORK */}
          <path
            d="
              M 0 0
              L 134 0
              L 140 6
              L 140 74
              L 0 74
              Z
            "
            fill="rgba(2, 10, 24, 0.4)"
            stroke="#00e5ff"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Иконка ромбовидной сети и заголовок */}
          <g transform="translate(8, 14)">
            <polygon
              points="4,-4 8,0 4,4 0,0"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="1"
            />
            <circle cx="4" cy="0" r="1.5" fill="#00e5ff" />
            <text
              x="14"
              y="3"
              fill="#00e5ff"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="0.5"
            >
              POWER NETWORK
            </text>
          </g>

          {/* Горизонтальный трек-слайдер с градиентом от бирюзового к желтому */}
          <g transform="translate(10, 36)">
            {/* Фоновый паз слайдера */}
            <rect
              x="0"
              y="0"
              width="120"
              height="4"
              rx="2"
              fill="rgba(15, 23, 42, 0.9)"
              stroke="rgba(0, 229, 255, 0.3)"
              strokeWidth="0.8"
            />

            {/* Активная заполненная полоска */}
            <rect
              x="0"
              y="0"
              width={120 * Math.max(0.05, powerSliderNorm)}
              height="4"
              rx="2"
              fill="url(#power-track-grad)"
              filter="url(#neon-glow-soft)"
            />

            {/* Круглый ползунок на шкале */}
            <circle
              cx={120 * powerSliderNorm}
              cy="2"
              r="4.2"
              fill="#ffffff"
              filter="url(#neon-glow-cyan)"
            />

            {/* Калибровочные риски под треком */}
            <g transform="translate(0, 8)" stroke="#00e5ff" strokeWidth="0.8" opacity="0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <line
                  key={i}
                  x1={i * 5}
                  y1="0"
                  x2={i * 5}
                  y2={i % 6 === 0 ? 5 : 2.5}
                />
              ))}
            </g>

            {/* Значок молнии и процент справа */}
            <g transform="translate(100, 22)">
              <path
                d="M 2 -4 L -1 0 L 2 0 L -1 5 L 4 1 L 1 1 Z"
                fill="#ffd600"
              />
              <text
                x="8"
                y="3"
                fill="#ffd600"
                fontSize="10"
                fontFamily="'Courier New', monospace"
                fontWeight="bold"
              >
                {Math.round(powerPct)}%
              </text>
            </g>
          </g>
        </g>

        {/* =========================================================================
            7. НИЖНЯЯ СТАТУСНАЯ ЛЕНТА (СПЛОШНАЯ ИНФОРМАЦИОННАЯ СТРОКА БЕЗ РАЗДЕЛИТЕЛЕЙ)
            Сплошная полоса на всю ширину кокпита с одним сообщением (без разбивок и ячеек)
            ========================================================================= */}
        <g id="hud-bottom-ribbon" transform="translate(0, 496)">
          {/* Сплошная верхняя неоновая линия над информационной строкой */}
          <line
            x1="14"
            y1="0"
            x2="846"
            y2="0"
            stroke="#00e5ff"
            strokeWidth="1.6"
            strokeOpacity="0.85"
          />

          {/* Сплошная темная подложка строки */}
          <rect
            x="14"
            y="2"
            width="832"
            height="26"
            fill="rgba(2, 6, 18, 0.70)"
            stroke="none"
          />

          {/* Сплошная нижняя окантовка строки */}
          <line
            x1="14"
            y1="28"
            x2="846"
            y2="28"
            stroke="rgba(0, 229, 255, 0.4)"
            strokeWidth="1"
          />

          {/* ЕДИНОЕ СООБЩЕНИЕ НА ВСЮ СТРОКУ БЕЗ РАЗДЕЛИТЕЛЕЙ */}
          <text
            x="430"
            y="18"
            textAnchor="middle"
            fill={isUnderAttack ? '#ff1744' : '#e2e8f0'}
            fontSize="9.5"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="0.3"
          >
            {singleInfoText}
          </text>
        </g>
      </svg>
    </div>
  );
};
