-- Vocabulario ("Words to learn") y letra con espacios para completar, por ítem.
-- vocabulary: [{ "word": "...", "meaning": "...", "example": "..." }]
-- lyrics: texto donde las palabras a completar van entre llaves: I {feel} good
alter table public.items
  add column if not exists vocabulary jsonb not null default '[]',
  add column if not exists lyrics text;
