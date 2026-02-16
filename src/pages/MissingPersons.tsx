import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Phone, Calendar, Trash2 } from "lucide-react";
import { AgeProgressionDialog } from "@/components/AgeProgressionDialog";
import { useNavigate } from "react-router-dom";
import { useMissingPersons, MissingPerson } from "@/hooks/useMissingPersons";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MissingPersons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { missingPersons, loading, deleteMissingPerson } = useMissingPersons();

  const activeCases = missingPersons.filter((p) => p.status === "active");
  const resolvedCases = missingPersons.filter((p) => p.status === "resolved");

  const handleDelete = async (person: MissingPerson) => {
    const error = await deleteMissingPerson(person.id, person.image_url);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete person. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: `${person.name} has been removed from the database.`,
      });
    }
  };

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
                <PersonCard key={person.id} person={person} onDelete={handleDelete} />
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
                <PersonCard key={person.id} person={person} onDelete={handleDelete} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PersonCard({ person, onDelete }: { person: MissingPerson; onDelete: (person: MissingPerson) => void }) {
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the person's record and their image from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(person)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

        <div className="pt-3 mt-3 border-t">
          <AgeProgressionDialog person={person} />
        </div>
      </CardContent>
    </Card>
  );
}
