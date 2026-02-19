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
  evidenceLevel: "none" | "linked" | "multi";
  budgetRange: string;
  riskProfile: string;
  clusterLabel?: string;
  majorityPct?: number;
};

type DecisionSpaceProps = {
  options: OptionCard[];
  ctaHref?: string;
  selectedOptionId?: string | null;
  onSelect?: (optionId: string) => void;
};

export function DecisionSpace({ options, ctaHref, selectedOptionId, onSelect }: DecisionSpaceProps) {
  return (
    <OptionMatrix
      options={options}
      ctaHref={ctaHref}
      selectedOptionId={selectedOptionId}
      onSelect={onSelect}
    />
  );
}

export default DecisionSpace;
