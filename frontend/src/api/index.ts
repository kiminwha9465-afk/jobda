import axios from 'axios';
import type {
  DashboardResponse, CompanyResponse, JobPostingResponse, CoverLetterResponse,
  ResumeResponse, ScheduleResponse, TagResponse, SearchResponse,
  ApplicationStatus, CompanyRequest, JobPostingRequest, CoverLetterRequest,
  CoverLetterItemRequest, ResumeRequest, ScheduleRequest, TagRequest,
  ScheduleType, ResumeType, SaraminJob, SaraminKeyword, SaraminImportRequest,
  DartCompany, LoginRequest, RegisterRequest, AuthResponse,
} from '../types';

const http = axios.create({ baseURL: '/api' });

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data: LoginRequest) => http.post<AuthResponse>('/auth/login', data).then(r => r.data),
  register: (data: RegisterRequest) => http.post<AuthResponse>('/auth/register', data).then(r => r.data),
};

export const dashboardApi = {
  get: () => http.get<DashboardResponse>('/dashboard').then(r => r.data),
};

export const companiesApi = {
  list: (keyword?: string) => http.get<CompanyResponse[]>('/companies', { params: keyword ? { keyword } : {} }).then(r => r.data),
  get: (id: number) => http.get<CompanyResponse>(`/companies/${id}`).then(r => r.data),
  create: (data: CompanyRequest) => http.post<CompanyResponse>('/companies', data).then(r => r.data),
  update: (id: number, data: CompanyRequest) => http.put<CompanyResponse>(`/companies/${id}`, data).then(r => r.data),
  delete: (id: number) => http.delete(`/companies/${id}`),
  addTag: (id: number, tagId: number) => http.post<CompanyResponse>(`/companies/${id}/tags/${tagId}`).then(r => r.data),
  removeTag: (id: number, tagId: number) => http.delete<CompanyResponse>(`/companies/${id}/tags/${tagId}`).then(r => r.data),
};

export const jobPostingsApi = {
  list: (params?: { status?: ApplicationStatus; companyId?: number; keyword?: string }) =>
    http.get<JobPostingResponse[]>('/job-postings', { params }).then(r => r.data),
  get: (id: number) => http.get<JobPostingResponse>(`/job-postings/${id}`).then(r => r.data),
  create: (data: JobPostingRequest) => http.post<JobPostingResponse>('/job-postings', data).then(r => r.data),
  update: (id: number, data: JobPostingRequest) => http.put<JobPostingResponse>(`/job-postings/${id}`, data).then(r => r.data),
  updateStatus: (id: number, status: ApplicationStatus) =>
    http.patch<JobPostingResponse>(`/job-postings/${id}/status`, null, { params: { status } }).then(r => r.data),
  delete: (id: number) => http.delete(`/job-postings/${id}`),
  addTag: (id: number, tagId: number) => http.post<JobPostingResponse>(`/job-postings/${id}/tags/${tagId}`).then(r => r.data),
  removeTag: (id: number, tagId: number) => http.delete<JobPostingResponse>(`/job-postings/${id}/tags/${tagId}`).then(r => r.data),
};

export const coverLettersApi = {
  list: (companyId?: number) => http.get<CoverLetterResponse[]>('/cover-letters', { params: companyId ? { companyId } : {} }).then(r => r.data),
  create: (data: CoverLetterRequest) => http.post<CoverLetterResponse>('/cover-letters', data).then(r => r.data),
  update: (id: number, data: CoverLetterRequest) => http.put<CoverLetterResponse>(`/cover-letters/${id}`, data).then(r => r.data),
  delete: (id: number) => http.delete(`/cover-letters/${id}`),
  addItem: (id: number, data: CoverLetterItemRequest) => http.post<CoverLetterResponse>(`/cover-letters/${id}/items`, data).then(r => r.data),
  removeItem: (id: number, itemId: number) => http.delete<CoverLetterResponse>(`/cover-letters/${id}/items/${itemId}`).then(r => r.data),
  copy: (id: number) => http.post<CoverLetterResponse>(`/cover-letters/${id}/copy`).then(r => r.data),
  addTag: (id: number, tagId: number) => http.post<CoverLetterResponse>(`/cover-letters/${id}/tags/${tagId}`).then(r => r.data),
  removeTag: (id: number, tagId: number) => http.delete<CoverLetterResponse>(`/cover-letters/${id}/tags/${tagId}`).then(r => r.data),
};

