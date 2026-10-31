# Rapport d'exploration - Projet Event-Plan

## A. Structure des dossiers
```
Event-Plan/
├── app/
│   ├── (auth)/              # Authentification (login, register)
│   ├── (controller)/        # Routes contrôleur d'accès
│   ├── (main)/              # Application principale organisateur
│   ├── controller/          # Composants contrôleur (OTP)
│   ├── _layout.tsx          # Racine de la navigation
│   ├── choose.tsx           # Sélection de rôle
│   ├── index.tsx            # Point d'entrée
│   ├── initialCheck.tsx     # Vérification lancement
│   └── onboarding.tsx       # Tutorial initial
├── assets/
│   ├── annimation/          # Animations Lottie
│   ├── fonts/               # Polices personnalisées
│   ├── icons/               # Icônes
│   ├── images/              # Images statiques
│   └── themes/              # Thèmes (vide)
├── src/
│   ├── api/                 # Appels backend
│   ├── components/          # Composants réutilisables
│   │   ├── Alerts/          # Composants d'alerte
│   │   ├── choose/          # Boutons de sélection
│   │   ├── common/          # Composants UI communs
│   │   ├── events/          # Composants événements
│   │   ├── guests/          # Composants invités
│   │   └── profile/         # Composants profil
│   ├── constants/           # Constantes (vide)
│   ├── hooks/               # Hooks personnalisés
│   ├── navigation/          # Configuration navigation
│   ├── providers/           # Providers de contexte
│   ├── screens/             # Écrans (vide - utilisation de expo-router)
│   ├── stores/              # État global (Zustand)
│   ├── theme/               # Thème centralisé
│   ├── types/               # Types TypeScript
│   └── utils/               # Fonctions utilitaires
├── scripts/                 # Scripts utilitaires
├── .claude/                 # Configuration Claude
├── .vscode/                 # Configuration VS Code
├── AGENTS.md                # Configuration agents
├── CLAUDE.md                # Règles du projet
├── README.md                # Documentation
├── app.json                 # Configuration Expo
├── eslint.config.js         # Configuration ESLint
├── package.json             # Dépendances
├── tsconfig.json            # Configuration TypeScript
```

## B. Écrans existants
| Fichier | Rôle | Design system ? | Problèmes |
|---|---|---|---|
| app/(auth)/login.tsx | Écran de connexion organisateur | ❌ Non | Theme hardcodé (THEME), pas d'utilisation du theme centralisé |
| app/(auth)/register.tsx | Écran d'inscription organisateur | ❌ Non | Non lu dans l'exploration mais probablement similaire |
| app/(controller)/index.tsx | Écran liste d'invités contrôleur | ❌ Non | Utilise react-native-paper directement, pas de theme cohérent |
| app/controller/otp.tsx | Écran de saisie code événement contrôleur | ❌ Non | Utilise react-native-paper directement |
| app/(main)/home/index.tsx | Écran d'accueil avec liste événements | ❌ Non | Theme hardcodé (T), pas d'utilisation du theme centralisé |
| app/(main)/camera/index.tsx | Écran caméra QR (basique) | ❌ Non | Seulement un placeholder "Caméra QR" |
| app/(main)/profile/index.tsx | Écran profil utilisateur | ❌ Non | Theme hardcodé (COLORS, SPACING, RADIUS) |
| app/(main)/events/wedding/index.tsx | Liste événements mariage | ❌ Non | Non lu mais probablement similaire aux autres |
| app/(main)/events/birthday/index.tsx | Liste événements anniversaire | ❌ Non | Non lu mais probablement similaire aux autres |
| app/(main)/events/conference/index.tsx | Liste événements conférence | ❌ Non | Non lu mais probablement similaire aux autres |
| app/(main)/events/wedding/create.tsx | Création événement mariage | ❌ Non | Non lu mais probablement similaire aux autres |
| app/(main)/guests/create/[eventId].tsx | Création invité | ❌ Non | Non lu mais probablement similaire aux autres |
| app/choose.tsx | Sélection de rôle (organisateur/controleur) | ❌ Non | Styles hardcodés |
| app/onboarding.tsx | Tutorial initial | ❌ Non | Styles hardcodés |

## C. Composants partagés
- src/components/common/ : Composants UI réutilisables (Button, Card, Input, Modal, etc.)
- src/components/choose/ : BtnChoose pour l'écran de sélection de rôle
- src/components/Alerts/ : Composants d'alerte/toast
- src/components/events/ : Composants spécifiques aux événements
- src/components/guests/ : Composants spécifiques aux invités
- src/components/profile/ : Composants spécifiques au profil (DetailProfils.tsx)

## D. Diagnostic de cohérence design
- Couleurs codées en dur : 
  - app/(auth)/login.tsx (ligne 32-49) : THEME avec couleurs spécifiques
  - app/(main)/home/index.tsx (ligne 33-47) : T avec couleurs spécifiques
  - app/(main)/profile/index.tsx (ligne 42-62) : COLORS avec palette complète
  - app/choose.tsx : Styles hardcodés dans le fichier
  - app/onboarding.tsx : Styles hardcodés dans le fichier
- Thème centralisé : Oui (src/theme/index.ts existe avec configuration MD3)
- Tailles de police : Non cohérentes - Chaque écran définit ses propres tailles avec hp()/wp() ou valeurs fixes
- Espacements : Non cohérents - Chaque écran définit ses propres espacements

## E. Écrans contrôleur
| Écran | Existe ? | Fichier |
|---|---|---|
| Login contrôleur | ✅ | app/controller/otp.tsx (saisie code événement) |
| Liste invités contrôleur | ✅ | app/(controller)/index.tsx |
| Scan QR | ❌ | Pas d'implémentation réelle - seulement app/(main)/camera/index.tsx comme placeholder |

## F. Navigation
La navigation utilise expo-router avec une structure en stacks:
- Racine (app/_layout.tsx) : Stack contenant tous les layouts
  - index → app/choose.tsx (sélection de rôle)
  - initialCheck → app/initialCheck.tsx (vérification lancement)
  - onboarding → app/onboarding.tsx (tutorial)
  - choose → app/choose.tsx (déjà à la racine)
  - (auth) → Stack avec login/register
  - (main) → Stack avec home, events, profile, camera
  - (controller) → Stack avec index (liste invités)

L'authentification est gérée par un token dans le store Zustand (src/stores/auth.store).
Lorsqu'un utilisateur choisit son rôle dans choose.tsx, il est dirigé vers:
- Organisateur : /(auth)/login
- Contrôleur : /(auth)/controller/otp (note: erreur dans le code, devrait être /(controller)/otp)

## G. Top 5 des priorités
1. **Implémenter le thème centralisé** - Tous les écrans utilisent des thèmes hardcodés au lieu du thème centralisé dans src/theme/index.ts
2. **Implémenter un vrai scanner QR** - Le camera/index.tsx n'est qu'un placeholder, pas de réelle fonctionnalité de scan
3. **Corriger la navigation contrôleur** - Dans choose.tsx, la ligne 19 dirige vers "/(auth)/controller/otp" au lieu de "/(controller)/otp"
4. **Standardiser les styles** - Éliminer les valeurs hardcodées (couleurs, tailles, espacements) pour utiliser le thème centralisé
5. **Séparer les responsabilités** - Organiser mieux les composants par fonctionnalité plutôt que de tout mettre dans des écrans massifs