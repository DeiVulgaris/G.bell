import React, {useState, useEffect} from 'react';
import {
  X,
  Zap,
  Shield,
  Crosshair,
  Radio,
  Sun,
  Battery,
  BatteryCharging,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Layers,
  ChevronRight,
  Sparkles,
  MapPin,
  Plus,
  Users,
  Lock,
  Globe,
  Trash2,
  Check,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Swords,
} from 'lucide-react';
import {
  SentinelPlatformTelemetry,
  SentinelStrikePowerMode,
  SentinelAiMode,
  SentinelDeploymentLocationType,
  SentinelIffProtocol,
  SentinelTargetThreatFilters,
  SentinelClanExceptionEntry,
  SentinelExceptionsConfig,
  SentinelZoneInfluencePreset,
  SentinelEngagementDirective,
  SENTINEL_STRIKE_MODES,
  SENTINEL_DEPLOYMENT_LOCATIONS_META,
  SENTINEL_ZONE_PRESETS_META,
  SENTINEL_ENGAGEMENT_DIRECTIVES_META,
  DEFAULT_TARGET_FILTERS,
  DEFAULT_EXCEPTIONS_CONFIG,
  executeSentinelStrike,
  updateSentinelSolarAccumulator,
  evaluateTargetIffStatus,
  createSentinelAtLocation,
  createSentinelSwarmCloud,
  executeSwarmAmbushCrossfire,
  calculateVolumetricEngineSuppression,
  resolveEngagementStrikeMode,
  SwarmCrossfireResult,
  VolumetricEngineSuppressionResult,
  SentinelBladeModification,
  SENTINEL_BLADE_MODS_META,
  setSentinelBladeModification,
} from '../data/autonomousSentinelEngine';
import { SentinelMine3DCanvas } from './SentinelMine3DCanvas';

interface AutonomousSentinelModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentinelNetwork: SentinelPlatformTelemetry[];
  activeSentinelId: string;
  onSelectActiveSentinel: (id: string) => void;
  onUpdateSentinel: (updated: SentinelPlatformTelemetry) => void;
  onDeployNewSentinel: (location: SentinelDeploymentLocationType, customCoords?: { x: number; y: number; z: number }) => void;
  onDeploySwarmCloud?: (
    location: SentinelDeploymentLocationType,
    nodesCount: number,
    clusterName: string,
    directive: SentinelEngagementDirective,
    customCoords?: { x: number; y: number; z: number }
  ) => void;
  onBatchUpdateDirectives?: (directive: SentinelEngagementDirective, clusterId?: string) => void;
  onPlayBeep?: (type: 'LASER' | 'HIT' | 'EXPLODE' | 'HYPERSPACE' | 'DOCK' | 'MISSION') => void;
  pilotName?: string;
  currentShipPos?: { x: number; y: number; z: number };
}

