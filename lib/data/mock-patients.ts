import { mockFhirBundles } from "@/lib/data/mock-fhir";

export const mockPatients = mockFhirBundles.map((bundle) => bundle.Patient);
