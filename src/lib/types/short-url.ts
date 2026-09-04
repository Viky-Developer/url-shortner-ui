export interface CreateURLRequest {
	originalURL: string;
	customCode?: string;
	title?: string;
	description?: string;
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
	status: 'active' | 'expired' | 'inactive';
	health?: 'healthy' | 'inactive';
	createdAt?: string;
	expiresAt?: string;
}
