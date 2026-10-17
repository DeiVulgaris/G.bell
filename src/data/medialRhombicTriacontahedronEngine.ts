/**
 * МАТЕМАТИЧЕСКАЯ МОДЕЛЬ И ГЕОМЕТРИЯ:
 * СРЕДНИЙ РОМБОТРИАКОНТАЭДР (MEDIAL RHOMBIC TRIACONTAHEDRON, W73)
 *
 * Космический объект: Орбитальная Мегаверфь «Талион»
 * Размер: 0.5 диаметра планеты (D = 6 371 км при диаметре планеты 12 742 км)
 *
 * Геометрические параметры:
 * - Невыпуклый равногранный многогранник (звездчатая форма ромботриаконтаэдра)
 * - Двойственный к додекадодекаэдру (U36)
 * - Граней: 30 самопересекающихся ромбов с углами 41.81031° и 138.18969°
 * - Ребер: 60 (длина sqrt(3))
 * - Вершин: 24 (12 внешних 5-лучевых зенитных шпилей + 12 внутренних квантовых стапелей)
 */

export const PHI = (1 + Math.sqrt(5)) / 2; // Золотое сечение 1.6180339887
export const INV_PHI = 1 / PHI; // 0.6180339887

export interface PolyhedronVertex {
  id: number;
  type: 'OUTER_ZENITH' | 'INNER_CORE';
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface PolyhedronEdge {
  id: number;
  v1: number;
  v2: number;
  length: number;
}

export interface RhombicFace {
  id: number;
  outerVertices: [number, number]; // Индексы внешних вершин O1, O2
  innerVertices: [number, number]; // Индексы внутренних вершин I1, I2
  indices: [number, number, number, number]; // [O1, I1, O2, I2] в порядке обхода периметра
  normal: [number, number, number];
  center: [number, number, number];
  name: string;
}

export interface MedialRhombicGeometry {
  vertices: PolyhedronVertex[];
  edges: PolyhedronEdge[];
  faces: RhombicFace[];
  outerRadius: number;
  innerRadius: number;
  aspectRatio: number;
}

/**
 * Генерирует точную геометрию Среднего Ромботриаконтаэдра
 */
export function buildMedialRhombicTriacontahedron(): MedialRhombicGeometry {
  const vertices: PolyhedronVertex[] = [];
  const signs = [-1, 1];
  let vId = 0;

  // 1. 12 ВНЕШНИХ ВЕРШИН (OUTER_ZENITH) — вершины икосаэдра:
  // Четные перестановки (+-phi, +-1, 0)
  for (const s1 of signs) {
    for (const s2 of signs) {
      vertices.push({
        id: vId++,
        type: 'OUTER_ZENITH',
        x: s1 * PHI,
        y: s2 * 1,
        z: 0,
        name: `Зенит-Шпиль Ω-${vId}`,
      });
      vertices.push({
        id: vId++,
        type: 'OUTER_ZENITH',
        x: 0,
        y: s1 * PHI,
        z: s2 * 1,
        name: `Зенит-Шпиль Ω-${vId}`,
      });
      vertices.push({
        id: vId++,
        type: 'OUTER_ZENITH',
        x: s2 * 1,
        y: 0,
        z: s1 * PHI,
        name: `Зенит-Шпиль Ω-${vId}`,
      });
    }
  }

  // 2. 12 ВНУТРЕННИХ ВЕРШИН (INNER_CORE) — вершины малого икосаэдра:
  // Четные перестановки (+-1, +-invPhi, 0)
  for (const s1 of signs) {
    for (const s2 of signs) {
      vertices.push({
        id: vId++,
        type: 'INNER_CORE',
        x: s1 * 1,
        y: s2 * INV_PHI,
        z: 0,
        name: `Ядро-Стапель К-${vId - 12}`,
      });
      vertices.push({
        id: vId++,
        type: 'INNER_CORE',
        x: 0,
        y: s1 * 1,
        z: s2 * INV_PHI,
        name: `Ядро-Стапель К-${vId - 12}`,
      });
      vertices.push({
        id: vId++,
        type: 'INNER_CORE',
        x: s2 * INV_PHI,
        y: 0,
        z: s1 * 1,
        name: `Ядро-Стапель К-${vId - 12}`,
      });
    }
  }

  // Нормализуем масштаб: внешний радиус приводим к 1.0
  const outerR = Math.hypot(vertices[0].x, vertices[0].y, vertices[0].z); // sqrt(phi^2 + 1)
  for (const v of vertices) {
    v.x /= outerR;
    v.y /= outerR;
    v.z /= outerR;
  }
  const innerR = Math.hypot(vertices[12].x, vertices[12].y, vertices[12].z);

  // 3. 60 РЕБЕР МЕЖДУ ВНЕШНИМИ И ВНУТРЕННИМИ ВЕРШИНАМИ (длина до нормировки = sqrt(3))
  const targetEdgeDist = Math.sqrt(3) / outerR;
  const edges: PolyhedronEdge[] = [];
  const outerAdj: number[][] = Array.from({ length: 12 }, () => []);
  let eId = 0;

  for (let o = 0; o < 12; o++) {
    for (let i = 12; i < 24; i++) {
      const dist = Math.hypot(
        vertices[o].x - vertices[i].x,
        vertices[o].y - vertices[i].y,
        vertices[o].z - vertices[i].z
      );
      if (Math.abs(dist - targetEdgeDist) < 0.05) {
        edges.push({
          id: eId++,
          v1: o,
          v2: i,
          length: dist,
        });
        outerAdj[o].push(i);
      }
    }
  }

  // 4. 30 ПЛОСКИХ РОМБИЧЕСКИХ ГРАНЕЙ (каждая грань — 4 вершины O1, I1, O2, I2)
  const faces: RhombicFace[] = [];
  let fId = 0;

  for (let o1 = 0; o1 < 12; o1++) {
    for (let o2 = o1 + 1; o2 < 12; o2++) {
      const commonInners = outerAdj[o1].filter((inIdx) => outerAdj[o2].includes(inIdx));
      if (commonInners.length === 2) {
        const i1 = commonInners[0];
        const i2 = commonInners[1];

        // Проверяем компланарность (объем тетраэдра ~ 0)
        const vO1 = vertices[o1];
        const vO2 = vertices[o2];
        const vI1 = vertices[i1];
        const vI2 = vertices[i2];

        const a = [vI1.x - vO1.x, vI1.y - vO1.y, vI1.z - vO1.z];
        const b = [vO2.x - vO1.x, vO2.y - vO1.y, vO2.z - vO1.z];
        const c = [vI2.x - vO1.x, vI2.y - vO1.y, vI2.z - vO1.z];

        const cx = a[1] * b[2] - a[2] * b[1];
        const cy = a[2] * b[0] - a[0] * b[2];
        const cz = a[0] * b[1] - a[1] * b[0];
        const dot = cx * c[0] + cy * c[1] + cz * c[2];

        if (Math.abs(dot) < 0.005) {
          // Вычисляем нормаль ромба
          const lenN = Math.hypot(cx, cy, cz) || 1;
          const nx = cx / lenN;
          const ny = cy / lenN;
          const nz = cz / lenN;

          // Центр ромба
          const midX = (vO1.x + vI1.x + vO2.x + vI2.x) / 4;
          const midY = (vO1.y + vI1.y + vO2.y + vI2.y) / 4;
          const midZ = (vO1.z + vI1.z + vO2.z + vI2.z) / 4;

          // Убеждаемся, что нормаль смотрит наружу от центра
          const dotOut = midX * nx + midY * ny + midZ * nz;
          const signN = dotOut >= 0 ? 1 : -1;

          faces.push({
            id: fId++,
            outerVertices: [o1, o2],
            innerVertices: [i1, i2],
            indices: [o1, i1, o2, i2],
            normal: [nx * signN, ny * signN, nz * signN],
            center: [midX, midY, midZ],
            name: `Стапель-Ромб #${fId}`,
          });
        }
      }
    }
  }

  return {
    vertices,
    edges,
    faces,
    outerRadius: 1.0,
    innerRadius: innerR,
    aspectRatio: innerR / 1.0,
  };
}

/**
 * Глобальный кэш геометрической модели
 */
export const MEDIAL_RHOMBIC_MODEL = buildMedialRhombicTriacontahedron();

/**
 * Характеристики Мегаверфи размером с половину планеты
 */
export const MEGASTRUCTURE_SHIPYARD_SPECS = {
  id: 'megastructure-shipyard-triacontahedron',
  name: 'ОРБИТАЛЬНАЯ МЕГАВЕРФЬ «ТАЛИОН» · СРЕДНИЙ РОМБОТРИАКОНТАЭДР',
  subName: 'Medial Rhombic Triacontahedron Shipyard · Размер: 0.5R Планеты',
  tagline:
    'Колоссальный планетарный сборочный комплекс размером в половину планеты (диаметр 6 371 км). 30 самопересекающихся ромбических стапелей, 60 гранных магистралей и 24 глубококосмических причала.',
  geometryType: 'Средний ромботриаконтаэдр (Wenninger W73, дуаль U36)',
  scaleComparison: 'Ровно 50% от диаметра Терра-II (6 371 км против 12 742 км)',
  facesCount: 30,
  edgesCount: 60,
  verticesCount: 24,
  outerZenithTowers: 12,
  innerCoreDocks: 12,
  simultaneousBuildSlots: 1200,
  matterSingularityReactorMw: '4.8 × 10¹⁸ МВт',
  teleportCaptureRadiusKm: 100000,
};

/**
 * Отрисовывает космический объект Мегаверфь и прилегающую планету на Canvas 2D
 */
export function renderMedialRhombicShipyardScene(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  yaw: number,
  pitch: number,
  options?: {
    showPlanet?: boolean;
    showLasers?: boolean;
    showBeacons?: boolean;
    showWireframe?: boolean;
    activeSlipIndex?: number;
    planetScaleRatio?: number; // 2.0 = планета в 2 раза больше верфи (верфь = 0.5 планеты)
    timeMs?: number;
  }
) {
  const {
    showPlanet = true,
    showLasers = true,
    showBeacons = true,
    showWireframe = true,
    activeSlipIndex = 14,
    planetScaleRatio = 2.0, // Верфь = 1/2 диаметра планеты!
    timeMs = Date.now(),
  } = options || {};

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  // Вектор освещения (Солнце сверху-справа)
  const sunDir = { x: 0.6, y: 0.7, z: 0.4 };
  const sunLen = Math.hypot(sunDir.x, sunDir.y, sunDir.z);
  sunDir.x /= sunLen;
  sunDir.y /= sunLen;
  sunDir.z /= sunLen;

  // 3D проекция в экранные координаты
  const project = (lx: number, ly: number, lz: number, scale = baseRadius) => {
    // Yaw
    const x1 = lx * cosY + lz * sinY;
    const y1 = ly;
    const z1 = -lx * sinY + lz * cosY;
    // Pitch
    const x2 = x1;
    const y2 = y1 * cosP - z1 * sinP;
    const z2 = y1 * sinP + z1 * cosP;

    return {
      x: cx + x2 * scale,
      y: cy - y2 * scale,
      z: z2,
    };
  };

  // ===========================================================================
  // 1. ПЛАНЕТА НА ЗАДНЕМ ПЛАНЕ (РАЗМЕР В 2 РАЗА БОЛЬШЕ ВЕРФИ: ВЕРФЬ = 0.5 ПЛАНЕТЫ)
  // ===========================================================================
  if (showPlanet) {
    const planetRadius = baseRadius * planetScaleRatio;
    // Планета смещена назад и влево/вниз, чтобы создать грандиозную панораму орбитального нависания
    const planetOffsetX = cx + baseRadius * 0.95;
    const planetOffsetY = cy + baseRadius * 0.42;

    // Внешняя атмосфера планеты (Rayleigh scattering)
    const atmoGrad = ctx.createRadialGradient(
      planetOffsetX,
      planetOffsetY,
      planetRadius * 0.85,
      planetOffsetX,
      planetOffsetY,
      planetRadius * 1.3
    );
    atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    atmoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.18)');
    atmoGrad.addColorStop(0.85, 'rgba(3, 105, 161, 0.06)');
    atmoGrad.addColorStop(1, 'transparent');

    ctx.save();
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(planetOffsetX, planetOffsetY, planetRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Тело планеты (океаны, континенты, терминатор тени)
    const planetBodyGrad = ctx.createRadialGradient(
      planetOffsetX - planetRadius * 0.35,
      planetOffsetY - planetRadius * 0.35,
      planetRadius * 0.1,
      planetOffsetX,
      planetOffsetY,
      planetRadius
    );
    planetBodyGrad.addColorStop(0, '#38bdf8');
    planetBodyGrad.addColorStop(0.25, '#0284c7');
    planetBodyGrad.addColorStop(0.65, '#034570');
    planetBodyGrad.addColorStop(0.9, '#02182b');
    planetBodyGrad.addColorStop(1, '#010b14');

    ctx.fillStyle = planetBodyGrad;
    ctx.beginPath();
    ctx.arc(planetOffsetX, planetOffsetY, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // Континентальные контуры и облачные завихрения на планете
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = 0.4 + i * 0.35 + Math.sin(timeMs * 0.0001 + i) * 0.05;
      const rCont = planetRadius * (0.45 + i * 0.12);
      ctx.arc(planetOffsetX, planetOffsetY, rCont, angle, angle + 0.55);
    }
    ctx.stroke();

    // Облачные полосы циклонов
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(
      planetOffsetX,
      planetOffsetY,
      planetRadius * 0.78,
      0.2,
      1.2
    );
    ctx.stroke();

    // Орбитальный трос / лифт связи верфи с экваториальным космопортом планеты
    const tetherAngle = Math.PI * 0.72;
    const tetherTargetX = planetOffsetX + Math.cos(tetherAngle) * planetRadius;
    const tetherTargetY = planetOffsetY + Math.sin(tetherAngle) * planetRadius;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tetherTargetX, tetherTargetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Аннотация масштаба в углу планеты
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('ПЛАНЕТА ТЕРРА-II · D = 12 742 км', planetOffsetX - planetRadius * 0.5, planetOffsetY + planetRadius * 0.95);

    ctx.restore();
  }

  // ===========================================================================
  // 2. ЦЕНТРАЛЬНОЕ ЭНЕРГЕТИЧЕСКОЕ ЯДРО ВЕРФИ (СИНГУЛЯРНОСТЬ ТЕЛЕПОРТАЦИИ)
  // ===========================================================================
  const corePulse = (Math.sin(timeMs * 0.004) + 1) * 0.5;
  const coreRadius = baseRadius * (0.16 + corePulse * 0.03);

  // Свечение ядра
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 2.2);
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  coreGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.85)');
  coreGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.4)');
  coreGrad.addColorStop(1, 'transparent');

  ctx.save();
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Вращающиеся кольца магнитного удержания ядра
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
  ctx.lineWidth = 1.5;
  for (let r = 0; r < 3; r++) {
    const angleRot = (timeMs * 0.001 * (r % 2 === 0 ? 1 : -1) + r * 1.1) % (Math.PI * 2);
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      coreRadius * (1.3 + r * 0.35),
      coreRadius * (0.55 + r * 0.15),
      angleRot,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();

  // ===========================================================================
  // 3. ПРОЕКЦИЯ ВЕРШИН СРЕДНЕГО РОМБОТРИАКОНТАЭДРА
  // ===========================================================================
  const projectedVertices = MEDIAL_RHOMBIC_MODEL.vertices.map((v) => {
    const pt = project(v.x, v.y, v.z, baseRadius * 0.85);
    return {
      ...v,
      sx: pt.x,
      sy: pt.y,
      sz: pt.z,
    };
  });

  // ===========================================================================
  // 4. ГРАНИ (30 САМОПЕРЕСЕКАЮЩИХСЯ РОМБОВ): СОРТИРОВКА ПО ГЛУБИНЕ (PAINTER'S ALGO)
  // ===========================================================================
  const renderedFaces = MEDIAL_RHOMBIC_MODEL.faces.map((face) => {
    const pts = face.indices.map((idx) => projectedVertices[idx]);
    const avgZ = (pts[0].sz + pts[1].sz + pts[2].sz + pts[3].sz) / 4;

    // Вектор нормали после трансформации
    const n = face.normal;
    // Yaw
    const nx1 = n[0] * cosY + n[2] * sinY;
    const ny1 = n[1];
    const nz1 = -n[0] * sinY + n[2] * cosY;
    // Pitch
    const nx2 = nx1;
    const ny2 = ny1 * cosP - nz1 * sinP;
    const nz2 = ny1 * sinP + nz1 * cosP;

    // Скалярное произведение с направлением на источник света
    const lightDot = Math.max(0.08, nx2 * sunDir.x + ny2 * sunDir.y + nz2 * sunDir.z);

    return {
      face,
      pts,
      avgZ,
      lightDot,
      isFront: nz2 >= -0.15,
      isActiveSlip: face.id === activeSlipIndex,
    };
  });

  // Сортируем: сначала задние грани (avgZ меньше), затем передние (avgZ больше)
  renderedFaces.sort((a, b) => a.avgZ - b.avgZ);

  // Отрисовка ромбических панелей
  for (const rf of renderedFaces) {
    const { pts, lightDot, isActiveSlip } = rf;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    ctx.lineTo(pts[1].sx, pts[1].sy);
    ctx.lineTo(pts[2].sx, pts[2].sy);
    ctx.lineTo(pts[3].sx, pts[3].sy);
    ctx.closePath();

    if (isActiveSlip) {
      // Активный стапель игрока выделен ярким золотисто-янтарным свечением
      const pulseSlip = (Math.sin(timeMs * 0.008) + 1) * 0.5;
      ctx.fillStyle = `rgba(245, 158, 11, ${0.45 + pulseSlip * 0.35})`;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.stroke();
    } else {
      // Стандартная броневая нано-композитная обшивка стапелей
      const r = Math.round(6 + lightDot * 25);
      const g = Math.round(30 + lightDot * 95);
      const b = Math.round(55 + lightDot * 135);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.58)`;
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + lightDot * 0.45})`;
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
    }

    // Внутренняя сетка стапеля (диагонали ромба)
    if (showWireframe) {
      ctx.strokeStyle = isActiveSlip ? 'rgba(251, 191, 36, 0.6)' : 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      ctx.lineTo(pts[2].sx, pts[2].sy);
      ctx.moveTo(pts[1].sx, pts[1].sy);
      ctx.lineTo(pts[3].sx, pts[3].sy);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ===========================================================================
  // 5. 60 РЕБЕР-МАГИСТРАЛЕЙ (СИЛОВЫЕ ТРУБЫ И СКОРОСТНЫЕ ТРАВОЛАТОРЫ)
  // ===========================================================================
  ctx.save();
  for (const edge of MEDIAL_RHOMBIC_MODEL.edges) {
    const v1 = projectedVertices[edge.v1];
    const v2 = projectedVertices[edge.v2];

    const isNearActive =
      edge.v1 === renderedFaces[0]?.face.outerVertices[0] ||
      edge.v2 === renderedFaces[0]?.face.innerVertices[0];

    ctx.strokeStyle = isNearActive ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = isNearActive ? 2.0 : 1.2;
    ctx.beginPath();
    ctx.moveTo(v1.sx, v1.sy);
    ctx.lineTo(v2.sx, v2.sy);
    ctx.stroke();

    // Бегущие навигационные огни траволаторов вдоль ребер
    if (showBeacons) {
      const beaconPhase = ((timeMs * 0.0015 + edge.id * 0.17) % 1 + 1) % 1;
      const bx = v1.sx + (v2.sx - v1.sx) * beaconPhase;
      const by = v1.sy + (v2.sy - v1.sy) * beaconPhase;
      ctx.fillStyle = edge.id % 2 === 0 ? '#38bdf8' : '#34d399';
      ctx.beginPath();
      ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // ===========================================================================
  // 6. 24 ПРИЧАЛЬНЫХ УЗЛА (12 ЗЕНИТНЫХ ШПИЛЕЙ + 12 ВНУТРЕННИХ КВАНТОВЫХ СТАПЕЛЕЙ)
  // ===========================================================================
  for (const v of projectedVertices) {
    ctx.save();
    if (v.type === 'OUTER_ZENITH') {
      // 12 Внешних зенитных шпилей для стыковки тяжелых межзвездных кораблей
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(v.sx, v.sy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Выступающая антенна/шпиль наружу от центра
      const dirX = v.sx - cx;
      const dirY = v.sy - cy;
      const len = Math.hypot(dirX, dirY) || 1;
      const spireLen = 14;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(v.sx, v.sy);
      ctx.lineTo(v.sx + (dirX / len) * spireLen, v.sy + (dirY / len) * spireLen);
      ctx.stroke();

      // Сигнальный маячок на конце шпиля
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(v.sx + (dirX / len) * spireLen, v.sy + (dirY / len) * spireLen, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 12 Внутренних квантовых приёмных стапелей телепортации модулей
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(v.sx, v.sy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ===========================================================================
  // 7. СБОРОЧНЫЕ ЛАЗЕРНЫЕ ЛУЧИ (МОНТАЖ КОРПУСА КРЕЙСЕРОВ)
  // ===========================================================================
  if (showLasers) {
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;

    // Несколько лазерных лучей между шпилями и центром сборки
    for (let l = 0; l < 4; l++) {
      const idx = (l * 3 + Math.floor(timeMs * 0.001)) % 12;
      const v = projectedVertices[idx];
      const targetX = cx + Math.sin(timeMs * 0.002 + l) * baseRadius * 0.25;
      const targetY = cy + Math.cos(timeMs * 0.002 + l) * baseRadius * 0.25;

      ctx.beginPath();
      ctx.moveTo(v.sx, v.sy);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Точка контакта лазера (искра)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ===========================================================================
  // 8. ИНФОРМАЦИОННЫЙ HUD МАСШТАБА И СТАТУСА ВЕРФИ
  // ===========================================================================
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 1.0;

  // Рамка масштаба внизу слева
  const hudX = cx - baseRadius * 1.15;
  const hudY = cy + baseRadius * 0.75;
  const hudW = 320;
  const hudH = 56;

  ctx.fillRect(hudX, hudY, hudW, hudH);
  ctx.strokeRect(hudX, hudY, hudW, hudH);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('МЕГАВЕРФЬ «ТАЛИОН» · СРЕДНИЙ РОМБОТРИАКОНТАЭДР', hudX + 8, hudY + 16);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10px monospace';
  ctx.fillText('МАСШТАБ: 0.5R ПЛАНЕТЫ (D = 6 371 км / R = 3 185 км)', hudX + 8, hudY + 32);

  ctx.fillStyle = '#34d399';
  ctx.fillText('30 РОМБО-СТАПЕЛЕЙ · 60 РЕБЕР · 24 ПРИЧАЛЬНЫХ УЗЛА', hudX + 8, hudY + 46);

  ctx.restore();
}
