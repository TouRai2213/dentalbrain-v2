import React from 'react';

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function Tab({ label, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 ${
        isActive
          ? 'border-teal-600 text-teal-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

interface PatientTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PatientTabs({ activeTab, onTabChange }: PatientTabsProps) {
  const tabs = [
    { id: 'examination', label: '検査メニュー' },
    { id: 'history', label: '診療履歴' },
    { id: 'gallery', label: '画像ギャラリー' },
    { id: 'subchart', label: 'サブカルテ' }
  ];

  return (
    <nav className="-mb-px flex space-x-8">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </nav>
  );
}