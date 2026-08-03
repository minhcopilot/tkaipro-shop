import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { licenseTable } from "./tables";

export type License = InferSelectModel<typeof licenseTable>;
export type NewLicense = InferInsertModel<typeof licenseTable>;

export interface JetBrainsProduct {
  code: string;
  name: string;
}

export const JETBRAINS_PRODUCTS: JetBrainsProduct[] = [
  { code: "II,PCWMP,PSI", name: "IntelliJ IDEA" },
  { code: "PC,PSI,PCWMP", name: "PyCharm" },
  { code: "WS,PCWMP,PSI", name: "WebStorm" },
  { code: "PS,PCWMP,PSI", name: "PhpStorm" },
  { code: "GO,PSI,PCWMP", name: "GoLand" },
  { code: "CL,PSI,PCWMP", name: "CLion" },
  { code: "RD,PDB,PSI,PCWMP", name: "Rider" },
  { code: "DB,PSI,PDB", name: "DataGrip" },
  { code: "RM,PCWMP,PSI", name: "RubyMine" },
  { code: "AC,PCWMP,PSI", name: "AppCode" },
  { code: "DS,PSI,PDB,PCWMP", name: "DataSpell" },
  { code: "DM", name: "dotMemory" },
  { code: "RR,PSI,PCWP", name: "RustRover" },
]; 