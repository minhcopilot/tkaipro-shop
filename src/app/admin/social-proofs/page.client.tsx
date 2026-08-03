"use client";

import type { SocialProof } from "~/db/schema";

import { ProofList } from "./components/proof-list";

interface SocialProofsClientPageProps {
  proofs: SocialProof[];
}

export default function SocialProofsClientPage({ proofs }: SocialProofsClientPageProps) {
  return (
    <div className="p-6">
      <ProofList initialProofs={proofs} />
    </div>
  );
}

