"use client";

import { Heart, Home, PlusCircle, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import styles from './BottomBar.module.css';

const TABS = [
  { icon: Home,       href: '/',              label: 'Главная' },
  { icon: Heart,      href: '/swipe',          label: 'Свайпы' },
  { icon: PlusCircle, href: '/route/create',  label: 'Путеводитель' },
  { icon: User,       href: '/profile',       label: 'Профиль' },
];

export default function BottomBar() {
  const pathname = usePathname();
  const router   = useRouter();

  function handleNav(href) {
    if (href === '/profile' && !auth.isLoggedIn()) {
      router.push('/?login=1');
      return;
    }
    router.push(href);
  }

  return (
    <nav className={styles.bar} aria-label="Основная навигация">
      {TABS.map(({ icon: Icon, href, label }) => {
        const active =
          pathname === href ||
          (href === '/route/create' && pathname.startsWith('/route')) ||
          (href !== '/' && href !== '/route/create' && pathname.startsWith(href));
        return (
          <button
            key={href}
            className={`${styles.btn} ${active ? styles.btnActive : ''}`}
            onClick={() => handleNav(href)}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
            <span className={styles.btnLabel}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
