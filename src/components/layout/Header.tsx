import React from 'react';
import { Search, Bell, HelpCircle, Settings, ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center">
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop"
              alt="User"
              className="w-8 h-8 rounded-full"
            />
            <ChevronDown className="w-4 h-4 text-gray-600 ml-2" />
          </div>
        </div>
      </div>
    </header>
  );
}