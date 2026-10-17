import {ActiveProfileItem, WordTag} from '../types/app';

export const DEFAULT_CENTER = {
  lat: 50.4501,
  lng: 30.5234,
};

export const MAX_FREE_DESCRIPTION_WORDS = 6;
export const MAX_FREE_GROUP_SLOTS = 3;

export interface GroupCatalogInfo {
  tag: string;
  name: string;
  description: string;
  accessType: 'OPEN' | 'CLOSED';
  adminName: string;
  adminId?: string;
  adminLatOffset?: number;
  adminLngOffset?: number;
}

export const KNOWN_GROUPS_CATALOG: Record<string, GroupCatalogInfo> = {
  'go-45hgd78': {
    tag: 'GO-45Hgd78',
    name: 'Клуб любителей крафтового пива #1 (Подол)',
    description:
      'Встречи ценителей пенного, дегустация локальных пивоварен каждую пятницу и живое общение участников района.',
    accessType: 'OPEN',
    adminName: 'Максим (Создатель группы)',
    adminId: 'admin-go-45hgd78',
    adminLatOffset: 0.0042,
    adminLngOffset: 0.0051,
  },
  '45hgd78': {
    tag: 'GO-45Hgd78',
    name: 'Клуб любителей крафтового пива #1 (Подол)',
    description:
      'Встречи ценителей пенного, дегустация локальных пивоварен каждую пятницу и живое общение участников района.',
    accessType: 'OPEN',
    adminName: 'Максим (Создатель группы)',
    adminId: 'admin-go-45hgd78',
    adminLatOffset: 0.0042,
    adminLngOffset: 0.0051,
  },
  'go-88velo2': {
    tag: 'GO-88Velo2',
    name: 'Утренний велозаезд и бег в парке',
    description:
      'Открытая группа для совместных велотренировок и пробежек на свежем воздухе. Старт у центрального входа.',
    accessType: 'OPEN',
    adminName: 'Андрей (Создатель группы)',
    adminId: 'admin-go-88velo2',
    adminLatOffset: -0.0035,
    adminLngOffset: 0.0062,
  },
  '88velo2': {
    tag: 'GO-88Velo2',
    name: 'Утренний велозаезд и бег в парке',
    description:
      'Открытая группа для совместных велотренировок и пробежек на свежем воздухе. Старт у центрального входа.',
    accessType: 'OPEN',
    adminName: 'Андрей (Создатель группы)',
    adminId: 'admin-go-88velo2',
    adminLatOffset: -0.0035,
    adminLngOffset: 0.0062,
  },
  'gc-91tech7': {
    tag: 'GC-91Tech7',
    name: 'Закрытая группа: Семья / Бригада / Клуб (GC-91Tech7)',
    description:
      'Закрытая группа с доступом строго по одобрению создателя. Введите тег GC-91Tech7 в поиск, чтобы отправить запрос админу.',
    accessType: 'CLOSED',
    adminName: 'Виктор (Админ закрытой группы GC-91Tech7)',
    adminId: 'admin-gc-91tech7',
    adminLatOffset: 0.085, // Находится далеко за пределами радиуса (около 9.5 км), но ищется по тегу GC-91Tech7!
    adminLngOffset: 0.095,
  },
  '91tech7': {
    tag: 'GC-91Tech7',
    name: 'Закрытая группа: Семья / Бригада / Клуб (GC-91Tech7)',
    description:
      'Закрытая группа с доступом строго по одобрению создателя. Введите тег GC-91Tech7 в поиск, чтобы отправить запрос админу.',
    accessType: 'CLOSED',
    adminName: 'Виктор (Админ закрытой группы GC-91Tech7)',
    adminId: 'admin-gc-91tech7',
    adminLatOffset: 0.085,
    adminLngOffset: 0.095,
  },
};

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function limitWords(text: string, maxWords: number = MAX_FREE_DESCRIPTION_WORDS): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ');
}

// Безопасный список слов-исключений, которые содержат похожие буквосочетания, но НЕ являются матом
const SAFE_WORD_ROOTS = [
  'херсон',
  'херувим',
  'парикмахер',
  'шахер',
  'сукно',
  'сукна',
  'сукон',
  'сучок',
  'сучкам',
  'сучки',
  'сучков',
  'сучьев',
  'команд',
  'мандат',
  'мандар',
  'мансар',
  'манжет',
  'употребля',
  'потребля',
  'истребля',
  'оскорбля',
  'влюбля',
  'ослабля',
  'углубля',
  'скипидар',
  'психушк',
  'страху',
  'застраху',
  'перестраху',
  'хлеб',
  'учеб',
  'стеб',
  'греб',
  'треб',
  'неб',
  'мебел',
  'лебед',
  'щебен',
  'ребен',
  'дебет',
];

