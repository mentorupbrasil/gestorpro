begin;

grant execute on function public.get_my_authorization_context(uuid) to authenticated;
grant execute on function public.create_clinic_unit(uuid, text, text, text) to authenticated;
grant execute on function public.set_membership_status(uuid, uuid, text, text) to authenticated;

commit;
