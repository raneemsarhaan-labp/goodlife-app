-- 0014 «حسابي»: data export and account deletion request (FR-071; constitution IV).

-- Everything stored about the caller, as one JSON document.
create function export_my_data() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id)
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(u) - 'notification_prefs' from users u where u.id = (select id from me)),
    'roles', (select coalesce(jsonb_agg(role), '[]') from user_roles where user_id = (select id from me)),
    'memberships', (select coalesce(jsonb_agg(jsonb_build_object('group', g.name, 'cohort', c.name, 'role', gm.role,
                                                                 'started_on', gm.started_on, 'ended_on', gm.ended_on)), '[]')
                    from group_memberships gm join groups g on g.id = gm.group_id join cohorts c on c.id = g.cohort_id
                    where gm.user_id = (select id from me)),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object('cohort_id', p.cohort_id, 'current_state', p.current_state,
                                                           'updated_at', p.updated_at)), '[]')
              from plans p where p.user_id = (select id from me)),
    'focus_areas', (select coalesce(jsonb_agg(jsonb_build_object('title', f.title, 'description', f.description)), '[]')
                    from focus_areas f join plans p on p.id = f.plan_id where p.user_id = (select id from me)),
    'habits', (select coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'description', h.description,
                                                            'archived_at', h.archived_at, 'created_at', h.created_at)), '[]')
               from habits h join plans p on p.id = h.plan_id where p.user_id = (select id from me)),
    'habit_completions', (select coalesce(jsonb_agg(jsonb_build_object('habit_id', habit_id, 'date', local_date)), '[]')
                          from habit_completions where user_id = (select id from me)),
    'day_entries', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'intention', intention,
                                                                 'reflection', reflection, 'closed_at', closed_at)), '[]')
                    from day_entries where user_id = (select id from me)),
    'own_challenges', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'text', text)), '[]')
                       from own_challenges where user_id = (select id from me)),
    'challenge_completions', (select coalesce(jsonb_agg(jsonb_build_object('date', local_date, 'kind', kind)), '[]')
                              from challenge_completions where user_id = (select id from me)),
    'monthly_reviews', (select coalesce(jsonb_agg(jsonb_build_object('month', month, 'status', status, 'answers', answers,
                                                                     'figures', figures_snapshot)), '[]')
                        from monthly_reviews where user_id = (select id from me)),
    'encouragements_received', (select coalesce(jsonb_agg(jsonb_build_object('date', e.local_date, 'phrase', ph.text)), '[]')
                                from encouragements e join encouragement_phrases ph on ph.id = e.phrase_id
                                where e.recipient_id = (select id from me)),
    'encouragements_sent', (select coalesce(jsonb_agg(jsonb_build_object('date', e.local_date, 'phrase', ph.text)), '[]')
                            from encouragements e join encouragement_phrases ph on ph.id = e.phrase_id
                            where e.sender_id = (select id from me))
  );
$$;

create function request_account_deletion() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  update users set deletion_requested_at = coalesce(deletion_requested_at, now()) where id = auth.uid();
end $$;

revoke execute on function export_my_data(), request_account_deletion() from public, anon;
grant execute on function export_my_data(), request_account_deletion() to authenticated;
