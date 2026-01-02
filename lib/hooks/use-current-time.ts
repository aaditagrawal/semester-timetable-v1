"use client";

import { useState, useEffect, useCallback } from "react";

export function useCurrentTime() {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        // Update every second
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Get current day name
    const getCurrentDay = useCallback(() => {
        const dayIndex = currentTime.getDay();
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
        return dayNames[dayIndex];
    }, [currentTime]);

    // Check if it's a weekday (Mon-Sat)
    const isWeekday = useCallback(() => {
        const day = currentTime.getDay();
        return day >= 1 && day <= 6;
    }, [currentTime]);

    // Format time as HH:MM
    const getFormattedTime = useCallback(() => {
        return currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }, [currentTime]);

    // Format date
    const getFormattedDate = useCallback(() => {
        return currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, [currentTime]);

    return {
        currentTime,
        getCurrentDay,
        isWeekday,
        getFormattedTime,
        getFormattedDate,
    };
}
