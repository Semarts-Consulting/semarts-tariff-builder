import type {
  AllocationMethodRow,
  AssetInput,
  CostPoolRow,
  DataInputRow,
  DirectCostInput,
  EmployeeCostInput,
  IndirectOverheadInput,
  ProjectStatus,
  SupplyContractChargeInput,
  SupplyDetailsInput
} from "@/types/project";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string | null;
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
          user_id?: string | null;
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
        Relationships: [];
      };
      project_data_inputs: {
        Row: {
          project_local_id: string;
          user_id: string | null;
          rows: DataInputRow[];
          assumptions: string;
          last_updated: string;
          updated_at: string;
        };
        Insert: {
          project_local_id: string;
          user_id?: string | null;
          rows?: DataInputRow[];
          assumptions?: string;
          last_updated: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_data_inputs"]["Insert"]>;
        Relationships: [];
      };
      project_cost_pools: {
        Row: {
          project_local_id: string;
          user_id: string | null;
          rows: CostPoolRow[];
          assumptions: string;
          last_updated: string;
          updated_at: string;
        };
        Insert: {
          project_local_id: string;
          user_id?: string | null;
          rows?: CostPoolRow[];
          assumptions?: string;
          last_updated: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_cost_pools"]["Insert"]>;
        Relationships: [];
      };
      project_allocation_methods: {
        Row: {
          project_local_id: string;
          user_id: string | null;
          rows: AllocationMethodRow[];
          assumptions: string;
          last_updated: string;
          updated_at: string;
        };
        Insert: {
          project_local_id: string;
          user_id?: string | null;
          rows?: AllocationMethodRow[];
          assumptions?: string;
          last_updated: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_allocation_methods"]["Insert"]
        >;
        Relationships: [];
      };
      boundary_meter_import_batches: {
        Row: {
          import_batch_id: string;
          project_local_id: string;
          user_id: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count: number;
          mpan_count: number;
          first_reading_date: string | null;
          last_reading_date: string | null;
          total_half_hour_kwh: number;
          has_issues: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          import_batch_id: string;
          project_local_id: string;
          user_id?: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count?: number;
          mpan_count?: number;
          first_reading_date?: string | null;
          last_reading_date?: string | null;
          total_half_hour_kwh?: number;
          has_issues?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["boundary_meter_import_batches"]["Insert"]
        >;
        Relationships: [];
      };
      boundary_meter_data: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          import_batch_id: string;
          mpan: string;
          reading_date: string;
          total_kwh: number;
          settlement_period_kwh: number[];
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_local_id: string;
          user_id?: string | null;
          import_batch_id: string;
          mpan: string;
          reading_date: string;
          total_kwh: number;
          settlement_period_kwh: number[];
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["boundary_meter_data"]["Insert"]>;
        Relationships: [];
      };
      asset_import_batches: {
        Row: {
          import_batch_id: string;
          project_local_id: string;
          user_id: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count: number;
          total_asset_value: number;
          chargeable_asset_value: number;
          has_issues: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          import_batch_id: string;
          project_local_id: string;
          user_id?: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count?: number;
          total_asset_value?: number;
          chargeable_asset_value?: number;
          has_issues?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["asset_import_batches"]["Insert"]>;
        Relationships: [];
      };
      asset_data: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          import_batch_id: string;
          description: string;
          asset_category: string;
          is_electrical_distribution_asset: boolean;
          is_chargeable_on_electricity_tariff: boolean;
          voltage: AssetInput["voltage"];
          network_level: string;
          life_years: number;
          prior_year_asset_value: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_local_id: string;
          user_id?: string | null;
          import_batch_id: string;
          description: string;
          asset_category: string;
          is_electrical_distribution_asset: boolean;
          is_chargeable_on_electricity_tariff: boolean;
          voltage: AssetInput["voltage"];
          network_level: string;
          life_years: number;
          prior_year_asset_value: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["asset_data"]["Insert"]>;
        Relationships: [];
      };
      direct_cost_import_batches: {
        Row: {
          import_batch_id: string;
          project_local_id: string;
          user_id: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count: number;
          total_annual_value: number;
          has_issues: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          import_batch_id: string;
          project_local_id: string;
          user_id?: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count?: number;
          total_annual_value?: number;
          has_issues?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["direct_cost_import_batches"]["Insert"]
        >;
        Relationships: [];
      };
      direct_cost_data: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          import_batch_id: string;
          description: string;
          cost_by_type: string;
          annual_value: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_local_id: string;
          user_id?: string | null;
          import_batch_id: string;
          description: string;
          cost_by_type: string;
          annual_value: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["direct_cost_data"]["Insert"]>;
        Relationships: [];
      };
      employee_cost_import_batches: {
        Row: {
          import_batch_id: string;
          project_local_id: string;
          user_id: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count: number;
          total_fte: number;
          weighted_fte: number;
          has_issues: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          import_batch_id: string;
          project_local_id: string;
          user_id?: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count?: number;
          total_fte?: number;
          weighted_fte?: number;
          has_issues?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["employee_cost_import_batches"]["Insert"]
        >;
        Relationships: [];
      };
      employee_cost_data: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          import_batch_id: string;
          role: string;
          role_type: EmployeeCostInput["roleType"];
          fte: number;
          time_percent: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_local_id: string;
          user_id?: string | null;
          import_batch_id: string;
          role: string;
          role_type: EmployeeCostInput["roleType"];
          fte: number;
          time_percent: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["employee_cost_data"]["Insert"]>;
        Relationships: [];
      };
      indirect_overhead_import_batches: {
        Row: {
          import_batch_id: string;
          project_local_id: string;
          user_id: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count: number;
          total_annual_cost: number;
          has_issues: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          import_batch_id: string;
          project_local_id: string;
          user_id?: string | null;
          source_file_name: string;
          uploaded_at: string;
          row_count?: number;
          total_annual_cost?: number;
          has_issues?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["indirect_overhead_import_batches"]["Insert"]
        >;
        Relationships: [];
      };
      indirect_overhead_data: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          import_batch_id: string;
          description: string;
          annual_cost: number;
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_local_id: string;
          user_id?: string | null;
          import_batch_id: string;
          description: string;
          annual_cost: IndirectOverheadInput["annualCost"];
          source_file_name: string;
          uploaded_at: string;
          row_fingerprint: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["indirect_overhead_data"]["Insert"]>;
        Relationships: [];
      };
      supply_details: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          mpan: string;
          supply_capacity_kva: number;
          voltage: SupplyDetailsInput["voltage"];
          transmission: SupplyDetailsInput["transmission"];
          distribution: SupplyDetailsInput["distribution"];
          tnuos_non_locational_charge_per_day: number;
          tnuos_triad_charge_per_kw: number;
          duos_fixed_charge_per_day: number;
          duos_import_capacity_pence_per_kva_per_day: number;
          duos_red_unit_pence_per_kwh: number;
          duos_amber_unit_pence_per_kwh: number;
          duos_green_unit_pence_per_kwh: number;
          duos_super_red_unit_pence_per_kwh: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          project_local_id: string;
          user_id?: string | null;
          mpan: string;
          supply_capacity_kva: number;
          voltage: SupplyDetailsInput["voltage"];
          transmission: SupplyDetailsInput["transmission"];
          distribution: SupplyDetailsInput["distribution"];
          tnuos_non_locational_charge_per_day?: number;
          tnuos_triad_charge_per_kw?: number;
          duos_fixed_charge_per_day?: number;
          duos_import_capacity_pence_per_kva_per_day?: number;
          duos_red_unit_pence_per_kwh?: number;
          duos_amber_unit_pence_per_kwh?: number;
          duos_green_unit_pence_per_kwh?: number;
          duos_super_red_unit_pence_per_kwh?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["supply_details"]["Insert"]>;
        Relationships: [];
      };
      supply_contract_charges: {
        Row: {
          id: string;
          project_local_id: string;
          user_id: string | null;
          supply_detail_id: string;
          charge_name: string;
          losses: SupplyContractChargeInput["losses"];
          charge_type: SupplyContractChargeInput["chargeType"];
          unit_of_measurement: SupplyContractChargeInput["unitOfMeasurement"];
          time_of_use: SupplyContractChargeInput["timeOfUse"];
          custom_time_of_use: SupplyContractChargeInput["customTimeOfUse"];
          rate_unit: SupplyContractChargeInput["rateUnit"];
          rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          project_local_id: string;
          user_id?: string | null;
          supply_detail_id: string;
          charge_name: string;
          losses: SupplyContractChargeInput["losses"];
          charge_type: SupplyContractChargeInput["chargeType"];
          unit_of_measurement: SupplyContractChargeInput["unitOfMeasurement"];
          time_of_use?: SupplyContractChargeInput["timeOfUse"];
          custom_time_of_use?: SupplyContractChargeInput["customTimeOfUse"];
          rate_unit: SupplyContractChargeInput["rateUnit"];
          rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["supply_contract_charges"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
