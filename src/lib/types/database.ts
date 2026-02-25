export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: string;
          initials: string | null;
          color: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          company: string;
          email: string;
          phone: string;
          status: 'active' | 'inactive' | 'onboarding';
          type: 'individual' | 'business';
          assigned_to_id: string | null;
          assigned_to: string;
          tags: string[];
          businesses: string[];
          total_billed: number;
          outstanding_balance: number;
          last_activity: string;
          portal_user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      work_items: {
        Row: {
          id: string;
          title: string;
          client_id: string | null;
          client_name: string;
          business_name: string | null;
          type: 'tax-return' | 'bookkeeping' | 'payroll' | 'advisory' | 'audit' | 'onboarding';
          status: 'not-started' | 'in-progress' | 'waiting-on-client' | 'in-review' | 'completed';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          assignee_id: string | null;
          assignee: string;
          due_date: string | null;
          start_date: string | null;
          progress: number;
          budget: number;
          time_spent: number;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['work_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['work_items']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          work_item_id: string;
          title: string;
          completed: boolean;
          assignee_id: string | null;
          assignee: string | null;
          due_date: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      kanban_boards: {
        Row: {
          id: string;
          title: string;
          year: number | null;
          starred: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kanban_boards']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kanban_boards']['Insert']>;
      };
      kanban_columns: {
        Row: {
          id: string;
          board_id: string | null;
          title: string;
          color: string;
          sort_order: number;
          wip_limit: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kanban_columns']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kanban_columns']['Insert']>;
      };
      kanban_cards: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          description: string | null;
          client_id: string | null;
          client_name: string | null;
          assignee_id: string | null;
          assignee: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          due_date: string | null;
          tags: string[];
          progress: number;
          sort_order: number;
          comments_count: number;
          attachments_count: number;
          subtasks_total: number;
          subtasks_completed: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['kanban_cards']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['kanban_cards']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          client_id: string;
          invoice_number: string | null;
          amount: number;
          tax_amount: number;
          status: 'draft' | 'sent' | 'paid' | 'overdue';
          due_date: string | null;
          issued_date: string;
          description: string | null;
          line_items: Json;
          created_by: string | null;
          created_at: string;
          paid_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      portal_documents: {
        Row: {
          id: string;
          client_id: string;
          filename: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          description: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['portal_documents']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['portal_documents']['Insert']>;
      };
      portal_messages: {
        Row: {
          id: string;
          client_id: string;
          sender_id: string | null;
          sender_name: string | null;
          message: string;
          is_from_client: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['portal_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['portal_messages']['Insert']>;
      };
      time_entries: {
        Row: {
          id: string;
          work_item_id: string | null;
          task_id: string | null;
          client_id: string | null;
          user_id: string | null;
          description: string | null;
          hours: number;
          date: string;
          billable: boolean;
          rate: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['time_entries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['time_entries']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string | null;
          action: string;
          target: string | null;
          project: string | null;
          type: 'task' | 'work' | 'document' | 'email' | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type WorkItem = Database['public']['Tables']['work_items']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type KanbanBoard = Database['public']['Tables']['kanban_boards']['Row'];
export type KanbanColumn = Database['public']['Tables']['kanban_columns']['Row'];
export type KanbanCard = Database['public']['Tables']['kanban_cards']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type PortalDocument = Database['public']['Tables']['portal_documents']['Row'];
export type PortalMessage = Database['public']['Tables']['portal_messages']['Row'];
export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];
