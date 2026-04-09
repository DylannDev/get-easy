import type { Agency } from "../agency/agency.entity";

export interface Organization {
  id: string;
  name: string;
  agencies: Agency[];
}
