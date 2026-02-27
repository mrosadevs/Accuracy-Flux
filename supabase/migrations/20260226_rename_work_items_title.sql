-- Prepend client name to work item titles
-- e.g. "2025 Tax Return" → "JOHN SMITH 2025 Tax Return"
UPDATE public.work_items
SET title = client_name || ' ' || title
WHERE client_name IS NOT NULL
  AND client_name <> ''
  AND title NOT LIKE client_name || ' %';
