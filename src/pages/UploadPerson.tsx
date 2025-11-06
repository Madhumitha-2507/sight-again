import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function UploadPerson() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    description: "",
    lastSeenLocation: "",
    contactInfo: "",
  });
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      toast({
        title: "Error",
        description: "Please upload a photo of the missing person",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Missing person report submitted successfully",
    });
    
    navigate("/missing-persons");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Missing Person</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new missing person case
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Missing Person Information</CardTitle>
          <CardDescription>
            Provide as much detail as possible to help locate the missing person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter age"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Physical description, clothing, distinguishing features..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastSeen">Last Seen Location *</Label>
              <Input
                id="lastSeen"
                required
                value={formData.lastSeenLocation}
                onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                placeholder="Address or area where last seen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Information *</Label>
              <Input
                id="contact"
                required
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                placeholder="Phone number or email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Photo *</Label>
              <Input
                id="photo"
                type="file"
                required
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Upload a clear, recent photo of the missing person
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Submit Report
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/missing-persons")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
