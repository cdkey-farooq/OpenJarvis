# J.A.R.V.I.S. personnel — état des lieux et première version

Analyse du fork `cdkey-farooq/OpenJarvis`, base `4590bbe8b`, le 25 octobre 2026.
La PR #1 FreeLLMAPI est fusionnée. Ce travail reste dans ce dépôt indépendant.

## Ce qui existe déjà

| Besoin | Composants du dépôt | État et conditions |
|---|---|---|
| Interface et desktop | `frontend/` : React, TypeScript, Tailwind, Zustand, Tauri 2 | Réutilisés, sans seconde application parallèle. |
| Backend et conversation | `src/openjarvis/server/` : FastAPI, API compatible OpenAI, SSE, WebSockets | Le centre de commande utilise le même backend et le même flux de conversation. |
| Historique | `frontend/src/lib/store.ts`, `server/session_store.py` | L'historique de l'interface est sauvegardé dans le navigateur. Ce n'est pas une sauvegarde chiffrée ni une synchronisation entre appareils. |
| Modèles | `engine/` : Ollama, moteurs compatibles, cloud ; `server/cloud_router.py` | Adaptateurs existants. La disponibilité de chaque fournisseur dépend de sa configuration réelle. |
| FreeLLMAPI | `engine/openai_compat_engines.py`, guide `freellmapi.md` | Adaptateur fusionné, URL locale par défaut `http://localhost:3001`, clé par variable d'environnement. Aucun service FreeLLMAPI démarré par cette PR. |
| Mémoire et documents | `memory/`, `tools/storage/`, `connectors/`, `server/upload_router.py`, paramètres de l'interface | Stockage, ingestion, recherche et RAG existants. Certaines fonctions SQLite dépendent de l'extension native `openjarvis_rust` ; vecteurs et lecture PDF demandent des extras. |
| Voix | `speech/`, `hooks/useSpeech.ts`, `lib/tts.ts` | Enregistrement/transcription et lecture vocale déjà présents ; nécessitent les moteurs, modèles et permissions microphone. |
| Agents | `agents/`, pages Agents | Agents simples, recherche, orchestrateur, développement, opérations persistantes. Les six noms JARVIS du cahier des charges ne sont pas six nouveaux agents actifs. |
| Automatisations | `scheduler/`, `agents/scheduler.py` | Planification persistante existante, à configurer explicitement. Aucune tâche créée ici. |
| Actions et sécurité | `security/`, `sandbox/`, `server/approval_routes.py`, `ApprovalBell.tsx` | Permissions, validation, audit et protections présents ; leur activation dépend de la configuration. Leur présence ne garantit pas la sécurité de chaque intégration. |
| Connecteurs | `connectors/`, page Data Sources | Aucun compte externe autorisé ou connecté par cette modification. |

## Ce que cette première version ajoute

- Vue JARVIS dans le chat existant, noyau à anneaux animés et panneaux bleu nuit.
- États calculés à partir du microphone, de la transcription, du streaming, des outils en cours, de la lecture vocale, des erreurs et des autorisations en attente.
- Priorité d'affichage du microphone actif, pour que son utilisation reste visible.
- Le noyau reste compact au-dessus d'une conversation ; le bouton **Vue classique** restaure l'affichage précédent.
- **Mode léger** persistant et respect de `prefers-reduced-motion` ; aucune dépendance WebGL, vidéo ou Three.js nécessaire à cette étape.
- Télémétrie réelle du **serveur** : charge CPU, pourcentage RAM, mémoire du processus. Si le backend est distant, ces mesures ne décrivent pas l'ordinateur qui affiche l'interface.
- Route en lecture seule `GET /v1/command-center`, protégée par le middleware d'authentification existant. Aucun secret, chemin de fichier ou variable d'environnement renvoyé.
- Affichage explicite « Indisponible » pour les mesures manquantes, et « Injoignable » si le backend ne répond pas. Un moteur configuré n'est jamais annoncé comme un modèle testé.
- Correction du routage serveur pour préserver FreeLLMAPI lorsque le modèle choisi possède un nom reconnu comme Gemini ou OpenAI.
- Thème sombre par défaut pour les nouvelles configurations ; préférences enregistrées conservées.

Le noyau réagit à l'état de la voix, pas à son amplitude acoustique. L'animation
n'est pas une visualisation audio synchronisée. Cette version ne crée pas de
phrase d'activation locale, conversation continue, OCR de manuscrits, coffre de
secrets, sauvegarde chiffrée ou orchestration historique spécialisée.
Le bouton d'arrêt existant interrompt la génération du chat ; il ne constitue
pas un arrêt universel des agents et processus déjà lancés.

