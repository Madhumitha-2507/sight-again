import { Users, Camera, AlertCircle, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Missing Person Identification & Surveillance System
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Missing Persons"
          value="0"
          icon={Users}
          description="Active cases"
        />
        <StatCard
          title="CCTV Frames Analyzed"
          value="0"
          icon={Camera}
          description="Last 24 hours"
        />
        <StatCard
          title="Potential Matches"
          value="0"
          icon={AlertCircle}
          description="Pending review"
        />
        <StatCard
          title="Resolved Cases"
          value="0"
          icon={CheckCircle}
          description="Successfully found"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system updates and matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </div>
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
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
