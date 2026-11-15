import { useSearchParams } from 'react-router-dom';
import { Buildings, Key, QrCode, SlidersHorizontal, Users, User } from '@phosphor-icons/react';
import { PageShell } from '@/components/dashboard/PageShell';
import { ProfileTab } from '@/components/dashboard/settings/ProfileTab';
import { BranchesTab } from '@/components/dashboard/settings/BranchesTab';
import { TeamTab } from '@/components/dashboard/settings/TeamTab';
import { JoinCodeTab } from '@/components/dashboard/settings/JoinCodeTab';
import { DispatchPolicyTab } from '@/components/dashboard/settings/DispatchPolicyTab';
import { ApiKeysTab } from '@/components/dashboard/settings/ApiKeysTab';

type TabKey = 'profile' | 'branches' | 'team' | 'join-code' | 'policy' | 'api-keys';

interface TabItem {
  key: TabKey;
  label: string;
  icon: typeof Buildings;
}

const TABS: TabItem[] = [
  { key: 'profile', label: 'My Profile', icon: User },
  { key: 'branches', label: 'Depots', icon: Buildings },
  { key: 'team', label: 'Team & Access', icon: Users },
  { key: 'join-code', label: 'Join Code', icon: QrCode },
  { key: 'policy', label: 'Dispatch Policy', icon: SlidersHorizontal },
  { key: 'api-keys', label: 'API Keys', icon: Key },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const currentTab = (TABS.some((t) => t.key === params.get('tab'))
    ? (params.get('tab') as TabKey)
    : 'profile');

  const selectTab = (tab: TabKey) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <PageShell title="Organization Settings">
      <div className="flex flex-col gap-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-surface-5 pb-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = currentTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectTab(key)}
                className={`body-5 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-surface-3 font-medium text-fg shadow-sm'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {currentTab === 'profile' && <ProfileTab />}
          {currentTab === 'branches' && <BranchesTab />}
          {currentTab === 'team' && <TeamTab />}
          {currentTab === 'join-code' && <JoinCodeTab />}
          {currentTab === 'policy' && <DispatchPolicyTab />}
          {currentTab === 'api-keys' && <ApiKeysTab />}
        </div>
      </div>
    </PageShell>
  );
}
