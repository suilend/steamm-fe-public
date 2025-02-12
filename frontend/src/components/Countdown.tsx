import { useEffect, useState } from "react";

import { intervalToDuration } from "date-fns";

import { LAUNCH_TIMESTAMP_MS } from "@/lib/constants";

export default function Countdown() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const launchDuration = intervalToDuration({
    start: currentDate,
    end: new Date(LAUNCH_TIMESTAMP_MS),
  });

  return (
    <div className="flex flex-row gap-2">
      {/* Days */}
      <div className="flex flex-col items-center">
        <p className="text-[48px] font-medium">
          {`${launchDuration.days ?? 0}`.padStart(2, "0")}
        </p>
        <p className="text-p2 text-secondary-foreground">DD</p>
      </div>

      <p className="text-[48px] font-medium">:</p>

      {/* Hours */}
      <div className="flex flex-col items-center">
        <p className="text-[48px] font-medium">
          {`${launchDuration.hours ?? 0}`.padStart(2, "0")}
        </p>
        <p className="text-p2 text-secondary-foreground">HH</p>
      </div>

      <p className="text-[48px] font-medium">:</p>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <p className="text-[48px] font-medium">
          {`${launchDuration.minutes ?? 0}`.padStart(2, "0")}
        </p>
        <p className="text-p2 text-secondary-foreground">MM</p>
      </div>

      <p className="text-[48px] font-medium">:</p>

      {/* Seconds */}
      <div className="flex flex-col items-center">
        <p className="text-[48px] font-medium">
          {`${launchDuration.seconds ?? 0}`.padStart(2, "0")}
        </p>
        <p className="text-p2 text-secondary-foreground">SS</p>
      </div>
    </div>
  );
}