const PROFANITY_REGEXES: RegExp[] = [
  /(?:^|[а-яёіїєґa-z0-9_])(ху[йеёияюли]|хуй|ниху|наху|поху|оху|аху)/i,
  /(?:^|[а-яёіїєґa-z0-9_])(пизд|пізд)/i,
  /(?:^|[а-яёіїєґa-z0-9_])(еба[лтнтьк]|ёба|ебл[оауы]|ебн[уо]|ебис|ебут|выеб|заеб|отъеб|отьеб|проеб|разъеб|разьеб|съеб|сьеб|уеб|долбоеб|долбоёб)/i,
  /(?:^|[а-яёіїєґa-z0-9_])(бляд|блят|бляха|^бля$)/i,
  /^(сука|суки|сучка|сучки|сучара|сучары)$/i,
  /(?:^|[а-яёіїєґa-z0-9_])(пидор|пидар|педик|гандон|гондон|мудак|мудил|мудо|шлюх|проститут|шалав|залуп|дрочи|манда$|манды$|манде$|херн|херов|^хер$)/i,
  /^(fuck|fucking|fucker|bitch|shit|asshole|dick|cock|pussy|cunt|whore|slut)$/i,
];

// Мультиязычный стоп-список (RU / UA / EN / PL / DE), который легко расширять для любого языка с помощью ИИ
export const PROFANITY_STOP_LIST: Set<string> = new Set([
  // RU / UA
  'хуй',
  'хуя',
  'хуем',
  'хуи',
  'хуевый',
  'хуёвый',
  'хуево',
  'хуёво',
  'хуйня',
  'нахуй',
  'похуй',
  'нихуя',
  'охуеть',
  'ахуеть',
  'охуенно',
  'пизда',
  'пиздец',
  'пиздеть',
  'пиздюк',
  'пиздатый',
  'пізда',
  'піздець',
  'ебать',
  'ебал',
  'ебаный',
  'ёбаный',
  'ебанутый',
  'ебло',
  'еблан',
  'заебал',
  'заебали',
  'заебись',
  'выебать',
  'уебок',
  'уёбок',
  'долбоеб',
  'долбоёб',
  'бля',
  'блядь',
  'блять',
  'бляди',
  'блядство',
  'сука',
  'суки',
  'сучка',
  'сучара',
  'пидор',
  'пидорас',
  'пидар',
  'пидарас',
  'педик',
  'гандон',
  'гондон',
  'мудак',
  'мудаки',
  'мудила',
  'шлюха',
  'шлюхи',
  'шалава',
  'проститутка',
  'залупа',
  'дрочить',
  'хер',
  'херня',
  'нахер',
  'похер',
  // EN
  'fuck',
  'fucking',
  'fucker',
  'motherfucker',
  'bitch',
  'bitches',
  'shit',
  'bullshit',
  'asshole',
  'dick',
  'cock',
  'pussy',
  'cunt',
  'whore',
  'slut',
  'bastard',
  // PL / EU
  'kurwa',
  'chuj',
  'pizda',
  'jebac',
  'jebać',
  'pierdolic',
  'pierdolić',
  'scheisse',
  'scheiße',
  'fotze',
  'hurensohn',
]);

export function isProfaneWord(rawWord: string): boolean {
  const cleaned = rawWord
    .toLowerCase()
    .replace(/^[^а-яёіїєґa-z0-9äöüßąćęłńóśźż]+|[^а-яёіїєґa-z0-9äöüßąćęłńóśźż]+$/gi, '');
  if (cleaned.length < 3) return false;
  if (PROFANITY_STOP_LIST.has(cleaned)) return true;
  for (const safe of SAFE_WORD_ROOTS) {
    if (cleaned.includes(safe)) return false;
  }
  return PROFANITY_REGEXES.some((rx) => rx.test(cleaned));
}

/**
 * Автоматический цензор при трансляции: заменяет любые нецензурные слова на "..."
 */
export function censorProfanityText(text: string): string {
  if (!text) return text;
  return text.replace(/[А-Яа-яЁёІіЇїЄєҐґA-Za-z0-9_@-]+/g, (token) => {
    const prefix = token.startsWith('@') ? '@' : '';
    const core = prefix ? token.slice(1) : token;
    if (isProfaneWord(core)) {
      return '...';
    }
    return token;
  });
}

