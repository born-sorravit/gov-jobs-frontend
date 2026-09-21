/**
 * Mirrors the backend's response contract.
 *
 * The two apps are separate repos, so there is no shared package — these types are kept in
 * step with `gov-jobs-backend/src/shared/interfaces/response.interface.ts` by hand.
 */
export interface PaginationMeta {
	total: number;
	page: number;
	last_page: number;
	limit: number;
}

export interface ApiEnvelope<T> {
	status: "success" | "error";
	statusCode?: number;
	message: string | null;
	data: T;
	meta?: PaginationMeta;
}

export interface Paginated<T> {
	data: T[];
	meta: PaginationMeta;
}

export type JobStatus = "UPCOMING" | "OPEN" | "CLOSED";
export type AlertFrequency = "IMMEDIATE" | "DAILY" | "WEEKLY";
export type JobSource = "OCSC";

/** A taxonomy row: the source's integer id plus both labels. */
export interface ReferenceOption {
	id: number;
	nameTh: string;
	nameEn: string | null;
}

export interface JobAttachment {
	id: string;
	name: string;
	url: string;
	type: "ANNOUNCEMENT_PDF" | "OTHER";
}

/** Everything the taxonomy endpoint returns, keyed the way the filter UI consumes it. */
export interface ReferenceCatalog {
	provinces: ReferenceOption[];
	educationLevels: ReferenceOption[];
	jobTypes: ReferenceOption[];
	jobCategories: ReferenceOption[];
	jobLevels: ReferenceOption[];
	jobSelections: ReferenceOption[];
	jobConditions: ReferenceOption[];
}

/** The list-card shape: everything a job card shows without opening the announcement. */
export interface JobSummary {
	id: string;
	source: JobSource;
	externalId: string;
	title: string;
	agency: string;
	ministry: string | null;
	agencySealUrl: string | null;
	jobTypeId: number | null;
	jobCategoryId: number | null;
	provinceIds: number[];
	educationLevelIds: number[];
	/** The source listed no province: the posting is nationwide, not unknown. */
	isNationwide: boolean;
	salaryMin: number | null;
	salaryMax: number | null;
	positionAmount: number | null;
	applicationStart: string | null;
	applicationEnd: string | null;
	publishedAt: string | null;
	status: JobStatus;
	/** 0 is the last day to apply, negative has passed, null means no deadline announced. */
	daysUntilDeadline: number | null;
	sourceUrl: string;
	isSaved?: boolean;
}

export interface JobDetail extends JobSummary {
	jobLevelId: number | null;
	jobSelectionId: number | null;
	jobConditionId: number | null;
	competency: string | null;
	criteria: string | null;
	jobConditionOther: string | null;
	educationLevelOther: string | null;
	description: string | null;
	educationRequirements: string | null;
	knowledge: string | null;
	skill: string | null;
	examDate: string | null;
	interviewDate: string | null;
	applyUrl: string | null;
	attachments: JobAttachment[];
}

export interface JobAlert {
	id: string;
	name: string;
	keywords: string[];
	jobTypes: number[];
	educations: number[];
	provinces: number[];
	notificationEmail: string;
	frequency: AlertFrequency;
	isActive: boolean;
	lastSentAt: string | null;
	createdAt: string;
}

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	role: "USER" | "ADMIN";
	isVerified: boolean;
	locale: string;
}

/** Mirrors `QueryJobsDto`. Arrays are sent as repeated keys: `?province=1&province=2`. */
export interface JobsQuery {
	q?: string;
	jobType?: number[];
	jobCategory?: number[];
	education?: number[];
	province?: number[];
	/** Exclude nationwide postings from a province filter. Default false — they are included. */
	provinceStrict?: boolean;
	status?: JobStatus;
	salaryMin?: number;
	salaryMax?: number;
	page?: number;
	limit?: number;
	sortBy?: "publishedAt" | "applicationEnd" | "applicationStart" | "salaryMax" | "salaryMin" | "title" | "firstSeenAt";
	order?: "ASC" | "DESC";
}
