# Connexion Backend ↔ Base Supabase

Si tu as **UnknownHostException** ou « La tentative de connexion a échoué », ton PC n’arrive pas à joindre le serveur Supabase. Voici quoi faire dans l’ordre.

---

## 1. Utiliser le Connection Pooler (recommandé)

La connexion **directe** (`db.xxx.supabase.co`) utilise IPv6. Beaucoup de réseaux ne la résolvent pas. Le **pooler Session** utilise un autre serveur (souvent en IPv4).

### Étapes

1. Ouvre **Supabase Dashboard** → ton projet → bouton **Connect** (en haut).
2. Choisis **Connection pooling** → **Session mode**.
3. Tu vois une URL du type :
   ```text
   postgres://postgres.ucqwbfvlsstqyxssvwtl:[YOUR-PASSWORD]@aws-0-XX-XXXX-X.pooler.supabase.com:5432/postgres
   ```
4. Dans IntelliJ : **Run** → **Edit Configurations** → **Active profiles** : mets **`pooler`**.
5. Ouvre `src/main/resources/application-pooler.properties` :
   - Remplace **l’hôte** par celui de ton URL (ex. `aws-0-eu-central-1.pooler.supabase.com` → la partie après `@` et avant `:5432`).
   - Le **username** doit être `postgres.ucqwbfvlsstqyxssvwtl` (ou celui affiché dans le dashboard).
   - Le **password** : même mot de passe que pour la base (ou variable d’environnement `SUPABASE_DB_PASSWORD`).
6. **Apply** → **OK** puis relance l’application.

Si l’URL du dashboard a une **autre région** (ex. `aws-0-us-east-1`), mets exactement le même hôte dans `application-pooler.properties`.

---

## 2. Tester la résolution DNS

Pour voir si le blocage vient du DNS :

1. Dans le projet, exécute la classe **`SupabaseConnectionTest`** (clic droit → Run).
2. Regarde si « Résolution DNS (direct) » et « Résolution DNS (pooler) » sont OK ou en échec.

Tu peux aussi tester en PowerShell :

```powershell
nslookup db.ucqwbfvlsstqyxssvwtl.supabase.co
nslookup aws-0-eu-central-1.pooler.supabase.com
```

Si les deux échouent, le problème vient du DNS ou du réseau (voir § 3).

---

## 3. Corriger le DNS sous Windows

1. **Vider le cache DNS** (PowerShell en **Administrateur**) :
   ```powershell
   ipconfig /flushdns
   ```
2. **Utiliser les DNS Google** :
   - Paramètres Windows → **Réseau et Internet** → **Wi‑Fi** (ou Ethernet) → **Propriétés** de ta connexion.
   - **IPv4** → **Modifier** → « Utiliser les adresses de serveur DNS suivantes » :
     - Préféré : `8.8.8.8`
     - Auxiliaire : `8.8.4.4`
   - Enregistrer et relancer l’app.
3. **Tester avec un autre réseau** (ex. partage de connexion 4G) pour savoir si le blocage vient de ton FAI / box.

---

## 4. Vérifier la config

- **Mot de passe** : celui de **Project Settings** → **Database** → **Database password** (pas l’anon key).
- **Profil** : pour Supabase en pooler → **Active profiles** = `pooler` ; pour connexion directe → champ **Active profiles** vide.

Quand la connexion fonctionne, au démarrage du backend la table **user** est créée ou mise à jour dans Supabase grâce à `spring.jpa.hibernate.ddl-auto=update`.
