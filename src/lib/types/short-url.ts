export interface CreateURLRequest {
	originalURL: string;
	customCode?: string;
	title?: string;
	description?: string;
	expiresAt?: string;
}

export type URLStatusCode = 0 | 1 | 2 | 3;

export interface UpdateURLRequest {
	originalURL?: string;
	title?: string;
	description?: string;
	status?: URLStatusCode;
	expiresAt?: string;
}

export interface ShortURL {
	id: string;
	originalURL: string;
	shortCode: string;
	shortURL?: string;
	title?: string;
	description?: string;
	clicks: number;
	status: 'active' | 'expired' | 'inactive' | 'deleted';
	statusCode: URLStatusCode;
	health?: 'healthy' | 'inactive';
	createdAt?: string;
	expiresAt?: string;
}

export interface ShortURLPage {
	urls: ShortURL[];
	page: number;
	perPage: number;
	total: number;
}

export interface URLStatusCounts {
	all: number;
	active: number;
	disabled: number;
	expired: number;
	deleted: number;
}

export interface ClickLog {
	id: string;
	clickedAt: string;
	ipAddress: string;
	userAgent: string;
	referrer: string;
	browser: string;
	deviceType: string;
}

export interface ClickLogPage {
	clicks: ClickLog[];
	page: number;
	perPage: number;
	total: number;
}
