'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, age: number) => Promise<void>;
}

export function AddChildModal({ isOpen, onClose, onSubmit }: AddChildModalProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    if (age === '' || age < 1 || age > 17) {
      setError('Please enter a valid age (1-17)');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name.trim(), age);
      setName('');
      setAge('');
    } catch (err) {
      setError('Failed to create child profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPolicyPreview = (age: number) => {
    if (age < 13) {
      return {
        policy: 'Child Safe',
        color: 'text-green-400',
        description: 'Maximum protection with strict filtering and enforced safe search',
      };
    } else if (age <= 15) {
      return {
        policy: 'Teen',
        color: 'text-yellow-400',
        description: 'Balanced protection with adult content blocked and safe search enforced',
      };
    } else {
      return {
        policy: 'Young Adult',
        color: 'text-blue-400',
        description: 'Light protection with adult content blocked',
      };
    }
  };

  const policyPreview = age !== '' ? getPolicyPreview(age) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <Card className="relative w-full max-w-md z-10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5 text-indigo-400" />
              Add Child
            </CardTitle>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Child&apos;s Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Emma"
                className="w-full"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                This is just for you to identify them - they won&apos;t see it
              </p>
            </div>

            {/* Age Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
              <Input
                type="number"
                min={1}
                max={17}
                value={age}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Enter age"
                className="w-full"
              />
            </div>

            {/* Policy Preview */}
            {policyPreview && (
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Safety Level</p>
                <p className={`font-semibold ${policyPreview.color}`}>{policyPreview.policy}</p>
                <p className="text-xs text-gray-500 mt-1">{policyPreview.description}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                    Creating...
                  </span>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
