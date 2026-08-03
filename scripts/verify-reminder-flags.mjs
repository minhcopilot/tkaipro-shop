import postgres from "postgres";

const c = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const sub = await c`
    SELECT
      COUNT(*) FILTER (WHERE reminder_3day_sent_at IS NOT NULL) AS r3,
      COUNT(*) FILTER (WHERE reminder_1day_sent_at IS NOT NULL) AS r1
    FROM subscription
  `;
  const job = await c`
    SELECT
      COUNT(*) FILTER (WHERE reminder_3day_sent_at IS NOT NULL) AS r3,
      COUNT(*) FILTER (WHERE reminder_1day_sent_at IS NOT NULL) AS r1
    FROM activation_job
  `;
  console.log("subscription reminder flags:", sub[0]);
  console.log("activation_job reminder flags:", job[0]);

  // Sample 3 latest sub reminders
  const samples = await c`
    SELECT customer_email, product_name, expires_at, reminder_3day_sent_at, reminder_1day_sent_at
    FROM subscription
    WHERE reminder_3day_sent_at IS NOT NULL OR reminder_1day_sent_at IS NOT NULL
    ORDER BY GREATEST(
      COALESCE(reminder_3day_sent_at, '1970-01-01'),
      COALESCE(reminder_1day_sent_at, '1970-01-01')
    ) DESC
    LIMIT 3
  `;
  console.log("\nlatest sub reminders sent (top 3):");
  for (const s of samples) {
    console.log(
      "  ",
      s.customer_email,
      "|",
      s.product_name,
      "| expires:",
      s.expires_at?.toISOString(),
      "| 3d:",
      s.reminder_3day_sent_at?.toISOString() ?? "-",
      "| 1d:",
      s.reminder_1day_sent_at?.toISOString() ?? "-",
    );
  }

  const jobSamples = await c`
    SELECT customer_email, plan_days, completed_at, reminder_3day_sent_at, reminder_1day_sent_at
    FROM activation_job
    WHERE reminder_3day_sent_at IS NOT NULL OR reminder_1day_sent_at IS NOT NULL
    ORDER BY GREATEST(
      COALESCE(reminder_3day_sent_at, '1970-01-01'),
      COALESCE(reminder_1day_sent_at, '1970-01-01')
    ) DESC
    LIMIT 3
  `;
  console.log("\nlatest activation_job reminders sent (top 3):");
  for (const s of jobSamples) {
    console.log(
      "  ",
      s.customer_email,
      "| planDays:",
      s.plan_days,
      "| completed:",
      s.completed_at?.toISOString(),
      "| 3d:",
      s.reminder_3day_sent_at?.toISOString() ?? "-",
      "| 1d:",
      s.reminder_1day_sent_at?.toISOString() ?? "-",
    );
  }
} finally {
  await c.end({ timeout: 5 });
}
