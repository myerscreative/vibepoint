'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, signOut } from '@/lib/supabase';
import { getMoodEntries } from '@/lib/db';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/');
        return;
      }

      setUser(currentUser);

      // Get entry count
      const { data } = await getMoodEntries();
      if (data) {
        setTotalEntries(data.length);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/data/export');

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the JSON blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibepoint-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== 'DELETE ALL MY DATA') {
      setDeleteError('Please type the confirmation phrase exactly as shown');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch('/api/data/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete data');
      }

      // Success - redirect to home
      alert('All your mood data has been permanently deleted.');
      router.push('/home');
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete data');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-lg text-gray-700">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and data</p>
          </div>
          <Link
            href="/home"
            className="text-blue-600 hover:text-blue-700 font-medium transition-smooth"
          >
            ← Back
          </Link>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900 font-medium">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total Mood Entries</p>
                <p className="text-gray-900 font-medium">{totalEntries}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-smooth"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Your Data</h2>

            <p className="text-gray-600 mb-4">
              Download all your mood entries as a JSON file. This includes your mood coordinates,
              responses, and sentiment analysis.
            </p>

            <button
              onClick={handleExport}
              disabled={isExporting || totalEntries === 0}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : '📥 Export All Data'}
            </button>

            {totalEntries === 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                No data to export yet. Start logging your moods!
              </p>
            )}
          </div>

          {/* Privacy & Data Deletion */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-4">Delete All Data</h2>

            <p className="text-red-800 mb-4">
              ⚠️ <strong>Warning:</strong> This action cannot be undone. All your mood entries will be
              permanently deleted from our servers.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-smooth"
              >
                Delete All My Data
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Type <code className="bg-red-100 px-2 py-1 rounded text-xs">DELETE ALL MY DATA</code> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Type here..."
                  />
                </div>

                {deleteError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {deleteError}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation('');
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-smooth disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || deleteConfirmation !== 'DELETE ALL MY DATA'}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Your Privacy Matters</h2>

            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>All your data is encrypted at rest</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>We never share your personal information with third parties</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>No tracking, no analytics, no ads</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>You can export or delete your data at any time</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>AI features (Pro) process data securely with no retention by AI provider</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
