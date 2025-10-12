create table if not exists workout_set_entries (
    id uuid primary key default gen_random_uuid(),
    workout_id uuid not null references workouts(id) on delete cascade,
    workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
    exercise_id uuid not null references exercises(id) on delete cascade,
    set_number integer not null check (set_number > 0),
    reps integer check (reps >= 0),
    weight_kg numeric(6,2) check (weight_kg >= 0),
    rest_seconds integer check (rest_seconds >= 0),
    notes text,
    completed_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create unique index if not exists workout_set_entries_unique_set
    on workout_set_entries (workout_exercise_id, set_number);

create index if not exists workout_set_entries_workout_id_idx
    on workout_set_entries (workout_id);

create index if not exists workout_set_entries_exercise_id_idx
    on workout_set_entries (exercise_id);

drop trigger if exists workout_set_entries_updated_at_trg on workout_set_entries;
drop function if exists update_workout_set_entries_updated_at();

create function update_workout_set_entries_updated_at()
returns trigger as $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

create trigger workout_set_entries_updated_at_trg
    before update on workout_set_entries
    for each row execute function update_workout_set_entries_updated_at();
