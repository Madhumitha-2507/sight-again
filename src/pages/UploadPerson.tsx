import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function UploadPerson() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    description: "",
    lastSeenLocation: "",
    contactInfo: "",
    heightCm: "",
    build: "",
    hairColor: "",
    clothingDescription: "",
    distinctiveFeatures: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      toast({
        title: "Error",
        description: "Please upload a photo of the missing person",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image to storage
      const fileExt = image.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("person-images")
        .upload(fileName, image);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("person-images")
        .getPublicUrl(fileName);

      // Insert missing person record
      const { error: insertError } = await supabase
        .from("missing_persons")
        .insert({
          name: formData.name,
          age: parseInt(formData.age),
          description: formData.description,
          last_seen_location: formData.lastSeenLocation,
          contact_info: formData.contactInfo,
          image_url: urlData.publicUrl,
          height_cm: formData.heightCm ? parseInt(formData.heightCm) : null,
          build: formData.build || null,
          hair_color: formData.hairColor || null,
          clothing_description: formData.clothingDescription || null,
          distinctive_features: formData.distinctiveFeatures || null,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Missing person report submitted successfully",
      });
      
      navigate("/missing-persons");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about the person..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Physical Appearance (for better matching)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="heightCm">Height (cm)</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    placeholder="e.g., 165"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="build">Build</Label>
                  <Select
                    value={formData.build}
                    onValueChange={(value) => setFormData({ ...formData, build: value })}
                  >
                    <SelectTrigger id="build">
                      <SelectValue placeholder="Select build" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slim">Slim</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="athletic">Athletic</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hairColor">Hair Color</Label>
                  <Select
                    value={formData.hairColor}
                    onValueChange={(value) => setFormData({ ...formData, hairColor: value })}
                  >
                    <SelectTrigger id="hairColor">
                      <SelectValue placeholder="Select hair color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="blonde">Blonde</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="bald">Bald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="clothingDescription">Last Known Clothing</Label>
                <Textarea
                  id="clothingDescription"
                  value={formData.clothingDescription}
                  onChange={(e) => setFormData({ ...formData, clothingDescription: e.target.value })}
                  placeholder="e.g., Red jacket, blue jeans, white sneakers..."
                  rows={2}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="distinctiveFeatures">Distinctive Features</Label>
                <Textarea
                  id="distinctiveFeatures"
                  value={formData.distinctiveFeatures}
                  onChange={(e) => setFormData({ ...formData, distinctiveFeatures: e.target.value })}
                  placeholder="e.g., Scar on left cheek, tattoo on arm, wears glasses..."
                  rows={2}
                />
              </div>
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
                onChange={handleImageChange}
              />
              <p className="text-sm text-muted-foreground">
                Upload a clear, recent photo of the missing person
              </p>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-[200px] rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/missing-persons")}
                disabled={isSubmitting}
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
