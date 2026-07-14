"use client";

import { useState } from "react";

import type { JourneyMoment } from "./journey-config";
import styles from "./public-living-journey.module.css";

type JourneyMessageProps = {
  moment: JourneyMoment;
  leaving: boolean;
  style: React.CSSProperties;
  onDismiss: (suppress: boolean) => void;
};

export function JourneyMessage({ moment, leaving, style, onDismiss }: JourneyMessageProps) {
  const [suppress, setSuppress] = useState(false);

  return (
    <aside
      role="note"
      aria-live="polite"
      className={`${styles.message} ${styles[moment.personality]} ${leaving ? styles.messageLeaving : ""}`}
      style={style}
      data-journey-moment={moment.id}
    >
      <span className={styles.messageReflection} aria-hidden />
      <div className={styles.messageCopy}>
        <strong>{moment.copy[0]}</strong>
        <span>{moment.copy[1]}</span>
      </div>
      <div className={styles.messageActions}>
        <label className={styles.suppressLabel}>
          <input
            type="checkbox"
            checked={suppress}
            onChange={(event) => setSuppress(event.target.checked)}
          />
          <span className={styles.customCheckbox} aria-hidden />
          ماتظهرش الرسالة دي تاني
        </label>
        <button type="button" className={styles.dismissButton} onClick={() => onDismiss(suppress)}>
          {moment.dismissLabel}
        </button>
      </div>
    </aside>
  );
}
