import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Sun,
  Shield,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  SentinelBladeModification,
  SENTINEL_BLADE_MODS_META,
} from '../data/autonomousSentinelEngine';

export interface SentinelMine3DCanvasProps {
  bladesCount?: SentinelBladeModification;
  onSelectBladesCount?: (count: SentinelBladeModification) => void;
  width?: number;
  height?: number;
  interactive?: boolean;
  autoRotateDefault?: boolean;
  showModificationSelector?: boolean;
  showToolbar?: boolean;
  showBladeBadges?: boolean;
  className?: string;
  subTitle?: string;
}

/**
 * 3D-проекция точки (x, y, z) с углами рыскания (yaw) и тангажа (pitch)
 */
function project3D(
  x: number,
  y: number,
  z: number,
  cosY: number,
  sinY: number,
  cosP: number,
  sinP: number,
  cx: number,
  cy: number,
  scale: number
) {
  // Вращение вокруг оси Y (рыскание)
  const x1 = x * cosY + z * sinY;
  const y1 = y;
  const z1 = -x * sinY + z * cosY;

  // Вращение вокруг оси X (тангаж)
  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  return {
    sx: cx + x2 * scale,
    sy: cy + y2 * scale,
    sz: z2,
    rx: x2,
    ry: y2,
    rz: z2,
  };
}

