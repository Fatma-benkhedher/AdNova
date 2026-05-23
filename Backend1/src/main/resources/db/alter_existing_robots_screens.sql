-- =============================================================================
-- robots + screens DÉJÀ créées — migration seulement (Supabase / public)
-- =============================================================================

-- Robots : colonne "nom" (si absente)
alter table public.robots add column if not exists nom text;

-- Unicité du nom robot (ignore si déjà en place sous un autre nom)
create unique index if not exists robots_nom_unique on public.robots (nom);

-- Screens : colonnes pour le backend Spring
alter table public.screens add column if not exists robot text;
alter table public.screens add column if not exists address text;
alter table public.screens add column if not exists latitude double precision;
alter table public.screens add column if not exists longitude double precision;

-- Remplir le texte "robot" depuis la table robots
update public.screens s
set robot = r.nom
from public.robots r
where s.robot_id = r.id
  and (s.robot is null or trim(s.robot) = '');

-- Adresse : éviter NULL (NOT NULL côté JPA)
update public.screens set address = '' where address is null;
alter table public.screens alter column address set default '';
alter table public.screens alter column address set not null;

-- robot texte obligatoire (échoue s'il reste des lignes sans correspondance robots)
-- Vérification avant la ligne suivante :
-- select s.id, s.nom, s.robot_id from public.screens s
-- left join public.robots r on r.id = s.robot_id
-- where s.robot is null or trim(s.robot) = '';
alter table public.screens alter column robot set not null;

create index if not exists idx_screens_robot_id on public.screens (robot_id);
