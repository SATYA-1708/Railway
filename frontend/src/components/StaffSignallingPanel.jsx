import React, { useState, useRef } from 'react';
import {
  Monitor, AlertTriangle, Lock, Unlock, Radio, ArrowRightLeft, Zap,
  ShieldAlert, Sparkles, RotateCcw, CheckCircle2, Timer, Route as RouteIcon,
  GitBranch, Check, Activity
} from 'lucide-react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../config';
import { useStationTrains } from '../hooks/useStationTrains';

/* ------------------------------------------------------------------ */
/* Signal Aspect Definitions (MACLS 4-Aspect Indian Railways)          */
/* ------------------------------------------------------------------ */
const ASPECTS = {
  RED: { label: 'Danger (Stop)', color: '#ef4444', desc: 'Next block occupied' },
  YELLOW: { label: 'Caution', color: '#eab308', desc: 'Proceed at restricted speed (next signal at Danger)' },
  DOUBLE_YELLOW: { label: 'Attention', color: '#facc15', desc: 'Proceed prepared to pass next signal at Caution' },
  GREEN: { label: 'Clear', color: '#22c55e', desc: 'Proceed at maximum permissible speed' },
};

/* ------------------------------------------------------------------ */
/* Station Data: Distinct Real Infrastructures for BPL, BZA, and NDLS */
/* ------------------------------------------------------------------ */
const STATIONS_DATA = {
  BPL: {
    name: 'Bhopal Jn',
    code: 'BPL',
    zone: 'West Central Railway (WCR)',
    division: 'Bhopal Division',
    layoutType: 'Junction with Bypass Chord',
    description: 'Delhi-Chennai Grand Trunk Spine with Nishatpura Indore/Ujjain chord bypass and Itarsi/Bina main lines.',
    mainLines: ['Up Main (to Itarsi/Nagpur)', 'Down Main (to Bina/Jhansi)', 'NSP Chord (to Ujjain/Indore)'],
    platforms: [
      { id: 'PF1', label: 'Platform 1', trackId: 'BPL-PF1', len: '650m (24 Coaches)', type: 'Main Up (to ET/NGP)', speed: '110 km/h' },
      { id: 'PF2', label: 'Platform 2', trackId: 'BPL-PF2', len: '650m (24 Coaches)', type: 'Main Down (to BINA/NDLS)', speed: '110 km/h' },
      { id: 'PF3', label: 'Platform 3', trackId: 'BPL-PF3', len: '620m (24 Coaches)', type: 'Shatabdi Loop Up', speed: '30 km/h' },
      { id: 'PF4', label: 'Platform 4', trackId: 'BPL-PF4', len: '600m (22 Coaches)', type: 'Grand Trunk Loop Down', speed: '30 km/h' },
      { id: 'PF5', label: 'Platform 5', trackId: 'BPL-PF5', len: '580m (20 Coaches)', type: 'Rani Kamlapati Feeder Line', speed: '30 km/h' },
      { id: 'PF6', label: 'Platform 6', trackId: 'BPL-PF6', len: '550m (18 Coaches)', type: 'Ujjain / Indore Passenger Line', speed: '30 km/h' },
    ],
    points: [
      { id: '101', name: 'Pt 101A/B', pos: 'normal', desc: 'Itarsi Up Main Inbound Crossover' },
      { id: '102', name: 'Pt 102A/B', pos: 'normal', desc: 'Bina Down Main Inbound Turnout' },
      { id: '103', name: 'Pt 103A/B', pos: 'normal', desc: 'Nishatpura Branch Chord Crossover' },
      { id: '104', name: 'Pt 104A/B', pos: 'normal', desc: 'Goods Marshalling Siding Turnout' },
    ],
    signals: [
      { id: 'S-H1', name: 'Home S-H1 (ET Up)', type: 'HOME', aspect: 'GREEN', track: 'BPL-101T', desc: 'Approach Signal from Itarsi' },
      { id: 'S-H2', name: 'Home S-H2 (Bina Dn)', type: 'HOME', aspect: 'YELLOW', track: 'BPL-2AT', desc: 'Approach Signal from Bina' },
      { id: 'S-H3', name: 'Home S-H3 (NSP Chord)', type: 'HOME', aspect: 'RED', track: 'BPL-NSP', desc: 'Approach from Nishatpura Branch' },
      { id: 'S-ST1', name: 'Starter S-ST1', type: 'STARTER', aspect: 'GREEN', track: 'BPL-PF1', pf: 'PF1', desc: 'PF 1 Dispatch' },
      { id: 'S-ST2', name: 'Starter S-ST2', type: 'STARTER', aspect: 'RED', track: 'BPL-PF2', pf: 'PF2', desc: 'PF 2 Dispatch' },
      { id: 'S-ST3', name: 'Starter S-ST3', type: 'STARTER', aspect: 'RED', track: 'BPL-PF3', pf: 'PF3', desc: 'PF 3 Dispatch' },
      { id: 'S-ST4', name: 'Starter S-ST4', type: 'STARTER', aspect: 'RED', track: 'BPL-PF4', pf: 'PF4', desc: 'PF 4 Dispatch' },
      { id: 'S-ST5', name: 'Starter S-ST5', type: 'STARTER', aspect: 'RED', track: 'BPL-PF5', pf: 'PF5', desc: 'PF 5 Dispatch' },
      { id: 'S-ST6', name: 'Starter S-ST6', type: 'STARTER', aspect: 'RED', track: 'BPL-PF6', pf: 'PF6', desc: 'PF 6 Dispatch' },
      { id: 'S-AS1', name: 'Adv Starter S-AS1', type: 'ADV_STARTER', aspect: 'GREEN', track: 'BPL-101T', desc: 'Up Block Section Entry' },
      { id: 'S-AS2', name: 'Adv Starter S-AS2', type: 'ADV_STARTER', aspect: 'GREEN', track: 'BPL-2AT', desc: 'Down Block Section Entry' },
    ],
    tracks: [
      { id: 'BPL-101T', label: '101T', name: 'Itarsi Up Main Approach', status: 'CLEAR', train: null },
      { id: 'BPL-2AT', label: '2AT', name: 'Bina Down Main Approach', status: 'CLEAR', train: null },
      { id: 'BPL-NSP', label: 'NSP-T', name: 'Nishatpura Branch Chord', status: 'CLEAR', train: null },
      { id: 'BPL-PF1', label: 'PF-1T', name: 'Platform 1 Berth', status: 'CLEAR', train: null },
      { id: 'BPL-PF2', label: 'PF-2T', name: 'Platform 2 Berth', status: 'CLEAR', train: null },
      { id: 'BPL-PF3', label: 'PF-3T', name: 'Platform 3 Berth', status: 'CLEAR', train: null },
      { id: 'BPL-PF4', label: 'PF-4T', name: 'Platform 4 Berth', status: 'CLEAR', train: null },
      { id: 'BPL-PF5', label: 'PF-5T', name: 'Platform 5 Berth', status: 'CLEAR', train: null },
      { id: 'BPL-PF6', label: 'PF-6T', name: 'Platform 6 Berth', status: 'CLEAR', train: null },
      { id: 'BPL-GYD', label: 'G-YD', name: 'Goods Marshalling Siding', status: 'CLEAR', train: null },
    ],
  },

  BZA: {
    name: 'Vijayawada Jn',
    code: 'BZA',
    zone: 'South Central Railway (SCR)',
    division: 'Vijayawada Division',
    layoutType: 'Major 4-Way River Junction',
    description: 'Busiest SCR multi-directional junction with 10 physical platforms bridging the Krishna River, converging Chennai MAS, Visakhapatnam VSKP, Kazipet/HYB, and Guntur lines.',
    mainLines: ['MAS Up (to Chennai/Tenali)', 'VSKP Dn (to Eluru/Howrah)', 'HYB Line (to Kazipet)', 'GNT Branch (to Guntur)', 'MTM Suburban Line (to Machilipatnam)'],
    platforms: [
      { id: 'PF1', label: 'Platform 1', trackId: 'BZA-PF1', len: '720m (26 Coaches)', type: 'Chennai MAS Main Up', speed: '110 km/h' },
      { id: 'PF2', label: 'Platform 2', trackId: 'BZA-PF2', len: '720m (26 Coaches)', type: 'Visakhapatnam Main Down', speed: '110 km/h' },
      { id: 'PF3', label: 'Platform 3', trackId: 'BZA-PF3', len: '680m (24 Coaches)', type: 'Godavari / Grand Trunk Loop', speed: '30 km/h' },
      { id: 'PF4', label: 'Platform 4', trackId: 'BZA-PF4', len: '680m (24 Coaches)', type: 'AP Express / Coromandel Loop', speed: '30 km/h' },
      { id: 'PF5', label: 'Platform 5', trackId: 'BZA-PF5', len: '650m (24 Coaches)', type: 'Hyderabad / Kazipet Main', speed: '30 km/h' },
      { id: 'PF6', label: 'Platform 6', trackId: 'BZA-PF6', len: '650m (24 Coaches)', type: 'Kazipet Fast / Charminar Line', speed: '30 km/h' },
      { id: 'PF7', label: 'Platform 7', trackId: 'BZA-PF7', len: '600m (22 Coaches)', type: 'Guntur / Golconda Passenger Line', speed: '30 km/h' },
      { id: 'PF8', label: 'Platform 8', trackId: 'BZA-PF8', len: '580m (20 Coaches)', type: 'Tenali / Circar Express Berth', speed: '30 km/h' },
      { id: 'PF9', label: 'Platform 9', trackId: 'BZA-PF9', len: '550m (18 Coaches)', type: 'Machilipatnam Suburban Line', speed: '30 km/h' },
      { id: 'PF10', label: 'Platform 10', trackId: 'BZA-PF10', len: '520m (16 Coaches)', type: 'Gudivada / Bhimavaram Terminal', speed: '30 km/h' },
    ],
    points: [
      { id: '201', name: 'Pt 201A/B', pos: 'normal', desc: 'Krishna River Bridge South Crossover' },
      { id: '202', name: 'Pt 202A/B', pos: 'normal', desc: 'Eluru / VSKP North Throat Turnout' },
      { id: '203', name: 'Pt 203A/B', pos: 'normal', desc: 'Kazipet / Hyderabad West Diamond' },
      { id: '204', name: 'Pt 204A/B', pos: 'normal', desc: 'Guntur South-West Branch Turnout' },
      { id: '205', name: 'Pt 205A/B', pos: 'normal', desc: 'Machilipatnam North-East Branch Crossover' },
      { id: '206', name: 'Pt 206A/B', pos: 'normal', desc: 'Bypass Freight Chord Machine' },
    ],
    signals: [
      { id: 'S-H1', name: 'Home S-H1 (MAS Bridge)', type: 'HOME', aspect: 'GREEN', track: 'BZA-MAS', desc: 'Approach from Krishna River Bridge' },
      { id: 'S-H2', name: 'Home S-H2 (VSKP North)', type: 'HOME', aspect: 'GREEN', track: 'BZA-VSKP', desc: 'Approach from Eluru/Rajahmundry' },
      { id: 'S-H3', name: 'Home S-H3 (HYB West)', type: 'HOME', aspect: 'GREEN', track: 'BZA-HYB', desc: 'Approach from Kazipet' },
      { id: 'S-H4', name: 'Home S-H4 (GNT South)', type: 'HOME', aspect: 'GREEN', track: 'BZA-GNT', desc: 'Approach from Guntur' },
      { id: 'S-ST1', name: 'Starter S-ST1', type: 'STARTER', aspect: 'RED', track: 'BZA-PF1', pf: 'PF1', desc: 'PF 1 MAS Dispatch' },
      { id: 'S-ST2', name: 'Starter S-ST2', type: 'STARTER', aspect: 'RED', track: 'BZA-PF2', pf: 'PF2', desc: 'PF 2 VSKP Dispatch' },
      { id: 'S-ST3', name: 'Starter S-ST3', type: 'STARTER', aspect: 'RED', track: 'BZA-PF3', pf: 'PF3', desc: 'PF 3 Godavari Dispatch' },
      { id: 'S-ST4', name: 'Starter S-ST4', type: 'STARTER', aspect: 'RED', track: 'BZA-PF4', pf: 'PF4', desc: 'PF 4 AP Exp Dispatch' },
      { id: 'S-ST5', name: 'Starter S-ST5', type: 'STARTER', aspect: 'RED', track: 'BZA-PF5', pf: 'PF5', desc: 'PF 5 HYB Dispatch' },
      { id: 'S-ST6', name: 'Starter S-ST6', type: 'STARTER', aspect: 'RED', track: 'BZA-PF6', pf: 'PF6', desc: 'PF 6 Kazipet Dispatch' },
      { id: 'S-AS1', name: 'Adv Starter S-AS1', type: 'ADV_STARTER', aspect: 'GREEN', track: 'BZA-MAS', desc: 'MAS Block Section Entry' },
      { id: 'S-AS2', name: 'Adv Starter S-AS2', type: 'ADV_STARTER', aspect: 'GREEN', track: 'BZA-VSKP', desc: 'VSKP Block Section Entry' },
    ],
    tracks: [
      { id: 'BZA-MAS', label: 'MAS-UP', name: 'Krishna River Bridge Up Main', status: 'CLEAR', train: null },
      { id: 'BZA-VSKP', label: 'VSKP-DN', name: 'Visakhapatnam Down Main', status: 'CLEAR', train: null },
      { id: 'BZA-HYB', label: 'HYB-IN', name: 'Hyderabad Kazipet Inbound', status: 'CLEAR', train: null },
      { id: 'BZA-GNT', label: 'GNT-BR', name: 'Guntur Branch Chord', status: 'CLEAR', train: null },
      { id: 'BZA-PF1', label: 'PF-1T', name: 'Platform 1 (MAS Mail)', status: 'CLEAR', train: null },
      { id: 'BZA-PF2', label: 'PF-2T', name: 'Platform 2 (VSKP Fast)', status: 'CLEAR', train: null },
      { id: 'BZA-PF3', label: 'PF-3T', name: 'Platform 3 (Godavari Loop)', status: 'CLEAR', train: null },
      { id: 'BZA-PF4', label: 'PF-4T', name: 'Platform 4 (GT Loop)', status: 'CLEAR', train: null },
      { id: 'BZA-PF5', label: 'PF-5T', name: 'Platform 5 (HYB Line)', status: 'CLEAR', train: null },
      { id: 'BZA-PF6', label: 'PF-6T', name: 'Platform 6 (Charminar Line)', status: 'CLEAR', train: null },
      { id: 'BZA-PF7', label: 'PF-7T', name: 'Platform 7 (Golconda Line)', status: 'CLEAR', train: null },
      { id: 'BZA-PF8', label: 'PF-8T', name: 'Platform 8 (Tenali Branch)', status: 'CLEAR', train: null },
      { id: 'BZA-PF9', label: 'PF-9T', name: 'Platform 9 (Machilipatnam)', status: 'CLEAR', train: null },
      { id: 'BZA-PF10', label: 'PF-10T', name: 'Platform 10 (Gudivada Loop)', status: 'CLEAR', train: null },
      { id: 'BZA-BYP', label: 'BYPASS-T', name: 'Freight Bypass Line', status: 'CLEAR', train: null },
    ],
  },

  NDLS: {
    name: 'New Delhi',
    code: 'NDLS',
    zone: 'Northern Railway (NR)',
    division: 'Delhi Division',
    layoutType: 'Premier Quad-Track Terminus/Junction',
    description: 'National capital flagship terminus with ALL 16 physical platforms, quad approach throats (Tilak Bridge TKD & Sadar Bazar GZB), Paharganj Wing (PF 1-5), Central Core (PF 6-10), and Ajmeri Gate Wing (PF 11-16).',
    mainLines: ['TKD Quad Up (from Nizamuddin/Mumbai)', 'GZB Quad Dn (from Ghaziabad/Kanpur)', 'Amritsar Northern Chord', 'Ajmeri Gate Yard Neck', 'EMU Siding Throat'],
    platforms: [
      { id: 'PF1', label: 'Platform 1', trackId: 'NDLS-PF1', len: '750m (26 Coaches)', type: 'Paharganj Rajdhani Berth', speed: '90 km/h' },
      { id: 'PF2', label: 'Platform 2', trackId: 'NDLS-PF2', len: '750m (26 Coaches)', type: 'Western Trunk Mumbai Fast', speed: '90 km/h' },
      { id: 'PF3', label: 'Platform 3', trackId: 'NDLS-PF3', len: '720m (24 Coaches)', type: 'Grand Trunk Chennai / AP Exp', speed: '30 km/h' },
      { id: 'PF4', label: 'Platform 4', trackId: 'NDLS-PF4', len: '720m (24 Coaches)', type: 'Eastern Chord Howrah Mail', speed: '30 km/h' },
      { id: 'PF5', label: 'Platform 5', trackId: 'NDLS-PF5', len: '700m (24 Coaches)', type: 'Vande Bharat Express Berth', speed: '30 km/h' },
      { id: 'PF6', label: 'Platform 6', trackId: 'NDLS-PF6', len: '700m (24 Coaches)', type: 'Shatabdi Express Berth', speed: '30 km/h' },
      { id: 'PF7', label: 'Platform 7', trackId: 'NDLS-PF7', len: '680m (24 Coaches)', type: 'Central Northern Fast Line', speed: '30 km/h' },
      { id: 'PF8', label: 'Platform 8', trackId: 'NDLS-PF8', len: '680m (24 Coaches)', type: 'Jammu Rajdhani Express Line', speed: '30 km/h' },
      { id: 'PF9', label: 'Platform 9', trackId: 'NDLS-PF9', len: '650m (22 Coaches)', type: 'Lucknow Shatabdi / Intercity', speed: '30 km/h' },
      { id: 'PF10', label: 'Platform 10', trackId: 'NDLS-PF10', len: '650m (22 Coaches)', type: 'Delhi-Ghaziabad EMU Suburb', speed: '30 km/h' },
      { id: 'PF11', label: 'Platform 11', trackId: 'NDLS-PF11', len: '650m (22 Coaches)', type: 'Ajmeri Gate Trunk Up Line', speed: '30 km/h' },
      { id: 'PF12', label: 'Platform 12', trackId: 'NDLS-PF12', len: '700m (24 Coaches)', type: 'Ajmeri Gate Prayagraj Exp Line', speed: '30 km/h' },
      { id: 'PF13', label: 'Platform 13', trackId: 'NDLS-PF13', len: '680m (24 Coaches)', type: 'Ajmeri Gate Eastern Superfast', speed: '30 km/h' },
      { id: 'PF14', label: 'Platform 14', trackId: 'NDLS-PF14', len: '720m (24 Coaches)', type: 'Ajmeri Gate Howrah Rajdhani Berth', speed: '30 km/h' },
      { id: 'PF15', label: 'Platform 15', trackId: 'NDLS-PF15', len: '720m (24 Coaches)', type: 'Ajmeri Gate Poorva Express Berth', speed: '30 km/h' },
      { id: 'PF16', label: 'Platform 16', trackId: 'NDLS-PF16', len: '750m (26 Coaches)', type: 'Ajmeri Gate Kalka Shatabdi / VB', speed: '30 km/h' },
    ],
    points: [
      { id: '301', name: 'Pt 301A/B', pos: 'normal', desc: 'Tilak Bridge Quad Up Crossover' },
      { id: '302', name: 'Pt 302A/B', pos: 'normal', desc: 'Sadar Bazar North Flyover Throat' },
      { id: '303', name: 'Pt 303A/B', pos: 'normal', desc: 'Paharganj Siding Interlocking' },
      { id: '304', name: 'Pt 304A/B', pos: 'normal', desc: 'Ajmeri Gate Washing Line Switch' },
      { id: '305', name: 'Pt 305A/B', pos: 'normal', desc: 'Central Scissors Crossover' },
      { id: '306', name: 'Pt 306A/B', pos: 'normal', desc: 'East Wing Multi-Throat Ladder' },
    ],
    signals: [
      { id: 'S-H1', name: 'Home S-H1 (TKD Fast Up)', type: 'HOME', aspect: 'GREEN', track: 'NDLS-TKD1', desc: 'Approach from Hazrat Nizamuddin Fast' },
      { id: 'S-H2', name: 'Home S-H2 (TKD Slow Up)', type: 'HOME', aspect: 'GREEN', track: 'NDLS-TKD2', desc: 'Approach from Nizamuddin Slow' },
      { id: 'S-H3', name: 'Home S-H3 (GZB Fast Dn)', type: 'HOME', aspect: 'GREEN', track: 'NDLS-GZB1', desc: 'Approach from Ghaziabad/Kanpur Fast' },
      { id: 'S-H4', name: 'Home S-H4 (GZB Slow Dn)', type: 'HOME', aspect: 'GREEN', track: 'NDLS-GZB2', desc: 'Approach from Ghaziabad Slow' },
      { id: 'S-ST1', name: 'Starter S-ST1', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF1', pf: 'PF1', desc: 'PF 1 Rajdhani Dispatch' },
      { id: 'S-ST2', name: 'Starter S-ST2', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF2', pf: 'PF2', desc: 'PF 2 Western Dispatch' },
      { id: 'S-ST3', name: 'Starter S-ST3', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF3', pf: 'PF3', desc: 'PF 3 GT Dispatch' },
      { id: 'S-ST5', name: 'Starter S-ST5', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF5', pf: 'PF5', desc: 'PF 5 VB Dispatch' },
      { id: 'S-ST12', name: 'Starter S-ST12', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF12', pf: 'PF12', desc: 'PF 12 Prayagraj Dispatch' },
      { id: 'S-ST14', name: 'Starter S-ST14', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF14', pf: 'PF14', desc: 'PF 14 Howrah Rajdhani Dispatch' },
      { id: 'S-ST16', name: 'Starter S-ST16', type: 'STARTER', aspect: 'RED', track: 'NDLS-PF16', pf: 'PF16', desc: 'PF 16 Kalka Shatabdi Dispatch' },
      { id: 'S-AS1', name: 'Adv Starter S-AS1', type: 'ADV_STARTER', aspect: 'GREEN', track: 'NDLS-TKD1', desc: 'TKD Quad Exit' },
      { id: 'S-AS2', name: 'Adv Starter S-AS2', type: 'ADV_STARTER', aspect: 'GREEN', track: 'NDLS-GZB1', desc: 'GZB Quad Exit' },
    ],
    tracks: [
      { id: 'NDLS-TKD1', label: 'TKD-UP1', name: 'Tilak Bridge Up Fast (from NZM)', status: 'CLEAR', train: null },
      { id: 'NDLS-TKD2', label: 'TKD-UP2', name: 'Tilak Bridge Up Slow Line', status: 'CLEAR', train: null },
      { id: 'NDLS-GZB1', label: 'GZB-DN1', name: 'Sadar Bazar Down Fast (from GZB)', status: 'CLEAR', train: null },
      { id: 'NDLS-GZB2', label: 'GZB-DN2', name: 'Sadar Bazar Down Slow Line', status: 'CLEAR', train: null },
      { id: 'NDLS-PF1', label: 'PF-1T', name: 'Platform 1 (Paharganj)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF2', label: 'PF-2T', name: 'Platform 2 (Western Trunk)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF3', label: 'PF-3T', name: 'Platform 3 (Grand Trunk)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF4', label: 'PF-4T', name: 'Platform 4 (Eastern Trunk)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF5', label: 'PF-5T', name: 'Platform 5 (Vande Bharat)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF6', label: 'PF-6T', name: 'Platform 6 (Shatabdi)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF7', label: 'PF-7T', name: 'Platform 7 (Northern Fast)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF8', label: 'PF-8T', name: 'Platform 8 (Jammu Rajdhani)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF9', label: 'PF-9T', name: 'Platform 9 (Lucknow Line)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF10', label: 'PF-10T', name: 'Platform 10 (EMU Suburb)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF11', label: 'PF-11T', name: 'Platform 11 (Ajmeri Gate Up)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF12', label: 'PF-12T', name: 'Platform 12 (Prayagraj Exp)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF13', label: 'PF-13T', name: 'Platform 13 (Eastern Superfast)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF14', label: 'PF-14T', name: 'Platform 14 (Howrah Rajdhani)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF15', label: 'PF-15T', name: 'Platform 15 (Poorva Express)', status: 'CLEAR', train: null },
      { id: 'NDLS-PF16', label: 'PF-16T', name: 'Platform 16 (Kalka Shatabdi)', status: 'CLEAR', train: null },
      { id: 'NDLS-EMU', label: 'EMU-NECK', name: 'Ajmeri Gate Washing Siding', status: 'CLEAR', train: null },
    ],
  },
};

const ASPECT_CYCLE = ['RED', 'YELLOW', 'DOUBLE_YELLOW', 'GREEN'];

// Derived once at module load: interlocking maps seeded from the station data.
// Track ids in STATIONS_DATA are already station-prefixed (e.g. "BZA-PF1"), so
// tracks are keyed as-is; signals/points ids are bare and get the station prefix.
function buildInitialState() {
  const asp = {};
  const pts = {};
  const trks = {};
  const trns = {};
  Object.keys(STATIONS_DATA).forEach(code => {
    const stn = STATIONS_DATA[code];
    stn.signals.forEach(s => { asp[`${code}-${s.id}`] = s.aspect; });
    stn.points.forEach(p => { pts[`${code}-${p.id}`] = p.pos; });
    stn.tracks.forEach(t => {
      trks[t.id] = t.status;
      trns[t.id] = t.train || null;
    });
  });
  return { asp, pts, trks, trns };
}

const INITIAL_STATE = buildInitialState();

export default function StaffSignallingPanel({ trains: _trainsProp = [], activeStation = 'BZA', onStationChange = () => {} }) {
  const [stationCode, setStationCode] = useState(activeStation || 'BZA');
  const [activeTab, setActiveTab] = useState('vdu');
  const { trains: stationTrains } = useStationTrains(stationCode);

  // Sync if parent changes station
  React.useEffect(() => {
    if (activeStation && STATIONS_DATA[activeStation]) {
      setStationCode(activeStation);
    }
  }, [activeStation]);

  // Interlocking State Maps (lazily initialized from station data)
  const [aspects, setAspects] = useState(INITIAL_STATE.asp);
  const [points, setPoints] = useState(INITIAL_STATE.pts);
  const [tracks, setTracks] = useState(INITIAL_STATE.trks);
  const [trainData, setTrainData] = useState(INITIAL_STATE.trns);
  const [dataloggerStatus, setDataloggerStatus] = useState({
    vendor: 'Siemens Westrace Electronic Interlocking (EI-V3)',
    protocol: 'RDSO/SPN/153/2004 Optical SCADA',
    link: 'ONLINE_OPTICAL_SCADA',
    baudRate: '115200 bps (RS-485/OFC)',
    dataloggerId: 'RDSO/SCR/BZA/DL-01'
  });

   React.useEffect(() => {
    const fetchInterlocking = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/interlocking/station/${stationCode}`, {
          headers: { ...authService.getAuthHeader() }
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setDataloggerStatus({
              vendor: data.vendor || 'Electronic Interlocking (EI)',
              protocol: 'RDSO/SPN/153/2004 Optical SCADA',
              link: data.link_status || 'ONLINE_OPTICAL_SCADA',
              baudRate: data.baud_rate || '115200 bps (RS-485/OFC)',
              dataloggerId: data.datalogger_id || `RDSO/${stationCode}/DL-01`
            });

            if (data.signal_aspects && Object.keys(data.signal_aspects).length > 0) {
              setAspects(prev => ({ ...prev, ...Object.fromEntries(
                Object.entries(data.signal_aspects).map(([k, v]) => [`${stationCode}-${k}`, v])
              )}));
            }
            if (data.point_positions && Object.keys(data.point_positions).length > 0) {
              setPoints(prev => ({ ...prev, ...Object.fromEntries(
                Object.entries(data.point_positions).map(([k, v]) => [`${stationCode}-${k}`, v])
              )}));
            }
            if (data.track_circuit_occupancy && Object.keys(data.track_circuit_occupancy).length > 0) {
              setTracks(prev => ({ ...prev, ...Object.fromEntries(
                Object.entries(data.track_circuit_occupancy).map(([k, v]) => [`${stationCode}-${k}`, v])
              )}));
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchInterlocking();
  }, [stationCode]);

    // Dynamic Live Train Synchronization: place only actively halting / arriving trains onto platform track circuits.
    const lastLiveTrainsRef = useRef([]);
    const lastSyncStationRef = useRef(null);
    React.useEffect(() => {
     const stn = STATIONS_DATA[stationCode];
     if (!stn) return;

     // Keep the last known roster so a transient empty/failed poll never wipes the yard board blank.
     const roster = (Array.isArray(stationTrains) && stationTrains.length > 0) ? stationTrains : lastLiveTrainsRef.current;
     if (roster.length > 0) lastLiveTrainsRef.current = roster;

     const newTracks = { ...tracks };
     const newTrainData = { ...trainData };
     const newAspects = { ...aspects };

     const isStationSwitch = lastSyncStationRef.current !== stationCode;
     lastSyncStationRef.current = stationCode;

     const toPfNum = (v) => {
       const n = typeof v === 'number' ? v : parseInt(String(v).replace(/[^0-9]/g, ''), 10);
       return Number.isFinite(n) && n > 0 ? n : null;
     };

     // On station switch, reset the whole yard (platforms + approach lines).
     // On normal polls, only reconcile platform berths against the live roster so
     // manually set approach occupancy / route locks survive the 30s refresh.
     stn.tracks.forEach(t => {
       const isPlatformBerth = /-PF\d+$/.test(t.id);
       if (isStationSwitch || isPlatformBerth) {
         newTracks[t.id] = 'CLEAR';
         newTrainData[t.id] = null;
       }
     });
     // Set all starters to RED by default until cleared
     stn.signals.forEach(s => {
       if (s.type === 'STARTER') {
         newAspects[`${stationCode}-${s.id}`] = 'RED';
       }
     });

     if (Array.isArray(roster) && roster.length > 0) {
       const platformTrackIds = new Set((stn.platforms || []).map(pf => pf.trackId));
       const platformIds = new Set((stn.platforms || []).map(pf => pf.id));

       roster.forEach(t => {
         const pfNum = toPfNum(t.platform ?? t.assignedPlatform) || toPfNum(t.platform) || 1;
         const pfId = `PF${pfNum}`;
         const pfTrackId = `${stationCode}-PF${pfNum}`;
         const spd = (t.currentSpeed !== undefined ? t.currentSpeed : 0) || 0;
         const dly = (t.delay || t.baseDelayMin || 0) || 0;
         const isHalting = spd === 0 || spd < 15;

         if (platformTrackIds.has(pfTrackId) || platformIds.has(pfId)) {
           if (newTracks[pfTrackId] !== undefined) {
             newTracks[pfTrackId] = 'OCCUPIED';
             newTrainData[pfTrackId] = `#${t.number || 'UNKNOWN'} ${t.name || 'Unknown Train'} (${isHalting ? '0 km/h Halting' : `${spd} km/h Entering`} • Delay: ${dly}m)`;
             const starterId = `S-ST${pfNum}`;
             if (newAspects[`${stationCode}-${starterId}`] !== undefined) {
               newAspects[`${stationCode}-${starterId}`] = isHalting ? 'RED' : 'GREEN';
             }
           }
         }
       });
     }

     setTracks(newTracks);
     setTrainData(newTrainData);
     setAspects(newAspects);
   }, [stationTrains, stationCode]);

  // Route Locking State
  const [lockedRoute, setLockedRoute] = useState(null);
  const [selectedEntrance, setSelectedEntrance] = useState('S-H1');
  const [selectedExit, setSelectedExit] = useState('PF1');
  const [releaseTimer, setReleaseTimer] = useState(null);
  const [logMessages, setLogMessages] = useState(() => [
    {
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      msg: `System initialized. Electronic Interlocking (EI) active for ${STATIONS_DATA[activeStation]?.name || STATIONS_DATA.BZA.name}.`,
    },
  ]);
  const timerRef = useRef(null);

  const station = STATIONS_DATA[stationCode];
  if (!station) {
    return (
      <div className="p-6 text-slate-400">
        No interlocking data available for station code: {stationCode}
      </div>
    );
  }

  const getSignalAspect = (id) => {
    if (!id) return 'RED';
    return aspects[`${stationCode}-${id}`] || 'RED';
  };
  const getPointPos = (id) => {
    if (!id) return 'normal';
    return points[`${stationCode}-${id}`] || 'normal';
  };
  const getTrackStatus = (id) => {
    if (!id) return 'CLEAR';
    const key = id.startsWith(`${stationCode}-`) ? id : `${stationCode}-${id}`;
    return tracks[key] || 'CLEAR';
  };
  const getTrackTrain = (id) => {
    if (!id) return null;
    const key = id.startsWith(`${stationCode}-`) ? id : `${stationCode}-${id}`;
    return trainData[key] || null;
  };

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogMessages(prev => [{ id: Date.now() + Math.random(), time, msg }, ...prev.slice(0, 19)]);
  };

  const handleStationSwitch = (code) => {
    const stn = STATIONS_DATA[code];
    setStationCode(code);
    onStationChange(code);
    setLockedRoute(null);
    setReleaseTimer(null);
    if (stn) {
      setSelectedEntrance(stn.signals[0]?.id || 'S-H1');
      setSelectedExit(stn.platforms[0]?.id || 'PF1');
      addLog(`VDU Switched to [${stn.name}] — ${stn.layoutType} with ${stn.platforms.length} Platforms.`);
    }
  };

  /* ---------------- Interactive Handlers ---------------- */
  const toggleSignal = (sigId) => {
    setAspects(prev => {
      const key = `${stationCode}-${sigId}`;
      const cur = prev[key] || 'RED';
      const next = ASPECT_CYCLE[(ASPECT_CYCLE.indexOf(cur) + 1) % ASPECT_CYCLE.length];
      addLog(`[${station.code}] Signal ${sigId} aspect changed: ${cur} ➔ ${next}`);
      return { ...prev, [key]: next };
    });
  };

  const setSignalAspectDirect = (sigId, asp) => {
    setAspects(prev => {
      const key = `${stationCode}-${sigId}`;
      addLog(`[${station.code}] Manual Override: Signal ${sigId} ➔ ${asp}`);
      return { ...prev, [key]: asp };
    });
  };

  const togglePoint = (ptId) => {
    setPoints(prev => {
      const key = `${stationCode}-${ptId}`;
      const next = prev[key] === 'normal' ? 'reverse' : 'normal';
      addLog(`[${station.code}] Motor Point ${ptId} thrown to ${next.toUpperCase()}`);
      return { ...prev, [key]: next };
    });
  };

  const toggleTrackOccupancy = (trackId) => {
    const order = ['CLEAR', 'OCCUPIED', 'ROUTE_LOCKED'];
    setTracks(prev => {
      const key = trackId.startsWith(`${stationCode}-`) ? trackId : `${stationCode}-${trackId}`;
      const cur = prev[key] || 'CLEAR';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      addLog(`[${station.code}] Track Circuit ${trackId.replace(`${stationCode}-`, '')} status: ${next}`);
      return { ...prev, [key]: next };
    });
  };

  /* NX Route Setting */
  const handleSetRoute = (entranceSig, targetPf) => {
    const pfObj = station.platforms.find(p => p.id === targetPf);
    if (!pfObj) return;
    const targetTrackId = pfObj.trackId;
    const targetTrackStatus = getTrackStatus(targetTrackId);

    if (targetTrackStatus === 'OCCUPIED') {
      const occupant = getTrackTrain(targetTrackId);
      addLog(`🚨 INTERLOCKING LOCKOUT at ${station.name}: Cannot set route to ${targetPf}. Berth is OCCUPIED by ${occupant || 'another rake'}.`);
      return;
    }

    // Set Points for route
    setPoints(prev => {
      const updated = { ...prev };
      const ptList = station.points.map(p => p.id);
      const isLoop = parseInt(targetPf.replace('PF', '')) > 2;
      ptList.forEach((pid, idx) => {
        updated[`${stationCode}-${pid}`] = isLoop && idx === 0 ? 'reverse' : 'normal';
      });
      return updated;
    });

    // Lock Track Circuits
    const approachSig = station.signals.find(s => s.id === entranceSig);
    const approachTrack = approachSig?.track || station.tracks[0]?.id;
    const tk = k => (k.startsWith(`${stationCode}-`) ? k : `${stationCode}-${k}`);

    setTracks(prev => ({
      ...prev,
      [tk(targetTrackId)]: 'ROUTE_LOCKED',
      [tk(approachTrack)]: 'ROUTE_LOCKED',
    }));

    // Clear Home Signal
    setAspects(prev => ({
      ...prev,
      [`${stationCode}-${entranceSig}`]: targetPf === 'PF1' || targetPf === 'PF2' ? 'GREEN' : 'DOUBLE_YELLOW',
    }));

    const routeName = `${entranceSig} ➔ ${targetPf} (${pfObj.type})`;
    setLockedRoute(routeName);
    addLog(`✅ [${station.code}] ROUTE LOCKED & PROVED: ${routeName}. Signal cleared.`);

    // Start 45s simulated train arrival clearing
    if (timerRef.current) clearInterval(timerRef.current);
    setReleaseTimer(45);
    timerRef.current = setInterval(() => {
      setReleaseTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmergencyRouteRelease = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setReleaseTimer(null);
    setLockedRoute(null);
    // Reset locked tracks back to clear
    setTracks(prev => {
      const updated = { ...prev };
      station.tracks.forEach(t => {
        if (updated[t.id] === 'ROUTE_LOCKED') updated[t.id] = 'CLEAR';
      });
      return updated;
    });
    // Set approach signals back to danger
    setAspects(prev => {
      const updated = { ...prev };
      station.signals.forEach(s => {
        if (s.type === 'HOME') updated[`${stationCode}-${s.id}`] = 'RED';
      });
      return updated;
    });
    addLog(`⚠️ [${station.code}] EMERGENCY ROUTE CANCEL: All routes released safely.`);
  };

  const handleSimulateIncoming = () => {
    const approachTrack = station.tracks[1]?.id || station.tracks[0]?.id;
    const key = `${stationCode}-${approachTrack}`;
    const cur = tracks[key];
    const next = cur === 'OCCUPIED' ? 'CLEAR' : 'OCCUPIED';
    setTracks(prev => ({ ...prev, [key]: next }));
    setTrainData(prev => ({
      ...prev,
      [key]: next === 'OCCUPIED' ? `#${stationCode === 'BPL' ? '12002 Shatabdi' : stationCode === 'BZA' ? '20805 AP Express' : '22436 Vande Bharat'} (Inbound Approach)` : null
    }));
    addLog(`⚡ SIMULATION at ${station.name}: ${next === 'OCCUPIED' ? `Inbound rake detected approaching on track ${approachTrack}` : `Approach track ${approachTrack} now clear.`}`);
  };

  const handleAutoOptimize = () => {
    // AI finds the first empty platform and locks route
    const emptyPf = station.platforms.find(p => getTrackStatus(p.trackId) === 'CLEAR');
    if (emptyPf) {
      handleSetRoute(station.signals[0]?.id || 'S-H1', emptyPf.id);
      addLog(`🤖 AI OPTIMIZER (${station.code}): Automatically routed incoming train to clear ${emptyPf.label} (${emptyPf.type}).`);
    } else {
      addLog(`⚠️ AI OPTIMIZER (${station.code}): All platforms occupied. Recommending holding at outer Home signal.`);
    }
  };

  const handleResetPanel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setReleaseTimer(null);
    setLockedRoute(null);
    const asp = {};
    const pts = {};
    const trks = {};
    const trns = {};
    Object.keys(STATIONS_DATA).forEach(code => {
      const stn = STATIONS_DATA[code];
      stn.signals.forEach(s => { asp[`${code}-${s.id}`] = s.aspect; });
      stn.points.forEach(p => { pts[`${code}-${p.id}`] = p.pos; });
      stn.tracks.forEach(t => {
        trks[t.id] = t.status;
        trns[t.id] = t.train || null;
      });
    });
    setAspects(asp);
    setPoints(pts);
    setTracks(trks);
    setTrainData(trns);
    addLog(`Panel reset to standard baseline for all stations.`);
  };

  const occupiedTracks = station.tracks.filter(t => getTrackStatus(t.id) === 'OCCUPIED');

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP STATION CONTROL HEADER WITH REAL JUNCTION GEOGRAPHY                */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Monitor className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  {station.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-400">{station.code}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase text-[10px]">
                    Simulation Environment &bull; No Live Control
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{station.zone} • {station.division} • {station.description}</p>
              </div>
            </div>
            <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-200/90 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Operational Simulation Mode:</strong> This panel simulates electronic interlocking (EI) logic, route proving, and Multi-Aspect Colour Light Signals (MACLS) for testing decision scenarios. No live track or signalling equipment is directly actuated.
              </span>
            </div>
          </div>

          {/* Station selector buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(STATIONS_DATA).map(code => (
              <button
                key={code}
                onClick={() => handleStationSwitch(code)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                  stationCode === code
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                {STATIONS_DATA[code].name} ({STATIONS_DATA[code].platforms.length} PFs)
              </button>
            ))}

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <button
              onClick={handleAutoOptimize}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
              title="AI Automatically aligns points and clears route for approach"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto Route AI
            </button>

            <button
              onClick={handleSimulateIncoming}
              className="px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/40 text-blue-300 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" /> Simulate Train
            </button>

            <button
              onClick={handleResetPanel}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-all"
              title="Reset Yard Interlocking"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RDSO Data Logger SCADA Hardware Telemetry Banner */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-sans">RDSO SCADA Interlocking Feed:</span>
            <span className="text-cyan-300 font-bold">{dataloggerStatus.vendor}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{dataloggerStatus.protocol}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Unit: <strong className="text-emerald-400 font-mono">{dataloggerStatus.dataloggerId}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Baud: <strong className="text-amber-400">{dataloggerStatus.baudRate}</strong></span>
          </div>
        </div>

        {/* Live VDU Status Strip */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Interlocking VDU:</span>
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {station.code} Online
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Route Interlock:</span>
            {lockedRoute ? (
              <span className="font-mono font-bold text-cyan-400 flex items-center gap-1 truncate">
                <Lock className="w-3 h-3 text-cyan-400 shrink-0" /> {lockedRoute} {releaseTimer && `(${releaseTimer}s)`}
              </span>
            ) : (
              <span className="font-mono text-slate-500 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Normal Unlocked
              </span>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Platforms Occupied:</span>
            <span className={`font-mono font-bold ${occupiedTracks.length > 0 ? 'text-pink-400' : 'text-slate-400'}`}>
              {occupiedTracks.length} / {station.platforms.length} Berths
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 font-medium">Line Geography:</span>
            <span className="font-mono font-bold text-cyan-300 truncate">
              {station.mainLines.length} Converging Routes
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC STATION-SPECIFIC YARD VDU SCHEMATIC                          */}
      {/* ========================================================================= */}
      <Card accent="cyan" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 -m-6 mb-0 rounded-t-2xl">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {station.name} ({station.code}) — Electronic Interlocking Live Yard Layout
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive Yard VDU: Click any track circuit to toggle occupancy, click signals to cycle aspect, click points to throw turnouts.
            </p>
          </div>

          {/* VDU Map Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-slate-600 rounded-full" />
              <span className="text-slate-400">Clear</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-pink-500 rounded-full animate-pulse" />
              <span className="text-pink-400 font-bold">Occupied Rake</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-white rounded-full shadow-sm shadow-white" />
              <span className="text-white font-bold">Route Locked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Green</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-400">Red</span>
            </div>
          </div>
        </div>

        {/* Dynamic Station-Specific SVG Renderer */}
        <div className="p-4 sm:p-6 bg-slate-950 overflow-x-auto select-none rounded-b-2xl mt-6 border border-slate-800">
          <div className="min-w-[920px] relative">
            {stationCode === 'BPL' && (
              <BhopalYardDiagram
                station={station}
                getSignalAspect={getSignalAspect}
                getPointPos={getPointPos}
                getTrackStatus={getTrackStatus}
                getTrackTrain={getTrackTrain}
                toggleSignal={toggleSignal}
                togglePoint={togglePoint}
                toggleTrackOccupancy={toggleTrackOccupancy}
              />
            )}

            {stationCode === 'BZA' && (
              <VijayawadaYardDiagram
                station={station}
                getSignalAspect={getSignalAspect}
                getPointPos={getPointPos}
                getTrackStatus={getTrackStatus}
                getTrackTrain={getTrackTrain}
                toggleSignal={toggleSignal}
                togglePoint={togglePoint}
                toggleTrackOccupancy={toggleTrackOccupancy}
              />
            )}

            {stationCode === 'NDLS' && (
              <NewDelhiYardDiagram
                station={station}
                getSignalAspect={getSignalAspect}
                getPointPos={getPointPos}
                getTrackStatus={getTrackStatus}
                getTrackTrain={getTrackTrain}
                toggleSignal={toggleSignal}
                togglePoint={togglePoint}
                toggleTrackOccupancy={toggleTrackOccupancy}
              />
            )}
          </div>
        </div>

        {/* Quick Help Footer */}
        <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 -m-6 mt-4 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Station-specific track topology rendered with real Indian Railways platform configurations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Multi-Aspect Colour Light Signals (MACLS) proved fail-safe with interlocking interlocking</span>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE CONTROLS & NX CONSOLE (Tabs)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Operational Consoles */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {[
              { id: 'vdu', label: 'Entrance-Exit (NX) Console', icon: RouteIcon },
              { id: 'signals', label: 'MACLS Signal Panel', icon: Radio },
              { id: 'points', label: 'Point Machines', icon: ArrowRightLeft },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: NX ROUTE SETTING CONSOLE */}
          {activeTab === 'vdu' && (
            <Card accent="emerald">
              <SectionHeader
                icon={RouteIcon}
                iconColor="emerald"
                title={`${station.name} — Entrance-Exit (NX) Route Interlocking`}
                description="Select Approach Entrance Signal and Destination Platform to automatically throw motor points and prove route."
              />

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Entrance Selector */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" /> 1. Select Entrance Signal
                    </label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {station.signals.filter(s => s.type === 'HOME').map(sig => (
                        <button
                          key={sig.id}
                          onClick={() => setSelectedEntrance(sig.id)}
                          className={`w-full p-2.5 rounded-lg text-xs font-medium border text-left transition-all flex items-center justify-between ${
                            selectedEntrance === sig.id
                              ? 'bg-cyan-500/10 border-cyan-500 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{sig.name}</span>
                            <p className="text-[10px] text-slate-500">{sig.desc}</p>
                          </div>
                          {selectedEntrance === sig.id && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exit Platform Selector */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-400" /> 2. Select Platform Berth ({station.platforms.length} PFs)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                      {station.platforms.map(pf => {
                        const isOcc = getTrackStatus(pf.trackId) === 'OCCUPIED';
                        const isSelected = selectedExit === pf.id;

                        return (
                          <button
                            key={pf.id}
                            onClick={() => setSelectedExit(pf.id)}
                            className={`p-2 rounded-lg text-xs border text-left transition-all ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{pf.id}</span>
                              <span className={`text-[9px] px-1 rounded font-mono ${isOcc ? 'bg-pink-500/20 text-pink-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {isOcc ? 'OCC' : 'CLR'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{pf.type}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Command Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleSetRoute(selectedEntrance, selectedExit)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Set & Lock Route ({selectedEntrance} ➔ {selectedExit} at {station.name})
                  </button>

                  {lockedRoute && (
                    <button
                      onClick={handleEmergencyRouteRelease}
                      className="py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 hover:bg-red-500/20 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <Timer className="w-4 h-4 text-red-400" /> Emergency Release
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: MACLS SIGNAL PANEL */}
          {activeTab === 'signals' && (
            <Card accent="cyan">
              <SectionHeader
                icon={Radio}
                iconColor="cyan"
                title={`${station.name} — MACLS 4-Aspect Signals`}
                description="Direct signal aspect override with fail-safe proofing."
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {station.signals.map(s => {
                  const currentAspect = getSignalAspect(s.id);
                  const aspectData = ASPECTS[currentAspect] || ASPECTS.RED;

                  return (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: aspectData.color }} />
                            {s.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{s.desc}</p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{ backgroundColor: `${aspectData.color}20`, color: aspectData.color }}
                        >
                          {currentAspect}
                        </span>
                      </div>

                      {/* Aspect Selection Buttons */}
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {['RED', 'YELLOW', 'DOUBLE_YELLOW', 'GREEN'].map(asp => (
                          <button
                            key={asp}
                            onClick={() => setSignalAspectDirect(s.id, asp)}
                            className={`py-1 rounded text-[9px] font-bold border transition-all ${
                              currentAspect === asp
                                ? 'border-white text-white'
                                : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                            }`}
                            style={{
                              backgroundColor: currentAspect === asp ? `${ASPECTS[asp].color}35` : '#0f172a'
                            }}
                          >
                            {asp === 'DOUBLE_YELLOW' ? 'DBL YEL' : asp}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 3: POINT MACHINES */}
          {activeTab === 'points' && (
            <Card accent="blue">
              <SectionHeader
                icon={ArrowRightLeft}
                iconColor="blue"
                title={`${station.name} — Motor Point Machines`}
                description="Electrically operated turnout crossovers for route setting."
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {station.points.map(pt => {
                  const pos = getPointPos(pt.id);
                  const isRev = pos === 'reverse';

                  return (
                    <div key={pt.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-blue-400" /> {pt.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{pt.desc}</p>
                      </div>

                      <button
                        onClick={() => togglePoint(pt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                          isRev
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {isRev ? 'REVERSE ⇋' : 'NORMAL ➔'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right 5 Columns: AI Assistant & Real-Time Event Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Conflict & Safety Guardian */}
          <Card accent="cyan">
            <SectionHeader
              icon={ShieldAlert}
              iconColor="cyan"
              title="AI Section Controller Assistant"
              description={`Live safety interlocking analysis for ${station.name}`}
            />

            <div className="mt-3 space-y-3">
              {/* Active Occupancy Summary */}
              {occupiedTracks.length > 0 ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-pink-500/30 space-y-2">
                  <p className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-pink-400" /> Active Rakes in {station.code} Yard:
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {occupiedTracks.map(t => (
                      <div key={t.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-white">{t.label}</span>
                          <span className="text-slate-400 text-[11px] ml-1.5">({t.name})</span>
                        </div>
                        <span className="text-[11px] font-bold text-pink-300">{getTrackTrain(t.id) || 'Occupied'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All platform berths and approach lines at {station.name} are clear.</span>
                </div>
              )}

              {/* AI Recommendation Message */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> AI Interlocking Advisory:
                </div>
                <p className="text-slate-300">
                  {lockedRoute
                    ? `Active Route [${lockedRoute}] proved safe on ${station.name} interlocking matrix. Points locked with electronic route holding.`
                    : `Yard capacity at ${station.code} is optimal with ${station.platforms.length - occupiedTracks.length} free platform berths. Ready for train dispatch or reception.`}
                </p>
              </div>
            </div>
          </Card>

          {/* Live Interlocking Event Log */}
          <Card>
            <SectionHeader
              icon={Activity}
              iconColor="blue"
              title="Interlocking Event Log"
              description="Live VDU sequence ledger"
            />

            <div className="mt-3 bg-slate-950 rounded-xl border border-slate-800 p-3 h-48 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {logMessages.map(log => (
                <div key={log.id} className="flex items-start gap-2 text-slate-400 border-b border-slate-900/80 pb-1">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={log.msg.includes('🚨') ? 'text-red-400' : log.msg.includes('✅') ? 'text-emerald-400' : log.msg.includes('⚡') ? 'text-yellow-400' : 'text-slate-300'}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. BHOPAL JN (BPL) YARD VDU SCHEMATIC (6 Platforms + NSP Chord)     */
/* ------------------------------------------------------------------ */
function BhopalYardDiagram({ station, getSignalAspect, getPointPos, getTrackStatus, getTrackTrain, toggleSignal, togglePoint, toggleTrackOccupancy }) {
  return (
    <svg viewBox="0 0 940 380" className="w-full h-auto drop-shadow-2xl" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <rect width="940" height="380" fill="#020617" rx="12" />

      {/* Yard Boundary & River / Landmark Labels */}
      <text x="30" y="30" fill="#38bdf8" fontSize="12" fontWeight="black">BHOPAL JN (BPL) • WCR YARD INTERLOCKING</text>
      <text x="750" y="30" fill="#94a3b8" fontSize="9" fontWeight="bold">TO BINA / JHANSI ➔</text>
      <text x="30" y="365" fill="#94a3b8" fontSize="9" fontWeight="bold">← TO ITARSI / NAGPUR</text>
      <text x="720" y="70" fill="#c084fc" fontSize="9" fontWeight="bold">⤹ NISHATPURA CHORD (TO UJJAIN)</text>

      {/* UP MAIN (Itarsi Up 101T) */}
      <TrackLine
        x1={30} y1={90} x2={900} y2={90}
        trackId="BPL-101T"
        label="UP MAIN (to Bina)"
        status={getTrackStatus('BPL-101T')}
        train={getTrackTrain('BPL-101T')}
        onClick={() => toggleTrackOccupancy('BPL-101T')}
      />

      {/* DOWN MAIN (Bina Dn 2AT) */}
      <TrackLine
        x1={30} y1={310} x2={900} y2={310}
        trackId="BPL-2AT"
        label="DOWN MAIN (to Itarsi)"
        status={getTrackStatus('BPL-2AT')}
        train={getTrackTrain('BPL-2AT')}
        onClick={() => toggleTrackOccupancy('BPL-2AT')}
      />

      {/* NISHATPURA CHORD (BPL-NSP) */}
      <g className="cursor-pointer" onClick={() => toggleTrackOccupancy('BPL-NSP')}>
        <path d="M 680 90 L 740 50 L 900 50" fill="none" stroke={getTrackStatus('BPL-NSP') === 'OCCUPIED' ? '#f43f5e' : getTrackStatus('BPL-NSP') === 'ROUTE_LOCKED' ? '#38bdf8' : '#6b21a8'} strokeWidth="3" strokeDasharray="4 2" />
        <text x="780" y="44" fill="#c084fc" fontSize="8" fontWeight="bold">NSP CHORD (BPL-NSP)</text>
      </g>

      {/* 6 PLATFORM BERTHS (PF 1 to PF 6) */}
      {station.platforms.map((pf, idx) => {
        const y = 130 + idx * 28;
        const status = getTrackStatus(pf.trackId);
        const train = getTrackTrain(pf.trackId);

        return (
          <g key={pf.id} className="cursor-pointer" onClick={() => toggleTrackOccupancy(pf.trackId)}>
            <rect x="220" y={y - 10} width="460" height="20" rx="3" fill="#090e1a" stroke="#1e293b" strokeWidth="1" />
            <line x1="230" y1={y} x2="670" y2={y} stroke={status === 'OCCUPIED' ? '#f43f5e' : status === 'ROUTE_LOCKED' ? '#38bdf8' : '#475569'} strokeWidth="4" />
            
            {/* PF Badge */}
            <rect x="235" y={y - 8} width="45" height="16" rx="3" fill="#1e293b" />
            <text x="257" y={y + 3} fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">{pf.id}</text>
            <text x="290" y={y + 3} fill="#64748b" fontSize="8" fontWeight="mono">{pf.trackId}</text>

            {train && (
              <g>
                <rect x="360" y={y - 8} width="280" height="16" rx="3" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
                <text x="500" y={y + 3} fill="#ffe4e6" fontSize="9" fontWeight="bold" textAnchor="middle">🚆 {train}</text>
              </g>
            )}

            {/* Inbound Crossover */}
            <line x1="170" y1={idx < 3 ? 90 : 310} x2="230" y2={y} stroke={getPointPos('101') === 'reverse' ? '#22c55e' : '#334155'} strokeWidth="2" strokeDasharray="3 3" />
            {/* Outbound Crossover */}
            <line x1="670" y1={y} x2="730" y2={idx < 3 ? 90 : 310} stroke={getPointPos('103') === 'reverse' ? '#22c55e' : '#334155'} strokeWidth="2" strokeDasharray="3 3" />
          </g>
        );
      })}

      {/* Points & Signals */}
      {renderPointBox(170, 90, 'Pt 101A/B', getPointPos('101'), () => togglePoint('101'))}
      {renderPointBox(170, 310, 'Pt 102A/B', getPointPos('102'), () => togglePoint('102'))}
      {renderPointBox(730, 90, 'Pt 103A/B', getPointPos('103'), () => togglePoint('103'))}

      {/* Signals */}
      {renderSignalMast(100, 55, 'S-H1', getSignalAspect('S-H1'), 'Home S-H1 (ET)', () => toggleSignal('S-H1'))}
      {renderSignalMast(100, 335, 'S-H2', getSignalAspect('S-H2'), 'Home S-H2 (Bina)', () => toggleSignal('S-H2'), true)}
      {renderSignalMast(850, 25, 'S-H3', getSignalAspect('S-H3'), 'Home NSP', () => toggleSignal('S-H3'))}

      {/* Platform Starters */}
      {station.platforms.slice(0, 4).map((pf, idx) => (
        <React.Fragment key={`sig-${pf.id}`}>
          {renderSignalMast(685, 120 + idx * 28, `S-ST${idx + 1}`, getSignalAspect(`S-ST${idx + 1}`), `ST${idx + 1}`, () => toggleSignal(`S-ST${idx + 1}`))}
        </React.Fragment>
      ))}

      {renderSignalMast(820, 55, 'S-AS1', getSignalAspect('S-AS1'), 'Adv S-AS1', () => toggleSignal('S-AS1'))}
      {renderSignalMast(820, 335, 'S-AS2', getSignalAspect('S-AS2'), 'Adv S-AS2', () => toggleSignal('S-AS2'), true)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 2. VIJAYAWADA JN (BZA) YARD VDU SCHEMATIC (ALL 10 Platforms + River) */
/* ------------------------------------------------------------------ */
function VijayawadaYardDiagram({ station, getSignalAspect, getPointPos, getTrackStatus, getTrackTrain, toggleSignal, togglePoint, toggleTrackOccupancy }) {
  return (
    <svg viewBox="0 0 940 480" className="w-full h-auto drop-shadow-2xl" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <rect width="940" height="480" fill="#020617" rx="12" />

      {/* Yard Boundary & Landmark Badges */}
      <text x="30" y="25" fill="#38bdf8" fontSize="12" fontWeight="black">VIJAYAWADA JN (BZA) • 10-PF 4-WAY RIVER INTERLOCKING</text>
      <text x="740" y="25" fill="#94a3b8" fontSize="9" fontWeight="bold">TO VISAKHAPATNAM (VSKP) ➔</text>
      <text x="30" y="465" fill="#06b6d4" fontSize="9" fontWeight="bold">≈ KRISHNA RIVER BRIDGE (TO CHENNAI MAS)</text>
      <text x="30" y="60" fill="#f59e0b" fontSize="9" fontWeight="bold">⤹ FROM HYDERABAD (KAZIPET)</text>
      <text x="740" y="465" fill="#10b981" fontSize="9" fontWeight="bold">TO GUNTUR (GNT) ➔</text>

      {/* KRISHNA RIVER VISUAL STRIP */}
      <path d="M 20 430 Q 150 410 300 435 T 600 425 T 920 430" fill="none" stroke="#0369a1" strokeWidth="6" opacity="0.3" />
      <text x="450" y="435" fill="#38bdf8" fontSize="8" fontWeight="bold" opacity="0.5" textAnchor="middle">≈ ≈ KRISHNA RIVER CHANNEL (10-PF SCR HUB) ≈ ≈</text>

      {/* VSKP DOWN (North Trunk) */}
      <TrackLine
        x1={30} y1={70} x2={900} y2={70}
        trackId="BZA-VSKP"
        label="VSKP DN (to Eluru/Rajahmundry)"
        status={getTrackStatus('BZA-VSKP')}
        train={getTrackTrain('BZA-VSKP')}
        onClick={() => toggleTrackOccupancy('BZA-VSKP')}
      />

      {/* MAS UP (Chennai Bridge Line) */}
      <TrackLine
        x1={30} y1={395} x2={900} y2={395}
        trackId="BZA-MAS"
        label="MAS UP (from Tenali/Chennai)"
        status={getTrackStatus('BZA-MAS')}
        train={getTrackTrain('BZA-MAS')}
        onClick={() => toggleTrackOccupancy('BZA-MAS')}
      />

      {/* HYDERABAD / KAZIPET INBOUND */}
      <g className="cursor-pointer" onClick={() => toggleTrackOccupancy('BZA-HYB')}>
        <path d="M 30 100 L 150 100 L 210 120" fill="none" stroke={getTrackStatus('BZA-HYB') === 'OCCUPIED' ? '#f43f5e' : getTrackStatus('BZA-HYB') === 'ROUTE_LOCKED' ? '#38bdf8' : '#d97706'} strokeWidth="3" />
        <text x="50" y="94" fill="#fbbf24" fontSize="8" fontWeight="bold">HYD KAZIPET (BZA-HYB)</text>
      </g>

      {/* ALL 10 PLATFORM BERTHS (PF 1 to PF 10) */}
      {station.platforms.map((pf, idx) => {
        const y = 100 + idx * 27;
        const status = getTrackStatus(pf.trackId);
        const train = getTrackTrain(pf.trackId);

        return (
          <g key={pf.id} className="cursor-pointer" onClick={() => toggleTrackOccupancy(pf.trackId)}>
            <rect x="220" y={y - 9} width="460" height="18" rx="3" fill="#090e1a" stroke="#1e293b" strokeWidth="1" />
            <line x1="230" y1={y} x2="670" y2={y} stroke={status === 'OCCUPIED' ? '#f43f5e' : status === 'ROUTE_LOCKED' ? '#38bdf8' : '#475569'} strokeWidth="3.5" />
            
            <rect x="235" y={y - 7} width="42" height="14" rx="2" fill="#1e293b" />
            <text x="256" y={y + 3} fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">{pf.id}</text>
            <text x="290" y={y + 3} fill="#64748b" fontSize="7" fontWeight="mono">{pf.trackId}</text>

            {train && (
              <g>
                <rect x="350" y={y - 7} width="290" height="14" rx="3" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
                <text x="495" y={y + 3} fill="#ffe4e6" fontSize="8" fontWeight="bold" textAnchor="middle">🚆 {train}</text>
              </g>
            )}

            <line x1="170" y1={idx < 5 ? 70 : 395} x2="230" y2={y} stroke={getPointPos('201') === 'reverse' ? '#22c55e' : '#334155'} strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="670" y1={y} x2="730" y2={idx < 5 ? 70 : 395} stroke={getPointPos('202') === 'reverse' ? '#22c55e' : '#334155'} strokeWidth="1.5" strokeDasharray="3 3" />
          </g>
        );
      })}

      {/* Point Turnout Boxes */}
      {renderPointBox(170, 70, 'Pt 201', getPointPos('201'), () => togglePoint('201'))}
      {renderPointBox(170, 395, 'Pt 202', getPointPos('202'), () => togglePoint('202'))}
      {renderPointBox(730, 70, 'Pt 203', getPointPos('203'), () => togglePoint('203'))}
      {renderPointBox(730, 395, 'Pt 204', getPointPos('204'), () => togglePoint('204'))}

      {/* Signals */}
      {renderSignalMast(90, 42, 'S-H1', getSignalAspect('S-H1'), 'Home MAS', () => toggleSignal('S-H1'))}
      {renderSignalMast(90, 415, 'S-H2', getSignalAspect('S-H2'), 'Home VSKP', () => toggleSignal('S-H2'), true)}
      {renderSignalMast(110, 120, 'S-H3', getSignalAspect('S-H3'), 'Home HYB', () => toggleSignal('S-H3'))}

      {/* Starters */}
      {station.platforms.slice(0, 6).map((pf, idx) => (
        <React.Fragment key={`bza-sig-${pf.id}`}>
          {renderSignalMast(685, 92 + idx * 27, `S-ST${idx + 1}`, getSignalAspect(`S-ST${idx + 1}`), `ST${idx + 1}`, () => toggleSignal(`S-ST${idx + 1}`))}
        </React.Fragment>
      ))}

      {renderSignalMast(820, 42, 'S-AS1', getSignalAspect('S-AS1'), 'Adv MAS', () => toggleSignal('S-AS1'))}
      {renderSignalMast(820, 415, 'S-AS2', getSignalAspect('S-AS2'), 'Adv VSKP', () => toggleSignal('S-AS2'), true)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 3. NEW DELHI (NDLS) YARD VDU SCHEMATIC (ALL 16 Platforms + Throats) */
/* ------------------------------------------------------------------ */
function NewDelhiYardDiagram({ station, getSignalAspect, getPointPos, getTrackStatus, getTrackTrain, toggleSignal, togglePoint, toggleTrackOccupancy }) {
  return (
    <svg viewBox="0 0 940 570" className="w-full h-auto drop-shadow-2xl" style={{ fontFamily: 'ui-monospace, monospace' }}>
      <rect width="940" height="570" fill="#020617" rx="12" />

      {/* Yard Boundary & Landmark Labels */}
      <text x="30" y="24" fill="#38bdf8" fontSize="12" fontWeight="black">NEW DELHI (NDLS) • ALL 16-PLATFORM FLAGSHIP QUAD-THROAT VDU</text>
      <text x="690" y="24" fill="#94a3b8" fontSize="9" fontWeight="bold">TO SADAR BAZAR / GHAZIABAD (GZB) ➔</text>
      <text x="30" y="555" fill="#94a3b8" fontSize="9" fontWeight="bold">← TO TILAK BRIDGE / HAZRAT NIZAMUDDIN (TKD)</text>
      <text x="30" y="55" fill="#ec4899" fontSize="8" fontWeight="bold">[PAHARGANJ SIDE - WEST WING: PF 1 - 5]</text>
      <text x="300" y="55" fill="#38bdf8" fontSize="8" fontWeight="bold">[CENTRAL CORE: PF 6 - 10]</text>
      <text x="560" y="55" fill="#10b981" fontSize="8" fontWeight="bold">[AJMERI GATE SIDE - EAST WING: PF 11 - 16]</text>

      {/* TILAK BRIDGE QUAD 1 (Fast Up) */}
      <TrackLine
        x1={30} y1={72} x2={900} y2={72}
        trackId="NDLS-TKD1"
        label="TKD QUAD 1 (Fast Up from NZM/BCT)"
        status={getTrackStatus('NDLS-TKD1')}
        train={getTrackTrain('NDLS-TKD1')}
        onClick={() => toggleTrackOccupancy('NDLS-TKD1')}
      />

      {/* GHAZIABAD QUAD 1 (Fast Dn) */}
      <TrackLine
        x1={30} y1={515} x2={900} y2={515}
        trackId="NDLS-GZB1"
        label="GZB QUAD 1 (Fast Dn to Kanpur/Howrah)"
        status={getTrackStatus('NDLS-GZB1')}
        train={getTrackTrain('NDLS-GZB1')}
        onClick={() => toggleTrackOccupancy('NDLS-GZB1')}
      />

      {/* ALL 16 PLATFORM BERTHS (PF 1 to PF 16) */}
      {station.platforms.map((pf, idx) => {
        const y = 98 + idx * 25;
        const status = getTrackStatus(pf.trackId);
        const train = getTrackTrain(pf.trackId);

        return (
          <g key={pf.id} className="cursor-pointer" onClick={() => toggleTrackOccupancy(pf.trackId)}>
            <rect x="220" y={y - 9} width="460" height="18" rx="3" fill="#090e1a" stroke="#1e293b" strokeWidth="1" />
            <line x1="230" y1={y} x2="670" y2={y} stroke={status === 'OCCUPIED' ? '#f43f5e' : status === 'ROUTE_LOCKED' ? '#38bdf8' : '#475569'} strokeWidth="3" />
            
            <rect x="235" y={y - 7} width="44" height="14" rx="2" fill="#1e293b" />
            <text x="257" y={y + 3} fill="#e2e8f0" fontSize="8" fontWeight="bold" textAnchor="middle">{pf.id}</text>
            <text x="290" y={y + 3} fill="#64748b" fontSize="7" fontWeight="mono">{pf.trackId}</text>

            {train && (
              <g>
                <rect x="350" y={y - 7} width="290" height="14" rx="3" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
                <text x="495" y={y + 3} fill="#ffe4e6" fontSize="8" fontWeight="bold" textAnchor="middle">🚆 {train}</text>
              </g>
            )}

            <line x1="170" y1={idx < 8 ? 72 : 515} x2="230" y2={y} stroke={getPointPos('301') === 'reverse' ? '#22c55e' : '#334155'} strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="670" y1={y} x2="730" y2={idx < 8 ? 72 : 515} stroke={getPointPos('302') === 'reverse' ? '#22c55e' : '#334155'} strokeWidth="1.2" strokeDasharray="3 3" />
          </g>
        );
      })}

      {/* Quad Throat Points */}
      {renderPointBox(170, 72, 'Pt 301', getPointPos('301'), () => togglePoint('301'))}
      {renderPointBox(170, 515, 'Pt 302', getPointPos('302'), () => togglePoint('302'))}
      {renderPointBox(730, 72, 'Pt 303', getPointPos('303'), () => togglePoint('303'))}
      {renderPointBox(730, 515, 'Pt 304', getPointPos('304'), () => togglePoint('304'))}

      {/* Signals */}
      {renderSignalMast(90, 45, 'S-H1', getSignalAspect('S-H1'), 'Home TKD1', () => toggleSignal('S-H1'))}
      {renderSignalMast(90, 535, 'S-H3', getSignalAspect('S-H3'), 'Home GZB1', () => toggleSignal('S-H3'), true)}

      {/* Starters */}
      {[1, 2, 3, 5, 12, 14, 16].map((num) => {
        const idx = num - 1;
        const sigId = `S-ST${num}`;
        return (
          <React.Fragment key={`ndls-sig-${sigId}`}>
            {renderSignalMast(685, 90 + idx * 25, sigId, getSignalAspect(sigId), `ST${num}`, () => toggleSignal(sigId))}
          </React.Fragment>
        );
      })}

      {renderSignalMast(820, 45, 'S-AS1', getSignalAspect('S-AS1'), 'Adv TKD', () => toggleSignal('S-AS1'))}
      {renderSignalMast(820, 535, 'S-AS2', getSignalAspect('S-AS2'), 'Adv GZB', () => toggleSignal('S-AS2'), true)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Generic Reusable Track Line Component                              */
/* ------------------------------------------------------------------ */
function TrackLine({ x1, y1, x2, y2, label, status, train, onClick }) {
  const isOcc = status === 'OCCUPIED';
  const isLock = status === 'ROUTE_LOCKED';
  const color = isOcc ? '#f43f5e' : isLock ? '#38bdf8' : '#334155';

  return (
    <g className="cursor-pointer" onClick={onClick}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isLock ? '#ffffff' : color} strokeWidth="2" strokeDasharray={isLock ? '6 4' : 'none'} />
      <polygon points={`${x2 - 5},${y1 - 5} ${x2 + 5},${y1} ${x2 - 5},${y1 + 5}`} fill={color} />

      <rect x={x1 + 10} y={y1 - 22} width="160" height="16" rx="3" fill="#090d16" stroke={color} strokeWidth="1" />
      <text x={x1 + 15} y={y1 - 10} fill={isOcc ? '#fda4af' : isLock ? '#7dd3fc' : '#94a3b8'} fontSize="9" fontWeight="bold">
        {label}
      </text>

      {train && (
        <g>
          <rect x={x1 + 320} y={y1 - 22} width="240" height="18" rx="4" fill="#881337" stroke="#f43f5e" strokeWidth="1.5" />
          <text x={x1 + 440} y={y1 - 9} fill="#ffe4e6" fontSize="9" fontWeight="bold" textAnchor="middle">🚆 {train}</text>
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Helper to render Point Turnout Diamonds                             */
/* ------------------------------------------------------------------ */
function renderPointBox(x, y, name, pos, onClick) {
  const isRev = pos === 'reverse';
  return (
    <g className="cursor-pointer" onClick={onClick}>
      <polygon
        points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
        fill={isRev ? '#15803d' : '#1e293b'}
        stroke={isRev ? '#22c55e' : '#64748b'}
        strokeWidth="2"
      />
      <text x={x} y={y < 200 ? y - 12 : y + 18} fill={isRev ? '#4ade80' : '#94a3b8'} fontSize="8" fontWeight="bold" textAnchor="middle">
        {name} ({isRev ? 'REV' : 'NORM'})
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Helper to render realistic 4-Aspect MACLS Signal Mast on SVG        */
/* ------------------------------------------------------------------ */
function renderSignalMast(x, y, id, aspect, label, onClick, isDownward = false) {
  const isGreen = aspect === 'GREEN';
  const isYellow = aspect === 'YELLOW';
  const isDoubleYellow = aspect === 'DOUBLE_YELLOW';
  const isRed = aspect === 'RED';

  return (
    <g className="cursor-pointer group" onClick={onClick}>
      {/* Signal Post / Mast */}
      <line x1={x} y1={y} x2={x} y2={isDownward ? y - 24 : y + 24} stroke="#64748b" strokeWidth="2.5" />
      <line x1={x - 4} y1={isDownward ? y - 24 : y + 24} x2={x + 4} y2={isDownward ? y - 24 : y + 24} stroke="#64748b" strokeWidth="2" />

      {/* Signal Head Housing */}
      <rect x={x - 6} y={y - 12} width="12" height="24" rx="2" fill="#020617" stroke="#334155" strokeWidth="1.5" />

      {/* 4 Aspect Lenses */}
      <circle cx={x} cy={y - 8} r="2.2" fill={isGreen ? '#22c55e' : '#14532d'} opacity={isGreen ? 1 : 0.4} />
      <circle cx={x} cy={y - 3} r="2.2" fill={isYellow || isDoubleYellow ? '#eab308' : '#713f12'} opacity={isYellow || isDoubleYellow ? 1 : 0.4} />
      <circle cx={x} cy={y + 2} r="2.2" fill={isDoubleYellow ? '#facc15' : '#713f12'} opacity={isDoubleYellow ? 1 : 0.4} />
      <circle cx={x} cy={y + 7} r="2.2" fill={isRed ? '#ef4444' : '#7f1d1d'} opacity={isRed ? 1 : 0.4} />

      {/* Signal ID Label */}
      <text x={x} y={isDownward ? y + 16 : y - 16} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}