export const SentinelMine3DCanvas: React.FC<SentinelMine3DCanvasProps> = ({
  bladesCount = 6,
  onSelectBladesCount,
  width,
  height,
  interactive = true,
  autoRotateDefault = true,
  showModificationSelector = true,
  showToolbar = true,
  showBladeBadges = true,
  className = '',
  subTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeBlades, setActiveBlades] = useState<SentinelBladeModification>(bladesCount);
  const [yaw, setYaw] = useState<number>(0.65);
  const [pitch, setPitch] = useState<number>(0.32);
  const [zoom, setZoom] = useState<number>(1.05);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(autoRotateDefault);
  const [wireframeOnly, setWireframeOnly] = useState<boolean>(false);

  // Синхронизация при смене внешнего пропса
  useEffect(() => {
    setActiveBlades(bladesCount);
  }, [bladesCount]);

  const handleSelectBlades = (count: SentinelBladeModification) => {
    setActiveBlades(count);
    if (onSelectBladesCount) {
      onSelectBladesCount(count);
    }
  };

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const rotationAngleRef = useRef<number>(0);

  // Управление мышью (вращение 3D-модели со всех сторон)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !interactive) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => prev + dx * 0.009);
    setPitch((prev) => Math.max(-1.5, Math.min(1.5, prev + dy * 0.009)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(0.55, Math.min(2.4, prev + delta)));
  };

  // Сенсорные жесты для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive || e.touches.length !== 1) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !interactive || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setYaw((prev) => prev + dx * 0.009);
    setPitch((prev) => Math.max(-1.5, Math.min(1.5, prev + dy * 0.009)));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Рендерер 3D морской мины с пирамидками и мельничными лопастями
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let curYaw = yaw;
    let curPitch = pitch;

    const render = () => {
      if (isAutoRotate && !isDraggingRef.current) {
        curYaw += 0.006;
        rotationAngleRef.current += 0.003;
      } else {
        curYaw = yaw;
      }
      curPitch = pitch;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Глубокий космический фон
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Фоновые звёзды
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 35; i++) {
        const sx = (i * 79 + 23) % w;
        const sy = (i * 53 + 47) % h;
        ctx.globalAlpha = 0.15 + (i % 4) * 0.1;
        ctx.beginPath();
        ctx.arc(sx, sy, i % 3 === 0 ? 1.2 : 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      const cx = w / 2;
      const cy = h / 2;
      const baseScale = Math.min(w, h) * 0.28 * zoom;

      // Матрица вращения
      const cosY = Math.cos(curYaw);
      const sinY = Math.sin(curYaw);
      const cosP = Math.cos(curPitch);
      const sinP = Math.sin(curPitch);

      // Вектор освещения от Солнца (направлен сверху-слева)
      const lightDir = { x: -0.6, y: -0.5, z: 0.62 };
      const lightLen = Math.sqrt(
        lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z
      );
      lightDir.x /= lightLen;
      lightDir.y /= lightLen;
      lightDir.z /= lightLen;

      // 1. Ореол фотонной энергии вокруг часового
      const activeMeta = SENTINEL_BLADE_MODS_META[activeBlades];
      const haloGrad = ctx.createRadialGradient(
        cx,
        cy,
        baseScale * 0.6,
        cx,
        cy,
        baseScale * 2.2
      );
      haloGrad.addColorStop(0, `${activeMeta.colorHex}35`);
      haloGrad.addColorStop(0.5, `${activeMeta.colorHex}12`);
      haloGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseScale * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Радиус центральной сферы морской мины
      const rMine = 0.58;

      // -----------------------------------------------------------------------
      // 2. ГЕНЕРАЦИЯ РОЖКОВ В ВИДЕ ПИРАМИДОК (МОРСКАЯ МИНА)
      // -----------------------------------------------------------------------
      // Рожки-пирамидки распределены по сфере:
      // 4 шт. в верхней полусфере (широта +38°),
      // 4 шт. в нижней полусфере (широта -38°),
      // 4 шт. на экваторе (широта 0°),
      // 1 шт. на северном полюсе (+90°), 1 шт. на южном полюсе (-90°).
      interface PyramidHornData {
        apex: { x: number; y: number; z: number };
        base: { x: number; y: number; z: number }[];
        centerZ: number;
        hornIndex: number;
      }

      const horns: PyramidHornData[] = [];
      const hornConfigs: { lat: number; lon: number }[] = [
        // Верхний пояс
        { lat: 0.66, lon: 0 },
        { lat: 0.66, lon: Math.PI * 0.5 },
        { lat: 0.66, lon: Math.PI },
        { lat: 0.66, lon: Math.PI * 1.5 },
        // Нижний пояс
        { lat: -0.66, lon: Math.PI * 0.25 },
        { lat: -0.66, lon: Math.PI * 0.75 },
        { lat: -0.66, lon: Math.PI * 1.25 },
        { lat: -0.66, lon: Math.PI * 1.75 },
        // Экватор
        { lat: 0, lon: Math.PI * 0.25 },
        { lat: 0, lon: Math.PI * 0.75 },
        { lat: 0, lon: Math.PI * 1.25 },
        { lat: 0, lon: Math.PI * 1.75 },
        // Полюса
        { lat: Math.PI * 0.5, lon: 0 },
        { lat: -Math.PI * 0.5, lon: 0 },
      ];

      const hornBaseHalf = 0.085; // полуширина основания пирамидки
      const hornApexHeight = 0.96; // высота вершины пирамидки (торчит из шара 0.58 до 0.96)

      hornConfigs.forEach((cfg, idx) => {
        const cosLat = Math.cos(cfg.lat);
        const sinLat = Math.sin(cfg.lat);
        const cosLon = Math.cos(cfg.lon);
        const sinLon = Math.sin(cfg.lon);

        // Радиальный нормальный вектор вершины пирамидки
        const dx = cosLat * sinLon;
        const dy = -sinLat;
        const dz = cosLat * cosLon;

        // Касательные векторы для построения квадратного основания
        let ux = -sinLon;
        let uy = 0;
        let uz = cosLon;
        if (Math.abs(dy) > 0.9) {
          ux = 1;
          uy = 0;
          uz = 0;
        }
        const vx = uy * dz - uz * dy;
        const vy = uz * dx - ux * dz;
        const vz = ux * dy - uy * dx;

        // Вершина пирамидки
        const apexPt = {
          x: dx * hornApexHeight,
          y: dy * hornApexHeight,
          z: dz * hornApexHeight,
        };

        // 4 точки основания пирамидки на поверхности шара (r = rMine)
        const basePts = [
          {
            x: dx * rMine + (ux + vx) * hornBaseHalf,
            y: dy * rMine + (uy + vy) * hornBaseHalf,
            z: dz * rMine + (uz + vz) * hornBaseHalf,
          },
          {
            x: dx * rMine + (-ux + vx) * hornBaseHalf,
            y: dy * rMine + (-uy + vy) * hornBaseHalf,
            z: dz * rMine + (-uz + vz) * hornBaseHalf,
          },
          {
            x: dx * rMine + (-ux - vx) * hornBaseHalf,
            y: dy * rMine + (-uy - vy) * hornBaseHalf,
            z: dz * rMine + (-uz - vz) * hornBaseHalf,
          },
          {
            x: dx * rMine + (ux - vx) * hornBaseHalf,
            y: dy * rMine + (uy - vy) * hornBaseHalf,
            z: dz * rMine + (uz - vz) * hornBaseHalf,
          },
        ];

        // Проекция вершины для вычисления глубины Z
        const pApex = project3D(
          apexPt.x,
          apexPt.y,
          apexPt.z,
          cosY,
          sinY,
          cosP,
          sinP,
          cx,
          cy,
          baseScale
        );

        horns.push({
          apex: apexPt,
          base: basePts,
          centerZ: pApex.sz,
          hornIndex: idx,
        });
      });

      // -----------------------------------------------------------------------
      // 3. ГЕНЕРАЦИЯ СОЛНЕЧНЫХ ПАНЕЛЕЙ В ВИДЕ ЛОПАСТЕЙ СТАРЫХ ВЕТРЯНЫХ МЕЛЬНИЦ
      // -----------------------------------------------------------------------
      // Модификации: 4, 6 или 8 лопастей!
      // Каждая лопасть мельницы имеет:
      // • Центральный массивный лонжерон (деревянный/титановый брус)
      // • Решётчатую раму с поперечными рейками (lattice grid)
      // • Фотоэлектрическое полотно (парус мельницы), натянутое на решётку
      // • Характерный угол атаки (twist/pitch), придающий вид старинной мельницы
      interface WindmillBladeData {
        bladeIndex: number;
        angleRad: number;
        centerZ: number;
        hubPt: { x: number; y: number; z: number };
        tipPt: { x: number; y: number; z: number };
        frameLeftPts: { x: number; y: number; z: number }[];
        frameRightPts: { x: number; y: number; z: number }[];
      }

      const blades: WindmillBladeData[] = [];
      const numBlades = activeBlades;
      const bladeInnerR = rMine * 0.95;
      const bladeOuterR = 1.95; // размах крыла мельницы
      const bladeWidthRoot = 0.12;
      const bladeWidthTip = 0.28; // лопасть мельницы расширяется к концу!
      const bladeRibsCount = 6; // количество поперечных реек обрешётки

      for (let b = 0; b < numBlades; b++) {
        // Угол лопасти в плоскости вращения
        const bAngle = (b * Math.PI * 2) / numBlades + rotationAngleRef.current;
        const cosB = Math.cos(bAngle);
        const sinB = Math.sin(bAngle);

        // Направление лопасти (в плоскости XY в базовой системе координат)
        const dirX = cosB;
        const dirY = sinB;
        const dirZ = 0;

        // Поперечный вектор для ширины лопасти (с лёгким наклоном в 12° по Z как у крыла мельницы)
        const perpX = -sinB;
        const perpY = cosB;
        const twistZ = 0.16; // аэродинамический наклон паруса мельницы!

        const hubPt = {
          x: dirX * bladeInnerR,
          y: dirY * bladeInnerR,
          z: dirZ * bladeInnerR,
        };
        const tipPt = {
          x: dirX * bladeOuterR,
          y: dirY * bladeOuterR,
          z: dirZ * bladeOuterR,
        };

        const frameLeftPts: { x: number; y: number; z: number }[] = [];
        const frameRightPts: { x: number; y: number; z: number }[] = [];

        for (let r = 0; r <= bladeRibsCount; r++) {
          const t = r / bladeRibsCount;
          const currentR = bladeInnerR + (bladeOuterR - bladeInnerR) * t;
          const currentW = bladeWidthRoot + (bladeWidthTip - bladeWidthRoot) * t;

          // Левая кромка паруса мельницы
          frameLeftPts.push({
            x: dirX * currentR + perpX * (-currentW * 0.35),
            y: dirY * currentR + perpY * (-currentW * 0.35),
            z: -twistZ * t,
          });

          // Правая кромка (основное широкое полотно мельницы)
          frameRightPts.push({
            x: dirX * currentR + perpX * (currentW * 0.85),
            y: dirY * currentR + perpY * (currentW * 0.85),
            z: twistZ * t,
          });
        }

        // Проекция середины лопасти для сортировки по глубине Z
        const midPt = {
          x: dirX * (bladeInnerR + bladeOuterR) * 0.5,
          y: dirY * (bladeInnerR + bladeOuterR) * 0.5,
          z: 0,
        };
        const pMid = project3D(
          midPt.x,
          midPt.y,
          midPt.z,
          cosY,
          sinY,
          cosP,
          sinP,
          cx,
          cy,
          baseScale
        );

        blades.push({
          bladeIndex: b,
          angleRad: bAngle,
          centerZ: pMid.sz,
          hubPt,
          tipPt,
          frameLeftPts,
          frameRightPts,
        });
      }

      // -----------------------------------------------------------------------
      // 4. ФУНКЦИЯ ОТРИСОВКИ ОДНОЙ ЛОПАСТИ ВЕТРЯНОЙ МЕЛЬНИЦЫ
      // -----------------------------------------------------------------------
      const drawWindmillBlade = (blade: WindmillBladeData, isBackSide: boolean) => {
        // Проекция лонжерона (центрального бруса)
        const pHub = project3D(
          blade.hubPt.x,
          blade.hubPt.y,
          blade.hubPt.z,
          cosY,
          sinY,
          cosP,
          sinP,
          cx,
          cy,
          baseScale
        );
        const pTip = project3D(
          blade.tipPt.x,
          blade.tipPt.y,
          blade.tipPt.z,
          cosY,
          sinY,
          cosP,
          sinP,
          cx,
          cy,
          baseScale
        );

        // Проекция кромок рамы
        const projLeft = blade.frameLeftPts.map((pt) =>
          project3D(pt.x, pt.y, pt.z, cosY, sinY, cosP, sinP, cx, cy, baseScale)
        );
        const projRight = blade.frameRightPts.map((pt) =>
          project3D(pt.x, pt.y, pt.z, cosY, sinY, cosP, sinP, cx, cy, baseScale)
        );

        // А) Фотоэлектрические секции полотна (паруса) между решётками
        for (let r = 0; r < bladeRibsCount; r++) {
          const pL1 = projLeft[r];
          const pL2 = projLeft[r + 1];
          const pR2 = projRight[r + 1];
          const pR1 = projRight[r];

          ctx.save();
          // Окраска полотна: глубокий сине-квантовый фотонный парус
          ctx.beginPath();
          ctx.moveTo(pL1.sx, pL1.sy);
          ctx.lineTo(pL2.sx, pL2.sy);
          ctx.lineTo(pR2.sx, pR2.sy);
          ctx.lineTo(pR1.sx, pR1.sy);
          ctx.closePath();

          if (!wireframeOnly) {
            const sailAlpha = isBackSide ? 0.35 : 0.65;
            // Градиент фотоэлемента с лёгким золотисто-медным бликом
            const bladeGrad = ctx.createLinearGradient(pL1.sx, pL1.sy, pR2.sx, pR2.sy);
            bladeGrad.addColorStop(
              0,
              r % 2 === 0
                ? `rgba(6, 182, 212, ${sailAlpha})`
                : `rgba(2, 132, 199, ${sailAlpha})`
            );
            bladeGrad.addColorStop(
              0.5,
              `rgba(14, 165, 233, ${sailAlpha * 0.9})`
            );
            bladeGrad.addColorStop(
              1,
              `rgba(3, 105, 161, ${sailAlpha * 1.1})`
            );
            ctx.fillStyle = bladeGrad;
            ctx.fill();
          }

          // Внутренняя кремниевая сетка фотоэлементов полотна
          ctx.strokeStyle = activeMeta.colorHex;
          ctx.lineWidth = 0.7;
          ctx.globalAlpha = isBackSide ? 0.3 : 0.6;
          ctx.stroke();

          // Тонкие продольные линии солнечных дорожек
          const pMid1X = (pL1.sx + pR1.sx) * 0.5;
          const pMid1Y = (pL1.sy + pR1.sy) * 0.5;
          const pMid2X = (pL2.sx + pR2.sx) * 0.5;
          const pMid2Y = (pL2.sy + pR2.sy) * 0.5;
          ctx.beginPath();
          ctx.moveTo(pMid1X, pMid1Y);
          ctx.lineTo(pMid2X, pMid2Y);
          ctx.stroke();

          ctx.restore();
        }

        // Б) Поперечные рейки обрешётки мельницы (Lattice crossbars)
        ctx.save();
        ctx.strokeStyle = '#cbd5e1'; // дерево/титан светлого оттенка
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = isBackSide ? 0.5 : 0.9;
        for (let r = 0; r <= bladeRibsCount; r++) {
          const pL = projLeft[r];
          const pR = projRight[r];
          ctx.beginPath();
          ctx.moveTo(pL.sx, pL.sy);
          ctx.lineTo(pR.sx, pR.sy);
          ctx.stroke();

          // Заклёпки/узлы крепления реек к раме
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(pL.sx, pL.sy, 1.4, 0, Math.PI * 2);
          ctx.arc(pR.sx, pR.sy, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // В) Внешняя окантовка рамы лопасти (Leading & trailing frames)
        ctx.beginPath();
        ctx.moveTo(projLeft[0].sx, projLeft[0].sy);
        for (let r = 1; r <= bladeRibsCount; r++) {
          ctx.lineTo(projLeft[r].sx, projLeft[r].sy);
        }
        ctx.lineTo(projRight[bladeRibsCount].sx, projRight[bladeRibsCount].sy);
        for (let r = bladeRibsCount - 1; r >= 0; r--) {
          ctx.lineTo(projRight[r].sx, projRight[r].sy);
        }
        ctx.closePath();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();

        // Г) Центральный главный лонжерон мельницы (Main Spar)
        ctx.beginPath();
        ctx.moveTo(pHub.sx, pHub.sy);
        ctx.lineTo(pTip.sx, pTip.sy);
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = '#64748b';
        ctx.stroke();

        // Внутренний сердечник лонжерона
        ctx.beginPath();
        ctx.moveTo(pHub.sx, pHub.sy);
        ctx.lineTo(pTip.sx, pTip.sy);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#f8fafc';
        ctx.stroke();

        // Наконечник лопасти (флюгер/концевой отражатель)
        ctx.fillStyle = activeMeta.colorHex;
        ctx.beginPath();
        ctx.arc(pTip.sx, pTip.sy, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // -----------------------------------------------------------------------
      // 5. ФУНКЦИЯ ОТРИСОВКИ ОДНОГО РОЖКА-ПИРАМИДКИ (НАВАЛЬНАЯ МИНА)
      // -----------------------------------------------------------------------
      const drawPyramidHorn = (horn: PyramidHornData) => {
        const pApex = project3D(
          horn.apex.x,
          horn.apex.y,
          horn.apex.z,
          cosY,
          sinY,
          cosP,
          sinP,
          cx,
          cy,
          baseScale
        );
        const pB = horn.base.map((b) =>
          project3D(b.x, b.y, b.z, cosY, sinY, cosP, sinP, cx, cy, baseScale)
        );

        // 4 треугольные грани пирамидки: [Apex, B_i, B_{i+1}]
        const faces = [
          [pApex, pB[0], pB[1]],
          [pApex, pB[1], pB[2]],
          [pApex, pB[2], pB[3]],
          [pApex, pB[3], pB[0]],
        ];

        faces.forEach((f) => {
          // Вектор нормали грани в 2D (ориентация грани по часовой стрелке)
          const v1x = f[1].sx - f[0].sx;
          const v1y = f[1].sy - f[0].sy;
          const v2x = f[2].sx - f[0].sx;
          const v2y = f[2].sy - f[0].sy;
          const crossZ = v1x * v2y - v1y * v2x;

          // Лицевая грань, если ориентирована к зрителю
          if (crossZ > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(f[0].sx, f[0].sy);
            ctx.lineTo(f[1].sx, f[1].sy);
            ctx.lineTo(f[2].sx, f[2].sy);
            ctx.closePath();

            if (!wireframeOnly) {
              // Освещение грани: металлический блеск пирамидки
              const lightFactor = Math.max(0.2, (f[0].rz * 0.5 + 0.5));
              const rCol = Math.round(71 * lightFactor + 40);
              const gCol = Math.round(85 * lightFactor + 45);
              const bCol = Math.round(105 * lightFactor + 60);
              ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
              ctx.fill();
            }

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.1;
            ctx.stroke();

            ctx.restore();
          }
        });

        // Наконечник рожка: светодиод сенсора / контактный детонатор мины
        ctx.save();
        ctx.fillStyle = horn.hornIndex % 2 === 0 ? '#ef4444' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(pApex.sx, pApex.sy, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      };

      // -----------------------------------------------------------------------
      // 6. ОТРИСОВКА С УЧЁТОМ ГЛУБИНЫ Z (PAINTER'S ALGORITHM)
      // -----------------------------------------------------------------------

      // А) Задние лопасти мельницы (Z < 0)
      const backBlades = blades.filter((b) => b.centerZ < 0);
      backBlades.forEach((b) => drawWindmillBlade(b, true));

      // Б) Задние рожки-пирамидки (Z < 0)
      const backHorns = horns.filter((h) => h.centerZ < -0.1);
      backHorns.forEach((h) => drawPyramidHorn(h));

      // В) Центральная сфера морской мины
      const sphereRadiusPx = rMine * baseScale;
      ctx.save();

      // Базовый объёмный градиент металлического шара мины
      const mineGrad = ctx.createRadialGradient(
        cx - sphereRadiusPx * 0.35,
        cy - sphereRadiusPx * 0.35,
        sphereRadiusPx * 0.08,
        cx,
        cy,
        sphereRadiusPx
      );
      mineGrad.addColorStop(0, '#64748b'); // Блик сверху
      mineGrad.addColorStop(0.35, '#334155'); // Тёмно-стальная броня
      mineGrad.addColorStop(0.75, '#1e293b'); // Тени титана
      mineGrad.addColorStop(1, '#090d16'); // Глубокая тень

      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadiusPx, 0, Math.PI * 2);
      ctx.fillStyle = mineGrad;
      ctx.fill();

      // Окружная линия стыка двух полусфер (сварной шов морской мины)
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Металлический обод с заклёпками на экваторе
      const equatorSteps = 16;
      for (let i = 0; i < equatorSteps; i++) {
        const eqAngle = (i / equatorSteps) * Math.PI * 2;
        const eqX = Math.cos(eqAngle) * rMine;
        const eqY = 0;
        const eqZ = Math.sin(eqAngle) * rMine;
        const pEq = project3D(eqX, eqY, eqZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);

        if (pEq.sz >= -0.05) {
          ctx.fillStyle = '#f59e0b'; // заклёпка из латуни/меди
          ctx.beginPath();
          ctx.arc(pEq.sx, pEq.sy, 2.0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // Линии меридианов бронелистов
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.35;
      for (let m = 0; m < 4; m++) {
        const mAngle = (m * Math.PI) / 4;
        ctx.beginPath();
        for (let deg = -80; deg <= 80; deg += 10) {
          const latR = (deg * Math.PI) / 180;
          const px = Math.cos(latR) * Math.sin(mAngle) * rMine;
          const py = -Math.sin(latR) * rMine;
          const pz = Math.cos(latR) * Math.cos(mAngle) * rMine;
          const pPt = project3D(px, py, pz, cosY, sinY, cosP, sinP, cx, cy, baseScale);
          if (pPt.sz >= 0) {
            if (deg === -80) ctx.moveTo(pPt.sx, pPt.sy);
            else ctx.lineTo(pPt.sx, pPt.sy);
          }
        }
        ctx.stroke();
      }

      // Г) Центральный сенсорный «Глаз» IFF (линза/эмиттер на передней панели)
      const eyePt = { x: 0, y: 0, z: rMine };
      const pEye = project3D(eyePt.x, eyePt.y, eyePt.z, cosY, sinY, cosP, sinP, cx, cy, baseScale);
      if (pEye.sz > 0) {
        // Оправа линзы
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = activeMeta.colorHex;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(pEye.sx, pEye.sy, sphereRadiusPx * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Пульсирующий светящийся зрачок
        const pupilPulse = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
        const eyeGlow = ctx.createRadialGradient(
          pEye.sx,
          pEye.sy,
          2,
          pEye.sx,
          pEye.sy,
          sphereRadiusPx * 0.2
        );
        eyeGlow.addColorStop(0, '#ffffff');
        eyeGlow.addColorStop(0.3, activeMeta.colorHex);
        eyeGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(pEye.sx, pEye.sy, sphereRadiusPx * 0.18 * pupilPulse, 0, Math.PI * 2);
        ctx.fill();

        // Перекрестье прицеливания IFF
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(pEye.sx - 8, pEye.sy);
        ctx.lineTo(pEye.sx + 8, pEye.sy);
        ctx.moveTo(pEye.sx, pEye.sy - 8);
        ctx.lineTo(pEye.sx, pEye.sy + 8);
        ctx.stroke();
      }

      ctx.restore();

      // Д) Передние рожки-пирамидки (Z >= -0.1)
      const frontHorns = horns.filter((h) => h.centerZ >= -0.1);
      // Сортировка по Z, чтобы ближние рожки перекрывали дальние
      frontHorns.sort((a, b) => a.centerZ - b.centerZ);
      frontHorns.forEach((h) => drawPyramidHorn(h));

      // Е) Передние лопасти мельницы (Z >= 0)
      const frontBlades = blades.filter((b) => b.centerZ >= 0);
      frontBlades.sort((a, b) => a.centerZ - b.centerZ);
      frontBlades.forEach((b) => drawWindmillBlade(b, false));

      // -----------------------------------------------------------------------
      // 7. ИНФОРМАЦИОННЫЙ HUD ОВЕРЛЕЙ
      // -----------------------------------------------------------------------
      if (showBladeBadges) {
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(10, 10, 260, 48);

        ctx.strokeStyle = activeMeta.colorHex;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 10, 260, 48);

        ctx.globalAlpha = 1.0;
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`ЧАСОВОЙ: ${activeMeta.codeName}`, 20, 28);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = activeMeta.colorHex;
        ctx.fillText(
          `⚡ ${activeMeta.bladesCount} ЛОПАСТЕЙ · ПРИТОК ×${activeMeta.rechargeMultiplier.toFixed(1)} · ${activeMeta.surfaceAreaSqM} м²`,
          20,
          46
        );
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    activeBlades,
    yaw,
    pitch,
    zoom,
    isAutoRotate,
    wireframeOnly,
    showBladeBadges,
  ]);

  const activeMeta = SENTINEL_BLADE_MODS_META[activeBlades];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 ${className}`}
    >
      {/* Верхний заголовок / описание модификации */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur z-10 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: activeMeta.colorHex }}
          />
          <span className="font-mono font-bold text-slate-200">
            {activeMeta.titleRu}
          </span>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{
              backgroundColor: `${activeMeta.colorHex}22`,
              color: activeMeta.colorHex,
              border: `1px solid ${activeMeta.colorHex}55`,
            }}
          >
            {activeMeta.badgeRu}
          </span>
        </div>
        {subTitle && <span className="text-slate-400 text-[11px]">{subTitle}</span>}
      </div>

      {/* 3D Canvas */}
      <div className="relative w-full aspect-video min-h-[300px] flex-1">
        <canvas
          ref={canvasRef}
          width={width || 720}
          height={height || 420}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full block cursor-grab active:cursor-grabbing select-none"
        />

        {/* Панель управления 3D камерой (поворот, зум, авто-ротация) */}
        {showToolbar && (
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            <button
              onClick={() => setIsAutoRotate((p) => !p)}
              title={isAutoRotate ? 'Остановить авто-вращение' : 'Включить авто-вращение'}
              className={`p-2 rounded-lg text-xs flex items-center justify-center transition-all ${
                isAutoRotate
                  ? 'bg-cyan-600/90 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setYaw(0.65);
                setPitch(0.32);
                setZoom(1.05);
              }}
              title="Сбросить ракурс камеры"
              className="p-2 rounded-lg bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.4, z + 0.15))}
              title="Приблизить (+)"
              className="p-2 rounded-lg bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.55, z - 0.15))}
              title="Отдалить (-)"
              className="p-2 rounded-lg bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setWireframeOnly((w) => !w)}
              title={wireframeOnly ? 'Включить текстуры' : 'Каркасный режим'}
              className={`p-2 rounded-lg text-xs transition-all ${
                wireframeOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Подсказка управления мышью */}
        <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 bg-slate-950/70 backdrop-blur px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
          Вращение: мышь / палец · Масштаб: колесо мыши
        </div>
      </div>

      {/* ПАНЕЛЬ ПЕРЕКЛЮЧЕНИЯ 3 МОДИФИКАЦИЙ (4, 6, 8 ЛОПАСТЕЙ) */}
      {showModificationSelector && (
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Модификации лопастей:
            </span>
            <div className="flex items-center gap-1.5">
              {([4, 6, 8] as SentinelBladeModification[]).map((blades) => {
                const spec = SENTINEL_BLADE_MODS_META[blades];
                const isSelected = activeBlades === blades;
                return (
                  <button
                    key={blades}
                    onClick={() => handleSelectBlades(blades)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400 shadow-md shadow-cyan-600/30'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <span>{blades} лопастей</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-cyan-700 text-white' : 'bg-slate-900 text-cyan-300'
                      }`}
                    >
                      {spec.rechargeMultiplier.toFixed(1)}x
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Индикатор тактического преимущества выбранной модификации */}
          <div className="text-right text-xs">
            <div className="font-semibold text-slate-200">
              Скорость зарядки:{' '}
              <span className="font-mono font-bold text-cyan-400">
                {activeMeta.rechargeMultiplier === 1.0
                  ? 'Базовая (1.0x)'
                  : activeMeta.rechargeMultiplier === 1.5
                  ? '+50% быстрее (1.5x)'
                  : 'Удвоенная (2.0x)'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Панели: {activeMeta.surfaceAreaSqM} м² · Масса: {activeMeta.dryMassTons} т
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
