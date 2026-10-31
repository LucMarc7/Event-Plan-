# Projet : Event Plan — Règles d'audit et de développement

## Contexte

Application React Native / Expo SDK 54, TypeScript strict.
Backend Django sur https://klmarc.pythonanywhere.com

## Méthodologie obligatoire pour toute tâche

1. **Analyser** : lire les fichiers concernés avant de proposer quoi que ce soit.
2. **Diagnostiquer** : lister les problèmes trouvés avec fichier + ligne + gravité (Critique / Majeur / Mineur).
3. **Proposer** : présenter un plan de correction numéroté AVANT de modifier.
4. **Attendre validation** : ne rien modifier tant que je n'ai pas dit "GO".
5. **Appliquer** : une correction à la fois, avec un diff clair (avant → après).
6. **Vérifier** : lancer `npx tsc --noEmit` après chaque modification.
7. **Résumer** : à la fin, lister ce qui a été corrigé et ce qui reste.

## Règles strictes

- Ne jamais supposer un endpoint API : le vérifier avec `curl -i` avant.
- Ne jamais supprimer de code sans expliquer pourquoi.
- Ne jamais créer de fichier sans me le dire.
- Si une tâche dépasse 5 modifications de fichiers, la découper en sous-tâches.
- Priorité absolue : SÉCURITÉ > COHÉRENCE > UI/UX > RESPONSIVE > PERFORMANCE.

## Ordre de priorité pour les corrections

1. 🔴 Sécurité (tokens, données sensibles, injections, permissions)
2. 🟠 Bugs fonctionnels (erreurs 404, crashs, états incohérents)
3. 🟡 Cohérence design (couleurs, polices, tailles, espacements)
4. 🟢 Responsive (adaptation tous écrans)
5. 🔵 Performance et propreté du code
 crashs, états incohérents)
3. 🟡 Cohérence design (couleurs, polices, tailles, espacements)
4. 🟢 Responsive (adaptation tous écrans)
5. 🔵 Performance et propreté du code
