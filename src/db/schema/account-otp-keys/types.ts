import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { accountOtpKeysTable } from "./tables";

export type AccountOtpKey = InferSelectModel<typeof accountOtpKeysTable>;
export type AccountOtpKeyInsert = InferInsertModel<typeof accountOtpKeysTable>;
