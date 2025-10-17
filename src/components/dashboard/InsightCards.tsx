"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Insight {
  title: string;
  description: string;
  type: "nutrition" | "finance" | "compliance";
  score: number; // önem seviyesi 0–100
}

interface Props {
  insights: Insight[];
}

export function InsightCards({ insights }: Props) {
  const color = (type: string) => {
    switch (type) {
      case "nutrition":
        return "border-emerald-400 bg-emerald-50";
      case "finance":
        return "border-amber-400 bg-amber-50";
      case "compliance":
        return "border-sky-400 bg-sky-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "nutrition":
        return "🥗";
      case "finance":
        return "💰";
      case "compliance":
        return "✅";
      default:
        return "💡";
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 90) return "text-red-600 bg-red-100";
    if (score >= 70) return "text-orange-600 bg-orange-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Henüz insight verisi yok. Simülasyon çalıştırın.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight, idx) => (
        <Card key={idx} className={`border-l-4 ${color(insight.type)} transition-all hover:shadow-md`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="text-lg">{getIcon(insight.type)}</span>
              {insight.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {insight.description}
            </p>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.score)}`}>
                Önem: {insight.score}/100
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {insight.type === "nutrition" ? "Beslenme" : 
                 insight.type === "finance" ? "Finans" : "Uyumluluk"}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}