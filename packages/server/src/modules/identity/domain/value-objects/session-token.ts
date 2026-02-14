import { Brand } from "effect"

export type SessionToken = string & Brand.Brand<"SessionToken">
export const SessionToken = Brand.nominal<SessionToken>()
