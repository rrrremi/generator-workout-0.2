"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    metricSystem: 'metric', // metric or imperial
    language: 'english',
    privacySettings: {
      shareWorkoutData: false,
      allowAnalytics: true
    }
  });
  
  const [saved, setSaved] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    setSaved(false);
  };
  
  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [name]: checked
      }
    }));
    
    setSaved(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you would save the settings to a backend
    console.log('Saving settings:', settings);
    
    // Show saved confirmation
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  
  return (
    <section className="mx-auto w-full max-w-3xl px-2 pb-10">
      <div className="mb-2">
        <Link href="/protected/profile">
          <button className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-xl transition-colors hover:bg-white/10">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-2xl">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 opacity-50 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 opacity-50 blur-2xl" />

          <div className="relative">
            <h1 className="text-xl tracking-tight text-white">Settings</h1>
            <p className="mt-0.5 text-xs text-white/70">
              Adjust your preferences, display options, and privacy controls.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-white/90">General</h2>
              <p className="text-xs text-white/60">Manage theme, notifications, and measurement preferences.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/90">Dark Mode</p>
                  <p className="text-xs text-white/60">Enable the darker interface styling.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-fuchsia-500/70 peer-checked:after:translate-x-full peer-checked:after:border-transparent after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/30 after:bg-white after:transition-transform after:content-['']" />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/90">Notifications</p>
                  <p className="text-xs text-white/60">Receive alerts about workout updates.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={settings.notifications}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-fuchsia-500/70 peer-checked:after:translate-x-full peer-checked:after:border-transparent after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/30 after:bg-white after:transition-transform after:content-['']" />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="metricSystem" className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                    Measurement System
                  </label>
                  <select
                    id="metricSystem"
                    name="metricSystem"
                    value={settings.metricSystem}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-transparent bg-white/5 px-3 py-2 text-sm text-white/90 transition focus:outline-none focus:ring-1 focus:ring-fuchsia-500/60"
                  >
                    <option value="metric">Metric (kg, km)</option>
                    <option value="imperial">Imperial (lbs, miles)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="language" className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-transparent bg-white/5 px-3 py-2 text-sm text-white/90 transition focus:outline-none focus:ring-1 focus:ring-fuchsia-500/60"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="german">German</option>
                    <option value="french">French</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-white/90">Privacy</h2>
              <p className="text-xs text-white/60">Control how your workout data is shared and analysed.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/90">Share Workout Data</p>
                  <p className="text-xs text-white/60">Allow anonymous sharing to improve recommendations.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="shareWorkoutData"
                    checked={settings.privacySettings.shareWorkoutData}
                    onChange={handlePrivacyChange}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-fuchsia-500/70 peer-checked:after:translate-x-full peer-checked:after:border-transparent after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/30 after:bg-white after:transition-transform after:content-['']" />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/90">Allow Analytics</p>
                  <p className="text-xs text-white/60">Help us understand usage trends to improve the app.</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    name="allowAnalytics"
                    checked={settings.privacySettings.allowAnalytics}
                    onChange={handlePrivacyChange}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-fuchsia-500/70 peer-checked:after:translate-x-full peer-checked:after:border-transparent after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/30 after:bg-white after:transition-transform after:content-['']" />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-transparent bg-white/5 p-3 backdrop-blur-xl">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-white/90">Account Actions</h2>
              <p className="text-xs text-white/60">Quick tools for managing your account data.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/90 transition-colors hover:bg-white/20"
              >
                Export Your Data
              </button>
              <button
                type="button"
                className="rounded-lg border border-transparent bg-red-500/80 px-3 py-2 text-xs text-white transition-colors hover:bg-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-3 py-1.5 text-xs text-white transition hover:brightness-110"
            >
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </button>
            {saved && <span className="text-xs text-emerald-300">Settings saved successfully!</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
