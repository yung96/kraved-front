"use client";

import { useState } from 'react';
import { Plus, Download, RefreshCw, Zap, MapPin, Star, ChevronRight, Route, Map, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

import Button       from '@/components/ui/Button/Button';
import Badge        from '@/components/ui/Badge/Badge';
import Input        from '@/components/ui/Input/Input';
import Select       from '@/components/ui/Select/Select';
import OtpInput     from '@/components/ui/OtpInput/OtpInput';
import Loader       from '@/components/ui/Loader/Loader';
import SkeletonCard from '@/components/ui/SkeletonCard/SkeletonCard';
import BottomBar    from '@/components/ui/BottomBar/BottomBar';
import { BrandMark } from '@/components/BrandMark/BrandMark';
import PlaceCard    from '@/components/PlaceCard/PlaceCard';
import AppImage     from '@/components/ui/AppImage/AppImage';
import { ToastProvider, useToast } from '@/components/ui/Toast/Toast';

import styles from './ui-kit.module.css';

/* ── Секция ── */
function Section({ title, desc, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {desc && <p className={styles.sectionDesc}>{desc}</p>}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

/* ── Строка-пример ── */
function Row({ label, children }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowContent}>{children}</div>
    </div>
  );
}

/* ── Toast-кнопки ── */
function ToastButtons() {
  const toast = useToast();
  return (
    <Row label="variants">
      <Button size="sm" onClick={() => toast({ message: 'Готово!', type: 'success' })}>Success</Button>
      <Button size="sm" onClick={() => toast({ message: 'Что-то пошло не так', type: 'error' })}>Error</Button>
      <Button size="sm" onClick={() => toast({ message: 'Информация', type: 'info' })}>Info</Button>
    </Row>
  );
}

/* ── Цветовые токены ── */
const COLOR_TOKENS = [
  { name: '--color-primary',          label: 'Primary',           hex: '#1a1a1a' },
  { name: '--color-primary-fg',       label: 'Primary FG',        hex: '#ffffff' },
  { name: '--color-accent',           label: 'Accent',            hex: '#0095f6' },
  { name: '--color-bg',               label: 'Background',        hex: '#ffffff' },
  { name: '--color-surface',          label: 'Surface',           hex: '#f7f7f7' },
  { name: '--color-border',           label: 'Border',            hex: '#e8e8e8' },
  { name: '--color-text',             label: 'Text',              hex: '#1a1a1a' },
  { name: '--color-text-secondary',   label: 'Text Secondary',    hex: '#8e8e8e' },
  { name: '--color-text-placeholder', label: 'Placeholder',       hex: '#c0c0c0' },
  { name: '--color-destructive',      label: 'Destructive',       hex: '#e03c3c' },
  { name: '--color-spring',           label: 'Spring',            hex: '#d4a8d4' },
  { name: '--color-summer',           label: 'Summer',            hex: '#f4c842' },
  { name: '--color-autumn',           label: 'Autumn',            hex: '#e59866' },
  { name: '--color-winter',           label: 'Winter',            hex: '#85c1e9' },
];

/* ── Map Pin Preview ── */
function MapPinDemo({ season, active, label }) {
  const colors = {
    spring: '#d4a8d4', summer: '#f4c842', autumn: '#e59866', winter: '#85c1e9', default: '#888',
  };
  const borderColor = colors[season] ?? colors.default;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: active ? '#1a1a1a' : '#fff',
        border: `2.5px solid ${active ? '#1a1a1a' : borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transform: active ? 'scale(1.3)' : 'scale(1)',
        transition: 'all 0.2s',
        fontSize: 11, fontWeight: 600,
        color: active ? '#fff' : '#1a1a1a',
        cursor: 'pointer',
      }}>
        {active ? '★' : '4.8'}
      </div>
      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  );
}

/* ── Mock data ── */
const MOCK_PLACE = {
  id: 1,
  photos: ['/park.jpeg'],
  title: 'Парк Галицкого',
  description: 'Один из красивейших парков России, расположенный в Краснодаре. Открыт в 2017 году.',
  season: 'spring',
  averageRating: 4.8,
  interestIds: [],
};

const MOCK_ROUTE = {
  id: '1',
  title: '🍷 Винный уикенд · 2 дня',
  narrative: 'Вы садитесь в машину — бак полный, маршрут готов. Первая остановка: виноградники Фанагории.',
  groupLabel: 'Пара',
  days: 2,
  places: [{ photos: ['/park.jpeg'], title: 'Парк Галицкого', season: 'summer' }],
};

export default function UiKitPage() {
  const [inputVal, setInputVal]       = useState('');
  const [selectVal, setSelectVal]     = useState('');
  const [loadingBtn, setLoadingBtn]   = useState(false);
  const [activeChip, setActiveChip]   = useState(null);
  const [mapTab, setMapTab]           = useState('places');

  function mockLoad() {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  }

  const INTEREST_CHIPS = [
    { id: 1, emoji: '🌿', name: 'Природа' },
    { id: 2, emoji: '🍷', name: 'Вино' },
    { id: 3, emoji: '🏛️', name: 'История' },
    { id: 4, emoji: '🍽️', name: 'Еда' },
    { id: 5, emoji: '🏖️', name: 'Пляж' },
  ];

  return (
    <ToastProvider>
      <div className={styles.page}>

        {/* ── Шапка ── */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.logoWrap}>
              <Zap size={20} strokeWidth={2.5} />
              <span className={styles.logo}>UI Kit</span>
            </div>
            <span className={styles.devBadge}>dev only</span>
          </div>
          <p className={styles.headerSub}>Витрина всех компонентов Kraeved. Только для разработки.</p>
        </header>

        <div className={styles.content}>

          {/* ── Figma Reference link ── */}
          <section className={styles.section}>
            <Link href="/screens" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', background: '#0e0e0e', borderRadius: 'var(--radius-lg)', padding: '16px 20px', color: '#fff' }}>
              <ImageIcon size={20} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600 }}>Figma Screens Reference</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>25 экранов из оригинального дизайна Archive (Copy)</p>
              </div>
              <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
            </Link>
          </section>

          {/* ── Colors ── */}
          <Section title="Цвета" desc="Все CSS-токены дизайн-системы">
            <div className={styles.colorGrid}>
              {COLOR_TOKENS.map(t => (
                <div key={t.name} className={styles.colorItem}>
                  <div
                    className={styles.colorSwatch}
                    style={{
                      background: t.hex,
                      border: t.hex === '#ffffff' ? '1px solid #e8e8e8' : 'none',
                    }}
                  />
                  <p className={styles.colorLabel}>{t.label}</p>
                  <p className={styles.colorHex}>{t.hex}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Typography ── */}
          <Section title="Типографика" desc="SF Pro Display, семь весов">
            <div className={styles.typeList}>
              {[
                { size: 28, weight: 700, label: 'Display / Hero Title' },
                { size: 22, weight: 700, label: 'Screen Title' },
                { size: 18, weight: 700, label: 'Section Title' },
                { size: 16, weight: 600, label: 'Card Title' },
                { size: 14, weight: 500, label: 'Body' },
                { size: 13, weight: 400, label: 'Caption' },
                { size: 11, weight: 600, label: 'Label / Overline' },
              ].map(t => (
                <div key={t.size} className={styles.typeRow}>
                  <span className={styles.typeSpec}>{t.size}px · {t.weight}</span>
                  <BrandMark
                    style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: 1.2, color: 'var(--color-text)' }}
                  />
                  <span className={styles.typeName}>{t.label}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Radius & Shadow ── */}
          <Section title="Радиусы и тени" desc="Пространственная система">
            <Row label="border-radius">
              <div className={styles.radiusRow}>
                {[
                  { name: 'sm', value: 8 },
                  { name: 'md', value: 12 },
                  { name: 'lg', value: 16 },
                  { name: 'xl', value: 22 },
                  { name: 'pill', value: 100 },
                ].map(r => (
                  <div key={r.name} className={styles.radiusItem}>
                    <div style={{
                      width: 48, height: 48,
                      background: 'var(--color-surface)',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: r.value,
                    }} />
                    <span className={styles.colorHex}>{r.name}<br/>{r.value}px</span>
                  </div>
                ))}
              </div>
            </Row>
          </Section>

          {/* ── Button ── */}
          <Section title="Button" desc="Варианты, размеры, состояния">
            <Row label="variant">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </Row>
            <Row label="size">
              <Button size="sm">Small</Button>
              <Button size="md">Default</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row label="with icon">
              <Button icon={<Plus size={16} />}>Создать</Button>
              <Button variant="secondary" icon={<Download size={16} />}>Скачать</Button>
              <Button variant="ghost" icon={<RefreshCw size={16} />}>Обновить</Button>
            </Row>
            <Row label="state">
              <Button disabled>Disabled</Button>
              <Button loading={loadingBtn} onClick={mockLoad}>
                {loadingBtn ? 'Loading…' : 'Нажми меня'}
              </Button>
            </Row>
          </Section>

          {/* ── Badge ── */}
          <Section title="Badge" desc="Метки, сезоны, теги">
            <Row label="variant">
              <Badge variant="default">Default</Badge>
              <Badge variant="tag">#природа</Badge>
            </Row>
            <Row label="season">
              <Badge variant="season" season="spring" />
              <Badge variant="season" season="summer" />
              <Badge variant="season" season="autumn" />
              <Badge variant="season" season="winter" />
            </Row>
          </Section>

          {/* ── Map Pin ── */}
          <Section title="Map Pin" desc="Маркер на карте — белый с сезонной рамкой, тёмный активный">
            <Row label="states">
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <MapPinDemo season="spring" label="spring" />
                <MapPinDemo season="summer" label="summer" />
                <MapPinDemo season="autumn" label="autumn" />
                <MapPinDemo season="winter" label="winter" />
                <MapPinDemo season="default" label="default" />
                <MapPinDemo season="summer" active label="active" />
              </div>
            </Row>
          </Section>

          {/* ── Category Chips ── */}
          <Section title="Category Chips" desc="Фильтр интересов на карте и в роутере">
            <Row label="interactive">
              <div className={styles.chipsScroll}>
                <button
                  className={`${styles.chip} ${activeChip === null ? styles.chipActive : ''}`}
                  onClick={() => setActiveChip(null)}
                >
                  Все
                </button>
                {INTEREST_CHIPS.map(c => (
                  <button
                    key={c.id}
                    className={`${styles.chip} ${activeChip === c.id ? styles.chipActive : ''}`}
                    onClick={() => setActiveChip(c.id)}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          {/* ── Map Tab Bar ── */}
          <Section title="Map Tab Bar" desc="Переключатель режимов карты: Места / Маршруты">
            <Row label="interactive">
              <div className={styles.tabBar}>
                <button
                  className={`${styles.tabBtn} ${mapTab === 'places' ? styles.tabBtnActive : ''}`}
                  onClick={() => setMapTab('places')}
                >
                  <Map size={14} /> Места
                </button>
                <button
                  className={`${styles.tabBtn} ${mapTab === 'routes' ? styles.tabBtnActive : ''}`}
                  onClick={() => setMapTab('routes')}
                >
                  <Route size={14} /> Маршруты
                </button>
              </div>
            </Row>
          </Section>

          {/* ── Horizontal Place Card ── */}
          <Section title="Place Card (map)" desc="Горизонтальная карточка на карте, 160px">
            <Row label="default / active">
              <div style={{ display: 'flex', gap: 10 }}>
                {/* default */}
                <div className={styles.mapCard}>
                  <div className={styles.mapCardPhoto}>
                    <AppImage src="/park.jpeg" alt="Place" fill unoptimized style={{ objectFit: 'cover' }} />
                    <span className={styles.mapCardDot} style={{ background: '#f4c842' }} />
                  </div>
                  <div className={styles.mapCardInfo}>
                    <p className={styles.mapCardTitle}>Парк Галицкого</p>
                    <span className={styles.mapCardRating}>
                      <Star size={10} fill="#f4c842" color="#f4c842" /> 4.8
                    </span>
                  </div>
                </div>
                {/* active */}
                <div className={`${styles.mapCard} ${styles.mapCardActive}`}>
                  <div className={styles.mapCardPhoto}>
                    <AppImage src="/park.jpeg" alt="Place" fill unoptimized style={{ objectFit: 'cover' }} />
                    <span className={styles.mapCardDot} style={{ background: '#d4a8d4' }} />
                  </div>
                  <div className={styles.mapCardInfo}>
                    <p className={styles.mapCardTitle}>Усадьба Некрасовых · active</p>
                    <span className={styles.mapCardRating}>
                      <Star size={10} fill="#f4c842" color="#f4c842" /> 4.5
                    </span>
                  </div>
                </div>
              </div>
            </Row>
          </Section>

          {/* ── Route / Day Plan Card ── */}
          <Section title="Route Card" desc="Editorial-карточка маршрута (Day Plan)">
            <div className={styles.routeCard}>
              <div className={styles.routeCardCover}>
                <AppImage src="/park.jpeg" alt="Route" fill unoptimized style={{ objectFit: 'cover' }} />
                <div className={styles.routeCardGradient} />
              </div>
              <div className={styles.routeCardBody}>
                <p className={styles.routeCardTitle}>{MOCK_ROUTE.title}</p>
                <p className={styles.routeCardMeta}>{MOCK_ROUTE.groupLabel} · {MOCK_ROUTE.days} дня</p>
                <p className={styles.routeCardNarrative}>{MOCK_ROUTE.narrative}</p>
                <button className={styles.routeCardBtn}>Открыть маршрут →</button>
              </div>
            </div>
          </Section>

          {/* ── Category Panel Header ── */}
          <Section title="Category Panel Header" desc="Заголовок панели при выборе категории на карте">
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderTitle}>
                <span>🍷</span>
                <span>Вино</span>
                <span className={styles.panelCount}>3</span>
              </div>
              <div className={styles.panelClose}>✕</div>
            </div>
          </Section>

          {/* ── Input ── */}
          <Section title="Input" desc="Текстовые поля">
            <Row label="default">
              <Input placeholder="Введите текст" value={inputVal} onChange={e => setInputVal(e.target.value)} style={{ width: '100%' }} />
            </Row>
            <Row label="с лейблом">
              <Input label="Имя" placeholder="Иван Иванов" style={{ width: '100%' }} />
            </Row>
            <Row label="телефон">
              <Input prefix="+7" placeholder="999 999-99-99" type="tel" inputMode="numeric" style={{ flex: 1 }} />
            </Row>
            <Row label="с ошибкой">
              <Input label="Email" placeholder="mail@example.com" error="Некорректный адрес" style={{ width: '100%' }} />
            </Row>
          </Section>

          {/* ── Select ── */}
          <Section title="Select" desc="Выпадающий список">
            <Row label="default">
              <Select
                label="Сезон"
                value={selectVal}
                onChange={e => setSelectVal(e.target.value)}
                options={[
                  { value: '',       label: 'Выберите...' },
                  { value: 'spring', label: '🌸 Весна' },
                  { value: 'summer', label: '☀️ Лето' },
                  { value: 'autumn', label: '🍂 Осень' },
                  { value: 'winter', label: '❄️ Зима' },
                ]}
                style={{ width: '100%' }}
              />
            </Row>
          </Section>

          {/* ── OTP Input ── */}
          <Section title="OTP Input" desc="Поле ввода кода из SMS">
            <Row label="4 цифры">
              <OtpInput length={4} onChange={v => console.log('otp:', v)} />
            </Row>
            <Row label="с ошибкой">
              <OtpInput length={4} error="Неверный код" />
            </Row>
          </Section>

          {/* ── Loader ── */}
          <Section title="Loader" desc="Спиннер загрузки">
            <Row label="size">
              <Loader size="sm" />
              <Loader size="md" />
              <Loader size="lg" />
            </Row>
            <Row label="light (на тёмном фоне)">
              <div style={{ background: '#1a1a1a', padding: 12, borderRadius: 12, display: 'flex', gap: 16 }}>
                <Loader size="sm" color="light" />
                <Loader size="md" color="light" />
                <Loader size="lg" color="light" />
              </div>
            </Row>
          </Section>

          {/* ── Toast ── */}
          <Section title="Toast" desc="Уведомления">
            <ToastButtons />
          </Section>

          {/* ── Skeleton ── */}
          <Section title="Skeleton Card" desc="Placeholder при загрузке">
            <SkeletonCard />
          </Section>

          {/* ── PlaceCard ── */}
          <Section title="Place Card (feed)" desc="Карточка места в ленте">
            <PlaceCard place={MOCK_PLACE} />
          </Section>

          {/* ── BottomBar ── */}
          <Section title="Bottom Bar" desc="Нижняя навигация (фиксированная на экране)">
            <Row label="preview (mock)">
              <div style={{ position: 'relative', height: 80, background: 'var(--color-surface)', borderRadius: 16, overflow: 'hidden', width: '100%' }}>
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)' }}>
                  <nav style={{ display: 'flex', gap: 4, background: '#1a1a1a', borderRadius: 100, padding: '10px 16px' }}>
                    {['🏠', '🗺️', '🧭', '🔖', '👤'].map((e, i) => (
                      <div key={i} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 18 }}>{e}</div>
                    ))}
                  </nav>
                </div>
              </div>
            </Row>
          </Section>

        </div>

        <BottomBar />
      </div>
    </ToastProvider>
  );
}
