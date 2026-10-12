"use client";

import type { ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * "Enlarge" button that opens a figure (the site plan, the route map) in a dialog, like the GA drawings.
 * `children` is the large copy, rendered by the server component that uses this button. `wide` keeps a
 * minimum width inside the dialog and lets it scroll sideways (for the map on phones).
 */
export function FigureEnlarge({
  title,
  description,
  wide = false,
  label = "Enlarge",
  children,
}: {
  title: string;
  description: string;
  wide?: boolean;
  label?: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="enlarge-button figure-enlarge">
          <Maximize2 aria-hidden="true" size={15} />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="drawing-dialog">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className={"figure-dialog-body" + (wide ? " figure-dialog-body--wide" : "")}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
