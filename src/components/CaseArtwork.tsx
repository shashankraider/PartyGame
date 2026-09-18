"use client";

import Image from "next/image";
import { useState } from "react";

/** Keep the case usable when its optional artwork is unavailable. */
export function CaseArtwork({ src, alt, priority = false, portrait = false }: {
  src: string;
  alt: string;
  priority?: boolean;
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`case-artwork${portrait ? " case-artwork--portrait" : ""}`}>
      {failed ? <div className="case-artwork-fallback" role="img" aria-label={alt}><span aria-hidden="true">{portrait ? "?" : "CASE FILE"}</span></div> : (
        <Image src={src} alt={alt} fill sizes={portrait ? "(max-width: 600px) 42vw, 180px" : "(max-width: 800px) 100vw, 800px"}
          className="object-cover" priority={priority} unoptimized onError={() => setFailed(true)} />
      )}
    </div>
  );
}
