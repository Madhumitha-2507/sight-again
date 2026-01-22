import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  User, 
  Smile, 
  CircleDot,
  Scan,
  Shirt,
  Ruler,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FacialFeature {
  match: boolean;
  reference: string;
  detected: string;
  confidence?: number;
}

interface PhysicalAttribute {
  match: boolean;
  reference: string;
  detected: string;
}

interface AnalysisDetails {
  facial_features?: {
    face_shape?: FacialFeature;
    eyes?: FacialFeature;
    nose?: FacialFeature;
    mouth?: FacialFeature;
    jawline?: FacialFeature;
    distinctive_marks?: FacialFeature;
  };
  physical_attributes?: {
    build?: PhysicalAttribute;
    hair?: PhysicalAttribute;
    clothing?: PhysicalAttribute;
    height?: PhysicalAttribute;
  };
  match_quality?: "high" | "medium" | "low";
  visibility_notes?: string;
  face_index?: number;
  total_faces_in_frame?: number;
}

interface MatchAnalysisDetailsProps {
  faceSimilarity?: number;
  appearanceMatch?: number;
  reasoning?: string;
  analysisDetails?: AnalysisDetails;
}

const FeatureIcon = ({ feature }: { feature: string }) => {
  const icons: Record<string, React.ReactNode> = {
    face_shape: <User className="h-4 w-4" />,
    eyes: <Eye className="h-4 w-4" />,
    nose: <Scan className="h-4 w-4" />,
    mouth: <Smile className="h-4 w-4" />,
    jawline: <User className="h-4 w-4" />,
    distinctive_marks: <CircleDot className="h-4 w-4" />,
    build: <User className="h-4 w-4" />,
    hair: <Sparkles className="h-4 w-4" />,
    clothing: <Shirt className="h-4 w-4" />,
    height: <Ruler className="h-4 w-4" />,
  };
  return icons[feature] || <CircleDot className="h-4 w-4" />;
};

const MatchIndicator = ({ match }: { match: boolean }) => {
  return match ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-muted-foreground" />
  );
};

const formatFeatureName = (name: string) => {
  return name.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

export function MatchAnalysisDetails({
  faceSimilarity,
  appearanceMatch,
  reasoning,
  analysisDetails,
}: MatchAnalysisDetailsProps) {
  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case "high":
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">High Quality</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-accent/50 text-accent-foreground border-accent/20">Medium Quality</Badge>;
      case "low":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-muted-foreground/20">Low Quality</Badge>;
      default:
        return null;
    }
  };

  const facialFeatures = analysisDetails?.facial_features;
  const physicalAttributes = analysisDetails?.physical_attributes;

  const countMatches = (features?: Record<string, FacialFeature | PhysicalAttribute>) => {
    if (!features) return { matched: 0, total: 0 };
    const entries = Object.entries(features).filter(([, v]) => v && v.reference);
    return {
      matched: entries.filter(([, v]) => v.match).length,
      total: entries.length,
    };
  };

  const facialStats = countMatches(facialFeatures as Record<string, FacialFeature>);
  const physicalStats = countMatches(physicalAttributes as Record<string, PhysicalAttribute>);

  return (
    <div className="space-y-4 mt-4">
      {/* Summary Scores */}
      <div className="grid grid-cols-2 gap-4">
        {faceSimilarity !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Face Similarity
              </span>
              <span className="font-medium">{faceSimilarity}%</span>
            </div>
            <Progress value={faceSimilarity} className="h-2" />
          </div>
        )}
        {appearanceMatch !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                Appearance Match
              </span>
              <span className="font-medium">{appearanceMatch}%</span>
            </div>
            <Progress value={appearanceMatch} className="h-2" />
          </div>
        )}
      </div>

      {/* Match Quality & Context */}
      <div className="flex flex-wrap items-center gap-2">
        {getQualityBadge(analysisDetails?.match_quality)}
        {analysisDetails?.face_index && analysisDetails?.total_faces_in_frame && (
          <Badge variant="outline" className="gap-1">
            <Scan className="h-3 w-3" />
            Face {analysisDetails.face_index} of {analysisDetails.total_faces_in_frame}
          </Badge>
        )}
        {facialStats.total > 0 && (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            {facialStats.matched}/{facialStats.total} facial features
          </Badge>
        )}
        {physicalStats.total > 0 && (
          <Badge variant="outline" className="gap-1">
            <Shirt className="h-3 w-3" />
            {physicalStats.matched}/{physicalStats.total} physical attributes
          </Badge>
        )}
      </div>

      {/* AI Reasoning */}
      {reasoning && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">AI Analysis Summary</p>
              <p className="text-sm text-muted-foreground">{reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Feature Breakdown */}
      {(facialFeatures || physicalAttributes) && (
        <Accordion type="single" collapsible className="w-full">
          {facialFeatures && Object.keys(facialFeatures).length > 0 && (
            <AccordionItem value="facial">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Facial Feature Analysis
                  <Badge variant="secondary" className="ml-2">
                    {facialStats.matched}/{facialStats.total} matched
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {Object.entries(facialFeatures).map(([key, feature]) => {
                    if (!feature || !feature.reference) return null;
                    return (
                      <div key={key} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <FeatureIcon feature={key} />
                          <span className="text-sm font-medium">{formatFeatureName(key)}</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Reference:</span>
                            <span>{feature.reference}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Detected:</span>
                            <span>{feature.detected}</span>
                          </div>
                          {(feature as FacialFeature).confidence !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Confidence:</span>
                              <Progress value={(feature as FacialFeature).confidence} className="h-1 w-20" />
                              <span>{(feature as FacialFeature).confidence}%</span>
                            </div>
                          )}
                        </div>
                        <MatchIndicator match={feature.match} />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {physicalAttributes && Object.keys(physicalAttributes).length > 0 && (
            <AccordionItem value="physical">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  Physical Attribute Analysis
                  <Badge variant="secondary" className="ml-2">
                    {physicalStats.matched}/{physicalStats.total} matched
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {Object.entries(physicalAttributes).map(([key, attribute]) => {
                    if (!attribute || !attribute.reference) return null;
                    return (
                      <div key={key} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <FeatureIcon feature={key} />
                          <span className="text-sm font-medium">{formatFeatureName(key)}</span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Reference:</span>
                            <span>{attribute.reference}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Detected:</span>
                            <span>{attribute.detected}</span>
                          </div>
                        </div>
                        <MatchIndicator match={attribute.match} />
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {/* Visibility Notes */}
      {analysisDetails?.visibility_notes && (
        <div className="p-2 bg-muted/30 rounded-lg border border-dashed">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Image Quality Notes: </span>
            {analysisDetails.visibility_notes}
          </p>
        </div>
      )}
    </div>
  );
}