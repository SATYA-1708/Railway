import React, { useState } from 'react';
import { Bell, Globe, HelpCircle, LogOut, ChevronRight, User, Mail, Phone, MapPin, Shield, Palette } from 'lucide-react';
import Card from './ui/Card';
import Badge from './ui/Badge';

const ICON_COLOR = {
  emerald: 'text-[#0d7a56] bg-[#e6f5ec] border-[#bfe3cf]',
  cyan: 'text-[#0b7da8] bg-[#e9f7fb] border-[#bee2ef]',
  blue: 'text-[#1b56a0] bg-[#e9f1fa] border-[#c7dbf1]',
  amber: 'text-[#9a6b0a] bg-[#fdf3dd] border-[#efd9a8]',
  purple: 'text-[#6d28d9] bg-[#f3edfb] border-[#ddcbf5]',
  slate: 'text-[#51678a] bg-[#eef2f7] border-[#d9e2ed]',
};

export default function Profile({ onLogout, savedJourneyCount = 0 }) {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Name', value: 'Railway Passenger', color: 'emerald' },
        { icon: Mail, label: 'Email', value: 'demo.passenger@railflow.example', color: 'cyan' },
        { icon: Phone, label: 'Phone', value: '+91 00000 00000', color: 'blue' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Push Notifications', toggle: true, value: notifications, onToggle: () => setNotifications(!notifications), color: 'amber' },
        { icon: Palette, label: 'Theme', value: theme === 'dark' ? 'Dark Mode' : 'Light Mode', toggle: true, value2: theme === 'dark', onToggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'), color: 'purple' },
        { icon: Globe, label: 'Language', value: language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Telugu', color: 'cyan' },
      ]
    },
    {
      title: 'Data & Support',
      items: [
        { icon: MapPin, label: 'Saved Journeys', value: `${savedJourneyCount} trains`, color: 'emerald' },
        { icon: Shield, label: 'Privacy Policy', color: 'slate' },
        { icon: HelpCircle, label: 'Help & Support', color: 'slate' },
      ]
    },
  ];

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'te', label: 'Telugu' },
  ];

  return (
    <div className="portal-page mx-auto space-y-6" style={{ maxWidth: '42rem' }}>
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1b56a0] flex items-center justify-center text-white text-2xl font-bold shadow-md">
          RP
        </div>
        <div>
          <h1 className="portal-head-title">Railway Passenger</h1>
          <p className="text-xs text-[#6b7f99]">demo.passenger@railflow.example</p>
          <Badge light variant="success" className="mt-1">Demo Account — Sample Data</Badge>
        </div>
      </div>

      {/* Settings Sections */}
      {sections.map((section) => (
        <Card key={section.title} light>
          <h3 className="portal-label mb-3">{section.title.toUpperCase()}</h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-[#f4f7fb] transition-colors border border-transparent hover:border-[#d9e2ed]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg border ${ICON_COLOR[item.color] || ICON_COLOR.slate} flex items-center justify-center`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-[#14253d]">{item.label}</span>
                </div>
                {item.toggle ? (
                  <button onClick={item.onToggle}
                    className={`relative w-10 h-5 rounded-full transition-colors ${item.value ? 'bg-[#0d7a56]' : 'bg-[#c9d6e5]'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6b7f99]">{item.value || ''}</span>
                    <ChevronRight className="w-4 h-4 text-[#93a6bf]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Language Selector */}
      <Card light>
        <h3 className="portal-label mb-3">SELECT LANGUAGE</h3>
        <div className="grid grid-cols-3 gap-2">
          {languages.map(lang => (
            <button key={lang.code} onClick={() => setLanguage(lang.code)}
              className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${language === lang.code ? 'bg-[#1b56a0] text-white border-[#1b56a0] shadow-sm' : 'bg-[#f4f7fb] border-[#d9e2ed] text-[#6b7f99] hover:text-[#14253d] hover:border-[#a9c6eb]'}`}>
              {lang.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Logout */}
      <button onClick={onLogout}
        className="w-full py-3 rounded-xl bg-[#fdeceb] border border-[#f2c6c4] text-[#b02a2a] font-bold text-sm hover:bg-[#b02a2a] hover:text-white transition-all flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Logout
      </button>

      <p className="text-center text-[11px] text-[#93a6bf]">
        RailFlow AI &bull; Smart India Hackathon 2026 &bull; PS 26028
      </p>
    </div>
  );
}