export function extractWordTags(text: string, disabledNormalized: Set<string> = new Set()): WordTag[] {
  const censoredText = censorProfanityText(text);
  const rawTokens = censoredText
    .split(/[\s,.;:!?()[\]"{}<>/\\|+=*~`]+/)
    .map((t) => t.trim().replace(/^@+/, ''))
    .filter((t) => t.length >= 2 && t !== '...');

  const seen = new Set<string>();
  const result: WordTag[] = [];

  for (const token of rawTokens) {
    const normalized = token.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push({
        word: token,
        normalized,
        active: !disabledNormalized.has(normalized),
      });
    }
  }
  return result;
}

export function getDistanceMeters(
  a: {lat: number; lng: number},
  b: {lat: number; lng: number}
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  return `${(meters / 1000).toFixed(2)} км`;
}

// AI Assistant semantic expansion dictionary for smart tag matching
export const AI_SEMANTIC_SYNONYMS: Record<string, string[]> = {
  продукты: [
    'молоко',
    'яйца',
    'свежие',
    'куриные',
    'творог',
    'сметана',
    'сыр',
    'мед',
    'домашнее',
    'ферма',
    'овощи',
    'мясо',
    'сало',
    'выпечка',
  ],
  молоко: ['яйца', 'свежие', 'творог', 'сметана', 'сыр', 'домашнее', 'корова', 'коза', 'продукты'],
  огород: [
    'вспашка',
    'огорода',
    'покос',
    'стрижка',
    'подсобные',
    'работы',
    'разнорабочий',
    'травы',
    'трава',
    'косить',
    'газон',
    'бурьян',
    'триммер',
    'бензокоса',
    'трактор',
    'мотоблок',
    'культиватор',
    'обрезание',
    'обрезка',
    'деревьев',
    'деревья',
    'сад',
    'спил',
    'дрова',
  ],
  подсобные: [
    'работы',
    'стрижка',
    'травы',
    'трава',
    'покос',
    'косить',
    'газон',
    'разнорабочий',
    'помощник',
    'копать',
    'огород',
    'уборка',
    'дрова',
  ],
  уроки: [
    'игры',
    'игра',
    'пианино',
    'фортепиано',
    'музыка',
    'репетитор',
    'учитель',
    'обучение',
    'дети',
    'школа',
  ],
  электрик: [
    'електрик',
    'дачный',
    'кооператив',
    'дача',
    'проводка',
    'розетка',
    'автомат',
    'свет',
    'счетчик',
    'генератор',
    'кабель',
    'электрика',
    'електрика',
  ],
  строитель: [
    'стройка',
    'ремонт',
    'мастер',
    'кладка',
    'крыша',
    'кровля',
    'бетон',
    'фундамент',
    'штукатурка',
    'забор',
    'сварка',
    'сварщик',
    'сантехник',
  ],
  рыбалка: [
    'охота',
    'клуб',
    'рыбак',
    'охотник',
    'ставок',
    'озеро',
    'река',
    'водохранилище',
    'днепровском',
    'днепр',
    'карп',
    'карась',
    'щука',
    'судак',
    'спиннинг',
    'удочка',
    'снасти',
    'прикормка',
    'лодка',
    'улов',
    'клев',
  ],
  кофе: ['кофейня', 'эспрессо', 'капучино', 'бариста', 'выпечка', 'кафе', 'завтрак'],
  ремонт: [
    'мастер',
    'сантехник',
    'электрик',
    'електрик',
    'строитель',
    'сервис',
    'починка',
    'инструмент',
    'шиномонтаж',
  ],
  авто: [
    'машина',
    'трактор',
    'прицеп',
    'микроавтобус',
    'перевозки',
    'пассажирские',
    'маршрутка',
    'такси',
    'аккумулятор',
    'прикурить',
    'колесо',
    'эвакуатор',
    'шиномонтаж',
    'водитель',
    'бензин',
  ],
  перевозки: [
    'пассажирские',
    'микроавтобус',
    'маршрутка',
    'автобус',
    'такси',
    'доставка',
    'груз',
    'водитель',
    'поездка',
  ],
  помощь: ['sos', 'срочно', 'врач', 'аптечка', 'прикурить', 'застрял', 'трос', 'буксир'],
  спорт: ['бег', 'велосипед', 'тренировка', 'турник', 'футбол', 'клуб', 'парк'],
  аренда: ['трактор', 'мотоблок', 'прицеп', 'инструмент', 'бензопила', 'триммер', 'прокат'],
};

export const INITIAL_PROFILES: Omit<ActiveProfileItem, 'position'>[] = [];

