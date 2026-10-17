import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
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
  Flame,
  Plus,
  Trash2,
  Save,
  FolderOpen,
  Compass,
  Radio,
  Crosshair,
  Info,
  ChevronRight,
  ChevronDown,
  Box,
  Settings2,
  Check,
  Maximize2,
  HelpCircle,
  Share2,
  Anchor,
  ShoppingCart,
  Send,
  ArrowRightLeft,
  DollarSign,
  Globe,
  Store,
  Warehouse,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Cpu,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  AxisDirection,
  ALL_AXES,
  AXIS_VECTORS,
  OPPOSITE_AXIS,
  AXIS_METADATA,
  ModuleCategory,
  ModuleKind,
  ModuleDefinition,
  MODULE_CATALOG,
  HUB_BASE_MASS_TONS,
  HUB_BASE_POWER_CONSUMPTION_MW,
  HUB_GRID_DISTANCE,
  ModularSlot,
  ModularHub,
  ModularShipStructure,
  ShipCalculatedStats,
  calculateShipStats,
  createEmptyHub,
  createCanonicalExplorerPreset,
  createHeavyMinerPreset,
  createPatrolCorvettePreset,
  createEmptySingleHubShip,
  generateHubId,
  HUB_CORE_DEF,
  ModuleLifeStatus,
  SupplierChannel,
  SUPPLIER_CHANNELS,
  SHIPYARD_DOCKING_FEE_CR,
  SCRAP_DEALER_RATE,
  PLANET_TRADER_SELL_RATE,
  MANUFACTURER_RETURN_RATE,
  AnyModuleItemKind,
  ModulePortOption,
  getModulePortOptions,
  ShipyardModuleItem,
  createInitialPlayerShipyardState,
  MODULE_SUPPLIERS,
  getModuleResalePricing,
} from '../data/shipbuildingModularEngine';
import {
  renderMedialRhombicShipyardScene,
  MEGASTRUCTURE_SHIPYARD_SPECS,
} from '../data/medialRhombicTriacontahedronEngine';

export interface ShipyardBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAsPlayerShip?: (ship: ModularShipStructure, stats: ShipCalculatedStats) => void;
  initialShip?: ModularShipStructure;
}

