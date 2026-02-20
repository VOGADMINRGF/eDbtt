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
  evidenceScore: number;
  dimensionLine: string;
  clarifiedCount: number;
  questionTotal: number;
  budgetRange: string;
  riskProfile: string;
  clusterLabel?: string;
  majorityPct?: number;
  dimensionNote?: string;
};

type DecisionSpaceProps = {
  options: OptionCard[];
  ctaHref?: string;
  traceHref?: string;
  selectedOptionId?: string | null;
  onSelect?: (optionId: string) => void;
  optionRanking?: Map<string, number>;
};

export function DecisionSpace({
  options,
  ctaHref,
  traceHref,
  selectedOptionId,
  onSelect,
  optionRanking,
}: DecisionSpaceProps) {
  return (
    <OptionMatrix
      options={options}
      ctaHref={ctaHref}
      traceHref={traceHref}
      selectedOptionId={selectedOptionId}
      onSelect={onSelect}
      optionRanking={optionRanking}
    />
  );
}

export default DecisionSpace;