export const AutonomousSentinelModal: React.FC<AutonomousSentinelModalProps> = ({
  isOpen,
  onClose,
  sentinelNetwork,
  activeSentinelId,
  onSelectActiveSentinel,
  onUpdateSentinel,
  onDeployNewSentinel,
  onDeploySwarmCloud,
  onBatchUpdateDirectives,
  onPlayBeep,
  pilotName = 'Командир',
  currentShipPos = { x: 0, y: 0, z: 8000 },
}) => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'MODEL_3D' | 'IFF' | 'WEAPONS' | 'SWARM_AMBUSH' | 'ENGINE_SUPPRESSION' | 'SOLAR_BATTERY' | 'LOG'
  >('OVERVIEW');
  const [testTargetName, setTestTargetName] = useState('Тренажёрная мишень калибрации');
  const [strikeFeedback, setStrikeFeedback] = useState<string | null>(null);
  const [isFiringFlash, setIsFiringFlash] = useState(false);

  // Состояние интерактивного радара дистанции приближения (для проверки эскалации силы)
  const [simTargetDistance, setSimTargetDistance] = useState<number>(6800);

  // Состояние объёмного торможения двигателя (не менее трёх часовых, торможение в тоннах)
  const [simFieldDistToCenter, setSimFieldDistToCenter] = useState<number>(1400); // 0 (в центре = 0т) .. 2000 (у часовых = 100%)
  const [volumetricSuppressionReport, setVolumetricSuppressionReport] =
    useState<VolumetricEngineSuppressionResult | null>(null);
  const [isFieldActivePulse, setIsFieldActivePulse] = useState(false);

  // Состояние развёртывания тактического «Облака часовых» (Swarm Ambush Trap)
  const [swarmDeployLocation, setSwarmDeployLocation] =
    useState<SentinelDeploymentLocationType>('CURRENT_SHIP_POSITION');
  const [swarmNodesCount, setSwarmNodesCount] = useState<number>(5);
  const [swarmClusterName, setSwarmClusterName] = useState<string>(
    '«Смертельный мешок корсаров»'
  );
  const [swarmInitialDirective, setSwarmInitialDirective] =
    useState<SentinelEngagementDirective>('DESTROY_ONLY');

  // Состояние тактического симулятора засады: «Завлечь преследователя в облако»
  const [simPursuerType, setSimPursuerType] = useState<string>('PIRATE_CRUISER');
  const [swarmCrossfireReport, setSwarmCrossfireReport] =
    useState<SwarmCrossfireResult | null>(null);
  const [isSwarmFiringFlash, setIsSwarmFiringFlash] = useState<boolean>(false);

  // Форма добавления нового клана в список исключений «КРОМЕ»
  const [newClanName, setNewClanName] = useState('');
  const [newClanNumber, setNewClanNumber] = useState('#77');
  const [newClanAllowPirates, setNewClanAllowPirates] = useState(true);
  const [newClanNote, setNewClanNote] = useState('Гарнизон базы корсаров');

  // Состояние интерактивного симулятора IFF «Свой-Чужой»
  const [testIffKind, setTestIffKind] = useState<
    'PLAYER' | 'SHUTTLE' | 'TRADER' | 'PIRATE' | 'DICTATOR_DRONE' | 'DEBRIS' | 'MILITARY' | 'MARAUDER'
  >('PIRATE');
  const [testIffClan, setTestIffClan] = useState<string>('Пиратский Синдикат Корсаров');
  const [testIffClanNumber, setTestIffClanNumber] = useState<string>('#77');
  const [testIffKarma, setTestIffKarma] = useState<number>(-45);
  const [testIffPassCode, setTestIffPassCode] = useState<string>('');
  const [testIffShipCallsign, setTestIffShipCallsign] = useState<string>('CORSAIR-RAIDER-07');

  const currentSentinel =
    sentinelNetwork.find((s) => s.id === activeSentinelId) || sentinelNetwork[0];

  // Живая симуляция притока энергии пока открыто окно (каждую 1 сек)
  useEffect(() => {
    if (!isOpen || !currentSentinel) return;
    const interval = setInterval(() => {
      onUpdateSentinel(
        updateSentinelSolarAccumulator(
          currentSentinel,
          currentSentinel.starDistanceUnits,
          1.0
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentSentinel, onUpdateSentinel]);

  if (!isOpen || !currentSentinel) return null;

  const currentSpec = SENTINEL_STRIKE_MODES[currentSentinel.strikeMode];
  const starProf = currentSentinel.currentStarProfile;
  const locMeta =
    SENTINEL_DEPLOYMENT_LOCATIONS_META[currentSentinel.locationType] ||
    SENTINEL_DEPLOYMENT_LOCATIONS_META['STARGATE_PERIMETER'];

  // Гарантируем наличие полей расширенного IFF
  const targetFilters: SentinelTargetThreatFilters =
    currentSentinel.targetThreatFilters || DEFAULT_TARGET_FILTERS;
  const exceptionsConfig: SentinelExceptionsConfig =
    currentSentinel.exceptionsConfig || DEFAULT_EXCEPTIONS_CONFIG;
  const zonePreset: SentinelZoneInfluencePreset =
    currentSentinel.zoneInfluencePreset || 'SOVEREIGN_SYSTEM_DEFENSE';
  const zoneMeta = SENTINEL_ZONE_PRESETS_META[zonePreset] || SENTINEL_ZONE_PRESETS_META['SOVEREIGN_SYSTEM_DEFENSE'];

  // Оценка для интерактивного симулятора IFF с учётом фильтров и списка исключений «КРОМЕ»
  const simIffResult = evaluateTargetIffStatus(
    testIffKind,
    testIffKarma,
    testIffClan,
    testIffClanNumber,
    targetFilters,
    exceptionsConfig,
    testIffPassCode,
    testIffShipCallsign
  );

  const handleSelectMode = (mode: SentinelStrikePowerMode) => {
    const spec = SENTINEL_STRIKE_MODES[mode];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] || '12:00:00';
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      strikeMode: mode,
      eventLog: [
        {
          id: `ev-mode-${Date.now()}`,
          timestamp: timeStr,
          category: 'MODE_CHANGE',
          message: `Переключение силы удара: ${spec.codeName} (${spec.strikePowerLabel}, расход: ${spec.energyCostGeu} ГЭУ).`,
        },
        ...currentSentinel.eventLog.slice(0, 39),
      ],
    };
    onUpdateSentinel(updated);
    if (onPlayBeep) onPlayBeep('DOCK');
    setStrikeFeedback(`СИЛА УДАРА ПЕРЕКЛЮЧЕНА НА ${spec.codeName}`);
    setTimeout(() => setStrikeFeedback(null), 3000);
  };

  const handleSelectZonePreset = (presetKey: SentinelZoneInfluencePreset) => {
    const pMeta = SENTINEL_ZONE_PRESETS_META[presetKey];
    const newFilters = { ...pMeta.targetFilters };
    const newExceptions = pMeta.buildExceptions(currentSentinel.authorizedOwnerCallsign || pilotName);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] || '12:00:00';

    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      zoneInfluencePreset: presetKey,
      targetThreatFilters: newFilters,
      exceptionsConfig: newExceptions,
      whitelistClans: newExceptions.clansWhitelist.map((c) => `${c.clanName} ${c.clanNumber}`),
      iffPassCode: newExceptions.secretTransponderPassCode,
      allowNeutralTraders: newExceptions.allowNeutralTraders,
      eventLog: [
        {
          id: `ev-zone-${Date.now()}`,
          timestamp: timeStr,
          category: 'IFF',
          message: `Активирован пресет зоны влияния: [${pMeta.titleRu}]. Настроены фильтры угроз и правила «КРОМЕ».`,
        },
        ...currentSentinel.eventLog.slice(0, 39),
      ],
    };
    onUpdateSentinel(updated);
    if (onPlayBeep) onPlayBeep('DOCK');
    setStrikeFeedback(`АКТИВИРОВАНА ЗОНА ВЛИЯНИЯ: ${pMeta.badgeRu}`);
    setTimeout(() => setStrikeFeedback(null), 3500);
  };

  const handleToggleThreatFilter = (filterKey: keyof SentinelTargetThreatFilters) => {
    const updatedFilters: SentinelTargetThreatFilters = {
      ...targetFilters,
      [filterKey]: !targetFilters[filterKey],
    };
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      zoneInfluencePreset: 'CUSTOM_ZONE',
      targetThreatFilters: updatedFilters,
    };
    onUpdateSentinel(updated);
  };

  const handleToggleExceptionAllowPirates = (entryId: string) => {
    const updatedClans = exceptionsConfig.clansWhitelist.map((c) =>
      c.id === entryId ? { ...c, allowPiratesOfThisClan: !c.allowPiratesOfThisClan } : c
    );
    const updatedExceptions: SentinelExceptionsConfig = {
      ...exceptionsConfig,
      clansWhitelist: updatedClans,
    };
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      zoneInfluencePreset: 'CUSTOM_ZONE',
      exceptionsConfig: updatedExceptions,
      whitelistClans: updatedClans.map((c) => `${c.clanName} ${c.clanNumber}`),
    };
    onUpdateSentinel(updated);
  };

  const handleRemoveClanException = (entryId: string) => {
    const updatedClans = exceptionsConfig.clansWhitelist.filter((c) => c.id !== entryId);
    const updatedExceptions: SentinelExceptionsConfig = {
      ...exceptionsConfig,
      clansWhitelist: updatedClans,
    };
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      zoneInfluencePreset: 'CUSTOM_ZONE',
      exceptionsConfig: updatedExceptions,
      whitelistClans: updatedClans.map((c) => `${c.clanName} ${c.clanNumber}`),
    };
    onUpdateSentinel(updated);
    if (onPlayBeep) onPlayBeep('HIT');
  };

  const handleAddClanException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName.trim()) return;
    const formattedNum = newClanNumber.startsWith('#') ? newClanNumber.trim() : `#${newClanNumber.trim()}`;
    const newEntry: SentinelClanExceptionEntry = {
      id: `clan-ex-${Date.now()}`,
      clanName: newClanName.trim(),
      clanNumber: formattedNum || '#00',
      allowPiratesOfThisClan: newClanAllowPirates,
      customNote: newClanNote.trim() || 'Союзное подразделение базы',
    };
    const updatedClans = [...exceptionsConfig.clansWhitelist, newEntry];
    const updatedExceptions: SentinelExceptionsConfig = {
      ...exceptionsConfig,
      clansWhitelist: updatedClans,
    };
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      zoneInfluencePreset: 'CUSTOM_ZONE',
      exceptionsConfig: updatedExceptions,
      whitelistClans: updatedClans.map((c) => `${c.clanName} ${c.clanNumber}`),
    };
    onUpdateSentinel(updated);
    setNewClanName('');
    if (onPlayBeep) onPlayBeep('DOCK');
    setStrikeFeedback(`ДОБАВЛЕНО ИСКЛЮЧЕНИЕ «КРОМЕ»: ${newEntry.clanName} ${newEntry.clanNumber}`);
    setTimeout(() => setStrikeFeedback(null), 3000);
  };

  const handleToggleAllowNeutralTraders = () => {
    const updatedExceptions: SentinelExceptionsConfig = {
      ...exceptionsConfig,
      allowNeutralTraders: !exceptionsConfig.allowNeutralTraders,
    };
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      exceptionsConfig: updatedExceptions,
      allowNeutralTraders: updatedExceptions.allowNeutralTraders,
    };
    onUpdateSentinel(updated);
  };

  const handleUpdatePassCode = (code: string) => {
    const updatedExceptions: SentinelExceptionsConfig = {
      ...exceptionsConfig,
      secretTransponderPassCode: code,
    };
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      exceptionsConfig: updatedExceptions,
      iffPassCode: code,
    };
    onUpdateSentinel(updated);
  };

  const handleRelocateSentinel = (newLoc: SentinelDeploymentLocationType) => {
    const meta = SENTINEL_DEPLOYMENT_LOCATIONS_META[newLoc];
    const newCoords = newLoc === 'CURRENT_SHIP_POSITION' ? { ...currentShipPos } : { ...meta.defaultCoords };
    const starDist = Math.max(1000, Math.round(Math.hypot(newCoords.x, newCoords.y, newCoords.z)));
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] || '12:00:00';

    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      locationType: newLoc,
      locationLabelRu: meta.titleRu,
      worldPos: newCoords,
      starDistanceUnits: starDist,
      statusRu: `БОЕВОЙ ДОЗОР · ${meta.titleRu.toUpperCase()}`,
      eventLog: [
        {
          id: `ev-reloc-${Date.now()}`,
          timestamp: timeStr,
          category: 'MODE_CHANGE',
          message: `Передислокация в секторе: «${meta.titleRu}» (дистанция до звезды: ${starDist} ед.).`,
        },
        ...currentSentinel.eventLog.slice(0, 39),
      ],
    };
    onUpdateSentinel(updated);
    if (onPlayBeep) onPlayBeep('DOCK');
    setStrikeFeedback(`ЧАСОВОЙ ПЕРЕДИСЛОЦИРОВАН: ${meta.titleRu.toUpperCase()}`);
    setTimeout(() => setStrikeFeedback(null), 3000);
  };

  const currentDirective: SentinelEngagementDirective =
    currentSentinel.engagementDirective || 'DETER_AND_DESTROY';
  const directiveMeta = SENTINEL_ENGAGEMENT_DIRECTIVES_META[currentDirective];

  // Динамический расчёт режима орудия для текущей симулируемой дистанции
  const simDistanceResolution = resolveEngagementStrikeMode(
    currentDirective,
    simTargetDistance,
    currentSentinel.batteryChargeGeu,
    undefined
  );

  const handleSelectDirective = (directive: SentinelEngagementDirective) => {
    const dMeta = SENTINEL_ENGAGEMENT_DIRECTIVES_META[directive];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] || '12:00:00';
    const updated: SentinelPlatformTelemetry = {
      ...currentSentinel,
      engagementDirective: directive,
      statusRu:
        currentSentinel.swarmClusterId
          ? directive === 'DESTROY_ONLY'
            ? `ЗАСАДА 360° · ОБЛАКО «${currentSentinel.swarmClusterName || 'ЛОВУШКА'}»`
            : `ОБЛАКО ДОЗОРА · ${currentSentinel.swarmClusterName || 'ДОЗОР'}`
          : currentSentinel.statusRu,
      eventLog: [
        {
          id: `ev-dir-${Date.now()}`,
          timestamp: timeStr,
          category: 'MODE_CHANGE',
          message: `Переключение боевой директивы: [${dMeta.titleRu.toUpperCase()}]. ${dMeta.shortDescRu}.`,
        },
        ...currentSentinel.eventLog.slice(0, 39),
      ],
    };
    onUpdateSentinel(updated);
    if (onPlayBeep) onPlayBeep('DOCK');
    setStrikeFeedback(`АКТИВИРОВАНА ДИРЕКТИВА: ${dMeta.badgeRu}`);
    setTimeout(() => setStrikeFeedback(null), 3000);
  };

  const handleApplyDirectiveToAll = (directive: SentinelEngagementDirective) => {
    const dMeta = SENTINEL_ENGAGEMENT_DIRECTIVES_META[directive];
    if (onBatchUpdateDirectives) {
      onBatchUpdateDirectives(directive, currentSentinel.swarmClusterId);
    }
    handleSelectDirective(directive);
    setStrikeFeedback(`ДИРЕКТИВА [${dMeta.badgeRu}] ПРИМЕНЕНА КО ВСЕЙ СЕТИ / ОБЛАКУ!`);
    setTimeout(() => setStrikeFeedback(null), 3500);
  };

  const handleDeploySwarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onDeploySwarmCloud) {
      onDeploySwarmCloud(
        swarmDeployLocation,
        swarmNodesCount,
        swarmClusterName,
        swarmInitialDirective,
        currentShipPos
      );
    } else {
      const newNodes = createSentinelSwarmCloud(
        swarmDeployLocation,
        currentSentinel.sectorName,
        currentShipPos,
        swarmNodesCount,
        swarmClusterName,
        swarmInitialDirective,
        pilotName,
        sentinelNetwork.length + 1
      );
      if (newNodes.length > 0) {
        newNodes.forEach((n) => onUpdateSentinel(n));
      }
    }
    if (onPlayBeep) onPlayBeep('HYPERSPACE');
    setStrikeFeedback(
      `🌪️ ОБЛАКО ЧАСОВЫХ «${swarmClusterName.toUpperCase()}» (${swarmNodesCount} ПЛАТФОРМ, ЗАСАДА 360°) РАЗВЁРНУТО!`
    );
    setTimeout(() => setStrikeFeedback(null), 4500);
  };

  const handleSimulateSwarmTrapSalvo = () => {
    const pursuerNames: Record<string, { label: string; hp: number; type: string }> = {
      PIRATE_CRUISER: {
        label: 'Пиратский крейсер «Чёрный Клык»',
        hp: 2400,
        type: 'Тяжёлый рейдер корсаров',
      },
      VOID_MARAUDER: {
        label: 'Мародёр пустоты «Тень Астероида»',
        hp: 1200,
        type: 'Быстрый расхититель руд',
      },
      DICTATOR_FLAGSHIP: {
        label: 'Карательный флагман диктатора «Возмездие»',
        hp: 3800,
        type: 'Элитный военный дредноут',
      },
      MERCENARY_FRIGATE: {
        label: 'Фрегат наёмников «Цербер-7»',
        hp: 1700,
        type: 'Военный наёмник',
      },
    };

    const targetInfo = pursuerNames[simPursuerType] || pursuerNames.PIRATE_CRUISER;
    const clusterIdToUse = currentSentinel.swarmClusterId || 'SWARM-CLUSTER-DEFAULT';

    const res = executeSwarmAmbushCrossfire(
      sentinelNetwork,
      clusterIdToUse,
      targetInfo.label,
      simTargetDistance,
      currentSentinel.engagementDirective
    );

    setSwarmCrossfireReport(res.result);
    setIsSwarmFiringFlash(true);

    if (onPlayBeep) {
      onPlayBeep(res.result.totalDamageKg > 1000 ? 'EXPLODE' : 'LASER');
    }

    res.updatedNetwork.forEach((node) => {
      onUpdateSentinel(node);
    });

    setStrikeFeedback(res.result.summaryMessageRu);
    setTimeout(() => setIsSwarmFiringFlash(false), 400);
    setTimeout(() => setStrikeFeedback(null), 5000);
  };

  const handleSimulateFieldSuppression = (distToCenter = simFieldDistToCenter) => {
    const pursuerNames: Record<string, { label: string; hp: number; type: string }> = {
      PIRATE_CRUISER: {
        label: 'Пиратский крейсер «Чёрный Клык»',
        hp: 2400,
        type: 'Тяжёлый рейдер корсаров',
      },
      VOID_MARAUDER: {
        label: 'Мародёр пустоты «Тень Астероида»',
        hp: 1200,
        type: 'Быстрый расхититель руд',
      },
      DICTATOR_FLAGSHIP: {
        label: 'Карательный флагман диктатора «Возмездие»',
        hp: 3800,
        type: 'Элитный военный дредноут',
      },
      MERCENARY_FRIGATE: {
        label: 'Фрегат наёмников «Цербер-7»',
        hp: 1700,
        type: 'Военный наёмник',
      },
    };

    const targetInfo = pursuerNames[simPursuerType] || pursuerNames.PIRATE_CRUISER;
    const clusterIdToUse = currentSentinel.swarmClusterId;

    const res = calculateVolumetricEngineSuppression(
      sentinelNetwork,
      clusterIdToUse,
      targetInfo.label,
      distToCenter,
      2000
    );

    setVolumetricSuppressionReport(res.suppression);
    setIsFieldActivePulse(true);

    if (onPlayBeep) {
      onPlayBeep('DOCK');
    }

    res.updatedNetwork.forEach((node) => {
      onUpdateSentinel(node);
    });

    setStrikeFeedback(res.suppression.summaryMessageRu);
    setTimeout(() => setIsFieldActivePulse(false), 500);
    setTimeout(() => setStrikeFeedback(null), 5000);
  };

  const handleUpgradeBlades = (blades: SentinelBladeModification) => {
    if (!currentSentinel) return;
    const updated = setSentinelBladeModification(currentSentinel, blades);
    onUpdateSentinel(updated);
    if (onPlayBeep) {
      onPlayBeep('DOCK');
    }
    const spec = SENTINEL_BLADE_MODS_META[blades];
    setStrikeFeedback(
      `⚓ МОДЕРНИЗАЦИЯ ЛОПАСТЕЙ: [${spec.codeName}] (${blades} ЛОПАСТЕЙ)! ПРИТОК ЭНЕРГИИ УСКОРЕН В ${spec.rechargeMultiplier.toFixed(1)}x (+${(updated.energyRechargeRateGeuPerSec).toFixed(1)} ГЭУ/с).`
    );
    setTimeout(() => setStrikeFeedback(null), 4500);
  };

  const handleTestFireAtSimDistance = () => {
    const res = executeSentinelStrike(
      currentSentinel,
      testTargetName,
      undefined,
      simIffResult.labelRu,
      simTargetDistance
    );
    if (!res.success) {
      if (onPlayBeep) onPlayBeep('HIT');
      setStrikeFeedback(`⚠️ ${res.failReasonRu}`);
      setTimeout(() => setStrikeFeedback(null), 4000);
      return;
    }

    onUpdateSentinel(res.updatedTelemetry);
    setIsFiringFlash(true);
    if (onPlayBeep) {
      onPlayBeep(res.strikeSpec.id === 'OVERCHARGE_SHOCKWAVE' ? 'EXPLODE' : 'LASER');
    }
    const notice = res.isWarningShot
      ? `🛡️ ПРЕДУПРЕДИТЕЛЬНЫЙ ОТПУГИВАЮЩИЙ ЗАЛП [${res.strikeSpec.codeName}] (${res.strikeSpec.strikePowerLabel}) НА ${Math.round(simTargetDistance)}м!`
      : `💥 БОЕВОЙ ЗАЛП [${res.strikeSpec.codeName}] (${res.strikeSpec.strikePowerLabel}) НА ${Math.round(simTargetDistance)}м!`;
    setStrikeFeedback(notice);
    setTimeout(() => setIsFiringFlash(false), 300);
    setTimeout(() => setStrikeFeedback(null), 4500);
  };

  const handleTestFire = () => {
    const res = executeSentinelStrike(currentSentinel, testTargetName, undefined, simIffResult.labelRu);
    if (!res.success) {
      if (onPlayBeep) onPlayBeep('HIT');
      setStrikeFeedback(`⚠️ ${res.failReasonRu}`);
      setTimeout(() => setStrikeFeedback(null), 4000);
      return;
    }

    onUpdateSentinel(res.updatedTelemetry);
    setIsFiringFlash(true);
    if (onPlayBeep) {
      onPlayBeep(currentSpec.id === 'OVERCHARGE_SHOCKWAVE' ? 'EXPLODE' : 'LASER');
    }
    setStrikeFeedback(
      `💥 ЗАЛП [${currentSpec.codeName}] УСПЕШЕН! СИЛА: ${currentSpec.strikePowerLabel} · РАСХОД: -${currentSpec.energyCostGeu} ГЭУ`
    );
    setTimeout(() => setIsFiringFlash(false), 300);
    setTimeout(() => setStrikeFeedback(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md font-mono select-none">
      <div
        className={`w-full max-w-5xl h-[94vh] max-h-[94vh] flex flex-col rounded-xl border-2 bg-slate-950 text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden transition-colors duration-200 ${
          isFiringFlash || isSwarmFiringFlash
            ? 'border-rose-500 bg-rose-950/40'
            : 'border-cyan-500/80'
        }`}
      >
        {/* Шапка командного терминала */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900 border-b border-cyan-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-900/60 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-cyan-200 tracking-wider">
                  АВТОНОМНЫЙ ЧАСОВОЙ (SENTINEL SENTRY PLATFORM)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 border border-emerald-400 text-emerald-300">
                  0 кН ТЯГИ · БЕЗ ДВИГАТЕЛЯ
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black"
                  style={{
                    backgroundColor: `${zoneMeta.colorHex}22`,
                    borderColor: zoneMeta.colorHex,
                    color: zoneMeta.colorHex,
                  }}
                >
                  {zoneMeta.badgeRu}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black border"
                  style={{
                    backgroundColor: `${directiveMeta.colorHex}22`,
                    borderColor: directiveMeta.colorHex,
                    color: directiveMeta.colorHex,
                  }}
                >
                  {directiveMeta.badgeRu}
                </span>
                {currentSentinel.swarmClusterId && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-950/80 border border-purple-400 text-purple-300">
                    🌪️ ОБЛАКО «{currentSentinel.swarmClusterName || 'ЗАСАДА'}» ({currentSentinel.swarmPlatformIndex ?? 1}/{currentSentinel.swarmTotalNodes ?? 5})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{currentSentinel.name}</span>
                <span>•</span>
                <span className="text-yellow-400 font-bold">{currentSentinel.sectorName}</span>
                <span>•</span>
                <span className="text-cyan-400">Точка: {currentSentinel.locationLabelRu}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Быстрый выбор активного часового в сети */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 px-1">СЕТЬ:</span>
              {sentinelNetwork.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectActiveSentinel(s.id)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                    s.id === currentSentinel.id
                      ? 'bg-cyan-500 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`${s.name} (${s.locationLabelRu}) · Модификация: ${s.bladeCount || 6} лопастей`}
                >
                  <span>#{idx + 1}</span>
                  <span className="text-[9px] opacity-80 font-mono">[{s.bladeCount || 6}л]</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => onDeployNewSentinel('CURRENT_SHIP_POSITION')}
                className="px-2 py-1 rounded text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-500 text-black flex items-center gap-1 ml-1"
                title="Развернуть одного часового в текущих координатах корабля"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ЧАСОВОЙ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-rose-900 hover:border-rose-500 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Навигационные вкладки */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-bold overflow-x-auto shrink-0">
          {[
            { id: 'OVERVIEW', label: '🛰️ ОБЗОР И ДИСЛОКАЦИЯ' },
            { id: 'MODEL_3D', label: '⚓ 3D МОДЕЛЬ (МИНА & МЕЛЬНИЦА)' },
            { id: 'IFF', label: '🛡️ «СВОЙ-ЧУЖОЙ» (ФИЛЬТРЫ И «КРОМЕ»)' },
            { id: 'WEAPONS', label: '⚔️ ОРУДИЯ И ДИРЕКТИВЫ (ОТПУГНУТЬ / УНИЧТОЖИТЬ)' },
            { id: 'SWARM_AMBUSH', label: '🌪️ ОБЛАКО ЧАСОВЫХ (ЗАСАДА 360°)' },
            { id: 'ENGINE_SUPPRESSION', label: '🧲 ТОРМОЖЕНИЕ ДВИГАТЕЛЯ (МИН. 3 ЧАСОВЫХ)' },
            { id: 'SOLAR_BATTERY', label: '☀️ КОНВЕРТОР И АККУМУЛЯТОР' },
            { id: 'LOG', label: '📜 БОЕВОЙ ЖУРНАЛ И ТЕЛЕМЕТРИЯ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Контент модального окна */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
          {strikeFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 font-mono font-bold text-center animate-pulse">
              {strikeFeedback}
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА 1: ОБЗОР И ДИСЛОКАЦИЯ В СИСТЕМЕ
          =================================================================== */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Плашка текущей Зоны Влияния и Защиты от грабежа */}
              <div
                className="p-3.5 rounded-lg border-2 flex items-center justify-between flex-wrap gap-3"
                style={{
                  backgroundColor: `${zoneMeta.colorHex}15`,
                  borderColor: zoneMeta.colorHex,
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{zoneMeta.icon}</span>
                    <span className="font-black text-sm" style={{ color: zoneMeta.colorHex }}>
                      ЗОНА ВЛИЯНИЯ: {zoneMeta.titleRu.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono border font-extrabold" style={{ borderColor: zoneMeta.colorHex, color: zoneMeta.colorHex }}>
                      {zoneMeta.badgeRu}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 max-w-3xl">
                    {zoneMeta.descriptionRu}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('IFF')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                >
                  <Shield className="w-4 h-4" />
                  <span>НАСТРОИТЬ ФИЛЬТРЫ И «КРОМЕ»</span>
                </button>
              </div>

              {/* Выбор дислокации часового (У Врат, У Звезды, У Планеты, В Поясе, В текущей точке) */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-yellow-500/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-yellow-300 text-xs uppercase flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-yellow-400" />
                    ДИСЛОКАЦИЯ ЧАСОВОГО: ПОСТАВИТЬ В ЛЮБОМ МЕСТЕ СИСТЕМЫ
                  </span>
                  <span className="text-[10px] font-mono text-yellow-400">
                    ТЕКУЩАЯ ТОЧКА: <b>{currentSentinel.locationLabelRu.toUpperCase()}</b> ({currentSentinel.starDistanceUnits} ед.)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {(
                    Object.keys(
                      SENTINEL_DEPLOYMENT_LOCATIONS_META
                    ) as SentinelDeploymentLocationType[]
                  ).map((locKey) => {
                    const loc = SENTINEL_DEPLOYMENT_LOCATIONS_META[locKey];
                    const isCurrent = currentSentinel.locationType === locKey;
                    return (
                      <div
                        key={locKey}
                        onClick={() => handleRelocateSentinel(locKey)}
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                          isCurrent
                            ? 'bg-yellow-950/40 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                            : 'bg-black/60 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-100 flex items-center gap-1.5">
                            <span>{loc.icon}</span>
                            <span>{loc.titleRu}</span>
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-yellow-400 text-black">
                              ЗДЕСЬ
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          {loc.descriptionRu}
                        </div>
                        <div className="text-[9px] text-cyan-300 font-mono mt-1 border-t border-slate-800/80 pt-1">
                          Преимущество: {loc.tacticalAdvantageRu}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Сводные показатели платформы */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ДВИГАТЕЛЬНАЯ УСТАНОВКА</span>
                  </div>
                  <div className="text-base font-black text-emerald-400">0 кН · 0 кг ТОПЛИВА</div>
                  <div className="text-[10px] text-slate-400">
                    Пассивная фиксация Лагранжа, ориентация микрогиродинами 18 Вт.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                      <span>МЕЛЬНИЧНЫЕ ЛОПАСТИ ({currentSentinel.bladeCount || 6} ШТ.)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('MODEL_3D')}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      3D МОДЕЛЬ
                    </button>
                  </div>
                  <div className="text-base font-black text-yellow-300 flex items-center justify-between">
                    <span>+{currentSentinel.energyRechargeRateGeuPerSec} ГЭУ/с</span>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700">
                      {(currentSentinel.chargeRateMultiplier || 1.5).toFixed(1)}x
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Панели {currentSentinel.converterSurfaceAreaSqM || 675} м² · Сухая масса {currentSentinel.dryMassTons || 12.0} т
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>НАКОПИТЕЛЬ ЭНЕРГИИ</span>
                  </div>
                  <div className="text-base font-black text-cyan-300">
                    {Math.round(currentSentinel.batteryChargeGeu)} / {currentSentinel.batteryCapacityGeu} ГЭУ
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-cyan-400 h-full transition-all"
                      style={{ width: `${currentSentinel.batteryPercent}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    <span>СИЛА УДАРА ОРУДИЯ</span>
                  </div>
                  <div className="text-base font-black text-rose-300">
                    {currentSpec.codeName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Урон: {currentSpec.strikePowerLabel} · {currentSpec.energyCostGeu} ГЭУ
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА: 3D МОДЕЛЬ (МОРСКАЯ МИНА, РОЖКИ-ПИРАМИДКИ И ЛОПАСТИ МЕЛЬНИЦЫ)
          =================================================================== */}
          {activeTab === 'MODEL_3D' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-cyan-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-extrabold text-cyan-300 text-xs uppercase">
                      ВНЕШНИЙ ВИД: СФЕРИЧЕСКАЯ МОРСКАЯ МИНА И ЛОПАСТИ ВЕТРЯНОЙ МЕЛЬНИЦЫ
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-400">
                    АКТИВНЫЙ ЧАСОВОЙ: {currentSentinel.name}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  В центре боевой платформы расположен шар из титановой брони, визуально напоминающий большую морскую мину с рожками в виде четырёхгранных пирамидок. Из шара выступают фотоэлектрические солнечные панели в виде лопастей старых ветряных мельниц с характерной решётчатой обрешёткой и парусиновым квантовым полотном.
                </p>

                {/* Интерактивный 3D Canvas с поддержкой мыши и переключением лопастей */}
                <div className="w-full">
                  <SentinelMine3DCanvas
                    bladesCount={currentSentinel.bladeModification || 6}
                    onSelectBladesCount={handleUpgradeBlades}
                    className="w-full border-cyan-600/40"
                    showToolbar={true}
                    showModificationSelector={true}
                    subTitle="Вращайте модель мышью (360°). Переключайте модификации (4, 6, 8 лопастей) для изменения скорости зарядки."
                  />
                </div>
              </div>

              {/* СРАВНИТЕЛЬНАЯ КАРТОЧКА 3 МОДИФИКАЦИЙ */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                <div className="font-extrabold text-amber-300 uppercase flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span>3 МОДИФИКАЦИИ ЛОПАСТЕЙ И ВЛИЯНИЕ НА СКОРОСТЬ ЗАРЯДКИ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {([4, 6, 8] as SentinelBladeModification[]).map((blades) => {
                    const spec = SENTINEL_BLADE_MODS_META[blades];
                    const isCurrent = (currentSentinel.bladeModification || 6) === blades;
                    return (
                      <div
                        key={blades}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col justify-between gap-2.5 ${
                          isCurrent
                            ? 'bg-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/50'
                            : 'bg-black/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm" style={{ color: spec.colorHex }}>
                              {spec.titleRu}
                            </span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded font-black bg-slate-900 text-white border border-slate-700">
                              {spec.rechargeMultiplier.toFixed(1)}x
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300">
                            {spec.descriptionRu}
                          </div>

                          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1 text-[11px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Площадь панелей:</span>
                              <b className="text-cyan-300">{spec.surfaceAreaSqM} м²</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Сухая масса:</span>
                              <b className="text-white">{spec.dryMassTons} т</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Приток энергии:</span>
                              <b className="text-emerald-400 font-bold">
                                ×{spec.rechargeMultiplier.toFixed(1)} (+{(12 * spec.rechargeMultiplier).toFixed(1)} ГЭУ/с)
                              </b>
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <div className="w-full py-1.5 text-center rounded bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold text-[11px]">
                            ✓ УСТАНОВЛЕНО НА ЧАСОВОМ
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpgradeBlades(blades)}
                            className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-[11px] transition-all shadow-sm"
                          >
                            МОДЕРНИЗИРОВАТЬ ДО {blades} ЛОПАСТЕЙ
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Анатомическая справка конструкции */}
                <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-2 text-[11px]">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>КОНСТРУКТИВНЫЕ ЭЛЕМЕНТЫ ПЛАТФОРМЫ:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <b className="text-cyan-300 block mb-0.5">Шар морской мины:</b>
                      Центральный отсек с бронеплитами из титана, экваториальным поясом с заклёпками и квантовым аккумулятором 5 000 ГЭУ.
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <b className="text-amber-300 block mb-0.5">Пирамидальные рожки (14 шт.):</b>
                      Радиальные рожки-пирамидки, выполняющие роль датчиков сближения «Свой-Чужой» и эмиттеров поля торможения.
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <b className="text-emerald-300 block mb-0.5">Мельничные лопасти:</b>
                      Решётчатые фермы, продольные брусья и натянутое фотоэлектрическое полотно, вращающиеся для ориентации на светило.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА 2: «СВОЙ-ЧУЖОЙ» (ФИЛЬТРЫ, ИСКЛЮЧЕНИЯ «КРОМЕ» И ЗОНЫ ВЛИЯНИЯ)
          =================================================================== */}
          {activeTab === 'IFF' && (
            <div className="space-y-4">
              {/* Пресеты зон влияния баз */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-indigo-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-indigo-300 text-xs uppercase flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    ЗОНЫ ВЛИЯНИЯ И ОХРАНА БАЗ (ЗАЩИТА ОТ НЕСАНКЦИОНИРОВАННОГО ГРАБЕЖА)
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-400">
                    ПРЕСЕТЫ ПЕРИМЕТРА
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  Выберите готовую доктрину обороны или создайте собственную. Допустим, <b>пираты могут окружить свою базу часовыми</b>: фильтр [Пираты] включён для уничтожения чужих пиратов-конкурентов, а в исключениях «КРОМЕ» указан союзный пиратский клан #77!
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(Object.keys(SENTINEL_ZONE_PRESETS_META) as SentinelZoneInfluencePreset[]).map((pKey) => {
                    const pMeta = SENTINEL_ZONE_PRESETS_META[pKey];
                    const isSelected = zonePreset === pKey;
                    return (
                      <div
                        key={pKey}
                        onClick={() => handleSelectZonePreset(pKey)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-900 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white'
                            : 'bg-black/70 border-slate-800 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs flex items-center gap-1.5" style={{ color: pMeta.colorHex }}>
                            <span>{pMeta.icon}</span>
                            <span>{pMeta.titleRu}</span>
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-mono border"
                            style={{ borderColor: pMeta.colorHex, color: pMeta.colorHex }}
                          >
                            {pMeta.badgeRu}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug">
                          {pMeta.descriptionRu}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Блок стандартных фильтров угроз (кого атаковать) */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-rose-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-rose-300 text-xs uppercase flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-rose-400" />
                    СТАНДАРТНЫЕ ФИЛЬТРЫ УГРОЗ: ПИРАТЫ, МАРОДЁРЫ, ВРАГИ
                  </span>
                  <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-400">
                    ЦЕЛИ ДЛЯ АТАКИ
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  Включите категории целей, подлежащие немедленному огневому поражению Часовым:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {[
                    {
                      key: 'filterPirates' as const,
                      title: '⚔️ Пираты (PIRATES)',
                      desc: 'Атаковать пиратские корабли (если не входят в исключения «КРОМЕ»)',
                      active: targetFilters.filterPirates,
                    },
                    {
                      key: 'filterMarauders' as const,
                      title: '💀 Мародёры и контрабандисты',
                      desc: 'Атаковать расхитителей обломков и нелегальных перевозчиков',
                      active: targetFilters.filterMarauders,
                    },
                    {
                      key: 'filterDictatorDrones' as const,
                      title: '🚨 Карательные дроны диктатора',
                      desc: 'Перехватывать боевые дроны планет диктатуры',
                      active: targetFilters.filterDictatorDrones,
                    },
                    {
                      key: 'filterNegativeKarma' as const,
                      title: '⚖️ Отрицательная карма (Karma < 0)',
                      desc: 'Огонь по кораблям с криминальным статусом в системе',
                      active: targetFilters.filterNegativeKarma,
                    },
                    {
                      key: 'filterUnregisteredPass' as const,
                      title: '🔒 Суда без кода пропуска IFF',
                      desc: 'Огонь при отсутствии транспондерного шифра доступа',
                      active: targetFilters.filterUnregisteredPass,
                    },
                    {
                      key: 'filterForeignMilitary' as const,
                      title: '🛡️ Чужие военные корабли и наёмники',
                      desc: 'Огонь по вооружённым интервентам и наёмным эскадрам',
                      active: targetFilters.filterForeignMilitary,
                    },
                    {
                      key: 'filterAllStrangers' as const,
                      title: '🚫 Тотальный запрет (Airspace Lock)',
                      desc: 'Атаковать абсолютно всех чужих (кроме списка «КРОМЕ»)',
                      active: targetFilters.filterAllStrangers,
                    },
                  ].map((f) => (
                    <div
                      key={f.key}
                      onClick={() => handleToggleThreatFilter(f.key)}
                      className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                        f.active
                          ? 'bg-rose-950/40 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                          : 'bg-black/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={f.active}
                        onChange={() => {}}
                        className="mt-0.5 accent-rose-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs text-rose-200">{f.title}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Блок списка исключений («КРОМЕ...») */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-emerald-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-emerald-300 text-xs uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    СПИСОК ИСКЛЮЧЕНИЙ «КРОМЕ» (ЧЛЕНЫ КЛАНА, ЕГО НОМЕР И СВОИ ПИРАТЫ)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-400">
                    БЕЛЫЙ СПИСОК БАЗЫ
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  Любые корабли из этого списка признаются <b>СВОИМИ</b>! Даже если включён фильтр «Пираты», члены указанного клана с его номером <b>не будут атакованы</b> (флаг <i>«Разрешить пиратов этого клана»</i>). Это позволяет пиратам окружить базу часовыми и отражать чужие набеги.
                </div>

                {/* Таблица текущих исключений кланов */}
                <div className="space-y-2">
                  {exceptionsConfig.clansWhitelist.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-black/70 border border-slate-800 flex items-center justify-between flex-wrap gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-500/50">
                          {item.clanNumber}
                        </span>
                        <div>
                          <div className="font-black text-xs text-white flex items-center gap-1.5">
                            <span>{item.clanName}</span>
                            {item.allowPiratesOfThisClan && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-900 border border-emerald-400 text-emerald-200">
                                🏴‍☠️ СВОИ ПИРАТЫ РАЗРЕШЕНЫ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.customNote}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleExceptionAllowPirates(item.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                            item.allowPiratesOfThisClan
                              ? 'bg-emerald-950 border-emerald-400 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                          }`}
                          title="Разрешить членам этого клана совершать пиратские действия и свободно заходить на базу"
                        >
                          {item.allowPiratesOfThisClan ? '✅ ПИРАТЫ КЛАНА: СВОИ' : '❌ ПИРАТЫ КЛАНА: ЗАПРЕТ'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveClanException(item.id)}
                          className="p-1 rounded bg-slate-900 border border-slate-700 hover:bg-rose-900 hover:border-rose-500 text-slate-400 hover:text-white"
                          title="Удалить из списка исключений"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Форма добавления нового клана в список исключений «КРОМЕ» */}
                <form
                  onSubmit={handleAddClanException}
                  className="p-3 rounded-lg bg-black/80 border border-emerald-600/50 space-y-2.5"
                >
                  <div className="font-bold text-[11px] text-emerald-300 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>ДОБАВИТЬ КЛАН И ЕГО НОМЕР В СПИСОК ИСКЛЮЧЕНИЙ «КРОМЕ»:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-slate-400 text-[10px] block mb-0.5">Название клана:</label>
                      <input
                        type="text"
                        placeholder="напр. Пиратский Синдикат Корсаров"
                        value={newClanName}
                        onChange={(e) => setNewClanName(e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Номер клана:</label>
                      <input
                        type="text"
                        placeholder="#77"
                        value={newClanNumber}
                        onChange={(e) => setNewClanNumber(e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-yellow-300 font-mono text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Примечание:</label>
                      <input
                        type="text"
                        placeholder="Охрана базы"
                        value={newClanNote}
                        onChange={(e) => setNewClanNote(e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-200">
                      <input
                        type="checkbox"
                        checked={newClanAllowPirates}
                        onChange={(e) => setNewClanAllowPirates(e.target.checked)}
                        className="accent-emerald-500 cursor-pointer"
                      />
                      <span>Члены этого клана являются пиратами, но считать их <b>СВОИМИ</b> (не атаковать)</span>
                    </label>

                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ДОБАВИТЬ В «КРОМЕ»</span>
                    </button>
                  </div>
                </form>

                {/* Дополнительные параметры IFF */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1">
                    <label className="text-slate-400 block text-[10px]">Секретный пропускной IFF-код (транспондер):</label>
                    <input
                      type="text"
                      value={exceptionsConfig.secretTransponderPassCode}
                      onChange={(e) => handleUpdatePassCode(e.target.value)}
                      className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-yellow-300 font-mono text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-xs">Мирные торговцы и челноки:</div>
                      <div className="text-[10px] text-slate-400">Пропускать при нейтральной или положительной карме</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAllowNeutralTraders}
                      className={`px-2 py-1 rounded font-bold text-xs border ${
                        exceptionsConfig.allowNeutralTraders
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                          : 'bg-rose-950 border-rose-500 text-rose-300'
                      }`}
                    >
                      {exceptionsConfig.allowNeutralTraders ? 'ПРОПУСКАТЬ' : 'ЗАПРЕТИТЬ'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Интерактивный Симулятор-Тестер зоны влияния («Свой-Чужой» и проверка «КРОМЕ») */}
              <div className="p-3.5 rounded-lg bg-black border-2 border-cyan-500/80 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-extrabold uppercase border-b border-cyan-900/50 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    ИНТЕРАКТИВНЫЙ ТЕСТЕР ОПОЗНАВАНИЯ ЦЕЛИ И ИСКЛЮЧЕНИЙ «КРОМЕ»
                  </span>
                  <span className="text-[10px] text-slate-400">СИМУЛЯЦИЯ РЕАКЦИИ ЧАСОВОГО</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[10px]">
                  <div>
                    <label className="text-slate-400 block mb-1">Тип приближающегося объекта:</label>
                    <select
                      value={testIffKind}
                      onChange={(e) => setTestIffKind(e.target.value as any)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                    >
                      <option value="PIRATE">🏴‍☠️ Пиратский рейдер (PIRATE)</option>
                      <option value="MARAUDER">💀 Мародёр-контрабандист</option>
                      <option value="DICTATOR_DRONE">🚨 Карательный дрон диктатора</option>
                      <option value="PLAYER">🛸 Корабль владельца (Cobra Mk III)</option>
                      <option value="SHUTTLE">📦 Логистический челнок планеты</option>
                      <option value="TRADER">🚢 Нейтральный торговец</option>
                      <option value="MILITARY">⚔️ Чужое военное судно / наёмник</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Клан объекта:</label>
                    <input
                      type="text"
                      value={testIffClan}
                      onChange={(e) => setTestIffClan(e.target.value)}
                      placeholder="напр. Пиратский Синдикат Корсаров"
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Номер клана:</label>
                    <input
                      type="text"
                      value={testIffClanNumber}
                      onChange={(e) => setTestIffClanNumber(e.target.value)}
                      placeholder="#77"
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-yellow-300 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Карма объекта (-100..+100):</label>
                    <input
                      type="number"
                      value={testIffKarma}
                      onChange={(e) => setTestIffKarma(Number(e.target.value))}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                    />
                  </div>
                </div>

                {/* Результат вердикта IFF */}
                <div
                  className={`p-3.5 rounded-lg border-2 flex items-center justify-between gap-3 ${
                    simIffResult.shouldEngage
                      ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                      : 'bg-emerald-950/70 border-emerald-400 text-emerald-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-sm font-black uppercase flex items-center gap-2">
                      {simIffResult.shouldEngage ? (
                        <>
                          <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                          <span>🚨 ЧУЖОЙ : ОГОНЬ НА ПОРАЖЕНИЕ!</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <span>✅ СВОЙ / НЕЙТРАЛ : ПРОПУСТИТЬ БЕСПРЕПЯТСТВЕННО</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-semibold">{simIffResult.labelRu}</div>
                    <div className="text-[11px] text-slate-300 mt-1">{simIffResult.reasonRu}</div>
                    <div className="text-[10px] text-yellow-300 font-mono">
                      Сработавшее правило: <b>{simIffResult.matchedRuleRu}</b>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-3 py-1.5 rounded-lg font-black text-sm border shadow-lg ${
                        simIffResult.shouldEngage
                          ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-rose-900/50'
                          : 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/50'
                      }`}
                    >
                      {simIffResult.shouldEngage ? '💥 АТАКА' : '🕊️ МИР'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА 3: ОРУДИЯ, ДИРЕКТИВЫ (ОТПУГНУТЬ / УНИЧТОЖИТЬ) И ЭСКАЛАЦИЯ СИЛЫ
          =================================================================== */}
          {activeTab === 'WEAPONS' && (
            <div className="space-y-4">
              {/* Блок 1: ДВЕ БОЕВЫЕ ДИРЕКТИВЫ ТАКТИКИ */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-cyan-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-cyan-200 text-xs uppercase flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    БОЕВАЯ ДИРЕКТИВА ЧАСОВОГО: 2 ТАКТИЧЕСКИХ РЕЖИМА
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded border font-bold"
                      style={{
                        backgroundColor: `${directiveMeta.colorHex}22`,
                        borderColor: directiveMeta.colorHex,
                        color: directiveMeta.colorHex,
                      }}
                    >
                      АКТИВНА: {directiveMeta.badgeRu}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyDirectiveToAll(currentDirective)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] border border-slate-700 font-bold"
                      title="Применить текущую директиву ко всем часовым сети или облака"
                    >
                      Применить ко всем
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Директива 1: Отпугнуть и уничтожить */}
                  <div
                    onClick={() => handleSelectDirective('DETER_AND_DESTROY')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all space-y-2 ${
                      currentDirective === 'DETER_AND_DESTROY'
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-black/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-xs text-cyan-300 flex items-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        <span>1. «ОТПУГНУТЬ И УНИЧТОЖИТЬ» (СТАНДАРТ)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-900/60 border border-cyan-500 text-cyan-200">
                        СТАНДАРТ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-snug">
                      <b>Сила орудия включается по мере приближения.</b> На дальней дистанции (&gt; 5 500 м) — предупредительный выстрел [Игла 35 кг] для отпугивания цели. По мере приближения мощность нарастает: [Квазар 125 кг] ➔ [Гамма-молот 380 кг] ➔ в упор [Оверчардж 1 100 кг].
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono border-t border-cyan-900/50 pt-1">
                      Эскалация: Дальняя: 35 кг ➔ Средняя: 125 кг ➔ Ближняя: 380 кг ➔ Упор: 1 100 кг
                    </div>
                  </div>

                  {/* Директива 2: Только уничтожить */}
                  <div
                    onClick={() => handleSelectDirective('DESTROY_ONLY')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all space-y-2 ${
                      currentDirective === 'DESTROY_ONLY'
                        ? 'bg-rose-950/40 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                        : 'bg-black/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-xs text-rose-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>2. «ТОЛЬКО УНИЧТОЖИТЬ» (ЗАСАДА)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-900/60 border border-rose-500 text-rose-200 animate-pulse">
                        ЗАСАДА
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-snug">
                      <b>Никакого отпугивания и предупреждений!</b> Орудия молчат до захода в периметр. Преследователь заманивается в облако, и как только пересекает границу — все орудия мгновенно открывают огонь максимальной мощности со всех сторон!
                    </div>
                    <div className="text-[10px] text-rose-400 font-mono border-t border-rose-900/50 pt-1">
                      Тактика: Засада в облаке ➔ Скрытность ➔ Мгновенный сокрушительный удар 360°
                    </div>
                  </div>

                  {/* Директива 3: Торможение двигателя (не менее 3 часовых) */}
                  <div
                    onClick={() => handleSelectDirective('VOLUMETRIC_ENGINE_SUPPRESSION')}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all space-y-2 ${
                      currentDirective === 'VOLUMETRIC_ENGINE_SUPPRESSION'
                        ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        : 'bg-black/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-xs text-cyan-300 flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-cyan-400" />
                        <span>3. «ТОРМОЗ ДВИГАТЕЛЯ» (МИН. 3 ЧАСОВЫХ)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-900/80 border border-cyan-400 text-cyan-200">
                        БЕЗ СТРЕЛЬБЫ
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-snug">
                      <b>Прямое силовое воздействие на двигатель!</b> Уменьшает тягу и скорость корабля в тоннах (соответствует массе часовых). Объёмная конструкция внутри не менее трёх часовых. В центре сила торможения = 0, у часовых — 100%!
                    </div>
                    <div className="text-[10px] text-cyan-300 font-mono border-t border-cyan-900/50 pt-1">
                      Торможение в тоннах ➔ Сила в центре 0 т ➔ Стрельба исключена
                    </div>
                  </div>
                </div>
              </div>

              {/* Блок 2: ИНТЕРАКТИВНЫЙ РАДАР ДИСТАНЦИИ И ЭСКАЛАЦИИ СИЛЫ ОРУДИЯ */}
              <div className="p-3.5 rounded-lg bg-black border-2 border-yellow-500/80 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-yellow-300 font-extrabold uppercase border-b border-yellow-900/50 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-yellow-400" />
                    ИНТЕРАКТИВНЫЙ РАДАР ПРИБЛИЖЕНИЯ: СИЛА ОРУДИЯ ПО МЕРЕ ДИСТАНЦИИ
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ДИСТАНЦИЯ ДО ЦЕЛИ: <b className="text-yellow-300 text-xs">{Math.round(simTargetDistance)} м</b>
                  </span>
                </div>

                {/* Ползунок дистанции */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Критический упор: 500 м</span>
                    <span>Ближняя зона: 2 200 м</span>
                    <span>Средняя зона: 4 500 м</span>
                    <span>Дальний периметр: 8 000 м</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="8000"
                    step="100"
                    value={simTargetDistance}
                    onChange={(e) => setSimTargetDistance(Number(e.target.value))}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 justify-end pt-1">
                    <span className="text-[10px] text-slate-400">Быстрые точки:</span>
                    <button
                      type="button"
                      onClick={() => setSimTargetDistance(7200)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-sky-300 border border-slate-700"
                    >
                      7 200 м (Дальняя)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimTargetDistance(4200)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-yellow-300 border border-slate-700"
                    >
                      4 200 м (Средняя)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimTargetDistance(2000)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-purple-300 border border-slate-700"
                    >
                      2 000 м (Ближняя)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimTargetDistance(800)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-400 border border-slate-700"
                    >
                      800 м (В упор)
                    </button>
                  </div>
                </div>

                {/* Результат калибровки орудия на выбранной дистанции */}
                <div
                  className="p-3 rounded-lg border-2 flex items-center justify-between gap-3 flex-wrap"
                  style={{
                    backgroundColor: `${simDistanceResolution.beamColorHex}15`,
                    borderColor: simDistanceResolution.beamColorHex,
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-black text-xs uppercase"
                        style={{ color: simDistanceResolution.beamColorHex }}
                      >
                        {simDistanceResolution.phaseTitleRu}
                      </span>
                      {simDistanceResolution.isWarningShot && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-950 border border-sky-400 text-sky-200">
                          ПРЕДУПРЕЖДЕНИЕ / ОТПУГИВАНИЕ
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-200">
                      {simDistanceResolution.descriptionRu}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Орудие:{' '}
                      <b style={{ color: simDistanceResolution.beamColorHex }}>
                        {SENTINEL_STRIKE_MODES[simDistanceResolution.strikeMode].codeName}
                      </b>{' '}
                      · Сила:{' '}
                      <b className="text-white">
                        {SENTINEL_STRIKE_MODES[simDistanceResolution.strikeMode].strikePowerLabel}
                      </b>{' '}
                      · Расход:{' '}
                      <b className="text-yellow-400">
                        {SENTINEL_STRIKE_MODES[simDistanceResolution.strikeMode].energyCostGeu} ГЭУ
                      </b>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      currentSentinel.cooldownRemainingSeconds > 0 ||
                      currentSentinel.batteryChargeGeu <
                        SENTINEL_STRIKE_MODES[simDistanceResolution.strikeMode].energyCostGeu
                    }
                    onClick={handleTestFireAtSimDistance}
                    className="px-4 py-2 rounded-lg font-black text-xs text-white disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-lg shrink-0"
                    style={{
                      backgroundColor: simDistanceResolution.beamColorHex,
                    }}
                  >
                    <Flame className="w-4 h-4" />
                    <span>ВЫСТРЕЛ НА {Math.round(simTargetDistance)}м</span>
                  </button>
                </div>
              </div>

              {/* Блок 3: 4 СТУПЕНИ СИЛЫ УДАРА ОРУДИЙНОГО КОМПЛЕКСА */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-rose-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-rose-300 text-xs uppercase flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    ОРУДИЙНЫЙ КОМПЛЕКС ЧАСОВОГО: 4 СТУПЕНИ СИЛЫ УДАРА
                  </span>
                  <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-400">
                    АКТИВНЫЙ РЕЖИМ: {currentSpec.codeName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    Object.keys(
                      SENTINEL_STRIKE_MODES
                    ) as SentinelStrikePowerMode[]
                  ).map((modeKey) => {
                    const spec = SENTINEL_STRIKE_MODES[modeKey];
                    const isSelected = currentSentinel.strikeMode === modeKey;
                    return (
                      <div
                        key={modeKey}
                        onClick={() => handleSelectMode(modeKey)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-900 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-white'
                            : 'bg-black/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                        style={{
                          borderColor: isSelected ? spec.beamColorHex : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="font-black text-xs"
                            style={{ color: spec.beamColorHex }}
                          >
                            {spec.codeName}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                            style={{
                              borderColor: spec.beamColorHex,
                              color: spec.beamColorHex,
                            }}
                          >
                            СИЛА: {spec.strikePowerLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-snug">
                          {spec.descriptionRu}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-800/80 pt-1.5">
                          <div>
                            Расход: <b className="text-yellow-400">{spec.energyCostGeu} ГЭУ</b>
                          </div>
                          <div>
                            Перезарядка: <b className="text-cyan-400">{spec.cooldownSeconds} с</b>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА: ОБЛАКО ЧАСОВЫХ И ТАКТИКА ЗАСАДЫ (SWARM CLUSTER TRAP)
          =================================================================== */}
          {activeTab === 'SWARM_AMBUSH' && (
            <div className="space-y-4">
              {/* Описание тактики */}
              <div className="p-3.5 rounded-lg bg-gradient-to-r from-purple-950/80 via-black to-slate-950 border-2 border-purple-500/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-300 font-black uppercase border-b border-purple-900/60 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-purple-400" />
                    ТАКТИКА «ОБЛАКО ЧАСОВЫХ»: СМЕРТЕЛЬНАЯ ЗАСАДА ДЛЯ ПРЕСЛЕДОВАТЕЛЕЙ
                  </span>
                  <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-400">
                    КРУГОВОЙ ОХВАТ 360°
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 leading-relaxed">
                  Владелец системы может запрограммировать и поставить часовых в любой точке пространства (у Звёздных Врат, у звезды, у своей планеты, в астероидном поясе или в координатах корабля).
                  <br />
                  <b>Суть тактики:</b> создать в заданном месте <b>ОБЛАКО ЧАСОВЫХ</b> (кластер из 3–7 платформ) и завлечь туда преследователя. Как только преследователь пересекает периметр ловушки — <b>все часовые облака синхронно открывают огонь со всех сторон!</b>
                </div>
              </div>

              {/* Форма создания/развёртывания нового облака часовых */}
              <form
                onSubmit={handleDeploySwarmSubmit}
                className="p-3.5 rounded-lg bg-black border-2 border-purple-500/80 space-y-3"
              >
                <div className="font-extrabold text-xs text-purple-300 flex items-center gap-1.5 border-b border-purple-900/50 pb-1.5">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>РАЗВЕРНУТЬ НОВОЕ ТАКТИЧЕСКОЕ ОБЛАКО ЧАСОВЫХ:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[10px]">
                  <div>
                    <label className="text-slate-400 block mb-1">Название облака / засады:</label>
                    <input
                      type="text"
                      value={swarmClusterName}
                      onChange={(e) => setSwarmClusterName(e.target.value)}
                      placeholder="«Смертельный мешок корсаров»"
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Локация дислокации облака:</label>
                    <select
                      value={swarmDeployLocation}
                      onChange={(e) => setSwarmDeployLocation(e.target.value as any)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                    >
                      <option value="CURRENT_SHIP_POSITION">📍 В текущих координатах (приманка преследователя)</option>
                      <option value="STARGATE_PERIMETER">⛩️ У Звёздных Врат (перехват на выходе)</option>
                      <option value="ASTEROID_BELT_MINEFIELD">☄️ В Астероидном Поясе (засада в руднике)</option>
                      <option value="OWNED_PLANET_ORBIT">🪐 У своей Планеты (орбитальная ловушка)</option>
                      <option value="CENTRAL_STAR_PROXIMITY">☀️ У Звезды (быстрая зарядка батарей)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Количество платформ в облаке:</label>
                    <select
                      value={swarmNodesCount}
                      onChange={(e) => setSwarmNodesCount(Number(e.target.value))}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-yellow-300 font-bold text-xs"
                    >
                      <option value={3}>3 платформы (Триада 120°)</option>
                      <option value={5}>5 платформ (Пентагон 72° — Рекомендуется)</option>
                      <option value={7}>7 платформ (Септагон 51° — Плотный огонь)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Боевая директива облака:</label>
                    <select
                      value={swarmInitialDirective}
                      onChange={(e) => setSwarmInitialDirective(e.target.value as any)}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-rose-300 font-bold text-xs"
                    >
                      <option value="DESTROY_ONLY">⚡ ТОЛЬКО УНИЧТОЖИТЬ (Засада без предупреждений)</option>
                      <option value="DETER_AND_DESTROY">🛡️ ОТПУГНУТЬ И УНИЧТОЖИТЬ (Эскалация)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-purple-900/50">
                  <div className="text-[10px] text-slate-400">
                    Каждая платформа займёт фиксированную точку по периметру кольца радиусом 950 м под углами охвата 360°.
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>РАЗВЕРНУТЬ ОБЛАКО ИЗ {swarmNodesCount} ЧАСОВЫХ</span>
                  </button>
                </div>
              </form>

              {/* Тактическая круговая схема облака 360° и платформы */}
              <div className="p-3.5 rounded-lg bg-black border-2 border-cyan-500/80 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-extrabold uppercase border-b border-cyan-900/50 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    КРУГОВОЙ ОХВАТ ЗАСАДЫ 360° (ПЕРЕКРЁСТНЫЙ ОГОНЬ)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    РАДИУС ЛОВУШКИ: ~950 МЕТРОВ
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Радарная схема */}
                  <div className="relative h-48 bg-slate-950 rounded-lg border border-cyan-900 flex items-center justify-center overflow-hidden">
                    {/* Концентрические кольца */}
                    <div className="absolute w-40 h-40 rounded-full border border-cyan-500/20" />
                    <div className="absolute w-28 h-28 rounded-full border border-cyan-500/40" />
                    <div className="absolute w-16 h-16 rounded-full border border-dashed border-rose-500/60 animate-pulse" />
                    {/* Оси прицеливания */}
                    <div className="absolute w-full h-[1px] bg-cyan-500/20" />
                    <div className="absolute h-full w-[1px] bg-cyan-500/20" />

                    {/* Центр: цель в ловушке */}
                    <div className="z-10 flex flex-col items-center">
                      <Skull className="w-5 h-5 text-rose-500 animate-bounce" />
                      <span className="text-[8px] text-rose-300 font-bold bg-black/80 px-1 rounded">
                        ПРЕСЛЕДОВАТЕЛЬ
                      </span>
                    </div>

                    {/* 5 векторов часовых по периметру */}
                    {[0, 72, 144, 216, 288].map((angle, idx) => {
                      const rad = (angle * Math.PI) / 180;
                      const x = 50 + 38 * Math.cos(rad);
                      const y = 50 + 38 * Math.sin(rad);
                      return (
                        <div
                          key={angle}
                          className="absolute z-10 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${x}%`, top: `${y}%` }}
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 border border-white flex items-center justify-center text-[7px] text-black font-black shadow-[0_0_8px_cyan]">
                            {idx + 1}
                          </div>
                          <span className="text-[7px] text-cyan-300 bg-black/90 px-0.5 rounded whitespace-nowrap">
                            {angle}°
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Список узлов кластера в системе */}
                  <div className="md:col-span-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                      <span>ПЛАТФОРМЫ ОБЛАКА В СЕТИ:</span>
                      <span className="text-cyan-300">
                        {sentinelNetwork.filter((s) => s.swarmClusterId).length || sentinelNetwork.length} ПЛАТФОРМ
                      </span>
                    </div>

                    {sentinelNetwork.slice(0, 6).map((sent, i) => (
                      <div
                        key={sent.id}
                        className={`p-2 rounded bg-slate-900 border text-[10px] flex items-center justify-between gap-2 ${
                          sent.id === currentSentinel.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-white'
                            : 'border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-cyan-400">#{i + 1}</span>
                          <span className="truncate">{sent.name}</span>
                          <span className="text-slate-500">({sent.swarmVectorAngleDeg ?? i * 72}°)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-yellow-400 font-mono">
                            {Math.round(sent.batteryChargeGeu)} ГЭУ
                          </span>
                          <span
                            className="px-1 rounded text-[9px] font-bold border"
                            style={{
                              borderColor:
                                sent.engagementDirective === 'DESTROY_ONLY' ? '#ef4444' : '#38bdf8',
                              color:
                                sent.engagementDirective === 'DESTROY_ONLY' ? '#ef4444' : '#38bdf8',
                            }}
                          >
                            {sent.engagementDirective === 'DESTROY_ONLY' ? 'УНИЧТОЖИТЬ' : 'ОТПУГНУТЬ'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Блок 3: ИНТЕРАКТИВНЫЙ ТАКТИЧЕСКИЙ СИМУЛЯТОР «ЗАВЛЕЧЬ ПРЕСЛЕДОВАТЕЛЯ В ОБЛАКО» */}
              <div className="p-3.5 rounded-lg bg-black border-2 border-rose-500/80 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-rose-300 font-extrabold uppercase border-b border-rose-900/50 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    ИНТЕРАКТИВНЫЙ СИМУЛЯТОР: «ЗАВЛЕЧЬ ПРЕСЛЕДОВАТЕЛЯ В ОБЛАКО»
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ЗАЛП СО ВСЕХ СТОРОН 360°
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Выберите преследователя, заманиваемого в облако:</label>
                    <select
                      value={simPursuerType}
                      onChange={(e) => setSimPursuerType(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white text-xs font-bold"
                    >
                      <option value="PIRATE_CRUISER">🏴‍☠️ Пиратский крейсер «Чёрный Клык» (2 400 HP · Пираты-конкуренты)</option>
                      <option value="VOID_MARAUDER">💀 Мародёр пустоты «Тень Астероида» (1 200 HP · Расхититель руд)</option>
                      <option value="DICTATOR_FLAGSHIP">🚨 Карательный флагман диктатора «Возмездие» (3 800 HP · Дредноут)</option>
                      <option value="MERCENARY_FRIGATE">⚔️ Фрегат наёмников «Цербер-7» (1 700 HP · Вторжение)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleSimulateSwarmTrapSalvo}
                      className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all animate-pulse"
                    >
                      <Skull className="w-4 h-4" />
                      <span>🎯 ЗАМАНИТЬ В ОБЛАКО И ВДАРИТЬ!</span>
                    </button>
                  </div>
                </div>

                {/* Боевой рапорт перекрёстного залпа облака */}
                {swarmCrossfireReport && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border-2 border-rose-500 text-rose-100 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-rose-800/60 pb-1">
                      <div className="font-black text-xs text-rose-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <span>💥 ПЕРЕКРЁСТНЫЙ ЗАЛП ОБЛАКА ЧАСОВЫХ: МОЧАТ СО ВСЕХ СТОРОН!</span>
                      </div>
                      <span className="text-[10px] bg-rose-900 px-2 py-0.5 rounded font-black text-white">
                        СУММАРНЫЙ УРОН: {swarmCrossfireReport.totalDamageKg} КГ
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-200">
                      {swarmCrossfireReport.summaryMessageRu}
                    </div>

                    {/* Попадания по секторам/углам */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 pt-1">
                      {swarmCrossfireReport.platformReports.map((rep) => (
                        <div
                          key={rep.sentinelId}
                          className="p-1.5 rounded bg-black/80 border text-[9px] font-mono space-y-0.5"
                          style={{ borderColor: rep.beamColorHex }}
                        >
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>Вектор {rep.angleDeg}°</span>
                            <span style={{ color: rep.beamColorHex }}>-{rep.damageKg} кг</span>
                          </div>
                          <div className="text-slate-400 truncate">
                            {SENTINEL_STRIKE_MODES[rep.strikeMode].codeName}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] text-yellow-300 font-bold border-t border-rose-900/60 pt-1">
                      {swarmCrossfireReport.isCrossfireSurrounded ? (
                        <span>
                          🛡️ Цель полностью окружена! Огонь вёлся со всех направлений 360° одновременно без шанса на уклонение!
                        </span>
                      ) : (
                        <span>Огонь вёлся готовыми платформами облака.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА: ОБЪЁМНОЕ ТОРМОЖЕНИЕ ДВИГАТЕЛЯ (НЕ МЕНЕЕ ТРЁХ ЧАСОВЫХ)
          =================================================================== */}
          {activeTab === 'ENGINE_SUPPRESSION' && (
            <div className="space-y-4">
              {/* Описание технологии */}
              <div className="p-3.5 rounded-lg bg-gradient-to-r from-cyan-950/80 via-black to-slate-950 border-2 border-cyan-400 space-y-2">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-black uppercase border-b border-cyan-900/60 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    ОБЪЁМНОЕ ВОЗДЕЙСТВИЕ НА ДВИГАТЕЛЬ (НЕ МЕНЕЕ ТРЁХ ЧАСОВЫХ)
                  </span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-400 font-bold">
                    ТОРМОЖЕНИЕ В ТОННАХ · БЕЗ СТРЕЛЬБЫ
                  </span>
                </div>
                <div className="text-[11px] text-slate-200 leading-relaxed">
                  <b>Принцип физического воздействия:</b> не урон корпусу, а непосредственное силовое поле на маршевые и маневровые двигатели корабля, уменьшающее его тягу (кН) и скорость соответственно.
                  <br />
                  <b>Условия работы:</b> объёмная конструкция — <b>внутри не менее трёх часовых (N ≥ 3)</b>.
                  <br />
                  <b>Динамика силы поля:</b> сила торможения измеряется строго в единицах — <b>ТОННАХ</b> (точно соответствует массе/дебету часовых, 12.0 т на платформу).
                  Дистанция соответствия 100% у самих часовых и спадает до <b>0 тонн в самом центре</b> между ними (при диаметре контура 2000 единиц).
                  <br />
                  <b className="text-rose-400">ВНИМАНИЕ:</b> этот режим <b>полностью исключает стрельбу</b>, перенаправляя всю мощность фотонно-квантового генератора в контур захвата тяги!
                </div>
              </div>

              {/* Управление и активация директивы на сеть */}
              <div className="p-3 rounded-lg bg-black/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Текущая директива активного часового:</span>
                  <span
                    className="px-2 py-0.5 rounded font-black border text-[10px]"
                    style={{
                      borderColor: directiveMeta.colorHex,
                      color: directiveMeta.colorHex,
                      backgroundColor: `${directiveMeta.colorHex}20`,
                    }}
                  >
                    {directiveMeta.badgeRu}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDirective('VOLUMETRIC_ENGINE_SUPPRESSION')}
                    className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-[11px]"
                  >
                    Включить для часового
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDirectiveToAll('VOLUMETRIC_ENGINE_SUPPRESSION')}
                    className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                  >
                    🧲 Включить для ВСЕЙ ТРИАДЫ / СЕТИ
                  </button>
                </div>
              </div>

              {/* Интерактивный регулятор позиции цели внутри объёмной триады */}
              <div className="p-3.5 rounded-lg bg-black border-2 border-cyan-500/80 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-cyan-300 font-extrabold uppercase border-b border-cyan-900/50 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    ИНТЕРАКТИВНЫЙ ГРАДИЕНТ ТОРМОЖЕНИЯ: ДИСТАНЦИЯ ДО ЦЕНТРА МЕЖДУ ЧАСОВЫМИ
                  </span>
                  <span className="text-[10px] text-slate-300">
                    ДИСТАНЦИЯ ДО ЦЕНТРА: <b className="text-cyan-300 text-xs">{simFieldDistToCenter} ед.</b> / 2000 ед.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-bold">Центр между часовыми: 0 ед. (Сила = 0 тонн)</span>
                    <span className="text-yellow-400">1 000 ед. (50% силы = ~18.0 т)</span>
                    <span className="text-cyan-400 font-bold">Периметр у часовых: 2 000 ед. (100% силы = ~36.0+ т)</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={simFieldDistToCenter}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSimFieldDistToCenter(val);
                      handleSimulateFieldSuppression(val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  <div className="flex items-center gap-2 justify-end pt-1">
                    <span className="text-[10px] text-slate-400">Быстрые позиции цели:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSimFieldDistToCenter(0);
                        handleSimulateFieldSuppression(0);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-emerald-300 border border-emerald-700"
                    >
                      В центре (0 ед. ➔ Сила: 0 т)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimFieldDistToCenter(700);
                        handleSimulateFieldSuppression(700);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-yellow-300 border border-slate-700"
                    >
                      700 ед. (35% силы)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimFieldDistToCenter(1400);
                        handleSimulateFieldSuppression(1400);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-300 border border-slate-700"
                    >
                      1 400 ед. (70% силы)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimFieldDistToCenter(2000);
                        handleSimulateFieldSuppression(2000);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-rose-300 border border-rose-700"
                    >
                      Периметр (2 000 ед. ➔ 100% силы)
                    </button>
                  </div>
                </div>

                {/* 2D/3D Схема объёмной триады часовых и положение корабля */}
                <div className="relative h-56 bg-slate-950 rounded-lg border border-cyan-800 flex items-center justify-center overflow-hidden">
                  {/* Концентрические изолинии градиента силы */}
                  <div className="absolute w-48 h-48 rounded-full border border-cyan-500/40" />
                  <div className="absolute w-36 h-36 rounded-full border border-cyan-500/30" />
                  <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20" />
                  <div className="absolute w-12 h-12 rounded-full border border-dashed border-emerald-500/50" />

                  {/* Оси триады силовых линий (120° между тремя часовыми) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="50%" y1="50%" x2="50%" y2="12%" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                    <line x1="50%" y1="50%" x2="16%" y2="78%" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                    <line x1="50%" y1="50%" x2="84%" y2="78%" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                    {/* Треугольник контура между часовыми */}
                    <polygon points="50%,12% 16%,78% 84%,78%" fill="none" stroke="#06b6d4" strokeWidth="1.2" opacity="0.3" />
                  </svg>

                  {/* 3 часовых триады (минимальная объёмная конструкция) */}
                  <div className="absolute top-[12%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-[8px] text-black font-black shadow-[0_0_12px_cyan]">
                      Ω1
                    </div>
                    <span className="text-[7.5px] text-cyan-200 bg-black/90 px-1 rounded mt-0.5">
                      Часовой #1 (12.0 т)
                    </span>
                  </div>

                  <div className="absolute top-[78%] left-[16%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-[8px] text-black font-black shadow-[0_0_12px_cyan]">
                      Ω2
                    </div>
                    <span className="text-[7.5px] text-cyan-200 bg-black/90 px-1 rounded mt-0.5">
                      Часовой #2 (12.0 т)
                    </span>
                  </div>

                  <div className="absolute top-[78%] left-[84%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center text-[8px] text-black font-black shadow-[0_0_12px_cyan]">
                      Ω3
                    </div>
                    <span className="text-[7.5px] text-cyan-200 bg-black/90 px-1 rounded mt-0.5">
                      Часовой #3 (12.0 т)
                    </span>
                  </div>

                  {/* Центр поля (сила = 0 тонн) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-80">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-ping" />
                    <span className="text-[7px] text-emerald-300 bg-black/90 px-1 rounded mt-1 whitespace-nowrap">
                      ЦЕНТР: СИЛА = 0 Т
                    </span>
                  </div>

                  {/* Положение преследуемого корабля цели по дистанции simFieldDistToCenter */}
                  {(() => {
                    const ratio = simFieldDistToCenter / 2000;
                    const posX = 50 + ratio * 28;
                    const posY = 50 - ratio * 18;
                    return (
                      <div
                        className="absolute z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                        style={{ left: `${posX}%`, top: `${posY}%` }}
                      >
                        <div className={`p-1 rounded bg-black/90 border border-yellow-400 flex items-center gap-1 shadow-lg ${isFieldActivePulse ? 'scale-110' : ''}`}>
                          <Skull className="w-4 h-4 text-rose-400" />
                          <span className="text-[8px] text-yellow-300 font-bold whitespace-nowrap">
                            ЦЕЛЬ: -{Math.round(ratio * 36)} т ТЯГИ
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Результат воздействия на двигатель цели */}
                {(() => {
                  const activeSupp =
                    volumetricSuppressionReport ||
                    calculateVolumetricEngineSuppression(
                      sentinelNetwork,
                      currentSentinel.swarmClusterId,
                      'Преследователь в ловушке',
                      simFieldDistToCenter,
                      2000
                    ).suppression;

                  return (
                    <div className="p-3 rounded-lg bg-cyan-950/50 border-2 border-cyan-400 text-cyan-100 space-y-2">
                      <div className="flex items-center justify-between border-b border-cyan-800/80 pb-1">
                        <span className="font-black text-xs text-cyan-300 flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                          СИЛОВОЕ ПОДАВЛЕНИЕ ТЯГИ ДВИГАТЕЛЯ (В ТОННАХ)
                        </span>
                        <span className="text-[10px] bg-cyan-900 px-2 py-0.5 rounded font-black text-white">
                          ТОРМОЖЕНИЕ: {activeSupp.totalBrakingForceTons.toFixed(1)} ТОНН
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-slate-400">СИЛА ТОРМОЖЕНИЯ:</div>
                          <div className="text-base font-black text-cyan-300">
                            {activeSupp.totalBrakingForceTons.toFixed(1)} т
                          </div>
                          <div className="text-[8.5px] text-slate-500">дебет массы 3+ часовых</div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-slate-400">ПОДАВЛЕНИЕ ТЯГИ (кН):</div>
                          <div className="text-base font-black text-amber-300">
                            -{activeSupp.thrustReductionPercent}%
                          </div>
                          <div className="text-[8.5px] text-slate-500">гашение маршевых сопел</div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-slate-400">СНИЖЕНИЕ СКОРОСТИ:</div>
                          <div className="text-base font-black text-rose-300">
                            -{activeSupp.speedReductionPercent}%
                          </div>
                          <div className="text-[8.5px] text-slate-500">эффект грави-якоря</div>
                        </div>

                        <div className="p-2 rounded bg-black/60 border border-slate-800">
                          <div className="text-slate-400">СТАТУС ОРУДИЙ:</div>
                          <div className="text-xs font-black text-emerald-300">
                            СТРЕЛЬБА ИСКЛЮЧЕНА
                          </div>
                          <div className="text-[8.5px] text-slate-500">100% энергии на двигатель</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-200">
                        {activeSupp.summaryMessageRu}
                      </div>

                      {/* Индивидуальный вклад часовых в торможение */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-cyan-900/60">
                        {activeSupp.nodes.slice(0, 3).map((node, i) => (
                          <div
                            key={node.sentinelId}
                            className="p-1.5 rounded bg-black/80 border border-cyan-700 text-[9px] font-mono flex items-center justify-between"
                          >
                            <span className="text-white font-bold">Часовой #{i + 1} ({node.massTons} т)</span>
                            <span className="text-cyan-300 font-black">
                              +{node.individualBrakingTons.toFixed(1)} т тормоза
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateFieldSuppression(simFieldDistToCenter)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>ПРИЛОЖИТЬ СИЛУ ТОРМОЖЕНИЯ К ДВИГАТЕЛЮ ({simFieldDistToCenter} ед.)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА 4: СОЛНЕЧНЫЙ КОНВЕРТОР И АККУМУЛЯТОР
          =================================================================== */}
          {activeTab === 'SOLAR_BATTERY' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-yellow-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-yellow-300 text-xs uppercase flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-yellow-400" />
                    ФОТОННЫЙ КОНВЕРТОР «МЕЛЬНИЦА» ({currentSentinel.converterSurfaceAreaSqM || 675} М² · {currentSentinel.bladeCount || 6} ЛОПАСТЕЙ)
                  </span>
                  <span className="text-[10px] font-mono text-yellow-300 bg-yellow-950 px-2 py-0.5 rounded border border-yellow-400">
                    СВЕТИЛО: {starProf.spectralClass} · УСКОРЕНИЕ {(currentSentinel.chargeRateMultiplier || 1.5).toFixed(1)}x
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">ПРИТОК ЭНЕРГИИ В СЕКУНДУ:</div>
                    <div className="text-base font-black text-yellow-300">
                      +{currentSentinel.energyRechargeRateGeuPerSec} ГЭУ/с
                    </div>
                    <div className="text-[9px] text-slate-500">
                      +{currentSentinel.energyRechargeRateGeuPerMin} ГЭУ/мин (зависит от лопастей)
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">РАДИАЦИОННЫЙ ПОТОК:</div>
                    <div className="text-base font-black text-cyan-300">
                      {currentSentinel.solarFluxWattsPerSqM} Вт/м²
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Коэффициент звезды K_rad = {starProf.totalRadCoeff.toFixed(2)}x
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-black/60 border border-slate-800 space-y-1">
                    <div className="text-slate-400 text-[10px]">МОДИФИКАЦИЯ ЛОПАСТЕЙ:</div>
                    <div className="text-base font-black text-amber-300">
                      {currentSentinel.bladeCount || 6} лопастей
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {SENTINEL_BLADE_MODS_META[currentSentinel.bladeModification || 6].codeName}
                    </div>
                  </div>
                </div>

                {/* Быстрое переключение 3 модификаций (4, 6, 8 лопастей) */}
                <div className="p-3 rounded-lg bg-black/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200">
                      ВЫБОР МОДИФИКАЦИИ ЛОПАСТЕЙ ВЕТРЯНОЙ МЕЛЬНИЦЫ (СКОРОСТЬ ЗАРЯДКИ):
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Влияет на приток ГЭУ/с
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([4, 6, 8] as SentinelBladeModification[]).map((blades) => {
                      const spec = SENTINEL_BLADE_MODS_META[blades];
                      const isCurrent = (currentSentinel.bladeModification || 6) === blades;
                      return (
                        <button
                          key={blades}
                          type="button"
                          onClick={() => handleUpgradeBlades(blades)}
                          className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                            isCurrent
                              ? 'bg-cyan-950 border-cyan-400 ring-2 ring-cyan-500 shadow-md text-white'
                              : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span style={{ color: spec.colorHex }}>{spec.titleRu}</span>
                            <span className="text-[10px] font-mono px-1 rounded bg-black text-cyan-300">
                              {spec.rechargeMultiplier.toFixed(1)}x
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Панели: {spec.surfaceAreaSqM} м² · Масса: {spec.dryMassTons} т
                          </div>
                          <div className="text-[10px] font-semibold text-emerald-400 mt-1">
                            {blades === 4
                              ? '1.0x (базовая)'
                              : blades === 6
                              ? '1.5x (+50% быстрее)'
                              : '2.0x (удвоение!)'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Аккумулятор */}
              <div className="p-3.5 rounded-lg bg-slate-900/90 border-2 border-emerald-500/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-emerald-300 text-xs uppercase flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    СВЕРХПРОВОДЯЩИЙ НАКОПИТЕЛЬ (5 000 ГЭУ)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-400">
                    ЗАРЯД: {currentSentinel.batteryPercent}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Текущий запас: <b>{Math.round(currentSentinel.batteryChargeGeu)} ГЭУ</b></span>
                    <span>Ёмкость: <b>{currentSentinel.batteryCapacityGeu} ГЭУ</b></span>
                  </div>
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-yellow-400 h-full rounded-full transition-all"
                      style={{ width: `${currentSentinel.batteryPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Потребление авионики/РЛС: <b>-2.5 ГЭУ/с</b></span>
                    <span>
                      До полной зарядки: <b>~{currentSentinel.secondsToFullCharge} сек</b>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              ВКЛАДКА 5: БОЕВОЙ ЖУРНАЛ И ТЕЛЕМЕТРИЯ
          =================================================================== */}
          {activeTab === 'LOG' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-black border-2 border-slate-800 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-slate-300 font-extrabold uppercase border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    ТЕЛЕМЕТРИЯ И ЖУРНАЛ ПЕРЕХВАТОВ ЧАСОВОГО
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    ПЕРЕХВАЧЕНО ЦЕЛЕЙ: {currentSentinel.targetsInterceptedCount}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Всего залпов:</span>
                    <b className="text-white text-xs">{currentSentinel.totalShotsFired}</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Разрушено массы врагов:</span>
                    <b className="text-yellow-300 text-xs">{currentSentinel.totalDamageDealtKg} кг</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Последняя цель:</span>
                    <b className="text-cyan-300 text-xs truncate block">{currentSentinel.lastTargetName || '—'}</b>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Зона влияния базы:</span>
                    <b className="text-emerald-300 text-xs">{zoneMeta.badgeRu}</b>
                  </div>
                </div>

                {/* Список записей журнала */}
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {currentSentinel.eventLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[10px] flex items-start gap-2"
                    >
                      <span className="text-slate-500 shrink-0 font-mono">[{log.timestamp}]</span>
                      <span
                        className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                          log.category === 'FIRE'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500'
                            : log.category === 'IFF'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                            : log.category === 'SOLAR'
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-500'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                        }`}
                      >
                        {log.category}
                      </span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