/**
 * 3D-проекция точки (x, y, z) с углами yaw и pitch
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
  const x1 = x * cosY + z * sinY;
  const y1 = y;
  const z1 = -x * sinY + z * cosY;

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

const CATEGORY_NAMES: Record<ModuleCategory, { label: string; icon: string }> = {
  ENGINE: { label: 'Двигатели (Дюзы)', icon: '🔥' },
  ENERGY: { label: 'Энергетика (Солнечные крылья)', icon: '⚡' },
  SENSORS: { label: 'Приборы (Радары & Связь)', icon: '📡' },
  CARGO: { label: 'Трюмы (Контейнеры ББД)', icon: '📦' },
  WEAPONS: { label: 'Вооружение (Лазер / Плазма)', icon: '🎯' },
  COMMAND: { label: 'Командные блоки (Рубка & Каюта)', icon: '🚀' },
  LANDER: { label: 'Посадочные модули', icon: '🛬' },
};

export const ShipyardBuilderModal: React.FC<ShipyardBuilderModalProps> = ({
  isOpen,
  onClose,
  onApplyAsPlayerShip,
  initialShip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Структура корабля
  const [ship, setShip] = useState<ModularShipStructure>(() => {
    return initialShip || createCanonicalExplorerPreset();
  });

  // Экономика верфи и инвентарь игрока
  const [playerCredits, setPlayerCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gobell_player_credits');
      return saved ? parseInt(saved, 10) : 38500;
    } catch {
      return 38500;
    }
  });

  const [shipyardState, setShipyardState] = useState<{
    modules: ShipyardModuleItem[];
    shipyardOwnerFundCr: number;
    scrappedCount: number;
  }>(() => {
    try {
      const saved = localStorage.getItem('gobell_shipyard_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return createInitialPlayerShipyardState();
  });

  // Сохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gobell_player_credits', playerCredits.toString());
    } catch {
      // ignore
    }
  }, [playerCredits]);

  useEffect(() => {
    try {
      localStorage.setItem('gobell_shipyard_state', JSON.stringify(shipyardState));
    } catch {
      // ignore
    }
  }, [shipyardState]);

  // Физическое присутствие у верфи (по концепции: игрок должен быть пристыкован к верфи)
  const [isDockedAtShipyard, setIsDockedAtShipyard] = useState<boolean>(true);

  // Режим экрана
  // 'ASSEMBLY' = Двухпанельный сборочный лист (Корабль слева + Выбранный блок справа + Список верфи снизу)
  // 'MEGASTRUCTURE_VIEW' = 3D обзор Мегаверфи (0.5R Планеты, Средний ромботриаконтаэдр) в космосе
  // 'DISPATCH_REGISTRY' = Личный реестр покупок (PURCHASED_AWAITING_DISPATCH) + Телепортация на верфь
  // 'EXTERNAL_SUPPLIERS' = Внешние поставщики (Производитель, Торговец, P2P, Клан)
  // 'SCRAP_WAREHOUSE' = Склад владельца верфи (Утиль и скупка 50%)
  // 'PRESETS_ARCHIVE' = Заводские пресеты и сохранение чертежей
  // 'TELEMETRY' = Полные ТТХ
  const [mainMode, setMainMode] = useState<
    'ASSEMBLY' | 'MEGASTRUCTURE_VIEW' | 'DISPATCH_REGISTRY' | 'EXTERNAL_SUPPLIERS' | 'SCRAP_WAREHOUSE' | 'PRESETS_ARCHIVE' | 'TELEMETRY'
  >('ASSEMBLY');

  // Камера 3D
  const [yaw, setYaw] = useState<number>(0.75);
  const [pitch, setPitch] = useState<number>(0.35);
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isThrustTestActive, setIsThrustTestActive] = useState<boolean>(true);

  // Выбранный стыковочный узел корабля на левом листе
  const [selectedShipSlot, setSelectedShipSlot] = useState<{
    hubId: string;
    axis: AxisDirection;
  } | null>(null);

  // Наведённый слот для подсветки в 3D
  const [hoveredSlot, setHoveredSlot] = useState<{
    hubId: string;
    axis: AxisDirection;
  } | null>(null);

  // Выбранный блок для правого сборочного листа (из списка верфи)
  const [selectedInventoryModuleId, setSelectedInventoryModuleId] = useState<string | null>(null);

  // Выбранный стыковочный узел монтируемого блока (если их несколько)
  const [selectedModulePortId, setSelectedModulePortId] = useState<string | null>(null);

  // Фильтры в списке доступных модулей верфи
  const [selectedInventoryCategoryFilter, setSelectedInventoryCategoryFilter] = useState<string>('ALL');

  // Выбранный канал поставщика для внешних покупок
  const [activeSupplierChannel, setActiveSupplierChannel] = useState<SupplierChannel>('MANUFACTURER');

  // Уведомления/тосты
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warn' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Сохраненные чертежи
  const [savedBlueprints, setSavedBlueprints] = useState<ModularShipStructure[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gobell_ship_blueprints');
      if (raw) setSavedBlueprints(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // Синхронизация initialShip если передан
  useEffect(() => {
    if (initialShip) setShip(initialShip);
  }, [initialShip]);

  // Вычисляемые ТТХ корабля
  const stats = useMemo(() => calculateShipStats(ship), [ship]);

  // Экранные координаты узлов для интерактивного клика по 3D
  const screenSocketsRef = useRef<
    Array<{
      hubId: string;
      axis: AxisDirection;
      sx: number;
      sy: number;
      sz: number;
      radius: number;
      isEmpty: boolean;
      moduleKind: ModuleKind | null;
      connectedHubId: string | null;
    }>
  >([]);

  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragModeRef = useRef<'ROTATE' | 'PAN'>('ROTATE');

  // Выбранный блок из инвентаря верфи
  const selectedInventoryModule = useMemo(() => {
    if (!selectedInventoryModuleId) return null;
    return shipyardState.modules.find((m) => m.id === selectedInventoryModuleId) || null;
  }, [selectedInventoryModuleId, shipyardState.modules]);

  // Стыковочные порты выбранного блока
  const availableModulePorts = useMemo(() => {
    if (!selectedInventoryModule) return [];
    return getModulePortOptions(selectedInventoryModule.kind);
  }, [selectedInventoryModule]);

  // Автоматический выбор первого порта блока при смене модуля
  useEffect(() => {
    if (selectedInventoryModule && availableModulePorts.length > 0) {
      if (!selectedModulePortId || !availableModulePorts.find((p) => p.id === selectedModulePortId)) {
        setSelectedModulePortId(availableModulePorts[0].id);
      }
    }
  }, [selectedInventoryModule, availableModulePorts, selectedModulePortId]);

  // Модули со статусом IN_SHIPYARD_INVENTORY
  const shipyardInventoryModules = useMemo(() => {
    return shipyardState.modules.filter((m) => m.status === 'IN_SHIPYARD_INVENTORY');
  }, [shipyardState.modules]);

  // Фильтрованные модули в инвентаре верфи
  const filteredShipyardModules = useMemo(() => {
    if (selectedInventoryCategoryFilter === 'ALL') return shipyardInventoryModules;
    if (selectedInventoryCategoryFilter === 'HUB_CORE') {
      return shipyardInventoryModules.filter((m) => m.kind === 'HUB_CORE');
    }
    return shipyardInventoryModules.filter((m) => {
      if (m.kind === 'HUB_CORE') return false;
      const def = MODULE_CATALOG[m.kind as ModuleKind];
      return def && def.category === selectedInventoryCategoryFilter;
    });
  }, [shipyardInventoryModules, selectedInventoryCategoryFilter]);

  // Модули в личном реестре игрока (PURCHASED_AWAITING_DISPATCH)
  const purchasedAwaitingDispatch = useMemo(() => {
    return shipyardState.modules.filter((m) => m.status === 'PURCHASED_AWAITING_DISPATCH');
  }, [shipyardState.modules]);

  // Модули на складе скупщика верфи (IN_SHIPYARD_WAREHOUSE)
  const scrappedModules = useMemo(() => {
    return shipyardState.modules.filter((m) => m.status === 'IN_SHIPYARD_WAREHOUSE');
  }, [shipyardState.modules]);

  // Анимационный цикл 3D Canvas
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    let animTime = 0;

    const render = () => {
      animTime += 0.016;
      if (isAutoRotate) {
        setYaw((prev) => prev + 0.005);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 800;
      const height = rect.height || 600;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Фон: стапель орбитальной верфи
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2 + panOffset.x;
      const cy = height / 2 + panOffset.y;

      // Если включен режим 3D обзора Мегаверфи (0.5R Планеты · Средний Ромботриаконтаэдр)
      if (mainMode === 'MEGASTRUCTURE_VIEW') {
        renderMedialRhombicShipyardScene(
          ctx,
          cx,
          cy,
          Math.min(width, height) * 0.38 * zoom,
          yaw,
          pitch,
          {
            showPlanet: true,
            showLasers: true,
            showBeacons: true,
            showWireframe: true,
            planetScaleRatio: 2.0,
            timeMs: Date.now(),
            activeSlipIndex: 14,
          }
        );
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      const baseScale = Math.min(width, height) * 0.16 * zoom;

      // Сетка верфи на полу (Y = -3.5)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 1;
      const floorY = -3.5;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      for (let gx = -6; gx <= 6; gx += 1.2) {
        const p1 = project3D(gx, floorY, -8, cosY, sinY, cosP, sinP, cx, cy, baseScale);
        const p2 = project3D(gx, floorY, 8, cosY, sinY, cosP, sinP, cx, cy, baseScale);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }
      for (let gz = -8; gz <= 8; gz += 1.2) {
        const p1 = project3D(-6, floorY, gz, cosY, sinY, cosP, sinP, cx, cy, baseScale);
        const p2 = project3D(6, floorY, gz, cosY, sinY, cosP, sinP, cx, cy, baseScale);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      const currentSockets: typeof screenSocketsRef.current = [];
      const hubsList = Object.values(ship.hubs);

      // 1. Межхабовые связи (Docking Corridors)
      for (const hub of hubsList) {
        const [hx, hy, hz] = hub.gridPos;
        const hubWorldX = hx * HUB_GRID_DISTANCE;
        const hubWorldY = hy * HUB_GRID_DISTANCE;
        const hubWorldZ = hz * HUB_GRID_DISTANCE;

        for (const axis of ALL_AXES) {
          const slot = hub.slots[axis];
          if (slot.connectedHubId && ship.hubs[slot.connectedHubId]) {
            const targetHub = ship.hubs[slot.connectedHubId];
            const [tx, ty, tz] = targetHub.gridPos;
            const tWorldX = tx * HUB_GRID_DISTANCE;
            const tWorldY = ty * HUB_GRID_DISTANCE;
            const tWorldZ = tz * HUB_GRID_DISTANCE;

            if (hub.id < targetHub.id) {
              const pStart = project3D(hubWorldX, hubWorldY, hubWorldZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);
              const pEnd = project3D(tWorldX, tWorldY, tWorldZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);

              ctx.strokeStyle = '#0284c7';
              ctx.lineWidth = Math.max(3, 6 * zoom);
              ctx.beginPath();
              ctx.moveTo(pStart.sx, pStart.sy);
              ctx.lineTo(pEnd.sx, pEnd.sy);
              ctx.stroke();

              const steps = 4;
              for (let s = 1; s < steps; s++) {
                const ratio = s / steps;
                const rx = hubWorldX + (tWorldX - hubWorldX) * ratio;
                const ry = hubWorldY + (tWorldY - hubWorldY) * ratio;
                const rz = hubWorldZ + (tWorldZ - hubWorldZ) * ratio;
                const ringPt = project3D(rx, ry, rz, cosY, sinY, cosP, sinP, cx, cy, baseScale);

                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ringPt.sx, ringPt.sy, Math.max(3, 7 * zoom), 0, Math.PI * 2);
                ctx.stroke();
              }
            }
          }
        }
      }

      // 2. Отрисовка каждого Хаба и его модулей
      for (const hub of hubsList) {
        const [hx, hy, hz] = hub.gridPos;
        const hubWorldX = hx * HUB_GRID_DISTANCE;
        const hubWorldY = hy * HUB_GRID_DISTANCE;
        const hubWorldZ = hz * HUB_GRID_DISTANCE;

        const centerPt = project3D(hubWorldX, hubWorldY, hubWorldZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);
        const tubeLen = 0.95;

        // 6 туб
        for (const axis of ALL_AXES) {
          const slot = hub.slots[axis];
          const [vx, vy, vz] = AXIS_VECTORS[axis];
          const nodeWorldX = hubWorldX + vx * tubeLen;
          const nodeWorldY = hubWorldY + vy * tubeLen;
          const nodeWorldZ = hubWorldZ + vz * tubeLen;

          const nodePt = project3D(nodeWorldX, nodeWorldY, nodeWorldZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);

          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = Math.max(2, 5 * zoom);
          ctx.beginPath();
          ctx.moveTo(centerPt.sx, centerPt.sy);
          ctx.lineTo(nodePt.sx, nodePt.sy);
          ctx.stroke();

          // Отрисовка модулей
          if (slot.installedModuleKind) {
            const modDef = MODULE_CATALOG[slot.installedModuleKind];
            const modEndX = hubWorldX + vx * (tubeLen + 0.85);
            const modEndY = hubWorldY + vy * (tubeLen + 0.85);
            const modEndZ = hubWorldZ + vz * (tubeLen + 0.85);
            const modEndPt = project3D(modEndX, modEndY, modEndZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);

            ctx.strokeStyle = modDef.visualColor;
            ctx.fillStyle = modDef.visualColor + '33';
            ctx.lineWidth = Math.max(2, 4 * zoom);

            // Рендер по типам модулей
            if (modDef.category === 'ENGINE') {
              // Сфера двигателя
              ctx.beginPath();
              ctx.arc(nodePt.sx, nodePt.sy, Math.max(5, 12 * zoom), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Раструб дюзы
              ctx.beginPath();
              ctx.moveTo(nodePt.sx - vy * 4, nodePt.sy + vx * 4);
              ctx.lineTo(modEndPt.sx - vy * 12 * zoom, modEndPt.sy + vx * 12 * zoom);
              ctx.lineTo(modEndPt.sx + vy * 12 * zoom, modEndPt.sy - vx * 12 * zoom);
              ctx.lineTo(nodePt.sx + vy * 4, nodePt.sy - vx * 4);
              ctx.closePath();
              ctx.stroke();

              // Факел / пламя дюзы
              if (isThrustTestActive) {
                const plumeLen = 1.3 + Math.sin(animTime * 18 + hx) * 0.35;
                const pEndX = hubWorldX + vx * (tubeLen + 0.85 + plumeLen);
                const pEndY = hubWorldY + vy * (tubeLen + 0.85 + plumeLen);
                const pEndZ = hubWorldZ + vz * (tubeLen + 0.85 + plumeLen);
                const pEndPt = project3D(pEndX, pEndY, pEndZ, cosY, sinY, cosP, sinP, cx, cy, baseScale);

                ctx.strokeStyle = modDef.nozzleColor || '#f97316';
                ctx.lineWidth = Math.max(3, 8 * zoom);
                ctx.beginPath();
                ctx.moveTo(modEndPt.sx, modEndPt.sy);
                ctx.lineTo(pEndPt.sx, pEndPt.sy);
                ctx.stroke();
              }
            } else if (modDef.category === 'ENERGY') {
              // Солнечные крылья
              ctx.beginPath();
              ctx.rect(nodePt.sx - 18 * zoom, nodePt.sy - 8 * zoom, 36 * zoom, 16 * zoom);
              ctx.fill();
              ctx.stroke();
            } else if (modDef.category === 'SENSORS') {
              // Радар / Купол
              ctx.beginPath();
              ctx.arc(nodePt.sx, nodePt.sy, Math.max(6, 14 * zoom), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (modDef.category === 'CARGO') {
              // Трюмный шестигранник
              ctx.beginPath();
              ctx.arc(nodePt.sx, nodePt.sy, Math.max(8, 15 * zoom), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (modDef.category === 'WEAPONS') {
              // Орудийный пилон
              ctx.beginPath();
              ctx.moveTo(nodePt.sx, nodePt.sy);
              ctx.lineTo(modEndPt.sx, modEndPt.sy);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(modEndPt.sx, modEndPt.sy, Math.max(3, 6 * zoom), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else {
              // Рубка / Командный блок
              ctx.beginPath();
              ctx.arc(nodePt.sx, nodePt.sy, Math.max(7, 14 * zoom), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }

          // Кольцо стыковочного фланца
          const isSelected = selectedShipSlot?.hubId === hub.id && selectedShipSlot?.axis === axis;
          const isHovered = hoveredSlot?.hubId === hub.id && hoveredSlot?.axis === axis;
          const isEmpty = !slot.installedModuleKind && !slot.connectedHubId;

          const socketRadius = Math.max(7, 11 * zoom);
          currentSockets.push({
            hubId: hub.id,
            axis,
            sx: nodePt.sx,
            sy: nodePt.sy,
            sz: nodePt.sz,
            radius: socketRadius + 5,
            isEmpty,
            moduleKind: slot.installedModuleKind,
            connectedHubId: slot.connectedHubId,
          });

          ctx.save();
          if (isSelected) {
            ctx.strokeStyle = '#22d3ee';
            ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(nodePt.sx, nodePt.sy, socketRadius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
          } else if (isHovered) {
            ctx.strokeStyle = '#38bdf8';
            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nodePt.sx, nodePt.sy, socketRadius + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
          } else if (isEmpty) {
            ctx.strokeStyle = AXIS_METADATA[axis].color;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(nodePt.sx, nodePt.sy, socketRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
          } else {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(nodePt.sx, nodePt.sy, socketRadius - 2, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Значок [+] если узел свободен
          if (isEmpty) {
            ctx.strokeStyle = isSelected ? '#ffffff' : AXIS_METADATA[axis].color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(nodePt.sx - 3, nodePt.sy);
            ctx.lineTo(nodePt.sx + 3, nodePt.sy);
            ctx.moveTo(nodePt.sx, nodePt.sy - 3);
            ctx.lineTo(nodePt.sx, nodePt.sy + 3);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Центральная сфера хаба
        ctx.save();
        const hubRadius = Math.max(10, 18 * zoom);
        const grad = ctx.createRadialGradient(
          centerPt.sx - 4 * zoom,
          centerPt.sy - 4 * zoom,
          2 * zoom,
          centerPt.sx,
          centerPt.sy,
          hubRadius
        );
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.5, '#0369a1');
        grad.addColorStop(1, '#082f49');

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerPt.sx, centerPt.sy, hubRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Меридианы сферы
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerPt.sx, centerPt.sy, hubRadius * 0.9, hubRadius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      screenSocketsRef.current = currentSockets;
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, ship, yaw, pitch, zoom, panOffset, isAutoRotate, isThrustTestActive, selectedShipSlot, hoveredSlot]);

  // Мышь: вращение и клики
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    dragModeRef.current = e.button === 2 || e.shiftKey ? 'PAN' : 'ROTATE';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (dragModeRef.current === 'ROTATE') {
        setYaw((prev) => prev + dx * 0.008);
        setPitch((prev) => Math.max(-1.4, Math.min(1.4, prev - dy * 0.008)));
      } else {
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }
      return;
    }

    // Подсветка сокетов
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundSlot: { hubId: string; axis: AxisDirection } | null = null;
    for (const s of screenSocketsRef.current) {
      const dist = Math.hypot(s.sx - mouseX, s.sy - mouseY);
      if (dist <= s.radius) {
        foundSlot = { hubId: s.hubId, axis: s.axis };
        break;
      }
    }
    setHoveredSlot(foundSlot);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const s of screenSocketsRef.current) {
      const dist = Math.hypot(s.sx - mouseX, s.sy - mouseY);
      if (dist <= s.radius) {
        setSelectedShipSlot({ hubId: s.hubId, axis: s.axis });
        return;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.3, Math.min(3.5, prev * zoomFactor)));
  };

  // =========================================================================
  // Операции Стыковки, Расстыковки, Скупки, Телепортации, Покупки у Поставщиков
  // =========================================================================

  // 1. СОСТЫКОВАТЬ УЗЛЫ:
  // Берет узел корабля (selectedShipSlot слева) и выбранный блок верфи (selectedInventoryModuleId справа).
  // Списывает комиссию верфи (250 CR), стыкует, блокирует телепортацию!
  const handleDockNodes = () => {
    if (!isDockedAtShipyard) {
      showToast('ОШИБКА: Корабль должен быть физически пристыкован к докам верфи!', 'warn');
      return;
    }

    if (!selectedShipSlot) {
      showToast('Выберите стыковочный узел на сборочном листе корабля слева!', 'warn');
      return;
    }

    if (!selectedInventoryModule) {
      showToast('Выберите модуль из списка доступных на верфи справа внизу!', 'warn');
      return;
    }

    const { hubId, axis } = selectedShipSlot;
    const currentHub = ship.hubs[hubId];
    if (!currentHub) return;

    const currentSlot = currentHub.slots[axis];
    if (currentSlot.installedModuleKind || currentSlot.connectedHubId) {
      showToast('Выбранный узел корабля уже занят! Сначала расстыкуйте установленный блок.', 'warn');
      return;
    }

    if (playerCredits < SHIPYARD_DOCKING_FEE_CR) {
      showToast(`Недостаточно кредитов! Тариф верфи за состыковку: ${SHIPYARD_DOCKING_FEE_CR} CR.`, 'warn');
      return;
    }

    // Списание комиссии верфи
    setPlayerCredits((prev) => prev - SHIPYARD_DOCKING_FEE_CR);
    setShipyardState((prev) => ({
      ...prev,
      shipyardOwnerFundCr: prev.shipyardOwnerFundCr + SHIPYARD_DOCKING_FEE_CR,
    }));

    // Если монтируется 6-лучевой хаб
    if (selectedInventoryModule.kind === 'HUB_CORE') {
      const [vx, vy, vz] = AXIS_VECTORS[axis];
      const newGridPos: [number, number, number] = [
        currentHub.gridPos[0] + vx,
        currentHub.gridPos[1] + vy,
        currentHub.gridPos[2] + vz,
      ];

      const newId = generateHubId(ship.hubs);
      const newHub = createEmptyHub(
        newId,
        `Хаб #${Object.keys(ship.hubs).length + 1} (${AXIS_METADATA[axis].shortRu})`,
        newGridPos
      );

      const opposite = OPPOSITE_AXIS[axis];
      newHub.slots[opposite].connectedHubId = hubId;

      setShip((prev) => {
        const newHubs = { ...prev.hubs };
        newHubs[hubId] = {
          ...currentHub,
          slots: {
            ...currentHub.slots,
            [axis]: {
              axis,
              installedModuleKind: null,
              connectedHubId: newId,
            },
          },
        };
        newHubs[newId] = newHub;
        return { ...prev, hubs: newHubs };
      });
    } else {
      // Обычный функциональный модуль
      setShip((prev) => {
        const newHubs = { ...prev.hubs };
        newHubs[hubId] = {
          ...currentHub,
          slots: {
            ...currentHub.slots,
            [axis]: {
              axis,
              installedModuleKind: selectedInventoryModule.kind as ModuleKind,
              connectedHubId: null,
            },
          },
        };
        return { ...prev, hubs: newHubs };
      });
    }

    // Обновляем статус модуля в реестре: ATTACHED, телепортация заблокирована
    setShipyardState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id === selectedInventoryModule.id) {
          return {
            ...m,
            status: 'ATTACHED' as ModuleLifeStatus,
            teleportLocked: true,
            attachedSlot: { hubId, axis },
          };
        }
        return m;
      }),
    }));

    setSelectedInventoryModuleId(null);
    showToast(
      `Узлы успешно состыкованы! Списана комиссия верфи ${SHIPYARD_DOCKING_FEE_CR} CR. Статус: ATTACHED (телепортация заблокирована).`,
      'success'
    );
  };

  // 2. РАССТЫКОВАТЬ УЗЕЛ:
  // Снимает установленный модуль или пристыкованный хаб обратно в инвентарь верфи (IN_SHIPYARD_INVENTORY).
  // Телепортация заблокирована! Его можно возить только на корабле или продать скупщику тут же за 50%.
  const handleUndockSlot = () => {
    if (!selectedShipSlot) return;
    const { hubId, axis } = selectedShipSlot;
    const currentHub = ship.hubs[hubId];
    if (!currentHub) return;

    const slot = currentHub.slots[axis];
    if (!slot.installedModuleKind && !slot.connectedHubId) return;

    let unhookedKind: AnyModuleItemKind = 'HUB_CORE';
    if (slot.installedModuleKind) {
      unhookedKind = slot.installedModuleKind;
    }

    // Расстыковка на корабле
    if (slot.connectedHubId) {
      const targetHubId = slot.connectedHubId;
      if (targetHubId === ship.rootHubId) {
        showToast('Нельзя отстыковать корневой хаб управления кораблем!', 'warn');
        return;
      }
      setShip((prev) => {
        const newHubs = { ...prev.hubs };
        delete newHubs[targetHubId];
        newHubs[hubId] = {
          ...currentHub,
          slots: {
            ...currentHub.slots,
            [axis]: { axis, installedModuleKind: null, connectedHubId: null },
          },
        };
        return { ...prev, hubs: newHubs };
      });
    } else {
      setShip((prev) => {
        const newHubs = { ...prev.hubs };
        newHubs[hubId] = {
          ...currentHub,
          slots: {
            ...currentHub.slots,
            [axis]: { axis, installedModuleKind: null, connectedHubId: null },
          },
        };
        return { ...prev, hubs: newHubs };
      });
    }

    // Возвращаем в инвентарь верфи (IN_SHIPYARD_INVENTORY) со статусом teleportLocked: true
    const existingAttachedIndex = shipyardState.modules.findIndex(
      (m) =>
        m.status === 'ATTACHED' &&
        m.attachedSlot?.hubId === hubId &&
        m.attachedSlot?.axis === axis
    );

    if (existingAttachedIndex >= 0) {
      setShipyardState((prev) => ({
        ...prev,
        modules: prev.modules.map((m, idx) => {
          if (idx === existingAttachedIndex) {
            return {
              ...m,
              status: 'IN_SHIPYARD_INVENTORY' as ModuleLifeStatus,
              teleportLocked: true,
              attachedSlot: undefined,
            };
          }
          return m;
        }),
      }));
    } else {
      // Создаем запись для расстыкованного заводского узла
      const nominal =
        unhookedKind === 'HUB_CORE'
          ? HUB_CORE_DEF.basePriceCr
          : MODULE_CATALOG[unhookedKind as ModuleKind]?.basePriceCr || 1000;

      const newDetachedItem: ShipyardModuleItem = {
        id: `MOD-${Math.floor(1000 + Math.random() * 9000)}`,
        kind: unhookedKind,
        status: 'IN_SHIPYARD_INVENTORY',
        supplierChannel: 'MANUFACTURER',
        supplierName: 'Заводская комплектация корабля',
        nominalPriceCr: nominal,
        purchasedPriceCr: nominal,
        teleportLocked: true,
        deliveredShipyardName: 'Орбитальная Верфь Талиона',
        purchasedAt: Date.now(),
      };

      setShipyardState((prev) => ({
        ...prev,
        modules: [newDetachedItem, ...prev.modules],
      }));
    }

    showToast(
      'Узел расстыкован! Модуль помещён в инвентарь верфи. Напоминание: модуль доставлен физически и не может быть телепортирован обратно — вы можете пристыковать его, вывезти на корабле или сдать скупщику за 50%!',
      'info'
    );
  };

  // 3. ПРОДАТЬ СКУПЩИКУ НА ВЕРФИ (50% цены):
  // Мгновенная выплата 50% кредитов, модуль переходит на склад владельца верфи (IN_SHIPYARD_WAREHOUSE)
  const handleSellToScrapDealer = (item: ShipyardModuleItem) => {
    const scrapPrice = Math.round(item.nominalPriceCr * SCRAP_DEALER_RATE);

    setPlayerCredits((prev) => prev + scrapPrice);
    setShipyardState((prev) => ({
      ...prev,
      scrappedCount: prev.scrappedCount + 1,
      modules: prev.modules.map((m) => {
        if (m.id === item.id) {
          return {
            ...m,
            status: 'IN_SHIPYARD_WAREHOUSE' as ModuleLifeStatus,
            teleportLocked: true,
          };
        }
        return m;
      }),
    }));

    if (selectedInventoryModuleId === item.id) {
      setSelectedInventoryModuleId(null);
    }

    showToast(
      `Модуль «${item.kind}» продан скупщику верфи за 50% стоимости (+${scrapPrice} CR). Модуль перешел на склад владельца верфи.`,
      'success'
    );
  };

  // 4. ТЕЛЕПОРТАЦИЯ НА ВЕРФЬ (Этап 3 & 4 концепции):
  // Из личного реестра (PURCHASED_AWAITING_DISPATCH) мгновенно телепортируется на верфь пребывания.
  // Появляется в инвентаре верфи (IN_SHIPYARD_INVENTORY). Обратная телепортация БЛОКИРУЕТСЯ!
  const handleTeleportToShipyard = (item: ShipyardModuleItem) => {
    if (!isDockedAtShipyard) {
      showToast('ОШИБКА: Пилот должен физически прибыть к верфи для запроса доставки модулей!', 'warn');
      return;
    }

    setShipyardState((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id === item.id) {
          return {
            ...m,
            status: 'IN_SHIPYARD_INVENTORY' as ModuleLifeStatus,
            teleportLocked: true,
            deliveredShipyardName: 'Орбитальная Верфь Талиона',
          };
        }
        return m;
      }),
    }));

    showToast(
      `⚡ Модуль «${item.kind}» мгновенно телепортирован на верфь и добавлен в список доступных! Обратная телепортация заблокирована.`,
      'success'
    );
  };

  // 5. ВОЗВРАТ ПРОИЗВОДИТЕЛЮ ЗА 90% (До телепортации на верфь)
  const handleReturnToManufacturer = (item: ShipyardModuleItem) => {
    const refund = Math.round(item.nominalPriceCr * MANUFACTURER_RETURN_RATE);
    setPlayerCredits((prev) => prev + refund);
    setShipyardState((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== item.id),
    }));

    showToast(`Официальный гарантийный возврат производителю оформлен: выплачено ${refund} CR (90% цены).`, 'success');
  };

  // 6. ПРОДАЖА ТОРГОВЦУ НА ПЛАНЕТЕ ЗА 80% (До телепортации на верфь)
  const handleSellToPlanetTrader = (item: ShipyardModuleItem) => {
    const price = Math.round(item.nominalPriceCr * PLANET_TRADER_SELL_RATE);
    setPlayerCredits((prev) => prev + price);
    setShipyardState((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== item.id),
    }));

    showToast(`Модуль реализован через сеть торговцев на планете за ${price} CR (80% цены).`, 'success');
  };

  // 7. ПОКУПКА У ВНЕШНИХ ПОСТАВЩИКОВ (Этап 1 концепции):
  // Верфь НЕ является магазином. Покупка происходит у поставщиков (Завод, Торговец, P2P, Клан).
  // Модуль попадает в реестр игрока со статусом PURCHASED_AWAITING_DISPATCH.
  const handleBuyFromSupplier = (kind: AnyModuleItemKind, channel: SupplierChannel) => {
    const details = SUPPLIER_CHANNELS[channel];
    const basePrice =
      kind === 'HUB_CORE'
        ? HUB_CORE_DEF.basePriceCr
        : MODULE_CATALOG[kind as ModuleKind]?.basePriceCr || 1000;

    const actualPrice = Math.round(basePrice * details.priceMultiplier);

    if (playerCredits < actualPrice) {
      showToast(`Недостаточно средств для заказа! Требуется: ${actualPrice} CR.`, 'warn');
      return;
    }

    setPlayerCredits((prev) => prev - actualPrice);

    const newItem: ShipyardModuleItem = {
      id: `MOD-${Math.floor(1000 + Math.random() * 9000)}`,
      kind,
      status: 'PURCHASED_AWAITING_DISPATCH',
      supplierChannel: channel,
      supplierName: details.titleRu,
      nominalPriceCr: basePrice,
      purchasedPriceCr: actualPrice,
      teleportLocked: false,
      purchasedAt: Date.now(),
    };

    setShipyardState((prev) => ({
      ...prev,
      modules: [newItem, ...prev.modules],
    }));

    showToast(
      `Модуль заказан за ${actualPrice} CR у «${details.titleRu}»! Статус: PURCHASED_AWAITING_DISPATCH. Телепортируйте его на верфь!`,
      'success'
    );
  };

  // Пресеты
  const handleLoadPreset = (presetType: 'CANONICAL' | 'MINER' | 'CORVETTE' | 'SINGLE') => {
    if (presetType === 'CANONICAL') {
      setShip(createCanonicalExplorerPreset());
    } else if (presetType === 'MINER') {
      setShip(createHeavyMinerPreset());
    } else if (presetType === 'CORVETTE') {
      setShip(createPatrolCorvettePreset());
    } else {
      setShip(createEmptySingleHubShip());
    }
    setSelectedShipSlot(null);
    setSelectedInventoryModuleId(null);
    setYaw(0.75);
    setPitch(0.35);
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    showToast('Заводской проект успешно загружен на стапель верфи!', 'info');
  };

  // Сохранение чертежа в архив
  const handleSaveBlueprint = () => {
    try {
      const blueprintToSave: ModularShipStructure = {
        ...ship,
        id: `blueprint-${Date.now()}`,
        name: ship.name || 'Пользовательский корабль',
        createdAt: Date.now(),
      };
      const updated = [blueprintToSave, ...savedBlueprints.filter((b) => b.id !== ship.id)];
      setSavedBlueprints(updated);
      localStorage.setItem('gobell_ship_blueprints', JSON.stringify(updated));
      showToast('Чертёж успешно сохранён в бортовой архив!', 'success');
    } catch {
      showToast('Ошибка сохранения чертежа', 'warn');
    }
  };

  if (!isOpen) return null;

  const currentSelectedHub = selectedShipSlot ? ship.hubs[selectedShipSlot.hubId] : null;
  const currentSelectedSlot = currentSelectedHub && selectedShipSlot ? currentSelectedHub.slots[selectedShipSlot.axis] : null;
  const currentInstalledDef = currentSelectedSlot?.installedModuleKind
    ? MODULE_CATALOG[currentSelectedSlot.installedModuleKind]
    : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-1 md:p-3 text-slate-100 font-mono select-none">
      <div
        ref={containerRef}
        className="relative w-full max-w-[1520px] h-[96vh] max-h-[980px] bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* ================================================================= */}
        {/* ВЕРХНЯЯ ШАПКА: Заголовок, статус стыковки, баланс кредитов и табы */}
        {/* ================================================================= */}
        <div className="flex flex-wrap items-center justify-between px-3 md:px-5 py-2.5 bg-gradient-to-r from-sky-950/90 via-slate-900 to-slate-950 border-b border-cyan-500/40 gap-2">
          {/* Левый блок: Название и статус физического дока */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-sm">
              <Box className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm md:text-base tracking-wider text-cyan-300">
                  ОРБИТАЛЬНАЯ МЕГАВЕРФЬ «ТАЛИОН»
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/60 px-2 py-0.5 rounded font-bold">
                  СРЕДНИЙ РОМБОТРИАКОНТАЭДР · 0.5R ПЛАНЕТЫ
                </span>
                {/* Кнопка быстрого переключения 3D обзора Мегаверфи */}
                <button
                  onClick={() => setMainMode(mainMode === 'MEGASTRUCTURE_VIEW' ? 'ASSEMBLY' : 'MEGASTRUCTURE_VIEW')}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition border ${
                    mainMode === 'MEGASTRUCTURE_VIEW'
                      ? 'bg-purple-900/80 border-purple-400 text-purple-200 shadow-sm'
                      : 'bg-cyan-950/80 hover:bg-cyan-900/80 border-cyan-500/60 text-cyan-300'
                  }`}
                  title="Переключить вид на космическую мегаверфь размером в половину планеты"
                >
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>{mainMode === 'MEGASTRUCTURE_VIEW' ? '🛠️ В СБОРОЧНЫЙ СТАПЕЛЬ' : '🪐 3D ОБЗОР ВЕРФИ (6371 км)'}</span>
                </button>
                {/* Тумблер физического присутствия (Этап 2 концепции) */}
                <button
                  onClick={() => setIsDockedAtShipyard(!isDockedAtShipyard)}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition border ${
                    isDockedAtShipyard
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-sm'
                      : 'bg-rose-950/80 border-rose-500 text-rose-300'
                  }`}
                  title="Кликните для переключения статуса пристыковки к верфи"
                >
                  <Anchor className="w-3 h-3" />
                  <span>{isDockedAtShipyard ? '🟢 В ДОКЕ ВЕРФИ' : '🔴 В ОТКРЫТОМ КОСМОСЕ'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-lg">
                Форма: <b>Средний ромботриаконтаэдр (30 ромбо-стапелей)</b> · Состыковка: <b className="text-amber-300">{SHIPYARD_DOCKING_FEE_CR} CR</b> · Выкуп: <b className="text-emerald-400">50%</b>
              </p>
            </div>
          </div>

          {/* Баланс кредитов пилота + казна верфи */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-3 py-1 flex items-center gap-2 shadow-inner">
              <span className="text-amber-400 text-xs font-bold">💳 БАЛАНС:</span>
              <span className="text-amber-200 font-extrabold text-sm tracking-wide">
                {playerCredits.toLocaleString()} CR
              </span>
              <button
                onClick={() => setPlayerCredits((prev) => prev + 10000)}
                className="text-[10px] bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40"
                title="Тестовое пополнение баланса (+10 000 CR)"
              >
                +10k
              </button>
            </div>

            {onApplyAsPlayerShip && (
              <button
                onClick={() => {
                  onApplyAsPlayerShip(ship, stats);
                  onClose();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>ПРИНЯТЬ КАК ФЛАГМАН</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 transition"
              title="Закрыть Верфь"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* НАВИГАЦИОННЫЕ ВКЛАДКИ РЕЖИМОВ */}
        {/* ================================================================= */}
        <div className="flex items-center bg-slate-900/80 border-b border-slate-800 px-3 py-1 text-xs gap-1 overflow-x-auto">
          <button
            onClick={() => setMainMode('ASSEMBLY')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'ASSEMBLY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>СБОРОЧНЫЙ ЛИСТ ВЕРФИ (50/50)</span>
          </button>

          <button
            onClick={() => setMainMode('MEGASTRUCTURE_VIEW')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'MEGASTRUCTURE_VIEW'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>🪐 МЕГАВЕРФЬ 0.5R ПЛАНЕТЫ (СРЕДНИЙ РОМБОТРИАКОНТАЭДР)</span>
          </button>

          <button
            onClick={() => setMainMode('DISPATCH_REGISTRY')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'DISPATCH_REGISTRY'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span>РЕЕСТР ПОКУПОК & ТЕЛЕПОРТАЦИЯ ({purchasedAwaitingDispatch.length})</span>
          </button>

          <button
            onClick={() => setMainMode('EXTERNAL_SUPPLIERS')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'EXTERNAL_SUPPLIERS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>ВНЕШНИЕ ПОСТАВЩИКИ (ЗАКАЗ МОДУЛЕЙ)</span>
          </button>

          <button
            onClick={() => setMainMode('SCRAP_WAREHOUSE')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'SCRAP_WAREHOUSE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
            <span>СКЛАД СКУПЩИКА ВЕРФИ ({scrappedModules.length})</span>
          </button>

          <button
            onClick={() => setMainMode('PRESETS_ARCHIVE')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'PRESETS_ARCHIVE'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>ПРЕСЕТЫ & ЧЕРТЕЖИ</span>
          </button>

          <button
            onClick={() => setMainMode('TELEMETRY')}
            className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition shrink-0 ${
              mainMode === 'TELEMETRY'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>ТТХ ФЛОТА</span>
          </button>
        </div>

        {/* Плавающий тост обратной связи */}
        {toastMessage && (
          <div
            className={`absolute top-14 right-4 z-50 px-4 py-2 rounded-xl border text-xs shadow-2xl flex items-center gap-2 animate-fade-in ${
              toastMessage.type === 'warn'
                ? 'bg-rose-950/95 border-rose-400 text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-sky-950/95 border-sky-400 text-sky-200'
                : 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* РЕЖИМ 1 ИЛИ ОБЗОР МЕГАВЕРФИ: ДВУХПАНЕЛЬНЫЙ ЛИСТ 50/50             */}
        {/* ================================================================= */}
        {(mainMode === 'ASSEMBLY' || mainMode === 'MEGASTRUCTURE_VIEW') && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Верхняя половина: Сборочный лист корабля/верфи (СЛЕВА) и Сборочный лист монтируемого блока/инспектор (СПРАВА) */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden border-b border-cyan-500/30">
              {/* ========================================== */}
              {/* ЛЕВАЯ ПОЛОВИНА: 3D ВЬЮПОРТ (КОРАБЛЬ / ВЕРФЬ) */}
              {/* ========================================== */}
              <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-500/30 bg-black relative">
                {/* Заголовок левого листа */}
                <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-extrabold text-cyan-200">
                      {mainMode === 'MEGASTRUCTURE_VIEW'
                        ? '3D ОБЗОР МЕГАВЕРФИ В ОРБИТЕ ПЛАНЕТЫ (МАСШТАБ 1:2)'
                        : 'СБОРОЧНЫЙ ЛИСТ КОРАБЛЯ (СЛЕВА)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {mainMode === 'MEGASTRUCTURE_VIEW'
                      ? 'D_верфи: 6 371 км · D_планеты: 12 742 км · Стапель #14'
                      : `Хабов: ${Object.keys(ship.hubs).length} · Масса: ${stats.totalMassTons} т · Тяга: ${stats.totalThrustKn} кН`}
                  </span>
                </div>

                {/* 3D Вьюпорт корабля */}
                <div className="flex-1 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={handleClick}
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                  />

                  {/* Тулбар управления камерой */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-xs z-10">
                    <button
                      onClick={() => setIsAutoRotate(!isAutoRotate)}
                      className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                        isAutoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'text-slate-400'
                      }`}
                    >
                      {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>360°</span>
                    </button>
                    <button
                      onClick={() => setIsThrustTestActive(!isThrustTestActive)}
                      className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                        isThrustTestActive ? 'bg-amber-500/20 text-amber-300 border border-amber-400' : 'text-slate-400'
                      }`}
                    >
                      <Flame className="w-3 h-3" />
                      <span>ТЕСТ</span>
                    </button>
                    <button
                      onClick={() => setZoom((z) => Math.min(3.5, z * 1.15))}
                      className="p-1 rounded bg-slate-900 text-slate-300"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setZoom((z) => Math.max(0.3, z * 0.85))}
                      className="p-1 rounded bg-slate-900 text-slate-300"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setYaw(0.75);
                        setPitch(0.35);
                        setZoom(1.0);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className="p-1 rounded bg-slate-900 text-slate-300"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Селектор и инспектор стыковочного узла корабля (нижняя плашка левого листа) */}
                <div className="p-3 bg-slate-950/95 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ВЫБРАННЫЙ СТЫКОВОЧНЫЙ УЗЕЛ КОРАБЛЯ:</span>
                    </span>

                    {/* Выпадающий список хабов */}
                    <div className="flex items-center gap-1">
                      {Object.values(ship.hubs).map((h) => (
                        <button
                          key={h.id}
                          onClick={() => setSelectedShipSlot({ hubId: h.id, axis: '+Z' })}
                          className={`text-[10px] px-2 py-0.5 rounded border transition ${
                            selectedShipSlot?.hubId === h.id
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {h.name.split('·')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6 кнопок осей для выбранного хаба */}
                  {currentSelectedHub && (
                    <div className="grid grid-cols-6 gap-1">
                      {ALL_AXES.map((ax) => {
                        const slot = currentSelectedHub.slots[ax];
                        const isChosen = selectedShipSlot?.axis === ax;
                        const isOccupied = !!slot.installedModuleKind || !!slot.connectedHubId;

                        return (
                          <button
                            key={ax}
                            onClick={() => setSelectedShipSlot({ hubId: currentSelectedHub.id, axis: ax })}
                            className={`p-1.5 rounded-lg border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                              isChosen
                                ? 'bg-cyan-500/30 border-cyan-300 text-white shadow-md ring-1 ring-cyan-400'
                                : isOccupied
                                ? 'bg-slate-900/90 border-slate-750 text-slate-300 hover:border-slate-600'
                                : 'bg-slate-950 border-dashed border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50'
                            }`}
                          >
                            <span className="text-[11px] font-extrabold">{ax}</span>
                            <span className="text-[9px] truncate max-w-[50px]">
                              {slot.connectedHubId ? '🔗ХАБ' : slot.installedModuleKind ? '⚙️МОД' : '—СВОБОДЕН'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Детальная карточка узла корабля */}
                  {selectedShipSlot && currentSelectedSlot ? (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: AXIS_METADATA[selectedShipSlot.axis].color }}
                          />
                          <span className="font-extrabold text-cyan-200">
                            {AXIS_METADATA[selectedShipSlot.axis].labelRu}
                          </span>
                          <span className="text-[10px] text-slate-400">({currentSelectedHub?.name})</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {currentSelectedSlot.connectedHubId ? (
                            <span className="text-sky-300 font-bold">
                              🔗 Пристыкован смежный хаб: {currentSelectedSlot.connectedHubId}
                            </span>
                          ) : currentInstalledDef ? (
                            <span className="text-amber-300 font-bold">
                              {CATEGORY_NAMES[currentInstalledDef.category]?.icon} {currentInstalledDef.name} (Масса:{' '}
                              {currentInstalledDef.massTons}т)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              🟢 Узел свободен для состыковки с выбранным модулем!
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Кнопка расстыковки узла */}
                      {(currentSelectedSlot.installedModuleKind || currentSelectedSlot.connectedHubId) && (
                        <button
                          onClick={handleUndockSlot}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Расстыковать и вернуть модуль в инвентарь верфи"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>РАССТЫКОВАТЬ УЗЕЛ</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 text-center text-xs text-slate-400 bg-slate-900/40 rounded-lg border border-dashed border-slate-800">
                      Кликните по узлу на 3D-модели или выберите ось выше
                    </div>
                  )}
                </div>
              </div>

              {/* ============================================================== */}
              {/* ПРАВАЯ ПОЛОВИНА: ИНСПЕКТОР МЕГАВЕРФИ ИЛИ СБОРОЧНЫЙ ЧЕРТЕЖ БЛОКА */}
              {/* ============================================================== */}
              {mainMode === 'MEGASTRUCTURE_VIEW' ? (
                <div className="w-full lg:w-1/2 flex flex-col bg-slate-950 overflow-y-auto p-4 space-y-3.5 font-mono text-xs">
                  {/* Заголовок инспектора */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-purple-950/80 border border-cyan-400/60 shadow-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-cyan-300">
                        ОРБИТАЛЬНАЯ МЕГАВЕРФЬ «ТАЛИОН»
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold">
                        СРЕДНИЙ РОМБОТРИАКОНТАЭДР
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      Колоссальная планетарная верфь размером в <b>половину планеты</b> (диаметр <b>6 371 км</b>).
                      30 самопересекающихся ромбических стапелей, 60 гранных магистралей и 24 глубококосмических причала.
                    </div>
                  </div>

                  {/* Сравнительная шкала 1:2 (Верфь = 50% планеты) */}
                  <div className="p-3 rounded-xl bg-black/80 border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">МАСШТАБ К ПЛАНЕТЕ:</span>
                      <span className="text-cyan-300 font-bold">Ровно 0.5R Планеты (1 : 2)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 w-1/2 flex items-center justify-center text-[9px] text-slate-950 font-black">
                        ВЕРФЬ (6 371 км)
                      </div>
                      <div className="h-full bg-slate-700/80 w-1/2 flex items-center justify-center text-[9px] text-slate-300 font-bold">
                        ТЕРРА-II (12 742 км)
                      </div>
                    </div>
                  </div>

                  {/* Математическая спецификация формы */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">ГЕОМЕТРИЯ:</span>
                      <span className="text-cyan-300 font-bold">Средний Ромботриаконтаэдр (W73)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">РОМБИЧЕСКИХ СТАПЕЛЕЙ:</span>
                      <span className="text-yellow-300 font-bold">30 граней (углы 41.8° / 138.2°)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">КАРКАСНЫХ МАГИСТРАЛЕЙ:</span>
                      <span className="text-emerald-400 font-bold">60 ребер со скоростными туннелями</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">ПРИЧАЛЬНЫХ УЗЛОВ:</span>
                      <span className="text-purple-300 font-bold">24 (12 внешних + 12 внутренних)</span>
                    </div>
                  </div>

                  {/* Статус вашего корабля в доке верфи */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-extrabold text-emerald-300 text-xs">ВАШ СТАПЕЛЬ: №14-ГАММА</span>
                      </div>
                      <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                        {isDockedAtShipyard ? '🟢 ПРИСТЫКОВАН К ВЕРФИ' : '🔴 В ОТКРЫТОМ КОСМОСЕ'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Флагман: {stats.hubsCount} хабов, масса {stats.totalMassTons} т, тяга {stats.totalThrustKn} кН, мощность +{stats.powerGenMw}/-{stats.powerDrainMw} МВт.
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Свободных стыковочных портов для расширения корпуса: {Object.values(ship.hubs).reduce((acc, h) => acc + Object.values(h.slots).filter(s => !s.installedModuleKind && !s.connectedHubId).length, 0)} шт.
                    </div>
                  </div>

                  {/* Баланс и ресурсы верфи */}
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-slate-400">МОДУЛЕЙ НА ВЕРФИ:</div>
                      <div className="text-cyan-300 font-extrabold text-sm">{shipyardInventoryModules.length} шт</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-slate-400">ЖДУТ ТЕЛЕПОРТАЦИИ:</div>
                      <div className="text-amber-300 font-extrabold text-sm">{purchasedAwaitingDispatch.length} шт</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                      <div className="text-slate-400">НА СКЛАДЕ СКУПЩИКА:</div>
                      <div className="text-emerald-400 font-extrabold text-sm">{scrappedModules.length} шт</div>
                    </div>
                  </div>

                  {/* Квантовое правило верфи */}
                  <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-[10px] text-slate-300 leading-relaxed space-y-1">
                    <div className="text-sky-300 font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-400" />
                      <span>ПРАВИЛО КВАНТОВОГО ЗАХВАТА МОДУЛЕЙ:</span>
                    </div>
                    <div>
                      Верфь — сборочная площадка, а не магазин. Вы заказываете детали у внешних поставщиков (завод, торговцы, P2P, клан) и телепортируете их в стапели верфи.
                    </div>
                    <div className="text-amber-300 font-semibold">
                      Доставленные на верфь блоки теряют способность к обратной телепортации: вывезти модуль можно только состыкованным с кораблем либо сдав скупщику за 50%!
                    </div>
                  </div>

                  {/* Кнопка перехода в сборочный лист */}
                  <button
                    onClick={() => setMainMode('ASSEMBLY')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition active:scale-[0.99]"
                  >
                    <Layers className="w-4 h-4 text-slate-950" />
                    <span>🛠️ ПЕРЕЙТИ В СБОРОЧНЫЙ СТАПЕЛЬ (МОНТАЖ СУДНА)</span>
                  </button>
                </div>
              ) : (
                <div className="w-full lg:w-1/2 flex flex-col bg-slate-950 overflow-y-auto">
                  {/* Заголовок правого листа */}
                  <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="font-extrabold text-amber-200">
                        СБОРОЧНЫЙ ЛИСТ МОНТИРУЕМОГО БЛОКА (СПРАВА)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {selectedInventoryModule ? `Выбран: ${selectedInventoryModule.id}` : 'Ожидание выбора блока'}
                    </span>
                  </div>

                  <div className="flex-1 p-3.5 space-y-3.5">
                  {selectedInventoryModule ? (
                    <div className="space-y-3.5">
                      {/* Карточка выбранного блока */}
                      {(() => {
                        const isHub = selectedInventoryModule.kind === 'HUB_CORE';
                        const def = isHub ? HUB_CORE_DEF : MODULE_CATALOG[selectedInventoryModule.kind as ModuleKind];
                        if (!def) return null;

                        return (
                          <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 space-y-3 shadow-xl">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border shadow-inner"
                                  style={{
                                    backgroundColor: def.visualColor + '22',
                                    borderColor: def.visualColor + '88',
                                  }}
                                >
                                  {isHub ? '🌐' : CATEGORY_NAMES[def.category]?.icon || '⚙️'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-extrabold text-sm text-slate-100">{def.name}</h4>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {selectedInventoryModule.id}
                                    </span>
                                  </div>
                                  <p className="text-xs text-amber-300 font-semibold">{def.tagline}</p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Номинал:</span>
                                <span className="text-sm font-extrabold text-amber-300">
                                  {selectedInventoryModule.nominalPriceCr} CR
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">{def.description}</p>

                            {/* Физические и технические ТТХ блока */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px]">
                              <div>
                                <span className="text-slate-400">Масса:</span>{' '}
                                <b className="text-slate-200">{def.massTons} т</b>
                              </div>
                              {def.thrustKn > 0 && (
                                <div>
                                  <span className="text-slate-400">Тяга:</span>{' '}
                                  <b className="text-amber-400">+{def.thrustKn} кН</b>
                                </div>
                              )}
                              {def.powerGenerationMw > 0 && (
                                <div>
                                  <span className="text-slate-400">Генерация:</span>{' '}
                                  <b className="text-yellow-400">+{def.powerGenerationMw} МВт/с</b>
                                </div>
                              )}
                              {def.powerConsumptionMw > 0 && (
                                <div>
                                  <span className="text-slate-400">Расход:</span>{' '}
                                  <b className="text-slate-300">-{def.powerConsumptionMw} МВт</b>
                                </div>
                              )}
                              {def.cargoCapacityTons > 0 && (
                                <div>
                                  <span className="text-slate-400">Трюм:</span>{' '}
                                  <b className="text-emerald-400">+{def.cargoCapacityTons} т</b>
                                </div>
                              )}
                              {def.firepowerDps > 0 && (
                                <div>
                                  <span className="text-slate-400">Огонь:</span>{' '}
                                  <b className="text-rose-400">+{def.firepowerDps} DPS</b>
                                </div>
                              )}
                              {def.sensorRangeKm > 0 && (
                                <div>
                                  <span className="text-slate-400">Сенсоры:</span>{' '}
                                  <b className="text-cyan-400">+{def.sensorRangeKm} км</b>
                                </div>
                              )}
                            </div>

                            {/* Статус телепортации по ключевому правилу */}
                            <div className="flex items-center gap-2 p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200">
                              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                <b>Ключевое правило:</b> Модуль доставлен на верфь. Обратная телепортация заблокирована.
                                Вывод: только пристыковка или продажа скупщику за 50%.
                              </span>
                            </div>

                            {/* ======================================================= */}
                            {/* СТЫКОВОЧНЫЕ УЗЛЫ ВЫБРАННОГО БЛОКА (ЕСЛИ ИХ НЕСКОЛЬКО)   */}
                            {/* ======================================================= */}
                            <div className="space-y-2 pt-1 border-t border-slate-800">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>СТЫКОВОЧНЫЕ УЗЛЫ ВЫБРАННОГО БЛОКА ({availableModulePorts.length}):</span>
                                </span>
                                <span className="text-[10px] text-cyan-300 font-semibold">
                                  {availableModulePorts.length > 1
                                    ? 'ВЫБЕРИТЕ УЗЕЛ ДЛЯ СОСТЫКОВКИ'
                                    : 'ШТАТНЫЙ ФЛАНЕЦ'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {availableModulePorts.map((port) => {
                                  const isPortActive = selectedModulePortId === port.id;
                                  return (
                                    <button
                                      key={port.id}
                                      onClick={() => setSelectedModulePortId(port.id)}
                                      className={`p-2 rounded-lg border text-left transition flex items-center justify-between ${
                                        isPortActive
                                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100 ring-1 ring-cyan-400'
                                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <div>
                                        <div className="text-xs font-bold">{port.label}</div>
                                        <div className="text-[10px] text-slate-400">{port.description}</div>
                                      </div>
                                      {isPortActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* ======================================================= */}
                            {/* БЛОК СТЫКОВКИ И СКУПЩИКА                                */}
                            {/* ======================================================= */}
                            <div className="pt-2 border-t border-slate-800 space-y-2">
                              {/* Индикатор готовности пары узлов */}
                              <div className="p-2.5 rounded-lg bg-black/70 border border-slate-850 flex items-center justify-between text-xs">
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                    Согласование узлов:
                                  </div>
                                  <div className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                                    <span>
                                      {selectedShipSlot
                                        ? `[Корабль: ${selectedShipSlot.hubId} / ${selectedShipSlot.axis}]`
                                        : '[Узел корабля не выбран]'}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                                    <span>[Блок: {selectedModulePortId || 'Штатный узел'}]</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">Тариф верфи:</span>
                                  <span className="text-xs font-extrabold text-amber-400">
                                    {SHIPYARD_DOCKING_FEE_CR} CR
                                  </span>
                                </div>
                              </div>

                              {/* Главная кнопка: СОСТЫКОВАТЬ */}
                              <button
                                onClick={handleDockNodes}
                                disabled={
                                  !selectedShipSlot ||
                                  !!currentSelectedSlot?.installedModuleKind ||
                                  !!currentSelectedSlot?.connectedHubId
                                }
                                className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                                  !selectedShipSlot ||
                                  !!currentSelectedSlot?.installedModuleKind ||
                                  !!currentSelectedSlot?.connectedHubId
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 active:scale-[0.99]'
                                }`}
                              >
                                <Anchor className="w-4 h-4" />
                                <span>
                                  СОСТЫКОВАТЬ УЗЛЫ [СТАРТ МОНТАЖА] (-{SHIPYARD_DOCKING_FEE_CR} CR)
                                </span>
                              </button>

                              {/* Кнопка сдать скупщику верфи тут же */}
                              <button
                                onClick={() => handleSellToScrapDealer(selectedInventoryModule)}
                                className="w-full py-2 px-3 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                <span>
                                  ПРОДАТЬ СКУПЩИКУ ВЕРФИ (+50% = +
                                  {Math.round(selectedInventoryModule.nominalPriceCr * SCRAP_DEALER_RATE)} CR)
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Box className="w-7 h-7 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-slate-200">БЛОК НЕ ВЫБРАН</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Выберите модуль из расположенного ниже списка доступных на верфи модулей для просмотра
                          сборочного чертежа и выбора стыковочного узла.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* СПРАВА ВНИЗУ: СПИСОК ДОСТУПНЫХ МОДУЛЕЙ НА ВЕРФИ ЛИБО 30 СТАПЕЛЕЙ */}
            {/* ============================================================== */}
            {mainMode === 'MEGASTRUCTURE_VIEW' ? (
              <div className="h-44 md:h-48 bg-slate-950 p-3 flex flex-col border-t border-cyan-500/40 font-mono">
                <div className="flex flex-wrap items-center justify-between pb-1.5 border-b border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-extrabold text-xs text-cyan-300">
                      ОРБИТАЛЬНАЯ ПАЛУБА: 30 РОМБИЧЕСКИХ СТАПЕЛЕЙ МЕГАВЕРФИ
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Размер объекта: 6 371 км (0.5R Планеты) · 60 ребер · 24 причальных узла
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-emerald-400 font-bold">🟢 Стапель #14: ВАШ ФЛАГМАН</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-cyan-400">Свободно стапелей: 19</span>
                  </div>
                </div>

                {/* Горизонтальная лента 30 стапелей среднего ромботриаконтаэдра */}
                <div className="flex-1 flex items-center gap-2 overflow-x-auto py-2">
                  {Array.from({ length: 30 }, (_, i) => {
                    const slipNum = i + 1;
                    const isPlayerSlip = slipNum === 14;
                    return (
                      <div
                        key={slipNum}
                        className={`w-40 shrink-0 p-2 rounded-xl border flex flex-col justify-between h-full transition ${
                          isPlayerSlip
                            ? 'bg-amber-950/50 border-amber-400 ring-1 ring-amber-400 shadow-lg'
                            : i % 3 === 0
                            ? 'bg-cyan-950/30 border-cyan-800/50 text-slate-400'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-bold ${isPlayerSlip ? 'text-amber-300' : 'text-slate-300'}`}>
                            СТАПЕЛЬ #{slipNum}
                          </span>
                          <span className="text-[9px] px-1 rounded bg-black/60 font-mono">
                            {isPlayerSlip ? 'ИГРОК' : i % 3 === 0 ? 'КРЕЙСЕР' : 'СВОБОДЕН'}
                          </span>
                        </div>

                        <div className="text-[9px] my-1">
                          {isPlayerSlip ? (
                            <span className="text-amber-200 font-bold">
                              {stats.hubsCount} хаба · {stats.totalMassTons} т
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {i % 3 === 0 ? 'Монтаж фрегата' : 'Квантовый док'}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setMainMode('ASSEMBLY')}
                          className={`w-full py-0.5 rounded text-[9px] font-bold transition ${
                            isPlayerSlip
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                          }`}
                        >
                          {isPlayerSlip ? 'Войти в док' : 'Инспектировать'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-44 md:h-48 bg-slate-950 p-3 flex flex-col border-t border-cyan-500/40">
              <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-extrabold text-xs text-emerald-300">
                    СПИСОК ДОСТУПНЫХ МОДУЛЕЙ НА ВЕРФИ ({filteredShipyardModules.length})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Статус: IN_SHIPYARD_INVENTORY · Телепортация заблокирована
                  </span>
                </div>

                {/* Фильтры категорий */}
                <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                  <button
                    onClick={() => setSelectedInventoryCategoryFilter('ALL')}
                    className={`px-2 py-0.5 rounded border transition ${
                      selectedInventoryCategoryFilter === 'ALL'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ВСЕ ({shipyardInventoryModules.length})
                  </button>
                  <button
                    onClick={() => setSelectedInventoryCategoryFilter('HUB_CORE')}
                    className={`px-2 py-0.5 rounded border transition ${
                      selectedInventoryCategoryFilter === 'HUB_CORE'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ХАБЫ 6-XYZ
                  </button>
                  <button
                    onClick={() => setSelectedInventoryCategoryFilter('ENGINE')}
                    className={`px-2 py-0.5 rounded border transition ${
                      selectedInventoryCategoryFilter === 'ENGINE'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ДЮЗЫ
                  </button>
                  <button
                    onClick={() => setSelectedInventoryCategoryFilter('ENERGY')}
                    className={`px-2 py-0.5 rounded border transition ${
                      selectedInventoryCategoryFilter === 'ENERGY'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    КРЫЛЬЯ
                  </button>
                  <button
                    onClick={() => setSelectedInventoryCategoryFilter('CARGO')}
                    className={`px-2 py-0.5 rounded border transition ${
                      selectedInventoryCategoryFilter === 'CARGO'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ТРЮМЫ
                  </button>
                  <button
                    onClick={() => setSelectedInventoryCategoryFilter('WEAPONS')}
                    className={`px-2 py-0.5 rounded border transition ${
                      selectedInventoryCategoryFilter === 'WEAPONS'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ОРУЖИЕ
                  </button>

                  <button
                    onClick={() => setMainMode('DISPATCH_REGISTRY')}
                    className="ml-2 px-2.5 py-0.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-400 text-sky-200 font-bold flex items-center gap-1 transition"
                  >
                    <Send className="w-3 h-3 text-sky-400" />
                    <span>+ Доставить из покупок</span>
                  </button>
                </div>
              </div>

              {/* Горизонтальный список карточек модулей */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden pt-2 flex items-center gap-2.5">
                {filteredShipyardModules.length > 0 ? (
                  filteredShipyardModules.map((item) => {
                    const isHub = item.kind === 'HUB_CORE';
                    const def = isHub ? HUB_CORE_DEF : MODULE_CATALOG[item.kind as ModuleKind];
                    if (!def) return null;
                    const isSelected = selectedInventoryModuleId === item.id;
                    const scrapPrice = Math.round(item.nominalPriceCr * SCRAP_DEALER_RATE);

                    return (
                      <div
                        key={item.id}
                        className={`w-64 shrink-0 p-2.5 rounded-xl border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400 shadow-lg'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-base">{isHub ? '🌐' : CATEGORY_NAMES[def.category]?.icon}</span>
                            <span className="text-xs font-bold text-slate-200 truncate">{def.name}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            {item.id}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center justify-between my-1">
                          <span>Номинал: {item.nominalPriceCr} CR</span>
                          <span className="text-emerald-400 font-bold">Скупка: +{scrapPrice} CR</span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              setSelectedInventoryModuleId(item.id);
                              // Автовыбор узла корабля если не выбран
                              if (!selectedShipSlot) {
                                setSelectedShipSlot({ hubId: ship.rootHubId, axis: '+X' });
                              }
                            }}
                            className={`flex-1 py-1 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                            }`}
                          >
                            <Box className="w-3 h-3" />
                            <span>{isSelected ? 'ВЫБРАН' : 'ВЫБРАТЬ'}</span>
                          </button>

                          <button
                            onClick={() => handleSellToScrapDealer(item)}
                            className="px-2 py-1 rounded text-[10px] bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 font-bold transition"
                            title="Продать скупщику за 50%"
                          >
                            50%
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-2">
                    <span>В инвентаре верфи нет доступных модулей по выбранному фильтру.</span>
                    <button
                      onClick={() => setMainMode('DISPATCH_REGISTRY')}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      Открыть реестр покупок и доставить модули на верфь
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* РЕЖИМ 2: ЛИЧНЫЙ РЕЕСТР ПОКУПОК И ЗАПРОС НА ДОСТАВКУ (ТЕЛЕПОРТАЦИЮ) */}
        {/* ================================================================= */}
        {mainMode === 'DISPATCH_REGISTRY' && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-slate-950">
            {/* Описание концепции 5 этапов */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-cyan-950/60 border border-sky-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Send className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-base text-sky-200">
                    ЛИЧНЫЙ РЕЕСТР ПОКУПОК & ТЕЛЕПОРТАЦИЯ НА ВЕРФЬ
                  </h3>
                </div>
                <span className="text-xs bg-sky-900/80 text-sky-200 border border-sky-400/50 px-3 py-1 rounded-full font-bold">
                  {purchasedAwaitingDispatch.length} МОДУЛЕЙ ОЖИДАЮТ ДОСТАВКИ
                </span>
              </div>

              {/* Инфографика 5 этапов жизненного цикла */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs pt-1 border-t border-slate-800">
                <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800">
                  <div className="font-bold text-sky-300">Этап 1: Покупка</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Покупка у внешних поставщиков. Модуль в реестре игрока (AWAITING_DISPATCH).
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800">
                  <div className="font-bold text-sky-300">Этап 2: Физическое присутствие</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Пилот физически прибывает и пристыковывается к верфи в доке.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/50 border border-sky-500/40 bg-sky-950/20">
                  <div className="font-bold text-cyan-300">Этап 3: Запрос на доставку</div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Клик по кнопке «Доставить на верфь». Мгновенный перенос в инвентарь верфи.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800">
                  <div className="font-bold text-emerald-300">Этап 4: Появление на стапеле</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Статус IN_SHIPYARD_INVENTORY. Обратная телепортация блокируется!
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800">
                  <div className="font-bold text-amber-300">Этап 5: Использование</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Состыковка с кораблем (тариф 250 CR) или сдача скупщику за 50%.
                  </p>
                </div>
              </div>
            </div>

            {/* Карточки модулей в реестре */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-200">
                  СПИСОК МОДУЛЕЙ В РЕЕСТРЕ (PURCHASED_AWAITING_DISPATCH):
                </h4>
                <button
                  onClick={() => setMainMode('EXTERNAL_SUPPLIERS')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>КУПИТЬ ЕЩЁ МОДУЛИ У ПОСТАВЩИКОВ</span>
                </button>
              </div>

              {purchasedAwaitingDispatch.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {purchasedAwaitingDispatch.map((item) => {
                    const isHub = item.kind === 'HUB_CORE';
                    const def = isHub ? HUB_CORE_DEF : MODULE_CATALOG[item.kind as ModuleKind];
                    if (!def) return null;

                    const refundMfr = Math.round(item.nominalPriceCr * MANUFACTURER_RETURN_RATE);
                    const sellTrader = Math.round(item.nominalPriceCr * PLANET_TRADER_SELL_RATE);

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 space-y-3 shadow-lg flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{isHub ? '🌐' : CATEGORY_NAMES[def.category]?.icon}</span>
                              <div>
                                <h5 className="font-extrabold text-sm text-slate-100">{def.name}</h5>
                                <span className="text-[10px] text-slate-400">{item.id}</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                              ОПЛАЧЕН
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2">{def.description}</p>

                          <div className="p-2 rounded-lg bg-black/60 border border-slate-800 text-[11px] space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Поставщик:</span>
                              <span className="text-slate-200 font-semibold">{item.supplierName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Цена покупки:</span>
                              <span className="text-amber-300 font-bold">{item.purchasedPriceCr} CR</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Номинал:</span>
                              <span className="text-slate-300">{item.nominalPriceCr} CR</span>
                            </div>
                          </div>
                        </div>

                        {/* Кнопки действий: Доставить на верфь / Возврат заводу 90% / Продажа торговцу 80% */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleTeleportToShipyard(item)}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                          >
                            <Send className="w-4 h-4" />
                            <span>⚡ ДОСТАВИТЬ НА ВЕРФЬ (ТЕЛЕПОРТАЦИЯ)</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handleReturnToManufacturer(item)}
                              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 text-[10px] font-bold transition truncate"
                              title="Официальный гарантийный возврат на завод"
                            >
                              ↩ Завод (90% = +{refundMfr} CR)
                            </button>

                            <button
                              onClick={() => handleSellToPlanetTrader(item)}
                              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition truncate"
                              title="Продажа планетарным торговцам"
                            >
                              🪐 Торговцу (80% = +{sellTrader} CR)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
                  <Send className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300 font-bold">Личный реестр покупок пуст</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Все купленные вами модули уже доставлены на верфь или смонтированы на корабль. Вы можете заказать
                    новые блоки у внешних поставщиков.
                  </p>
                  <button
                    onClick={() => setMainMode('EXTERNAL_SUPPLIERS')}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Перейти к внешним поставщикам
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* РЕЖИМ 3: ВНЕШНИЕ ПОСТАВЩИКИ (ПРОИЗВОДИТЕЛЬ, ТОРГОВЕЦ, P2P, КЛАН)  */}
        {/* ================================================================= */}
        {mainMode === 'EXTERNAL_SUPPLIERS' && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-slate-950">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-amber-200">
                  ВНЕШНИЕ ПОСТАВЩИКИ & РЕГИОНАЛЬНЫЕ ДИЛЕРЫ
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                <b>Концепция:</b> Верфь НЕ является магазином и не торгует компонентами. Все модули заказываются у
                внешних поставщиков и поступают в ваш реестр со статусом <code>PURCHASED_AWAITING_DISPATCH</code>, после
                чего могут быть доставлены на верфь телепортацией.
              </p>
            </div>

            {/* Выбор канала поставщика */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(SUPPLIER_CHANNELS) as SupplierChannel[]).map((ch) => {
                const info = SUPPLIER_CHANNELS[ch];
                const isActive = activeSupplierChannel === ch;

                return (
                  <button
                    key={ch}
                    onClick={() => setActiveSupplierChannel(ch)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isActive
                        ? 'bg-gradient-to-b from-amber-950/60 to-slate-900 border-amber-400 ring-1 ring-amber-400 shadow-xl'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-slate-800 text-slate-200 border border-slate-700">
                          {info.badgeRu}
                        </span>
                        {isActive && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-100 mt-2">{info.titleRu}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{info.descriptionRu}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-bold text-amber-300">
                      Коэффициент цены: {info.priceMultiplier * 100}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Каталог модулей для заказа у выбранного поставщика */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-200">
                ДОСТУПНО ДЛЯ ЗАКАЗА У «{SUPPLIER_CHANNELS[activeSupplierChannel].titleRu}»:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Карточка 6-лучевого хаба */}
                {(() => {
                  const mult = SUPPLIER_CHANNELS[activeSupplierChannel].priceMultiplier;
                  const price = Math.round(HUB_CORE_DEF.basePriceCr * mult);

                  return (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">🌐</span>
                            <div>
                              <h5 className="font-extrabold text-sm text-slate-100">{HUB_CORE_DEF.name}</h5>
                              <span className="text-[10px] text-cyan-400 font-bold">ОСНОВА КОРАБЛЕСТРОЕНИЯ</span>
                            </div>
                          </div>
                          <span className="text-sm font-extrabold text-amber-300">{price} CR</span>
                        </div>
                        <p className="text-xs text-slate-300">{HUB_CORE_DEF.description}</p>
                        <div className="p-2 rounded bg-black/60 border border-slate-800 text-[11px] text-slate-300">
                          Масса: 6.0 т · 6 шлюзов (+X, -X, +Y, -Y, +Z, -Z)
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyFromSupplier('HUB_CORE', activeSupplierChannel)}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>КУПИТЬ ЗА {price} CR</span>
                      </button>
                    </div>
                  );
                })()}

                {/* 2. Карточки модулей из каталога */}
                {(Object.keys(MODULE_CATALOG) as ModuleKind[]).map((kind) => {
                  const def = MODULE_CATALOG[kind];
                  const mult = SUPPLIER_CHANNELS[activeSupplierChannel].priceMultiplier;
                  const price = Math.round(def.basePriceCr * mult);

                  return (
                    <div
                      key={kind}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 space-y-3 shadow-lg flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{CATEGORY_NAMES[def.category]?.icon}</span>
                            <div>
                              <h5 className="font-extrabold text-sm text-slate-100">{def.name}</h5>
                              <span className="text-[10px] text-slate-400">{def.badge}</span>
                            </div>
                          </div>
                          <span className="text-sm font-extrabold text-amber-300">{price} CR</span>
                        </div>

                        <p className="text-xs text-slate-300 line-clamp-2">{def.description}</p>

                        <div className="grid grid-cols-2 gap-1 p-2 rounded bg-black/60 border border-slate-800 text-[11px] text-slate-300">
                          <span>Масса: {def.massTons} т</span>
                          {def.thrustKn > 0 && <span className="text-amber-400">Тяга: {def.thrustKn} кН</span>}
                          {def.powerGenerationMw > 0 && (
                            <span className="text-yellow-400">Энергия: +{def.powerGenerationMw} МВт</span>
                          )}
                          {def.cargoCapacityTons > 0 && (
                            <span className="text-emerald-400">Трюм: +{def.cargoCapacityTons} т</span>
                          )}
                          {def.firepowerDps > 0 && <span className="text-rose-400">Урон: +{def.firepowerDps} DPS</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyFromSupplier(kind, activeSupplierChannel)}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>КУПИТЬ ЗА {price} CR</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* РЕЖИМ 4: СКЛАД СКУПЩИКА ВЕРФИ (УТИЛЬ И СКУПЛЕННЫЕ ЗА 50% МОДУЛИ)   */}
        {/* ================================================================= */}
        {mainMode === 'SCRAP_WAREHOUSE' && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-slate-950">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Warehouse className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-base text-emerald-200">
                    СКЛАД ВЛАДЕЛЬЦА ВЕРФИ · СКУПЩИК УТИЛЯ
                  </h3>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  Именно поэтому скупщик есть в каждой верфи: модули, доставленные на верфь или снятые с кораблей,
                  теряют способность к обратной телепортации. Пилоты могут мгновенно сдать ненужные узлы скупщику за 50%
                  их номинала.
                </p>
              </div>

              {/* Статистика скупки */}
              <div className="flex items-center gap-4 text-xs bg-black/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">КАЗНА ВЕРФИ:</span>
                  <span className="font-extrabold text-amber-300 text-sm">
                    {shipyardState.shipyardOwnerFundCr.toLocaleString()} CR
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                  <span className="text-slate-400 block text-[10px]">ВЫКУПЛЕНО УЗЛОВ:</span>
                  <span className="font-extrabold text-emerald-300 text-sm">{shipyardState.scrappedCount} шт</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-200">
                ВЫКУПЛЕННЫЙ СКУПЩИКОМ ЛОМ (НА СКЛАДЕ ВЛАДЕЛЬЦА ВЕРФИ):
              </h4>

              {scrappedModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {scrappedModules.map((item) => {
                    const isHub = item.kind === 'HUB_CORE';
                    const def = isHub ? HUB_CORE_DEF : MODULE_CATALOG[item.kind as ModuleKind];
                    if (!def) return null;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 opacity-80 hover:opacity-100 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{isHub ? '🌐' : CATEGORY_NAMES[def.category]?.icon}</span>
                            <div>
                              <h5 className="font-bold text-sm text-slate-200">{def.name}</h5>
                              <span className="text-[10px] text-slate-500">{item.id}</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            СКЛАД ВЕРФИ
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{def.description}</p>
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
                          <span>Номинал: {item.nominalPriceCr} CR</span>
                          <span className="text-emerald-400">Выплачено пилоту: +{Math.round(item.nominalPriceCr * 0.5)} CR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-xs text-slate-400">
                  На складе верфи пока нет скупленных модулей. Вы можете сдать любой ненужный модуль из инвентаря верфи
                  за 50% номинала.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* РЕЖИМ 5: ПРЕСЕТЫ И АРХИВ ЧЕРТЕЖЕЙ                                 */}
        {/* ================================================================= */}
        {mainMode === 'PRESETS_ARCHIVE' && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-slate-950">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/40 space-y-1">
              <h3 className="font-extrabold text-base text-purple-200">
                ЗАВОДСКИЕ ПРОЕКТЫ И БОРТОВОЙ АРХИВ ЧЕРТЕЖЕЙ
              </h3>
              <p className="text-xs text-slate-300">
                Канонические проекты на основе 6-лучевого каркаса XYZ и возможность сохранения чертежей.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Пресет 1: Канонический Эксплорер */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-cyan-200">
                      Канонический 6-секционный Эксплорер (ББД)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      5 дюз кормы → Солнечные крылья → Радары → Трюмы 40т → Оружие → Рубка пилота
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                    ГОСТ
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 bg-black/50 p-2.5 rounded-lg border border-slate-800">
                  <div>Хабов: 6 · Модулей: 18</div>
                  <div>Масса: ~140 т · Тяга: 520 кН · Трюм: 80 т</div>
                </div>
                <button
                  onClick={() => {
                    handleLoadPreset('CANONICAL');
                    setMainMode('ASSEMBLY');
                  }}
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  ЗАГРУЗИТЬ НА СТАПЕЛЬ ВЕРФИ
                </button>
              </div>

              {/* Пресет 2: Тяжёлый рудовоз */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-200">
                      Тяжёлый Рудовоз «Гравитон-Майнер»
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Гравитационная дюза, 5 герметичных трюмов на 320 тонн и посадочный челнок
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 bg-black/50 p-2.5 rounded-lg border border-slate-800">
                  <div>Хабов: 3 · Трюм: 320 т · Тяга: 560 кН</div>
                </div>
                <button
                  onClick={() => {
                    handleLoadPreset('MINER');
                    setMainMode('ASSEMBLY');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/40"
                >
                  ЗАГРУЗИТЬ НА СТАПЕЛЬ ВЕРФИ
                </button>
              </div>

              {/* Пресет 3: Патрульный корвет */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-200">
                      Патрульный Корвет «Вектор-Перехватчик»
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Фотонная дюза, спаренная плазма, флагманский мостик и РЛС 360°
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 bg-black/50 p-2.5 rounded-lg border border-slate-800">
                  <div>Хабов: 2 · Урон: 280 DPS · Тяга: 390 кН</div>
                </div>
                <button
                  onClick={() => {
                    handleLoadPreset('CORVETTE');
                    setMainMode('ASSEMBLY');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-rose-500/40"
                >
                  ЗАГРУЗИТЬ НА СТАПЕЛЬ ВЕРФИ
                </button>
              </div>

              {/* Пресет 4: Чистый Хаб для свободной сборки */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-200">
                      Чистый базовый хаб XYZ (С чистого листа)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Одиночная 6-лучевая сфера для свободного конструирования с нуля
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 bg-black/50 p-2.5 rounded-lg border border-slate-800">
                  <div>Хабов: 1 · Все 6 узлов свободны</div>
                </div>
                <button
                  onClick={() => {
                    handleLoadPreset('SINGLE');
                    setMainMode('ASSEMBLY');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                >
                  ОЧИСТИТЬ СТАПЕЛЬ (1 ХАБ)
                </button>
              </div>
            </div>

            {/* Сохранение текущего чертежа */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-200">Бортовой архив чертежей:</h4>
                <p className="text-xs text-slate-400">Сохранено: {savedBlueprints.length} чертежей</p>
              </div>
              <button
                onClick={handleSaveBlueprint}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>СОХРАНИТЬ ТЕКУЩИЙ ЧЕРТЁЖ</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* РЕЖИМ 6: ПОЛНЫЕ ТАКТИКО-ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ ФЛОТА            */}
        {/* ================================================================= */}
        {mainMode === 'TELEMETRY' && (
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-slate-950">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-blue-500/40">
              <h3 className="font-extrabold text-base text-blue-200">
                ТАКТИКО-ТЕХНИЧЕСКИЙ ПАСПОРТ ФЛАГМАНА
              </h3>
              <p className="text-xs text-slate-300">
                Интегральные характеристики рассчитываются честно на основе физических параметров всех установленных
                модулей и несущих хабов.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Общая масса:</span>
                <div className="text-lg font-extrabold text-cyan-300 mt-1">{stats.totalMassTons} т</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Маршевая тяга:</span>
                <div className="text-lg font-extrabold text-amber-400 mt-1">{stats.totalThrustKn} кН</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Тяговооружённость (TWR):</span>
                <div className="text-lg font-extrabold text-emerald-400 mt-1">
                  {stats.thrustToWeightRatio.toFixed(2)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Энергобаланс (генерация / расход):</span>
                <div className="text-lg font-extrabold text-yellow-300 mt-1">
                  +{stats.powerGenMw} / -{stats.powerDrainMw} МВт
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Вместимость грузовых трюмов:</span>
                <div className="text-lg font-extrabold text-emerald-300 mt-1">{stats.cargoCapacityTons} т</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Огневая мощь (DPS):</span>
                <div className="text-lg font-extrabold text-rose-400 mt-1">{stats.firepowerDps} ед</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Дальность сенсоров РЛС:</span>
                <div className="text-lg font-extrabold text-cyan-400 mt-1">{stats.maxSensorRangeKm} км</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Количество несущих хабов:</span>
                <div className="text-lg font-extrabold text-purple-300 mt-1">{stats.hubsCount} шт</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
