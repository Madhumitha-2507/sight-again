import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMissingPersons } from "@/hooks/useMissingPersons";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function MissingPersons() {
  const navigate = useNavigate();
  const { missingPersons, loading } = useMissingPersons();

  const activeCases = missingPersons.filter((p) => p.status === "active");
  const resolvedCases = missingPersons.filter((p) => p.status === "resolved");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Missing Persons</h1>
            <p className="text-muted-foreground">
              View and manage all reported missing persons
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-square w-full rounded-lg mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
          <CardTitle>Active Cases ({activeCases.length})</CardTitle>
          <CardDescription>All currently active missing person cases with AI matching enabled</CardDescription>
        </CardHeader>
        <CardContent>
          {activeCases.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeCases.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No missing persons reported yet</p>
              <p className="text-sm">Click "Add Missing Person" to create your first case</p>
            </div>
          )}
        </CardContent>
      </Card>

      {resolvedCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resolved Cases ({resolvedCases.length})</CardTitle>
            <CardDescription>Successfully located missing persons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resolvedCases.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: any }) {
  return (
    <Card className="overflow-hidden group">
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={person.image_url}
          alt={person.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <Badge
          variant={person.status === "active" ? "destructive" : "secondary"}
          className="absolute top-2 right-2"
        >
          {person.status}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{person.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">Age: {person.age}</p>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {person.description}
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{person.last_seen_location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{person.contact_info}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>Added {formatDistanceToNow(new Date(person.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
