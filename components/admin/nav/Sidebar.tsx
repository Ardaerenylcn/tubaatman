"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Code2,
  CreditCard,
  Gem,
  Grid2x2,
  Home,
  Inbox,
  LayoutList,
  Megaphone,
  Monitor,
  Receipt,
  Settings,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { IconName, MenuGroup, SubItem } from "./menu";

const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  home: Home,
  sparkles: Sparkles,
  receipt: Receipt,
  gem: Gem,
  grid: Grid2x2,
  monitor: Monitor,
  megaphone: Megaphone,
  creditCard: CreditCard,
  inbox: Inbox,
  users: Users,
  chart: BarChart3,
  zap: Zap,
  settings: Settings,
  layout: LayoutList,
  code: Code2,
};

const STORAGE_KEY = "tubaatman.adminNav.open";

export function Sidebar({ groups }: { groups: MenuGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  // Açık bölümler oturumlar arası korunur
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOpen(JSON.parse(raw));
    } catch {
      /* yoksay */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(open));
    } catch {
      /* kota dolu olabilir */
    }
  }, [open, hydrated]);

  const isActive = (href?: string) =>
    Boolean(href) && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="tanav">
      <button type="button" className="tanav__fav" disabled>
        <Star className="tanav__fav-icon" />
        <span>Favoriler</span>
      </button>

      {groups.map((group, gi) => (
        <div key={group.id} className="tanav__group">
          {gi > 0 ? <hr className="tanav__rule" /> : null}

          <ul className="tanav__list">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const expandable = Boolean(item.children?.length);
              const expanded = Boolean(open[item.id]);
              const active =
                isActive(item.href) ||
                Boolean(item.children?.some((c) => isActive(c.href)));

              return (
                <li key={item.id}>
                  {expandable ? (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setOpen((p) => ({ ...p, [item.id]: !p[item.id] }))
                      }
                      className={`tanav__row${active ? " tanav__row--active" : ""}`}
                    >
                      <Icon className="tanav__icon" />
                      <span className="tanav__label">{item.label}</span>
                      {item.badge ? (
                        <span className="tanav__badge">{item.badge}</span>
                      ) : null}
                      <ChevronRight
                        className={`tanav__chev${expanded ? " tanav__chev--up" : ""}`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href ?? "#"}
                      aria-disabled={!item.href}
                      onClick={(e) => {
                        if (!item.href) e.preventDefault();
                      }}
                      className={`tanav__row${active ? " tanav__row--active" : ""}${
                        item.href ? "" : " tanav__row--todo"
                      }`}
                    >
                      <Icon className="tanav__icon" />
                      <span className="tanav__label">{item.label}</span>
                      {item.badge ? (
                        <span className="tanav__badge">{item.badge}</span>
                      ) : null}
                    </Link>
                  )}

                  {expandable && expanded ? (
                    <ul className="tanav__sub">
                      {item.children!.map((child) => (
                        <SubRow
                          key={child.label}
                          item={child}
                          parentId={item.id}
                          open={open}
                          setOpen={setOpen}
                          isActive={isActive}
                        />
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}


/** Alt madde. Kendi alt maddeleri varsa üçüncü seviye olarak açılır. */
function SubRow({
  item,
  parentId,
  open,
  setOpen,
  isActive,
}: {
  item: SubItem;
  parentId: string;
  open: Record<string, boolean>;
  setOpen: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isActive: (href?: string) => boolean;
}) {
  const key = `${parentId}:${item.label}`;
  const expandable = Boolean(item.children?.length);
  const expanded = Boolean(open[key]);
  const active =
    isActive(item.href) || Boolean(item.children?.some((c) => isActive(c.href)));

  if (expandable) {
    return (
      <li>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setOpen((p) => ({ ...p, [key]: !p[key] }))}
          className={`tanav__subrow tanav__subrow--parent${
            active ? " tanav__subrow--active" : ""
          }`}
        >
          <span>{item.label}</span>
          <ChevronRight
            className={`tanav__chev${expanded ? " tanav__chev--up" : ""}`}
          />
        </button>
        {expanded ? (
          <ul className="tanav__sub tanav__sub--deep">
            {item.children!.map((c) => (
              <li key={c.label}>
                {c.href ? (
                  <Link
                    href={c.href}
                    className={`tanav__subrow${
                      isActive(c.href) ? " tanav__subrow--active" : ""
                    }`}
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="tanav__subrow tanav__subrow--todo">
                    {c.label}
                    <em>yakında</em>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li>
      {item.href ? (
        <Link
          href={item.href}
          className={`tanav__subrow${active ? " tanav__subrow--active" : ""}`}
        >
          {item.label}
        </Link>
      ) : (
        <span className="tanav__subrow tanav__subrow--todo">
          {item.label}
          <em>yakında</em>
        </span>
      )}
    </li>
  );
}
