# Server Monitor & Restart Management

Application complète de monitoring et redémarrage de serveurs avec interface web moderne.

## Fonctionnalités

- **Dashboard temps réel** avec monitoring automatique
- **Gestion des serveurs** (CRUD) avec configuration complète
- **Système d'authentification** avec rôles et permissions
- **Logs et audit** de toutes les opérations
- **Alertes email** automatiques en cas de panne
- **Planification** des redémarrages avec notifications
- **Sélection flexible** des serveurs pour redémarrage
- **API REST** sécurisée

## Installation et Configuration

### 1. Prérequis
- Oracle Linux 8.10
- Docker 26.1.3+
- Docker Compose

### 2. Configuration des variables d'environnement

Éditer le fichier `.env` :

```bash
# Base de données
DB_HOST=database
DB_PORT=5432
DB_NAME=server_monitor
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT Secret (CHANGEZ CETTE VALEUR)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Configuration SMTP (Microsoft 365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
ADMIN_EMAILS=admin@company.com,it@company.com
```

### 3. Déploiement

```bash
# Cloner/copier les fichiers de l'application
cd /opt/projectV092

# Construire et démarrer les services
docker compose up -d --build

# Initialiser la base de données avec les données de démonstration
docker compose run --rm backend node seed.js
docker compose exec backend node seed.js
```

### 4. Accès à l'application

- **Interface web**: http://localhost:3000
- **API**: http://localhost:5000/api
- **Base de données**: localhost:5432

### 5. Connexion par défaut

- **Utilisateur**: admin
- **Mot de passe**: admin123

## Configuration SSH

Pour que l'application puisse redémarrer les serveurs, configurez l'accès SSH sans mot de passe :

```bash
# Générer une clé SSH si nécessaire
ssh-keygen -t rsa -b 4096

# Copier la clé publique vers chaque serveur
ssh-copy-id root@server-hostname

# Tester la connexion
ssh root@server-hostname "echo 'Connection OK'"
```

## Structure des Serveurs

L'application supporte la configuration de vos serveurs existants :

- **SiegeAssurnetFront** (port 80)
- **droolslot2** (port 80)  
- **siegeawf** (port 80)
- **siegeasdrools** (port 8080)
- **siegeaskeycloak** (port 8080)
- **siegeasbackend** (port 7001)
- **assurnetprod** (port 80)
- **SiegeAssurnetDigitale** (port 7002)
- **siegedbc** (base de données, non redémarré)

## Fonctionnalités Avancées

### Monitoring Automatique
- Vérification ping/telnet chaque minute
- Alertes email en cas de panne
- Historique des vérifications

### Gestion des Permissions
- **Admin**: Accès complet
- **Utilisateur**: Permissions configurables
  - Monitoring
  - Redémarrage
  - Visualisation des logs
  - Gestion des serveurs
  - Planification des tâches

### Planification des Tâches
- Redémarrages programmés
- Notifications email optionnelles
- Gestion des groupes de serveurs

## Maintenance

### Logs de l'application
```bash
# Voir les logs en temps réel
docker compose logs -f backend

# Logs spécifiques
docker compose logs backend
docker compose logs frontend
```

### Sauvegarde de la base de données
```bash
docker compose exec database pg_dump -U postgres server_monitor > backup.sql
```

### Mise à jour
```bash
# Arrêter les services
docker compose down

# Mettre à jour le code
# ... vos modifications ...

# Redémarrer
docker compose up -d --build
```

## Support

Pour toute question ou problème :
1. Vérifiez les logs avec `docker compose logs`
2. Vérifiez la connectivité SSH vers les serveurs
3. Vérifiez la configuration email
4. Consultez l'interface web pour les détails des erreurs

L'application remplace et améliore votre script bash existant avec une interface moderne et des fonctionnalités avancées de monitoring et gestion.