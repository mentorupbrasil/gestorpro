-- P0.4 onda 3: exames/filas + financeiro básico.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'exam_orders_tenant_id_uq') then
    alter table public.exam_orders add constraint exam_orders_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'encounter_steps_tenant_id_uq') then
    alter table public.encounter_steps add constraint encounter_steps_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'queue_definitions_tenant_id_uq') then
    alter table public.queue_definitions add constraint queue_definitions_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'commercial_contracts_tenant_id_uq') then
    alter table public.commercial_contracts add constraint commercial_contracts_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_tenant_id_uq') then
    alter table public.quotes add constraint quotes_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_items_tenant_id_uq') then
    alter table public.quote_items add constraint quote_items_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'billing_items_tenant_id_uq') then
    alter table public.billing_items add constraint billing_items_tenant_id_uq unique (tenant_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_tenant_id_uq') then
    alter table public.invoices add constraint invoices_tenant_id_uq unique (tenant_id, id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'exam_orders_encounter_tenant_fk') then
    alter table public.exam_orders
      add constraint exam_orders_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exam_orders_exam_catalog_tenant_fk') then
    alter table public.exam_orders
      add constraint exam_orders_exam_catalog_tenant_fk
      foreign key (tenant_id, exam_catalog_id) references public.exam_catalog (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'queue_definitions_clinic_unit_tenant_fk') then
    alter table public.queue_definitions
      add constraint queue_definitions_clinic_unit_tenant_fk
      foreign key (tenant_id, clinic_unit_id) references public.clinic_units (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'queue_tickets_queue_definition_tenant_fk') then
    alter table public.queue_tickets
      add constraint queue_tickets_queue_definition_tenant_fk
      foreign key (tenant_id, queue_definition_id) references public.queue_definitions (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'queue_tickets_encounter_tenant_fk') then
    alter table public.queue_tickets
      add constraint queue_tickets_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'queue_tickets_encounter_step_tenant_fk') then
    alter table public.queue_tickets
      add constraint queue_tickets_encounter_step_tenant_fk
      foreign key (tenant_id, encounter_step_id) references public.encounter_steps (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_company_tenant_fk') then
    alter table public.quotes
      add constraint quotes_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quotes_contract_tenant_fk') then
    alter table public.quotes
      add constraint quotes_contract_tenant_fk
      foreign key (tenant_id, contract_id) references public.commercial_contracts (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'quote_items_quote_tenant_fk') then
    alter table public.quote_items
      add constraint quote_items_quote_tenant_fk
      foreign key (tenant_id, quote_id) references public.quotes (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'billing_items_company_tenant_fk') then
    alter table public.billing_items
      add constraint billing_items_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'billing_items_encounter_tenant_fk') then
    alter table public.billing_items
      add constraint billing_items_encounter_tenant_fk
      foreign key (tenant_id, encounter_id) references public.encounters (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'billing_items_quote_item_tenant_fk') then
    alter table public.billing_items
      add constraint billing_items_quote_item_tenant_fk
      foreign key (tenant_id, quote_item_id) references public.quote_items (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_company_tenant_fk') then
    alter table public.invoices
      add constraint invoices_company_tenant_fk
      foreign key (tenant_id, company_id) references public.companies (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoice_items_invoice_tenant_fk') then
    alter table public.invoice_items
      add constraint invoice_items_invoice_tenant_fk
      foreign key (tenant_id, invoice_id) references public.invoices (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoice_items_billing_item_tenant_fk') then
    alter table public.invoice_items
      add constraint invoice_items_billing_item_tenant_fk
      foreign key (tenant_id, billing_item_id) references public.billing_items (tenant_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_invoice_tenant_fk') then
    alter table public.payments
      add constraint payments_invoice_tenant_fk
      foreign key (tenant_id, invoice_id) references public.invoices (tenant_id, id) on delete restrict;
  end if;
end $$;
