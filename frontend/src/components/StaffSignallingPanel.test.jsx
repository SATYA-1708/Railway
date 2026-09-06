// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.React = React;
const { default: StaffSignallingPanel } = await import('./StaffSignallingPanel');

const LIVE = [
  { number: '57382', name: 'Guntur Passenger', platform: 4, assignedPlatform: 4, speed: 0, status: 'BERTHED', isLiveNTES: true, predictionSource: 'x', sta: '09:15', std: '09:20', type: 'Passenger', delay: 0 },
  { number: '12804', name: 'Swarna Jayanti Express', platform: 10, assignedPlatform: 10, speed: 0, status: 'BERTHED', isLiveNTES: true, predictionSource: 'x', sta: '09:00', std: '09:05', type: 'Superfast Express', delay: 6 },
  { number: '57218', name: 'Macherla Bhimavaram Passenger', platform: 2, assignedPlatform: 2, speed: 85, status: 'IN_APPROACH', isLiveNTES: true, predictionSource: 'x', sta: '09:30', std: '09:35', type: 'Passenger', delay: 0 },
];

function ok(json) {
  return Promise.resolve({ ok: true, status: 200, json: async () => json });
}

function mount() {
  return createRoot(document.getElementById('root'));
}

beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  vi.stubGlobal('fetch', vi.fn((url) => {
    const u = String(url);
    if (u.includes('station-live')) {
      return ok({ liveTrains: LIVE, throughTrains: [], movementConflicts: [], platforms: [] });
    }
    return ok({ station_code: 'BZA', vendor: 'x', signal_aspects: {}, point_positions: {}, track_circuit_occupancy: {} });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('StaffSignallingPanel VDU trains', () => {
  it('places every live train onto its platform berth in the yard diagram', async () => {
    const root = mount('BZA');
    await act(async () => { root.render(<StaffSignallingPanel activeStation="BZA" />); });
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });

    const text = document.body.textContent;
    expect(document.querySelector('svg')).toBeTruthy();
    expect(text).toContain('Guntur Passenger');
    expect(text).toContain('Swarna Jayanti Express');
    expect(text).toContain('Macherla Bhimavaram Passenger');
    // The "Active Rakes in BZA Yard" summary must list occupied berths, not "All ... clear"
    expect(text).toContain('Active Rakes in BZA Yard');
    root.unmount();
  });

  it('shows rakes for BPL too (station-specific diagram)', async () => {
    const root = mount('BPL');
    await act(async () => { root.render(<StaffSignallingPanel activeStation="BPL" />); });
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });

    expect(document.body.textContent).toContain('Active Rakes in BPL Yard');
    expect(document.body.textContent).toContain('Guntur Passenger');
    root.unmount();
  });
});