export const resumesApi = {
  list: (params?: { type?: ResumeType; templateOnly?: boolean }) =>
    http.get<ResumeResponse[]>('/resumes', { params }).then(r => r.data),
  create: (data: ResumeRequest) => http.post<ResumeResponse>('/resumes', data).then(r => r.data),
  update: (id: number, data: ResumeRequest) => http.put<ResumeResponse>(`/resumes/${id}`, data).then(r => r.data),
  delete: (id: number) => http.delete(`/resumes/${id}`),
  copy: (id: number) => http.post<ResumeResponse>(`/resumes/${id}/copy`).then(r => r.data),
  uploadFile: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.post<ResumeResponse>(`/resumes/${id}/file`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  deleteFile: (id: number) => http.delete<ResumeResponse>(`/resumes/${id}/file`).then(r => r.data),
  addTag: (id: number, tagId: number) => http.post<ResumeResponse>(`/resumes/${id}/tags/${tagId}`).then(r => r.data),
  removeTag: (id: number, tagId: number) => http.delete<ResumeResponse>(`/resumes/${id}/tags/${tagId}`).then(r => r.data),
};

export const schedulesApi = {
  list: (params?: { type?: ScheduleType }) => http.get<ScheduleResponse[]>('/schedules', { params }).then(r => r.data),
  create: (data: ScheduleRequest) => http.post<ScheduleResponse>('/schedules', data).then(r => r.data),
  update: (id: number, data: ScheduleRequest) => http.put<ScheduleResponse>(`/schedules/${id}`, data).then(r => r.data),
  delete: (id: number) => http.delete(`/schedules/${id}`),
  toggleComplete: (id: number) => http.patch<ScheduleResponse>(`/schedules/${id}/complete`).then(r => r.data),
  upcoming: () => http.get<ScheduleResponse[]>('/schedules/upcoming').then(r => r.data),
};

export const tagsApi = {
  list: () => http.get<TagResponse[]>('/tags').then(r => r.data),
  create: (data: TagRequest) => http.post<TagResponse>('/tags', data).then(r => r.data),
  update: (id: number, data: TagRequest) => http.put<TagResponse>(`/tags/${id}`, data).then(r => r.data),
  delete: (id: number) => http.delete(`/tags/${id}`),
};

export const searchApi = {
  search: (keyword: string) => http.get<SearchResponse>('/search', { params: { keyword } }).then(r => r.data),
};

export const dartApi = {
  search: (corpName: string) =>
    http.get<DartCompany[]>('/dart/search', { params: { corpName } }).then(r => r.data),
  detail: (corpCode: string) =>
    http.get<DartCompany>(`/dart/detail/${corpCode}`).then(r => r.data),
  save: (data: { corpName: string; indutyCode?: string | null; address?: string | null; website?: string | null; corpCls?: string | null; memo?: string }) =>
    http.post<{ saved: boolean }>('/dart/save', data).then(r => r.data),
};

export const saraminApi = {
  search: (keyword: string, count = 20) =>
    http.get<SaraminJob[]>('/saramin/search', { params: { keyword, count } }).then(r => r.data),
  importJob: (data: SaraminImportRequest) =>
    http.post<void>('/saramin/import', data).then(r => r.data),
  importAll: (data: SaraminImportRequest[]) =>
    http.post<number>('/saramin/import-all', data).then(r => r.data),
  collect: () => http.post<number>('/saramin/collect').then(r => r.data),
  keywords: () => http.get<SaraminKeyword[]>('/saramin/keywords').then(r => r.data),
  addKeyword: (keyword: string) =>
    http.post<SaraminKeyword>('/saramin/keywords', { keyword }).then(r => r.data),
  deleteKeyword: (id: number) => http.delete(`/saramin/keywords/${id}`),
};
