export interface GlossaryEntry {
  definition: string;
  link: string;
  category?: string;
}

export interface GlossaryTerms {
  [key: string]: GlossaryEntry;
} 