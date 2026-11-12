-- Regras de acesso às fotos da loja (bucket: product-photos)
create policy "Administradores enviam fotos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = 'products'
    and public.has_role(auth.uid(), 'admin')
  );

create policy "Administradores alteram fotos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = 'products'
    and public.has_role(auth.uid(), 'admin')
  )
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = 'products'
    and public.has_role(auth.uid(), 'admin')
  );

create policy "Administradores apagam fotos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = 'products'
    and public.has_role(auth.uid(), 'admin')
  );