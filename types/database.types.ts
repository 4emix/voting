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
          username: string | null;
          display_name: string | null;
          lc: string;
          role: 'user' | 'admin';
          votes_remaining: number;
          can_vote: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          lc: string;
          role?: 'user' | 'admin';
          votes_remaining?: number;
          can_vote?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          lc?: string;
          role?: 'user' | 'admin';
          votes_remaining?: number;
          can_vote?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          choices: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          choices: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          choices?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'votes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          action_type: 'transfer' | 'setVotes' | 'toggleVote';
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action_type: 'transfer' | 'setVotes' | 'toggleVote';
          details: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action_type?: 'transfer' | 'setVotes' | 'toggleVote';
          details?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_actions_admin_id_fkey';
            columns: ['admin_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      profiles_with_email: {
        Row: {
          id: string;
          role: 'user' | 'admin';
          lc: string;
          vote_balance: number;
          can_vote: boolean;
          email: string | null;
        };
        Relationships: [];
      };
      votes_with_users: {
        Row: {
          id: string;
          user_id: string;
          choices: Json;
          created_at: string;
          lc: string;
          email: string | null;
          role: 'user' | 'admin';
          vote_balance: number;
          can_vote: boolean;
        };
        Relationships: [];
      };
    };
    Functions: {
      cast_vote: {
        Args: { choices: string[]; [key: string]: unknown };
        Returns: { remaining: number }[];
      };
      admin_transfer_votes: {
        Args: {
          from_user: string;
          to_user: string;
          amount: number;
          actor_id?: string;
        };
        Returns: { from_remaining: number; to_remaining: number }[];
      };
      admin_set_votes: {
        Args: { user_id: string; new_amount: number; actor_id?: string };
        Returns: { votes_remaining: number }[];
      };
      admin_toggle_vote_permission: {
        Args: { user_id: string; can_vote: boolean; actor_id?: string };
        Returns: { can_vote: boolean }[];
      };
    };
  };
}

export type Profile = Database['public']['Views']['profiles_with_email']['Row'];
export type VoteRow = Database['public']['Tables']['votes']['Row'];
export type VoteWithUser = Database['public']['Views']['votes_with_users']['Row'];
