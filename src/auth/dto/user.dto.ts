import { $Enums } from "@prisma/client";

export class UserDto {
	id: string;
	email: string;
	role: $Enums.Role;
	passwordHash: string
}
