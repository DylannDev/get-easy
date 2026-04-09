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
    };
  };
}
