import { cn } from "@/lib/utils";

type LikelihoodIndicatorProps = {
  likelihood: string;
  className?: string;
};

const getLikelihoodColor = (likelihood: string) => {
  switch (likelihood) {
    case "Extremely Unlikely":
      return "bg-red-500";
    case "Very Unlikely":
      return "bg-red-400";
    case "Unlikely":
      return "bg-yellow-500";
    case "Neutral":
      return "bg-yellow-400";
    case "Likely":
      return "bg-green-500";
    default:
      return "bg-gray-400";
  }
};

export function LikelihoodIndicator({
  likelihood,
  className,
}: LikelihoodIndicatorProps) {
  const color = getLikelihoodColor(likelihood);
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-3 h-3 rounded-full", color)} />
      <span className="text-sm text-gray-600">{likelihood}</span>
    </div>
  );
}
