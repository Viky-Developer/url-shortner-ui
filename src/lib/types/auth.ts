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
	token: RefreshTokenResponse;
	user: UserResponse;
}

export interface RefreshTokenResponse {
	accessToken: string | null;
	refreshToken: string | null;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface AuthenticatedUser {
	id: string;
	displayName: string;
	email?: string;
	role?: string;
}

export interface AuthResponseEnvelope {
	statusCode: number;
	message: string;
	data: AuthResponse[];
}
