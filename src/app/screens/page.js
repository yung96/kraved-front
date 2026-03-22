"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, X, ExternalLink } from 'lucide-react';

const SCREENS = [
  { src: '/screens/001_Frame 1674.png',              label: 'Frame 1674',             group: 'Прочее' },
  { src: '/screens/002_City Summary _ 1440px.png',   label: 'City Summary · 1440px',  group: 'Лендинг' },
  { src: '/screens/003_City Landing.png',            label: 'City Landing',           group: 'Лендинг' },
  { src: '/screens/004_Group 1666.png',              label: 'Group 1666',             group: 'Прочее' },
  { src: '/screens/005_You need to know.png',        label: 'You Need to Know',       group: 'Детали' },
  { src: '/screens/006_Frame 1668.png',              label: 'Frame 1668',             group: 'Прочее' },
  { src: '/screens/007_Components.png',              label: 'Components',             group: 'Дизайн-система' },
  { src: '/screens/008_Frame 1674.png',              label: 'Frame 1674 (2)',         group: 'Прочее' },
  { src: '/screens/009_Day Plan Map Landing.png',    label: 'Day Plan Map Landing',   group: 'Маршруты' },
  { src: '/screens/010_City Summary _ 1440px.png',   label: 'City Summary v2',        group: 'Лендинг' },
  { src: '/screens/011_City Landing.png',            label: 'City Landing v2',        group: 'Лендинг' },
  { src: '/screens/012_Login _ 1440px.png',          label: 'Login · 1440px',         group: 'Авторизация' },
  { src: '/screens/013_Place Card.png',              label: 'Place Card',             group: 'Дизайн-система' },
  { src: '/screens/014_Overview.png',                label: 'Overview',               group: 'Карта' },
  { src: '/screens/015_Selected Plan.png',           label: 'Selected Plan',          group: 'Маршруты' },
  { src: '/screens/016_Selected District.png',       label: 'Selected District',      group: 'Карта' },
  { src: '/screens/017_Selected District-1.png',     label: 'Selected District v2',   group: 'Карта' },
  { src: '/screens/018_Current Location _ 1440px.png', label: 'Current Location · 1440px', group: 'Карта' },
  { src: '/screens/019_Overview.png',                label: 'Overview v2',            group: 'Карта' },
  { src: '/screens/020_Selected Plan.png',           label: 'Selected Plan v2',       group: 'Маршруты' },
  { src: '/screens/021_Selected District.png',       label: 'Selected District v3',   group: 'Карта' },
  { src: '/screens/022_Selected District-1.png',     label: 'Selected District v4',   group: 'Карта' },
  { src: '/screens/023_Current Location _ 1440px.png', label: 'Current Location v2',  group: 'Карта' },
  { src: "/screens/024_Plan's Card.png",             label: "Plan's Card",            group: 'Маршруты' },
  { src: '/screens/025_London Day Plan -1440px.png', label: 'London Day Plan · 1440px', group: 'Маршруты' },
  { src: '/screens/026_Group 2.png',                 label: 'Group 2',                group: 'Прочее' },
  { src: '/screens/027_Frame 1684.jpg',              label: 'Frame 1684',             group: 'Прочее' },
  { src: '/screens/028_01.jpg',                      label: 'Promo 01',               group: 'Промо' },
  { src: '/screens/029_03.jpg',                      label: 'Promo 03',               group: 'Промо' },
  { src: '/screens/030_02.jpg',                      label: 'Promo 02',               group: 'Промо' },
  { src: '/screens/031_Frame 1683.jpg',              label: 'Frame 1683',             group: 'Прочее' },
  { src: "/screens/032_Plan's Card-1.png",           label: "Plan's Card v2",         group: 'Маршруты' },
  { src: '/screens/033_04.png',                      label: 'Promo 04',               group: 'Промо' },
  { src: '/screens/034_City Card-1.png',             label: 'City Card',              group: 'Дизайн-система' },
  { src: '/screens/035_City Card 4.png',             label: 'City Card 4',            group: 'Дизайн-система' },
  { src: '/screens/036_City Card 5.png',             label: 'City Card 5',            group: 'Дизайн-система' },
  { src: '/screens/037_City Summary _ 1440px.png',   label: 'City Summary v3',        group: 'Лендинг' },
  { src: '/screens/038_City Card 2.png',             label: 'City Card 2',            group: 'Дизайн-система' },
  { src: '/screens/039_City Card 3.png',             label: 'City Card 3',            group: 'Дизайн-система' },
  { src: '/screens/040_Main Page _ 393px.png',       label: 'Main Page · 393px',      group: 'Лендинг' },
  { src: '/screens/041_Opened Map _ 393px.png',      label: 'Opened Map · 393px',     group: 'Карта' },
  { src: '/screens/042_City Card.png',               label: 'City Card 6',            group: 'Дизайн-система' },
  { src: '/screens/043_5.jpg',                       label: 'Promo 05',               group: 'Промо' },
  { src: '/screens/044_Day Plan _ 393px.png',        label: 'Day Plan · 393px',       group: 'Маршруты' },
  { src: '/screens/045_Search.png',                  label: 'Search States',          group: 'Поиск' },
  { src: '/screens/046_Change The User Flow.png',    label: 'User Flow',              group: 'Прочее' },
  { src: '/screens/047_Spoiler on The Main Page.png', label: 'Spoiler on Main',       group: 'Лендинг' },
  { src: '/screens/048_Desktop.png',                 label: 'Desktop Layout',         group: 'Прочее' },
  { src: '/screens/049_Mobile.png',                  label: 'Mobile Flows',           group: 'Прочее' },
];

const GROUPS = [...new Set(SCREENS.map(s => s.group))];

export default function ScreensPage() {
  const [lightbox, setLightbox] = useState(null);

  return (
    <div style={{ minHeight: '100dvh', background: '#0e0e0e', color: '#fff', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/ui-kit" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> UI Kit
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Screens Reference</span>
      </div>

      <div style={{ padding: '32px 20px 120px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Figma Screens</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>
          {SCREENS.length} экранов — эталон для вёрстки 1:1
        </p>

        {GROUPS.map(group => {
          const items = SCREENS.filter(s => s.group === group);
          return (
            <div key={group} style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                {group} <span style={{ color: 'rgba(255,255,255,0.18)' }}>({items.length})</span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {items.map(item => (
                  <button
                    key={item.src}
                    onClick={() => setLightbox(item)}
                    style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#111' }}>
                      <img src={item.src} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    </div>
                    <div style={{ padding: '8px 10px 10px' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>{item.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: -12, right: -12, zIndex: 10, width: 30, height: 30, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} color="#000" />
            </button>
            <div style={{ maxHeight: '80vh', overflow: 'auto', borderRadius: 12 }}>
              <img src={lightbox.src} alt={lightbox.label} style={{ display: 'block', maxWidth: '100%', borderRadius: 12 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{lightbox.label}</p>
              <a href={lightbox.src} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none' }}>
                <ExternalLink size={12} /> открыть
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
