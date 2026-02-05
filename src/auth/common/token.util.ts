import { createHash, randomBytes } from "node:crypto";

export function generateRawToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(rawToken: string): string {
  if (!process.env.TOKEN_PEPPER) {
    throw new Error('TOKEN_PEPPER not defined')
  }

  return createHash('sha256')
    .update(rawToken + process.env.TOKEN_PEPPER)
    .digest('hex')
}


export function newUserToken(){
  const rawToken = generateRawToken();
	const newToken = hashToken(rawToken);
  return newToken
}