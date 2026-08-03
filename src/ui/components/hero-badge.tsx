import { Link } from "~/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG, SYSTEM_CONFIG } from "~/app";
import { getGithubStars } from "~/lib/queries/github";

import { GitHubIcon } from "./icons/github";

export async function HeroBadge() {
  const githubStars = await getGithubStars();
  const tHero = await getTranslations("HeroBadge");
  const tSeo = await getTranslations("SEO");

  // Brand stays language-neutral; the slogan is localized via SEO.slogan
  // (already translated in all 11 message files).
  const badgeText = `${SEO_CONFIG.name} - ${tSeo("slogan")}`;

  return (
    <Link
      className={`
        inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm
        font-semibold text-primary
      `}
      href={
        SYSTEM_CONFIG.repoStars
          ? `https://github.com/${SYSTEM_CONFIG.repoOwner}/${SYSTEM_CONFIG.repoName}`
          : "/products"
      }
      rel={SYSTEM_CONFIG.repoStars ? "noopener noreferrer" : undefined}
      target={SYSTEM_CONFIG.repoStars ? "_blank" : undefined}
    >
      {SYSTEM_CONFIG.repoStars ? (
        <div className="flex items-center gap-1">
          <span>{badgeText}</span>
          <span className="text-muted-foreground">|</span>
          <GitHubIcon className="h-3.5 w-3.5" />
          {githubStars && (
            <span>⭐ {githubStars.toLocaleString()} {tHero("starsOnGithub")}</span>
          )}
        </div>
      ) : (
        badgeText
      )}
    </Link>
  );
}
