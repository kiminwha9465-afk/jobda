export type ApplicationStatus =
  | 'INTERESTED' | 'PLAN_TO_APPLY' | 'APPLIED' | 'DOCUMENT_PASS'
  | 'INTERVIEW_1' | 'INTERVIEW_2' | 'FINAL_PASS' | 'REJECTED' | 'WITHDRAWN';

export type ScheduleType =
  | 'DEADLINE' | 'TEST' | 'INTERVIEW_1' | 'INTERVIEW_2'
  | 'INTERVIEW_FINAL' | 'CODING_TEST' | 'PERSONAL' | 'ETC';

export type ResumeType = 'RESUME' | 'PORTFOLIO';

export interface TagResponse { id: number; name: string; color: string | null; createdAt: string; }
export interface CompanyResponse {
  id: number; name: string; industry: string | null; location: string | null;
  website: string | null; size: string | null; welfare: string | null; memo: string | null;
  tags: TagResponse[]; jobPostingCount: number; createdAt: string; updatedAt: string;
}
export interface JobPostingResponse {
  id: number; title: string; companyId: number | null; companyName: string | null;
  url: string | null; deadline: string | null; status: ApplicationStatus; statusLabel: string;
  jobType: string | null; department: string | null; memo: string | null;
  tags: TagResponse[]; createdAt: string; updatedAt: string;
}
export interface CoverLetterItemResponse {
  id: number | null; question: string; answer: string | null;
  charLimit: number | null; orderIndex: number; currentLength: number;
}
export interface CoverLetterResponse {
  id: number; title: string; companyId: number | null; companyName: string | null;
  targetPosition: string | null; version: number; items: CoverLetterItemResponse[];
  tags: TagResponse[]; createdAt: string; updatedAt: string;
}
export interface ResumeResponse {
  id: number; title: string; type: ResumeType; typeLabel: string;
  content: string | null; targetCompany: string | null; targetPosition: string | null;
  version: number; isTemplate: boolean; fileUrl: string | null;
  originalFileName: string | null; tags: TagResponse[]; createdAt: string; updatedAt: string;
}
export interface ScheduleResponse {
  id: number; title: string; type: ScheduleType; typeLabel: string;
  scheduledAt: string; location: string | null; memo: string | null;
  completed: boolean; jobPostingId: number | null; jobPostingTitle: string | null;
  companyName: string | null; createdAt: string; updatedAt: string;
}
export interface DashboardResponse {
  totalPostings: number; activePostings: number; interviewCount: number;
  documentPassRate: number; statusSummary: Record<string, number>;
  upcomingSchedules: ScheduleResponse[]; upcomingDeadlines: JobPostingResponse[];
}
export interface SearchResponse {
  keyword: string; totalCount: number;
  companies: CompanyResponse[]; jobPostings: JobPostingResponse[];
  coverLetters: CoverLetterResponse[]; resumes: ResumeResponse[];
}

// Requests
export interface CompanyRequest { name: string; industry?: string; location?: string; website?: string; size?: string; welfare?: string; memo?: string; }
export interface JobPostingRequest { title: string; companyId?: number | null; url?: string; deadline?: string | null; status?: ApplicationStatus; jobType?: string; department?: string; memo?: string; }
export interface CoverLetterItemRequest { question: string; answer?: string; charLimit?: number; orderIndex?: number; }
export interface CoverLetterRequest { title: string; companyId?: number | null; targetPosition?: string; version?: number; items?: CoverLetterItemRequest[]; }
export interface ResumeRequest { title: string; type: ResumeType; content?: string; targetCompany?: string; targetPosition?: string; version?: number; isTemplate?: boolean; }
export interface ScheduleRequest { title: string; type: ScheduleType; scheduledAt: string; location?: string; memo?: string; jobPostingId?: number | null; }
export interface TagRequest { name: string; color?: string; }
