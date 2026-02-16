import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { MissingPerson } from "@/hooks/useMissingPersons";

interface AgeProgressionDialogProps {
  person: MissingPerson;
}

export function AgeProgressionDialog({ person }: AgeProgressionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [targetAge, setTargetAge] = useState(String(person.age + 5));
  const [isGenerating, setIsGenerating] = useState(false);
  const [agedImage, setAgedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const handleGenerate = async () => {
    const target = parseInt(targetAge);
    if (!target || target <= person.age) {
      toast({
        title: "Invalid age",
        description: "Target age must be greater than current age.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setAgedImage(null);
    setDescription("");

    try {
      const { data, error } = await supabase.functions.invoke("age-progression", {
        body: {
          imageUrl: person.image_url,
          currentAge: person.age,
          targetAge: target,
          name: person.name,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setAgedImage(data.agedImageUrl);
      setDescription(data.description || "");
      toast({ title: "Age progression complete", description: `Generated image for age ${target}` });
    } catch (err) {
      console.error("Age progression error:", err);
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Failed to generate aged image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setAgedImage(null); setDescription(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Age Progression
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Age Progression — {person.name}</DialogTitle>
          <DialogDescription>
            Generate an AI prediction of how {person.name} might look at a different age.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Age</Label>
              <Input value={person.age} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAge">Target Age</Label>
              <Input
                id="targetAge"
                type="number"
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                min={person.age + 1}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {[5, 10, 15, 20].map((offset) => (
              <Button
                key={offset}
                variant="secondary"
                size="sm"
                disabled={isGenerating}
                onClick={() => setTargetAge(String(person.age + offset))}
              >
                +{offset} years
              </Button>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? "Generating..." : "Generate Age Progression"}
          </Button>

          {(agedImage || isGenerating) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current (Age {person.age})</Label>
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Projected (Age {targetAge})</Label>
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                  {isGenerating ? (
                    <div className="text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">AI is generating...</p>
                    </div>
                  ) : agedImage ? (
                    <img src={agedImage} alt={`${person.name} aged to ${targetAge}`} className="w-full h-full object-cover" />
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
