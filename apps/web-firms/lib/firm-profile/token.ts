import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { assertFirmSessionTokenSize } from './contracts'
export const OUTSETA_ISSUER = 'https://nested-objects.outseta.com'
const keys = createRemoteJWKSet(new URL(OUTSETA_ISSUER + '/.well-known/jwks'))
// The optional key resolver is for isolated signature tests, never request-controlled.
export async function verifyFirmJwt(token: string, resolver: JWTVerifyGetKey = keys) {
  assertFirmSessionTokenSize(token)
  return (await jwtVerify(token,resolver,{issuer:OUTSETA_ISSUER,audience:OUTSETA_ISSUER,algorithms:['RS256'],requiredClaims:['exp','iat','sub']})).payload
}
