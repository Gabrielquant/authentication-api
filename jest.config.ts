export default {
	moduleFileExtensions: ["js", "json", "ts"],
	rootDir: "src",
	moduleNameMapper: {
		"^src/(.*)$": "<rootDir>/$1",
	},
	testRegex: ".*\\.spec\\.ts$",
	transform: {
		"^.+\\.(t|j)s$": "ts-jest",
	},
	collectCoverageFrom: [
		"**/*.(t|j)s",
		"!main.ts",
		"!**/*.module.ts",
	],
	coverageDirectory: "../coverage",
	coverageThreshold: {
		global: {
			statements: 80,
			branches: 80,
			functions: 80,
			lines: 80,
		},
	},
	testEnvironment: "node",
};
