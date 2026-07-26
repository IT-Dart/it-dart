-- Registers IT-Dart-Kids in the Tool-Register — it already exists as a real
-- project (own repo, own CLAUDE.md) but was never added here, which is
-- exactly the gap this migration + the new standing habit below close.
insert into public.tools (slug, name, description, category, status, owner)
values (
  'it-dart-kids',
  'IT-Dart-Kids',
  'Sub-Marke: kindgerechte Vermittlung von IT-Grundwissen und Sicherheitsregeln (Malbücher, Druckvorlagen).',
  'Kinderprodukt',
  'development',
  'Coskun Bulut'
)
on conflict (slug) do nothing;
