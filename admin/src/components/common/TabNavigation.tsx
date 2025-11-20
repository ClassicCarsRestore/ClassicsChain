interface TabButton {
  id: string;
  label: string;
  visible?: boolean;
}

interface TabNavigationProps {
  tabs: TabButton[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const visibleTabs = tabs.filter((tab) => tab.visible !== false);

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex gap-6">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
