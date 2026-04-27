export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      agencies: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          city: string;
          address: string;
          open_time: string;
          close_time: string;
          interval: number;
          rental_terms: Json | null;
          rental_terms_updated_at: string | null;
          legal_form: string | null;
          capital_social: string | null;
          rcs_city: string | null;
          rcs_number: string | null;
          siret: string | null;
          tva_intracom: string | null;
          logo_url: string | null;
          logo_dark_url: string | null;
          vat_enabled: boolean;
          postal_code: string | null;
          country: string | null;
          default_loueur_signature: string | null;
          quote_validity_days: number;
          rib: string | null;
          show_rib_on_quote: boolean;
          sms_enabled: boolean;
          sms_admin_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string; // Optional - Supabase will auto-generate if not provided
          organization_id: string;
          name: string;
          city: string;
          address: string;
          open_time: string;
          close_time: string;
          interval: number;
          rental_terms?: Json | null;
          rental_terms_updated_at?: string | null;
          legal_form?: string | null;
          capital_social?: string | null;
          rcs_city?: string | null;
          rcs_number?: string | null;
          siret?: string | null;
          tva_intracom?: string | null;
          logo_url?: string | null;
          logo_dark_url?: string | null;
          vat_enabled?: boolean;
          postal_code?: string | null;
          country?: string | null;
          default_loueur_signature?: string | null;
          quote_validity_days?: number;
          rib?: string | null;
          show_rib_on_quote?: boolean;
          sms_enabled?: boolean;
          sms_admin_phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          city?: string;
          address?: string;
          open_time?: string;
          close_time?: string;
          interval?: number;
          rental_terms?: Json | null;
          rental_terms_updated_at?: string | null;
          legal_form?: string | null;
          capital_social?: string | null;
          rcs_city?: string | null;
          rcs_number?: string | null;
          siret?: string | null;
          tva_intracom?: string | null;
          logo_url?: string | null;
          logo_dark_url?: string | null;
          vat_enabled?: boolean;
          postal_code?: string | null;
          country?: string | null;
          default_loueur_signature?: string | null;
          quote_validity_days?: number;
          rib?: string | null;
          show_rib_on_quote?: boolean;
          sms_enabled?: boolean;
          sms_admin_phone?: string | null;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          agency_id: string;
          brand: string;
          model: string;
          color: string;
          price_per_day: number;
          transmission: string;
          fuel_type: string;
          number_of_seats: number;
          number_of_doors: number;
          trunk_size: string;
          year: number;
          registration_plate: string;
          quantity: number;
          img: string;
          fiscal_power: number | null;
          created_at: string;
        };
        Insert: {
          id?: string; // Optional - Supabase will auto-generate if not provided
          agency_id: string;
          brand: string;
          model: string;
          color: string;
          price_per_day: number;
          transmission: string;
          fuel_type: string;
          number_of_seats: number;
          number_of_doors: number;
          trunk_size: string;
          year: number;
          registration_plate: string;
          quantity: number;
          img: string;
          fiscal_power?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          brand?: string;
          model?: string;
          color?: string;
          price_per_day?: number;
          transmission?: string;
          fuel_type?: string;
          number_of_seats?: number;
          number_of_doors?: number;
          trunk_size?: string;
          year?: number;
          registration_plate?: string;
          quantity?: number;
          img?: string;
          fiscal_power?: number | null;
          created_at?: string;
        };
      };
      blocked_periods: {
        Row: {
          id: string;
          vehicle_id: string;
          start: string;
          end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          start: string;
          end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          start?: string;
          end?: string;
          created_at?: string;
        };
      };
      pricing_tiers: {
        Row: {
          id: string;
          vehicle_id: string;
          min_days: number;
          price_per_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          min_days: number;
          price_per_day: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          min_days?: number;
          price_per_day?: number;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          birth_date: string;
          birth_place: string | null;
          address: string;
          address2: string | null;
          postal_code: string;
          city: string;
          country: string;
          driver_license_number: string | null;
          driver_license_issued_at: string | null;
          driver_license_country: string | null;
          company_name: string | null;
          siret: string | null;
          vat_number: string | null;
          created_at: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          birth_date: string;
          birth_place?: string | null;
          address: string;
          address2?: string | null;
          postal_code: string;
          city: string;
          country: string;
          driver_license_number?: string | null;
          driver_license_issued_at?: string | null;
          driver_license_country?: string | null;
          company_name?: string | null;
          siret?: string | null;
          vat_number?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          birth_date?: string;
          birth_place?: string | null;
          address?: string;
          address2?: string | null;
          postal_code?: string;
          city?: string;
          country?: string;
          driver_license_number?: string | null;
          driver_license_issued_at?: string | null;
          driver_license_country?: string | null;
          company_name?: string | null;
          siret?: string | null;
          vat_number?: string | null;
          created_at?: string;
          user_id?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_id: string;
          agency_id: string;
          start_date: string;
          end_date: string;
          total_price: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_id: string;
          agency_id: string;
          start_date: string;
          end_date: string;
          total_price: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_id?: string;
          agency_id?: string;
          start_date?: string;
          end_date?: string;
          total_price?: number;
          status?: string;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          provider: string;
          amount: number;
          currency: string;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          provider?: string;
          amount: number;
          currency?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          provider?: string;
          amount?: number;
          currency?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      options: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          description: string | null;
          price_type: string;
          price: number;
          max_quantity: number;
          active: boolean;
          sort_order: number;
          cap_enabled: boolean;
          monthly_cap: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          description?: string | null;
          price_type: string;
          price: number;
          max_quantity?: number;
          active?: boolean;
          sort_order?: number;
          cap_enabled?: boolean;
          monthly_cap?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          description?: string | null;
          price_type?: string;
          price?: number;
          max_quantity?: number;
          active?: boolean;
          sort_order?: number;
          cap_enabled?: boolean;
          monthly_cap?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      booking_options: {
        Row: {
          id: string;
          booking_id: string;
          option_id: string;
          quantity: number;
          unit_price_snapshot: number;
          price_type_snapshot: string;
          name_snapshot: string;
          monthly_cap_snapshot: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          option_id: string;
          quantity?: number;
          unit_price_snapshot: number;
          price_type_snapshot: string;
          name_snapshot: string;
          monthly_cap_snapshot?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          option_id?: string;
          quantity?: number;
          unit_price_snapshot?: number;
          price_type_snapshot?: string;
          name_snapshot?: string;
          monthly_cap_snapshot?: number | null;
          created_at?: string;
        };
      };
      booking_contract_fields: {
        Row: {
          booking_id: string;
          fields: Json;
          customer_signature: string | null;
          loueur_signature: string | null;
          signed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          booking_id: string;
          fields?: Json;
          customer_signature?: string | null;
          loueur_signature?: string | null;
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          booking_id?: string;
          fields?: Json;
          customer_signature?: string | null;
          loueur_signature?: string | null;
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customer_documents: {
        Row: {
          id: string;
          customer_id: string;
          booking_id: string | null;
          type: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          booking_id?: string | null;
          type: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          booking_id?: string | null;
          type?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string;
          size?: number;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          agency_id: string;
          booking_id: string | null;
          quote_id: string | null;
          inspection_report_id: string | null;
          type: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size: number;
          invoice_number: string | null;
          quote_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          booking_id?: string | null;
          quote_id?: string | null;
          inspection_report_id?: string | null;
          type: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size: number;
          invoice_number?: string | null;
          quote_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          booking_id?: string | null;
          quote_id?: string | null;
          inspection_report_id?: string | null;
          type?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string;
          size?: number;
          invoice_number?: string | null;
          quote_number?: string | null;
          created_at?: string;
        };
      };
      inspection_reports: {
        Row: {
          id: string;
          booking_id: string;
          type: string;
          mileage: number | null;
          fuel_level: string | null;
          notes: string | null;
          customer_signature: string | null;
          signed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          type: string;
          mileage?: number | null;
          fuel_level?: string | null;
          notes?: string | null;
          customer_signature?: string | null;
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          type?: string;
          mileage?: number | null;
          fuel_level?: string | null;
          notes?: string | null;
          customer_signature?: string | null;
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inspection_photos: {
        Row: {
          id: string;
          report_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size: number;
          note: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size: number;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string;
          size?: number;
          note?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          agency_id: string;
          customer_id: string;
          vehicle_id: string;
          start_date: string;
          end_date: string;
          base_price: number;
          options_total: number;
          cgl_total: number;
          total_price: number;
          valid_until: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          agency_id: string;
          customer_id: string;
          vehicle_id: string;
          start_date: string;
          end_date: string;
          base_price: number;
          options_total?: number;
          cgl_total?: number;
          total_price: number;
          valid_until: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          agency_id?: string;
          customer_id?: string;
          vehicle_id?: string;
          start_date?: string;
          end_date?: string;
          base_price?: number;
          options_total?: number;
          cgl_total?: number;
          total_price?: number;
          valid_until?: string;
          created_at?: string;
          created_by?: string | null;
        };
      };
      quote_options: {
        Row: {
          id: string;
          quote_id: string;
          option_id: string;
          quantity: number;
          unit_price_snapshot: number;
          price_type_snapshot: string;
          name_snapshot: string;
          monthly_cap_snapshot: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          option_id: string;
          quantity?: number;
          unit_price_snapshot: number;
          price_type_snapshot: string;
          name_snapshot: string;
          monthly_cap_snapshot?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          option_id?: string;
          quantity?: number;
          unit_price_snapshot?: number;
          price_type_snapshot?: string;
          name_snapshot?: string;
          monthly_cap_snapshot?: number | null;
          created_at?: string;
        };
      };
      quote_sequences: {
        Row: {
          organization_id: string;
          year: number;
          current_number: number;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          year: number;
          current_number?: number;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          year?: number;
          current_number?: number;
          updated_at?: string;
        };
      };
    };
  };
}
