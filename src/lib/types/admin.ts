export interface BlockedDomain {
	id: number;
	domain: string;
	reason: string;
	createdAt: string;
}

export interface CreateBlockedDomainRequest {
	domain: string;
	reason?: string;
}

export interface BlockedIPRange {
	id: number;
	cidr: string;
	description: string;
}

export interface CreateBlockedIPRangeRequest {
	cidr: string;
	description: string;
}
