import React, { useEffect } from 'react';

export interface ObjectLandingData {
  id: string;
  name: string;
  cleanName: string;
  kind: 'PLANET' | 'STATION' | 'PLANETOID' | 'MOON' | 'ASTEROID' | 'STARGATE';
  color: string;
  constellationName: string;
  starName: string;
  planetName: string;
  satelliteName: string;
  asteroidName: string;
  distanceUnits: number; // 10 units
  ownerName: string; // 'не занят' по умолчанию
  credits?: number;
  description?: string;
}

interface ObjectLandingModalProps {
  isOpen: boolean;
  landingData: ObjectLandingData | null;
  onClose: () => void;
  onUnfixOrbitAndManual: () => void;
  onOpenShipyard?: () => void;
  onOpenMarket?: () => void;
  onOpenBank?: () => void;
}

export const ObjectLandingModal: React.FC<ObjectLandingModalProps> = ({
  isOpen,
  landingData,
  onClose,
  onUnfixOrbitAndManual,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !landingData) return null;

  const owner = landingData.ownerName && landingData.ownerName.trim() !== ''
    ? landingData.ownerName
    : 'не занят';

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen bg-white text-slate-900 font-sans flex flex-col justify-between p-6 sm:p-10 md:p-16 overflow-y-auto select-text"
      style={{ margin: 0 }}
    >
      {/* ВЕРХНЯЯ ПАНЕЛЬ С КНОПКОЙ ВЫХОД */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          ЛЕНДИНГ ОБЪЕКТА · ЧИСТЫЙ ЛИСТ
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onUnfixOrbitAndManual}
            className="px-4 py-2 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-black transition-colors"
            title="Открепиться от стационарной орбиты и перейти в ручное управление полётом (СКМ)"
          >
            Снять с орбиты (СКМ)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded shadow transition-all flex items-center gap-2 cursor-pointer"
            title="Выход из лендинга на стационарную орбиту (ENTER / ESC)"
          >
            <span>ВЫХОД</span>
            <kbd className="px-1.5 py-0.5 text-[11px] bg-slate-700 text-white rounded">ENTER</kbd>
          </button>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ (ЧИСТЫЙ ЛИСТ: ИМЯ ОБЪЕКТА, ПРИНАДЛЕЖНОСТЬ, ВЛАДЕЛЕЦ) */}
      <main className="my-auto py-8 max-w-3xl w-full mx-auto">
        {/* ИМЯ ОБЪЕКТА */}
        <section className="mb-10">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Имя объекта
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950">
            {landingData.name || landingData.cleanName}
          </h1>
        </section>

        {/* ПРИНАДЛЕЖНОСТЬ */}
        <section className="mb-10 border-t border-slate-100 pt-6">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">
            Принадлежность
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <dt className="text-xs text-slate-500 font-medium">Созвездие</dt>
              <dd className="text-lg font-bold text-slate-900 mt-1">
                {landingData.constellationName || '—'}
              </dd>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <dt className="text-xs text-slate-500 font-medium">Звезда</dt>
              <dd className="text-lg font-bold text-slate-900 mt-1">
                {landingData.starName || '—'}
              </dd>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <dt className="text-xs text-slate-500 font-medium">Планета</dt>
              <dd className="text-lg font-bold text-slate-900 mt-1">
                {landingData.planetName || '—'}
              </dd>
            </div>
          </dl>
        </section>

        {/* ВЛАДЕЛЕЦ */}
        <section className="border-t border-slate-100 pt-6">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Владелец
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xl font-bold text-slate-900">
              {owner}
            </span>
            {owner === 'не занят' && (
              <span className="text-xs px-2.5 py-1 bg-slate-200 text-slate-700 rounded font-medium">
                По умолчанию
              </span>
            )}
          </div>
        </section>
      </main>

      {/* НИЖНИЙ ПОДВАЛ */}
      <footer className="border-t border-slate-200 pt-5 flex items-center justify-between text-xs text-slate-500">
        <div>
          Стационарная орбита · Высота {landingData.distanceUnits} ед.
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-900 font-semibold hover:underline"
        >
          Закрыть лендинг (Выход)
        </button>
      </footer>
    </div>
  );
};
