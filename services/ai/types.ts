export type SummaryFormat = "bullets" | "paragraph" | "executive";

export interface SummarizeDocumentOptions {
  workspaceId: string;
  documentId: string;
  format?: SummaryFormat;
  maxLength?: number;
}

export interface WorkspaceQnAOptions {
  workspaceId: string;
  question: string;
  documentIds?: string[];
  maxContextDocs?: number;
}

export interface WorkspaceSummaryOptions {
  workspaceId: string;
  includeRecentOnly?: boolean;
}

export interface QnACitation {
  documentId: string;
  title: string;
  snippet: string;
}

export interface QnAResult {
  answer: string;
  citations: QnACitation[];
  relevantDocumentsCount: number;
}

export interface DocumentSummaryResult {
  documentId: string;
  documentTitle: string;
  summary: string;
  keyPoints: string[];
  format: SummaryFormat;
}

export interface WorkspaceSummaryResult {
  workspaceId: string;
  workspaceName: string;
  summary: string;
  totalDocumentsAnalyzed: number;
  keyTopics: string[];
  generatedAt: string;
}

export interface AiProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
}
