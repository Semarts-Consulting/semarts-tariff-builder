import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  ProjectStatus
} from "@/types/project";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          local_id: string;
          name: string;
          network_name: string;
          tariff_year: number;
          effective_date: string;
          billing_period: string;
          customer_classes: string[];
          status: ProjectStatus;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          local_id: string;
          name: string;
          network_name: string;
          tariff_year: number;
          effective_date: string;
          billing_period: string;
          customer_classes?: string[];
          status?: ProjectStatus;
          last_updated: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      project_data_inputs: {
        Row: {
          project_local_id: string;
          rows: DataInputRow[];
          assumptions: string;
          last_updated: string;
          updated_at: string;
        };
        Insert: {
          project_local_id: string;
          rows?: DataInputRow[];
          assumptions?: string;
          last_updated: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_data_inputs"]["Insert"]>;
      };
      project_cost_pools: {
        Row: {
          project_local_id: string;
          rows: CostPoolRow[];
          assumptions: string;
          last_updated: string;
          updated_at: string;
        };
        Insert: {
          project_local_id: string;
          rows?: CostPoolRow[];
          assumptions?: string;
          last_updated: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_cost_pools"]["Insert"]>;
      };
      project_allocation_methods: {
        Row: {
          project_local_id: string;
          rows: AllocationMethodRow[];
          assumptions: string;
          last_updated: string;
          updated_at: string;
        };
        Insert: {
          project_local_id: string;
          rows?: AllocationMethodRow[];
          assumptions?: string;
          last_updated: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_allocation_methods"]["Insert"]
        >;
      };
    };
  };
};
