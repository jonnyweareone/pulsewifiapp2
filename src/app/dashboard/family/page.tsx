'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
} from '@/components/ui';
import { AddChildModal } from '@/components/family/AddChildModal';
import { ChildCard } from '@/components/family/ChildCard';
import { QRProvisioningModal } from '@/components/family/QRProvisioningModal';
import {
  UserGroupIcon,
  PlusIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
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
  provisioning_token?: string;
}

interface Household {
  id: string;
  name: string;
  vlan_id: number;
}

export default function FamilyPage() {
  const { user, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [newChildData, setNewChildData] = useState<{
    username: string;
    password: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const supabase = createClient();

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      // Get household (if Home tier)
      const { data: householdData } = await supabase
        .from('households')
        .select('id, name, vlan_id')
        .eq('owner_profile_id', profile.id)
        .single();

      setHousehold(householdData as Household | null);

      // Get children managed by this user
      const { data: childrenData } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          declared_age,
          default_policy_profile,
          created_at,
          passpoint_credentials (
            id,
            username,
            is_active
          )
        `)
        .eq('managed_by_profile_id', profile.id)
        .eq('is_child', true)
        .order('created_at', { ascending: false });

      if (childrenData) {
        const formattedChildren = childrenData.map((child: any) => ({
          ...child,
          credential: child.passpoint_credentials?.[0] || null,
        }));
        setChildren(formattedChildren);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleAddChild = async (name: string, age: number) => {
    if (!profileId) return;

    try {
      const response = await fetch('/api/family/create-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: name,
          childAge: age,
          householdId: household?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create child profile');
      }

      const data = await response.json();

      // Store the new child data for QR display
      setNewChildData({
        username: data.username,
        password: data.password,
        token: data.provisioningToken,
      });

      // Refresh children list
      const supabase = createClient();
      const { data: newChild } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          declared_age,
          default_policy_profile,
          created_at,
          passpoint_credentials (
            id,
            username,
            is_active
          )
        `)
        .eq('id', data.profileId)
        .single();

      if (newChild) {
        const formattedChild = {
          ...newChild,
          credential: (newChild as any).passpoint_credentials?.[0] || null,
          provisioning_token: data.provisioningToken,
        };
        setChildren((prev) => [formattedChild as ChildProfile, ...prev]);
        setSelectedChild(formattedChild as ChildProfile);
      }

      setShowAddChild(false);
      setShowQR(true);
    } catch (error) {
      console.error('Error creating child:', error);
      alert('Failed to create child profile. Please try again.');
    }
  };

  const handleShowQR = async (child: ChildProfile) => {
    // Fetch or generate a new provisioning token
    try {
      const response = await fetch('/api/family/provisioning-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: child.credential?.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewChildData({
          username: child.credential?.username || '',
          password: data.password || '',
          token: data.token,
        });
        setSelectedChild(child);
        setShowQR(true);
      }
    } catch (error) {
      console.error('Error getting provisioning token:', error);
    }
  };

  const getPolicyBadgeColor = (policy: string) => {
    switch (policy) {
      case 'child-safe':
        return 'success';
      case 'teen':
        return 'warning';
      case 'young-adult':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPolicyLabel = (policy: string) => {
    switch (policy) {
      case 'child-safe':
        return 'Child Safe';
      case 'teen':
        return 'Teen';
      case 'young-adult':
        return 'Young Adult';
      default:
        return policy;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen flex flex-col bg-gray-900">
        <Navbar />

        <main
          className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8"
          style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <UserGroupIcon className="h-8 w-8 text-indigo-400" />
                  Family
                </h1>
                <p className="mt-2 text-gray-400">
                  Manage WiFi access for your children with age-appropriate safety settings.
                </p>
              </div>
              <Button onClick={() => setShowAddChild(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Child
              </Button>
            </div>

            {/* Info Alert */}
            <Alert variant="info" className="mb-8" title="How it works">
              <p>
                Create a profile for each child. They&apos;ll get their own WiFi credentials with
                age-appropriate content filtering. Scan the QR code on their device to set up
                automatic WiFi access.
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-green-400" />
                  <strong>Under 13:</strong> Strict filtering, safe search enforced
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-yellow-400" />
                  <strong>13-15:</strong> Moderate filtering, safe search enforced
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
                  <strong>16-17:</strong> Light filtering, safe search on by default
                </li>
              </ul>
            </Alert>

            {/* Household Info */}
            {household && (
              <Card className="mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Household</p>
                      <p className="text-white font-medium">{household.name}</p>
                    </div>
                    <Badge variant="success">Home Tier</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Children List */}
            {children.length > 0 ? (
              <div className="grid gap-4">
                {children.map((child) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onShowQR={() => handleShowQR(child)}
                    getPolicyBadgeColor={getPolicyBadgeColor}
                    getPolicyLabel={getPolicyLabel}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserGroupIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Children Added</h3>
                  <p className="text-gray-400 max-w-sm mx-auto mb-6">
                    Add your children to give them safe, filtered WiFi access with their own
                    credentials.
                  </p>
                  <Button onClick={() => setShowAddChild(true)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Your First Child
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />

        {/* Add Child Modal */}
        <AddChildModal
          isOpen={showAddChild}
          onClose={() => setShowAddChild(false)}
          onSubmit={handleAddChild}
        />

        {/* QR Provisioning Modal */}
        {selectedChild && newChildData && (
          <QRProvisioningModal
            isOpen={showQR}
            onClose={() => {
              setShowQR(false);
              setSelectedChild(null);
              setNewChildData(null);
            }}
            childName={selectedChild.display_name}
            username={newChildData.username}
            password={newChildData.password}
            provisioningToken={newChildData.token}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
