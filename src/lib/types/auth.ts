export interface RegisterRequest {
	email: string;
	password: string;
	displayName?: string;
}

export interface UserResponse {
	id: string | null;
	email: string | null;
	displayName?: string | null;
	role?: string | null;
	passwordAgeDays?: number | null;
	changeSuggested?: boolean | null;
}

export interface AuthResponse {
	accessToken: string | null;
	refreshToken: string | null;
	user: UserResponse;
}

export interface AuthResponseEnvelope {
	statusCode: number;
	message: string;
	data: AuthResponse[];
}
