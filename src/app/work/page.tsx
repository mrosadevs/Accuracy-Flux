import { redirect } from 'next/navigation';

// The Work tab has been replaced by the Board (Kanban) view.
// All work item management now lives at /kanban.
export default function WorkPage() {
  redirect('/kanban');
}
