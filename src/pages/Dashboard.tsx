import { Users, Camera, AlertCircle, CheckCircle, Bell } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useMissingPersons } from "@/hooks/useMissingPersons";
import { useMatches } from "@/hooks/useMatches";
import { useAlerts } from "@/hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const { missingPersons } = useMissingPersons();
  const { matches } = useMatches();
  const { alerts, unreadCount } = useAlerts();

  const activeCases = missingPersons.filter((p) => p.status === "active").length;
  const pendingMatches = matches.filter((m) => m.status === "pending" || m.status === "high_priority").length;
  const resolvedCases = missingPersons.filter((p) => p.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Missing Person Identification & Surveillance System
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
            <Bell className="mr-2 h-4 w-4" />
            {unreadCount} New Alert{unreadCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Missing Persons"
          value={activeCases.toString()}
          icon={Users}
          description="Active cases"
        />
        <StatCard
          title="Images Uploaded"
          value={missingPersons.length.toString()}
          icon={Camera}
          description="Total records"
        />
        <StatCard
          title="Potential Matches"
          value={pendingMatches.toString()}
          icon={AlertCircle}
          description="Pending review"
        />
        <StatCard
          title="Resolved Cases"
          value={resolvedCases.toString()}
          icon={CheckCircle}
          description="Successfully found"
        />
      </div>

      {/* Missing Persons Gallery */}
      {missingPersons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing Persons</CardTitle>
            <CardDescription>All registered missing person cases with AI face recognition enabled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {missingPersons.slice(0, 10).map((person) => (
                <div key={person.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={person.image_url}
                      alt={person.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2">
                    <p className="font-medium text-sm truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground">Age: {person.age}</p>
                    <Badge 
                      variant={person.status === "active" ? "destructive" : "secondary"}
                      className="mt-1 text-xs"
                    >
                      {person.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {missingPersons.length > 10 && (
              <Button 
                variant="link" 
                className="mt-4"
                onClick={() => navigate("/missing-persons")}
              >
                View all {missingPersons.length} cases →
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest AI detection alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      !alert.is_read ? "bg-destructive/5 border-destructive/20" : ""
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 mt-0.5 ${
                        alert.alert_type === "high_priority_match"
                          ? "text-destructive"
                          : "text-warning"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {alert.missing_person?.name || "Unknown Person"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!alert.is_read && (
                      <Badge variant="destructive" className="text-xs">New</Badge>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/matches")}
                >
                  View All Alerts
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No alerts yet. Upload CCTV footage to start AI detection.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate("/upload")}
            >
              <Users className="mr-2 h-4 w-4" />
              Report Missing Person
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate("/cctv")}
            >
              <Camera className="mr-2 h-4 w-4" />
              Upload CCTV Footage
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate("/matches")}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              View Matches
              {pendingMatches > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingMatches}
                </Badge>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
