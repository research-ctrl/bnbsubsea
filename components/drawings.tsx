"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GlbViewer } from "@/components/glb-viewer";
import { drawings } from "@/lib/site-content";

/** "The drawings": interactive 3D plus the two published GA views (side profile, main deck plan). */
export function Drawings() {
  const [tab, setTab] = useState("model");
  return (
    <section className="drawings section section--mist" id="drawings" aria-labelledby="drawings-title">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{drawings.eyebrow}</p>
            <h2 id="drawings-title">{drawings.title}</h2>
          </div>
          <p>{drawings.intro}</p>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="drawings-tabs">
          <TabsList className="view-list" aria-label="LOURDES views">
            <TabsTrigger value="model" className="view-tab">
              Interactive 3D
            </TabsTrigger>
            {drawings.views.map(v => (
              <TabsTrigger key={v.id} value={v.id} className="view-tab">
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="model" className="drawing-panel">
            <figure className="drawing-stage drawing-stage--model">
              <GlbViewer src={drawings.model.src} poster={drawings.model.poster} label="Interactive 3D model of LOURDES, the BNB SHOREBRIDGE 55 reference newbuild. Drag to turn the vessel." />
              <figcaption>{drawings.model.caption}</figcaption>
            </figure>
          </TabsContent>
          {drawings.views.map(v => (
            <TabsContent key={v.id} value={v.id} className="drawing-panel">
              <figure className="drawing-stage">
                <div className="drawing-image">
                  <img src={v.src} alt={v.alt} width={v.width} height={v.height} loading="lazy" decoding="async" />
                </div>
                <figcaption>
                  <span>{v.caption}</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="enlarge-button">
                        <Maximize2 aria-hidden="true" size={15} />
                        Enlarge
                      </button>
                    </DialogTrigger>
                    <DialogContent className="drawing-dialog">
                      <DialogTitle>LOURDES / {v.label}</DialogTitle>
                      <DialogDescription>{v.caption}</DialogDescription>
                      <div className="drawing-dialog-image">
                        <img src={v.full} alt={v.alt} width={v.fullWidth} height={v.fullHeight} decoding="async" />
                      </div>
                    </DialogContent>
                  </Dialog>
                </figcaption>
              </figure>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
