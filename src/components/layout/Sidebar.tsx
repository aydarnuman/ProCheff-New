"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
// Using simple text icons instead of heroicons

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    href: "/dashboard",
    label: "Kontrol Paneli",
    icon: "🏠"
  },
  {
    href: "/menu",
    label: "Menü Yönetimi",
    icon: "📋",
    subItems: [
      { href: "/menu/analyze", label: "Planlama & Maliyet", icon: "📊" },
      { href: "/menu", label: "Menü Planlama", icon: "🧮" },
      { href: "/menu/library", label: "Tarif Kütüphanesi", icon: "📚" }
    ]
  },
  {
    href: "/offer",
    label: "Fiyat Listesi",
    icon: "📋"
  },
  {
    href: "/admin",
    label: "Ayarlar",
    icon: "⚙️"
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isParentActive = (item: MenuItem) => {
    if (isActive(item.href)) return true;
    return item.subItems?.some(subItem => isActive(subItem.href)) || false;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);
    const parentActive = isParentActive(item);

    return (
      <div key={item.href}>
        {hasSubItems ? (
          <button
            onClick={() => toggleExpanded(item.href)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              parentActive 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span>{item.label}</span>
                  {hasSubItems && (
                    <span className="ml-auto text-sm">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  )}
                </>
              )}
            </div>
          </button>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              active 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        )}

        {hasSubItems && isExpanded && !isCollapsed && (
          <div className="mt-2 space-y-1">
            {item.subItems!.map(subItem => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } lg:translate-x-0 ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo & Collapse Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {!isCollapsed && (
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <span className="text-xl font-bold text-emerald-400">MaliyetŞef</span>
                  <div className="text-xs text-gray-400">v2.3.0</div>
                </div>
              </Link>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-lg">{isCollapsed ? '→' : '←'}</span>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            {!isCollapsed && (
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Açık Mod</span>
                </div>
                <div>Çıkış</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
