export class PayloadDto {
	sub: string;
	email: string;
	role: Role;
	iat: number;
	exp: number;
}

export enum Role {
	USER = "USER",
	ADMIN = "ADMIN",
	AUDITOR = "AUDITOR",
}
