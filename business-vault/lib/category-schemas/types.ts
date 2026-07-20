// Shared types for the StructuredCategoryView schema system

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'email'
  | 'url'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'currency';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select/multiselect
  copyable?: boolean; // show copy-to-clipboard button (mail_draft)
  width?: 'full' | 'half' | 'third';
}

export interface CategorySchema {
  categoryKey: string;
  displayMode: 'table' | 'cards' | 'timeline' | 'task-list' | 'accordion' | 'feed';
  fields: FieldConfig[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  statusField?: string; // field used for status badge coloring
  primaryField?: string; // the "title" field shown in list views
}
