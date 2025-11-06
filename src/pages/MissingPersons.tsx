import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MissingPersons() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Missing Persons</h1>
          <p className="text-muted-foreground">
            View and manage all reported missing persons
          </p>
        </div>
        <Button onClick={() => navigate("/upload")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Missing Person
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Cases</CardTitle>
          <CardDescription>All currently active missing person cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No missing persons reported yet</p>
            <p className="text-sm">Click "Add Missing Person" to create your first case</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
