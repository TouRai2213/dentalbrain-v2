import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: '患者一覧', path: '/' },
  { icon: Calendar, label: '予約管理', path: '/appointments' },
];

export function Sidebar() {
  const location = useLocation();

  const MenuItem = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => (
    <Link
      to={path}
      className={`flex items-center px-4 py-2 rounded-lg text-sm ${
        location.pathname === path
          ? 'bg-teal-50 text-teal-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </Link>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="p-4">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white mr-2">
            DB
          </div>
          <span className="text-xl font-semibold">Dental Brain</span>
        </div>

        <div className="mb-8">
          <div className="px-4 py-2 text-sm font-medium text-gray-400">メインメニュー</div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <MenuItem key={item.path} {...item} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}