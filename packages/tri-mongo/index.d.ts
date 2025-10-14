import type { Connection } from "mongoose";
export type DbName = "core" | "pii" | "votes";
export function getConn(name: DbName): Promise<Connection>;
export function getPiiConn(): Promise<Connection>;
export function getVotesConn(): Promise<Connection>;
export function getCoreConn(): Promise<Connection>;
export const core: any;
export const pii: any;
export const votes: any;