## Installation Linux depuis la branche

Prérequis : Git, Python **3.10 à 3.13**, `uv`, Node **22.22 ou ultérieur**,
 npm **11.19 à 11.x** (versions déclarées par le dépôt).

```bash
git clone https://github.com/cdkey-farooq/OpenJarvis.git
cd OpenJarvis
git switch feature/jarvis-command-center
uv sync --extra server
cd frontend
npm ci
cd ..
```

Pour Ollama : installer et démarrer Ollama puis télécharger un modèle adapté à
la RAM disponible. Pour FreeLLMAPI : suivre [le guide existant](freellmapi.md),
démarrer le routeur local et configurer les fournisseurs dans son tableau de bord.
Les modèles locaux consomment la RAM de la machine ; aucune capacité matérielle
particulière n'est présumée pour le Chromebook.

Vérifier d'abord une vraie réponse, dans le terminal local :

```bash
# Définir FREELLMAPI_API_KEY localement selon le guide ; ne pas la publier.
uv run jarvis ask --engine freellmapi --model auto "Bonjour Jarvis."
```

Après réussite, modifier les sections existantes de `~/.openjarvis/config.toml` :

```toml
[engine]
default = "freellmapi"

[intelligence]
default_model = "auto"
```

Puis lancer :

```bash
uv run jarvis gui
```

Le lanceur GUI du dépôt utilise les adresses de boucle locale. Pour démarrer
le backend manuellement, fixer explicitement l'adresse locale :

```bash
uv run jarvis serve --host 127.0.0.1 --port 8000 --engine freellmapi --model auto
```

Dans un autre terminal, depuis `frontend/` : `npm run dev -- --host 127.0.0.1`.
Ouvrir `http://127.0.0.1:5173`. Les réglages de l'interface permettent de définir
l'URL du backend et sa clé locale si nécessaire. Les clés des **fournisseurs**
restent dans l'environnement ou le stockage desktop existant, jamais dans Git.
FreeLLMAPI peut transmettre les conversations à ses fournisseurs externes.

### Chromebook et autres systèmes

Le navigateur peut afficher cette interface sans WebGL. Pour héberger les
processus sur le Chromebook, il faut pouvoir activer l'environnement Linux,
installer les dépendances et disposer de RAM/espace suffisants. Un Chromebook
géré par une école peut interdire Linux ou le microphone. L'affichage Web
n'accorde pas à lui seul le contrôle de ChromeOS. Le packaging Tauri Linux
requiert les bibliothèques WebKit/GTK du système ; aucun installateur du fork
n'est produit ici. Windows/macOS nécessitent leur validation native séparée.

## Plan progressif pour la suite du cahier des charges

1. **Connexion réelle sur la machine cible** : vérifier FreeLLMAPI ou Ollama,
   génération complète, streaming, erreur fournisseur, arrêt, rechargement et
   conservation d'une conversation. Ne pas transmettre les clés dans le chat.
2. **Mémoire** : vérifier l'extension native et l'ingestion, ajouter un espace
   de gestion dédié, export, suppression et restauration chiffrée avec tests.
3. **Voix** : installer les moteurs locaux, tester français/anglais et nettoyage
   du microphone ; ajouter activation locale, interruption et analyse audio
   réelle. Aucun microphone permanent sans commande explicite.
4. **Recherche historique** : connecter des archives publiques choisies, OCR,
   traduction, provenance des citations, comparaison et distinction hypothèses/faits.
5. **Orchestration JARVIS** : mapper les rôles Core/Research/Dev/System/Memory/
   Automation sur les abstractions existantes, afficher les tâches persistantes,
   tester les reprises et confirmations, puis ajouter un arrêt global vérifié.
6. **Intégrations et durcissement** : consentements par connecteur, outils limités,
   essais d'injection dans documents, audit, stockage sûr et tests Linux natifs,
   puis Windows/macOS. Le centre de commande ne désactive aucune protection.

## Validation de cette livraison

Les tests ajoutés vérifient la priorité des états du noyau, la protection de la
route de télémétrie, les mesures et leurs valeurs manquantes, et le routage de
modèles nommés via FreeLLMAPI. Les tests de conversation existants sont conservés.
Une conversation avec un transport fournisseur simulé valide le câblage, mais
ne prouve pas l'accès à un fournisseur réel. Aucun test réel de voix, mot
d'activation, paquet desktop ou fournisseur distant n'est revendiqué.
