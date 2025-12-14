'use client';

import { Card, CardContent, Badge, Button } from '@/components/ui';
import {
  UserCircleIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ChildProfile {
  id: string;
  display_name: string;
  declared_age: number;
  default_policy_profile: string;
  created_at: string;
  credential?: {
    id: string;
    username: string;
    is_active: boolean;
  };
}

interface ChildCardProps {
  child: ChildProfile;
  onShowQR: () => void;
  getPolicyBadgeColor: (policy: string) => string;
  getPolicyLabel: (policy: string) => string;
}

export function ChildCard({
  child,
  onShowQR,
  getPolicyBadgeColor,
  getPolicyLabel,
}: ChildCardProps) {
  const getAgeGroup = (age: number) => {
    if (age < 13) return 'Child';
    if (age <= 15) return 'Teen';
    return 'Young Adult';
  };

  const getFilteringDescription = (policy: string) => {
    switch (policy) {
      case 'child-safe':
        return 'Adult content blocked, safe search enforced, social media restricted';
      case 'teen':
        return 'Adult content blocked, safe search enforced';
      case 'young-adult':
        return 'Adult content blocked, safe search on by default';
      default:
        return 'Standard filtering';
    }
  };

  return (
    <Card className="hover:bg-white/5 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          {/* Child Info */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-full">
              <UserCircleIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{child.display_name}</h3>
              <p className="text-sm text-gray-400">
                {child.declared_age} years old · {getAgeGroup(child.declared_age)}
              </p>

              {/* Policy Badge */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getPolicyBadgeColor(child.default_policy_profile) as any}>
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  {getPolicyLabel(child.default_policy_profile)}
                </Badge>
                {child.credential?.is_active && (
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                )}
              </div>

              {/* Filtering Info */}
              <p className="text-xs text-gray-500 mt-2">
                {getFilteringDescription(child.default_policy_profile)}
              </p>

              {/* Credential Info */}
              {child.credential && (
                <p className="text-xs text-gray-500 mt-1">
                  WiFi Username:{' '}
                  <span className="font-mono text-gray-400">{child.credential.username}</span>
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={onShowQR}>
              <QrCodeIcon className="h-4 w-4 mr-2" />
              Setup Device
            </Button>
          </div>
        </div>

        {/* Created At */}
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-white/5">
          <ClockIcon className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-500">
            Added {new Date(child.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
