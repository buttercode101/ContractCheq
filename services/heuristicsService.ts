import { HeuristicIssue } from "../types";

const RULES = [
  {
    pattern: /unilateral.*change|change.*without.*notice|amend.*at.*any.*time/i,
    issue: {
      risk_level: 'HIGH' as const,
      why_risky: 'Allows the other party to change terms without your consent, which is often considered unfair under the Consumer Protection Act.',
      what_to_do: 'Negotiate for a clause requiring written consent from both parties for any amendments.',
      act_reference: 'Consumer Protection Act (CPA) Section 48'
    }
  },
  {
    pattern: /waive.*right.*to.*sue|no.*liability.*for.*negligence|indemnify.*against.*all.*claims/i,
    issue: {
      risk_level: 'HIGH' as const,
      why_risky: 'Broad indemnity or liability waivers can be unlawful in SA if they attempt to waive liability for gross negligence or statutory rights.',
      what_to_do: 'Limit the indemnity to direct losses caused by your own breach and exclude gross negligence.',
      act_reference: 'Consumer Protection Act (CPA) Section 51'
    }
  },
  {
    pattern: /automatic.*renewal|renew.*automatically/i,
    issue: {
      risk_level: 'MEDIUM' as const,
      why_risky: 'Automatic renewals can trap you in long-term commitments. The CPA requires notice before such renewals for fixed-term contracts.',
      what_to_do: 'Ensure there is a clear notice period (usually 40-80 business days) before renewal.',
      act_reference: 'Consumer Protection Act (CPA) Section 14'
    }
  },
  {
    pattern: /interest.*above.*2[0-9]%/i,
    issue: {
      risk_level: 'HIGH' as const,
      why_risky: 'Extremely high interest rates may violate the National Credit Act or be considered usurious.',
      what_to_do: 'Verify if the interest rate complies with the maximum allowed under the NCA.',
      act_reference: 'National Credit Act (NCA)'
    }
  },
  {
    pattern: /24.*hour.*notice.*to.*vacate|immediate.*eviction/i,
    issue: {
      risk_level: 'HIGH' as const,
      why_risky: 'Illegal eviction is a criminal offense in SA. Proper legal process must be followed.',
      what_to_do: 'Ensure the contract references the Rental Housing Act and PIE Act for eviction procedures.',
      act_reference: 'Rental Housing Act (RHA) / PIE Act'
    }
  }
];

export function runHeuristics(text: string): HeuristicIssue[] {
  const issues: HeuristicIssue[] = [];
  const lines = text.split(/[.\n]/);

  for (const rule of RULES) {
    for (const line of lines) {
      if (rule.pattern.test(line)) {
        issues.push({
          clause: line.trim(),
          ...rule.issue
        });
        break;
      }
    }
  }

  return issues;
}