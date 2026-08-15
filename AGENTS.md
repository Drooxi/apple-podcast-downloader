# Instructions for Agents

## Documentation obligatoire

Avant toute réflexion, décision technique ou modification du projet, l’agent doit consulter tous les fichiers Markdown présents dans `docs/`.

Ces fichiers constituent la base de référence du projet et doivent être utilisés pour comprendre :

- la structure actuelle ;
- l’architecture Electron/React ;
- les flux de données et contrats IPC ;
- les décisions techniques déjà prises ;
- les limitations et travaux connus.

## Analyse préalable

Avant toute modification de code, l’agent doit :

1. Lire les fichiers Markdown de `docs/`.
2. Examiner les fichiers de code et de configuration concernés.
3. Vérifier l’état Git et les changements existants.
4. Identifier les impacts sur l’architecture, l’interface, les tests et la documentation.

## Maintenance obligatoire

Après chaque modification du code, l’agent doit impérativement :

1. Mettre à jour les fichiers Markdown concernés dans `docs/`.
2. Mettre à jour `docs/CHANGELOG.md` pour tout changement visible, fonctionnel ou architectural.
3. Vérifier que les chemins, commandes, contrats IPC, comportements et limitations documentés correspondent toujours au code.
4. Exécuter les validations pertinentes et documenter les résultats si nécessaire.

Une modification de code ne doit pas être considérée comme terminée tant que la documentation associée n’est pas à jour.

## Références documentaires

- `docs/WORKING_RULES.md` : workflow documentaire détaillé.
- `docs/PROJECT_OVERVIEW.md` : vue d’ensemble du produit et de son périmètre.
- `docs/ARCHITECTURE.md` : architecture et contrats IPC.
- `docs/DECISIONS.md` : décisions techniques et limitations connues.
- `docs/CHANGELOG.md` : historique des changements.

## Règle de cohérence

En cas de divergence entre le code et la documentation, l’agent doit d’abord constater la divergence, déterminer le comportement réellement implémenté, puis mettre à jour la documentation dans le même changement avant de poursuivre.
