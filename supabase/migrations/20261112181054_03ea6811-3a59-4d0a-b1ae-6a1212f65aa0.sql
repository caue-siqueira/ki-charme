-- ============================================================
-- Ki Charme — Etapa 2: estrutura de dados, acesso e conteúdo inicial
-- Ordem: tipos -> user_roles + has_role -> demais tabelas -> políticas -> conteúdo
-- ============================================================

-- Tipos -----------------------------------------------------
create type public.product_status as enum ('published', 'sold_out', 'hidden');
create type public.app_role as enum ('admin');

-- Função auxiliar de atualização de timestamp ---------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. user_roles + verificação de papel (criados antes das políticas)
-- ============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint user_roles_unique unique (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

create policy "Cada um vê os próprios papéis"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create index user_roles_user_idx on public.user_roles (user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- ============================================================
-- 2. categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.categories(id) on delete restrict,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_unique unique (slug),
  constraint categories_name_not_blank check (length(trim(name)) > 0)
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

create or replace function public.guard_category_depth()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'Uma categoria não pode ser subcategoria de si mesma.';
    end if;
    if exists (select 1 from public.categories p where p.id = new.parent_id and p.parent_id is not null) then
      raise exception 'Só é permitido um nível de subcategoria.';
    end if;
  end if;
  return new;
end;
$$;

create trigger categories_depth_guard
  before insert or update of parent_id on public.categories
  for each row execute function public.guard_category_depth();

create policy "Visitantes veem categorias ativas"
  on public.categories for select to anon, authenticated
  using (is_active);

create policy "Administradores gerenciam categorias"
  on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index categories_parent_idx on public.categories (parent_id);
create index categories_order_idx on public.categories (display_order);

-- ============================================================
-- 3. products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  price numeric(10,2) not null,
  promotional_price numeric(10,2),
  category_id uuid not null references public.categories(id) on delete restrict,
  sizes text[] not null default '{}',
  colors jsonb not null default '[]'::jsonb,
  status public.product_status not null default 'published',
  is_featured boolean not null default false,
  measurements text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_unique unique (slug),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_price_positive check (price > 0),
  constraint products_promo_positive check (promotional_price is null or promotional_price > 0),
  constraint products_promo_lower check (promotional_price is null or promotional_price < price),
  constraint products_colors_are_array check (jsonb_typeof(colors) = 'array')
);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

create policy "Visitantes veem peças publicadas ou esgotadas"
  on public.products for select to anon, authenticated
  using (status in ('published', 'sold_out'));

create policy "Administradores gerenciam peças"
  on public.products for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_featured_idx on public.products (is_featured);
create index products_created_idx on public.products (created_at desc);

-- ============================================================
-- 4. product_images
-- ============================================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0,
  alt_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

create policy "Visitantes veem fotos de peças que podem ver"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.status <> 'hidden'
  ));

create policy "Administradores gerenciam fotos"
  on public.product_images for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index product_images_product_idx on public.product_images (product_id, display_order);

-- ============================================================
-- 5. store_settings (linha única)
-- ============================================================
create table public.store_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  store_name text not null default 'Ki Charme',
  subtitle text not null default 'Moda Feminina & Acessórios',
  whatsapp_number text not null default '',
  instagram_url text,
  address text,
  opening_hours text,
  pickup_information text,
  exchange_policy text,
  about text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_settings_only_row check (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

create policy "Visitantes veem as configurações da loja"
  on public.store_settings for select to anon, authenticated
  using (true);

create policy "Administradores editam as configurações"
  on public.store_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. timestamps automáticos
-- ============================================================
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_images_updated_at before update on public.product_images
  for each row execute function public.set_updated_at();
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- 7. Conteúdo inicial: categorias de partida
-- ============================================================
with parents as (
  insert into public.categories (name, slug, display_order)
  values
    ('Peças únicas', 'pecas-unicas', 1),
    ('Partes de cima', 'partes-de-cima', 2),
    ('Partes de baixo', 'partes-de-baixo', 3),
    ('Moda praia', 'moda-praia', 4),
    ('Acessórios', 'acessorios', 5)
  returning id, slug
)
insert into public.categories (name, slug, parent_id, display_order)
select v.name, v.slug, p.id, v.ord
from (values
  ('Vestidos', 'vestidos', 'pecas-unicas', 1),
  ('Macacões', 'macacoes', 'pecas-unicas', 2),
  ('Conjuntos', 'conjuntos', 'pecas-unicas', 3),
  ('Blusas', 'blusas', 'partes-de-cima', 1),
  ('Camisas', 'camisas', 'partes-de-cima', 2),
  ('Batas', 'batas', 'partes-de-cima', 3),
  ('Regatas', 'regatas', 'partes-de-cima', 4),
  ('Blusas de frio', 'blusas-de-frio', 'partes-de-cima', 5),
  ('Casacos', 'casacos', 'partes-de-cima', 6),
  ('Saias', 'saias', 'partes-de-baixo', 1),
  ('Calças', 'calcas', 'partes-de-baixo', 2),
  ('Shorts', 'shorts', 'partes-de-baixo', 3),
  ('Bermudas', 'bermudas', 'partes-de-baixo', 4),
  ('Biquínis', 'biquinis', 'moda-praia', 1),
  ('Maiôs', 'maios', 'moda-praia', 2),
  ('Saídas de praia', 'saidas-de-praia', 'moda-praia', 3),
  ('Bolsas', 'bolsas', 'acessorios', 1),
  ('Brincos', 'brincos', 'acessorios', 2),
  ('Colares', 'colares', 'acessorios', 3)
) as v(name, slug, parent_slug, ord)
join parents p on p.slug = v.parent_slug;

-- Linha única de configurações da loja
insert into public.store_settings (id, store_name, subtitle, about)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Ki Charme',
  'Moda Feminina & Acessórios',
  'A Ki Charme é uma loja de moda feminina e acessórios que acredita no prazer de se vestir bem. Venha nos visitar e viver a experiência de experimentar as peças pessoalmente, com atendimento atencioso.'
);