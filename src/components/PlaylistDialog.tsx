import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
// Dialog with Title & Description form using shadcn components
// - No react-hook-form
// - Local state + simple validation
// - Accessible, minimal, ready to drop into a shadcn + Tailwind project

type Props = {
  onSubmit?: (payload: { title: string; description: string }) => void;
  triggerLabel?: string;
};

export default function PlaylistDialog({ onSubmit, triggerLabel = "Add Playlist" }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // validation state
  const [touched, setTouched] = useState({ title: false });
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    const next: { title?: string } = {};

    // Title: required, 3-100 chars
    if (!title || title.trim().length === 0) next.title = "Title is required.";
    else if (title.trim().length < 3) next.title = "Title must be at least 3 characters.";
    else if (title.trim().length > 100) next.title = "Title must be 100 characters or less.";

    setErrors(next);
  }, [title]);

  const isValid = Object.keys(errors).length === 0;

  function handleClose() {
    setOpen(false);
    // reset touched so next open starts fresh but keep values (optional)
    setTouched({ title: false });
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setTouched({ title: true });

    if (!isValid) return;

    const payload = { title: title.trim() };
    onSubmit?.(payload as any);
    const id = crypto.randomUUID();
    const { data, error } = await supabase.from('playlists').insert([{
      id: id,
      title: payload.title,
      //  createdBy: User Context here from auth context
      created_by: "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

    }]);
    console.log(data, error);

    // simple UX: close and reset fields
    setTitle("");
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus size={16} />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create item</DialogTitle>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Add a title and a short description.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Playlist Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, title: true }))}
              placeholder="e.g. My Favorite Movies"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
              className="mt-1"
              autoFocus
            />
            {touched.title && errors.title ? (
              <p id="title-error" className="text-sm text-red-600 mt-1">
                {errors.title}
              </p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="ghost" onClick={handleClose} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
