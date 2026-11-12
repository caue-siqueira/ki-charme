-- Fotos de catálogo precisam ser acessíveis sem login.
-- Preserva arquivos existentes e as políticas de escrita restritas a administradores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

-- Necessário para listar/gerenciar fotos com a sessão administrativa.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Administradores consultam fotos'
  ) then
    create policy "Administradores consultam fotos"
      on storage.objects for select to authenticated
      using (bucket_id = 'product-photos'
        and (storage.foldername(name))[1] = 'products'
        and public.has_role(auth.uid(), 'admin'));
  end if;
end;
$$;
