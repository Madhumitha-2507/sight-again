import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, Eye, Bell } from "lucide-react";
import { useMatches } from "@/hooks/useMatches";
import { useAlerts } from "@/hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Matches() {
  const { matches, updateMatchStatus } = useMatches();
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();
  const { toast } = useToast();

  const highPriorityMatches = matches.filter(
    (m) => m.status === "high_priority" || (m.confidence_score >= 80 && m.status !== "resolved")
  );
  const mediumPriorityMatches = matches.filter(
    (m) => m.confidence_score >= 60 && m.confidence_score < 80 && m.status !== "resolved"
  );

  const handleResolve = async (matchId: string) => {
    const error = await updateMatchStatus(matchId, "resolved");
    if (!error) {
      toast({
        title: "Match Resolved",
        description: "The match has been marked as resolved.",
      });
    }
  };

  const handleDismiss = async (matchId: string) => {
    const error = await updateMatchStatus(matchId, "dismissed");
    if (!error) {
      toast({
        title: "Match Dismissed",
        description: "The match has been dismissed.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches & Alerts</h1>
          <p className="text-muted-foreground">
            View potential matches from AI-powered CCTV footage analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Bell className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Badge 
            variant={matches.length > 0 ? "destructive" : "outline"} 
            className="text-lg px-4 py-2"
          >
            {matches.filter((m) => m.status !== "resolved" && m.status !== "dismissed").length} Active Alerts
          </Badge>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>Real-time notifications from AI detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    !alert.is_read ? "bg-destructive/5 border-destructive/20" : ""
                  }`}
                  onClick={() => markAsRead(alert.id)}
                >
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      alert.alert_type === "high_priority_match"
                        ? "text-destructive"
                        : "text-orange-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {alert.missing_person?.name || "Unknown Person"}
                      </p>
                      {!alert.is_read && (
                        <Badge variant="destructive" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              High Priority Matches
            </CardTitle>
            <CardDescription>Confidence level above 80%</CardDescription>
          </CardHeader>
          <CardContent>
            {highPriorityMatches.length > 0 ? (
              <div className="space-y-4">
                {highPriorityMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onResolve={() => handleResolve(match.id)}
                    onDismiss={() => handleDismiss(match.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No high priority matches</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <Clock className="h-5 w-5" />
              Medium Priority Matches
            </CardTitle>
            <CardDescription>Confidence level 60-80%</CardDescription>
          </CardHeader>
          <CardContent>
            {mediumPriorityMatches.length > 0 ? (
              <div className="space-y-4">
                {mediumPriorityMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onResolve={() => handleResolve(match.id)}
                    onDismiss={() => handleDismiss(match.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No medium priority matches</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Matches History</CardTitle>
          <CardDescription>Complete history of detected matches</CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  showStatus
                  onResolve={() => handleResolve(match.id)}
                  onDismiss={() => handleDismiss(match.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No matches found yet</p>
              <p className="text-sm">Upload CCTV footage and missing person reports to start AI matching</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchCard({
  match,
  showStatus = false,
  onResolve,
  onDismiss,
}: {
  match: any;
  showStatus?: boolean;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const getStatusBadge = () => {
    switch (match.status) {
      case "resolved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="secondary">Dismissed</Badge>;
      case "high_priority":
        return <Badge variant="destructive">High Priority</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const isActionable = match.status !== "resolved" && match.status !== "dismissed";

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border">
      {match.missing_person?.image_url && (
        <img
          src={match.missing_person.image_url}
          alt={match.missing_person.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{match.missing_person?.name || "Unknown"}</p>
          {showStatus && getStatusBadge()}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>Confidence: {match.confidence_score}%</span>
          <span>•</span>
          <span>{match.video_filename || "Unknown video"}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Detected {formatDistanceToNow(new Date(match.detected_at), { addSuffix: true })}
        </p>
        {match.missing_person && (
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Age: {match.missing_person.age}</p>
            <p>Last seen: {match.missing_person.last_seen_location}</p>
            <p>Contact: {match.missing_person.contact_info}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Badge
          variant={match.confidence_score >= 80 ? "destructive" : "secondary"}
        >
          {match.confidence_score}%
        </Badge>
        {isActionable && (
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="outline" onClick={onResolve}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolve
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              <Eye className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
