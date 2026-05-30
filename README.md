<div align="center">

# 🥗 NutritionTracker

**A sleek, mobile-first calorie & macro tracker built for iOS**

[![React Native](https://img.shields.io/badge/React_Native-0.85-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_56-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.8-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#)
[![Platform](https://img.shields.io/badge/Platform-iOS-lightgrey?style=flat-square&logo=apple)](#)
[![PRs](https://img.shields.io/badge/PRs-not_accepted-red?style=flat-square)](#)

---

*Track calories, macros, sodium & sugar with a beautiful dark-mode interface.*
*Built for personal use on iPhone.*

</div>

---

## Features

<table>
<tr>
<td width="50%">

### Dashboard
- Animated SVG calorie ring with daily progress
- Color-coded macro bars (carbs, fat, protein)
- Sodium & sugar micro-nutrient tracking
- Date navigation with calendar bottom sheet
- Share/copy daily summary with macro analysis

</td>
<td width="50%">

### Meal Tracking
- 4 meal categories (Breakfast, Lunch, Dinner, Snacks)
- Dual-mode food entry: Create Food (full form) & Add Food (simplified card)
- Servings multiplier (macros stored per 1 serving, scaled at display)
- Edit, delete, and move entries between meals
- Long-press context menu with iOS ActionSheet

</td>
</tr>
<tr>
<td width="50%">

### Food Search & Favorites
- Integrated USDA FoodData Central + Open Food Facts search
- Favorites system for quick access to frequent foods
- Recent entries with one-tap re-add

</td>
<td width="50%">

### Recipes
- Create compound foods from individual ingredients
- Recipe detail view with ingredient list & macro grid
- Soft delete (archived) preserving historical data integrity
- Auto-calculated nutrition totals

</td>
</tr>
<tr>
<td width="50%">

### Share Day
- One-tap share of full daily nutrition summary
- Per-meal breakdown with individual entries
- Daily totals with actual vs target goals
- Macro calorie composition (P/C/F percentages)
- Goal completion percentages

</td>
<td width="50%">

### Settings
- Customizable calorie, macro & micro goals
- Persistent settings synced to Firestore
- Silent anonymous auth -- no login required

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<th align="left">Category</th>
<th align="left">Technology</th>
</tr>
<tr>
<td><strong>Framework</strong></td>
<td>
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white" />
</td>
</tr>
<tr>
<td><strong>Language</strong></td>
<td>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
</td>
</tr>
<tr>
<td><strong>Navigation</strong></td>
<td>
  <img src="https://img.shields.io/badge/Expo_Router-000020?style=flat-square&logo=expo&logoColor=white" />
</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>
  <img src="https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloud_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
</td>
</tr>
<tr>
<td><strong>Graphics</strong></td>
<td>
  <img src="https://img.shields.io/badge/React_Native_SVG-61DAFB?style=flat-square&logo=svg&logoColor=black" />
</td>
</tr>
<tr>
<td><strong>Gestures</strong></td>
<td>
  <img src="https://img.shields.io/badge/RN_Gesture_Handler-61DAFB?style=flat-square&logo=react&logoColor=black" />
</td>
</tr>
</table>

---

## 🏗️ Architecture

```
nutrition/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (SafeArea + AppProvider)
│   ├── index.tsx                 # Dashboard (calorie ring, macros, meals)
│   ├── info.tsx                  # Settings hub
│   ├── calorie-settings.tsx      # Edit calorie goal
│   ├── macros-settings.tsx       # Edit carbs/fat/protein split
│   ├── micros-settings.tsx       # Edit sodium/sugar goals
│   ├── meal/
│   │   └── [mealType].tsx        # Food search/add per meal
│   └── recipe/
│       ├── index.tsx             # Recipe list
│       └── create.tsx            # Recipe builder
├── components/                   # Reusable UI components
│   ├── CalorieRing.tsx           # Animated SVG circular progress
│   ├── MacroBar.tsx              # Horizontal progress bar
│   ├── MealCategory.tsx          # Meal section card
│   ├── FoodEntryRow.tsx          # Individual food item row
│   ├── CalendarBottomSheet.tsx   # Date picker modal
│   ├── FoodOptionSheet.tsx       # "Add food" action sheet
│   ├── QuickAddModal.tsx         # Dual-mode: Create Food / Add Food
│   └── RecipeDetailModal.tsx     # Recipe ingredients & actions
├── context/
│   └── AppContext.tsx            # Global state provider
├── hooks/
│   ├── useAuth.ts                # Firebase anonymous auth
│   ├── useDay.ts                 # Real-time day data sync
│   ├── useSettings.ts            # User goals subscription
│   ├── useRecipes.ts             # Recipe CRUD + archive
│   ├── useFavorites.ts           # Favorite foods management
│   └── useSearch.ts              # USDA + Open Food Facts search
├── services/
│   ├── auth.ts                   # Auth state management
│   ├── firestore.ts              # Firestore CRUD operations
│   └── foodSearch.ts             # External food API integration
├── constants/
│   ├── theme.ts                  # Design tokens (colors, spacing, fonts)
│   └── defaults.ts               # Default goals & meal config
├── types/
│   └── index.ts                  # TypeScript interfaces
└── firebase.ts                   # Firebase initialization
```

---

## Data Model

```
Firestore
└── users/{uid}
    ├── settings/config           → UserSettings (goals)
    ├── days/{YYYY-MM-DD}         → DayDocument (meals + totals)
    │   ├── date: string
    │   ├── meals
    │   │   ├── breakfast.entries[]  → FoodEntry[]
    │   │   ├── lunch.entries[]     → FoodEntry[]
    │   │   ├── dinner.entries[]    → FoodEntry[]
    │   │   └── snacks.entries[]    → FoodEntry[]
    │   └── totals                  → NutritionTotals
    ├── recipes/{id}              → Recipe (compound foods)
    │   └── archived?: boolean      (soft delete)
    └── favorites/{id}            → FavoriteFood

FoodEntry:
  - name, calories, carbs, fat, protein, sodium, sugar
  - servingAmount?, servingUnit?   (per 1 serving from label)
  - servings?                      (consumption multiplier)
  - recipeId?                      (source recipe reference)

Totals are computed at write time: macro × servings for each entry.
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **Expo CLI** (`npx expo`)
- **iOS Simulator** or **Expo Go** on iPhone

### Installation

```bash
# Clone the repo
git clone https://github.com/ryanzola/nutrition.git
cd nutrition

# Install dependencies
npm install

# Start the dev server
npx expo start --ios
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication** under Authentication → Sign-in method
3. Create a **Cloud Firestore** database
4. Set security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Update `firebase.ts` with your project config

---

## Roadmap

- [x] Core calorie & macro tracking
- [x] Sodium & sugar micro-nutrient bars
- [x] Servings multiplier (label-based, scaled at display)
- [x] Recipe / compound food builder
- [x] Recipe detail view + soft delete
- [x] Calendar date navigation
- [x] Customizable nutrition goals
- [x] Favorites system for quick food access
- [x] Food search API (USDA + Open Food Facts)
- [x] Dual-mode food entry (Create Food / Add Food)
- [x] Share daily nutrition summary
- [ ] Recipe editing ([#8](https://github.com/ryanzola/nutrition/issues/8))
- [ ] Barcode scanning ([#7](https://github.com/ryanzola/nutrition/issues/7))

---

<div align="center">

**Built with ☕ and obsessive macro counting**

</div>
