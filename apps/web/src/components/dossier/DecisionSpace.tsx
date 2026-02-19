import OptionMatrix from "./OptionMatrix";

type OptionCard = {
  id: string;
  label: string;
  type?: string;
  narrative: string;
  touches: string[];
  dimensions: { key: string; label: string; value: number }[];
  chips: string[];
  statementCount: number;
  evidenceCount: number;
  evidenceDensity: number;
  budgetRange: string;
  riskProfile: string;
  clusterLabel?: string;
  majorityPct?: number;
};

type DecisionSpaceProps = {
  options: OptionCard[];
  ctaHref?: string;
};

export function DecisionSpace({ options, ctaHref }: DecisionSpaceProps) {
  return <OptionMatrix options={options} ctaHref={ctaHref} />;
}

export default DecisionSpace;
