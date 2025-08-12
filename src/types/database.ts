// Database types generated from Supabase
export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      caregivers: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          relationship: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          relationship?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          relationship?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      babies: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          birth_date: string;
          gender: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          birth_date: string;
          gender?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          birth_date?: string;
          gender?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_records: {
        Row: {
          id: string;
          baby_id: string;
          caregiver_id: string;
          sleep_start: string;
          sleep_end: string | null;
          sleep_location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          caregiver_id: string;
          sleep_start: string;
          sleep_end?: string | null;
          sleep_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          caregiver_id?: string;
          sleep_start?: string;
          sleep_end?: string | null;
          sleep_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feeding_records: {
        Row: {
          id: string;
          baby_id: string;
          caregiver_id: string;
          feeding_type: string;
          breastfeeding_start: string | null;
          breastfeeding_end: string | null;
          breast_side: string | null;
          amount_ml: number | null;
          food_description: string | null;
          notes: string | null;
          feeding_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          caregiver_id: string;
          feeding_type: string;
          breastfeeding_start?: string | null;
          breastfeeding_end?: string | null;
          breast_side?: string | null;
          amount_ml?: number | null;
          food_description?: string | null;
          notes?: string | null;
          feeding_time: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          caregiver_id?: string;
          feeding_type?: string;
          breastfeeding_start?: string | null;
          breastfeeding_end?: string | null;
          breast_side?: string | null;
          amount_ml?: number | null;
          food_description?: string | null;
          notes?: string | null;
          feeding_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      walk_records: {
        Row: {
          id: string;
          baby_id: string;
          caregiver_id: string;
          walk_start: string;
          walk_end: string | null;
          location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          caregiver_id: string;
          walk_start: string;
          walk_end?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          caregiver_id?: string;
          walk_start?: string;
          walk_end?: string | null;
          location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      growth_records: {
        Row: {
          id: string;
          baby_id: string;
          caregiver_id: string;
          weight_grams: number;
          height_cm: number | null;
          head_circumference_cm: number | null;
          measurement_date: string;
          measurement_location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          caregiver_id: string;
          weight_grams: number;
          height_cm?: number | null;
          head_circumference_cm?: number | null;
          measurement_date: string;
          measurement_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          caregiver_id?: string;
          weight_grams?: number;
          height_cm?: number | null;
          head_circumference_cm?: number | null;
          measurement_date?: string;
          measurement_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      babies_with_latest_growth: {
        Row: {
          baby_id: string;
          baby_name: string;
          birth_date: string;
          gender: string | null;
          family_name: string;
          current_weight_grams: number | null;
          current_height_cm: number | null;
          current_head_circumference_cm: number | null;
          last_measurement_date: string | null;
          age_days: number | null;
          age_months: number | null;
        };
      };
      recent_sleep_records: {
        Row: {
          baby_id: string;
          baby_name: string;
          family_name: string;
          baby_identifier: string;
          caregiver_name: string;
          sleep_start: string;
          sleep_end: string | null;
          duration: string;
          sleep_location: string | null;
          created_at: string;
        };
      };
      recent_feeding_records: {
        Row: {
          baby_id: string;
          baby_name: string;
          family_name: string;
          baby_identifier: string;
          caregiver_name: string;
          feeding_time: string;
          feeding_type: string;
          amount_ml: number | null;
          breastfeeding_duration: string | null;
          breast_side: string | null;
          created_at: string;
        };
      };
      recent_growth_records: {
        Row: {
          baby_id: string;
          baby_name: string;
          family_name: string;
          baby_identifier: string;
          caregiver_name: string;
          measurement_date: string;
          weight_grams: number;
          height_cm: number | null;
          head_circumference_cm: number | null;
          age_days: number;
          measurement_location: string | null;
          notes: string | null;
          created_at: string;
        };
      };
    };
    Functions: {
      daily_sleep_report: {
        Args: {
          baby_uuid: string;
          report_date?: string;
        };
        Returns: {
          total_sleep_minutes: number;
          total_sleep_sessions: number;
          longest_sleep_minutes: number;
          average_sleep_minutes: number;
          sleep_sessions: any;
        }[];
      };
      daily_feeding_report: {
        Args: {
          baby_uuid: string;
          report_date?: string;
        };
        Returns: {
          total_feedings: number;
          breastfeeding_count: number;
          bottle_count: number;
          total_bottle_ml: number;
          total_breastfeeding_minutes: number;
          feeding_details: any;
        }[];
      };
      baby_current_status: {
        Args: {
          baby_uuid: string;
        };
        Returns: {
          baby_name: string;
          current_status: string;
          status_since: string | null;
          last_feeding: string | null;
          last_feeding_type: string | null;
          hours_since_last_feeding: number | null;
        }[];
      };
      get_latest_growth: {
        Args: {
          baby_uuid: string;
        };
        Returns: {
          weight_grams: number | null;
          height_cm: number | null;
          head_circumference_cm: number | null;
          measurement_date: string | null;
          age_days: number | null;
        }[];
      };
      growth_report: {
        Args: {
          baby_uuid: string;
          start_date?: string | null;
          end_date?: string;
        };
        Returns: {
          total_measurements: number;
          first_measurement_date: string | null;
          latest_measurement_date: string | null;
          weight_gain_grams: number;
          height_gain_cm: number | null;
          head_growth_cm: number | null;
          average_weight_gain_per_month: number | null;
          measurements: any;
        }[];
      };
    };
  };
}
