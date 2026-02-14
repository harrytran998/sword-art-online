# Sword Art Online
## Product Requirements Document (PRD)

**Version:** 1.0.0  
**Date:** February 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Target Audience](#3-target-audience)
4. [SAO Universe & Lore](#4-sao-universe--lore)
5. [Core Gameplay Features](#5-core-gameplay-features)
6. [Character System](#6-character-system)
7. [Combat System](#7-combat-system)
8. [Progression System](#8-progression-system)
9. [Social Features](#9-social-features)
10. [Economy System](#10-economy-system)
11. [Technical Requirements](#11-technical-requirements)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Success Metrics](#13-success-metrics)
14. [Risk Assessment](#14-risk-assessment)

---

## 1. Executive Summary

### 1.1 Product Overview

**Sword Art Online** is a browser-based MMORPG inspired by the Sword Art Online anime/light novel series. Players explore the floating castle of Aincrad, a 100-floor structure with diverse environments, challenging bosses, and a deep combat system based on the SAO "Sword Skills" mechanic.

### 1.2 Key Differentiators

| Feature | Description |
|---------|-------------|
| **Sword Skills System** | Authentic SAO combat with pre-motion recognition, auto-execution, and post-motion vulnerability |
| **100-Floor Progression** | Each floor unique environment, boss encounters, and lore |
| **Server-Authoritative** | Zero tolerance for cheating - all game logic validated server-side |
| **Browser-Native** | No downloads required, runs on any modern browser |
| **Real-Time Combat** | 60-tick server simulation with WebSocket communication |

### 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun (JavaScript/TypeScript runtime) |
| **Backend Framework** | Effect-TS (functional programming, DI, error handling) |
| **Real-Time Communication** | Bun WebSocket with native Pub/Sub |
| **Database** | PostgreSQL (persistent) + Redis (hot data) + TimescaleDB (analytics) |
| **Frontend** | React + TypeScript + Tailwind CSS |
| **Game Engine** | Custom Canvas/WebGL renderer |

---

## 2. Product Vision

### 2.1 Vision Statement

> *"Experience the world of Aincrad as if you were truly there - a living, breathing MMORPG where skill matters, progression feels earned, and every floor conquered is a community achievement."*

### 2.2 Design Philosophy

1. **Authenticity First**: Faithful to SAO's game mechanics and lore
2. **Skill-Based Combat**: Player skill determines outcomes, not pay-to-win
3. **Community-Driven**: Bosses require coordination, economy is player-driven
4. **Security Obsessed**: Server-authoritative architecture with zero tolerance for cheating
5. **Accessible**: Browser-native, no downloads, cross-platform

### 2.3 Core Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                       SWORD ART ONLINE                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   IMMERSION     │    COMMUNITY    │      CHALLENGE          │
│                 │                 │                         │
│ • 100 unique    │ • Party system  │ • Skill-based combat    │
│   floors        │ • Guild wars    │ • Server-authoritative  │
│ • SAO lore      │ • Player        │ • Anti-cheat measures   │
│ • Living world  │   economy       │ • No P2W mechanics      │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## 3. Target Audience

### 3.1 Primary Audience

| Segment | Description | Motivation |
|---------|-------------|------------|
| **SAO Fans** | Anime/manga enthusiasts | Experience the SAO world authentically |
| **MMO Veterans** | Experienced MMORPG players | Looking for skill-based, non-P2W experience |
| **Competitive Gamers** | Esports/ranked players | PvP tournaments, leaderboards |
| **Social Gamers** | Community-focused players | Guild activities, cooperative boss raids |

### 3.2 Player Personas

#### Persona 1: "The Clearer" (Hardcore)
- **Age:** 18-35
- **Playtime:** 20+ hours/week
- **Goals:** Floor clearing, boss raids, high rankings
- **Needs:** Challenging content, recognition, competitive balance

#### Persona 2: "The Socializer" (Casual)
- **Age:** 16-40
- **Playtime:** 5-15 hours/week
- **Goals:** Making friends, guild activities, exploring
- **Needs:** Accessible content, social features, customization

#### Persona 3: "The Crafter" (Economy)
- **Age:** 20-45
- **Playtime:** 10-20 hours/week
- **Goals:** Crafting, trading, wealth accumulation
- **Needs:** Deep crafting system, stable economy, trading tools

---

## 4. SAO Universe & Lore

### 4.1 The World of Aincrad

**Aincrad** is a floating castle consisting of 100 floors stacked upon each other. The base diameter is approximately 10 kilometers, with each floor slightly smaller than the one below.

#### Origin Story
> *"Long ago, the nine kingdoms of humanity lived separately. Then came the great cataclysm - the earth was cut and stacked, forming Aincrad. The kingdoms were lost, their peoples scattered across the floors."*

### 4.2 Floor Structure

| Floor Range | Theme | Difficulty | Key Features |
|-------------|-------|------------|--------------|
| **1-10** | Beginner Plains | ★☆☆☆☆ | Tutorial, Town of Beginnings, basic monsters |
| **11-25** | Forest & Mountains | ★★☆☆☆ | First guild territories, crafting zones |
| **26-40** | Desert & Ruins | ★★★☆☆ | Ancient temples, rare materials |
| **41-55** | Arctic & Caverns | ★★★☆☆ | Ice dungeons, mining operations |
| **56-74** | Volcanic & Dark | ★★★★☆ | High-level gear, elite monsters |
| **75-90** | Celestial & Void | ★★★★★ | Legendary weapons, final bosses |
| **91-100** | The Ruby Palace | ★★★★★+ | Endgame, Kayaba's domain |

### 4.3 Known Floor Themes (Canon Reference)

| Floor | Theme | Notable Features |
|-------|-------|------------------|
| **1** | Plains | Town of Beginnings (20% of floor area) |
| **11** | Temperate | Dense forest, mountain range |
| **22** | Peaceful | Lakes, forests, low difficulty |
| **24** | Limnetic | Water-based, floating bridges, Panareze |
| **27** | Dark | Perpetual darkness, rich ore deposits |
| **50** | Temple | Six-armed Buddha boss, Elucidator drop |
| **55** | Mixed | Knights of the Blood HQ |
| **74** | Hilly | The Gleam Eyes boss |
| **75** | Rocky | The Skull Reaper boss |
| **100** | Ruby Palace | Heathcliff (Kayaba Akihiko) - Final Boss |

### 4.4 Key Factions & NPCs

#### Major Guilds (Canon-Inspired)
1. **Knights of the Blood (KoB)** - Elite clearing guild
2. **Aincrad Liberation Force (ALF)** - Largest guild, military structure
3. **Divine Dragon Alliance (DDA)** - Aggressive clearing guild
4. **Moonlit Black Cats** - Mid-level friendly guild
5. **Titan's Hand** - Orange guild (criminals)

#### Important NPCs
| NPC | Role | Location |
|-----|------|----------|
| **Heathcliff** | KoB Leader / Final Boss | Floor 55 / Floor 100 |
| **Agil** | Merchant / Information Broker | Various floors |
| **Lisbeth** | Master Blacksmith | Floor 48 |
| **Yui** | Mental Health Counseling AI | System NPC |
| **Floor Bosses** | 100 unique encounters | Labyrinth Towers |

---

## 5. Core Gameplay Features

### 5.1 Feature Priority Matrix

| Priority | Feature | Phase | Description |
|----------|---------|-------|-------------|
| **P0** | Character Creation | 1 | Avatar customization, class selection |
| **P0** | Movement & Navigation | 1 | WASD movement, minimap, waypoints |
| **P0** | Combat System | 1 | Sword Skills, targeting, dodging |
| **P0** | Basic Monsters | 1 | AI, loot drops, experience |
| **P0** | Floor 1 Complete | 1 | Full floor with boss |
| **P1** | Party System | 2 | 6-player parties, loot distribution |
| **P1** | Inventory & Equipment | 2 | Items, equipping, stats |
| **P1** | Skills & Proficiency | 2 | Skill leveling, unlockables |
| **P1** | Floors 2-10 | 2 | Beginner floors complete |
| **P2** | Guild System | 3 | Creation, ranks, guild bank |
| **P2** | Crafting | 3 | Blacksmith, alchemy, cooking |
| **P2** | Trading & Economy | 3 | Player trading, auction house |
| **P2** | Floors 11-25 | 3 | Intermediate floors |
| **P3** | PvP System | 4 | Duels, arenas, tournaments |
| **P3** | Housing | 4 | Personal rooms, decoration |
| **P3** | Marriage System | 4 | SAO-inspired relationship mechanics |
| **P3** | Floors 26-50 | 4 | Advanced content |

### 5.2 Game Loop

```
┌──────────────────────────────────────────────────────────────┐
│                      CORE GAME LOOP                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│    │  QUEST  │───▶│ GRIND   │───▶│ LEVEL   │───▶│ GEAR    │  │
│    │         │    │         │    │         │    │         │  │
│    │Accept   │    │Monsters │    │Up       │    │Upgrade  │  │
│    │tasks    │    │Dungeons │    │Skills   │    │Enhance  │  │
│    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│         │                                            │        │
│         │              ┌─────────┐                   │        │
│         └─────────────▶│  BOSS   │◀──────────────────┘        │
│                        │ FLOOR   │                            │
│                        │         │                            │
│                        │Party Up │                            │
│                        │Defeat   │                            │
│                        │Progress │                            │
│                        └────┬────┘                            │
│                             │                                  │
│                             ▼                                  │
│                        ┌─────────┐                            │
│                        │ NEXT    │                            │
│                        │ FLOOR   │                            │
│                        └─────────┘                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Character System

### 6.1 Character Creation

#### Initial Setup
```
┌────────────────────────────────────────────────────────────┐
│                  CHARACTER CREATION                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │                 │    │  NAME: [________________]    │   │
│  │                 │    │                              │   │
│  │   AVATAR        │    │  APPEARANCE:                 │   │
│  │   PREVIEW       │    │  • Face Shape: [○]          │   │
│  │                 │    │  • Hair Style: [▲]          │   │
│  │                 │    │  • Hair Color: [●]          │   │
│  │                 │    │  • Eye Color:  [●]          │   │
│  │                 │    │  • Skin Tone:  [●]          │   │
│  └─────────────────┘    └──────────────────────────────┘   │
│                                                             │
│  NOTE: Avatar mirrors real appearance (SAO canon)          │
│        Only eye/hair color customizable after creation     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Base Stats

| Stat | Description | Affects |
|------|-------------|---------|
| **STR** (Strength) | Physical power | Melee damage, carry weight |
| **AGI** (Agility) | Speed and reflexes | Attack speed, dodge chance |
| **VIT** (Vitality) | Endurance | HP, HP regeneration |
| **DEX** (Dexterity) | Precision | Critical rate, accuracy |
| **INT** (Intelligence) | Mental capacity | Magic power (future), skill learning |
| **LCK** (Luck) | Fortune | Drop rates, critical damage |

### 6.3 Derived Stats

```typescript
interface CharacterStats {
  // Base stats
  strength: number;
  agility: number;
  vitality: number;
  dexterity: number;
  intelligence: number;
  luck: number;
  
  // Derived stats (calculated)
  maxHp: number;           // vitality * 10 + level * 5
  maxMp: number;           // intelligence * 5 + level * 2
  physicalAttack: number;  // strength * 2 + weaponAttack
  physicalDefense: number; // vitality * 1.5 + armorDefense
  attackSpeed: number;     // baseSpeed * (1 + agility * 0.01)
  criticalRate: number;    // dexterity * 0.5 + equipment
  criticalDamage: number;  // 150% + luck * 0.5%
  evasionRate: number;     // agility * 0.3 + equipment
  accuracyRate: number;    // dexterity * 0.5 + 80
  moveSpeed: number;       // baseSpeed * (1 + agility * 0.005)
}
```

### 6.4 Skill Slots

| Category | Slots | Unlock Level |
|----------|-------|--------------|
| **Weapon Skills** | 1-5 | Level 1, 10, 25, 50, 75 |
| **Support Skills** | 1-5 | Level 5, 15, 30, 45, 60 |
| **Passive Skills** | 1-3 | Level 1, 20, 40 |
| **Extra Skills** | 0-1 | Special requirements |
| **Unique Skills** | 0-1 | Extremely rare (e.g., Dual Blades) |

### 6.5 Character Classes (Inspired by Weapon Types)

| Class | Primary Weapon | Playstyle | Starting Skills |
|-------|----------------|-----------|-----------------|
| **Swordsman** | One-Handed Sword | Balanced | Horizontal, Vertical |
| **Fencer** | Rapier | Fast, precise | Linear, Oblique |
| **Rogue** | Dagger | Burst damage | Rapid Bite, Stealth |
| **Berserker** | Two-Handed Sword | Heavy hits | Avalanche, Cyclone |
| **Lancer** | Spear | Range, control | Polearm Thrust |
| **Archer** | Bow | Ranged DPS | Single Shot |
| **Monk** | Unarmed | Close combat | Flash Blow |

---

## 7. Combat System

### 7.1 Sword Skills Mechanics (Authentic SAO)

#### Execution Flow
```
1. PRE-MOTION
   └── Player initiates specific movement pattern
   └── Input: Key combination + mouse gesture
   
2. SYSTEM RECOGNITION
   └── Server validates input timing
   └── Weapon glows with skill-specific color
   
3. AUTO-EXECUTION
   └── System takes over character movement
   └── Animation plays at impossible speed
   └── Damage calculated server-side
   
4. POST-MOTION DELAY
   └── Character freezes momentarily
   └── Duration based on skill level
   └── Vulnerable window
   
5. COOLDOWN
   └── Skill icon shows cooling timer
   └── Same skill locked, others available
   └── Chain into different skills
```

### 7.2 Skill Categories

#### One-Handed Straight Sword
| Skill | Level | Hits | Effect | Cooldown |
|-------|-------|------|--------|----------|
| Horizontal | 1 | 1 | Basic horizontal slash | 2s |
| Vertical | 1 | 1 | Basic vertical slash | 2s |
| Rage Spike | 1 | 1 | Leap + upward strike | 4s |
| Sonic Leap | 1 | 1 | Charge + downward strike | 5s |
| Vertical Arc | 2 | 2 | V-shaped double slash | 3s |
| Horizontal Square | 3 | 4 | Rhombus pattern | 6s |
| Sharp Nail | 5 | 3 | Diagonal combo | 5s |
| Vorpal Strike | 10 | 1 | Heavy, 2x range, long cooldown | 15s |
| Howling Octave | 15 | 8 | Rapid combo with fire | 20s |

#### Rapier
| Skill | Level | Hits | Effect | Cooldown |
|-------|-------|------|--------|----------|
| Linear | 1 | 1 | High-speed thrust | 1.5s |
| Oblique | 2 | 1 | Low thrust, higher power | 2s |
| Parallel Sting | 3 | 2 | Double thrust | 3s |
| Triangular | 5 | 3 | Powerful triple hit | 5s |
| Star Splash | 10 | 8 | Eight-hit combo | 15s |
| Flashing Penetrator | 15 | 1 | Charge with sonic boom | 10s |

### 7.3 Combat Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     COMBAT ENCOUNTER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. TARGET SELECTION                                         │
│     ├── Click enemy to target                               │
│     ├── Tab cycle through enemies                           │
│     └── Auto-target nearest threat                          │
│                                                              │
│  2. SKILL ACTIVATION                                         │
│     ├── Press skill key (1-9)                               │
│     ├── Pre-motion input detected                           │
│     └── Server validates execution                          │
│                                                              │
│  3. DAMAGE CALCULATION (Server-Side)                         │
│     ├── Base = WeaponATK × SkillMultiplier                  │
│     ├── Final = Base × (1 - EnemyDEF/(EnemyDEF+100))        │
│     ├── Critical = Final × CritMultiplier                   │
│     └── Apply element bonuses                               │
│                                                              │
│  4. ENEMY RESPONSE                                           │
│     ├── Aggro calculation                                   │
│     ├── Attack patterns trigger                             │
│     └── Telegraphed moves                                   │
│                                                              │
│  5. POST-COMBAT                                              │
│     ├── Loot roll (server-authoritative)                    │
│     ├── Experience distribution                             │
│     └── Skill proficiency gain                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Aggro System

```typescript
interface AggroEntry {
  targetId: string;
  aggroValue: number;
  lastAction: number;
}

class AggroManager {
  // Aggro generation rules
  calculateAggro(source: Player, action: CombatAction): number {
    let aggro = 0;
    
    switch (action.type) {
      case 'damage':
        aggro = action.damage * 1.0;
        break;
      case 'heal':
        aggro = action.healAmount * 0.5;
        break;
      case 'taunt':
        aggro = 1000; // Fixed high aggro
        break;
      case 'proximity':
        aggro = 10; // Per tick
        break;
    }
    
    // Modifiers
    if (source.hasAggroBonus) aggro *= 1.5;
    
    return aggro;
  }
}
```

---

## 8. Progression System

### 8.1 Level System

| Level Range | XP Required | XP Source | Time Estimate |
|-------------|-------------|-----------|---------------|
| 1-10 | 100-1,000 | Floor 1 monsters | 5 hours |
| 11-20 | 1,000-5,000 | Floors 1-5 | 15 hours |
| 21-30 | 5,000-15,000 | Floors 5-10 | 25 hours |
| 31-50 | 15,000-50,000 | Floors 10-25 | 50 hours |
| 51-75 | 50,000-200,000 | Floors 25-50 | 100 hours |
| 76-100 | 200,000-1,000,000 | Floors 50-100 | 200+ hours |

### 8.2 Skill Proficiency

```
Skill Level = (Usage Count × Difficulty Modifier) / 100

Proficiency Tiers:
├── Novice (0-99): Reduced skill power
├── Apprentice (100-499): Normal skill power
├── Expert (500-999): +10% skill power
├── Master (1000-4999): +25% skill power, reduced cooldown
└── Grandmaster (5000+): +50% skill power, special effects
```

### 8.3 Enhancement System

#### Equipment Parameters
| Parameter | Effect | Flame Color |
|-----------|--------|-------------|
| **Sharpness** | +Attack damage | Silver |
| **Accuracy** | +Critical rate | Blue |
| **Quickness** | +Attack speed | Green |
| **Heaviness** | +Break chance | Red |
| **Durability** | +Equipment HP | Gold |

#### Enhancement Mechanics
```
Enhancement Process:
1. Visit Blacksmith NPC
2. Select "Enhance" option
3. Choose parameter to enhance
4. Insert materials into furnace
5. Strike exactly 10 times within 3 minutes
6. Success: +1 enhancement level
7. Failure: Material loss, possible downgrade

Enhancement Limits:
├── Maximum attempts per item: Varies by item tier
├── Success rate after +4: Greatly reduced
├── Failure at max: Item DESTROYED
└── Safe enhancement: +4 guaranteed
```

---

## 9. Social Features

### 9.1 Party System

```
Party Structure (Max 6 Players):
┌────────────────────────────────────────┐
│  PARTY LEADER                          │
│  ├── Invite/Kick members               │
│  ├── Set loot distribution             │
│  └── Initiate party activities         │
├────────────────────────────────────────┤
│  PARTY MEMBERS                         │
│  ├── Shared HP/MP bars                 │
│  ├── Shared minimap markers            │
│  ├── Party chat channel                │
│  └── Coordinated skill chains          │
├────────────────────────────────────────┤
│  RAID EXTENSION (Floor Bosses)         │
│  ├── Up to 8 parties (48 players)      │
│  ├── Raid leader coordinates           │
│  └── Separate raid chat                │
└────────────────────────────────────────┘
```

### 9.2 Guild System

| Feature | Requirement | Benefits |
|---------|-------------|----------|
| **Creation** | 100,000 Col + 5 members | Guild name, emblem |
| **Levels** | Guild XP from activities | Increased member cap |
| **Bank** | Guild level 2 | Shared storage, gold |
| **Territory** | Guild level 5 | Floor zones, taxes |
| **Wars** | Guild level 10 | PvP conflicts, rewards |

### 9.3 Communication

| Channel | Range | Features |
|---------|-------|----------|
| **Say** | 50 meters | Visible to nearby players |
| **Shout** | Current zone | Zone-wide announcement |
| **Whisper** | Global | Private message |
| **Party** | Global | Party members only |
| **Guild** | Global | Guild members only |
| **World** | Global | Server-wide (limited) |

---

## 10. Economy System

### 10.1 Currency: Col

| Denomination | Value | Appearance |
|--------------|-------|------------|
| **Copper** | 1 Col | Small copper coin |
| **Silver** | 100 Col | Silver coin |
| **Gold** | 500 Col | Gold coin |
| **Large Gold** | 100,000 Col | Large gold ingot |

### 10.2 Economy Sources

```
Col Generation (Server-Authoritative):
├── Monster Drops
│   ├── Base: Level × 10-50 Col
│   └── Boss: Level × 100-500 Col
├── Quest Rewards
│   ├── Main Quest: 1,000-10,000 Col
│   └── Daily Quest: 100-500 Col
├── Item Sales (NPC)
│   └── 25-50% of purchase price
└── Player Trading
    └── Tax: 5% of transaction

Col Sinks:
├── Equipment Purchases
├── Enhancement Materials
├── Teleport Crystals: 100-1,000 Col
├── Consumables (Potions)
├── Housing (Rent/Buy)
├── Guild Creation/Fees
└── Auction House Tax: 10%
```

### 10.3 Trading System

```
Trading Flow (Atomic Transaction):
1. Player A initiates trade with Player B
2. Both players add items to trade window
3. Server validates:
   ├── Items exist in inventories
   ├── Items not locked/trade-protected
   └── Trade is fair (anti-RMT check)
4. Both players confirm
5. Server performs atomic swap:
   ├── Lock both inventories
   ├── Transfer items atomically
   └── Unlock inventories
6. Trade complete
```

---

## 11. Technical Requirements

### 11.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Server Tick Rate** | 60 Hz | 16.67ms per tick |
| **Network Latency** | <100ms | Client to server RTT |
| **Concurrent Players** | 10,000+ | Per server shard |
| **Zone Capacity** | 500 | Players per zone |
| **Database Response** | <10ms | 95th percentile |
| **WebSocket Messages** | 700K/sec | Per server instance |

### 11.2 Platform Support

| Platform | Browser Requirements |
|----------|---------------------|
| **Desktop Chrome** | v100+ |
| **Desktop Firefox** | v100+ |
| **Desktop Safari** | v15+ |
| **Desktop Edge** | v100+ |
| **Mobile Chrome** | Android 10+ |
| **Mobile Safari** | iOS 15+ |

### 11.3 Accessibility

- Colorblind mode for combat indicators
- Keyboard-only navigation support
- Screen reader compatible UI elements
- Customizable font sizes
- Reduced motion option

---

## 12. Non-Functional Requirements

### 12.1 Security (CRITICAL)

| Requirement | Implementation |
|-------------|----------------|
| **Server-Authoritative** | ALL game logic runs server-side |
| **Input Validation** | Every message validated before processing |
| **Anti-Cheat** | Speed hack, teleport, packet manipulation detection |
| **Session Security** | JWT with short expiration, origin validation |
| **Rate Limiting** | Token bucket per connection |
| **Encryption** | WSS mandatory, message signing |

### 12.2 Scalability

```
Horizontal Scaling Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Game Server  │ │  Game Server  │ │  Game Server  │
│   Instance 1  │ │   Instance 2  │ │   Instance N  │
│   (Zone 1-10) │ │  (Zone 11-20) │ │  (Zone 91-100)│
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   PostgreSQL  │ │    Redis      │ │  TimescaleDB  │
│   (Primary)   │ │   (Cache)     │ │  (Analytics)  │
└───────────────┘ └───────────────┘ └───────────────┘
```

### 12.3 Reliability

| Metric | Target |
|--------|--------|
| **Uptime SLA** | 99.9% |
| **Data Durability** | 99.999% |
| **Recovery Time Objective (RTO)** | <15 minutes |
| **Recovery Point Objective (RPO)** | <1 minute |

---

## 13. Success Metrics

### 13.1 Key Performance Indicators (KPIs)

| Category | KPI | Target (Year 1) |
|----------|-----|-----------------|
| **Engagement** | DAU | 50,000 |
| **Engagement** | Average Session | 2+ hours |
| **Retention** | D1 Retention | 60% |
| **Retention** | D7 Retention | 40% |
| **Retention** | D30 Retention | 25% |
| **Monetization** | Conversion Rate | 5% |
| **Monetization** | ARPU | $10/month |
| **Social** | Party Participation | 70% |
| **Social** | Guild Membership | 50% |

### 13.2 Game Health Metrics

| Metric | Healthy Range |
|--------|---------------|
| **Floor Progress** | Top guild: 1 floor/week |
| **Economy Inflation** | <5% monthly |
| **Player Distribution** | Even across levels |
| **Cheating Incidents** | <0.1% of players |

---

## 14. Risk Assessment

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **WebSocket scalability** | Medium | High | Clustering, zone sharding |
| **Database bottleneck** | Medium | High | Read replicas, Redis caching |
| **Security breach** | Low | Critical | Server-authoritative, audits |
| **DDoS attack** | Medium | High | Cloudflare, rate limiting |

### 14.2 Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low player retention** | Medium | High | Tutorial improvements, early engagement |
| **Economy imbalance** | Medium | Medium | Continuous monitoring, adjustable rates |
| **Content pace too slow** | Medium | High | Phased floor release |
| **P2W perception** | Low | High | Cosmetic-only monetization |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Aincrad** | The 100-floor floating castle |
| **Col** | In-game currency |
| **Floor Boss** | Boss at the top of each floor's labyrinth |
| **Sword Skill** | System-assisted combat technique |
| **Teleport Gate** | Transportation between cleared floors |
| **Last Attack Bonus** | Extra loot for dealing killing blow |
| **Color Cursor** | Player status indicator (Green/Orange/Red) |
| **Cardinal System** | AI managing game world |

---

## Appendix B: References

1. Sword Art Online Wiki - https://swordartonline.fandom.com
2. Effect-TS Documentation - https://effect.website
3. Bun WebSocket Documentation - https://bun.com/docs/runtime/http/websockets
4. OWASP WebSocket Security - https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html

---

**Document Version:** 1.0.0  
**Last Updated:** February 2026  
**Owner:** Product Team
