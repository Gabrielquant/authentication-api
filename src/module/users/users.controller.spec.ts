import { Test, TestingModule } from "@nestjs/testing";
import { PayloadDto, Role } from "../auth/dto/payload.dto";
import { UpdateUserDto } from "./dto/updateuser.dto";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
	let usersController: UsersController;
	let userService: jest.Mocked<UsersService>;

	const mockUsersService = {
		updateUser: jest.fn(),
		getUser: jest.fn(),
	};

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
			],
		}).compile();

		usersController = module.get<UsersController>(UsersController);
		userService = module.get(UsersService);
	});

	it("should be defined", () => {
		expect(usersController).toBeDefined();
	});

	describe("Update User", () => {
		it("deve chamar userService.updateUser com UpdateUserDto e userId e retornar o resultado", async () => {
			const updateUserDto: UpdateUserDto = {
				email: "updated@example.com",
				password: "novaSenha123",
			};
			const userId = "user-id-123";
			const expectedResponse = { email: "updated@example.com" };

			mockUsersService.updateUser.mockResolvedValue(expectedResponse);

			const result = await usersController.updateUser(updateUserDto, userId);

			expect(userService.updateUser).toHaveBeenCalledTimes(1);
			expect(userService.updateUser).toHaveBeenCalledWith(
				updateUserDto,
				userId,
			);
			expect(result).toEqual(expectedResponse);
		});

		it("should accept update only email", async () => {
			const updateUserDto: UpdateUserDto = { email: "only-email@example.com" };
			const userId = "user-id-123";
			const expectedResponse = { email: "only-email@example.com" };

			mockUsersService.updateUser.mockResolvedValue(expectedResponse);

			const result = await usersController.updateUser(updateUserDto, userId);

			expect(userService.updateUser).toHaveBeenCalledWith(
				updateUserDto,
				userId,
			);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe("getUser", () => {
		it("should call userService.getUser with PayloadDto and return list of users", async () => {
			const payloadDto: PayloadDto = {
				sub: "user-id",
				email: "admin@example.com",
				role: Role.ADMIN,
				iat: 1234567890,
				exp: 1234567890,
			};
			const expectedUsers = [
				{
					id: "user-1",
					email: "user1@example.com",
					role: "USER",
				},
				{
					id: "user-2",
					email: "user2@example.com",
					role: "USER",
				},
			];

			mockUsersService.getUser.mockResolvedValue(expectedUsers as never);

			const result = await usersController.getUser(payloadDto);

			expect(userService.getUser).toHaveBeenCalledTimes(1);
			expect(userService.getUser).toHaveBeenCalledWith(payloadDto);
			expect(result).toEqual(expectedUsers);
		});
	});
});
